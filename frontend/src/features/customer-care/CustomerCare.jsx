import { useState, useMemo } from 'react';
import {
  HeartHandshake,
  PhoneCall,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Star,
  UserCheck,
  Send,
  Filter,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const mockCareList = [
  {
    id: 'CARE-101',
    patientName: 'Phạm Minh Hiếu',
    patientCode: 'BN-8832',
    phone: '0378995155',
    careType: 'Hỏi thăm sau điều trị',
    treatmentDetail: 'Trám răng R46 & Điều trị tủy',
    scheduledDate: '2026-09-27',
    status: 'PENDING', // PENDING | COMPLETED | SCHEDULED_NEXT | NO_ANSWER
    dentist: 'BS. Nguyễn Trần Phúc Đại',
    lastNotes: 'Khách vừa làm tủy 2 ngày trước, cần gọi kiểm tra đau nhức.',
    rating: null,
  },
  {
    id: 'CARE-102',
    patientName: 'Trần Thị Thu Thảo',
    patientCode: 'BN-7421',
    phone: '0912345678',
    careType: 'Nhắc lịch tái khám',
    treatmentDetail: 'Tái khám Chỉnh nha - Niềng răng đợt 3',
    scheduledDate: '2026-09-28',
    status: 'COMPLETED',
    dentist: 'BS. Nguyễn Văn Tâm',
    lastNotes: 'Đã gọi nhắc nhở lúc 10:00. Bệnh nhân đồng ý đến đúng hẹn.',
    rating: 5,
  },
  {
    id: 'CARE-103',
    patientName: 'Lê Hoàng Nam',
    patientCode: 'BN-9102',
    phone: '0988776655',
    careType: 'Chúc mừng sinh nhật',
    treatmentDetail: 'Tẩy trắng răng Laser Whitening',
    scheduledDate: '2026-09-27',
    status: 'PENDING',
    dentist: 'BS. Lê Thị Mai',
    lastNotes: 'Sinh nhật khách hàng hôm nay. Gửi voucher giảm giá 20%.',
    rating: null,
  },
  {
    id: 'CARE-104',
    patientName: 'Vũ Thị Hồng',
    patientCode: 'BN-6129',
    phone: '0909112233',
    careType: 'Hỏi thăm sau phẫu thuật',
    treatmentDetail: 'Cấy ghép Implant R36',
    scheduledDate: '2026-09-26',
    status: 'NO_ANSWER',
    dentist: 'BS. Nguyễn Trần Phúc Đại',
    lastNotes: 'Gọi 2 cuộc không nghe máy. Cần gọi lại vào buổi chiều.',
    rating: null,
  },
  {
    id: 'CARE-105',
    patientName: 'Nguyễn Văn Anh',
    patientCode: 'BN-5012',
    phone: '0977123456',
    careType: 'Nhắc lịch tái khám',
    treatmentDetail: 'Kiểm tra khớp cắn & Vệ sinh cạo vôi răng',
    scheduledDate: '2026-09-29',
    status: 'SCHEDULED_NEXT',
    dentist: 'BS. Nguyễn Văn Tâm',
    lastNotes: 'Bệnh nhân hẹn chuyển sang 15:00 chiều thứ Bảy.',
    rating: 5,
  },
];

const statusConfig = {
  PENDING: {
    label: 'Cần gọi ngay',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  COMPLETED: {
    label: 'Đã chăm sóc - Hài lòng',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  SCHEDULED_NEXT: {
    label: 'Đã hẹn tái khám',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: Calendar,
  },
  NO_ANSWER: {
    label: 'Không nghe máy',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertCircle,
  },
};

export default function CustomerCare() {
  const [careList, setCareList] = useState(mockCareList);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedCareItem, setSelectedCareItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [careNote, setCareNote] = useState('');
  const [careStatus, setCareStatus] = useState('COMPLETED');
  const [customerRating, setCustomerRating] = useState(5);

  const filteredCareList = useMemo(() => {
    return careList.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.patientName.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.patientCode.toLowerCase().includes(q) ||
        item.treatmentDetail.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PENDING') return item.status === 'PENDING';
      if (activeFilter === 'COMPLETED') return item.status === 'COMPLETED' || item.status === 'SCHEDULED_NEXT';
      if (activeFilter === 'NO_ANSWER') return item.status === 'NO_ANSWER';
      return true;
    });
  }, [careList, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const pending = careList.filter((c) => c.status === 'PENDING').length;
    const completed = careList.filter((c) => c.status === 'COMPLETED' || c.status === 'SCHEDULED_NEXT').length;
    const noAnswer = careList.filter((c) => c.status === 'NO_ANSWER').length;
    return { pending, completed, noAnswer, total: careList.length };
  }, [careList]);

  const handleOpenCallModal = (item) => {
    setSelectedCareItem(item);
    setCareNote(item.lastNotes || '');
    setCareStatus(item.status === 'PENDING' ? 'COMPLETED' : item.status);
    setCustomerRating(item.rating || 5);
    setIsModalOpen(true);
  };

  const handleSaveCareResult = (e) => {
    e.preventDefault();
    if (!selectedCareItem) return;

    setCareList((prev) =>
      prev.map((c) =>
        c.id === selectedCareItem.id
          ? {
              ...c,
              status: careStatus,
              lastNotes: careNote,
              rating: customerRating,
            }
          : c
      )
    );

    toast.success(`Đã cập nhật trạng thái chăm sóc cho ${selectedCareItem.patientName}!`);
    setIsModalOpen(false);
    setSelectedCareItem(null);
  };

  const handleSendZaloSms = (item) => {
    toast.success(`Đã gửi tin nhắn Zalo/SMS nhắc nhở đến ${item.patientName} (${item.phone})!`);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 bg-slate-50/60 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-teal-900 via-teal-800 to-teal-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/20 shadow-inner">
            <HeartHandshake size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Chăm Sóc Khách Hàng (CRM)</h1>
            <p className="text-xs text-teal-100/80 mt-1">
              Quản lý hỏi thăm sau khám, nhắc lịch tái khám & theo dõi mức độ hài lòng của bệnh nhân.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success('Đã đồng bộ danh sách chăm sóc khách hàng mới nhất!')}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cần gọi chăm sóc
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-amber-600">{stats.pending}</span>
            <Clock size={22} className="text-amber-500 opacity-80" />
          </div>
          <p className="text-[11px] text-slate-500">Bệnh nhân cần gọi trong ngày</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Đã hoàn thành chăm sóc
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.completed}</span>
            <CheckCircle2 size={22} className="text-emerald-500 opacity-80" />
          </div>
          <p className="text-[11px] text-slate-500">Đã gọi hỏi thăm & hẹn lịch</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Chưa liên hệ được
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-rose-600">{stats.noAnswer}</span>
            <AlertCircle size={22} className="text-rose-500 opacity-80" />
          </div>
          <p className="text-[11px] text-slate-500">Bệnh nhân nhỡ cuộc gọi</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Chỉ số Hài lòng (CSAT)
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-teal-700">98.5%</span>
            <Star size={22} className="text-amber-400 fill-amber-400" />
          </div>
          <p className="text-[11px] text-slate-500">Đánh giá 5 sao từ bệnh nhân</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bệnh nhân, SĐT, mã BN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'PENDING', label: 'Cần gọi ngay' },
              { key: 'COMPLETED', label: 'Đã hoàn thành' },
              { key: 'NO_ANSWER', label: 'Chưa nghe máy' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === tab.key
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Care Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Bệnh nhân</th>
                <th className="p-3.5">Nội dung chăm sóc / Điều trị</th>
                <th className="p-3.5">Ngày hẹn</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Ghi chú chăm sóc</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCareList.map((item) => {
                const st = statusConfig[item.status] || statusConfig.PENDING;
                const StatusIcon = st.icon;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{item.patientName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{item.patientCode}</span>
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-teal-800">{item.careType}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]" title={item.treatmentDetail}>
                        {item.treatmentDetail}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap font-medium text-slate-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{item.scheduledDate}</span>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold border shadow-2xs ${st.className}`}>
                        <StatusIcon size={12} />
                        <span>{st.label}</span>
                      </span>
                    </td>

                    <td className="p-3.5 max-w-[260px]">
                      <p className="text-slate-600 italic truncate" title={item.lastNotes}>
                        &ldquo;{item.lastNotes}&rdquo;
                      </p>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenCallModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs"
                        >
                          <PhoneCall size={12} />
                          <span>Gọi chăm sóc</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendZaloSms(item)}
                          title="Gửi Zalo / SMS nhắc nhở"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCareList.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            Không tìm thấy hồ sơ chăm sóc bệnh nhân phù hợp với tìm kiếm.
          </div>
        )}
      </div>

      {/* Modal Chăm Sóc & Ghi Chú Phản Hồi */}
      {isModalOpen && selectedCareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-teal-900 text-white">
              <div className="flex items-center gap-2">
                <HeartHandshake size={20} className="text-teal-300" />
                <h3 className="text-sm font-bold">Ghi Nhận Chăm Sóc Bệnh Nhân</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCareResult} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedCareItem.patientName} ({selectedCareItem.patientCode})</div>
                <div className="text-slate-600">SĐT: <strong>{selectedCareItem.phone}</strong></div>
                <div className="text-teal-800 font-semibold">{selectedCareItem.careType} - {selectedCareItem.treatmentDetail}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kết quả cuộc gọi / Trạng thái</label>
                <select
                  value={careStatus}
                  onChange={(e) => setCareStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-semibold text-xs outline-none focus:border-teal-600"
                >
                  <option value="COMPLETED">Đã gọi - Bệnh nhân hài lòng</option>
                  <option value="SCHEDULED_NEXT">Đã hẹn lịch tái khám mới</option>
                  <option value="NO_ANSWER">Không nghe máy (Gọi lại sau)</option>
                  <option value="PENDING">Cần theo dõi thêm</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đánh giá độ hài lòng bệnh nhân (1 - 5 sao)</label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCustomerRating(star)}
                      className="cursor-pointer p-1"
                    >
                      <Star
                        size={22}
                        className={star <= customerRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú trao đổi & Phản hồi của khách</label>
                <textarea
                  rows={3}
                  value={careNote}
                  onChange={(e) => setCareNote(e.target.value)}
                  placeholder="Nhập ghi chú phản hồi của bệnh nhân, tình trạng sưng đau hoặc lịch hẹn mong muốn..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-5 py-2 font-bold text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
                >
                  Lưu kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
