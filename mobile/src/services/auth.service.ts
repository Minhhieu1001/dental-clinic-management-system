import api from './api';
import { tokenStorage } from './storage';

export interface PatientLoginPayload {
  patientCode: string;
  phone: string;
  password: string;
}

export interface PatientRegisterPayload {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  branchId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface PatientActivationLookupPayload {
  patientCode: string;
  phone: string;
  email: string;
}

export interface PatientActivationCompletePayload {
  activationId: string;
  activationToken: string;
  password: string;
  confirmPassword: string;
}

export interface OtpCodeInfo {
  expiresAt: string;
  activationId?: string;
}

export interface ActivationVerifyInfo {
  fullName: string;
  activationToken: string;
  tokenExpiresAt: string;
}

export interface RegistrationResult {
  patientCode: string;
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

  registerPatient: async (payload: PatientRegisterPayload): Promise<OtpCodeInfo> => {
    const response = await api.post('/auth/patient/register', payload);
    return response.data?.data;
  },

  resendRegistrationOtp: async (email: string): Promise<OtpCodeInfo> => {
    const response = await api.post('/auth/patient/register/resend', { email });
    return response.data?.data;
  },

  verifyRegistrationOtp: async (email: string, code: string): Promise<RegistrationResult> => {
    const response = await api.post('/auth/patient/register/verify', { email, code });
    return response.data?.data;
  },

  requestActivation: async (payload: PatientActivationLookupPayload): Promise<{ activationId: string; expiresAt: string }> => {
    const response = await api.post('/auth/patient/activate', payload);
    return response.data?.data;
  },

  resendActivationOtp: async (activationId: string): Promise<{ activationId: string; expiresAt: string }> => {
    const response = await api.post('/auth/patient/activate/resend', { activationId });
    return response.data?.data;
  },

  verifyActivationOtp: async (activationId: string, code: string): Promise<ActivationVerifyInfo> => {
    const response = await api.post('/auth/patient/activate/verify', { activationId, code });
    return response.data?.data;
  },

  completeActivation: async (payload: PatientActivationCompletePayload): Promise<RegistrationResult> => {
    const response = await api.post('/auth/patient/activate/complete', payload);
    return response.data?.data;
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
