import {
  Clock,
  CalendarCheck,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TreatmentHistoryTimeline({ records = [], onStartExam }) {
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatTimeDisplay = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.split('T')[1].substring(0, 5);
    }
    return '09:00';
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80">
            <CalendarCheck size={16} />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Lịch Sử Điều Trị</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
              records.length > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {records.length}
          </span>
        </div>
        {records.length > 0 && (
          <button
            type="button"
            onClick={() => toast.info('Đang tải toàn bộ lịch sử bệnh án')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer transition-colors flex items-center gap-0.5"
          >
            <span>Xem tất cả</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* When Empty: Dedicated Beautiful Empty State */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 bg-gradient-to-b from-slate-50/70 via-slate-50/30 to-white rounded-2xl border border-dashed border-slate-200/90 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 shadow-2xs">
            <ClipboardList size={30} className="stroke-[1.6]" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
              Chưa có ca điều trị nào
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bệnh nhân chưa có lịch sử khám chữa răng hoặc thủ thuật nha khoa nào tại phòng khám.
            </p>
          </div>
          {onStartExam && (
            <button
              type="button"
              onClick={onStartExam}
              className="mt-1 flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Stethoscope size={13} />
              <span>Bắt đầu phiên khám mới &rarr;</span>
            </button>
          )}
        </div>
      ) : (
        /* Vertical Timeline List when records exist */
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-teal-600 before:via-slate-200 before:to-slate-100">
          {records.map((rec) => {
            const isCompleted = rec.status === 'COMPLETED';

            return (
              <div key={rec.id} className="relative space-y-1.5 group">
                {/* Bullet Point with Pulse Ring */}
                <div
                  className={`absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs transition-transform group-hover:scale-125 ${
                    isCompleted ? 'bg-teal-700 ring-2 ring-teal-200' : 'bg-amber-500 ring-2 ring-amber-200'
                  }`}
                />

                {/* Date & Time Bar + Status Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <Clock size={12} className="text-teal-700" />
                    <span>{formatDateDisplay(rec.recordDate)}</span>
                    <span>·</span>
                    <span className="text-slate-400">{formatTimeDisplay(rec.recordDate)}</span>
                  </span>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold border shadow-2xs ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {rec.statusLabel}
                  </span>
                </div>

                {/* Content Card with Hover Effect */}
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-1.5 text-xs hover:bg-white hover:shadow-md hover:border-teal-200 transition-all duration-200">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles size={14} className="text-teal-600 shrink-0" />
                    <span>{rec.diagnosis}</span>
                  </h4>

                  <div className="flex items-center gap-1 text-slate-600 text-[11.5px] pt-0.5">
                    <Stethoscope size={12} className="text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Nha sĩ phụ trách:</span>
                    <span className="font-bold text-slate-800">{rec.dentistName}</span>
                  </div>

                  <p className="text-slate-600 text-xs bg-white/80 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Nội dung thủ thuật:</span>
                    <span className="font-medium text-slate-700">{rec.treatmentNotes}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-400 font-medium">Chi phí dịch vụ</span>
                    <span className="text-teal-800 font-black text-sm">{rec.cost}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
