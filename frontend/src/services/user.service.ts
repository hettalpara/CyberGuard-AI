// ============================================================================
// User Service
// Handles profile fetching, profile updates, and password change requests.
// ============================================================================

import { apiClient } from "@/lib/api-client";
import type { AuthResponse, User } from "@/types";

export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  user: User;
}

export const userService = {
  getProfile: () => apiClient.get<ProfileResponse>("/users/profile"),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put<AuthResponse>("/users/profile", data),

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.put<{ success: boolean; message: string }>("/users/change-password", data),
};
