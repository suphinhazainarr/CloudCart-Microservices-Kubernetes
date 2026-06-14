import { useState }          from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useGetProductsQuery, useDeleteProductMutation } from '../../features/products/productsApi';
import { useAppDispatch }    from '../../app/store';
import { addToast }          from '../../features/ui/uiSlice';
import { formatPrice }       from '../../lib/utils';
import { cn }                from '../../lib/utils';
import type { Product }           from '../../types';

export default function AdminProducts() {
  const dispatch        = useAppDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useGetProductsQuery({ page, limit: 15, search: search || undefined });
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const products = data?.data?.products ?? [];
  const meta     = data?.meta;

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      await deleteProduct(product._id).unwrap();
      dispatch(addToast({ type: 'success', message: 'Product deleted' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete product' }));
    }
  };

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                {['Product','Category','Price','Stock','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((product) => (
                    <tr key={product._id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                            {product.images[0] && (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)] line-clamp-1">{product.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {product.category?.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-1 rounded-full',
                          product.stock > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          product.stock > 0  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                               'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        )}>
                          {product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-1 rounded-full',
                          product.isActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                        )}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/10 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deleting}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              Showing {products.length} of {meta.total} products
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-secondary px-3 py-1.5 text-xs">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages} className="btn-secondary px-3 py-1.5 text-xs">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
