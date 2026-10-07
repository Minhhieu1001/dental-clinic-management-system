import React from 'react';
import { X, Calendar, Clock, User, Phone, MapPin, Printer, FileText, CheckCircle, AlertCircle, Mail, MessageSquare, Sparkles, Building2 } from 'lucide-react';

const formatDateTimeDisplay = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

export default function FollowUpDetailModal({
  isOpen,
  onClose,
  followUp,
  patient,
  selectedSession,
  onPrint,
}) {
  if (!isOpen || !followUp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-sm bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-teal-800 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="text-teal-200" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              CHI TIẾT PHIẾU HẸN TÁI KHÁM
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-teal-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Badge & Time Banner */}
          <div className="rounded-sm bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wide block mb-0.5">
                Thời gian hẹn tái khám
              </span>
              <div className="text-sm font-black text-teal-950 flex items-center gap-2 capitalize">
                <Clock size={18} className="text-teal-700 shrink-0" />
                <span>{formatDateTimeDisplay(followUp.followUpDate)}</span>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              {followUp.status !== false ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[11px] shadow-2xs">
                  <CheckCircle size={14} className="text-emerald-700" /> Đã xác nhận
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[11px]">
                  <AlertCircle size={14} className="text-rose-700" /> Đã hủy
                </span>
              )}
            </div>
          </div>

          {/* Patient Card */}
          <div className="rounded-sm border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
            <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <User size={13} className="text-teal-700" />
              <span>THÔNG TIN BỆNH NHÂN</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-0.5">
              <div>
                Họ và tên: <strong className="text-slate-900 font-extrabold">{patient?.fullName || followUp.patientName || '—'}</strong>
              </div>
              <div>
                Mã bệnh nhân: <strong className="text-teal-900 font-mono font-extrabold bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">{patient?.patientCode || followUp.patientCode || '—'}</strong>
              </div>
              <div>
                Số điện thoại: <strong className="text-slate-900 font-bold">{patient?.phone || patient?.phoneNumber || followUp.patientPhone || '—'}</strong>
              </div>
              <div>
                Email: <strong className="text-slate-900 font-medium">{patient?.email || followUp.patientEmail || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 font-medium">Bác sĩ phụ trách:</span>{' '}
                <strong className="text-slate-900 font-bold">{followUp.dentistName || 'BS. Nha Khoa Crown Dental'}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Ngày lập phiếu:</span>{' '}
                <strong className="text-slate-800 font-semibold">{formatDateDisplay(followUp.createAt || followUp.createdAt)}</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-bold block mb-1">Lý do / Nội dung tái khám:</span>
              <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 text-slate-900 font-extrabold text-xs">
                {followUp.reason || 'Tái khám kiểm tra định kỳ'}
              </div>
            </div>

            {followUp.note && (
              <div>
                <span className="text-slate-600 font-bold block mb-1">Ghi chú & Lời dặn nha sĩ:</span>
                <div className="bg-amber-50/70 p-3 rounded-sm border border-amber-200 text-slate-800 font-medium italic">
                  {followUp.note}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-600 pt-1">
              <Building2 size={14} className="text-teal-700 shrink-0" />
              <span>Địa điểm: <strong className="text-slate-900">Nha Khoa Quốc Tế Crown Dental (12 Nguyễn Văn Bảo, Q. Gò Vấp, TP. HCM)</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-sm cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              if (onPrint) onPrint(followUp);
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-md"
          >
            <Printer size={15} /> In Giấy Hẹn Tái Khám
          </button>
        </div>
      </div>
    </div>
  );
}

