import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { authEvents, authStore } from '../auth/authStore';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL,
  timeout: 15_000,
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.request.use((config) => {
  const token = authStore.get()?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const auth = authStore.get();

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      auth?.refresh_token
    ) {
      originalRequest._retry = true;
      try {
        const refreshed = await axios.post(`${baseURL}/auth/refresh`, {
          refresh_token: auth.refresh_token,
        });
        authStore.set(refreshed.data);
        originalRequest.headers.Authorization = `Bearer ${refreshed.data.access_token}`;
        return api(originalRequest);
      } catch {
        authStore.clear();
        window.dispatchEvent(new Event(authEvents.cleared));
        return Promise.reject(new Error('Your login expired. Please sign in again.'));
      }
    }

    return Promise.reject(error);
  },
);
