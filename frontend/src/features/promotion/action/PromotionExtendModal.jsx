import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, X, Check, Loader2, RefreshCw } from 'lucide-react'

export default function PromotionExtendModal({
  isOpen,
  promo,
  extendOption,
  setExtendOption,
  customExtendDays,
  setCustomExtendDays,
  submittingExtend,
  onConfirm,
  onClose,
  formatDate,
  calculateNewEndDate,
  getExtendDaysCount,
}) {
  const daysCount = promo ? getExtendDaysCount() : 0
  const newEndDate = promo ? calculateNewEndDate(promo, daysCount) : null
  const isPast = promo && promo.endDate ? new Date(promo.endDate) < new Date() : false

  return (
    <AnimatePresence>
      {isOpen && promo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Dialog with smooth spring/cubic-bezier */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 overflow-hidden will-change-transform"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Gia Hạn Chương Trình Ưu Đãi</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{promo.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Duration Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Chọn khoảng thời gian gia hạn thêm <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: '7', label: '1 Tuần', daysLabel: '+7 ngày' },
                  { value: '30', label: '1 Tháng', daysLabel: '+30 ngày' },
                  { value: '60', label: '2 Tháng', daysLabel: '+60 ngày' },
                  { value: '90', label: '3 Tháng', daysLabel: '+90 ngày' },
                  { value: '180', label: '6 Tháng', daysLabel: '+180 ngày' },
                  { value: 'custom', label: 'Tự nhập', daysLabel: 'Số ngày tùy ý' },
                ].map((option) => {
                  const isSelected = extendOption === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setExtendOption(option.value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold shadow-xs ring-2 ring-teal-500/30'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-teal-50/30 hover:border-teal-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-700" />}
                      </div>
                      <span className={`text-[10px] mt-1 ${isSelected ? 'text-teal-700 font-semibold' : 'text-slate-400'}`}>
                        {option.daysLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Custom days input */}
              {extendOption === 'custom' && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nhập số ngày muốn gia hạn thêm:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customExtendDays}
                    onChange={(e) => setCustomExtendDays(e.target.value)}
                    placeholder="Ví dụ: 45"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white"
                  />
                </div>
              )}

              {/* Live Date Preview */}
              <div className="rounded-xl bg-teal-50/70 border border-teal-200/80 p-3.5 space-y-1.5 text-xs text-teal-950">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Thời hạn hiện tại:</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(promo.endDate)}
                    {isPast && (
                      <span className="ml-1.5 text-[10px] text-amber-700 font-bold bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        Đã kết thúc
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-teal-800 font-bold pt-1.5 border-t border-teal-200/60">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {isPast ? 'Hạn mới (kích hoạt từ hôm nay):' : 'Hạn mới (cộng dồn thời gian):'}
                    </span>
                  </span>
                  <span className="text-sm font-black text-teal-900">
                    {formatDate(newEndDate)} ({`+${daysCount} ngày`})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={
                  submittingExtend ||
                  (extendOption === 'custom' && (!customExtendDays || parseInt(customExtendDays) <= 0))
                }
                onClick={onConfirm}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submittingExtend ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác Nhận Gia Hạn</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
