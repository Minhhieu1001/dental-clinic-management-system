import api from './axios';

const unwrap = (response) => response.data?.data ?? response.data?.result ?? response.data;

/**
 * Gửi phim X-quang lên AI đọc phim.
 * @param {File} file ảnh JPEG/PNG/WEBP
 * @param {{ medicalRecordId?: string, examinationResultId?: string, imageType?: string, patientAge?: string|number, chiefComplaint?: string }} params
 */
export const analyzeXrayImage = async (file, params = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      formData.append(key, String(value));
    }
  });

  const response = await api.post('/ai/xray/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return unwrap(response);
};

// Lưu kết quả đối soát của bác sĩ (đồng ý / bác bỏ phát hiện AI + nhận định)
export const saveXrayDoctorReview = async (analysisId, review) => {
  const response = await api.put(`/ai/xray/${analysisId}/review`, review);
  return unwrap(response);
};

// Lịch sử phim X-quang đã phân tích theo đợt khám (ưu tiên) hoặc hồ sơ bệnh án
export const getXrayAnalysisHistory = async ({ medicalRecordId, examinationResultId } = {}) => {
  const response = await api.get('/ai/xray/history', {
    params: {
      ...(examinationResultId ? { examinationResultId } : {}),
      ...(medicalRecordId && !examinationResultId ? { medicalRecordId } : {}),
    },
  });
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
};
