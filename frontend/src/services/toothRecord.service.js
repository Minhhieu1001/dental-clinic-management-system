import api from './axios';

// Lấy danh sách ghi nhận răng theo ID của kết quả khám (examinationResultId)
export const getToothRecordsByExaminationResultId = async (examinationResultId) => {
  const response = await api.get(`/tooth-records/examination-result/${examinationResultId}`);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết một ghi nhận răng theo ID
export const getToothRecordById = async (id) => {
  const response = await api.get(`/tooth-records/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Tạo mới ghi nhận răng (lưu 1 răng vào CSDL)
export const createToothRecord = async (data) => {
  const response = await api.post('/tooth-records', data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Lưu đồng loạt danh sách răng theo kết quả khám
export const batchSaveToothRecords = async (examinationResultId, list) => {
  const response = await api.post(`/tooth-records/batch/${examinationResultId}`, list);
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Cập nhật thông tin ghi nhận răng
export const updateToothRecord = async (id, data) => {
  const response = await api.put(`/tooth-records/${id}`, data);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Xóa ghi nhận răng khỏi CSDL
export const deleteToothRecord = async (id) => {
  const response = await api.delete(`/tooth-records/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
