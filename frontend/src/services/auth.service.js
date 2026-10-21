import api from './axios';

export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const patientLogin = async (data) => {
  const response = await api.post('/auth/patient/login', data);
  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.post('/auth/change-password', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', typeof email === 'string' ? { email } : email);
  return response.data;
};

export const resendPasswordResetCode = async (email) => {
  const response = await api.post('/auth/forgot-password', typeof email === 'string' ? { email } : email);
  return response.data;
};

export const verifyPasswordResetCode = async (email, otp) => {
  const response = await api.post('/auth/verify-reset-otp', { email, otp });
  return response.data;
};

export const verifyResetOtp = async (data) => {
  const response = await api.post('/auth/verify-reset-otp', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

