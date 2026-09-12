import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Activity,
  Layers,
  CheckSquare,
  Trash2,
  Save,
  Check,
  Smile,
  ShieldCheck,
  BrainCircuit,
  Eye,
  Tag,
  Plus,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

import { useClinicalExam } from '../ClinicalExamContext';
import {
  ICD10_DIAGNOSES,
  SEVERITY_OPTIONS,
  DIAGNOSIS_SCOPE_OPTIONS,
  getToothQuadrantLabel,
  getCariesDepthLabel,
  UPPER_TEETH,
  LOWER_TEETH,
} from '../clinicalExaminationHelpers';

// Danh sách các chỉ định điều trị nha khoa phổ biến nhất để bác sĩ bấm chọn nhanh
const COMMON_INDICATION_TAGS = [
  'Trám răng Composite',
  'Điều trị tủy (Nội nha)',
  'Bọc răng sứ Zirconia',
  'Cạo vôi răng & Đánh bóng',
  'Tiểu phẫu nhổ răng khôn',
  'Cấy ghép Implant',
  'Niềng răng chỉnh nha',
  'Tẩy trắng răng thẩm mỹ',
  'Chụp X-quang kiểm tra',
  'Kê đơn kháng sinh & giảm đau',
  'Tái khám sau 1 tuần',
  'Theo dõi định kỳ 6 tháng',
];

export default function DoctorDiagnosisTab() {
  const {
    selectedTooth,
    setSelectedTooth,
    examinedTeeth,
    diagnosisScope,
    setDiagnosisScope,
    selectedTeethList,
    setSelectedTeethList,
    diagnosisList,
    isSavingDiagnosis,
    handleRemoveDiagnosisItem,
    handleSelectDiagnosisRow,
    mainDiagnosis,
    setMainDiagnosis,
    severity,
    setSeverity,
    diagnosisNotes,
    setDiagnosisNotes,
    sources,
    setSources,
    handleConfirmDiagnosis,
    resetDiagnosisForm,
    handleCreateTreatmentPlan,
    setActiveTab,
  } = useClinicalExam();

  // Danh sách các răng đã phát hiện bất thường từ Bước 1
  const abnormalTeethFromStep1 = examinedTeeth.filter(
    (t) => t.cariesStatus === 'YES' || t.toothStatus !== 'HEALTHY' || t.toothStatusLabel !== 'Bình thường'
  );

  // State quản lý xem chi tiết răng nào đã khám ở khối Hình 1 (hoàn toàn độc lập với form chẩn đoán Hình 2)
  const [previewToothNumber, setPreviewToothNumber] = useState(
    examinedTeeth[0]?.toothNumber || 46
  );

  useEffect(() => {
    if (examinedTeeth.length > 0 && !examinedTeeth.some((t) => t.toothNumber === previewToothNumber)) {
      setPreviewToothNumber(examinedTeeth[0].toothNumber);
    }
  }, [examinedTeeth, previewToothNumber]);

  // Record của răng đang xem chi tiết ở khối Hình 1
  const activeToothRecord =
    examinedTeeth.find((t) => t.toothNumber === previewToothNumber) ||
    (examinedTeeth.length > 0 ? examinedTeeth[0] : null);

  const currentToothRecord = activeToothRecord;

  // Bấm nút răng đã khám ở Hình 1: chỉ đổi răng xem chi tiết ở Hình 1, KHÔNG ảnh hưởng form chẩn đoán
  const handleSelectExaminedTooth = (t) => {
    setPreviewToothNumber(t.toothNumber);
  };

  // Chẩn đoán hiện tại theo mã ICD-10
  const selectedIcdObj = ICD10_DIAGNOSES.find((d) => d.code === mainDiagnosis) || ICD10_DIAGNOSES[0];

  // Toggle chọn hoặc bỏ chọn răng trên sơ đồ răng ở Hình 2 (cho phép chọn nhiều răng, độc lập, không map form)
  const handleToggleToothInDiagram = (toothNo) => {
    setSelectedTeethList((prev) =>
      prev.includes(toothNo) ? prev.filter((t) => t !== toothNo) : [...prev, toothNo].sort((a, b) => a - b)
    );
  };

  // Bấm tag để tự động điền hoặc bỏ chọn chỉ định điều trị
  const handleToggleIndicationTag = (tag) => {
    setDiagnosisNotes((prev) => {
      const text = (prev || '').trim();
      if (!text) return tag;

      // Nếu đã có tag này trong ghi chú, bấm lại sẽ xóa tag đi (toggle off)
      if (text.includes(tag)) {
        const parts = text
          .split(/(\s*·\s*|,\s*|\n)/)
          .map((p) => p.trim())
          .filter((p) => p && p !== '·' && p !== ',' && p !== tag);
        return parts.join(' · ');
      }

      // Chưa có thì thêm vào sau
      return `${text} · ${tag}`;
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (5/12): Tổng hợp phát hiện khám (Dữ liệu thật) & Tách riêng khối AI bên dưới */}
        <div className="lg:col-span-5 space-y-4">
          {/* KHỐI 1: TỔNG HỢP PHÁT HIỆN KHÁM LÂM SÀNG BƯỚC 1 (MAP RA TOÀN BỘ CÁC RĂNG ĐÃ LƯU) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 text-xs">
            {/* Header Cột Trái */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="text-teal-600" size={18} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Tổng hợp phát hiện khám — Răng {activeToothRecord ? activeToothRecord.toothNumber : previewToothNumber}
                </h3>
              </div>
              <span className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">
                {getToothQuadrantLabel(activeToothRecord ? activeToothRecord.toothNumber : previewToothNumber)}
              </span>
            </div>

            {examinedTeeth.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-slate-400 text-xs">
                Chưa có răng nào được lưu ở Bước 1. Bạn có thể quay lại Bước 1 để ghi nhận tổn thương từng răng.
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. DÃY CÁC NÚT BẤM ỨNG VỚI TỪNG KẾT QUẢ KHÁM LÂM SÀNG */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Chọn kết quả răng đã khám ({examinedTeeth.length} răng):
                    </span>
                    <span className="text-[10px] text-slate-400 italic">
                      Nhấp nút để xem chi tiết kết quả khám lâm sàng
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {examinedTeeth.map((t) => {
                      const isCurrent = activeToothRecord?.toothNumber === t.toothNumber;
                      const hasCaries = t.cariesStatus === 'YES' || t.hasCaries;

                      return (
                        <button
                          key={t.toothNumber}
                          type="button"
                          onClick={() => handleSelectExaminedTooth(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${isCurrent
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-700/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300'
                            }`}
                        >
                          <span>Răng {t.toothNumber}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isCurrent
                                ? 'bg-white/20 text-white'
                                : hasCaries
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {t.toothStatusLabel || (hasCaries ? 'Sâu răng' : 'Bình thường')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CARD CHI TIẾT DUY NHẤT CHO RĂNG ĐANG ĐƯỢC CHỌN */}
                {activeToothRecord && (
                  <div className="rounded-xl p-3.5 sm:p-4 border border-teal-500 bg-teal-50/20 shadow-2xs space-y-3">
                    {/* Header card */}
                    <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="text-teal-700" size={16} />
                        <span className="font-bold text-teal-950 text-xs tracking-wide uppercase">
                          KẾT QUẢ KHÁM LÂM SÀNG BƯỚC 1
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-200 px-1.5 py-0.5 rounded">
                          R{activeToothRecord.toothNumber}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 font-bold text-xs text-teal-800">
                        <CheckCircle2 size={14} className="text-teal-600" />
                        <span>Đã khám R{activeToothRecord.toothNumber}</span>
                      </span>
                    </div>

                    {/* Chi tiết dữ liệu thật đầy đủ */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500">Tình trạng: </span>
                        <span className="font-bold text-slate-900">
                          {activeToothRecord.toothStatusLabel || 'Bình thường'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Sâu răng: </span>
                        <span
                          className={`font-bold ${activeToothRecord.cariesStatus === 'YES' || activeToothRecord.hasCaries
                              ? 'text-rose-700'
                              : 'text-slate-900'
                            }`}
                        >
                          {activeToothRecord.cariesStatus === 'YES' || activeToothRecord.hasCaries
                            ? 'Có sâu'
                            : 'Không sâu'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Vị trí sâu: </span>
                        <span className="font-bold text-slate-900">
                          {activeToothRecord.cariesLocation && activeToothRecord.cariesLocation !== 'Bình thường'
                            ? activeToothRecord.cariesLocation
                            : activeToothRecord.cariesStatus === 'YES' || activeToothRecord.hasCaries
                              ? 'Mặt nhai'
                              : 'Không có'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mức độ sâu: </span>
                        <span className="font-bold text-slate-900">
                          {getCariesDepthLabel(activeToothRecord.cariesDepth)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mức độ đau: </span>
                        <span className="font-bold text-slate-900">
                          {activeToothRecord.painLevel === 'STIMULATED'
                            ? 'Có khi kích thích'
                            : activeToothRecord.painLevel === 'SPONTANEOUS'
                              ? 'Đau tự phát'
                              : 'Không đau'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Nướu quanh răng: </span>
                        <span className="font-bold text-slate-900">
                          {activeToothRecord.gingivaStatus || 'Bình thường'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KHỐI 2: TÁCH RIÊNG BIỆT KHỐI AI TRÊN PHIM X-QUANG */}
          <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-2xs space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
                  <BrainCircuit size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Phát hiện AI trên phim X-quang
                </h3>
              </div>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-800 border border-purple-200">
                Độ tin cậy: 96.4%
              </span>
            </div>

            <div className="space-y-2 text-slate-700 text-[11px]">
              <p>
                <span className="text-slate-500">Tổn thương AI gợi ý: </span>
                <span className="font-bold text-purple-900">
                  {currentToothRecord?.cariesStatus === 'YES'
                    ? `Sâu ngà răng (Dentin Caries) — Vùng R${previewToothNumber}`
                    : currentToothRecord?.toothStatus === 'MISSING'
                      ? `Mất răng (Missing Tooth) — Vùng R${previewToothNumber}`
                      : currentToothRecord?.toothStatus === 'GINGIVITIS'
                        ? `Viêm nướu / Viêm nha chu — Vùng R${previewToothNumber}`
                        : `Hình ảnh răng giải phẫu R${previewToothNumber} ổn định`}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Vùng định vị: </span>
                <span className="font-medium text-slate-800">
                  {currentToothRecord?.cariesLocation && currentToothRecord?.cariesLocation !== 'Bình thường'
                    ? `${currentToothRecord.cariesLocation} Răng ${previewToothNumber}`
                    : `Mặt nhai & mặt gần Răng ${previewToothNumber}`}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Đánh giá chóp/tủy: </span>
                <span className="font-medium text-emerald-800">
                  Chưa ghi nhận thấu quang quanh chóp, màng xương liên tục
                </span>
              </p>
              <p>
                <span className="text-slate-500">Khuyến nghị AI: </span>
                <span className="font-semibold text-teal-800">
                  {currentToothRecord?.cariesStatus === 'YES'
                    ? 'Chỉ định trám răng Composite thẩm mỹ xoang II'
                    : 'Theo dõi định kỳ 6 tháng / lần'}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[11px] transition-colors shadow-2xs cursor-pointer"
            >
              <Eye size={13} />
              <span>Xem ảnh phim X-quang có khung AI ở Bước 2 &rarr;</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI (7/12): Form Chẩn đoán linh hoạt + Bảng danh sách chẩn đoán */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
            {/* Header Form */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Stethoscope className="text-teal-700" size={18} />
                  <span>Xác nhận chẩn đoán y khoa</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lựa chọn phạm vi (Toàn hàm / Theo răng), gán mã ICD-10 và đưa ra kết luận điều trị
                </p>
              </div>

              <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                ICD-10 Chuẩn
              </span>
            </div>

            {/* BƯỚC 1 CỦA FORM: CHỌN PHẠM VI CHẨN ĐOÁN (SCOPE PILLS) */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800 text-xs">
                1. Chọn phạm vi chẩn đoán (Scope):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {DIAGNOSIS_SCOPE_OPTIONS.map((scope) => {
                  const isActive = diagnosisScope === scope.key;
                  return (
                    <button
                      key={scope.key}
                      type="button"
                      onClick={() => {
                        setDiagnosisScope(scope.key);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${isActive
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/20 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs">
                        {scope.key === 'FULL_MOUTH' && <Smile size={14} className={isActive ? 'text-teal-700' : 'text-slate-500'} />}
                        {scope.key === 'MULTI_TEETH' && <CheckSquare size={14} className={isActive ? 'text-teal-700' : 'text-slate-500'} />}
                        {(scope.key === 'UPPER_JAW' || scope.key === 'LOWER_JAW') && (
                          <Layers size={14} className={isActive ? 'text-teal-700' : 'text-slate-500'} />
                        )}
                        <span>{scope.label}</span>
                      </div>
                      <span className={`text-[10px] mt-0.5 ${isActive ? 'text-teal-700 font-medium' : 'text-slate-400'}`}>
                        {scope.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BƯỚC 2 CỦA FORM: KHU VỰC VỊ TRÍ RĂNG THEO SCOPE */}
            {diagnosisScope === 'FULL_MOUTH' ? (
              <div className="rounded-lg bg-indigo-50/70 p-3 border border-indigo-200 text-indigo-900 text-[11px] flex items-start gap-2.5">
                <Smile size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-950">
                    Chẩn đoán áp dụng cho TOÀN HÀM (Chỉnh nha / Niềng răng / Thẩm mỹ)
                  </p>
                  <p className="text-indigo-800 text-[10px] mt-0.5">
                    Hệ thống sẽ lưu vị trí là <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold">Toàn hàm (FULL_MOUTH)</code>, không gán cố định số răng đơn lẻ. Khi lập kế hoạch điều trị, chi phí sẽ được tính theo gói trọn gói hoặc liệu trình chỉnh nha 2 hàm.
                  </p>
                </div>
              </div>
            ) : diagnosisScope === 'MULTI_TEETH' ? (
              <div className="space-y-2.5 rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs block">
                      Chọn các răng áp dụng chẩn đoán (Cho phép chọn nhiều răng):
                    </label>
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      {selectedTeethList.length > 0 ? (
                        <span>
                          Đang chọn: <strong className="text-teal-800">{selectedTeethList.map((n) => `R${n}`).join(', ')}</strong> ({selectedTeethList.length} răng)
                        </span>
                      ) : (
                        <span className="text-amber-700 italic font-medium">
                          Chưa chọn răng nào (bấm vào các răng bên dưới để chọn nhiều răng)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nút tiện ích chọn nhanh */}
                  <div className="flex items-center gap-1.5">
                    {abnormalTeethFromStep1.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const abnormalNums = abnormalTeethFromStep1.map((t) => t.toothNumber);
                          setSelectedTeethList(abnormalNums);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        title="Chọn nhanh các răng có phát hiện bệnh lý từ Bước 1"
                      >
                        + Chọn tất cả răng có bất thường ({abnormalTeethFromStep1.length})
                      </button>
                    )}
                    {selectedTeethList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTeethList([])}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                </div>

                {/* Chips chọn nhiều răng */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                  {[...UPPER_TEETH, ...LOWER_TEETH].map((tNo) => {
                    const isSelected = selectedTeethList.includes(tNo);
                    const isAbnormal = abnormalTeethFromStep1.some((t) => t.toothNumber === tNo);
                    return (
                      <button
                        key={`chip-${tNo}`}
                        type="button"
                        onClick={() => handleToggleToothInDiagram(tNo)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${isSelected
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs ring-2 ring-teal-500/30'
                          : isAbnormal
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        title={isSelected ? `Bỏ chọn R${tNo}` : `Chọn R${tNo}`}
                      >
                        {isSelected && <Check size={11} className="stroke-[3]" />}
                        <span>R{tNo}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-400 font-medium">
                  * Bấm vào từng răng để chọn hoặc bỏ chọn nhiều răng cùng lúc để áp dụng chung một chẩn đoán.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-sky-50 p-3 border border-sky-200 text-sky-900 text-[11px]">
                <span className="font-bold">
                  Phạm vi: {diagnosisScope === 'UPPER_JAW' ? 'Cung răng hàm trên (18 - 28)' : 'Cung răng hàm dưới (48 - 38)'}
                </span>
                <p className="text-sky-700 text-[10px] mt-0.5">
                  Áp dụng cho trường hợp niềng 1 hàm, phục hình bán hàm hoặc viêm nha chu khu trú 1 cung hàm.
                </p>
              </div>
            )}

            {/* BƯỚC 3 CỦA FORM: CHỌN MÃ BỆNH ICD-10 & MỨC ĐỘ */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8">
                <label className="block font-semibold text-slate-700 mb-1">
                  Chẩn đoán chính (Mã ICD-10)
                </label>
                <select
                  value={mainDiagnosis}
                  onChange={(e) => setMainDiagnosis(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-800 outline-none focus:border-teal-600 cursor-pointer transition-colors"
                >
                  {ICD10_DIAGNOSES.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {selectedIcdObj.indication && (
                  <p className="text-[10px] text-teal-700 font-semibold mt-1">
                    💡 Hướng xử trí khuyến nghị: {selectedIcdObj.indication}
                  </p>
                )}
              </div>

              <div className="md:col-span-4">
                <label className="block font-semibold text-slate-700 mb-1">Mức độ bệnh lý</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-800 outline-none focus:border-teal-600 cursor-pointer transition-colors"
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ghi chú chẩn đoán & Chỉ định điều trị */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Ghi chú chẩn đoán & Chỉ định điều trị
                </label>
                {diagnosisNotes && (
                  <button
                    type="button"
                    onClick={() => setDiagnosisNotes('')}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                    title="Xóa trắng nội dung ghi chú"
                  >
                    <RotateCcw size={11} />
                    <span>Xóa ghi chú</span>
                  </button>
                )}
              </div>

              <textarea
                rows={2}
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Nhập chi tiết mô tả tổn thương hoặc bấm chọn các tag chỉ định nhanh bên dưới..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-teal-600 transition-colors"
              />

              {/* Các tag chỉ định điều trị nhanh */}
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Tag size={12} className="text-teal-700" />
                  <span>Gợi ý chỉ định nhanh (bấm để thêm vào ghi chú):</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {/* Tag khuyến nghị tự động theo mã ICD-10 đang chọn */}
                  {selectedIcdObj?.indication && (
                    <button
                      type="button"
                      onClick={() => handleToggleIndicationTag(selectedIcdObj.indication)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${(diagnosisNotes || '').includes(selectedIcdObj.indication)
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs scale-105'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      title="Chỉ định khuyến nghị tương ứng với mã ICD-10 đang chọn"
                    >
                      <Sparkles
                        size={11}
                        className={
                          (diagnosisNotes || '').includes(selectedIcdObj.indication)
                            ? 'text-teal-200'
                            : 'text-emerald-600'
                        }
                      />
                      <span>{selectedIcdObj.indication} (Khuyên dùng)</span>
                      {(diagnosisNotes || '').includes(selectedIcdObj.indication) ? (
                        <Check size={11} />
                      ) : (
                        <Plus size={11} />
                      )}
                    </button>
                  )}

                  {/* Danh sách các tag chỉ định thường dùng */}
                  {COMMON_INDICATION_TAGS.map((tag) => {
                    if (tag === selectedIcdObj?.indication) return null;
                    const isSelected = (diagnosisNotes || '').includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleIndicationTag(tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${isSelected
                            ? 'bg-teal-700 text-white border border-teal-800 shadow-2xs font-bold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 hover:text-slate-900 font-medium'
                          }`}
                        title={isSelected ? 'Bấm để bỏ chọn' : 'Bấm để thêm vào ghi chú'}
                      >
                        {isSelected ? (
                          <Check size={11} className="text-white shrink-0" />
                        ) : (
                          <Plus size={11} className="text-slate-400 shrink-0" />
                        )}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Nguồn thông tin & Bác sĩ điều trị */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3 pt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nguồn thông tin</label>
                <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sources.clinicalExam}
                      onChange={(e) => setSources({ ...sources, clinicalExam: e.target.checked })}
                      className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                    />
                    <span>Khám lâm sàng</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sources.xray}
                      onChange={(e) => setSources({ ...sources, xray: e.target.checked })}
                      className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                    />
                    <span>X-quang</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sources.photos}
                      onChange={(e) => setSources({ ...sources, photos: e.target.checked })}
                      className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                    />
                    <span>Hình ảnh</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sources.aiSuggestion}
                      onChange={(e) => setSources({ ...sources, aiSuggestion: e.target.checked })}
                      className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                    />
                    <span>AI gợi ý</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Nút hành động của Form */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetDiagnosisForm}
                className="px-3.5 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Xóa trắng form để chẩn đoán mới"
              >
                <RotateCcw size={14} />
                <span>Làm mới form</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDiagnosis}
                disabled={isSavingDiagnosis}
                className="flex-1 rounded-lg bg-teal-700 py-3 text-xs font-bold text-white shadow hover:bg-teal-800 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Save size={14} />
                <span>
                  {isSavingDiagnosis
                    ? 'Đang lưu CSDL...'
                    : diagnosisScope === 'MULTI_TEETH' && selectedTeethList.length > 0
                      ? `Lưu chẩn đoán (${selectedTeethList.map((n) => `R${n}`).join(', ')})`
                      : 'Lưu chẩn đoán'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG DANH MỤC KẾT LUẬN CHẨN ĐOÁN CỦA ĐỢT KHÁM (FULL WIDTH ĐẶT DƯỚI CÙNG) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 border border-teal-200 shadow-2xs">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>Danh mục kết luận chẩn đoán đợt khám</span>
                <span className="rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2 py-0.5 border border-teal-200">
                  {diagnosisList.length}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Toàn bộ các chẩn đoán đã xác nhận trong đợt khám này — Sẽ được tự động chuyển sang Lập kế hoạch điều trị
              </p>
            </div>
          </div>

          <span className="self-start sm:self-center text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-md">
            Sẵn sàng chuyển kế hoạch điều trị &rarr;
          </span>
        </div>

        {diagnosisList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
            <p className="font-bold text-slate-600 text-xs">
              Chưa có kết luận chẩn đoán nào được lưu trong đợt khám này
            </p>
            <p className="text-[11px] text-slate-400">
              Vui lòng chọn phạm vi, mã bệnh ICD-10 và bấm <strong>&quot;Lưu chẩn đoán&quot;</strong> ở form trên để lưu vào đợt điều trị.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-36">Vị trí / Phạm vi</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Chẩn đoán (Mã ICD-10)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Mức độ</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Ghi chú của bác sĩ</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Nguồn thông tin</th>
                  <th className="py-2.5 px-3 w-16 text-center">Xóa</th>
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
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-center text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${isFullMouth
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
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {item.label || item.primaryDiagnosis}
                        </div>
                        {item.primaryDiagnosis && item.label && (
                          <div className="text-[10px] font-mono font-bold text-teal-700 mt-0.5">
                            Mã: {item.primaryDiagnosis}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${item.severity === 'Nặng'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.severity === 'Nhẹ'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                        >
                          {item.severity || 'Trung bình'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">
                        {item.notes ? `"${item.notes}"` : <span className="text-slate-300 not-italic">—</span>}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDiagnosisItem(item.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Xóa chẩn đoán này khỏi đợt khám"
                        >
                          <Trash2 size={14} />
                        </button>
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
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Phân tích X-quang & AI</span>
        </button>

        <button
          type="button"
          onClick={handleCreateTreatmentPlan}
          className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-800 active:scale-95 transition-all cursor-pointer"
        >
          <span>Chuyển sang Lập Kế Hoạch Điều Trị</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
