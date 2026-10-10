import api from './axios';

// Get list of all medical records (supports server-side filters: search, gender, dentistName, year, month)
export const getAllMedicalRecords = async (params = {}) => {
  const response = await api.get('/medical-records', { params });
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Get medical record by ID
export const getMedicalRecordById = async (id) => {
  const response = await api.get(`/medical-records/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Get medical record by management code
export const getMedicalRecordByCode = async (medicalRecordCode) => {
  const response = await api.get(`/medical-records/code/${encodeURIComponent(medicalRecordCode)}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Get medical records by patient ID
export const getMedicalRecordsByPatientId = async (patientId) => {
  const response = await api.get(`/medical-records/patient/${patientId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Get medical records by patient code
export const getMedicalRecordsByPatientCode = async (patientCode) => {
  const response = await api.get(`/medical-records/patient-code/${patientCode}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Create new medical record
export const createMedicalRecord = async (medicalRecordData) => {
  const response = await api.post('/medical-records', medicalRecordData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Update existing medical record
export const updateMedicalRecord = async (id, medicalRecordData) => {
  const response = await api.put(`/medical-records/${id}`, medicalRecordData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Delete medical record
export const deleteMedicalRecord = async (id) => {
  const response = await api.delete(`/medical-records/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
