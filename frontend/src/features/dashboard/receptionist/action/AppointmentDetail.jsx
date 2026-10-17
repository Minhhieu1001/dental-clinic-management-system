import { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentStatusConfig } from '../receptionistData';

export default function AppointmentDetail({
  isOpen,
  onClose,
  appointment,
  onCheckin,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const statusConf = appointmentStatusConfig[appointment.status] || appointmentStatusConfig.CONFIRMED;
  const isConfirmed = appointment.status === 'CONFIRMED' || appointment.status === 'not-arrived';

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Đã sao chép mã bệnh nhân');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-[3px] bg-white shadow-xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header ERP Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-teal-900 text-white border-b border-teal-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-white/10 text-white border border-white/20">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Chi tiết Lịch hẹn Lễ tân
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              title="In phiếu lịch hẹn"
              className="flex h-7.5 w-7.5 items-center justify-center rounded-[3px] bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 cursor-pointer"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              className="flex h-7.5 w-7.5 items-center justify-center rounded-[3px] bg-white/10 text-white hover:bg-rose-600 transition-all border border-white/20 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="overflow-y-auto p-4 space-y-3 bg-slate-100/60 text-slate-800">
          {/* Card 1: Patient Profile */}
          <div className="rounded-[3px] border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <User size={15} className="text-teal-700" />
                Thông tin Bệnh nhân
              </span>
              {appointment.patientCode && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(appointment.patientCode)}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-[3px] hover:bg-teal-100 transition-colors cursor-pointer"
                  title="Sao chép mã bệnh nhân"
                >
                  <span>{appointment.patientCode}</span>
                  {copied ? <Check size={13} className="text-teal-600" /> : <Copy size={13} className="text-slate-400" />}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Họ và tên bệnh nhân</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{appointment.patientName || 'Khách vãng lai'}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Số điện thoại</span>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                  <Phone size={14} className="text-teal-700" />
                  {appointment.phone || 'Chưa cung cấp'}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Loại bệnh nhân</span>
                <p className="font-bold mt-0.5">
                  {appointment.isNewPatient ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[3px] text-xs">
                      <AlertCircle size={12} /> Bệnh nhân mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[3px] text-xs">
                      <ShieldCheck size={12} /> Bệnh nhân tái khám
                    </span>
                  )}
                </p>
              </div>

              <div className="col-span-1 sm:col-span-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-2.5 rounded-[3px] border border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                    <Building size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wide block">Chi nhánh khách đặt</span>
                    <p className="font-bold text-teal-900 text-sm truncate">
                      {appointment.branchName || 'Chưa xác định chi nhánh'}
                    </p>
                  </div>
                </div>
                {appointment.branchAddress && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 sm:text-right shrink-0">
                    <MapPin size={14} className="text-rose-600 shrink-0" />
                    <span className="font-medium">{appointment.branchAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Appointment Schedule Details */}
          <div className="rounded-[3px] border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <Calendar size={15} className="text-teal-700" />
                Thông tin Lịch khám & Phân công
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-[3px] border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Clock size={13} className="text-teal-700" /> Giờ khám
                </span>
                <p className="font-bold text-teal-950 text-sm mt-0.5">{appointment.time || '09:00'}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-[3px] border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Stethoscope size={13} className="text-teal-700" /> Bác sĩ điều trị
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{appointment.dentist || 'Chưa chỉ định'}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-[3px] border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Building size={13} className="text-teal-700" /> Phòng khám
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{appointment.roomName || 'Phòng 101'}</p>
              </div>
            </div>

            {/* Dịch vụ đăng ký */}
            <div className="pt-1.5">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Tag size={13} className="text-teal-700" /> Dịch vụ đăng ký / Khám
              </span>
              <p className="font-bold text-teal-950 text-sm mt-1 bg-teal-50/70 border border-teal-200 p-2 rounded-[3px]">
                {appointment.service || 'Khám tổng quát & Chụp phim X-quang'}
              </p>
            </div>
          </div>

          {/* Card 3: Notes & Reception Staff */}
          <div className="rounded-[3px] border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                <Activity size={15} className="text-teal-700" />
                Ghi chú & Tiếp nhận
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-semibold">Ghi chú của bệnh nhân / Tiếp nhận</span>
              <div className="mt-1 rounded-[3px] bg-slate-50 border border-slate-200 p-2 text-xs text-slate-800 italic leading-relaxed">
                &ldquo;{appointment.notes || appointment.reason || 'Không có ghi chú bổ sung.'}&rdquo;
              </div>
            </div>

            {appointment.calledInfo && (
              <div className="pt-1.5 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">Lịch sử gọi ca:</span>
                <p className="font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-[3px] text-xs mt-0.5">
                  {appointment.calledInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer ERP Actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Trạng thái hiện tại:</span>
            <span className={`inline-flex items-center rounded-[3px] px-2.5 py-0.5 text-xs font-bold border shadow-2xs ${statusConf.className}`}>
              {statusConf.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isConfirmed && onCheckin && (
              <button
                type="button"
                onClick={() => {
                  onCheckin(appointment);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-[3px] bg-teal-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-900 transition-colors shadow-2xs cursor-pointer"
              >
                <UserCheck size={14} />
                Thực hiện Check-in
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-[3px] border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
