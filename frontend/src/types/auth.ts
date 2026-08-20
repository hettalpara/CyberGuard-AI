// ============================================================================
// Auth Types
// Domain types for authentication, users, sessions, and role-based access.
// ============================================================================

export type UserRole = "admin" | "analyst" | "investigator" | "viewer" | "user" | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
  department?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface MeResponse {
  success: boolean;
  user: User;
}
