import api from './axios';

const LOCAL_STORAGE_KEY = 'dental_clinic_follow_up_backup';

// Lấy danh sách từ LocalStorage dự phòng
const getLocalBackup = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Cannot read follow up appointments from localStorage', err);
    return [];
  }
};

// Lưu danh sách vào LocalStorage dự phòng
const saveLocalBackup = (list) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Cannot write follow up appointments to localStorage', err);
  }
};

// Lấy danh sách lịch tái khám (hỗ trợ params: { patientId, examinationResultId, patientCode })
export const getFollowUpAppointments = async (params = {}) => {
  try {
    const response = await api.get('/follow-up-appointments', { params });
    const data = response.data?.data ?? response.data?.result ?? response.data;
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('Backend follow-up API not reachable, falling back to local cache', err.message);
  }

  // Fallback lọc từ local backup
  const all = getLocalBackup();
  return all.filter((item) => {
    if (params.examinationResultId && String(item.examinationResultId) !== String(params.examinationResultId)) {
      return false;
    }
    if (params.patientId && String(item.patientId) !== String(params.patientId)) {
      return false;
    }
    if (params.patientCode && item.patientCode?.toLowerCase() !== params.patientCode?.toLowerCase()) {
      return false;
    }
    return true;
  });
};

// Lấy chi tiết lịch tái khám theo ID
export const getFollowUpAppointmentById = async (id) => {
  try {
    const response = await api.get(`/follow-up-appointments/${id}`);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (err) {
    const all = getLocalBackup();
    const found = all.find((item) => String(item.id) === String(id));
    if (found) return found;
    throw err;
  }
};

// Tạo mới một lịch tái khám
export const createFollowUpAppointment = async (followUpData) => {
  try {
    const response = await api.post('/follow-up-appointments', followUpData);
    const saved = response.data?.data ?? response.data?.result ?? response.data;
    if (saved && saved.id) {
      const all = getLocalBackup();
      saveLocalBackup([saved, ...all.filter((x) => x.id !== saved.id)]);
      return saved;
    }
  } catch (err) {
    console.warn('Follow-up POST API failed, saving to local backup', err.message);
  }

  // Fallback tạo object lưu cục bộ
  const localItem = {
    id: `local-followup-${Date.now()}`,
    ...followUpData,
    createAt: new Date().toISOString(),
    status: followUpData.status !== undefined ? followUpData.status : true,
  };

  const all = getLocalBackup();
  saveLocalBackup([localItem, ...all]);
  return localItem;
};

// Cập nhật lịch tái khám
export const updateFollowUpAppointment = async (id, followUpData) => {
  try {
    const response = await api.put(`/follow-up-appointments/${id}`, followUpData);
    const updated = response.data?.data ?? response.data?.result ?? response.data;
    if (updated) {
      const all = getLocalBackup();
      saveLocalBackup(all.map((x) => (String(x.id) === String(id) ? updated : x)));
      return updated;
    }
  } catch (err) {
    console.warn('Follow-up PUT API failed, updating local backup', err.message);
  }

  const all = getLocalBackup();
  const updated = { ...followUpData, id };
  saveLocalBackup(all.map((x) => (String(x.id) === String(id) ? updated : x)));
  return updated;
};

// Xóa lịch tái khám
export const deleteFollowUpAppointment = async (id) => {
  try {
    await api.delete(`/follow-up-appointments/${id}`);
  } catch (err) {
    console.warn('Follow-up DELETE API failed, deleting from local backup', err.message);
  }

  const all = getLocalBackup();
  saveLocalBackup(all.filter((x) => String(x.id) !== String(id)));
  return true;
};
