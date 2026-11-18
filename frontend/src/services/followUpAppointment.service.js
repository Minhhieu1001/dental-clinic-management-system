import api from './axios';

const readData = (response) => response.data?.data ?? response.data?.result ?? response.data;
const readList = (response) => {
  const data = readData(response);
  if (!Array.isArray(data)) throw new Error('Dữ liệu lịch tái khám không hợp lệ.');
  return data;
};
const readAppointment = (response) => {
  const data = readData(response);
  if (!data?.id) throw new Error('Dữ liệu lịch tái khám không hợp lệ.');
  return data;
};

// Only server-confirmed data is returned. Request failures propagate to the caller.
export const getFollowUpAppointments = async (params = {}) =>
  readList(await api.get('/follow-up-appointments', { params }));

export const getFollowUpAppointmentById = async (id) =>
  readAppointment(await api.get('/follow-up-appointments/' + encodeURIComponent(id)));

export const createFollowUpAppointment = async (data) =>
  readAppointment(await api.post('/follow-up-appointments', data));

export const updateFollowUpAppointment = async (id, data) =>
  readAppointment(await api.put('/follow-up-appointments/' + encodeURIComponent(id), data));

export const deleteFollowUpAppointment = async (id) => {
  await api.delete('/follow-up-appointments/' + encodeURIComponent(id));
  return true;
};

export const getCurrentMonthFollowUpAppointmentsByPatientId = async (patientId) =>
  readList(await api.get('/follow-up-appointments/patient/' + encodeURIComponent(patientId) + '/current-month'));
