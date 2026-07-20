// Profile feature types
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  department?: string;
  bio?: string;
  joinedAt: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  department?: string;
  bio?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
