import api from './axios';

// Lấy toàn bộ đơn thuốc (hỗ trợ params: { patientId, examinationResultId, patientCode })
export const getPrescriptions = async (params = {}) => {
  const response = await api.get('/prescriptions', { params });
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết đơn thuốc theo ID
export const getPrescriptionById = async (id) => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy danh sách đơn thuốc theo đợt khám (examinationResultId)
export const getPrescriptionsByExaminationResultId = async (examinationResultId) => {
  const response = await api.get(`/prescriptions/examination-result/${examinationResultId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy danh sách đơn thuốc theo ID bệnh nhân
export const getPrescriptionsByPatientId = async (patientId) => {
  const response = await api.get(`/prescriptions/patient/${patientId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy danh sách đơn thuốc theo mã bệnh nhân (patientCode)
export const getPrescriptionsByPatientCode = async (patientCode) => {
  const response = await api.get(`/prescriptions/patient-code/${patientCode}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Tạo mới một đơn thuốc
export const createPrescription = async (prescriptionData) => {
  const response = await api.post('/prescriptions', prescriptionData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật đơn thuốc
export const updatePrescription = async (id, prescriptionData) => {
  const response = await api.put(`/prescriptions/${id}`, prescriptionData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa đơn thuốc
export const deletePrescription = async (id) => {
  const response = await api.delete(`/prescriptions/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
