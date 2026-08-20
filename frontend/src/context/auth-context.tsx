// ============================================================================
// Auth Context
// Provides user authentication state and actions to the component tree.
// ============================================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { WithChildren, User, RegisterPayload } from "@/types";
import { authService } from "@/services";
import { AUTH_CONFIG } from "@/constants";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: WithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authService.getMe();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authService.login({ email, password });
      if (data.token) {
        localStorage.setItem(AUTH_CONFIG.tokenKey, data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await authService.register(payload);
      return data;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_CONFIG.tokenKey) : null;
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
