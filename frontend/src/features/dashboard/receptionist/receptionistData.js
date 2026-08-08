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

export const todayAppointments = [
  {
    id: 'apt-001',
    time: '08:00',
    patientName: 'Lê Thị Hương',
    patientCode: 'BN-001890',
    phone: '0901 112 233',
    service: 'Khám tổng quát',
    dentist: 'BS. Trần Quang',
    status: 'completed',
    initials: 'LH',
  },
  {
    id: 'apt-002',
    time: '08:30',
    patientName: 'Nguyễn Minh Long',
    patientCode: 'BN-002185',
    phone: '0903 456 789',
    service: 'Khám tổng quát',
    dentist: 'BS. Trần Quang',
    status: 'checked-in',
    initials: 'NL',
  },
  {
    id: 'apt-003',
    time: '09:00',
    patientName: 'Hoàng Thanh Thảo',
    patientCode: 'BN-001936',
    phone: '0988 210 455',
    service: 'Cạo vôi răng',
    dentist: 'BS. Lê Khánh',
    status: 'waiting',
    initials: 'HT',
  },
  {
    id: 'apt-004',
    time: '09:15',
    patientName: 'Phạm Gia Linh',
    patientCode: null,
    phone: '0912 888 650',
    service: 'Niềng răng tư vấn',
    dentist: 'BS. Vũ Anh',
    status: 'not-arrived',
    isNewPatient: true,
    initials: 'PL',
  },
  {
    id: 'apt-005',
    time: '09:30',
    patientName: 'Trần Quốc Tuấn',
    patientCode: 'BN-002021',
    phone: '0909 345 112',
    service: 'Trám răng',
    dentist: 'BS. Trần Quang',
    status: 'completed',
    initials: 'TT',
  },
  {
    id: 'apt-006',
    time: '10:00',
    patientName: 'Võ Ngọc Diễm',
    patientCode: 'BN-002310',
    phone: '0977 654 321',
    service: 'Tẩy trắng răng',
    dentist: 'BS. Lê Khánh',
    status: 'waiting',
    initials: 'VD',
  },
  {
    id: 'apt-007',
    time: '10:30',
    patientName: 'Đặng Văn Hùng',
    patientCode: 'BN-001752',
    phone: '0916 789 012',
    service: 'Nhổ răng khôn',
    dentist: 'BS. Vũ Anh',
    status: 'not-arrived',
    initials: 'DH',
  },
  {
    id: 'apt-008',
    time: '11:00',
    patientName: 'Bùi Thị Mai',
    patientCode: 'BN-002405',
    phone: '0938 111 222',
    service: 'Bọc răng sứ',
    dentist: 'BS. Trần Quang',
    status: 'not-arrived',
    initials: 'BM',
  },
  {
    id: 'apt-009',
    time: '13:30',
    patientName: 'Ngô Quang Vinh',
    patientCode: 'BN-001688',
    phone: '0965 432 100',
    service: 'Khám tổng quát',
    dentist: 'BS. Lê Khánh',
    status: 'not-arrived',
    initials: 'NV',
  },
  {
    id: 'apt-010',
    time: '14:00',
    patientName: 'Trịnh Hoàng Anh',
    patientCode: null,
    phone: '0922 333 444',
    service: 'Trám răng',
    dentist: 'BS. Vũ Anh',
    status: 'not-arrived',
    isNewPatient: true,
    initials: 'TA',
  },
];

export const appointmentRequests = [
  {
    id: 'req-001',
    name: 'Nguyễn Văn An',
    phone: '0901 234 567',
    date: '30/07/2026',
    note: 'Muốn đặt lịch khám tổng quát vào buổi sáng.',
    status: 'new',
  },
  {
    id: 'req-002',
    name: 'Trần Minh Anh',
    phone: '0987 654 321',
    date: '31/07/2026',
    note: 'Đau răng hàm bên phải, muốn khám và tư vấn.',
    status: 'new',
  },
  {
    id: 'req-003',
    name: 'Lê Hoàng Nam',
    phone: '0935 456 789',
    date: '01/08/2026',
    note: 'Muốn tư vấn niềng răng, ưu tiên lịch buổi chiều.',
    status: 'processing',
  },
  {
    id: 'req-004',
    name: 'Phạm Thu Hà',
    phone: '0918 222 333',
    date: '02/08/2026',
    note: 'Lịch tái khám sau nhổ răng khôn tuần trước. Bác sĩ Trần Quang đã dặn quay lại sau 7 ngày.',
    status: 'new',
  },
  {
    id: 'req-005',
    name: 'Đỗ Minh Tuấn',
    phone: '0944 555 666',
    date: '03/08/2026',
    note: 'Muốn làm răng sứ, đã tư vấn qua điện thoại.',
    status: 'new',
  },
];

// Status config cho lịch hẹn
export const appointmentStatusConfig = {
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
