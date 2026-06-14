import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard }        from '../components/shared/ProductCard';
import { PageSkeleton }       from '../components/shared/PageSkeleton';
import { useGetProductsQuery, useGetCategoriesQuery } from '../features/products/productsApi';
import { useDebounce }        from '../hooks/useDebounce';
import { cn }                 from '../lib/utils';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'name',       label: 'Name A–Z' },
];

export default function Products() {
  const [params, setParams]     = useSearchParams();
  const [sidebarOpen, setSidebar] = useState(false);

  // Read all filters from URL
  const page     = parseInt(params.get('page')     ?? '1');
  const sort     = params.get('sort')     ?? 'newest';
  const category = params.get('category') ?? '';
  const search   = params.get('search')   ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const inStock  = params.get('inStock')  === 'true';

  // Local search input debounced before hitting API
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Sync debounced search to URL
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedSearch) { next.set('search', debouncedSearch); next.set('page', '1'); }
    else next.delete('search');
    setParams(next, { replace: true });
  }, [debouncedSearch]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page, sort, limit: 12,
    category:  category || undefined,
    search:    search   || undefined,
    minPrice:  minPrice ? Number(minPrice) : undefined,
    maxPrice:  maxPrice ? Number(maxPrice) : undefined,
    inStock:   inStock  || undefined,
  });

  const { data: catData } = useGetCategoriesQuery();

  const products   = data?.data?.products ?? [];
  const meta       = data?.meta;
  const categories = catData?.data?.categories ?? [];

  const activeFilterCount = [category, minPrice, maxPrice, inStock ? 'yes' : '']
    .filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => setParam('category', '')}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
              !category
                ? 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            )}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setParam('category', cat.slug)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between',
                category === cat.slug
                  ? 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              {cat.name}
              <span className="text-xs text-[var(--text-muted)]">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Price range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setParam('minPrice', e.target.value)}
            className="input-base text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setParam('maxPrice', e.target.value)}
            className="input-base text-sm"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setParam('inStock', e.target.checked ? 'true' : '')}
            className="w-4 h-4 accent-[var(--brand-purple)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">In stock only</span>
        </label>
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            setParams({ page: '1', sort });
            setSearchInput('');
          }}
          className="w-full btn-secondary text-sm text-red-500 border-red-200 hover:bg-red-50"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="page-container py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Products</h1>
          {meta && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {meta.total} {meta.total === 1 ? 'product' : 'products'} found
            </p>
          )}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-base pl-9 pr-4 w-48 sm:w-64 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="input-base text-sm w-auto pr-8"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Mobile filter button */}
          <button
            onClick={() => setSidebar(true)}
            className={cn(
              'lg:hidden btn-secondary flex items-center gap-2 text-sm relative',
              activeFilterCount > 0 && 'border-[var(--brand-purple)]'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full gradient-brand text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="card p-5 sticky top-24">
            <FilterSidebar />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setSidebar(false)}
              />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 h-full w-72 z-50 bg-[var(--bg-primary)] p-6 overflow-y-auto lg:hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-[var(--text-primary)]">Filters</h2>
                  <button onClick={() => setSidebar(false)}>
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
                <FilterSidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <PageSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">No products found</h3>
              <p className="text-sm text-[var(--text-muted)]">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <>
              <div className={cn(
                'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity',
                isFetching && 'opacity-60'
              )}>
                {products.map((product, i) => (
                  <ProductCard key={product._id} product={product} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setParam('page', String(page - 1))}
                    disabled={page <= 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-[var(--text-muted)]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setParam('page', String(p))}
                          className={cn(
                            'w-9 h-9 rounded-xl text-sm font-medium transition-all',
                            page === p
                              ? 'gradient-brand text-white shadow-md'
                              : 'btn-secondary'
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setParam('page', String(page + 1))}
                    disabled={page >= meta.totalPages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
