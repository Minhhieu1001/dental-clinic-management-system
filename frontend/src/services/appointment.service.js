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

// Get all examination rooms
export const getRooms = async () => {
  const response = await api.get('/appointments/rooms');
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

// Check dentist appointment slot by date and time
export const checkDentistAppointmentSlot = async (dentistId, appointmentDate, appointmentTime) => {
  const response = await api.get(`/appointments/dentist/${dentistId}/check`, {
    params: {
      appointdate_date: appointmentDate,
      appointtime: appointmentTime,
    },
  });
  return response.data;
};

const BOOKABLE_SLOT_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export const getDentistBookedTimesByDate = async (dentistId, date, excludeId) => {
  const slots = await Promise.all(
    BOOKABLE_SLOT_TIMES.map(async (time) => [
      time,
      await checkDentistAppointmentSlot(dentistId, date, time),
    ])
  );

  return slots
    .filter(([, appointments]) =>
      appointments.some(({ id }) => !excludeId || String(id) !== String(excludeId))
    )
    .map(([time]) => time);
};
