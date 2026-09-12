import api from './axios';

// Lấy toàn bộ danh sách kết quả khám
export const getAllExaminationResults = async () => {
  const response = await api.get('/examination-results');
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết kết quả khám theo ID
export const getExaminationResultById = async (id) => {
  const response = await api.get(`/examination-results/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy danh sách kết quả khám theo ID hồ sơ bệnh án (medicalRecordId)
export const getExaminationResultsByMedicalRecordId = async (medicalRecordId) => {
  const response = await api.get(`/examination-results/medical-record/${medicalRecordId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Tạo mới một kết quả khám lâm sàng (ExaminationResult)
export const createExaminationResult = async (data) => {
  const response = await api.post('/examination-results', data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật kết quả khám lâm sàng
export const updateExaminationResult = async (id, data) => {
  const response = await api.put(`/examination-results/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa kết quả khám lâm sàng
export const deleteExaminationResult = async (id) => {
  const response = await api.delete(`/examination-results/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
