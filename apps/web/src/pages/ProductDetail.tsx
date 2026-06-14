import { useState }            from 'react';
import { useParams, Link }     from 'react-router-dom';
import { ShoppingCart, Star, Shield, Truck, ArrowLeft, Plus, Minus, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetProductBySlugQuery }  from '../features/products/productsApi';
import { useCart }                   from '../hooks/useCart';
import { formatPrice }               from '../lib/utils';
import { cn }                        from '../lib/utils';

export default function ProductDetail() {
  const { slug }              = useParams<{ slug: string }>();
  const { data, isLoading }   = useGetProductBySlugQuery(slug!);
  const { addToCart }         = useCart();
  const [qty, setQty]         = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding]   = useState(false);

  const product = data?.data?.product;

  if (isLoading) return (
    <div className="page-container py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-[var(--bg-secondary)] rounded-2xl" />
        <div className="space-y-4">
          {[80, 60, 40, 40, 100].map((w, i) => (
            <div key={i} className={`h-6 bg-[var(--bg-secondary)] rounded-xl`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="page-container py-20 text-center">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Product not found</h2>
      <Link to="/products" className="text-[var(--brand-purple)]">← Back to products</Link>
    </div>
  );

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product._id, qty);
    setAdding(false);
  };

  const images = product.images.length > 0 ? product.images : [''];

  return (
    <div className="page-container py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
        <Link to="/" className="hover:text-[var(--text-primary)]">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-[var(--text-primary)]">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category?.slug}`} className="hover:text-[var(--text-primary)]">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Image gallery */}
        <div className="space-y-3">
          <motion.div
            key={activeImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl overflow-hidden bg-[var(--bg-secondary)] relative"
          >
            {images[activeImg] ? (
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                <ShoppingCart className="w-20 h-20" />
              </div>
            )}
            {product.discountPercentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{product.discountPercentage}%
              </div>
            )}
          </motion.div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all',
                    activeImg === i
                      ? 'border-[var(--brand-purple)]'
                      : 'border-transparent hover:border-[var(--border)]'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col">

          {/* Category + badge */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              to={`/products?category=${product.category?.slug}`}
              className="text-sm text-[var(--brand-purple)] hover:underline"
            >
              {product.category?.name}
            </Link>
            {product.isFeatured && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full gradient-brand text-white">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(product.ratings.average)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[var(--border)]'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-[var(--text-primary)]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xl line-through text-[var(--text-muted)]">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            <div className={cn(
              'w-2 h-2 rounded-full',
              product.stock > 10 ? 'bg-green-500' :
              product.stock > 0  ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {product.stock > 10
                ? 'In stock'
                : product.stock > 0
                ? `Only ${product.stock} left`
                : 'Out of stock'}
            </span>
          </div>

          {/* Qty + Add to cart */}
          {product.inStock && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 card px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-1 hover:text-[var(--brand-purple)] transition-colors"
                  disabled={qty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold text-[var(--text-primary)]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="p-1 hover:text-[var(--brand-purple)] transition-colors"
                  disabled={qty >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={adding}
                whileTap={{ scale: 0.97 }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding…' : 'Add to cart'}
              </motion.button>

              <button className="p-3 btn-secondary">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { icon: Shield, label: 'Secure payment',   sub: 'SSL encrypted' },
              { icon: Truck,  label: 'Free shipping',    sub: 'Orders over $100' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <Icon className="w-5 h-5 text-[var(--brand-green)] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Attributes */}
          {product.tags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
