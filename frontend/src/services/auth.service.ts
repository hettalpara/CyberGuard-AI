// ============================================================================
// Auth Service
// Handles all authentication API calls. Business logic stays in hooks.
// ============================================================================

import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  AuthSession,
  LoginCredentials,
  RegisterPayload,
  User,
} from "@/types";

export const authService = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/login", credentials),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/register", payload),

  logout: () => apiClient.post<ApiResponse<null>>("/auth/logout"),

  getMe: () => apiClient.get<ApiResponse<User>>("/auth/me"),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthSession>>("/auth/refresh", {
      refreshToken,
    }),
};
