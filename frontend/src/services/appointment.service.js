import api from './axios';

// Get all appointments with optional filters (dentistId, date, status)
export const getAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

// Create new appointment for dentist
export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
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

// Update status of an appointment (e.g. IN_PROGRESS, COMPLETED, CANCELLED)
export const updateAppointmentStatus = async (id, status) => {
  const response = await api.patch(`/appointments/${id}/status`, null, {
    params: { status },
  });
  return response.data;
};

// Update clinical exam & medical notes for appointment
export const updateClinicalExam = async (id, data) => {
  const response = await api.put(`/appointments/${id}/exam`, data);
  return response.data;
};

