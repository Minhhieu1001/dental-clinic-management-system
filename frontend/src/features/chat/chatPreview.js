export function chatPreview(room) {
  if (room?.lastMessage === '') return 'Tin nhắn đã thu hồi';
  if (room?.lastMessageType === 'IMAGE') return 'Hình ảnh';
  if (room?.lastMessageType === 'STICKER') return 'Sticker';
  return room?.lastMessage || 'Bắt đầu cuộc trò chuyện';
}
