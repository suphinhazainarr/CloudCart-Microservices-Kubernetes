import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface Props {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: Props) => {
  const { addToCart } = useCart();

  const isInStock = product.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="card-hover group flex flex-col h-full overflow-hidden">

        {/* Image */}
        <Link
          to={`/products/${product.slug}`}
          className="block relative overflow-hidden aspect-square bg-[var(--bg-secondary)]"
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.discountPercentage > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{product.discountPercentage}%
              </span>
            )}

            {product.isFeatured && (
              <span className="gradient-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}

            {!isInStock && (
              <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Out of stock
              </span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <Link to={`/products/${product.slug}`}>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {product.category?.name}
            </p>

            <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 mb-2 hover:text-[var(--brand-purple)] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-[var(--text-secondary)]">
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-auto mb-3">
            <span className="font-bold text-lg text-[var(--text-primary)]">
              {formatPrice(product.price)}
            </span>

            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-sm line-through text-[var(--text-muted)]">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>

          {/* Add To Cart */}
          <button
            onClick={() => addToCart(product._id)}
            disabled={!isInStock}
            className={cn(
              'btn-primary w-full flex items-center justify-center gap-2 text-sm',
              !isInStock && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {isInStock ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};