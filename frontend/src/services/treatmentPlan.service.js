import api from './axios';

// Lấy danh sách kế hoạch điều trị của bệnh nhân
export const getTreatmentPlansByPatientId = async (patientId) => {
  const response = await api.get(`/treatment-plans/patient/${patientId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy kế hoạch điều trị theo đợt khám (examinationResultId)
export const getTreatmentPlanByExaminationResultId = async (examinationResultId) => {
  if (!examinationResultId) return null;
  const response = await api.get(`/treatment-plans/examination/${examinationResultId}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy chi tiết kế hoạch điều trị theo ID
export const getTreatmentPlanById = async (id) => {
  const response = await api.get(`/treatment-plans/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Tạo mới một kế hoạch điều trị (Treatment Plan + Phases + Services + Visits)
export const createTreatmentPlan = async (data) => {
  const response = await api.post('/treatment-plans', data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật kế hoạch điều trị
export const updateTreatmentPlan = async (id, data) => {
  const response = await api.put(`/treatment-plans/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa kế hoạch điều trị
export const deleteTreatmentPlan = async (id) => {
  const response = await api.delete(`/treatment-plans/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Tự động đặt lịch tái khám theo các giai đoạn phác đồ & gửi email lộ trình
export const autoScheduleFollowUpAppointments = async (id) => {
  const response = await api.post(`/treatment-plans/${id}/auto-schedule`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
