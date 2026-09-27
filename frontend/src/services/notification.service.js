import api from './axios';

export const getNotificationsByUser = async (userId) => {
  if (!userId) return [];
  try {
    const res = await api.get(`/notifications/user/${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Lỗi khi lấy danh sách thông báo:', err);
    return [];
  }
};

export const markNotificationAsRead = async (id) => {
  if (!id) return;
  try {
    await api.put(`/notifications/${id}/read`);
  } catch (err) {
    console.warn('Lỗi khi đánh dấu đã đọc:', err);
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;
  try {
    await api.put(`/notifications/user/${userId}/read-all`);
  } catch (err) {
    console.warn('Lỗi khi đánh dấu tất cả đã đọc:', err);
  }
};
