/**
 * Customer Care Constants & Business Rules
 * Hệ thống định nghĩa trạng thái, kênh liên hệ, phản hồi khách hàng chuẩn thực tế nha khoa.
 */

export const CARE_TABS = [
  { id: 'all', label: 'Danh bạ CRM', icon: 'UserGroupIcon' },
  { id: 'history', label: 'Lịch sử chăm sóc', icon: 'ClockIcon' },
  { id: 'appointments', label: 'Nhắc lịch hẹn', icon: 'CalendarDaysIcon' },
  { id: 'post-treatment', label: 'Sau điều trị', icon: 'HeartIcon' },
  { id: 'birthdays', label: 'Chúc mừng sinh nhật', icon: 'CakeIcon' },
  { id: 'payments', label: 'Chăm sóc thanh toán', icon: 'CreditCardIcon' },
  { id: 'promotions', label: 'Ưu đãi & Chiến dịch', icon: 'SparklesIcon' },
];

export const CARE_STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Liên hệ thành công', color: 'emerald' },
  { value: 'RECARE', label: 'Hẹn chăm sóc lại', color: 'amber' },
  { value: 'NO_ANSWER', label: 'Không nghe máy', color: 'orange' },
  { value: 'REJECTED', label: 'Từ chối tiếp nhận', color: 'rose' },
  { value: 'FAILED', label: 'Gửi thất bại', color: 'red' },
  { value: 'PENDING', label: 'Chưa chăm sóc', color: 'slate' },
];

export const CARE_CHANNELS = [
  { value: 'PHONE', label: 'Gọi điện', icon: 'phone' },
  { value: 'GMAIL', label: 'Gmail', icon: 'envelope' },
  { value: 'SMS', label: 'SMS', icon: 'chat' },
  { value: 'ZALO', label: 'Zalo', icon: 'chat-bubble' },
  { value: 'DIRECT', label: 'Tại quầy', icon: 'building' },
];

/**
 * Danh mục phản hồi khách hàng (Outcome) theo từng nghiệp vụ thực tế
 */
export const OUTCOME_OPTIONS_BY_TAB = {
  appointments: [
    'Xác nhận đến đúng giờ',
    'Xin dời sang ngày/giờ khác',
    'Báo bận / Hủy lịch hẹn',
    'Đã nhận thông báo (sắp xếp thêm)',
    'Cần tư vấn thêm trước khi đến',
  ],
  'post-treatment': [
    'Hồi phục tốt, không đau',
    'Đau nhẹ/ê buốt trong giới hạn bình thường',
    'Đang uống thuốc theo đơn bác sĩ',
    'Cần tái khám gấp / Khó chịu nhiều',
    'Khách rất hài lòng với kết quả điều trị',
  ],
  birthdays: [
    'Đã gửi lời chúc sinh nhật',
    'Đã gửi voucher quà tặng',
    'Khách vui vẻ cảm ơn',
    'Khách đặt lịch làm dịch vụ mừng sinh nhật',
  ],
  payments: [
    'Đã thanh toán tại quầy',
    'Đã chuyển khoản ngân hàng (VietQR)',
    'Hứa thanh toán trong đợt tái khám tới',
    'Xin gia hạn thời gian thanh toán',
    'Cần giải thích chi tiết chi phí điều trị',
  ],
  promotions: [
    'Khách quan tâm ưu đãi',
    'Đã đặt lịch hẹn trải nghiệm dịch vụ',
    'Chưa có nhu cầu lúc này',
    'Hỏi thêm thông tin ưu đãi khác',
  ],
  general: [
    'Liên hệ thành công, khách hài lòng',
    'Cần theo dõi thêm tiến trình',
    'Đã giải đáp thắc mắc của khách',
    'Khách bận, hẹn gọi lại sau',
  ],
};

/**
 * Helper lấy cấu hình hiển thị Badge trạng thái liên hệ
 */
export const getStatusBadgeConfig = (statusStr) => {
  if (!statusStr) {
    return {
      label: 'Chưa chăm sóc',
      bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
    };
  }

  const s = statusStr.toLowerCase();

  if (s.includes('thành công') || s === 'completed') {
    return {
      label: 'Liên hệ thành công',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }

  if (s.includes('hẹn chăm sóc') || s.includes('hẹn lại') || s === 'recare') {
    return {
      label: 'Hẹn chăm sóc lại',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }

  if (s.includes('không nghe') || s === 'no_answer') {
    return {
      label: 'Không nghe máy',
      bgClass: 'bg-orange-50 text-orange-700 border-orange-200',
      dotClass: 'bg-orange-500',
    };
  }

  if (s.includes('từ chối') || s === 'rejected') {
    return {
      label: 'Từ chối',
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
    };
  }

  if (s.includes('thất bại') || s === 'failed') {
    return {
      label: 'Gửi thất bại',
      bgClass: 'bg-red-50 text-red-700 border-red-200',
      dotClass: 'bg-red-500',
    };
  }

  if (s.includes('đã sử dụng')) {
    return {
      label: 'Đã sử dụng',
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotClass: 'bg-indigo-500',
    };
  }

  if (s.includes('chưa gửi') || s === 'not_sent') {
    return {
      label: 'Chưa gửi ưu đãi',
      bgClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
    };
  }

  if (s.includes('đã gửi') || s === 'sent') {
    return {
      label: 'Đã gửi ưu đãi',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
    };
  }

  return {
    label: statusStr,
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };
};
