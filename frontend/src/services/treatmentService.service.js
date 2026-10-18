import api from './axios';

// Thêm một dịch vụ điều trị vào một giai đoạn điều trị
export const createTreatmentService = async (phaseId, data) => {
  const response = await api.post(`/treatment-phases/${phaseId}/services`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật dịch vụ điều trị (số lượng, răng, giá...)
export const updateTreatmentService = async (id, data) => {
  const response = await api.patch(`/treatment-services/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa dịch vụ điều trị khỏi giai đoạn
export const deleteTreatmentService = async (id) => {
  const response = await api.delete(`/treatment-services/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
