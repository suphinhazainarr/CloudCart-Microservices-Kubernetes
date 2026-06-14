import { useState }                from 'react';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '../../features/orders/ordersApi';
import { useAppDispatch }          from '../../app/store';
import { addToast }                from '../../features/ui/uiSlice';
import { formatPrice, formatDate, getOrderStatusColor } from '../../lib/utils';
import { cn }                      from '../../lib/utils';
import type { OrderStatus }             from '../../types';

const STATUS_OPTIONS: OrderStatus[] = [
  'pending_payment','confirmed','processing','shipped','delivered','cancelled','payment_failed',
];

export default function AdminOrders() {
  const dispatch        = useAppDispatch();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useGetOrdersQuery({
    page,
    status: filter || undefined,
  });
  const [updateStatus] = useUpdateOrderStatusMutation();

  const orders = data?.data?.orders ?? [];
  const meta   = data?.meta;

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateStatus({ id: orderId, status }).unwrap();
      dispatch(addToast({ type: 'success', message: `Order status updated to ${status.replace(/_/g,' ')}` }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.data?.message ?? 'Status update failed' }));
    }
  };

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Orders</h1>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="input-base w-auto text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                {['Order','Date','Items','Total','Status','Update status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr key={order._id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', getOrderStatusColor(order.status))}>
                          {order.status.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)}
                          className="input-base text-xs py-1.5 w-auto"
                          disabled={['delivered','cancelled'].includes(order.status)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">{meta.total} total orders</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-secondary px-3 py-1.5 text-xs">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
