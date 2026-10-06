import api from './axios';

const LOCAL_STORAGE_KEY = 'dental_clinic_prescriptions_backup';

// Lấy danh sách từ LocalStorage dự phòng
const getLocalBackup = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Cannot read prescriptions from localStorage', err);
    return [];
  }
};

// Lưu danh sách vào LocalStorage dự phòng
const saveLocalBackup = (list) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Cannot write prescriptions to localStorage', err);
  }
};

// Lấy toàn bộ đơn thuốc (hỗ trợ params: { patientId, examinationResultId, patientCode })
export const getPrescriptions = async (params = {}) => {
  try {
    const response = await api.get('/prescriptions', { params });
    const data = response.data?.data ?? response.data?.result ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend prescriptions API not reachable, falling back to local cache', err.message);
  }

  // Fallback lọc từ local backup
  const all = getLocalBackup();
  return all.filter((p) => {
    if (params.examinationResultId && String(p.examinationResultId) !== String(params.examinationResultId)) {
      return false;
    }
    if (params.patientId && String(p.patientId) !== String(params.patientId)) {
      return false;
    }
    if (params.patientCode && p.patientCode?.toLowerCase() !== params.patientCode?.toLowerCase()) {
      return false;
    }
    return true;
  });
};

// Lấy chi tiết đơn thuốc theo ID
export const getPrescriptionById = async (id) => {
  try {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (err) {
    const all = getLocalBackup();
    const found = all.find((p) => String(p.id) === String(id));
    if (found) return found;
    throw err;
  }
};

// Lấy danh sách đơn thuốc theo đợt khám (examinationResultId)
export const getPrescriptionsByExaminationResultId = async (examinationResultId) => {
  try {
    const response = await api.get(`/prescriptions/examination-result/${examinationResultId}`);
    const data = response.data?.data ?? response.data?.result ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Fallback to local backup for examinationResultId', examinationResultId);
  }

  const all = getLocalBackup();
  return all.filter((p) => String(p.examinationResultId) === String(examinationResultId));
};

// Lấy danh sách đơn thuốc theo ID bệnh nhân
export const getPrescriptionsByPatientId = async (patientId) => {
  try {
    const response = await api.get(`/prescriptions/patient/${patientId}`);
    const data = response.data?.data ?? response.data?.result ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Fallback to local backup for patientId', patientId);
  }

  const all = getLocalBackup();
  return all.filter((p) => String(p.patientId) === String(patientId));
};

// Lấy danh sách đơn thuốc theo mã bệnh nhân (patientCode)
export const getPrescriptionsByPatientCode = async (patientCode) => {
  try {
    const response = await api.get(`/prescriptions/patient-code/${patientCode}`);
    const data = response.data?.data ?? response.data?.result ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Fallback to local backup for patientCode', patientCode);
  }

  const all = getLocalBackup();
  return all.filter((p) => p.patientCode?.toLowerCase() === patientCode?.toLowerCase());
};

// Tạo mới một đơn thuốc
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await api.post('/prescriptions', prescriptionData);
    const saved = response.data?.data ?? response.data?.result ?? response.data;
    if (saved && saved.id) {
      // Đồng bộ vào local backup
      const all = getLocalBackup();
      saveLocalBackup([saved, ...all.filter((x) => x.id !== saved.id)]);
      return saved;
    }
  } catch (err) {
    console.warn('Prescriptions POST API failed, saving to local backup', err.message);
  }

  // Fallback tạo object đơn thuốc lưu cục bộ
  const localItem = {
    id: `local-rx-${Date.now()}`,
    ...prescriptionData,
    prescriptionCode: prescriptionData.prescriptionCode || `DT-${String(Date.now()).slice(-6)}`,
    prescriptionDate: prescriptionData.prescriptionDate || new Date().toISOString(),
    totalAmount: (prescriptionData.prescriptionDetails || []).reduce(
      (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
      0
    ),
    prescriptionDetails: (prescriptionData.prescriptionDetails || []).map((item, idx) => ({
      id: `local-dt-${Date.now()}-${idx}`,
      ...item,
      totalPrice: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
    })),
  };

  const all = getLocalBackup();
  saveLocalBackup([localItem, ...all]);
  return localItem;
};

// Cập nhật đơn thuốc
export const updatePrescription = async (id, prescriptionData) => {
  try {
    const response = await api.put(`/prescriptions/${id}`, prescriptionData);
    const updated = response.data?.data ?? response.data?.result ?? response.data;
    if (updated) {
      const all = getLocalBackup();
      saveLocalBackup(all.map((x) => (String(x.id) === String(id) ? updated : x)));
      return updated;
    }
  } catch (err) {
    console.warn('Prescriptions PUT API failed, updating local backup', err.message);
  }

  const all = getLocalBackup();
  const updated = { ...prescriptionData, id };
  saveLocalBackup(all.map((x) => (String(x.id) === String(id) ? updated : x)));
  return updated;
};

// Xóa đơn thuốc
export const deletePrescription = async (id) => {
  try {
    await api.delete(`/prescriptions/${id}`);
  } catch (err) {
    console.warn('Prescriptions DELETE API failed, deleting from local backup', err.message);
  }

  const all = getLocalBackup();
  saveLocalBackup(all.filter((x) => String(x.id) !== String(id)));
  return true;
};
