import api from './axios';

// Get all appointments with optional filters (dentistId, date, status)
export const getAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

// Get appointments for employee's branch by day (optional date: YYYY-MM-DD)
export const getAppointmentsByDay = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/appointments/day', { params });
  return response.data;
};

// Get appointments for employee's branch by week (optional date: YYYY-MM-DD)
export const getAppointmentsByWeek = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/appointments/week', { params });
  return response.data;
};

// Create new appointment
export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

// Get appointments for a specific patient
export const getAppointmentsByPatient = async (patientId) => {
  const response = await api.get(`/appointments/patient/${patientId}`);
  return response.data;
};

// Get appointments for a specific dentist
export const getDentistAppointments = async (dentistId) => {
  const response = await api.get(`/appointments/dentist/${dentistId}`);
  return response.data;
};

// Get appointments for logged in dentist user
export const getMyAppointments = async () => {
  const response = await api.get('/appointments/my-appointments');
  return response.data;
};

// Cập nhật thông tin và trạng thái lịch hẹn qua PUT /appointments/{id}
export const updateAppointment = async (id, data) => {
  const response = await api.put(`/appointments/${id}`, data);
  return response.data;
};

// Update clinical exam & medical notes for appointment
export const updateClinicalExam = async (id, data) => {
  const response = await api.put(`/appointments/${id}/exam`, data);
  return response.data;
};

// Get appointment by ID
export const getAppointmentById = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

