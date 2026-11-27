import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket,
  BadgePercent,
  UploadCloud,
  X,
  Search,
  AlertCircle,
  Calendar,
  Layers,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react'

export default function PromotionFormModal({
  isOpen,
  editingId,
  promoTab,
  form,
  updateForm,
  handleSwitchPromoTab,
  handleImageUpload,
  uploadingImage,
  filteredServices,
  serviceSearch,
  setServiceSearch,
  toggleAllServices,
  handleServiceCardClick,
  getServicePromo,
  modalError,
  lockedNotice,
  submitting,
  handleSubmit,
  onClose,
  CATEGORY_OPTIONS,
  formatMoney,
}) {
  // Helper for quick date presets
  const applyQuickDatePreset = (days) => {
    const start = new Date()
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    const formatDt = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    updateForm('startDate', formatDt(start))
    updateForm('endDate', formatDt(end))
  }

  const updateNonNegativeNumber = (field, value) => {
    if (value === '' || (!value.includes('-') && Number(value) >= 0)) {
      updateForm(field, value)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-teal-100/80 max-h-[90vh] flex flex-col overflow-hidden will-change-transform"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-bold">
                  {editingId ? <BadgePercent className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Chỉnh Sửa Chương Trình Ưu Đãi' : 'Tạo Chương Trình Ưu Đãi Mới'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Thiết lập thông tin khuyến mãi và các tiêu chí giảm giá nha khoa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto pt-4 space-y-4 pr-1 flex-1">
              {modalError && (
                <div className="rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-700 border border-red-200/80 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Type Switcher Tabs (Only switchable when creating) */}
              {editingId ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-600">Loại chương trình:</span>
                    {promoTab === 'EVENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-teal-800 border border-teal-200 rounded-lg text-sm font-bold shadow-2xs">
                        <BadgePercent className="w-4 h-4 text-teal-600" />
                        <span>Sự Kiện Ưu Đãi (Giảm %)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-violet-700 border border-violet-200 rounded-lg text-sm font-bold shadow-2xs">
                        <Ticket className="w-4 h-4 text-violet-600" />
                        <span>Mã Voucher (Giảm tiền trên hóa đơn)</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleSwitchPromoTab('EVENT')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm transition-all cursor-pointer ${promoTab === 'EVENT'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm font-bold border border-teal-600'
                        : 'text-slate-600 hover:text-teal-800 hover:bg-white/60 font-semibold'
                        }`}
                    >
                      <BadgePercent className="w-4 h-4" />
                      <span>Sự Kiện Ưu Đãi (Giảm %)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchPromoTab('VOUCHER')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm transition-all cursor-pointer ${promoTab === 'VOUCHER'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm font-bold border border-teal-600'
                        : 'text-slate-600 hover:text-teal-800 hover:bg-white/60 font-semibold'
                        }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Mã Voucher (Giảm tiền cụ thể)</span>
                    </button>
                  </div>

                  {promoTab === 'EVENT' ? (
                    <div className="text-xs text-teal-900 bg-teal-50/80 border border-teal-200/70 px-3.5 py-2 rounded-xl flex items-center gap-2">
                      <BadgePercent className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        <strong>Sự kiện (Event):</strong> Áp dụng chiết khấu theo phần trăm (%) cho dịch vụ nha khoa, không cần nhập mã code.
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-violet-900 bg-violet-50/80 border border-violet-200/70 px-3.5 py-2 rounded-xl flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-violet-600 shrink-0" />
                      <span>
                        <strong>Mã Voucher:</strong> Trừ thẳng số tiền cụ thể (VNĐ) vào hóa đơn thanh toán, có thể thiết lập tiền giảm tối đa và giới hạn số lượt dùng.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Tên chương trình */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tên chương trình ưu đãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white"
                    placeholder={
                      promoTab === 'EVENT'
                        ? 'VD: Đại lễ nụ cười xinh - Giảm 20% Niềng răng'
                        : 'VD: Voucher tri ân khách hàng thân thiết - Giảm 200.000đ'
                    }
                  />
                </div>

                {/* CÁC TRƯỜNG DÀNH CHO VOUCHER */}
                {promoTab === 'VOUCHER' && (
                  <>
                    {/* Mã Voucher */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Mã Coupon / Voucher <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={form.couponCode}
                        onChange={(e) => updateForm('couponCode', e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition font-bold bg-white"
                        placeholder="VD: CROWN200K, SUMMER2026"
                      />
                      {/* Quick Code Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {['CROWN100K', 'CROWN200K', 'VIPCARE'].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => updateForm('couponCode', code)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-mono transition border border-slate-200/70 cursor-pointer"
                          >
                            +{code}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Số tiền giảm trực tiếp */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Số tiền giảm trực tiếp (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1000"
                        step="1000"
                        value={form.discountAmount}
                        onChange={(e) => updateNonNegativeNumber('discountAmount', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                        placeholder="VD: 200000 (giảm 200.000đ)"
                      />
                      {/* Quick Amount Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {[
                          { label: '50k', val: '50000' },
                          { label: '100k', val: '100000' },
                          { label: '200k', val: '200000' },
                          { label: '500k', val: '500000' },
                          { label: '1Tr', val: '1000000' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => updateForm('discountAmount', item.val)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tiền giảm tối đa cho Voucher (VNĐ) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Tiền giảm tối đa (VNĐ) <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={form.maxDiscountAmount}
                        onChange={(e) => updateNonNegativeNumber('maxDiscountAmount', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                        placeholder="VD: 500000 (để trống nếu không chặn trần)"
                      />
                      {/* Quick Max Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {[
                          { label: '500k', val: '500000' },
                          { label: '1Tr', val: '1000000' },
                          { label: '2Tr', val: '2000000' },
                          { label: '5Tr', val: '5000000' },
                          { label: 'Không trần', val: '' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => updateForm('maxDiscountAmount', item.val)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Giới hạn số lượt dùng */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Giới hạn số lượt dùng (Lượt) <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.usageLimit}
                        onChange={(e) => updateNonNegativeNumber('usageLimit', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                        placeholder="VD: 100 (để trống nếu không giới hạn)"
                      />
                      {/* Quick Usage Limit Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {[
                          { label: '50 lượt', val: '50' },
                          { label: '100 lượt', val: '100' },
                          { label: '200 lượt', val: '200' },
                          { label: '500 lượt', val: '500' },
                          { label: 'Không giới hạn', val: '' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => updateForm('usageLimit', item.val)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* CÁC TRƯỜNG DÀNH CHO EVENT */}
                {promoTab === 'EVENT' && (
                  <>
                    {/* Mức giảm theo phần trăm */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Mức giảm theo phần trăm (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={form.discountPercent}
                        onChange={(e) => updateNonNegativeNumber('discountPercent', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                        placeholder="VD: 20 (tức giảm 20%)"
                      />
                      {/* Quick Percent Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {['10', '15', '20', '30', '50'].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updateForm('discountPercent', pct)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-bold transition border border-slate-200/70 cursor-pointer"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mức giảm tối đa cho Event */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Giảm tối đa (VNĐ) <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={form.maxDiscountAmount}
                        onChange={(e) => updateNonNegativeNumber('maxDiscountAmount', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                        placeholder="VD: 1000000 (tối đa 1 triệu, để trống nếu không chặn trần)"
                      />
                      {/* Quick Max Discount Suggestions */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium"></span>
                        {[
                          { label: '500k', val: '500000' },
                          { label: '1Tr', val: '1000000' },
                          { label: '2Tr', val: '2000000' },
                          { label: '5Tr', val: '5000000' },
                          { label: 'Không trần', val: '' },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => updateForm('maxDiscountAmount', item.val)}
                            className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Danh mục ưu đãi */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Danh mục dịch vụ
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giá trị đơn hàng tối thiểu */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Giá trị đơn hàng tối thiểu (VNĐ) <span className="text-xs text-slate-400 font-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.minOrderAmount}
                    onChange={(e) => updateNonNegativeNumber('minOrderAmount', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white transition"
                    placeholder="VD: 500000 (đơn từ 500k mới áp dụng)"
                  />
                  {/* Quick Min Order Suggestions */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium"></span>
                    {[
                      { label: '0đ', val: '0' },
                      { label: '500k', val: '500000' },
                      { label: '1Tr', val: '1000000' },
                      { label: '2Tr', val: '2000000' },
                      { label: '5Tr', val: '5000000' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => updateForm('minOrderAmount', item.val)}
                        className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TẢI ẢNH CHƯƠNG TRÌNH (Không hiện URL, preview ảnh to rõ) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Ảnh chương trình ưu đãi
                  </label>
                  {form.imageUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-teal-100">
                      <div className="relative w-full sm:w-52 h-36 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                        <img
                          src={form.imageUrl}
                          alt="Xem trước ảnh"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src =
                              'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=300&q=80'
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 space-y-2">
                        <div>
                          <h5 className="text-sm font-bold text-slate-800">Ảnh đã được chọn</h5>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ảnh sẽ xuất hiện trên banner chương trình ưu đãi và thẻ hiển thị cho bệnh nhân.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 font-semibold px-3 py-1.5 rounded-xl transition text-xs shadow-2xs">
                            <UploadCloud className="w-4 h-4 text-teal-700" />
                            <span>{uploadingImage ? 'Đang tải...' : 'Đổi ảnh khác'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => updateForm('imageUrl', '')}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Xóa ảnh</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-200/80 rounded-2xl bg-teal-50/30 hover:bg-teal-50/70 hover:border-teal-400 transition-all cursor-pointer group">
                      <div className="flex flex-col items-center justify-center py-3">
                        <UploadCloud className="w-8 h-8 text-teal-600 group-hover:scale-110 transition-transform mb-1.5" />
                        <p className="text-sm font-bold text-teal-900">
                          {uploadingImage ? 'Đang tải ảnh lên...' : 'Bấm vào đây để tải ảnh lên'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Hỗ trợ định dạng JPG, PNG, WEBP (tự động tối ưu dung lượng)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => updateForm('startDate', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white"
                  />
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => updateForm('endDate', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white"
                  />
                </div>

                {/* Quick Date Range Helper */}
                <div className="md:col-span-2 -mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Gợi ý thời hạn:</span>
                  </span>
                  {[
                    { label: '7 ngày', days: 7 },
                    { label: '14 ngày', days: 14 },
                    { label: '30 ngày', days: 30 },
                    { label: '60 ngày', days: 60 },
                    { label: '90 ngày', days: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyQuickDatePreset(preset.days)}
                      className="text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-2 py-0.5 rounded-md font-medium transition border border-slate-200/70 cursor-pointer"
                    >
                      +{preset.label}
                    </button>
                  ))}
                </div>

                {/* Mô tả chương trình */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Mô tả chương trình
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows="2"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition bg-white"
                    placeholder="Nội dung, điều kiện áp dụng..."
                  />
                </div>
              </div>

              {/* Dịch vụ áp dụng: Chỉ dành cho EVENT. VOUCHER áp dụng cho toàn bộ hóa đơn */}
              {promoTab === 'EVENT' ? (
                <fieldset
                  className="border-t border-slate-100 pt-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5">
                    <div>
                      <legend className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-600" />
                        <span>Dịch vụ áp dụng (Tùy chọn)</span>
                      </legend>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {form.serviceIds.length > 0
                          ? `Đã chọn ${form.serviceIds.length} dịch vụ áp dụng`
                          : 'Chưa chọn dịch vụ nào (không bắt buộc)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Tìm dịch vụ..."
                          className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={toggleAllServices}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition shrink-0 border border-slate-200/60 cursor-pointer"
                      >
                        Chọn tất cả khả dụng
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-56 overflow-y-auto p-1 pr-1.5">
                    {filteredServices.length ? (
                      filteredServices.map((service) => {
                        const promoInfo = getServicePromo(service)
                        const isLockedByOther = Boolean(promoInfo && promoInfo.promotionId !== editingId)
                        const checked = isLockedByOther || form.serviceIds.includes(service.id)

                        return (
                          <div
                            key={service.id}
                            onClick={() => handleServiceCardClick(service)}
                            className={`flex items-start gap-2 rounded-xl border p-2.5 text-sm transition relative select-none ${isLockedByOther
                              ? 'border-slate-200 bg-slate-50/70 text-slate-600 cursor-not-allowed opacity-85 hover:border-red-300'
                              : checked
                                ? 'border-teal-500 bg-teal-50/80 text-teal-900 font-semibold cursor-pointer shadow-xs ring-1 ring-teal-500/30'
                                : 'border-slate-200/80 text-slate-700 hover:bg-slate-50 cursor-pointer'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isLockedByOther}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleServiceCardClick(service)}
                              className={`mt-0.5 rounded border-slate-300 ${isLockedByOther
                                ? 'text-teal-600 bg-teal-50 cursor-not-allowed'
                                : 'text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer'
                                }`}
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className="block truncate font-medium text-sm text-slate-800"
                                title={service.serviceName}
                              >
                                {service.serviceName}
                              </span>
                              <div className="flex items-center justify-between mt-1 gap-1">
                                <span className="text-xs text-slate-500 font-medium">
                                  {formatMoney(service.price)}
                                </span>
                                {isLockedByOther && (
                                  <span className="text-[10px] bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded border border-red-200/70 shrink-0">
                                    Đã có KM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full py-6 text-center text-sm text-slate-500">
                        <p>Không tìm thấy dịch vụ nào phù hợp với từ khóa tìm kiếm.</p>
                      </div>
                    )}
                  </div>
                </fieldset>
              ) : null}

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                {lockedNotice ? (
                  <div className="flex-1 min-w-0 text-xs text-red-600 font-semibold flex items-start sm:items-center gap-1.5 animate-in fade-in mr-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                    <span className="leading-snug break-words">
                      Dịch vụ <strong className="font-bold">{lockedNotice.serviceName}</strong> đã được áp dụng cho chương trình:{' '}
                      <strong className="font-bold">"{lockedNotice.promotionTitle}"</strong>
                    </span>
                  </div>
                ) : modalError ? (
                  <div className="flex-1 min-w-0 text-xs text-red-600 font-medium flex items-start sm:items-center gap-1.5 animate-in fade-in mr-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                    <span className="leading-snug break-words">
                      {modalError}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="flex items-center justify-end gap-2.5 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="whitespace-nowrap shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition border border-slate-200/80 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="whitespace-nowrap shrink-0 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Lưu cập nhật' : 'Tạo ưu đãi ngay'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
