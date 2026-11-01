import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export default function ConfirmDelete({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Xác nhận hủy liên kết hồ sơ',
  targetName = '',
  targetCode = '',
  guardianName = '',
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop mượt mà */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={!isDeleting ? onClose : undefined}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] cursor-pointer"
        />

        {/* Modal Dialog Chuẩn ERP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: 'spring', damping: 25, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-rose-50/50">
            <div className="flex items-center gap-2 text-rose-700">
              <div className="w-7 h-7 rounded-sm bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                <Trash2 size={15} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
            {!isDeleting && (
              <button
                type="button"
                onClick={onClose}
                className="w-6 h-6 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed">
              Bạn có chắc chắn muốn hủy liên kết hồ sơ của bệnh nhân{' '}
              <strong className="text-slate-900 font-bold">{targetName}</strong>{' '}
              {targetCode && <span className="text-teal-700 font-bold">({targetCode})</span>}{' '}
              khỏi tài khoản bảo trợ của{' '}
              <strong className="text-slate-900 font-bold">{guardianName}</strong>?
            </p>

            <div className="flex items-start gap-2 p-2.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                Sau khi hủy, người giám hộ sẽ không còn quyền truy cập bệnh án và theo dõi lịch khám của bệnh nhân này trên ứng dụng.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex items-center gap-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Xác nhận hủy liên kết</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

