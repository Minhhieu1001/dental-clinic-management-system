import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function Warning({
  isOpen,
  onClose,
  onConfirm,
  title = 'Cảnh báo hủy phiên xác thực OTP',
  message = 'Hệ thống đang trong quá trình chờ xác thực mã OTP. Nếu bạn thoát lúc này, phiên gửi OTP sẽ bị hủy và bạn phải thực hiện lại từ đầu.',
  subMessage = 'Bạn có chắc chắn muốn dừng và thoát khỏi màn hình xác thực?',
  confirmText = 'Xác nhận thoát',
  cancelText = 'Ở lại tiếp tục',
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop mượt mà */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
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
          {/* Header cảnh báo */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100 bg-amber-50/70">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="w-7 h-7 rounded-sm bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed text-slate-700">
              {message}
            </p>

            <div className="p-2.5 rounded-sm bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px] leading-relaxed font-medium flex items-start gap-2">
              <ShieldAlert size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>{subMessage}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 rounded-sm bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

