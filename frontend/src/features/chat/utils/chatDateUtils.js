/**
 * Tiện ích định dạng ngày giờ cho tin nhắn phòng chat
 */

export const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

export const isDifferentDay = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return true;
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return (
      d1.getFullYear() !== d2.getFullYear() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getDate() !== d2.getDate()
    );
  } catch (e) {
    return false;
  }
};

export const formatMessageDateDivider = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return 'Hôm nay';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Hôm qua';

    // Format ngày chuẩn tiếng Việt: VD "Thứ Bảy, 21/11/2026"
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return '';
  }
};
