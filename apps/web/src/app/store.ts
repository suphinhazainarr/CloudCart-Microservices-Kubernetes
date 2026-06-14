import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { authReducer } from '../features/auth/authSlice';
import { uiReducer }   from '../features/ui/uiSlice';
import { apiSlice }    from './apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui:   uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks — always use these instead of the raw useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
