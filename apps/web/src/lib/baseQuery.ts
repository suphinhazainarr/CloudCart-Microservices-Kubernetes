import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query base — wraps our Axios client's base URL
// We use fetchBaseQuery here and let the Axios interceptor handle refresh
export const apiBaseQuery = fetchBaseQuery({
  baseUrl:     '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    const sessionId = localStorage.getItem('cc_session_id');
    if (sessionId) headers.set('x-session-id', sessionId);
    return headers;
  },
});
