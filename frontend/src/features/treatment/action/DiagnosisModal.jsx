import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Stethoscope,
  Layers,
  Smile,
  CheckSquare,
  Search,
  Save,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SEVERITY_OPTIONS,
  DIAGNOSIS_SCOPE_OPTIONS,
  COMMON_INDICATION_TAGS,
} from '../clinicalExaminationHelpers';
import { useClinicalExam } from '../ClinicalExamContext';

// 4 Cung răng theo chuẩn quốc tế FDI
const QUADRANT_1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Hàm trên Phải
const QUADRANT_2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Hàm trên Trái
const QUADRANT_4 = [48, 47, 46, 45, 44, 43, 42, 41]; // Hàm dưới Phải
const QUADRANT_3 = [31, 32, 33, 34, 35, 36, 37, 38]; // Hàm dưới Trái

const SOURCE_OPTIONS = [
  { key: 'clinicalExam', label: 'Khám lâm sàng' },
  { key: 'xray', label: 'Phim X-quang' },
  { key: 'photos', label: 'Ảnh nội soi' },
  { key: 'aiSuggestion', label: 'Đề xuất AI' },
  { key: 'patientReport', label: 'Mô tả của BN' },
];

/**
 * Modal Xác Nhận & Cập Nhật Kết Luận Chẩn Đoán Y Khoa
 * Thiết kế giao diện chuẩn Enterprise ERP bệnh viện / phòng khám nha khoa:
 * Tinh giản, sắc nét, tập trung thao tác dữ liệu lâm sàng nhanh chóng, không rườm rà.
 */
export function DiagnosisModal({
  isOpen,
  onClose,
  mode = 'ADD', // 'ADD' | 'EDIT'
  initialData = null,
  onSave,
  abnormalTeethFromStep1 = [],
}) {
  const isEdit = mode === 'EDIT';
  const { primaryDiagnoses } = useClinicalExam();

  const [scope, setScope] = useState('MULTI_TEETH');
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [icdSearchQuery, setIcdSearchQuery] = useState('');
  const [severity, setSeverity] = useState('Trung bình');
  const [notes, setNotes] = useState('');
  const [sources, setSources] = useState(['Khám lâm sàng', 'Phim X-quang']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đồng bộ dữ liệu mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setIcdSearchQuery('');
      if (isEdit && initialData) {
        // 1. Phạm vi & vị trí răng
        let initialScope = initialData.scope || 'MULTI_TEETH';
        let initialTeeth = [];

        if (initialData.toothPosition === 'Toàn hàm' || initialScope === 'FULL_MOUTH') {
          initialScope = 'FULL_MOUTH';
        } else if (initialData.toothPosition?.includes('Hàm trên') || initialScope === 'UPPER_JAW') {
          initialScope = 'UPPER_JAW';
        } else if (initialData.toothPosition?.includes('Hàm dưới') || initialScope === 'LOWER_JAW') {
          initialScope = 'LOWER_JAW';
        } else {
          initialScope = 'MULTI_TEETH';
          const rawText = initialData.toothPosition || '';
          const matches = rawText.match(/\d+/g);
          if (matches) {
            initialTeeth = matches.map(Number).filter((n) => !isNaN(n));
          } else if (initialData.selectedTeeth && Array.isArray(initialData.selectedTeeth)) {
            initialTeeth = initialData.selectedTeeth;
          }
        }

        setScope(initialScope);
        setSelectedTeeth(initialTeeth);

        // 2. Chẩn đoán chính từ CSDL
        const diagToFind = initialData.primaryDiagnosis || initialData.label || initialData.code || '';
        const matched = primaryDiagnoses.find(
          (d) => d.label === diagToFind || d.code === diagToFind || d.label?.includes(diagToFind)
        );
        setPrimaryDiagnosis(matched ? matched.label : (diagToFind || primaryDiagnoses[0]?.label || ''));

        // 3. Mức độ
        setSeverity(initialData.severity || 'Trung bình');

        // 4. Ghi chú & Nguồn
        setNotes(initialData.notes || initialData.diagnosticNotes || '');

        let parsedSources = ['Khám lâm sàng'];
        if (Array.isArray(initialData.sources)) {
          parsedSources = initialData.sources;
        } else if (typeof initialData.sources === 'string' && initialData.sources.trim()) {
          parsedSources = initialData.sources.split(',').map((s) => s.trim());
        } else if (initialData.sourceOfInformation) {
          parsedSources = initialData.sourceOfInformation.split(',').map((s) => s.trim());
        }
        setSources(parsedSources.length > 0 ? parsedSources : ['Khám lâm sàng']);
      } else {
        // Mode = 'ADD'
        const initialToothNo = initialData?.toothNumber ? [Number(initialData.toothNumber)] : [];
        setScope(initialData?.scope || 'MULTI_TEETH');
        setSelectedTeeth(initialToothNo);
        setPrimaryDiagnosis(
          initialData?.primaryDiagnosis ||
          initialData?.label ||
          primaryDiagnoses[0]?.label ||
          ''
        );
        setSeverity(initialData?.severity || 'Trung bình');
        setNotes(initialData?.notes || initialData?.indication || '');
        setSources(initialData?.sources || ['Khám lâm sàng', 'Phim X-quang']);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, mode, isEdit, initialData, primaryDiagnoses]);

  // Lọc danh mục ICD-10 theo từ khóa tìm kiếm
  const filteredIcdList = useMemo(() => {
    if (!icdSearchQuery.trim()) return primaryDiagnoses;
    const q = icdSearchQuery.toLowerCase().trim();
    return primaryDiagnoses.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q)
    );
  }, [icdSearchQuery, primaryDiagnoses]);

  if (!isOpen) return null;

  // ICD object đang chọn
  const selectedIcdObj =
    primaryDiagnoses.find((d) => d.label === primaryDiagnosis || d.code === primaryDiagnosis) || primaryDiagnoses[0];

  // Toggle chọn răng
  const handleToggleTooth = (toothNo) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothNo)
        ? prev.filter((t) => t !== toothNo)
        : [...prev, toothNo].sort((a, b) => a - b)
    );
  };

  // Toggle nguồn căn cứ
  const handleToggleSource = (srcLabel) => {
    setSources((prev) =>
      prev.includes(srcLabel)
        ? prev.length > 1
          ? prev.filter((s) => s !== srcLabel)
          : prev
        : [...prev, srcLabel]
    );
  };

  // Toggle tag phác đồ gợi ý nhanh vào ô ghi chú
  const handleToggleIndicationTag = (tag) => {
    setNotes((prev) => {
      const text = (prev || '').trim();
      if (!text) return tag;
      if (text.includes(tag)) {
        const parts = text
          .split(/(\s*·\s*|,\s*|\n)/)
          .map((p) => p.trim())
          .filter((p) => p && p !== '·' && p !== ',' && p !== tag);
        return parts.join(' · ');
      }
      return `${text} · ${tag}`;
    });
  };

  // Nạp nhanh tất cả răng bất thường từ Bước 1
  const handleSelectAbnormalTeeth = () => {
    if (abnormalTeethFromStep1.length === 0) {
      toast('Không có răng bất thường nào ở Bước 1', { icon: 'ℹ️' });
      return;
    }
    const numbers = abnormalTeethFromStep1
      .map((t) => Number(t.toothNumber))
      .filter((n) => !isNaN(n));
    setSelectedTeeth((prev) => Array.from(new Set([...prev, ...numbers])).sort((a, b) => a - b));
    toast.success(`Đã nạp ${numbers.length} răng bất thường từ Bước 1`);
  };

  // Xử lý gửi form
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (scope === 'MULTI_TEETH' && selectedTeeth.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 răng trên sơ đồ răng!');
      return;
    }

    let positionText = 'Toàn hàm';
    if (scope === 'FULL_MOUTH') {
      positionText = 'Toàn hàm';
    } else if (scope === 'UPPER_JAW') {
      positionText = 'Hàm trên';
    } else if (scope === 'LOWER_JAW') {
      positionText = 'Hàm dưới';
    } else {
      positionText = selectedTeeth.map((n) => `R${n}`).join(', ');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(initialData || {}),
        scope,
        toothPosition: positionText,
        selectedTeeth: scope === 'MULTI_TEETH' ? selectedTeeth : [],
        primaryDiagnosis: selectedIcdObj?.label || primaryDiagnosis,
        code: selectedIcdObj?.code || '',
        label: selectedIcdObj?.label || primaryDiagnosis,
        indication: selectedIcdObj?.indication || '',
        severity,
        notes: notes.trim(),
        diagnosticNotes: notes.trim(),
        sources,
        updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      if (onSave) {
        const success = await onSave(payload, mode);
        if (success !== false) {
          onClose();
        }
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Lỗi khi lưu chẩn đoán:', err);
      toast.error('Không thể lưu kết luận chẩn đoán');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionSummary = () => {
    if (scope === 'FULL_MOUTH') return 'Toàn hàm';
    if (scope === 'UPPER_JAW') return 'Hàm trên';
    if (scope === 'LOWER_JAW') return 'Hàm dưới';
    return selectedTeeth.length > 0 ? selectedTeeth.map((n) => `R${n}`).join(', ') : 'Chưa chọn';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* =========================================================================
           * 1. HEADER CHUẨN ENTERPRISE ERP (SẠCH SẼ, KHÔNG AI-THEME RƯỜM RÀ)
           * ========================================================================= */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/90 text-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs shrink-0">
                <Stethoscope size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isEdit ? 'Cập Nhật Kết Luận Chẩn Đoán' : 'Thêm Kết Luận Chẩn Đoán Mới'}
                  </h3>
                  <span className="rounded bg-slate-200/80 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700">
                    {isEdit ? 'Hiệu chỉnh' : 'Tạo mới'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Xác định danh mục mã bệnh ICD-10, phạm vi răng và chỉ định can thiệp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>

          {/* =========================================================================
           * 2. BODY FORM CHUẨN DỮ LIỆU BỆNH ÁN ERP
           * ========================================================================= */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-700 flex-1">
            {/* KHỐI 1: PHẠM VI GIẢI PHẪU & VỊ TRÍ RĂNG */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Layers size={13} className="text-teal-700" />
                  <span>1. Phạm vi can thiệp lâm sàng</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {scope === 'FULL_MOUTH'
                    ? 'Áp dụng toàn hàm'
                    : scope === 'UPPER_JAW'
                    ? 'Áp dụng hàm trên'
                    : scope === 'LOWER_JAW'
                    ? 'Áp dụng hàm dưới'
                    : `Đã chọn: ${selectedTeeth.length} răng`}
                </span>
              </div>

              {/* Segmented button chọn phạm vi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {DIAGNOSIS_SCOPE_OPTIONS.map((opt) => {
                  const isSelected = scope === opt.value || scope === opt.key;
                  return (
                    <button
                      key={opt.value || opt.key}
                      type="button"
                      onClick={() => setScope(opt.value || opt.key)}
                      className={`py-1.5 px-2 rounded-md border text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {(opt.value === 'FULL_MOUTH' || opt.key === 'FULL_MOUTH') && <Smile size={12} />}
                      {(opt.value === 'MULTI_TEETH' || opt.key === 'MULTI_TEETH') && <CheckSquare size={12} />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sơ đồ răng FDI khi Scope = MULTI_TEETH */}
              {scope === 'MULTI_TEETH' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Sơ đồ răng (FDI) — Chọn các răng cần chẩn đoán:
                    </span>
                    <div className="flex items-center gap-1">
                      {abnormalTeethFromStep1.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAbnormalTeeth}
                          className="text-[10.5px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          + Nạp {abnormalTeethFromStep1.length} răng bất thường
                        </button>
                      )}
                      {selectedTeeth.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedTeeth([])}
                          className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          Xóa chọn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sơ đồ 4 cung răng gọn gàng */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                    {/* HÀM TRÊN (Cung 1 & Cung 2) */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        {QUADRANT_1.map((toothNo) => {
                          const isSelected = selectedTeeth.includes(toothNo);
                          const isAbnormal = abnormalTeethFromStep1.some((t) => Number(t.toothNumber) === toothNo);
                          return (
                            <button
                              key={toothNo}
                              type="button"
                              onClick={() => handleToggleTooth(toothNo)}
                              className={`w-8 h-8 rounded-md border font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                  : isAbnormal
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                              }`}
                              title={`Răng ${toothNo}${isAbnormal ? ' (Có ghi nhận ở Bước 1)' : ''}`}
                            >
                              {toothNo}
                            </button>
                          );
                        })}
                      </div>

                      {/* Đường giữa hàm */}
                      <div className="w-px h-5 bg-slate-300 mx-0.5" />

                      <div className="flex items-center gap-1">
                        {QUADRANT_2.map((toothNo) => {
                          const isSelected = selectedTeeth.includes(toothNo);
                          const isAbnormal = abnormalTeethFromStep1.some((t) => Number(t.toothNumber) === toothNo);
                          return (
                            <button
                              key={toothNo}
                              type="button"
                              onClick={() => handleToggleTooth(toothNo)}
                              className={`w-8 h-8 rounded-md border font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                  : isAbnormal
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                              }`}
                              title={`Răng ${toothNo}${isAbnormal ? ' (Có ghi nhận ở Bước 1)' : ''}`}
                            >
                              {toothNo}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vạch ngang chia hàm */}
                    <div className="border-t border-slate-200/80 my-0.5" />

                    {/* HÀM DƯỚI (Cung 4 & Cung 3) */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        {QUADRANT_4.map((toothNo) => {
                          const isSelected = selectedTeeth.includes(toothNo);
                          const isAbnormal = abnormalTeethFromStep1.some((t) => Number(t.toothNumber) === toothNo);
                          return (
                            <button
                              key={toothNo}
                              type="button"
                              onClick={() => handleToggleTooth(toothNo)}
                              className={`w-8 h-8 rounded-md border font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                  : isAbnormal
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                              }`}
                              title={`Răng ${toothNo}${isAbnormal ? ' (Có ghi nhận ở Bước 1)' : ''}`}
                            >
                              {toothNo}
                            </button>
                          );
                        })}
                      </div>

                      {/* Đường giữa hàm */}
                      <div className="w-px h-5 bg-slate-300 mx-0.5" />

                      <div className="flex items-center gap-1">
                        {QUADRANT_3.map((toothNo) => {
                          const isSelected = selectedTeeth.includes(toothNo);
                          const isAbnormal = abnormalTeethFromStep1.some((t) => Number(t.toothNumber) === toothNo);
                          return (
                            <button
                              key={toothNo}
                              type="button"
                              onClick={() => handleToggleTooth(toothNo)}
                              className={`w-8 h-8 rounded-md border font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                  : isAbnormal
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                              }`}
                              title={`Răng ${toothNo}${isAbnormal ? ' (Có ghi nhận ở Bước 1)' : ''}`}
                            >
                              {toothNo}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Vị trí răng đã chọn */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-500">Đã chọn:</span>
                    {selectedTeeth.length === 0 ? (
                      <span className="text-slate-400 italic">Chưa chọn vị trí răng</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedTeeth.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-800 font-bold px-1.5 py-0.2 rounded text-[10.5px]"
                          >
                            R{t}
                            <button
                              type="button"
                              onClick={() => handleToggleTooth(t)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer text-xs leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* KHỐI 2: CHẨN ĐOÁN MÃ BỆNH LÝ (ICD-10) */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>2. Mã bệnh & Chẩn đoán y khoa (ICD-10)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10.5px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded">
                  {selectedIcdObj?.code}
                </span>
              </div>

              {/* Tìm kiếm & Chọn danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5 relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={icdSearchQuery}
                    onChange={(e) => setIcdSearchQuery(e.target.value)}
                    placeholder="Lọc mã hoặc tên bệnh..."
                    className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 outline-none"
                  />
                </div>

                <div className="sm:col-span-7">
                  <select
                    value={primaryDiagnosis}
                    onChange={(e) => {
                      setPrimaryDiagnosis(e.target.value);
                      const found = primaryDiagnoses.find(
                        (d) => d.label === e.target.value || d.code === e.target.value
                      );
                      if (found && !notes && found.indication) {
                        setNotes(found.indication);
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 outline-none cursor-pointer"
                  >
                    {filteredIcdList.map((icd) => {
                      const displayText = icd.label?.startsWith(icd.code)
                        ? icd.label
                        : icd.code && icd.code !== icd.label
                          ? `[${icd.code}] ${icd.label}`
                          : icd.label;

                      return (
                        <option key={icd.id || icd.label || icd.code} value={icd.label}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Hướng dẫn phác đồ tham chiếu */}
              {selectedIcdObj && (
                <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-600">Phác đồ chuẩn:</span>
                    <span className="font-bold text-teal-800">{selectedIcdObj.indication}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 self-start sm:self-auto">
                    {selectedIcdObj.category}
                  </span>
                </div>
              )}
            </div>

            {/* KHỐI 3: MỨC ĐỘ & CĂN CỨ CHẨN ĐOÁN (2 CỘT SONG SONG) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mức độ */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 shadow-2xs">
                <label className="font-bold text-slate-900 text-xs block">
                  3. Mức độ bệnh lý
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEVERITY_OPTIONS.map((s) => {
                    const isSelected = severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        className={`py-1.5 px-2 text-xs rounded-md border font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? s === 'Nặng'
                              ? 'border-rose-300 bg-rose-50 text-rose-800 font-bold'
                              : s === 'Nhẹ'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nguồn căn cứ */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 shadow-2xs">
                <label className="font-bold text-slate-900 text-xs block">
                  Căn cứ xác lập chẩn đoán
                </label>
                <div className="flex flex-wrap gap-1">
                  {SOURCE_OPTIONS.map((src) => {
                    const isChecked = sources.includes(src.label);
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => handleToggleSource(src.label)}
                        className={`px-2 py-1 text-[11px] rounded-md border transition-all cursor-pointer font-medium flex items-center gap-1 ${
                          isChecked
                            ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                            isChecked ? 'bg-teal-700 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={10} />}
                        </span>
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KHỐI 4: CHỈ ĐỊNH ĐIỀU TRỊ & DẶN DÒ */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs">
                  4. Chỉ định can thiệp & Dặn dò lâm sàng
                </label>
                <span className="text-[10.5px] text-slate-400">Tùy chọn</span>
              </div>

              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú chi tiết tổn thương giải phẫu, phác đồ can thiệp chỉ định hoặc dặn dò bệnh nhân..."
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 outline-none resize-none"
              />

              {/* Tag chỉ định nhanh */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[10.5px] text-slate-400 font-medium mr-0.5">Gợi ý nhanh:</span>
                {COMMON_INDICATION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleIndicationTag(tag)}
                    className="text-[10.5px] font-medium text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* =========================================================================
           * 3. FOOTER CHUẨN FORM ERP
           * ========================================================================= */}
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 bg-slate-50/90 shrink-0">
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Vị trí: <strong className="text-slate-800">{getPositionSummary()}</strong>
              {' · '}
              Mã: <strong className="text-slate-800 font-mono">{selectedIcdObj?.code || primaryDiagnosis}</strong>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    {isEdit ? <Save size={14} /> : <Plus size={14} />}
                    <span>{isEdit ? 'Lưu cập nhật chẩn đoán' : 'Lưu chẩn đoán vào đợt khám'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DiagnosisModal;
