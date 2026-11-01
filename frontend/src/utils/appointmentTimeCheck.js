/**
 * Helper kiểm tra quy định đổi/hủy lịch hẹn:
 * - Cho phép chỉnh sửa/đổi lịch/hủy lịch trước giờ hẹn ít nhất 1 giờ (diff > 60 phút).
 * - Sau 1 giờ (còn dưới 60 phút hoặc đã quá giờ khám): Khóa lại không cho chỉnh sửa.
 */

export const checkAppointmentModifiable = (apt) => {
  if (!apt) {
    return { canModify: false, reason: 'Không tìm thấy thông tin lịch hẹn' };
  }

  // 1. Kiểm tra trạng thái đã hủy hoặc đã hoàn thành
  const st = (apt.status || apt.raw?.status || '').toString().toUpperCase();
  if (st === 'CANCELLED' || st.includes('HỦY') || st.includes('DA HUY')) {
    return { canModify: false, reason: 'Lịch hẹn đã bị hủy, không thể chỉnh sửa hoặc hủy thêm' };
  }
  if (st === 'COMPLETED' || st.includes('ĐÃ KHÁM') || st.includes('HOÀN THÀNH')) {
    return { canModify: false, reason: 'Lịch hẹn đã hoàn thành khám bệnh, không thể chỉnh sửa' };
  }

  // 2. Trích xuất ngày & giờ hẹn
  const dateVal =
    apt.appointmentDate ||
    apt.date ||
    apt.followUpDate ||
    apt.raw?.appointmentDate ||
    apt.raw?.followUpDate;

  const timeVal =
    apt.appointmentTime ||
    apt.time ||
    apt.raw?.appointmentTime ||
    '09:00';

  if (!dateVal) {
    return { canModify: true, reason: '' };
  }

  try {
    let apptDateTime = null;

    if (dateVal instanceof Date) {
      apptDateTime = new Date(dateVal);
    } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
      apptDateTime = new Date(dateVal);
    } else if (typeof dateVal === 'string') {
      let y, m, d;
      const cleanDate = dateVal.trim();
      if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts[0].length === 4) {
          [y, m, d] = parts;
        } else {
          [d, m, y] = parts;
        }
      } else if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        [d, m, y] = parts;
      }

      let hh = 9;
      let mm = 0;
      if (timeVal && typeof timeVal === 'string' && timeVal.includes(':')) {
        const [hStr, mStr] = timeVal.split(':');
        hh = parseInt(hStr, 10) || 0;
        mm = parseInt(mStr, 10) || 0;
      }

      if (y && m && d) {
        apptDateTime = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), hh, mm, 0);
      }
    }

    if (!apptDateTime || isNaN(apptDateTime.getTime())) {
      return { canModify: true, reason: '' };
    }

    const now = Date.now();
    const diffMs = apptDateTime.getTime() - now;
    const oneHourMs = 60 * 60 * 1000;

    // Quá giờ hẹn
    if (diffMs <= 0) {
      return {
        canModify: false,
        reason: 'Lịch hẹn đã quá thời gian khám, hệ thống đã khóa không thể chỉnh sửa hoặc hủy.',
        isExpired: true,
      };
    }

    // Còn dưới 1 giờ
    if (diffMs <= oneHourMs) {
      const remainingMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      return {
        canModify: false,
        reason: `Lịch hẹn chỉ còn ${remainingMinutes} phút nữa sẽ diễn ra. Hệ thống đã khóa tính năng đổi/hủy lịch trong vòng 1 giờ trước giờ hẹn.`,
        isWithinOneHour: true,
      };
    }

    return { canModify: true, reason: '' };
  } catch (e) {
    return { canModify: true, reason: '' };
  }
};

export const canModifyAppointment = (apt) => {
  return checkAppointmentModifiable(apt).canModify;
};
