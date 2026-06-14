import { apiSlice } from '../../app/apiSlice';
import type { ApiResponse, Cart } from '../../types';

interface CartResponse { cart: Cart; }

export const cartApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getCart: builder.query<ApiResponse<CartResponse>, void>({
      query:       () => '/cart',
      providesTags: ['Cart'],
    }),

    addToCart: builder.mutation<ApiResponse<CartResponse>, { productId: string; quantity: number }>({
      query:           (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation<ApiResponse<CartResponse>, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url:    `/cart/items/${productId}`,
        method: 'PUT',
        body:   { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation<ApiResponse<CartResponse>, string>({
      query:           (productId) => ({ url: `/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation<ApiResponse, void>({
      query:           () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    mergeCart: builder.mutation<ApiResponse<CartResponse>, { sessionId: string }>({
      query:           (body) => ({ url: '/cart/merge', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
} = cartApi;
