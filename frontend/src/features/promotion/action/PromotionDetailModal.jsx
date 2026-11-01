import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag,
  Ticket,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Edit3,
  Layers,
  FileText,
  BadgePercent
} from 'lucide-react'

export default function PromotionDetailModal({
  isOpen,
  promo,
  onClose,
  onOpenEdit,
  onOpenExtend,
  isPromoExpiringSoon,
  getExtendTooltip,
  formatMoney,
  formatDate,
  formatDiscountBadge,
}) {
  const isVoucher = Boolean(
    promo?.promotionType === 'VOUCHER' ||
      (promo?.couponCode && promo?.couponCode.trim()) ||
      (promo?.discountAmount &&
        Number(promo?.discountAmount) > 0 &&
        (!promo?.discountPercent || Number(promo?.discountPercent) === 0))
  )

  const canExtend = promo ? isPromoExpiringSoon(promo) : false

  return (
    <AnimatePresence>
      {isOpen && promo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container with 60fps spring / cubic-bezier entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200/80 max-h-[85vh] flex flex-col overflow-hidden will-change-transform"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-1 text-xs font-black text-white shadow-xs shrink-0">
              {formatDiscountBadge(promo)}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {promo.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pt-4 space-y-4 flex-1 pr-1">
          {/* Banner Image */}
          {promo.imageUrl && (
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900/5 border border-slate-200/80 shadow-xs min-h-[160px] max-h-[300px] flex items-center justify-center">
              <img
                src={promo.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-25 pointer-events-none"
              />
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="relative z-10 w-full h-auto max-h-[300px] object-contain drop-shadow-xs"
              />
            </div>
          )}

          {/* Type Badge & Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold ${
                isVoucher
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}
            >
              {isVoucher ? <Ticket className="w-4 h-4" /> : <BadgePercent className="w-4 h-4" />}
              <span>{isVoucher ? 'Mã Voucher (Giảm tiền hóa đơn)' : 'Sự Kiện Ưu Đãi (Giảm %)'}</span>
            </span>

            {promo.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>{promo.category}</span>
              </span>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 text-sm">
            {isVoucher ? (
              <>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Mã Voucher</span>
                  <span className="font-bold text-teal-800 font-mono text-sm sm:text-base">
                    {promo.couponCode || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Số tiền giảm</span>
                  <span className="font-bold text-teal-800 text-sm sm:text-base">
                    {formatMoney(promo.discountAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Giảm tối đa</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.maxDiscountAmount ? formatMoney(promo.maxDiscountAmount) : 'Không giới hạn'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Đơn tối thiểu</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.minOrderAmount ? formatMoney(promo.minOrderAmount) : '0đ'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Đã dùng / Giới hạn</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.usedCount || 0} / {promo.usageLimit || '∞'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Trạng thái</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.status === 'ACTIVE'
                      ? 'Đang áp dụng'
                      : promo.status === 'INACTIVE'
                      ? 'Đã tắt'
                      : 'Hết hạn'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Mức chiết khấu</span>
                  <span className="font-bold text-teal-700 text-sm sm:text-base">-{promo.discountPercent}%</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Giảm tối đa</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.maxDiscountAmount ? formatMoney(promo.maxDiscountAmount) : 'Không giới hạn'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Đơn tối thiểu</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.minOrderAmount ? formatMoney(promo.minOrderAmount) : '0đ'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Trạng thái</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">
                    {promo.status === 'ACTIVE'
                      ? 'Đang áp dụng'
                      : promo.status === 'INACTIVE'
                      ? 'Đã tắt'
                      : 'Hết hạn'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Timeframe */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Thời gian diễn ra</span>
            </h4>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Mô tả chi tiết</span>
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
              {promo.description || 'Chưa có mô tả chi tiết cho chương trình này.'}
            </p>
          </div>

          {/* Scope of Application */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Phạm vi áp dụng</span>
            </h4>
            {isVoucher ? (
              <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-200/80 text-sm font-medium text-teal-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Áp dụng giảm trừ trực tiếp trên <strong>toàn bộ hóa đơn thanh toán</strong> khi thỏa mãn giá trị đơn hàng tối thiểu {promo.minOrderAmount ? formatMoney(promo.minOrderAmount) : '0đ'}.
                </span>
              </div>
            ) : promo.applyAllServices ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-sm font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Chương trình ưu đãi này áp dụng cho <strong>toàn bộ dịch vụ nha khoa</strong> tại Crown Dental.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(promo.services || []).map((svc) => {
                  const origPrice = Number(svc.price)
                  let finalPrice = origPrice
                  if (promo.discountPercent && Number(promo.discountPercent) > 0) {
                    finalPrice = origPrice * (1 - Number(promo.discountPercent) / 100)
                  } else if (promo.discountAmount && Number(promo.discountAmount) > 0) {
                    finalPrice = Math.max(0, origPrice - Number(promo.discountAmount))
                  }
                  return (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between border border-slate-200/70 rounded-xl p-3 bg-slate-50/60 text-sm hover:bg-slate-100/70 transition"
                    >
                      <span className="font-semibold text-slate-800">{svc.serviceName}</span>
                      <div className="text-right">
                        <span className="line-through text-slate-400 text-xs mr-2">
                          {formatMoney(origPrice)}
                        </span>
                        <span className="font-bold text-teal-700">{formatMoney(finalPrice)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-3.5 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={!canExtend}
            onClick={() => {
              onClose()
              onOpenExtend(promo)
            }}
            title={getExtendTooltip(promo)}
            className={`whitespace-nowrap shrink-0 rounded-xl px-4.5 py-2.5 text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              !canExtend
                ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 active:scale-95 cursor-pointer shadow-2xs'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Gia Hạn</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenEdit(promo)
            }}
            className="whitespace-nowrap shrink-0 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span>Chỉnh Sửa Ưu Đãi</span>
          </button>
        </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  )
}
