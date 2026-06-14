import { apiSlice } from '../../app/apiSlice';
import type { ApiResponse, Order } from '../../types';

interface CreateOrderBody {
  shippingAddress: {
    fullName: string; street: string; city: string;
    state: string; postalCode: string; country: string; phone: string;
  };
  notes?: string;
}

interface ProcessPaymentBody {
  orderId: string;
  method:  string;
  cardDetails?: {
    number: string; expiry: string; cvv: string; name: string;
  };
}

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getOrders: builder.query<ApiResponse<{ orders: Order[] }>, { page?: number; status?: string }>({
      query:        (params) => ({ url: '/orders', params }),
      providesTags: ['Orders'],
    }),

    getOrderById: builder.query<ApiResponse<{ order: Order }>, string>({
      query:        (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),

    createOrder: builder.mutation<ApiResponse<{ order: Order }>, CreateOrderBody>({
      query:           (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Cart'],
    }),

    cancelOrder: builder.mutation<ApiResponse<{ order: Order }>, string>({
      query:           (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Orders'],
    }),

    processPayment: builder.mutation<ApiResponse<{ payment: unknown }>, ProcessPaymentBody>({
      query:           (body) => ({ url: '/payments/process', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Payments'],
    }),

    // Admin
    updateOrderStatus: builder.mutation<
      ApiResponse<{ order: Order }>,
      { id: string; status: string; note?: string; trackingNumber?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/status`, method: 'PATCH', body,
      }),
      invalidatesTags: ['Orders'],
    }),

    getOrderStats: builder.query<ApiResponse<{ stats: unknown }>, void>({
      query: () => '/orders/admin/stats',
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useProcessPaymentMutation,
  useUpdateOrderStatusMutation,
  useGetOrderStatsQuery,
} = ordersApi;
