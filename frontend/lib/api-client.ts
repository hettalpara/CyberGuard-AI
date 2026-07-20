// ============================================================================
// Axios API Client
// Pre-configured Axios instance with interceptors for auth, error handling,
// and request/response transforms.
// ============================================================================

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG, AUTH_CONFIG } from "@/constants";
import type { ApiError } from "@/types";

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // ── Request interceptor: attach auth token ──────────────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ── Response interceptor: normalize errors ──────────────────────────
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem(AUTH_CONFIG.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
