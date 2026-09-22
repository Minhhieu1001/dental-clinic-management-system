import api from './axios';

// Lấy danh sách thuốc (truyền params: { keyword, status, unit, stockStatus, sortBy })
export const getMedicines = async (params = {}) => {
  const response = await api.get('/medicines', { params });
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết thông tin một loại thuốc (truyền: id)
export const getMedicineById = async (id) => {
  const response = await api.get(`/medicines/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy thông tin thuốc theo mã thuốc (truyền: code)
export const getMedicineByCode = async (code) => {
  const response = await api.get(`/medicines/code/${code}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Thêm mới một loại thuốc vào hệ thống (truyền: data object thuốc mới)
export const createMedicine = async (data) => {
  const response = await api.post('/medicines', data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Cập nhật thông tin loại thuốc (truyền: id, data cập nhật)
export const updateMedicine = async (id, data) => {
  const response = await api.put(`/medicines/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Đổi trạng thái kinh doanh của thuốc (truyền: id, status: 'ACTIVE' hoặc 'INACTIVE')
export const updateMedicineStatus = async (id, status) => {
  const response = await api.patch(`/medicines/${id}/status`, null, {
    params: { status },
  });
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa thuốc khỏi hệ thống (truyền: id)
export const deleteMedicine = async (id) => {
  const response = await api.delete(`/medicines/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy danh sách thuốc sắp hết hạn (truyền: days - mặc định 60 ngày)
export const getExpiringSoonMedicines = async (days = 60) => {
  const response = await api.get('/medicines/expiring-soon', {
    params: { days },
  });
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy danh sách các đơn vị tính độc nhất từ CSDL
export const getDistinctUnits = async () => {
  const response = await api.get('/medicines/units');
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy số liệu thống kê tổng quan kho thuốc từ CSDL
export const getMedicineSummary = async () => {
  const response = await api.get('/medicines/summary');
  return response.data?.data ?? response.data?.result ?? response.data;
};
