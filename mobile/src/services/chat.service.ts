import api from './api';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

const API_V1_URL = process.env.EXPO_PUBLIC_API_V1_URL || 'http://localhost:8080/api/v1';
const API_ORIGIN = API_V1_URL.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');

export const DENTAL_STICKERS = [
  'https://cdn-icons-png.flaticon.com/256/6467/6467786.png',
  'https://cdn-icons-png.flaticon.com/256/4193/4193312.png',
  'https://cdn-icons-png.flaticon.com/256/7871/7871445.png',
  'https://cdn-icons-png.flaticon.com/256/6578/6578835.png',
  'https://cdn-icons-png.flaticon.com/256/5784/5784082.png',
  'https://cdn-icons-png.flaticon.com/256/6983/6983861.png',
  'https://cdn-icons-png.flaticon.com/256/10776/10776375.png',
  'https://cdn-icons-png.flaticon.com/256/6578/6578650.png',
];

/**
 * Chuẩn hóa URL ảnh/sticker để chạy được trên điện thoại thật:
 * - Đường dẫn tương đối (`/uploads/...`) -> ghép thêm origin backend.
 * - `localhost` / `127.0.0.1` -> đổi sang IP LAN của backend trong `.env`.
 */
export function resolveMediaUrl(rawUrl?: string | null): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }
  if (/^uploads\//i.test(trimmed)) {
    return `${API_ORIGIN}/${trimmed}`;
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, API_ORIGIN);
  }
  return trimmed;
}

export function isLikelyImageUrl(rawUrl?: string | null): boolean {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return false;
  return (
    /^(https?:\/\/|\/uploads\/|uploads\/)/i.test(trimmed) &&
    (/\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(trimmed) ||
      /res\.cloudinary\.com|\/uploads\//i.test(trimmed))
  );
}

export interface ChatRoomItem {
  id: string;
  branchId: string;
  patientId: string;
  patientUnreadCount?: number;
}

export interface ChatMessageItem {
  id: string;
  chatRoomId?: string;
  content: string;
  senderType: 'PATIENT' | 'EMPLOYEE' | 'SYSTEM';
  messageType?: 'TEXT' | 'IMAGE' | 'STICKER';
  senderPatientId?: string;
  senderEmployeeId?: string;
  senderEmployeeName?: string;
  isRead?: boolean;
  createdAt?: string | number[];
}

export const chatService = {
  getRoomsByPatient: async (patientId: string): Promise<ChatRoomItem[]> => {
    const res = await api.get(`/chat/rooms/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getOrCreateRoom: async (patientId: string, branchId: string): Promise<ChatRoomItem> => {
    const res = await api.post('/chat/rooms/get-or-create', null, {
      params: { patientId, branchId },
    });
    return unwrap(res);
  },

  getMessagesByRoom: async (roomId: string): Promise<ChatMessageItem[]> => {
    const res = await api.get(`/chat/rooms/${roomId}/messages`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (payload: {
    roomId: string;
    content: string;
    senderType: 'PATIENT';
    messageType: 'TEXT' | 'IMAGE' | 'STICKER';
    senderPatientId: string;
  }): Promise<ChatMessageItem> => {
    const res = await api.post('/chat/messages', payload);
    return unwrap(res);
  },

  markAsRead: async (roomId: string) => {
    const res = await api.put(`/chat/rooms/${roomId}/read`, null, {
      params: { senderType: 'PATIENT' },
    });
    return unwrap(res);
  },

  recallMessage: async (messageId: string) => {
    const res = await api.put(`/chat/messages/${messageId}/recall`);
    return unwrap(res);
  },

  uploadImage: async (uri: string, mimeType = 'image/jpeg', fileName = 'chat-image.jpg'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: mimeType,
      name: fileName,
    } as any);

    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    const data = res.data;
    if (typeof data === 'string') return data;
    return data?.data ?? data?.url ?? data?.result ?? '';
  },
};
