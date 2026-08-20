// ============================================================================
// Auth Service
// Handles all authentication API calls.
// ============================================================================

import { apiClient } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginCredentials,
  MeResponse,
  RegisterPayload,
} from "@/types";

export const authService = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>("/auth/login", credentials),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>("/auth/register", payload),

  logout: () => apiClient.post<{ success: boolean; message: string }>("/auth/logout"),

  getMe: () => apiClient.get<MeResponse>("/auth/me"),
};
