import { apiSlice } from '../../app/apiSlice';
import type { ApiResponse, User } from '../../types';
import { setCredentials, clearCredentials } from './authSlice';
import { clearSessionId } from '../../lib/session';

interface LoginRequest    { email: string; password: string; }
interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; }
interface AuthResponse    { user: User; }

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth', 'Cart'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.user) {
            dispatch(setCredentials(data.data.user));
          }
        } catch {}
      },
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.user) dispatch(setCredentials(data.data.user));
        } catch {}
      },
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth', 'Cart', 'Orders'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
          clearSessionId();
        } catch {}
      },
    }),

    getProfile: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/profile',
      providesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.user) dispatch(setCredentials(data.data.user));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),

    updateProfile: builder.mutation<ApiResponse<{ user: User }>, Partial<User>>({
      query: (body) => ({ url: '/auth/profile', method: 'PATCH', body }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data?.user) dispatch(setCredentials(data.data.user));
        } catch {}
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;
