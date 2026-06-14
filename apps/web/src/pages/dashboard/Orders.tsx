import { useState }             from 'react';
import { Link }                 from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useGetOrdersQuery }    from '../../features/orders/ordersApi';
import { formatPrice, formatDate, getOrderStatusColor } from '../../lib/utils';
import { cn }                   from '../../lib/utils';

export default function DashboardOrders() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetOrdersQuery({ page });
  const orders = data?.data?.orders ?? [];
  const meta   = data?.meta;

  return (
    <div className="page-container py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">My orders</h1>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 h-20 bg-[var(--bg-secondary)]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">No orders yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">Start shopping to see your orders here</p>
          <Link to="/products" className="btn-primary">Shop now</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/dashboard/orders/${order._id}`}
              className="card-hover flex items-center gap-4 p-5 block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-semibold text-[var(--text-primary)]">{order.orderNumber}</p>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    getOrderStatusColor(order.status)
                  )}>
                    {order.status.replace(/_/g,' ')}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[var(--text-primary)]">{formatPrice(order.total)}</p>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] mt-1 ml-auto" />
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-secondary px-4">
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                {page} / {meta.totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages} className="btn-secondary px-4">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
