import { Outlet } from 'react-router-dom';
import { Navbar }  from './Navbar';
import { Footer }  from './Footer';
import { Toaster } from '../shared/Toaster';
import { useGetProfileQuery } from '../../features/auth/authApi';
import { useTheme } from '../../hooks/useTheme';

export const RootLayout = () => {
  // On mount, attempt to restore session by fetching profile
  // If token is still valid, user is automatically authenticated
  // If not, the 401 triggers refresh, then clearCredentials if refresh fails
  useGetProfileQuery();
  useTheme(); // apply theme class on mount

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};
