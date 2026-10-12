import api from './axios';

const unwrap = (response) => response.data?.data ?? response.data;

export const getClinics = async () => unwrap(await api.get('/clinics'));

export const getClinicById = async (clinicId) =>
  unwrap(await api.get(`/clinics/${clinicId}`));

export const createClinic = async (data) =>
  unwrap(await api.post('/admin/clinics', data));

export const updateClinic = async (clinicId, data) =>
  unwrap(await api.put(`/admin/clinics/${clinicId}`, data));

export const deleteClinic = async (clinicId) =>
  unwrap(await api.delete(`/admin/clinics/${clinicId}`));

export const getBranches = async () => unwrap(await api.get('/branches'));

export const getBranchesByClinic = async (clinicId) =>
  unwrap(await api.get(`/clinics/${clinicId}/branches`));

export const createBranch = async (data) =>
  unwrap(await api.post('/admin/branches', data));

export const updateBranch = async (branchId, data) =>
  unwrap(await api.put(`/admin/branches/${branchId}`, data));

export const deleteBranch = async (branchId) =>
  unwrap(await api.delete(`/admin/branches/${branchId}`));
