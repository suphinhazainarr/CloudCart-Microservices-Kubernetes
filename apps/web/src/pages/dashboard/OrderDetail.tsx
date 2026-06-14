import { useParams, Link }       from 'react-router-dom';
import { ArrowLeft, Package }    from 'lucide-react';
import { useGetOrderByIdQuery }  from '../../features/orders/ordersApi';
import { useCancelOrderMutation }from '../../features/orders/ordersApi';
import { useAppDispatch }        from '../../app/store';
import { addToast }              from '../../features/ui/uiSlice';
import { formatPrice, formatDate, formatRelativeTime, getOrderStatusColor } from '../../lib/utils';
import { cn }                    from '../../lib/utils';

const STATUS_STEPS = ['pending_payment','confirmed','processing','shipped','delivered'];

export default function DashboardOrderDetail() {
  const { id }               = useParams<{ id: string }>();
  const dispatch             = useAppDispatch();
  const { data, isLoading }  = useGetOrderByIdQuery(id!);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const order                = data?.data?.order;

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(id!).unwrap();
      dispatch(addToast({ type: 'info', message: 'Order cancelled' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.data?.message ?? 'Cannot cancel order' }));
    }
  };

  if (isLoading) return (
    <div className="page-container py-8 max-w-3xl animate-pulse space-y-4">
      <div className="h-8 bg-[var(--bg-secondary)] rounded w-1/3" />
      <div className="card p-6 h-40 bg-[var(--bg-secondary)]" />
    </div>
  );
  if (!order) return <div className="page-container py-8"><p className="text-[var(--text-muted)]">Order not found</p></div>;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel   = ['pending_payment','confirmed'].includes(order.status);

  return (
    <div className="page-container py-8 max-w-3xl">
      <Link to="/dashboard/orders" className="flex items-center gap-1 text-sm text-[var(--brand-purple)] mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{order.orderNumber}</h1>
          <p className="text-sm text-[var(--text-muted)]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', getOrderStatusColor(order.status))}>
          {order.status.replace(/_/g,' ')}
        </span>
      </div>

      {/* Status tracker */}
      {!['cancelled','payment_failed'].includes(order.status) && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-[var(--border)]" />
            <div
              className="absolute left-0 top-4 h-0.5 gradient-brand transition-all duration-500"
              style={{ width: currentStep <= 0 ? '0%' : `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-1 relative z-10">
                <div className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                  i <= currentStep
                    ? 'gradient-brand border-transparent text-white'
                    : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-muted)]'
                )}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className="text-xs text-[var(--text-muted)] capitalize hidden sm:block">
                  {step.replace(/_/g,' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-3 text-sm">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                <p className="text-[var(--text-muted)]">
                  {formatPrice(item.priceAtPurchase)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-[var(--text-secondary)]"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
          <div className="flex justify-between text-[var(--text-secondary)]"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
          <div className="flex justify-between font-bold text-[var(--text-primary)] text-base pt-2 border-t border-[var(--border)]">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Status history */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-3">Status history</h2>
        <div className="space-y-3">
          {[...order.statusHistory].reverse().map((h, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full gradient-brand mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-[var(--text-primary)] capitalize">{h.status.replace(/_/g,' ')}</p>
                <p className="text-[var(--text-muted)] text-xs">{formatRelativeTime(h.timestamp)}</p>
                {h.note && <p className="text-[var(--text-secondary)] text-xs mt-0.5">{h.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="btn-secondary text-red-500 border-red-200 hover:bg-red-50 w-full mt-2"
        >
          {cancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  );
}
