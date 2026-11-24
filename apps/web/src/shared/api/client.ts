import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiSuccess, AuthResult } from '@minimart/contracts';
import { useAuthStore } from '../../features/auth/stores/auth.store';
const options = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 8000,
  withCredentials: true,
  headers: { 'X-CSRF-Protection': '1' },
};
export const sessionClient = axios.create(options);
export const client = axios.create(options);
let refreshFlight: Promise<void> | null = null;
export function refreshSession(): Promise<void> {
  if (!refreshFlight) {
    const revision = useAuthStore.getState().revision;
    refreshFlight = sessionClient
      .post<ApiSuccess<AuthResult>>('/api/v1/auth/refresh')
      .then(({ data }) => {
        if (useAuthStore.getState().revision === revision)
          useAuthStore
            .getState()
            .setSession(data.data.accessToken, data.data.user);
      })
      .catch((error: unknown) => {
        if (useAuthStore.getState().revision === revision)
          useAuthStore.getState().clear();
        throw error;
      })
      .finally(() => {
        refreshFlight = null;
      });
  }
  return refreshFlight;
}
interface RetriableRequest extends InternalAxiosRequestConfig {
  retried?: boolean;
}
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !error.config
    )
      return Promise.reject(error);
    const code: unknown = error.response.data?.error?.code;
    if (code !== 'INVALID_ACCESS_TOKEN' && code !== 'SESSION_REVOKED')
      return Promise.reject(error);
    const request = error.config as RetriableRequest;
    if (request.retried) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }
    request.retried = true;
    const current = useAuthStore.getState().accessToken;
    // Another response may already have refreshed while this request was in flight.
    if (!current || request.headers.Authorization === `Bearer ${current}`) {
      try {
        await refreshSession();
      } catch {
        return Promise.reject(error);
      }
    }
    if (!useAuthStore.getState().accessToken) return Promise.reject(error);
    return client(request);
  },
);
