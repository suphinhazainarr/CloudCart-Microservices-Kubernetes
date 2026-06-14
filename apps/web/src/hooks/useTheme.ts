import { useAppDispatch, useAppSelector } from '../app/store';
import { toggleTheme } from '../features/ui/uiSlice';
import { useEffect } from 'react';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme    = useAppSelector((state) => state.ui.theme);

  // Apply theme class on mount and whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return { theme, toggleTheme: () => dispatch(toggleTheme()) };
};
