import api from './axios';


// - chuẩn  đoán
export const getPrimaryDiagnoses = async () => {
  const response = await api.get('/primary-diagnoses');
  return response.data;
};

export const createPrimaryDiagnosis = async (data) => {
  const response = await api.post('/admin/primary-diagnoses', data);
  return response.data;
};

export const updatePrimaryDiagnosis = async (id, data) => {
  const response = await api.put(`/admin/primary-diagnoses/${id}`, data);
  return response.data;
};

export const deletePrimaryDiagnosis = async (id) => {
  const response = await api.delete(`/admin/primary-diagnoses/${id}`);
  return response.data;
};
//- trang thai rang
export const getToothStatuses = async () => {
  const response = await api.get('/tooth-statuses');
  return response.data;
};

export const createToothStatus = async (data) => {
  const response = await api.post('/admin/tooth-statuses', data);
  return response.data;
};

export const updateToothStatus = async (id, data) => {
  const response = await api.put(`/admin/tooth-statuses/${id}`, data);
  return response.data;
};

export const deleteToothStatus = async (id) => {
  const response = await api.delete(`/admin/tooth-statuses/${id}`);
  return response.data;
};
