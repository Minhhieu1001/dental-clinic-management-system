import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Lock,
  Loader2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

/**
 * Modal Xác Nhận Lưu Chẩn Đoán / Cảnh Báo Chưa Có Chẩn Đoán Cuối
 * Thiết kế đơn giản, tinh gọn, tập trung vào thao tác xác nhận của bác sĩ.
 */
export function ConfirmSaveDiagnosisModal({
  isOpen,
  onClose,
  onConfirmSave,
  onNavigateToDiagnosis,
  diagnosisList = [],
  isSaving = false,
}) {
  if (!isOpen) return null;

  const hasDiagnoses = Array.isArray(diagnosisList) && diagnosisList.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
            <div className="flex items-center gap-3">
              {hasDiagnoses ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                  <HelpCircle size={20} />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                  <AlertTriangle size={20} />
                </div>
              )}
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {hasDiagnoses ? 'Xác Nhận Lưu Chẩn Đoán' : 'Chưa Có Chẩn Đoán Cuối'}
              </h3>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 text-slate-600 text-xs sm:text-sm leading-relaxed">
            {!hasDiagnoses ? (
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">
                  Đợt khám hiện chưa có kết luận chẩn đoán cuối cùng nào!
                </p>
                <p className="text-slate-600">
                  Bạn không thể lưu đợt khám khi chưa có chẩn đoán. Vui lòng chuyển sang Bước 3 để hoàn tất chẩn đoán trước khi lưu.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">
                  Bạn có chắc chắn muốn lưu kết luận chẩn đoán cho đợt khám này?
                </p>
                <p className="text-slate-500 text-xs">
                  Sau khi lưu, đợt khám sẽ được khóa lại và chuyển sang chế độ chỉ xem, không thể chỉnh sửa tiếp.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-3.5 bg-slate-50/50">
            {!hasDiagnoses ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToDiagnosis) onNavigateToDiagnosis();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Chuyển sang Bước 3</span>
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onConfirmSave}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Xác nhận lưu</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ConfirmSaveDiagnosisModal;
