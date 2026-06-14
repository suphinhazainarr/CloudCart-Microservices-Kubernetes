import { useParams, Link }      from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { motion }               from 'framer-motion';
import { useGetOrderByIdQuery } from '../features/orders/ordersApi';
import { formatPrice, formatDate, getOrderStatusColor } from '../lib/utils';
import { cn }                   from '../lib/utils';

export default function OrderConfirmation() {
  const { id }              = useParams<{ id: string }>();
  const { data, isLoading } = useGetOrderByIdQuery(id!);
  const order               = data?.data?.order;

  if (isLoading) return (
    <div className="page-container py-16 flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] mb-6" />
      <div className="h-8 bg-[var(--bg-secondary)] rounded w-64 mb-4" />
      <div className="h-4 bg-[var(--bg-secondary)] rounded w-48" />
    </div>
  );

  if (!order) return (
    <div className="page-container py-16 text-center">
      <p className="text-[var(--text-muted)]">Order not found</p>
    </div>
  );

  const isPaid = !['pending_payment', 'payment_failed'].includes(order.status);

  return (
    <div className="page-container py-12 max-w-2xl mx-auto">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-5',
          isPaid ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
        )}>
          <CheckCircle className={cn(
            'w-10 h-10',
            isPaid ? 'text-green-500' : 'text-red-500'
          )} />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          {isPaid ? 'Order confirmed!' : 'Payment failed'}
        </h1>
        <p className="text-[var(--text-muted)]">
          {isPaid
            ? `Your order ${order.orderNumber} has been placed successfully.`
            : 'Your payment could not be processed. Please try again.'}
        </p>
      </motion.div>

      {/* Order details */}
      <div className="card p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Order number</p>
            <p className="font-bold text-[var(--text-primary)]">{order.orderNumber}</p>
          </div>
          <span className={cn(
            'text-xs font-semibold px-3 py-1 rounded-full',
            getOrderStatusColor(order.status)
          )}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-[var(--text-secondary)]">Items ordered</h3>
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-3 text-sm">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] line-clamp-1">{item.name}</p>
                <p className="text-[var(--text-muted)]">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">
                {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-[var(--border)] pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Shipping</span>
            <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Tax</span><span>{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--text-primary)] text-base pt-2 border-t border-[var(--border)]">
            <span>Total paid</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">Shipping to</h3>
          <div className="text-sm text-[var(--text-primary)]">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-[var(--text-muted)]">
              {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} {order.shippingAddress.postalCode},{' '}
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Placed at */}
        <p className="text-xs text-[var(--text-muted)]">
          Placed on {formatDate(order.createdAt)}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 mt-6">
        <Link to="/dashboard/orders" className="btn-secondary flex-1 text-center flex items-center justify-center gap-2">
          <Package className="w-4 h-4" /> View all orders
        </Link>
        <Link to="/products" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          Continue shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
