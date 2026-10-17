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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]">
        {/* Header ERP Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 shadow-inner">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Chi tiết Lịch hẹn Lễ tân
                </h2>
                <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${statusConf.className}`}>
                  {statusConf.label}
                </span>
              </div>
              <p className="text-xs text-teal-100/80 font-medium">
                Mã hệ thống: <span className="font-mono text-white/90">{appointment.id ? String(appointment.id).substring(0, 8) : 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="In phiếu lịch hẹn"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-rose-600 transition-all border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-5 bg-slate-50/40 text-slate-800 text-xs">
          {/* Card 1: Patient Profile */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                <User size={15} className="text-teal-600" />
                Thông tin Bệnh nhân
              </span>
              {appointment.patientCode && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(appointment.patientCode)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  <span>{appointment.patientCode}</span>
                  {copied ? <Check size={12} className="text-teal-600" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Họ và tên bệnh nhân</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{appointment.patientName || 'Khách vãng lai'}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Số điện thoại</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone size={13} className="text-teal-600" />
                  {appointment.phone || 'Chưa cung cấp'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Loại bệnh nhân</span>
                <p className="font-semibold text-slate-700 mt-0.5">
                  {appointment.isNewPatient ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                      <AlertCircle size={11} /> Bệnh nhân mới
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      <ShieldCheck size={11} /> Bệnh nhân tái khám
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Appointment Schedule Details */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                <Calendar size={15} className="text-teal-600" />
                Thông tin Lịch khám & Phân công
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-teal-600" /> Giờ khám
                </span>
                <p className="font-bold text-teal-900 text-sm mt-1">{appointment.time || '09:00'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Stethoscope size={12} className="text-teal-600" /> Bác sĩ điều trị
                </span>
                <p className="font-bold text-slate-900 mt-1 truncate">{appointment.dentist || 'Chưa chỉ định'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Building size={12} className="text-teal-600" /> Phòng khám
                </span>
                <p className="font-bold text-slate-900 mt-1">{appointment.roomName || 'Phòng 101'}</p>
              </div>
            </div>

            {/* Dịch vụ đăng ký */}
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Tag size={12} className="text-teal-600" /> Dịch vụ đăng ký / Khám
              </span>
              <p className="font-bold text-slate-900 text-xs mt-1 bg-teal-50/60 border border-teal-100 p-2.5 rounded-md">
                {appointment.service || 'Khám tổng quát & Chụp phim X-quang'}
              </p>
            </div>
          </div>

          {/* Card 3: Notes & Reception Staff */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wide">
                <Activity size={15} className="text-teal-600" />
                Ghi chú & Tiếp nhận
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium">Ghi chú của bệnh nhân / Tiếp nhận</span>
              <div className="mt-1 rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 text-slate-700 italic leading-relaxed">
                &ldquo;{appointment.notes || appointment.reason || 'Không có ghi chú bổ sung.'}&rdquo;
              </div>
            </div>

            {appointment.calledInfo && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Lịch sử gọi ca:</span>
                <p className="font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded text-xs mt-1">
                  {appointment.calledInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer ERP Actions */}
        <div className="flex items-center justify-between gap-2 px-6 py-3.5 bg-slate-50 border-t border-slate-200/80">
          <div className="text-[11px] text-slate-500 font-medium">
            Trạng thái hiện tại: <strong className="text-slate-800">{statusConf.label}</strong>
          </div>

          <div className="flex items-center gap-2">
            {isConfirmed && onCheckin && (
              <button
                type="button"
                onClick={() => {
                  onCheckin(appointment);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
              >
                <UserCheck size={14} />
                Thực hiện Check-in
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
