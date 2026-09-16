import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  X,
  CalendarCheck,
  Sparkles,
  Clock,
  Activity,
  FileText,
  Check,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  QUICK_PHASE_SUGGESTIONS,
  DURATION_SUGGESTIONS,
  TREATMENT_TYPE_OPTIONS,
  PHASE_STATUS_BUTTON_OPTIONS,
} from '../clinicalExaminationHelpers';

export function PhaseModal({
  isOpen,
  onClose,
  mode = 'ADD', // 'ADD' | 'EDIT'
  initialData = null,
  onSavePhase,
}) {
  const [phaseName, setPhaseName] = useState('');
  const [phaseOrder, setPhaseOrder] = useState(1);
  const [phaseType, setPhaseType] = useState('Nội nha & Nha chu');
  const [phaseDuration, setPhaseDuration] = useState('1-2 tuần');
  const [phaseStatus, setPhaseStatus] = useState('PENDING');
  const [phaseDesc, setPhaseDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'EDIT' && initialData) {
        setPhaseName(initialData.phase_name || '');
        setPhaseOrder(Number(initialData.phase_order) || 1);
        setPhaseType(initialData.treatmentType || 'Nội nha & Nha chu');
        setPhaseDuration(initialData.estimated_duration || '1-2 tuần');
        setPhaseStatus(initialData.status || 'PENDING');
        setPhaseDesc(initialData.description || '');
      } else {
        const order = Number(initialData?.phase_order) || 1;
        setPhaseName(initialData?.phase_name || `Giai đoạn ${order}: `);
        setPhaseOrder(order);
        setPhaseType(initialData?.treatmentType || 'Nội nha & Nha chu');
        setPhaseDuration(initialData?.estimated_duration || '1-2 tuần');
        setPhaseStatus(initialData?.status || 'PENDING');
        setPhaseDesc(initialData?.description || '');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phaseName.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn điều trị!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (onSavePhase) {
        await onSavePhase({
          phase_id: initialData?.phase_id,
          phase_order: Number(phaseOrder) || 1,
          phase_name: phaseName.trim(),
          treatmentType: phaseType,
          estimated_duration: phaseDuration,
          status: phaseStatus,
          description: phaseDesc.trim() || 'Giai đoạn điều trị can thiệp theo phác đồ bác sĩ.',
        });
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu giai đoạn:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100"
          >
            {/* Top Gradient Header */}
            <div className="relative overflow-hidden bg-linear-to-r from-teal-800 via-teal-700 to-teal-900 px-6 py-5 text-white">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                    <Layers className="text-white" size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight">
                        {mode === 'ADD' ? 'Thêm Giai Đoạn Điều Trị' : 'Chỉnh Sửa Giai Đoạn Điều Trị'}
                      </h3>
                      <span className="rounded-full bg-teal-500/30 border border-teal-300/30 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-teal-100">
                        Giai đoạn #{phaseOrder}
                      </span>
                    </div>
                    <p className="text-xs text-teal-100/80 mt-0.5">
                      Thiết lập lộ trình thực hiện, mục tiêu lâm sàng và thời gian can thiệp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto">
              {/* 1. Tên giai đoạn điều trị */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={14} className="text-teal-700" />
                    Tên giai đoạn điều trị <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Bắt buộc</span>
                </div>
                <input
                  type="text"
                  required
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder="VD: Giai đoạn 1: Điều trị tủy nội nha & Chăm sóc nha chu..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs"
                />
                {/* Quick suggestion chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {QUICK_PHASE_SUGGESTIONS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPhaseName(`Giai đoạn ${phaseOrder}: ${chip}`)}
                      className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Thứ tự & Loại điều trị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarCheck size={14} className="text-teal-700" />
                    <span>Thứ tự giai đoạn</span>
                    <span className="text-[10.5px] text-teal-600 font-medium normal-case">(Tự động)</span>
                  </label>
                  <div
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 flex items-center justify-between cursor-not-allowed select-none shadow-inner"
                    title="Thứ tự giai đoạn được hệ thống tự động tăng/giảm theo số giai đoạn, không được sửa"
                  >
                    <span>{phaseOrder}</span>
                    <span className="text-xs font-medium text-slate-400">Khóa tự động</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={14} className="text-teal-700" />
                    Loại điều trị
                  </label>
                  <select
                    value={phaseType}
                    onChange={(e) => setPhaseType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs cursor-pointer"
                  >
                    {TREATMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Thời gian dự kiến & Trạng thái (Không dùng select box) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={14} className="text-teal-700" />
                    Thời gian dự kiến
                  </label>
                  <input
                    type="text"
                    value={phaseDuration}
                    onChange={(e) => setPhaseDuration(e.target.value)}
                    placeholder="VD: 7 - 10 ngày, 2 - 3 tuần..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none shadow-2xs"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {DURATION_SUGGESTIONS.map((d) => {
                      const isSelected = phaseDuration === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPhaseDuration(d)}
                          className={`text-[11px] font-medium whitespace-nowrap px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${isSelected
                            ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold shadow-2xs'
                            : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                            }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity size={14} className="text-teal-700" />
                    Trạng thái giai đoạn
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PHASE_STATUS_BUTTON_OPTIONS.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setPhaseStatus(st.value)}
                        className={`py-2 px-1.5 text-xs rounded-xl border transition-all cursor-pointer text-center font-medium ${phaseStatus === st.value
                          ? st.active
                          : 'border-slate-200 text-slate-600 bg-slate-50/50 hover:bg-slate-100'
                          }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Mục tiêu & Mô tả giai đoạn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={14} className="text-teal-700" />
                  Mục tiêu lâm sàng & Mô tả giai đoạn
                </label>
                <textarea
                  rows={3}
                  value={phaseDesc}
                  onChange={(e) => setPhaseDesc(e.target.value)}
                  placeholder="Mô tả kỹ thuật can thiệp lâm sàng, lưu ý điều trị hoặc mục tiêu dự kiến đạt được trong giai đoạn này..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 transition-all outline-none leading-relaxed shadow-2xs"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Sparkles size={14} className="text-teal-600 shrink-0" />
                  <span>Sau khi tạo, bạn có thể chỉ định dịch vụ nha khoa</span>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-linear-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-800/20 hover:shadow-teal-800/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>
                      {mode === 'ADD' ? 'Tạo giai đoạn điều trị' : 'Lưu thay đổi'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default PhaseModal;
