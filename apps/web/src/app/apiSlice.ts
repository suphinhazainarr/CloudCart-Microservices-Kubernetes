import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '../lib/baseQuery';

// The root API slice — all feature APIs extend this
// One centralised cache, one set of middleware
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery:   apiBaseQuery,
  tagTypes:    ['Auth', 'Products', 'Categories', 'Cart', 'Orders', 'Payments', 'Users'],
  endpoints:   () => ({}),
});
