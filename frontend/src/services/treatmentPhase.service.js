import api from './axios';

// Tạo mới một giai đoạn điều trị thuộc kế hoạch điều trị
export const createTreatmentPhase = async (planId, data) => {
  const response = await api.post(`/treatment-plans/${planId}/phases`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật thông tin giai đoạn điều trị
export const updateTreatmentPhase = async (id, data) => {
  const response = await api.patch(`/treatment-phases/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa giai đoạn điều trị
export const deleteTreatmentPhase = async (id) => {
  const response = await api.delete(`/treatment-phases/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật trạng thái giai đoạn điều trị
export const updateTreatmentPhaseStatus = async (id, status) => {
  const response = await api.patch(`/treatment-phases/${id}/status`, { status });
  return response.data?.data ?? response.data?.result ?? response.data;
};
