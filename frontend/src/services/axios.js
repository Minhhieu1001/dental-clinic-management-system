import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with every request
});

// ==================== Request Interceptor ====================
api.interceptors.request.use(
  (config) => {
    // No need to manually attach tokens — they're in HttpOnly cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, attempt token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/patient/login') &&
      !originalRequest.url?.includes('/auth/patient/activate') &&
      !originalRequest.url?.includes('/auth/patient/register') &&
      !originalRequest.url?.includes('/auth/forgot-password') &&
      !originalRequest.url?.includes('/auth/reset-password') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token
        await api.post('/auth/refresh');
        processQueue(null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Refresh failed — redirect to login
        window.location.href = window.location.pathname.startsWith('/patient') ? '/patient/login' : '/staff/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
