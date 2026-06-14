import { Order, IOrder, OrderStatus } from '../models/Order.model';
import { cartClient, CartItem } from './cart.client';
import { productClient } from './product.client';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from '../dto/order.dto';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  successResponse,
} from '@cloudcart/shared';
import { env } from '../config/env';

export interface PaginatedOrders {
  orders: IOrder[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

// Valid status transitions — you can't skip states or go backwards
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['confirmed', 'payment_failed', 'cancelled'],
  confirmed:       ['processing', 'cancelled'],
  processing:      ['shipped', 'cancelled'],
  shipped:         ['delivered'],
  delivered:       [],            // terminal state
  cancelled:       [],            // terminal state
  payment_failed:  ['cancelled'], // can only cancel a failed payment order
};

class OrderService {

  // ─── Create order ─────────────────────────────────────────────────────────

  async createOrder(
    dto: CreateOrderDto,
    userId: string,
    accessToken: string
  ): Promise<IOrder> {

    // Step 1: Fetch and validate cart from cart service
    let cartItems: CartItem[];
    try {
      const cart = await cartClient.getCartForCheckout(accessToken);
      cartItems = cart.items;
    } catch (error: any) {
      throw new ValidationError(
        error.response?.data?.message ?? 'Unable to retrieve cart. Please try again.'
      );
    }

    if (cartItems.length === 0) {
      throw new ValidationError('Your cart is empty');
    }

    // Step 2: Build order items from cart — lock prices at current values
    const orderItems = cartItems.map((item) => ({
      productId:       item.productId,
      name:            item.name,
      slug:            item.slug,
      image:           item.image,
      priceAtPurchase: item.price,          // price locked forever
      quantity:        item.quantity,
      subtotal:        item.price * item.quantity,
    }));

    // Step 3: Calculate totals
    const subtotal     = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
    const shippingCost = subtotal >= 100 ? 0 : 9.99;  // free shipping over $100
    const taxRate      = 0.08;                          // 8% tax — configurable per region
    const tax          = Math.round(subtotal * taxRate * 100) / 100;
    const total        = Math.round((subtotal + shippingCost + tax) * 100) / 100;

    // Step 4: Generate unique order number
    const orderNumber = await (Order as any).generateOrderNumber();

    // Step 5: Decrement stock for all items
    // We do this BEFORE creating the order to catch stock issues early
    const decremented: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of orderItems) {
        await productClient.decrementStock(item.productId, item.quantity, accessToken);
        decremented.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      // Rollback all successful decrements before throwing
      for (const d of decremented) {
        await productClient.restoreStock(d.productId, d.quantity, accessToken);
      }
      throw error;
    }

    // Step 6: Create the order document in MongoDB
    let order: IOrder;
    try {
      order = await Order.create({
        orderNumber,
        userId,
        items:           orderItems,
        shippingAddress: dto.shippingAddress,
        status:          'pending_payment',
        statusHistory:   [{ status: 'pending_payment', timestamp: new Date() }],
        subtotal:        Math.round(subtotal * 100) / 100,
        shippingCost,
        tax,
        total,
        notes: dto.notes,
      });
    } catch (error) {
      // Order creation failed — restore ALL stock
      for (const item of orderItems) {
        await productClient.restoreStock(item.productId, item.quantity, accessToken);
      }
      throw error;
    }

    // Step 7: Clear the cart — order is confirmed, cart is no longer needed
    // Don't await — failure here doesn't affect the order
    cartClient.clearCart(accessToken).catch(() => {
      console.error(`[order] Failed to clear cart for user ${userId}`);
    });

    return order;
  }

  // ─── Get orders (customer sees their own, admin sees all) ─────────────────

  async getOrders(
    query: OrderQueryDto,
    userId: string,
    isAdmin: boolean
  ): Promise<PaginatedOrders> {
    const filter: Record<string, unknown> = {};

    // Customers can only see their own orders
    if (!isAdmin) filter.userId = userId;

    if (query.status) filter.status = query.status;

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders as unknown as IOrder[],
      meta: {
        total,
        page:       query.page,
        limit:      query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  // ─── Get single order ─────────────────────────────────────────────────────

  async getOrderById(orderId: string, userId: string, isAdmin: boolean): Promise<IOrder> {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new NotFoundError('Order');

    // Non-admins can only view their own orders
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    return order as unknown as IOrder;
  }

  // ─── Update order status (admin only) ────────────────────────────────────

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    // Validate the transition is allowed
    const allowedNext = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNext.includes(dto.status)) {
      throw new ValidationError(
        `Cannot transition order from '${order.status}' to '${dto.status}'. ` +
        `Allowed transitions: ${allowedNext.join(', ') || 'none (terminal state)'}`
      );
    }

    // Update status
    order.status = dto.status;

    // Append to audit trail
    order.statusHistory.push({
      status:    dto.status,
      timestamp: new Date(),
      note:      dto.note,
    });

    if (dto.trackingNumber) {
      order.trackingNumber = dto.trackingNumber;
    }

    await order.save();
    return order;
  }

  // ─── Update payment info (called by payment service) ──────────────────────

  async updatePaymentResult(
    orderId: string,
    paymentId: string,
    status: 'confirmed' | 'payment_failed'
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    order.paymentId = paymentId;
    order.status    = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note:      status === 'confirmed' ? 'Payment successful' : 'Payment failed',
    });

    await order.save();

    // In production, publish an event to a message queue (RabbitMQ / Kafka)
    // For now, HTTP call to notification service
    if (status === 'confirmed') {
      fetch(`${env.NOTIFICATION_SERVICE_URL}/api/notifications/order-confirmed`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, userId: order.userId }),
      }).catch(() => {}); // fire and forget — never block the order flow on notifications
    }

    return order;
  }

  // ─── Cancel order ─────────────────────────────────────────────────────────

  async cancelOrder(
    orderId: string,
    userId: string,
    isAdmin: boolean,
    accessToken: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    const allowedNext = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNext.includes('cancelled')) {
      throw new ValidationError(
        `Order cannot be cancelled in '${order.status}' status`
      );
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status:    'cancelled',
      timestamp: new Date(),
      note:      isAdmin ? 'Cancelled by admin' : 'Cancelled by customer',
    });

    await order.save();

    // Restore stock for all items
    for (const item of order.items) {
      await productClient.restoreStock(item.productId, item.quantity, accessToken);
    }

    return order;
  }

  // ─── Admin analytics ──────────────────────────────────────────────────────

  async getOrderStats() {
    const [statusBreakdown, revenueData, recentOrders] = await Promise.all([
      // Count orders by status
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Revenue for last 30 days
      Order.aggregate([
        {
          $match: {
            status:    { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id:          { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue:      { $sum: '$total' },
            orderCount:   { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // 5 most recent orders
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    return {
      statusBreakdown,
      revenueData,
      recentOrders,
      totalRevenue: totalRevenue[0]?.total ?? 0,
    };
  }
}

export const orderService = new OrderService();
