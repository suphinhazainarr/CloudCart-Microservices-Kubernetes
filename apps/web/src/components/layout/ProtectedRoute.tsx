import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSkeleton } from '../shared/PageSkeleton';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSkeleton />;

  if (!isAuthenticated) {
    // Pass the intended location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
