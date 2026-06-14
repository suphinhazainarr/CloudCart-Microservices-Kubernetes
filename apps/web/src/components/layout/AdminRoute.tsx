import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSkeleton } from '../shared/PageSkeleton';

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading)         return <PageSkeleton />;
  if (!isAuthenticated)  return <Navigate to="/login" replace />;
  if (!isAdmin)          return <Navigate to="/" replace />;

  return <Outlet />;
};
