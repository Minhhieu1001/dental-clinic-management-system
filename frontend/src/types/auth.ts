// ==================== API Response Types ====================

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

// ==================== Auth Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  employeeId: string | null;
}

// ==================== User Types ====================

export type UserRole = 'ADMIN' | 'DENTIST' | 'EMPLOYEE' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  employeeId: string | null;
}

// ==================== Role Routing Map ====================

export const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  DENTIST: '/dentist/dashboard',
  EMPLOYEE: '/employee/dashboard',
  PATIENT: '/patient/dashboard',
};
