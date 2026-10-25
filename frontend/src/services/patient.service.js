import api from './axios';

// Get list of all patients
export const getPatients = async () => {
  const response = await api.get('/patients');
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Get patient by ID
export const getPatientById = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Get patient by patientCode
export const getPatientByPatientCode = async (patientCode) => {
  const response = await api.get(`/patients/patientCode/${patientCode}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Search patients by phone number
export const getPatientsByPhone = async (phone) => {
  const response = await api.get(`/patients/phone/${phone}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Create new patient
export const createPatient = async (patientData) => {
  const response = await api.post('/patients', patientData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Update patient info
export const updatePatient = async (id, patientData) => {
  const response = await api.put(`/patients/${id}`, patientData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Delete patient
export const deletePatient = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
// Get raw invoice JOIN data by patientCode
export const getRawInvoiceDataByPatientCode = async (patientCode) => {
  const response = await api.get(`/patients/raw-invoice-data/${patientCode}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Search patient by UUID, patientCode, phone, CCCD
export const searchPatient = async (keyword) => {
  try {
    const response = await api.get('/patients/search', {
      params: { keyword },
    });
    return response.data?.data ?? response.data?.result ?? response.data ?? null;
  } catch (error) {
    console.warn('Lỗi tìm kiếm bệnh nhân:', error);
    return null;
  }
};

// Get patient statistics by ID
export const getPatientStatistics = async (id) => {
  const response = await api.get(`/patients/${id}/statistics`);
  return response.data?.data ?? response.data?.result ?? response.data;
};