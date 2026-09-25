import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// withCredentials: true lets the browser send the httpOnly refreshToken cookie
// to the server on every request (required for /auth/refresh-token to work).
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach the current in-memory access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track whether a refresh call is already in flight so parallel 401s don't
// each trigger their own refresh request
let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (newToken) => {
  pendingRequests.forEach((callback) => callback(newToken));
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh for the refresh/login/register endpoints themselves
    const isAuthEndpoint =
      originalRequest.url.includes('/auth/refresh-token') ||
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register');

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        setAccessToken(data.accessToken);
        resolvePendingRequests(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        resolvePendingRequests(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
