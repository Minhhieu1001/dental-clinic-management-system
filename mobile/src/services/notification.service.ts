import api from './api';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

export interface NotificationItem {
  id: string;
  userId?: string;
  type?: string;
  title: string;
  content: string;
  senderName?: string;
  isRead: boolean;
  createdAt?: string | number[];
  targetUrl?: string;
}

export const notificationService = {
  getByUserId: async (userId: string): Promise<NotificationItem[]> => {
    const res = await api.get(`/notifications/user/${userId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  markAsRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: string) => {
    await api.put(`/notifications/user/${userId}/read-all`);
  },

  deleteById: async (id: string) => {
    await api.delete(`/notifications/${id}`);
  },
};
