import { v4 as uuidv4 } from 'uuid';
import { Payment, IPayment } from '../models/Payment.model';
import { orderClient } from './order.client';
import { ProcessPaymentDto } from '../dto/payment.dto';
import { ValidationError, NotFoundError } from '@cloudcart/shared';
import { env } from '../config/env';

class PaymentService {

  async processPayment(
    dto: ProcessPaymentDto,
    userId: string,
    accessToken: string
  ): Promise<IPayment> {

    // Step 1: Verify order exists and is in correct state
    const order = await orderClient.getOrder(dto.orderId, accessToken);

    if (order.userId !== userId) {
      throw new ValidationError('Order does not belong to you');
    }

    if (order.status !== 'pending_payment') {
      throw new ValidationError(
        `Order is in '${order.status}' status and cannot be paid`
      );
    }

    // Step 2: Create a pending payment record first
    // This lets us track the attempt even if something fails mid-process
    const transactionId = `TXN-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 16)}`;

    const payment = await Payment.create({
      orderId:       dto.orderId,
      userId,
      transactionId,
      amount:        order.total,
      currency:      'USD',
      method:        dto.method,
      status:        'pending',
      gatewayResponse: {},
    });

    // Step 3: Simulate gateway processing
    // In production: call Stripe/Razorpay/PayPal SDK here
    const gatewayResult = await this.simulateGateway(order.total, dto.method);

    // Step 4: Update payment record with result
    payment.status          = gatewayResult.success ? 'success' : 'failed';
    payment.gatewayResponse = gatewayResult.raw;
    if (!gatewayResult.success) {
      payment.failureReason = gatewayResult.reason;
    }
    await payment.save();

    // Step 5: Notify order service of the result
    // Order status transitions to 'confirmed' or 'payment_failed'
    const orderStatus = gatewayResult.success ? 'confirmed' : 'payment_failed';

    try {
      await orderClient.updatePaymentResult(
        dto.orderId,
        payment._id.toString(),
        orderStatus,
        accessToken
      );
    } catch {
      // If order update fails, log it — ops team must reconcile manually
      // Never leave a paid order in pending_payment state
      console.error(
        `[payment] CRITICAL: Payment ${transactionId} succeeded but order ${dto.orderId} ` +
        `status update failed. Manual reconciliation required.`
      );
    }

    if (!gatewayResult.success) {
      throw new ValidationError(
        `Payment failed: ${gatewayResult.reason}. No charge was made.`
      );
    }

    return payment;
  }

  // ─── Simulated payment gateway ────────────────────────────────────────────
  // In production, replace this with Stripe.paymentIntents.create(...)

  private async simulateGateway(amount: number, method: string) {
    // Simulate network delay (200-800ms — realistic gateway response time)
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 600)
    );

    const successRate = env.PAYMENT_SUCCESS_RATE / 100;
    const success     = Math.random() < successRate;

    const failureReasons = [
      'Insufficient funds',
      'Card declined by issuer',
      'Transaction limit exceeded',
      'Card expired',
    ];

    return {
      success,
      reason: success
        ? undefined
        : failureReasons[Math.floor(Math.random() * failureReasons.length)],
      raw: {
        gateway:       'CloudCart Simulated Gateway v1',
        transactionId: `SIM-${Date.now()}`,
        amount,
        currency:      'USD',
        method,
        timestamp:     new Date().toISOString(),
        success,
        processingTime: `${Math.floor(200 + Math.random() * 600)}ms`,
      },
    };
  }

  async getPaymentStatus(paymentId: string, userId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment');

    if (payment.userId !== userId) {
      throw new ValidationError('Payment does not belong to you');
    }

    return payment;
  }

  async getPaymentByOrder(orderId: string, userId: string): Promise<IPayment | null> {
    return Payment.findOne({ orderId, userId });
  }

  async getUserPayments(userId: string): Promise<IPayment[]> {
    return Payment.find({ userId }).sort({ createdAt: -1 });
  }
}

export const paymentService = new PaymentService();
