import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id:      string;
  type:    'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UiState {
  theme:           'light' | 'dark';
  toasts:          Toast[];
  isMobileMenuOpen:boolean;
}

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('cc_theme') as 'light' | 'dark' | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme:            getInitialTheme(),
    toasts:           [] as Toast[],
    isMobileMenuOpen: false,
  } as UiState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('cc_theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      localStorage.setItem('cc_theme', action.payload);
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.isMobileMenuOpen = false;
    },
  },
});

export const {
  toggleTheme, setTheme,
  addToast, removeToast,
  toggleMobileMenu, closeMobileMenu,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
