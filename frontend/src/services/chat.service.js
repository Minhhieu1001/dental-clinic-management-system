import api from './api';

const unwrap = (res) => res?.data?.data ?? res?.data;

export const chatService = {
  async recallMessage(messageId) {
    const res = await api.put(`/chat/messages/${messageId}/recall`);
    return unwrap(res);
  },

  // Lấy hoặc tạo phòng chat giữa bệnh nhân và chi nhánh
  async getOrCreateRoom(patientId, branchId) {
    const params = {};
    if (patientId) params.patientId = patientId;
    if (branchId) params.branchId = branchId;

    const res = await api.post('/chat/rooms/get-or-create', null, { params });
    return unwrap(res);
  },

  // Chi nhánh lấy danh sách phòng chat thực tế từ Database
  async getRoomsByBranch(branchId) {
    if (!branchId) return [];
    const res = await api.get(`/chat/rooms/branch/${branchId}`);
    return unwrap(res) || [];
  },

  // Bệnh nhân lấy danh sách phòng chat của mình từ Database
  async getRoomsByPatient(patientId) {
    if (!patientId) return [];
    const res = await api.get(`/chat/rooms/patient/${patientId}`);
    return unwrap(res) || [];
  },

  // Lấy lịch sử tin nhắn thực tế của phòng chat
  async getMessagesByRoom(roomId) {
    if (!roomId) return [];
    const res = await api.get(`/chat/rooms/${roomId}/messages`);
    return unwrap(res) || [];
  },

  // Gửi tin nhắn dạng văn bản (TEXT) lưu vào Database
  async sendMessage(payload) {
    const res = await api.post('/chat/messages', payload);
    return unwrap(res);
  },

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(roomId, senderType = 'EMPLOYEE') {
    if (!roomId) return;
    const res = await api.put(`/chat/rooms/${roomId}/read`, null, {
      params: { senderType },
    });
    return unwrap(res);
  },
};
