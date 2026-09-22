import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa đơn thuốc',
  message = 'Bạn có chắc chắn muốn xóa đơn thuốc này không? Hành động này sẽ không thể hoàn tác.',
  itemName = '',
  loading = false,
}) {
  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKey = (e) => {
        if (e.key === 'Escape' && !loading) onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, loading, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 360,
              mass: 0.8,
            }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10 text-xs"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 tracking-wide">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {message}
              </p>

              {itemName && (
                <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-lg">
                  <div className="text-[11px] text-rose-700 font-semibold mb-0.5">
                    Đơn thuốc được chọn:
                  </div>
                  <div className="text-xs font-bold text-rose-900 truncate">
                    {itemName}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                * Lưu ý: Dữ liệu sau khi xóa sẽ được cập nhật đồng bộ khỏi hồ sơ bệnh án.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Trash2 size={14} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
