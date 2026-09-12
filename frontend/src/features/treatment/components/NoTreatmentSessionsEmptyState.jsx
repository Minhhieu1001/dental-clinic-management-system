import React from 'react';
import {
  Layers,
  Plus,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Stethoscope,
  Activity,
  CalendarPlus,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

/**
 * Empty state component khi bệnh nhân chưa có bất kỳ đợt điều trị nào
 * Thay thế Sơ đồ răng (Odontogram) để ngăn chặn việc vẽ răng / khám khi chưa có đợt điều trị.
 */
export default function NoTreatmentSessionsEmptyState({
  patient,
  onOpenCreateSessionModal,
  onNavigateToTreatmentPlans,
  onNavigateToMedicalRecords,
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-teal-200/90 bg-gradient-to-b from-teal-50/50 via-white to-slate-50/60 p-6 sm:p-10 text-center shadow-xs space-y-6 my-3 animate-in fade-in zoom-in-98 duration-200">
      {/* Icon lớn với vòng sáng */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-teal-400/20 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-lg shadow-teal-700/20 border-2 border-teal-100">
          <CalendarPlus size={36} />
        </div>
      </div>

      {/* Tiêu đề & Thông điệp giải thích */}
      <div className="max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
          <Layers size={13} />
          <span>Chưa có đợt khám / điều trị nào</span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          Bệnh nhân {patient?.fullName ? `"${patient.fullName}"` : ''} chưa có đợt điều trị nào được khởi tạo
        </h3>

        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
          Sơ đồ 32 răng (Odontogram), phân tích phim X-quang AI và chẩn đoán ICD-10 cần được lưu trữ theo từng đợt khám cụ thể.
          Vui lòng bấm nút <strong>&ldquo;+ Khởi tạo đợt điều trị mới&rdquo;</strong> bên dưới để bắt đầu phiên khám bệnh.
        </p>
      </div>

      {/* Thẻ minh họa quy trình 3 bước */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="rounded-xl border border-teal-200/70 bg-white/90 p-3 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[11px]">1</span>
            <span>Khởi tạo đợt khám</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Xác nhận ngày khám, nha sĩ phụ trách và lý do điều trị để tránh tạo đợt trùng lặp.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px]">2</span>
            <span>Khám & Sơ đồ 32 răng</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Ghi nhận tình trạng sâu răng, nha chu, lung lay trực tiếp trên Odontogram giải phẫu.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px]">3</span>
            <span>Chẩn đoán & Phác đồ</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Kết luận chẩn đoán chuẩn ICD-10 và chuyển sang lập kế hoạch phác đồ điều trị chi tiết.
          </p>
        </div>
      </div>

      {/* Khu vực nút kêu gọi hành động (CTA) */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenCreateSessionModal}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-teal-700/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>Khởi tạo đợt điều trị mới</span>
        </button>

        {onNavigateToTreatmentPlans && (
          <button
            type="button"
            onClick={onNavigateToTreatmentPlans}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={15} className="text-teal-700" />
            <span>Xem Kế hoạch điều trị &rarr;</span>
          </button>
        )}

        {onNavigateToMedicalRecords && (
          <button
            type="button"
            onClick={onNavigateToMedicalRecords}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <ClipboardList size={15} className="text-slate-500" />
            <span>Hồ sơ bệnh án</span>
          </button>
        )}
      </div>
    </div>
  );
}
