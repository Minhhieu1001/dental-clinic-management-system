import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Activity,
  Trash2,
  Edit3,
  Plus,
  ShieldCheck,
  BrainCircuit,
  Eye,
  AlertCircle,
  Search,
  Filter,
  Layers,
  FileCheck,
  Lock,
  Save,
} from 'lucide-react';

import { useClinicalExam } from '../ClinicalExamContext';
import {
  getCariesDepthLabel,
} from '../clinicalExaminationHelpers';
import { DiagnosisModal } from '../action/DiagnosisModal';

// 3 Dữ liệu giả tượng trưng cho kết quả phân tích X-quang và AI
const MOCK_AI_DETECTIONS = [
  {
    id: 'ai-tooth-46',
    toothNumber: 46,
    toothPosition: 'Răng 46',
    finding: 'Sâu ngà men (Enamel-Dentin Caries)',
    location: 'Mặt nhai & mặt xa (Xoang II)',
    confidence: 96.8,
    icdCode: 'K02.1',
    severity: 'Trung bình',
    recommendation: 'Trám răng Composite quang trùng hợp xoang II',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'from-rose-500 to-red-600',
  },
  {
    id: 'ai-tooth-28',
    toothNumber: 28,
    toothPosition: 'Răng 28',
    finding: 'Răng khôn mọc kẹt nghiêng gần 45°',
    location: 'Chân răng sát ống thần kinh dưới',
    confidence: 93.4,
    icdCode: 'K07.3',
    severity: 'Nặng',
    recommendation: 'Tiểu phẫu nhổ răng khôn bằng máy Piezotome',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    barColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'ai-tooth-11',
    toothNumber: 11,
    toothPosition: 'Răng 11',
    finding: 'Viêm quanh chóp mạn tính / Vùng thấu quang',
    location: 'Vùng cuống chóp chân răng 11 (~3mm)',
    confidence: 89.5,
    icdCode: 'K04.5',
    severity: 'Nặng',
    recommendation: 'Điều trị nội nha chữa tủy & bọc sứ bảo tồn',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    barColor: 'from-purple-500 to-indigo-600',
  },
];

export default function DoctorDiagnosisTab() {
  const {
    examinedTeeth,
    diagnosisList,
    handleRemoveDiagnosisItem,
    handleSaveDiagnosisFromModal,
    handleConfirmDiagnosis,
    handleCreateTreatmentPlan,
    setActiveTab,
    isHistoricalSession,
  } = useClinicalExam();

  // State quản lý Modal Chẩn Đoán Y Khoa (Dùng chung cho cả Thêm & Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' | 'EDIT'
  const [modalInitialData, setModalInitialData] = useState(null);

  // Bộ lọc bảng hồ sơ răng lâm sàng
  const [toothSearchQuery, setToothSearchQuery] = useState('');
  const [filterOnlyAbnormal, setFilterOnlyAbnormal] = useState(false);

  // Danh sách các răng đã phát hiện bất thường từ Bước 1
  const abnormalTeethFromStep1 = useMemo(() => {
    return examinedTeeth.filter(
      (t) => t.cariesStatus === 'YES' || t.hasCaries || t.toothStatus !== 'HEALTHY' || t.toothStatusLabel !== 'Bình thường'
    );
  }, [examinedTeeth]);

  // Lọc danh sách răng hiển thị trong Bảng 1
  const filteredExaminedTeeth = useMemo(() => {
    return examinedTeeth.filter((t) => {
      if (filterOnlyAbnormal) {
        const isAbn = t.cariesStatus === 'YES' || t.hasCaries || t.toothStatus !== 'HEALTHY';
        if (!isAbn) return false;
      }
      if (toothSearchQuery.trim()) {
        const q = toothSearchQuery.trim().toLowerCase();
        const tStr = String(t.toothNumber).toLowerCase();
        const statusStr = (t.toothStatusLabel || '').toLowerCase();
        const locStr = (t.cariesLocation || '').toLowerCase();
        return tStr.includes(q) || statusStr.includes(q) || locStr.includes(q);
      }
      return true;
    });
  }, [examinedTeeth, filterOnlyAbnormal, toothSearchQuery]);

  // Mở modal thêm chẩn đoán mới trống
  const handleOpenAddModal = () => {
    if (isHistoricalSession) return;
    setModalMode('ADD');
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  // Mở modal thêm chẩn đoán nhanh từ một răng đã khám ở Bảng 1
  const handleDiagnoseFromExaminedTooth = (toothRecord) => {
    if (isHistoricalSession) return;
    setModalMode('ADD');
    const isCaries = toothRecord.cariesStatus === 'YES' || toothRecord.hasCaries;
    setModalInitialData({
      scope: 'MULTI_TEETH',
      toothNumber: toothRecord.toothNumber,
      selectedTeeth: [Number(toothRecord.toothNumber)],
      primaryDiagnosis: isCaries ? 'K02.1' : 'K05.1',
      severity: toothRecord.cariesDepth === 'PULP' || toothRecord.cariesDepth === 'NEAR_PULP' ? 'Nặng' : 'Trung bình',
      notes: isCaries
        ? `Tổn thương sâu răng ${toothRecord.toothNumber}, vị trí: ${toothRecord.cariesLocation || 'Mặt nhai'}`
        : `Theo dõi định kỳ răng ${toothRecord.toothNumber}`,
      sources: ['Khám lâm sàng'],
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa một chẩn đoán đã lưu ở Bảng 3
  const handleOpenEditModal = (diagItem) => {
    if (isHistoricalSession) return;
    setModalMode('EDIT');
    setModalInitialData(diagItem);
    setIsModalOpen(true);
  };

  // Callback lưu từ Modal
  const handleSaveModal = async (payload, mode) => {
    if (handleSaveDiagnosisFromModal) {
      return await handleSaveDiagnosisFromModal(payload, mode);
    }
    return true;
  };

  return (
    <div className="space-y-5">
      {/* =========================================================================
       * THANH CHỈ SỐ KPI TỔNG QUAN LÂM SÀNG (ENTERPRISE CLINICAL KPI CARDS)
       * ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Số răng đã khám */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Răng đã ghi nhận
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {examinedTeeth.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">/ 32 răng</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
            <Stethoscope size={20} />
          </div>
        </div>

        {/* KPI 2: Răng có bệnh lý */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Răng có tổn thương
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
                {abnormalTeethFromStep1.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">răng</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* KPI 3: Phát hiện AI Copilot */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Đề xuất AI Copilot
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-purple-900 font-mono">
                3
              </span>
              <span className="text-xs font-semibold text-slate-400">phát hiện</span>
            </div>

          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
            <BrainCircuit size={20} />
          </div>
        </div>

        {/* KPI 4: Chẩn đoán đã xác lập */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Kết luận chẩn đoán
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono">
                {diagnosisList.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">kết luận</span>
            </div>

          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white shadow-2xs shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* =========================================================================
       * KHỐI TRÊN: 2 BẢNG THÔNG TIN LÂM SÀNG & KẾT QUẢ PHÂN TÍCH AI (TỈ LỆ 60% : 40%, CHIỀU CAO ĐỒNG BỘ)
       * ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch">
        {/* BẢNG 1 (CỘT TRÁI - 60% DIỆN TÍCH): Danh sách hồ sơ răng lâm sàng đã ghi nhận */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col h-[330px]">
          {/* Header Bảng 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50/80 gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs shrink-0">
                <Stethoscope size={15} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>HỒ SƠ RĂNG LÂM SÀNG ĐÃ GHI NHẬN</span>
                  <span className="rounded-full bg-teal-100 text-teal-900 text-[10.5px] font-extrabold px-2 py-0.2 border border-teal-200">
                    {filteredExaminedTeeth.length} / {examinedTeeth.length}
                  </span>
                </h3>
              </div>
            </div>

            {/* Công cụ tìm kiếm & lọc nhanh */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={toothSearchQuery}
                  onChange={(e) => setToothSearchQuery(e.target.value)}
                  placeholder="Lọc răng..."
                  className="w-24 sm:w-28 pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white focus:border-teal-600 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setFilterOnlyAbnormal(!filterOnlyAbnormal)}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${filterOnlyAbnormal
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                title="Chỉ hiển thị các răng có phát hiện bệnh lý"
              >
                <Filter size={11} />
                <span>Chỉ răng sâu</span>
              </button>
            </div>
          </div>

          {/* Nội dung Bảng 1: Cuộn dọc khi vượt quá chiều cao */}
          <div className="p-3 overflow-x-auto overflow-y-auto flex-1 min-h-0">
            {filteredExaminedTeeth.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                <AlertCircle size={22} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-xs">
                  {examinedTeeth.length === 0
                    ? 'Chưa có răng nào được ghi nhận'
                    : 'Không tìm thấy răng khớp với bộ lọc'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10 shadow-2xs">
                  <tr className="border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2.5">Răng</th>
                    <th className="py-2 px-2.5">Tình trạng</th>
                    <th className="py-2 px-2.5">Tổn thương & Mức độ</th>
                    <th className="py-2 px-2">Triệu chứng đau</th>
                    <th className="py-2 px-2 text-center w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExaminedTeeth.map((t, idx) => {
                    const hasCaries = t.cariesStatus === 'YES' || t.hasCaries;
                    const isAbnormal = hasCaries || t.toothStatus !== 'HEALTHY';

                    return (
                      <tr key={t.toothNumber || idx} className="hover:bg-teal-50/30 transition-colors">
                        <td className="py-2 px-2 font-mono text-slate-400 text-center text-[10.5px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="inline-flex items-center gap-1 font-black text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-mono text-xs shadow-2xs">
                            R{t.toothNumber}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-extrabold border ${isAbnormal
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                          >
                            {t.toothStatusLabel || (hasCaries ? 'Sâu răng' : 'Bình thường')}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 text-[11px]">
                          {hasCaries ? (
                            <span>
                              <strong className="text-slate-900">{getCariesDepthLabel(t.cariesDepth)}</strong>
                              {t.cariesLocation && t.cariesLocation !== 'Bình thường' ? ` · ${t.cariesLocation}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">Không sâu</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-600 text-[10.5px]">
                          {t.painLevel === 'STIMULATED' ? (
                            <span className="text-amber-800 font-semibold">Khi kích thích</span>
                          ) : t.painLevel === 'SPONTANEOUS' ? (
                            <span className="text-rose-700 font-bold">Đau tự phát</span>
                          ) : (
                            <span className="text-slate-400">Không đau</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            disabled={isHistoricalSession}
                            onClick={() => handleDiagnoseFromExaminedTooth(t)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10.5px] transition-all shadow-2xs ${isHistoricalSession
                              ? 'cursor-not-allowed'
                              : 'bg-teal-50 text-teal-800 hover:bg-teal-700 hover:text-white border border-teal-200 cursor-pointer'
                              }`}
                            title={isHistoricalSession ? 'Đợt khám đã kết thúc / đã khóa kết quả' : `Mở modal lập chẩn đoán cho Răng ${t.toothNumber}`}
                          >
                            {isHistoricalSession ? <Lock size={11} /> : <Plus size={11} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* BẢNG 2 (CỘT PHẢI - 40% DIỆN TÍCH): Kết quả phân tích & Đề xuất AI Copilot */}
        <div className="lg:col-span-4 rounded-2xl border border-purple-200/90 bg-white shadow-2xs overflow-hidden flex flex-col h-[330px]">
          {/* Header Bảng 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-200 px-4 py-2.5 bg-purple-50/60 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-700 text-white shadow-2xs shrink-0">
                <BrainCircuit size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    ĐỀ XUẤT PHÂN TÍCH AI
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Nội dung Bảng 2: Cuộn dọc khi vượt quá chiều cao */}
          <div className="p-3 overflow-x-auto overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-purple-50 z-10 shadow-2xs">
                <tr className="border-b border-purple-100 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2 px-2.5 w-14">Vị trí</th>
                  <th className="py-2 px-2.5">Tổn thương AI nhận diện</th>
                  <th className="py-2 px-2 text-center w-20">Độ tin cậy</th>
                  <th className="py-2 px-2.5">Khuyến nghị xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {MOCK_AI_DETECTIONS.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="py-2 px-2.5">
                      <span className="inline-block font-mono font-black text-purple-950 bg-purple-100/90 border border-purple-200 px-2 py-0.5 rounded-md text-xs shadow-2xs">
                        R{item.toothNumber}
                      </span>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-bold text-slate-900 text-xs leading-tight">
                        {item.finding}
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        {item.location}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-extrabold text-[11px] text-purple-900 font-mono">
                          {item.confidence}%
                        </span>
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5 border border-slate-200/80">
                          <div
                            className={`h-full bg-gradient-to-r ${item.barColor} rounded-full`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 text-[11px]">
                      <div className="font-medium line-clamp-2">
                        {item.recommendation}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * KHỐI DƯỚI: BẢNG DANH MỤC KẾT LUẬN CHẨN ĐOÁN ĐỢT KHÁM CỦA BÁC SĨ (FULL WIDTH)
       * ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 text-xs">
        {/* Header Danh Mục Chẩn Đoán Chuẩn ERP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs shrink-0">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  KẾT LUẬN CHUẨN ĐOÁN ĐỢT KHÁM
                </h4>
                <span className="rounded-md bg-teal-100 text-teal-900 text-xs font-black px-2.5 py-1 border border-teal-300">
                  {diagnosisList.length} chẩn đoán chính thức
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium pt-0.5">
                Căn cứ y khoa xác lập phác đồ điều trị.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={handleOpenAddModal}
              className={`${isHistoricalSession ? 'hidden' : 'inline-flex'
                } items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-all bg-teal-700 hover:bg-teal-800 active:scale-95 text-white cursor-pointer`}
            >
              <span>Thêm kết luận chẩn đoán</span>
            </button>
          </div>
        </div>

        {/* Bảng Danh mục Chẩn Đoán */}
        {diagnosisList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 mx-auto">
              <Stethoscope size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs sm:text-sm">
                Chưa có kết luận chẩn đoán nào được lưu trong đợt khám này
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-40">Phạm vi / Răng</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Chẩn đoán (Mã ICD-10)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Mức độ</th>
                  <th className="py-2.5 px-3 min-w-[190px]">Chỉ định phác đồ & Ghi chú</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Căn cứ chẩn đoán</th>
                  <th className="py-2.5 px-3 w-24 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {diagnosisList.map((item, idx) => {
                  const isFullMouth = item.scope === 'FULL_MOUTH' || item.toothPosition === 'Toàn hàm';
                  const isUpper = item.scope === 'UPPER_JAW' || item.toothPosition?.includes('Hàm trên');
                  const isLower = item.scope === 'LOWER_JAW' || item.toothPosition?.includes('Hàm dưới');

                  return (
                    <tr
                      key={item.id || idx}
                      onDoubleClick={() => !isHistoricalSession && handleOpenEditModal(item)}
                      className={`transition-colors ${isHistoricalSession
                        ? 'hover:bg-slate-50 cursor-default'
                        : 'hover:bg-teal-50/40 cursor-pointer'
                        }`}
                      title={isHistoricalSession ? 'Đợt khám đã kết thúc (chỉ xem)' : 'Nhấp đúp chuột để chỉnh sửa chẩn đoán này'}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-center text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-extrabold border ${isFullMouth
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : isUpper || isLower
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-teal-50 text-teal-800 border-teal-200 font-mono'
                            }`}
                        >
                          {isFullMouth ? 'Toàn hàm' : item.toothPosition}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-xs">
                          {item.label || item.primaryDiagnosis}
                        </div>
                        {item.primaryDiagnosis && (
                          <div className="text-[10px] font-mono font-bold text-teal-700 mt-0.5">
                            Mã ICD: {item.primaryDiagnosis}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${item.severity === 'Nặng'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.severity === 'Nhẹ'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                        >
                          {item.severity || 'Trung bình'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                        {item.notes ? (
                          <span className="font-medium">&quot;{item.notes}&quot;</span>
                        ) : (
                          <span className="text-slate-300 not-italic">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {item.sources && item.sources.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.sources.map((src, sIdx) => (
                              <span
                                key={sIdx}
                                className="bg-slate-100 text-slate-600 text-[9.5px] font-semibold px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isHistoricalSession ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <Lock size={12} />
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="text-slate-400 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Chỉnh sửa chẩn đoán này"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDiagnosisItem(item.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Xóa chẩn đoán này khỏi đợt khám"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-end pt-3 border-t border-slate-200">

        <button
          type="button"
          onClick={handleCreateTreatmentPlan}
          className="flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-800 active:scale-95 transition-all cursor-pointer"
        >
          <span>Chuyển sang Lập Kế Hoạch Điều Trị</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* =========================================================================
       * MODAL XÁC NHẬN & CẬP NHẬT CHẨN ĐOÁN Y KHOA (CHUYỂN TỪ FORM CŨ THÀNH MODAL)
       * ========================================================================= */}
      {isModalOpen && (
        <DiagnosisModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalInitialData(null);
          }}
          mode={modalMode}
          initialData={modalInitialData}
          onSave={handleSaveModal}
          abnormalTeethFromStep1={abnormalTeethFromStep1}
        />
      )}
    </div>
  );
}
