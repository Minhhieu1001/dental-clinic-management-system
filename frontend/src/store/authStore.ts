import { create } from 'zustand';
import { login as loginService, logout as logoutService, getMe as getMeService } from '../services/auth.service';
import type { User, LoginRequest } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true to check auth on app init

  login: async (data: LoginRequest) => {
    const response = await loginService(data);
    const user = response.data;
    set({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        employeeId: user.employeeId ?? null,
        dentistId: user.dentistId ?? null,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await logoutService();
    } catch {
      // Even if API fails, clear local state
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await getMeService();
      const user = response.data;
      set({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
          employeeId: user.employeeId ?? null,
          dentistId: user.dentistId ?? null,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  reset: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
