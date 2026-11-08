import api from './axios';

export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const patientLogin = async (data) => {
  const response = await api.post('/auth/patient/login', data);
  return response.data;
};

export const registerPatient = async (data) => {
  const response = await api.post('/auth/patient/register', data);
  return response.data;
};

export const resendPatientRegistrationOtp = async (email) => {
  const response = await api.post('/auth/patient/register/resend', { email });
  return response.data;
};

export const verifyPatientRegistrationOtp = async (email, code) => {
  const response = await api.post('/auth/patient/register/verify', { email, code });
  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};
// gui thong tin xac nhan mo tai khoan
export const requestPatientActivation = async (data) => {
  const response = await api.post('/auth/patient/activate', data);
  return response.data;
};

// gui lai ma xac nhan de xac nhan mo tai khoan
export const resendPatientActivationOtp = async (activationId) => {
  const response = await api.post('/auth/patient/activate/resend', { activationId });
  return response.data;
};

// gui ma xac nhan de xac nhan mo tai khoan
export const verifyPatientActivationOtp = async (activationId, code) => {
  const response = await api.post('/auth/patient/activate/verify', { activationId, code });
  return response.data;
};

// gui mat khai xac nhan mo tai khoan
export const completePatientActivation = async (data) => {
  const response = await api.post('/auth/patient/activate/complete', data);
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
  const response = await api.put('/users/me/password', data);
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
