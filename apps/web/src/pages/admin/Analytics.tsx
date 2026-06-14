import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { useGetOrderStatsQuery } from '../../features/orders/ordersApi';
import { formatPrice, formatDate, getOrderStatusColor } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function AdminAnalytics() {
  const { data, isLoading } = useGetOrderStatsQuery();
  const stats = (data?.data as any)?.stats;

  const kpis = [
    {
      label: 'Total revenue',
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-green-500',
      bg:    'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total orders',
      value: stats?.statusBreakdown?.reduce((s: number, b: any) => s + b.count, 0) ?? 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg:    'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Confirmed orders',
      value: stats?.statusBreakdown?.find((b: any) => b._id === 'confirmed')?.count ?? 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg:    'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Pending payment',
      value: stats?.statusBreakdown?.find((b: any) => b._id === 'pending_payment')?.count ?? 0,
      icon: Users,
      color: 'text-yellow-500',
      bg:    'bg-yellow-50 dark:bg-yellow-900/20',
    },
  ];

  if (isLoading) return (
    <div className="page-container py-8 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="card p-5 h-24" />)}
      </div>
      <div className="card p-5 h-64" />
    </div>
  );

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-6 h-6', color)} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {stats?.revenueData?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Revenue — last 30 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}
                formatter={(v: number) => [formatPrice(v), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#7F5AF0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.statusBreakdown?.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Orders by status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}
                />
                <Bar dataKey="count" fill="#7F5AF0" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent orders */}
        <div className="card p-6">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Recent orders</h2>
          <div className="space-y-3">
            {(stats?.recentOrders ?? []).map((order: any) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{order.orderNumber}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--text-primary)]">{formatPrice(order.total)}</p>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getOrderStatusColor(order.status))}>
                    {order.status.replace(/_/g,' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
