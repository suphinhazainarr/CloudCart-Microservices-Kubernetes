import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Track whether a refresh is already in progress
// to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject:  (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// Attach session ID for guest cart support
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const sessionId = localStorage.getItem('cc_session_id');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

// Response interceptor — handles 401s with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });

        // Refresh succeeded — flush queue and retry original request
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything and send to login
        processQueue(refreshError as AxiosError);

        // Clear Redux auth state
        window.dispatchEvent(new CustomEvent('auth:logout'));
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
