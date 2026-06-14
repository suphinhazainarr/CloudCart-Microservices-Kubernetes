import { useAppSelector, useAppDispatch } from '../app/store';
import { selectCurrentUser, selectIsAuth, selectIsAdmin, selectAuthLoading } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/authApi';
import { clearSessionId } from '../lib/session';

export const useAuth = () => {
  const dispatch       = useAppDispatch();
  const user           = useAppSelector(selectCurrentUser);
  const isAuthenticated= useAppSelector(selectIsAuth);
  const isAdmin        = useAppSelector(selectIsAdmin);
  const isLoading      = useAppSelector(selectAuthLoading);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      clearSessionId();
    }
  };

  return { user, isAuthenticated, isAdmin, isLoading, logout };
};
