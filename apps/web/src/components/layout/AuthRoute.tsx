// Redirect already-logged-in users away from /login and /register
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading)        return null;
  if (isAuthenticated)  return <Navigate to="/" replace />;
  return <Outlet />;
};
