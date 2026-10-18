import api from './axios';
import { createUser } from './employee.service';

export const getDentistsList = async () => {
  const response = await api.get('/dentists/list');
  return response.data;
};

export const getDentistStats = async () => {
  const response = await api.get('/dentists/stats');
  return response.data;
};

export const getDentistById = async (id) => {
  const response = await api.get(`/dentists/${id}`);
  return response.data;
};

export const createDentist = async (data) => {
  const response = await api.post('/dentists', data);
  return response.data;
};

export const updateDentist = async (id, data) => {
  const response = await api.put(`/dentists/${id}`, data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const getDentistAddressById = async (id) => {
  const response = await api.get(`/dentists/${id}/branch`);
  return response.data;
};

export { createUser };
