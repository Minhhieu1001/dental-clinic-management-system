import { useState } from 'react';
import {
  X,
  User,
  Phone,
  Clock,
  Stethoscope,
  Building,
  FileText,
  Printer,
  UserCheck,
  Activity,
  ShieldCheck,
  Tag,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentStatusConfig } from '../receptionistData';

export default function AppointmentDetail({
  isOpen,
  onClose,
  appointment,
  onCheckin,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen || !appointment) return null;

  const statusConf = appointmentStatusConfig[appointment.status] || appointmentStatusConfig.CONFIRMED;
  const isConfirmed = appointment.status === 'CONFIRMED' || appointment.status === 'not-arrived';

  // Trích xuất mã lịch hẹn (ưu tiên appointmentCode -> code -> hash từ ID)
  const appointmentCode =
    appointment.appointmentCode ||
    appointment.code ||
    (appointment.id && !String(appointment.id).startsWith('mock-')
      ? (String(appointment.id).includes('-')
          ? `APT-${String(appointment.id).split('-')[0].toUpperCase()}`
          : `APT-${String(appointment.id).substring(0, 6).toUpperCase()}`)
      : 'APT-966358');

  // Format ngày khám (DD/MM/YYYY)
  const formattedDate = () => {
    const rawDate = appointment.appointmentDate || appointment.appointmentTime || appointment.date;
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        const parts = String(rawDate).split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return String(rawDate).split('T')[0];
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const displayDateStr = formattedDate();

  // Kiểm tra mã bệnh nhân hợp lệ (không phải N/A hay rỗng)
  const hasValidPatientCode =
    appointment.patientCode &&
    appointment.patientCode !== 'N/A' &&
    appointment.patientCode !== 'BN-NEW';

  const handleCopy = (text, label = 'mã') => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-fadeIn">
      {/* Modal Container: Mở rộng chiều rộng lên max-w-4xl lg:max-w-5xl để xem trọn vẹn toàn bộ nội dung không bị dấu 3 chấm */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Header ERP Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white border-b border-teal-950 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shadow-xs shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Chi tiết Lịch hẹn Lễ tân
                </h2>
                {appointmentCode && (
                  <button
                    type="button"
                    onClick={() => handleCopy(appointmentCode, 'mã lịch hẹn')}
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-teal-100 hover:bg-white/30 hover:text-white border border-white/25 transition-all cursor-pointer shadow-xs"
                    title="Bấm để sao chép mã lịch hẹn"
                  >
                    <span>{appointmentCode}</span>
                    {copiedKey === appointmentCode ? (
                      <Check size={12} className="text-emerald-300" />
                    ) : (
                      <Copy size={12} className="text-teal-200" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-teal-100/80 font-medium">
                Hệ thống tiếp đón & quản lý ca khám Nha khoa Crown Dental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              title="In phiếu lịch hẹn"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-rose-600 transition-all border border-white/20 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/70 text-slate-800 custom-scrollbar">
          {/* Card 1: Patient Profile */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <User size={15} className="text-teal-700" />
                Thông tin Bệnh nhân
              </span>
              {hasValidPatientCode ? (
                <button
                  type="button"
                  onClick={() => handleCopy(appointment.patientCode, 'mã bệnh nhân')}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-md hover:bg-teal-100 transition-colors cursor-pointer"
                  title="Sao chép mã hồ sơ bệnh nhân"
                >
                  <span>{appointment.patientCode}</span>
                  {copiedKey === appointment.patientCode ? (
                    <Check size={13} className="text-teal-600" />
                  ) : (
                    <Copy size={13} className="text-slate-400" />
                  )}
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                  Hồ sơ mới (Chưa có mã BN)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium">Họ và tên bệnh nhân</span>
                <p className="font-bold text-slate-900 text-sm sm:text-base mt-1 break-words">
                  {appointment.patientName || 'Khách vãng lai'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Số điện thoại</span>
                <p className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1.5 mt-1">
                  <Phone size={15} className="text-teal-700 shrink-0" />
                  {appointment.phone ? (
                    <a href={`tel:${appointment.phone}`} className="hover:text-teal-700 hover:underline">
                      {appointment.phone}
                    </a>
                  ) : (
                    'Chưa cung cấp'
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Loại bệnh nhân</span>
                <p className="font-bold mt-1">
                  {appointment.isNewPatient ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-xs">
                      <AlertCircle size={13} /> Bệnh nhân mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">
                      <ShieldCheck size={13} /> Bệnh nhân tái khám
                    </span>
                  )}
                </p>
              </div>

              {/* Chi nhánh tiếp nhận khám: Xem trọn vẹn tên và địa chỉ không bị cắt */}
              <div className="col-span-1 sm:col-span-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/90 p-3 sm:p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800 border border-teal-200 shrink-0 shadow-2xs">
                    <Building size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] text-slate-500 uppercase font-bold tracking-wide block">
                      Chi nhánh tiếp nhận khám
                    </span>
                    <p className="font-bold text-teal-950 text-sm sm:text-base break-words">
                      {appointment.branchName || 'Chi nhánh Crown Dental'}
                    </p>
                  </div>
                </div>
                {appointment.branchAddress && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-700 md:text-right shrink-0">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="font-medium break-words">{appointment.branchAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Appointment Schedule Details (Mã lịch hẹn, Thời gian, Bác sĩ, Phòng khám hiển thị ĐẦY ĐỦ 100%) */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <CalendarCheck size={15} className="text-teal-700" />
                Thông tin Lịch khám & Phân công
              </span>
              <span className={`inline-flex items-center rounded-md px-3 py-0.5 text-xs font-bold border shadow-2xs ${statusConf.className}`}>
                {statusConf.label}
              </span>
            </div>

            {/* 4 Khối thông tin chi tiết: Mở rộng không gian, bỏ hoàn toàn truncate để đọc trọn vẹn họ tên Bác sĩ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Mã lịch hẹn */}
              <div className="bg-teal-50/70 p-3 rounded-lg border border-teal-200/90 flex flex-col justify-between min-h-[72px]">
                <span className="text-xs text-teal-800 font-bold flex items-center gap-1">
                  <Tag size={13} className="text-teal-700" /> Mã lịch hẹn
                </span>
                <div className="flex items-center justify-between gap-1.5 mt-1.5">
                  <p className="font-mono font-black text-teal-950 text-sm tracking-wide break-words">
                    {appointmentCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(appointmentCode, 'mã lịch hẹn')}
                    className="p-1 rounded hover:bg-teal-100 text-teal-700 transition-colors cursor-pointer"
                    title="Sao chép mã lịch hẹn"
                  >
                    {copiedKey === appointmentCode ? (
                      <Check size={14} className="text-teal-600" />
                    ) : (
                      <Copy size={14} className="text-teal-600/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Giờ & Ngày khám */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between min-h-[72px]">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Clock size={13} className="text-teal-700" /> Giờ & Ngày khám
                </span>
                <div className="mt-1.5">
                  <p className="font-bold text-slate-900 text-sm leading-tight">
                    {appointment.time || '09:00'}
                  </p>
                  {displayDateStr && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {displayDateStr}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Bác sĩ điều trị: KHÔNG ẨN DẤU ... (break-words để xem trọn vẹn họ tên Bác sĩ) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between min-h-[72px]">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Stethoscope size={13} className="text-teal-700" /> Bác sĩ điều trị
                </span>
                <p className="font-bold text-slate-900 text-sm mt-1.5 break-words leading-snug">
                  {appointment.dentist || 'Chưa phân công'}
                </p>
              </div>

              {/* 4. Phòng khám: KHÔNG ẨN DẤU ... */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between min-h-[72px]">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Building size={13} className="text-teal-700" /> Phòng khám
                </span>
                <p className="font-bold text-slate-900 text-sm mt-1.5 break-words leading-snug">
                  {appointment.roomName || 'Chưa xếp phòng'}
                </p>
              </div>
            </div>

            {/* Dịch vụ đăng ký: Hiển thị đầy đủ nội dung */}
            <div className="pt-1.5">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Activity size={13} className="text-teal-700" /> Dịch vụ đăng ký / Khám
              </span>
              <p className="font-bold text-teal-950 text-sm mt-1.5 bg-teal-50/50 border border-teal-200/80 p-3 rounded-lg break-words leading-relaxed">
                {appointment.service || 'Khám tổng quát & Tư vấn điều trị'}
              </p>
            </div>
          </div>

          {/* Card 3: Notes & Reception Staff (Hiển thị toàn bộ ghi chú) */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <FileText size={15} className="text-teal-700" />
                Ghi chú & Tiếp nhận
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-semibold">Ghi chú của bệnh nhân / Tiếp nhận</span>
              <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs sm:text-[13px] text-slate-800 italic leading-relaxed break-words">
                &ldquo;{appointment.notes || appointment.reason || 'Không có ghi chú bổ sung.'}&rdquo;
              </div>
            </div>

            {appointment.calledInfo && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">Lịch sử gọi ca:</span>
                <p className="font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-lg text-xs sm:text-[13px] mt-1 break-words">
                  {appointment.calledInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer ERP Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Trạng thái hiện tại:</span>
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold border shadow-2xs ${statusConf.className}`}>
              {statusConf.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {isConfirmed && onCheckin && (
              <button
                type="button"
                onClick={() => {
                  onCheckin(appointment);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 transition-colors shadow-2xs cursor-pointer"
              >
                <UserCheck size={15} />
                Thực hiện Check-in
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
