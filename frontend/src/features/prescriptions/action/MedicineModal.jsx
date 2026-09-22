import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  X,
  RefreshCw,
  Edit,
  Trash2,
  CircleAlert,
  Calendar,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Format tiền tệ VNĐ
const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Tính toán trạng thái hạn sử dụng
const calculateExpiryStatus = (expiryDateStr) => {
  if (!expiryDateStr) return { label: 'Chưa có HSD', type: 'none', days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Đã hết hạn', type: 'expired', days: diffDays };
  }
  if (diffDays <= 60) {
    return { label: `Cận hạn (${diffDays} ngày)`, type: 'warning', days: diffDays };
  }
  return { label: `Còn ${diffDays} ngày`, type: 'good', days: diffDays };
};

const COMMON_UNITS = [
  'Viên nang',
  'Viên nén',
  'Chai',
  'Tuýp',
  'Ống tiêm',
  'Hộp',
  'Gói',
  'Hũ',
];

/**
 * Component Modal dùng chung cho Xem, Thêm, Sửa, Xóa (CRUD)
 * @param {boolean} open - Trạng thái mở/đóng modal
 * @param {'CREATE' | 'EDIT' | 'VIEW' | 'DELETE'} type - Chế độ thao tác
 * @param {object} payload - Dữ liệu thuốc khi xem/sửa/xóa
 * @param {function} onClose - Hàm đóng modal
 * @param {function} onSave - Hàm lưu khi Thêm / Sửa
 * @param {function} onConfirmDelete - Hàm xác nhận Xóa
 * @param {function} onSwitchType - Hàm chuyển đổi type (ví dụ từ VIEW sang EDIT)
 */
export default function MedicineModal({
  open,
  type = 'CREATE',
  payload = null,
  onClose,
  onSave,
  onConfirmDelete,
  onSwitchType,
}) {
  const [submitting, setSubmitting] = useState(false);

  // Form State dùng chung cho Xem, Thêm, Sửa
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: 'Viên nang',
    manufacturer: '',
    stockQuantity: 100,
    price: 15000,
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    usageInstruction: '',
    status: 'ACTIVE',
  });

  const isView = type === 'VIEW';
  const isEdit = type === 'EDIT';
  const isCreate = type === 'CREATE';
  const isDelete = type === 'DELETE';

  // Đồng bộ formData khi mở modal hoặc thay đổi payload/type
  useEffect(() => {
    if (open) {
      if ((isEdit || isView || isDelete) && payload) {
        setFormData({
          id: payload.id,
          code: payload.code || '',
          name: payload.name || '',
          unit: payload.unit || 'Viên nang',
          manufacturer: payload.manufacturer || '',
          stockQuantity: payload.stockQuantity ?? 0,
          price: payload.price ?? 0,
          manufactureDate: payload.manufactureDate || '',
          expiryDate: payload.expiryDate || '',
          description: payload.description || '',
          usageInstruction: payload.usageInstruction || '',
          status: payload.status || 'ACTIVE',
        });
      } else if (isCreate) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setFormData({
          code: `MED-${rand}`,
          name: '',
          unit: 'Viên nang',
          manufacturer: 'Dược Hậu Giang (DHG)',
          stockQuantity: 100,
          price: 15000,
          manufactureDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: '',
          usageInstruction: '',
          status: 'ACTIVE',
        });
      }
    }
  }, [open, type, payload]);

  // Sinh mã thuốc ngẫu nhiên
  const handleGenerateCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, code: `MED-${rand}` }));
  };

  // Xử lý gửi form Thêm / Sửa
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (isView) return;

    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập tên thuốc');
      return;
    }
    if (!formData.code?.trim()) {
      toast.error('Vui lòng nhập mã thuốc');
      return;
    }
    if (formData.manufactureDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) < new Date(formData.manufactureDate)) {
        toast.error('Hạn sử dụng không thể trước ngày sản xuất');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          code: formData.code?.trim().toUpperCase(),
          name: formData.name?.trim(),
          unit: formData.unit?.trim(),
          manufacturer: formData.manufacturer?.trim(),
          stockQuantity: Number(formData.stockQuantity) || 0,
          price: Number(formData.price) || 0,
          description: formData.description?.trim(),
          usageInstruction: formData.usageInstruction?.trim(),
        });
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý xóa thuốc
  const handleConfirmDeleteClick = async () => {
    if (!payload) return;
    setSubmitting(true);
    try {
      if (onConfirmDelete) {
        await onConfirmDelete(payload);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Không thể xóa thuốc này');
    } finally {
      setSubmitting(false);
    }
  };

  const expStatus = calculateExpiryStatus(formData.expiryDate);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* ═══════════════════════════════════════════════════════════════
              TRƯỜNG HỢP 1: XEM, THÊM, SỬA DÙNG CHUNG 1 MẪU FORM FORM
          ═══════════════════════════════════════════════════════════════ */}
          {!isDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 z-10 my-auto"
            >
              {/* Header dùng chung */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/75">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${
                      isView
                        ? 'bg-indigo-100 text-indigo-600 shadow-indigo-500/10'
                        : isEdit
                        ? 'bg-amber-100 text-amber-600 shadow-amber-500/10'
                        : 'bg-blue-100 text-blue-600 shadow-blue-500/10'
                    }`}
                  >
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {isView
                          ? 'Chi tiết thông tin thuốc'
                          : isEdit
                          ? 'Chỉnh sửa thông tin thuốc'
                          : 'Thêm loại thuốc mới'}
                      </h3>
                      {isView && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            formData.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {formData.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isView
                        ? 'Xem chi tiết quy cách, đơn giá, ngày sản xuất, hạn dùng và trạng thái kinh doanh'
                        : isEdit
                        ? 'Cập nhật giá bán, số lượng, quy cách đóng gói và hạn dùng của thuốc'
                        : 'Điền đầy đủ thông tin thuốc để quản lý danh mục và phục vụ kê đơn nha khoa.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form dùng chung */}
              <form onSubmit={handleSubmitForm}>
                <div className="max-h-[72vh] overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mã thuốc */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Mã định danh thuốc {!isView && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative flex">
                        <input
                          type="text"
                          required={!isView}
                          disabled={isView}
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({ ...formData, code: e.target.value.toUpperCase() })
                          }
                          placeholder="VD: MED-AMOX-500"
                          className={`w-full rounded-xl border py-2.5 px-3 font-mono text-sm uppercase transition ${
                            isView
                              ? 'border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        {!isView && (
                          <button
                            type="button"
                            onClick={handleGenerateCode}
                            className="absolute right-1.5 top-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                            title="Tự động sinh mã thuốc"
                          >
                            Sinh mã
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tên thuốc */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Tên thuốc / Biệt dược {!isView && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={!isView}
                        disabled={isView}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="VD: Augmentin 625mg"
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-800 font-semibold cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>

                    {/* Đơn vị tính */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Đơn vị tính {!isView && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={!isView}
                        disabled={isView}
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="Viên, Vỉ, Hộp, Chai, Tuýp, Ống..."
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-700 font-medium cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                      {!isView && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {COMMON_UNITS.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setFormData({ ...formData, unit: u })}
                              className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                                formData.unit === u
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nhà sản xuất */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Nhà sản xuất / Hãng dược
                      </label>
                      <input
                        type="text"
                        disabled={isView}
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="VD: GlaxoSmithKline (GSK), Dược Hậu Giang..."
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>

                    {/* Số lượng tồn kho */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Số lượng tồn kho {!isView && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="number"
                        min="0"
                        required={!isView}
                        disabled={isView}
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stockQuantity: Number(e.target.value) })
                        }
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-800 font-bold cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>

                    {/* Đơn giá bán */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Đơn giá bán (VNĐ) {!isView && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required={!isView}
                          disabled={isView}
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: Number(e.target.value) })
                          }
                          className={`w-full rounded-xl border py-2.5 pl-3 pr-12 text-sm font-semibold transition ${
                            isView
                              ? 'border-slate-200 bg-slate-50 text-blue-600 font-bold cursor-not-allowed'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          VNĐ
                        </span>
                      </div>
                      <span className="mt-1 block text-xs text-slate-400">
                        Hiển thị: <strong className="text-slate-600">{formatCurrency(formData.price)}</strong> / {formData.unit || 'đơn vị'}
                      </span>
                    </div>

                    {/* Ngày sản xuất (manufactureDate) */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Ngày sản xuất (NSX)
                      </label>
                      <input
                        type="date"
                        disabled={isView}
                        value={formData.manufactureDate}
                        onChange={(e) =>
                          setFormData({ ...formData, manufactureDate: e.target.value })
                        }
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>

                    {/* Hạn sử dụng (expiryDate) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Hạn sử dụng (HSD)
                        </label>
                        {formData.expiryDate && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              expStatus.type === 'expired'
                                ? 'bg-rose-100 text-rose-700'
                                : expStatus.type === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {expStatus.label}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        disabled={isView}
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className={`w-full rounded-xl border py-2.5 px-3 text-sm transition ${
                          isView
                            ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Trạng thái kinh doanh (status) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Trạng thái thuốc trong phòng khám
                    </label>
                    {isView ? (
                      <div className="flex items-center gap-2">
                        {formData.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Đang bán (Có thể kê đơn cho bệnh nhân)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            <XCircle className="h-4 w-4 text-slate-500" />
                            Ngừng bán / Tạm ngưng kinh doanh
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="status"
                            value="ACTIVE"
                            checked={formData.status === 'ACTIVE'}
                            onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-800">
                            Đang bán (Có thể kê đơn)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="status"
                            value="INACTIVE"
                            checked={formData.status === 'INACTIVE'}
                            onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                            className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                          />
                          <span className="text-sm font-medium text-slate-800">
                            Ngừng bán / Tạm ngưng
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Mô tả / Chỉ định nha khoa */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mô tả &amp; Hoạt chất chính
                    </label>
                    <textarea
                      rows={2}
                      disabled={isView}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Chỉ định sử dụng, hoạt chất hoặc ghi chú (VD: Kháng sinh phối hợp Amoxicillin + Acid Clavulanic...)"
                      className={`w-full rounded-xl border py-2 px-3 text-xs sm:text-sm transition ${
                        isView
                          ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed leading-relaxed'
                          : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>

                  {/* Hướng dẫn sử dụng & Liều dùng khi kê đơn */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Hướng dẫn sử dụng &amp; Liều dùng</span>
                      <span className="text-[11px] font-normal text-slate-400">Tự động áp dụng khi Bác sĩ kê đơn</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isView}
                      value={formData.usageInstruction}
                      onChange={(e) => setFormData({ ...formData, usageInstruction: e.target.value })}
                      placeholder="VD: Uống 1 viên x 2 lần/ngày sau bữa ăn 30 phút, uống nhiều nước; đợt dùng 5-7 ngày..."
                      className={`w-full rounded-xl border py-2 px-3 text-xs sm:text-sm transition ${
                        isView
                          ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed leading-relaxed'
                          : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10'
                      }`}
                    />
                  </div>
                </div>

                {/* Footer dùng chung */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/75 px-6 py-4">
                  {isView ? (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm"
                      >
                        Đóng
                      </button>
                      {onSwitchType && (
                        <button
                          type="button"
                          onClick={() => onSwitchType('EDIT')}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Chuyển sang Chỉnh sửa</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <span>{isEdit ? 'Lưu thay đổi' : 'Thêm vào danh mục'}</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TRƯỜNG HỢP 2: XÁC NHẬN XÓA (DELETE)
          ═══════════════════════════════════════════════════════════════ */}
          {isDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 360 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 p-6 text-center z-10 my-auto"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm shadow-rose-500/10">
                <Trash2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">Xác nhận xóa thuốc?</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa loại thuốc{' '}
                <strong className="text-slate-800">&ldquo;{formData.name}&rdquo;</strong> (Mã:{' '}
                {formData.code}) khỏi danh mục không?
              </p>
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left flex items-start gap-2.5">
                <CircleAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span className="leading-relaxed">
                  Lưu ý: Nếu thuốc đã được bác sĩ kê trong hồ sơ đơn thuốc của bệnh nhân, hệ thống
                  sẽ ngăn chặn việc xóa. Khi đó bạn có thể chuyển trạng thái sang{' '}
                  <strong>&ldquo;Ngừng bán&rdquo;</strong>.
                </span>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClick}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Đồng ý xóa</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
