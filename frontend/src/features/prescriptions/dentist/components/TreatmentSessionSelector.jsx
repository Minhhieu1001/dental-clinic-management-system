import React from 'react';
import { Calendar, ChevronRight, Clock, Stethoscope, PlusCircle, CheckCircle2 } from 'lucide-react';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TreatmentSessionSelector({
  sessions = [],
  selectedSessionId,
  onSelectSession,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-12 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 text-xs text-amber-800 flex items-center justify-between">
        <div>
          <span className="font-bold block mb-0.5">Chưa có đợt khám / điều trị nào</span>
          <span>Bệnh nhân này chưa có dữ liệu khám lâm sàng. Đơn thuốc sẽ được liên kết trực tiếp vào hồ sơ bệnh án.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-teal-700" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Chọn đợt điều trị / Phiên khám ({sessions.length} đợt)
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Nhấp để chọn đợt khám liên kết với đơn thuốc
        </span>
      </div>

      {/* Danh sách các card đợt khám nằm ngang hoặc lưới */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {sessions.map((session, idx) => {
          const isSelected = String(session.id) === String(selectedSessionId);
          const dateDisplay = formatDateTime(session.examinationDate || session.createdAt);
          const complaint = session.chiefComplaint || 'Khám tổng quát';

          return (
            <button
              key={session.id || idx}
              type="button"
              onClick={() => onSelectSession(session)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Đợt {sessions.length - idx}
                </span>
                {isSelected && (
                  <span className="flex items-center text-teal-700 text-[11px] font-bold gap-0.5">
                    <CheckCircle2 size={12} /> Đang chọn
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-slate-800 truncate mb-0.5" title={complaint}>
                {complaint}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{dateDisplay}</span>
              </div>

              {session.dentistName && (
                <div className="text-[10px] text-slate-600 font-medium mt-1 truncate">
                  BS: {session.dentistName}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
