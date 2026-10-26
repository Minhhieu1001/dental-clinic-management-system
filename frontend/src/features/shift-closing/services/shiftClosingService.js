import api from '../../../services/axios';

/**
 * Service xử lý các API liên quan đến Kết ca (Shift Closing)
 */
export const shiftClosingService = {
  /**
   * Tính toán doanh thu realtime theo ca làm việc từ hệ thống thanh toán
   */
  async calculateShiftSettlement(params = {}) {
    const response = await api.get('/shift-closings/calculate', { params });
    return response.data;
  },

  /**
   * Chốt kết ca và lưu trữ vào database
   */
  async createShiftClosing(data) {
    const response = await api.post('/shift-closings', data);
    return response.data;
  },

  /**
   * Lấy danh sách lịch sử các phiên kết ca
   */
  async getShiftClosings(params = {}) {
    const response = await api.get('/shift-closings', { params });
    return response.data;
  },

  /**
   * Xem chi tiết 1 phiên kết ca theo ID
   */
  async getShiftClosingById(id) {
    const response = await api.get(`/shift-closings/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách nhân viên để chọn người nhận bàn giao ca
   */
  async getEmployeesForHandover() {
    try {
      const response = await api.get('/shift-closings/employees');
      return response.data?.data || response.data || [];
    } catch (err) {
      console.warn('Fallback getting employee list:', err);
      try {
        const fallback = await api.get('/employees/list');
        return fallback.data?.data || fallback.data || [];
      } catch (e) {
        return [];
      }
    }
  },
};

export default shiftClosingService;
