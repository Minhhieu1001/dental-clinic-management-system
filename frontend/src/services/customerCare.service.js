import api from './axios';

export const customerCareService = {
  // 1. Lọc tổng hợp (Danh bạ CRM & lọc đa chiều)
  getFilterPatients: (params) => {
    return api.get('/customer-care/filter-patients', { params });
  },

  // 2. Chăm sóc tổng hợp (Lịch sử tất cả chăm sóc toàn phòng khám)
  getAllCareRecords: (params) => {
    return api.get('/customer-care/records', { params });
  },

  // 3. Nhắc lịch hẹn
  getAppointmentCareList: (params) => {
    return api.get('/customer-care/appointments', { params });
  },

  // 3b. Chăm sóc sau điều trị
  getPostTreatmentCareList: (params) => {
    return api.get('/customer-care/post-treatments', { params });
  },

  // 4. Ngày sinh nhật
  getBirthdayCareList: (params) => {
    return api.get('/customer-care/birthdays', { params });
  },

  // 5. Thanh toán / Công nợ (Chăm sóc thanh toán, cảm ơn thanh toán, nhắc nợ)
  getPaymentCareList: (params) => {
    return api.get('/customer-care/payments', { params });
  },

  // 6. Khuyến mãi / Sự kiện / Ngày lễ (30/4-1/5, 2/9, Tết, Sinh nhật nha khoa, 20/10...)
  getPromotionCareList: (params) => {
    return api.get('/customer-care/promotions', { params });
  },

  // Danh sách các chiến dịch khuyến mãi / sự kiện & chỉ số CRM
  getPromotionCampaigns: () => {
    return api.get('/customer-care/promotions/campaigns');
  },

  // Lịch sử chăm sóc của 1 khách hàng cụ thể
  getPatientCareHistory: (patientId) => {
    return api.get(`/customer-care/patient/${patientId}/history`);
  },

  // Tạo mới chăm sóc khách hàng (Lưu trực tiếp vào CSDL)
  createCareRecord: (data) => {
    return api.post('/customer-care/records', data);
  },

  // Gửi Gmail trực tiếp đến bệnh nhân & tự động lưu bản ghi chăm sóc
  sendDirectCareEmail: (data) => {
    return api.post('/customer-care/send-email', data);
  },

  // Thống kê CSKH
  getStats: () => {
    return api.get('/customer-care/stats');
  },

  // Danh sách options bộ lọc (Bác sĩ, nhân viên, thủ thuật, nhóm KH, nguồn KH, tỉnh/thành...)
  getFilterOptions: () => {
    return api.get('/customer-care/filter-options');
  },

  // Chi tiết chăm sóc khách hàng đầy đủ (Modal nút i)
  getPatientCareDetail: (patientId, appointmentId, invoiceId) => {
    return api.get(`/customer-care/patient/${patientId}/detail`, {
      params: {
        ...(appointmentId ? { appointmentId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      },
    });
  },

  // Cập nhật trạng thái lịch hẹn ngay từ bảng Lịch hẹn
  updateAppointmentStatus: (appointmentId, status) => {
    return api.patch(`/customer-care/appointments/${appointmentId}/status`, null, {
      params: { status },
    });
  },

  // Xóa lịch hẹn
  deleteAppointment: (appointmentId) => {
    return api.delete(`/customer-care/appointments/${appointmentId}`);
  },

  // Thêm lịch hẹn mới từ Modal
  createPatientAppointment: (patientId, data) => {
    return api.post(`/customer-care/patient/${patientId}/appointments`, data);
  },
};

export default customerCareService;
