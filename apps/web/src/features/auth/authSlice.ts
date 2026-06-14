import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
}

const initialState: AuthState = {
  user:            null,
  isAuthenticated: false,
  isLoading:       true, // true on startup — we check for existing session
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<User>) {
      state.user            = action.payload;
      state.isAuthenticated = true;
      state.isLoading       = false;
    },
    clearCredentials(state) {
      state.user            = null;
      state.isAuthenticated = false;
      state.isLoading       = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthLoading } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors
export const selectCurrentUser  = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuth       = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading  = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectIsAdmin      = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'admin';
