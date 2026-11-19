import React from 'react';
import {
  Layers,
  Plus,
  CalendarPlus,
  Sparkles,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';

/**
 * Empty state component khi bệnh nhân chưa có bất kỳ đợt điều trị nào
 * Thiết kế nổi bật, tinh gọn, tập trung duy nhất vào nút Tạo đợt khám mới.
 */
export default function NoTreatmentSessionsEmptyState({
  patient,
  onOpenCreateSessionModal,
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/70 via-white to-emerald-50/30 p-8 sm:p-12 text-center shadow-xs space-y-6 my-3 animate-in fade-in zoom-in-98 duration-200">
      {/* Icon lớn với hiệu ứng hào quang */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-teal-400/25 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-lg shadow-teal-700/25 border-2 border-teal-100">
          <CalendarPlus size={36} />
        </div>
      </div>

      {/* Tiêu đề & Thông điệp giải thích */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200 shadow-2xs">
          <Layers size={13} className="text-amber-700" />
          <span>Chưa có đợt khám / điều trị nào</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Bệnh nhân {patient?.fullName ? `"${patient.fullName}"` : ''} chưa có đợt điều trị nào
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Khởi tạo đợt khám ngay để bắt đầu ghi nhận sơ đồ 32 răng, kết luận chẩn đoán chuẩn ICD-10 và thiết lập phác đồ điều trị.
        </p>
      </div>

      {/* Thẻ minh họa quy trình 3 bước (Làm mờ bước sau, làm nổi bật bước 1) */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="rounded-xl border-2 border-teal-500/80 bg-teal-50/80 p-3.5 shadow-2xs space-y-1 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-700 text-white">
              Bước 1
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-900 font-extrabold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white text-[11px] font-bold">1</span>
            <span>Khởi tạo đợt khám</span>
          </div>
          <p className="text-[11px] text-teal-800/80 leading-tight font-medium">
            Xác nhận ngày khám, nha sĩ phụ trách và lý do điều trị để mở sơ đồ răng.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-3.5 shadow-2xs space-y-1 opacity-70">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[11px]">2</span>
            <span>Khám & Sơ đồ 32 răng</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Ghi nhận tình trạng sâu răng, nha chu, lung lay trên Odontogram giải phẫu.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-3.5 shadow-2xs space-y-1 opacity-70">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[11px]">3</span>
            <span>Chẩn đoán & Phác đồ</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Kết luận chẩn đoán chuẩn và chuyển sang lập kế hoạch phác đồ điều trị.
          </p>
        </div>
      </div>

      {/* Khu vực nút kêu gọi hành động duy nhất (Tập trung toàn bộ vào tạo đợt khám) */}
      <div className="pt-3 flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={onOpenCreateSessionModal}
          className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-8 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-teal-700/25 hover:shadow-xl hover:shadow-teal-700/35 hover:from-teal-800 hover:to-emerald-700 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
            <Plus size={20} strokeWidth={3} />
          </span>
          <span className="tracking-wide">Khởi tạo đợt điều trị mới</span>
          <ChevronRight size={18} className="text-teal-200 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-[11px] text-slate-400 font-medium">
          Nhấn để mở biểu mẫu xác nhận ngày khám, bác sĩ phụ trách và lý do điều trị
        </p>
      </div>
    </div>
  );
}
