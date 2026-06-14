import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Menu, X, User, LayoutDashboard, LogOut, Package } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }    from '../../hooks/useAuth';
import { useCart }    from '../../hooks/useCart';
import { useTheme }   from '../../hooks/useTheme';
import { cn }         from '../../lib/utils';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount }          = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const [menuOpen, setMenuOpen]= useState(false);
  const [dropOpen, setDropOpen]= useState(false);

  const navLinks = [
    { to: '/',        label: 'Home',     end: true },
    { to: '/products',label: 'Products', end: false },
  ];

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">CloudCart</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[var(--brand-green)]/10 text-[var(--brand-green)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  )
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-brand text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-all"
                >
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName[0]}{user?.lastName[0]}
                  </div>
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{   opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 card shadow-xl py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-[var(--border)]">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                      </div>
                      {[
                        { to: '/dashboard/profile', icon: User,          label: 'Profile' },
                        { to: '/dashboard/orders',  icon: ShoppingCart,  label: 'My Orders' },
                        ...(isAdmin ? [{ to: '/admin/analytics', icon: LayoutDashboard, label: 'Admin Panel' }] : []),
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
                        >
                          <Icon className="w-4 h-4" /> {label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"    className="btn-secondary text-sm px-4 py-2">Sign in</Link>
                <Link to="/register" className="btn-primary  text-sm px-4 py-2">Get started</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            className="md:hidden border-t border-[var(--border)] overflow-hidden"
          >
            <div className="page-container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-3 rounded-xl text-sm font-medium',
                      isActive
                        ? 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]'
                        : 'text-[var(--text-secondary)]'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login"    onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 text-center text-sm">Sign in</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary  flex-1 text-center text-sm">Get started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
