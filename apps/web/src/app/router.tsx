import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { RootLayout }      from '../components/layout/RootLayout';
import { ProtectedRoute }  from '../components/layout/ProtectedRoute';
import { AdminRoute }      from '../components/layout/AdminRoute';
import { AuthRoute }       from '../components/layout/AuthRoute';
import { PageSkeleton }    from '../components/shared/PageSkeleton';

// Lazy load all pages — reduces initial bundle size
const Home           = lazy(() => import('../pages/Home'));
const Products       = lazy(() => import('../pages/Products'));
const ProductDetail  = lazy(() => import('../pages/ProductDetail'));
const Cart           = lazy(() => import('../pages/Cart'));
const Checkout       = lazy(() => import('../pages/Checkout'));
const OrderConfirm   = lazy(() => import('../pages/OrderConfirmation'));
const Login          = lazy(() => import('../pages/Login'));
const Register       = lazy(() => import('../pages/Register'));
const DashProfile    = lazy(() => import('../pages/dashboard/Profile'));
const DashOrders     = lazy(() => import('../pages/dashboard/Orders'));
const DashOrderDetail= lazy(() => import('../pages/dashboard/OrderDetail'));
const AdminAnalytics = lazy(() => import('../pages/admin/Analytics'));
const AdminProducts  = lazy(() => import('../pages/admin/Products'));
const AdminOrders    = lazy(() => import('../pages/admin/Orders'));
const AdminUsers     = lazy(() => import('../pages/admin/Users'));
const NotFound       = lazy(() => import('../pages/NotFound'));

const Loader = () => <PageSkeleton />;

export const router = createBrowserRouter([
  {
    path:    '/',
    element: <RootLayout />,
    children: [
      { index: true,               element: <Suspense fallback={<Loader />}><Home /></Suspense> },
      { path: 'products',          element: <Suspense fallback={<Loader />}><Products /></Suspense> },
      { path: 'products/:slug',    element: <Suspense fallback={<Loader />}><ProductDetail /></Suspense> },
      { path: 'cart',              element: <Suspense fallback={<Loader />}><Cart /></Suspense> },

      // Auth-only routes (redirect to login if not authenticated)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout',           element: <Suspense fallback={<Loader />}><Checkout /></Suspense> },
          { path: 'order/:id',          element: <Suspense fallback={<Loader />}><OrderConfirm /></Suspense> },
          { path: 'dashboard/profile',  element: <Suspense fallback={<Loader />}><DashProfile /></Suspense> },
          { path: 'dashboard/orders',   element: <Suspense fallback={<Loader />}><DashOrders /></Suspense> },
          { path: 'dashboard/orders/:id', element: <Suspense fallback={<Loader />}><DashOrderDetail /></Suspense> },
        ],
      },

      // Redirect logged-in users away from auth pages
      {
        element: <AuthRoute />,
        children: [
          { path: 'login',    element: <Suspense fallback={<Loader />}><Login /></Suspense> },
          { path: 'register', element: <Suspense fallback={<Loader />}><Register /></Suspense> },
        ],
      },

      // Admin-only routes
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin/analytics', element: <Suspense fallback={<Loader />}><AdminAnalytics /></Suspense> },
          { path: 'admin/products',  element: <Suspense fallback={<Loader />}><AdminProducts /></Suspense> },
          { path: 'admin/orders',    element: <Suspense fallback={<Loader />}><AdminOrders /></Suspense> },
          { path: 'admin/users',     element: <Suspense fallback={<Loader />}><AdminUsers /></Suspense> },
        ],
      },

      { path: '*', element: <Suspense fallback={<Loader />}><NotFound /></Suspense> },
    ],
  },
]);
