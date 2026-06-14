import { Link }             from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart }          from '../hooks/useCart';
import { useAuth }          from '../hooks/useAuth';
import { formatPrice }      from '../lib/utils';

export default function Cart() {
  const { cart, isLoading, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (isLoading) return (
    <div className="page-container py-12 animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-[var(--bg-secondary)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
            <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!cart || cart.items.length === 0) return (
    <div className="page-container py-24 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mb-6 opacity-80">
        <ShoppingBag className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h2>
      <p className="text-[var(--text-muted)] mb-8">Discover products you'll love</p>
      <Link to="/products" className="btn-primary flex items-center gap-2">
        Start shopping <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  const shippingCost = cart.total >= 100 ? 0 : 9.99;
  const tax          = Math.round(cart.total * 0.08 * 100) / 100;
  const orderTotal   = Math.round((cart.total + shippingCost + tax) * 100) / 100;

  return (
    <div className="page-container py-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
        Shopping cart
        <span className="ml-3 text-lg font-normal text-[var(--text-muted)]">
          ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="card p-4 flex gap-4"
              >
                {/* Image */}
                <Link to={`/products/${item.slug}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-[var(--text-muted)]" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.slug}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-purple)] line-clamp-1 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                    {formatPrice(item.price)}
                  </p>
                  {item.stock < 5 && (
                    <p className="text-xs text-yellow-600 mt-1">Only {item.stock} left</p>
                  )}
                </div>

                {/* Qty controls + remove */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center card px-2 py-1 gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) removeFromCart(item.productId);
                          else updateQuantity(item.productId, item.quantity - 1);
                        }}
                        className="p-0.5 hover:text-[var(--brand-purple)] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-0.5 hover:text-[var(--brand-purple)] transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)] w-20 text-right">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg text-[var(--text-primary)]">Order summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <span className="text-green-500">Free</span> : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Tax (8%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-[var(--brand-green)]">
                  Add {formatPrice(100 - cart.total)} more for free shipping
                </p>
              )}
              <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold text-[var(--text-primary)]">
                <span>Total</span>
                <span>{formatPrice(orderTotal)}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                Proceed to checkout <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/checkout' } }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Sign in to checkout
                </Link>
                <Link to="/checkout" className="btn-secondary w-full text-center text-sm block">
                  Continue as guest
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
