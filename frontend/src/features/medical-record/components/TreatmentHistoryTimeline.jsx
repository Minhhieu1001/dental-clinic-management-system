import React, { useState } from 'react';
import {
  Clock,
  CalendarCheck,
  Calendar,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Eye,
  ExternalLink,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  DollarSign,
  User,
  Info,
} from 'lucide-react';
import TreatmentHistoryDetailModal, {
  DIAGNOSIS_LEVEL_MAP,
} from '../action/TreatmentHistoryDetailModal';

// Bảng tra cứu tên bệnh theo mã ICD-10 nha khoa thông dụng
const ICD10_LABELS = {
  'K02': 'Sâu răng',
  'K02.0': 'Sâu men răng',
  'K02.1': 'Sâu ngà răng',
  'K02.2': 'Sâu xê-măng răng',
  'K02.9': 'Sâu răng không xác định',
  'K04': 'Bệnh tủy và mô quanh chóp',
  'K04.0': 'Viêm tủy răng',
  'K04.1': 'Hoại tử tủy răng',
  'K04.4': 'Viêm quanh chóp cấp',
  'K04.5': 'Viêm quanh chóp mãn tính',
  'K05': 'Viêm nướu và bệnh nha chu',
  'K05.0': 'Viêm nướu cấp tính',
  'K05.1': 'Viêm nướu mãn tính',
  'K05.3': 'Viêm nha chu mãn tính',
  'K07': 'Sai lệch vị trí răng & khớp cắn',
  'K07.2': 'Sai khớp cắn',
  'K07.3': 'Bất thường vị trí răng (lệch, mọc ngầm)',
  'K08.1': 'Mất răng do tai nạn, nhổ răng',
};

// Hàm định dạng tiền tệ VNĐ
const formatVND = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(value)) return null;
  return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ';
};

// Hàm định dạng ngày tháng hiển thị
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Hàm định dạng giờ phút hiển thị
const formatTimeDisplay = (dateStr) => {
  if (!dateStr) return '';
  try {
    const str = String(dateStr);
    if (str.includes('T')) {
      return str.split('T')[1].substring(0, 5);
    }
    return '';
  } catch {
    return '';
  }
};

// Lấy thông tin hiển thị trạng thái Kế hoạch điều trị
const getPlanStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
        dot: 'bg-emerald-500',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang điều trị',
        bg: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-100',
        dot: 'bg-sky-500',
      };
    case 'PENDING':
    case 'NEW':
      return {
        label: 'Chờ điều trị',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
        dot: 'bg-amber-500',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status || 'Chờ lên phác đồ',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-100',
        dot: 'bg-slate-400',
      };
  }
};

// Lấy thông tin hiển thị trạng thái Giai đoạn điều trị (Phase)
const getPhaseStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang thực hiện',
        className: 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse',
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ thực hiện',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      };
  }
};

export default function TreatmentHistoryTimeline({
  records = [],
  loading = false,
  patient = null,
  onRefresh,
  onStartExam,
  onOpenPlan,
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleOpenDetail = (rec) => {
    setSelectedRecord(rec);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* ========================================================================= */}
      {/* 1. HEADER: TIÊU ĐỀ, ĐẾM SỐ LƯỢNG & NÚT LÀM MỚI DỮ LIỆU THẬT */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs">
            <CalendarCheck size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Lịch Sử Điều Trị</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-black border ${records.length > 0
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
              >
                {records.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Dữ liệu đợt khám & kế hoạch điều trị thực tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Làm mới dữ liệu từ máy chủ"
              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOADING STATE: SKELETON */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="space-y-4 py-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
              </div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-12 bg-white/80 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        /* 3. EMPTY STATE: CHƯA CÓ LỊCH SỬ ĐIỀU TRỊ */
        <div className="flex flex-col items-center justify-center text-center p-7 space-y-3.5 bg-gradient-to-b from-slate-50/70 via-slate-50/30 to-white rounded-2xl border border-dashed border-slate-200/90 shadow-2xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 shadow-2xs">
            <ClipboardList size={26} className="stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h4 className="text-sm font-black text-slate-800 tracking-tight">
              Chưa có lịch sử điều trị
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bệnh nhân chưa có dữ liệu kết quả khám lâm sàng hoặc kế hoạch điều trị nào được ghi nhận.
            </p>
          </div>
          {onStartExam && (
            <button
              type="button"
              onClick={onStartExam}
              className="mt-1 flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold shadow-sm hover:shadow-teal-700/20 transition-all cursor-pointer"
            >
              <Stethoscope size={14} />
              <span>Bắt đầu phiên khám mới &rarr;</span>
            </button>
          )}
        </div>
      ) : (
        /* 4. TIMELINE LIST: HIỂN THỊ TÓM TẮT ĐẦY ĐỦ (TỐI ĐA 3 ITEM RỒI SCROLL) */
        <div className="max-h-[855px] overflow-y-auto pr-1.5 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-teal-600 before:via-slate-200 before:to-slate-100">
            {records.map((rec) => {
              const planBadge = getPlanStatusBadge(rec.status);
              const timeStr = formatTimeDisplay(rec.startDate);
              const dateStr = formatDateDisplay(rec.startDate);

              return (
                <div key={rec.id} className="relative space-y-2 group">
                  {/* Node Tròn trên thanh Timeline với vòng sáng */}
                  <div
                    className={`absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs transition-transform group-hover:scale-125 ${planBadge.dot} ring-2 ring-slate-200`}
                  />

                  {/* DÒNG 1: THỜI GIAN BẮT ĐẦU (examinationResult) + TRẠNG THÁI (treatmentPlan) */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Clock size={12.5} className="text-teal-700 shrink-0" />
                      <span>{dateStr}</span>
                      {timeStr && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-semibold">{timeStr}</span>
                        </>
                      )}
                    </div>

                    {/* Trạng thái từ bảng treatmentPlan */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black border shadow-2xs shrink-0 ${planBadge.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${planBadge.dot}`}></span>
                      {planBadge.label}
                    </span>
                  </div>

                  {/* THẺ TÓM TẮT CA ĐIỀU TRỊ */}
                  <div
                    onClick={() => handleOpenDetail(rec)}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white p-3.5 space-y-2.5 text-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 cursor-pointer"
                  >
                    {/* TÊN KẾ HOẠCH ĐIỀU TRỊ & TỔNG CHI PHÍ */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100/90 pb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-teal-600 shrink-0" />
                          <h4 className="font-extrabold text-slate-900 text-[13px] leading-snug group-hover:text-teal-800 transition-colors">
                            {rec.planName || 'Chưa đặt tên kế hoạch'}
                          </h4>
                        </div>
                        {rec.planDescription && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 pl-4">
                            {rec.planDescription}
                          </p>
                        )}
                      </div>

                      {rec.estimatedCost && (
                        <span className="text-teal-800 font-black text-xs shrink-0 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                          {formatVND(rec.estimatedCost)}
                        </span>
                      )}
                    </div>

                    {/* BÁC SĨ PHỤ TRÁCH & LÝ DO KHÁM BỆNH */}
                    <div className="space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                      {/* Bác sĩ phụ trách */}
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11.5px]">
                        <Stethoscope size={13} className="text-teal-600 shrink-0" />
                        <span className="text-slate-400 font-medium">Bác sĩ phụ trách:</span>
                        <span className="font-bold text-slate-800">{rec.dentistName || 'Chưa phân công'}</span>
                      </div>

                      {/* Lý do khám bệnh (chiefComplaint của examinationResult) */}
                      <div className="flex items-start gap-1.5 text-slate-600 text-[11.5px] pt-0.5 border-t border-slate-50">
                        <Activity size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">
                          <span className="text-slate-400 font-medium">Lý do khám: </span>
                          <span className="font-semibold text-slate-700">
                            {rec.chiefComplaint || 'Không có ghi chú'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CHUẨN ĐOÁN LÀ GÌ (diagnoses) */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <FileText size={11} className="text-slate-400" />
                        <span>Chẩn đoán:</span>
                      </div>

                      {Array.isArray(rec.diagnoses) && rec.diagnoses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {rec.diagnoses.map((diag, dIdx) => {
                            const code = diag.primaryDiagnosis || '';
                            const friendlyName = ICD10_LABELS[code] || diag.primaryDiagnosis || 'Chẩn đoán nha khoa';
                            const tooth = diag.toothPosition ? `[Răng: ${diag.toothPosition}] ` : '';

                            return (
                              <span
                                key={diag.id || dIdx}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50/70 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-medium text-indigo-900"
                              >
                                <span className="font-bold text-indigo-700">{tooth}</span>
                                <span>{code ? `${code} - ` : ''}{friendlyName}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400 pl-1">
                          Chưa ghi nhận mã chẩn đoán lâm sàng
                        </p>
                      )}
                    </div>

                    {/* TÊN CÁC GIAI ĐOẠN VÀ TRẠNG THÁI GIAI ĐOẠN */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Layers size={12} className="text-teal-600" />
                          <span>Các giai đoạn điều trị ({rec.phases?.length || 0}):</span>
                        </span>
                      </div>

                      {Array.isArray(rec.phases) && rec.phases.length > 0 ? (
                        <div className="space-y-1">
                          {rec.phases.map((phase, pIdx) => {
                            const pBadge = getPhaseStatusBadge(phase.status);
                            const visitCount = phase.treatmentVisits?.length || 0;

                            return (
                              <div
                                key={phase.id || pIdx}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-100 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                                    {pIdx + 1}
                                  </span>
                                  <span className="font-bold text-slate-800 truncate">
                                    {phase.phaseName || `Giai đoạn ${pIdx + 1}`}
                                  </span>
                                  {visitCount > 0 && (
                                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                      ({visitCount} buổi hẹn)
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${pBadge.className}`}
                                >
                                  {pBadge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic bg-white/70 p-2 rounded-lg border border-slate-100">
                          Chưa phân giai đoạn điều trị
                        </div>
                      )}
                    </div>

                    {/* THAO TÁC XEM CHI TIẾT & CHUYỂN TỚI KẾ HOẠCH ĐIỀU TRỊ */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/90 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(rec);
                        }}
                        className="inline-flex items-center gap-1 text-[11.5px] font-bold text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
                      >
                        <Eye size={12.5} />
                        <span>Xem chi tiết ca khám</span>
                      </button>

                      {onOpenPlan && rec.treatmentPlanId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlan(rec);
                          }}
                          className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          <span>Mở phác đồ</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: XEM CHI TIẾT ĐỢT KHÁM & KẾ HOẠCH ĐIỀU TRỊ ĐẦY ĐỦ (ACTION TSX) */}
      {/* ========================================================================= */}
      <TreatmentHistoryDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
        record={selectedRecord}
        patient={patient}
        onOpenPlan={onOpenPlan}
      />

    </div>
  );
}
