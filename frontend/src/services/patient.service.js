import api from './axios';

export const getPatients = async () => {
  const response = await api.get('/patients');
  return response.data;
};
