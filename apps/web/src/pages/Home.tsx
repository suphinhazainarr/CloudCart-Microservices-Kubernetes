import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard }           from '../components/shared/ProductCard';
import { PageSkeleton }          from '../components/shared/PageSkeleton';
import { useGetFeaturedProductsQuery } from '../features/products/productsApi';
import { useGetCategoriesQuery }        from '../features/products/productsApi';
import { formatPrice }           from '../lib/utils';

export default function Home() {
  const { data: featuredData, isLoading } = useGetFeaturedProductsQuery();
  const { data: categoryData }            = useGetCategoriesQuery();

  const featured   = featuredData?.data?.products ?? [];
  const categories = categoryData?.data?.categories ?? [];

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-brand opacity-5 pointer-events-none" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-[var(--brand-purple)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[var(--brand-green)]/10  rounded-full blur-3xl pointer-events-none" />

        <div className="page-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--brand-purple)]/30 text-[var(--brand-purple)] text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> New arrivals every week
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] leading-[1.1] mb-6">
              Shop the
              <span className="gradient-text"> future</span>,
              <br />delivered today.
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              Discover thousands of premium products with lightning-fast delivery,
              secure payments, and a shopping experience built for the modern era.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
                Shop now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products?featured=true" className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
                View featured
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-12">
              {[
                { icon: Shield,      label: 'Secure checkout' },
                { icon: Zap,         label: 'Fast delivery' },
                { icon: ShoppingBag, label: '30-day returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Icon className="w-4 h-4 text-[var(--brand-green)]" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-[var(--bg-secondary)]">
          <div className="page-container">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
              Shop by category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat, i) => (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="card-hover flex flex-col items-center gap-3 p-4 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[var(--text-primary)]">{cat.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{cat.productCount} items</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ──────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Featured products
            </h2>
            <Link
              to="/products?featured=true"
              className="flex items-center gap-1 text-sm text-[var(--brand-purple)] hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <PageSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
