// Mock data cho Dashboard Lễ Tân
// Dữ liệu giả dùng để phát triển giao diện trước khi kết nối API

export const staffName = 'Nguyễn Thảo';

export const statsData = {
  appointmentsToday: {
    value: 24,
    compareLabel: '↑ 4 so với hôm qua',
    trend: 'up',
  },
  checkedIn: {
    value: 15,
    ratio: '62,5% lịch hẹn',
  },
  waiting: {
    value: 5,
    avgWait: 'Trung bình 12 phút',
  },
  revenue: {
    value: '18,6 tr',
    transactions: '12 giao dịch',
  },
};

export const todayAppointments = [];

export const appointmentRequests = [];


// Status config cho lịch hẹn
export const appointmentStatusConfig = {
  'in-progress': {
    label: 'Đang khám',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
    action: 'Mở hồ sơ',
  },
  'checked-in': {
    label: 'Đã tiếp nhận',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    action: 'Mở hồ sơ',
  },
  waiting: {
    label: 'Đang chờ',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    action: 'Gọi vào',
  },
  'not-arrived': {
    label: 'Chưa đến',
    className: 'bg-slate-50 text-slate-600 border border-slate-200',
    action: 'Nhắc lịch',
  },
  completed: {
    label: 'Đã hoàn tất',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
    action: 'Thanh toán',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
    action: 'Xem lại',
  },
};


// Status config cho yêu cầu đặt lịch
export const requestStatusConfig = {
  new: {
    label: 'Mới',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  processing: {
    label: 'Đang xử lý',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  rejected: {
    label: 'Đã từ chối',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
};
