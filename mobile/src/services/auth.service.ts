import api from './api';
import { tokenStorage } from './storage';

export interface PatientLoginPayload {
  patientCode: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
  patientId?: string | null;
  phone?: string | null;
  accessToken?: string;
  refreshToken?: string;
}

export const authService = {
  patientLogin: async (payload: PatientLoginPayload): Promise<AuthUser> => {
    const response = await api.post('/auth/patient/login', payload);
    const data: AuthUser = response.data?.data;
    if (data?.accessToken) {
      await tokenStorage.setAccessToken(data.accessToken);
    }
    if (data?.refreshToken) {
      await tokenStorage.setRefreshToken(data.refreshToken);
    }
    if (data) {
      await tokenStorage.setUser(data);
    }
    return data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get('/auth/me');
    return response.data?.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      await tokenStorage.clearAll();
    }
  },
};
