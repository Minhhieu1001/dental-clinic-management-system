import api from './axios';

// Tạo mới một buổi khám/điều trị thuộc một giai đoạn
export const createTreatmentVisit = async (phaseId, data) => {
  const response = await api.post(`/treatment-phases/${phaseId}/visits`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật thông tin buổi khám/điều trị
export const updateTreatmentVisit = async (id, data) => {
  const response = await api.patch(`/treatment-visits/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa buổi khám/điều trị
export const deleteTreatmentVisit = async (id) => {
  const response = await api.delete(`/treatment-visits/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật trạng thái buổi khám/điều trị
export const updateTreatmentVisitStatus = async (id, status) => {
  const response = await api.patch(`/treatment-visits/${id}/status`, { status });
  return response.data?.data ?? response.data?.result ?? response.data;
};
