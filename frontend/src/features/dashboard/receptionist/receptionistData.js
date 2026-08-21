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
  CONFIRMED: {
    label: 'Chưa đến',
    className: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    action: 'Check-in',
  },
  WAITING: {
    label: 'Đang chờ khám',
    className: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    action: 'Đã Check-in',
  },
  CALLED: {
    label: 'Gọi vào',
    className: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    action: 'Gọi vào',
  },
  IN_PROGRESS: {
    label: 'Đang điều trị',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    action: 'Đang điều trị',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
    action: 'Hoàn thành',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    action: 'Đã hủy',
  },
  // Fallbacks
  'not-arrived': {
    label: 'Chưa đến',
    className: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    action: 'Check-in',
  },
  waiting: {
    label: 'Đang chờ khám',
    className: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    action: 'Đã Check-in',
  },
  called: {
    label: 'Gọi vào',
    className: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    action: 'Gọi vào',
  },
  'in-progress': {
    label: 'Đang điều trị',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    action: 'Đang điều trị',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
    action: 'Hoàn thành',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    action: 'Đã hủy',
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
