import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { Trash2, X } from 'lucide-react';

const formatVND = (num) => {
  if (num === null || num === undefined || num === '') return '0 đ';
  if (typeof num === 'string' && num.includes('đ')) return num;
  const val = Number(num);
  return isNaN(val) ? num : new Intl.NumberFormat('vi-VN').format(val) + ' đ';
};

const formatDateTime = (dateVal) => {
  if (!dateVal) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  if (typeof dateVal === 'string' && dateVal.includes('/')) return dateVal;
  try {
    const d = new Date(dateVal);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(dateVal);
  }
};

/**
 * Modal xác nhận trước khi hủy giao dịch thanh toán.
 * 
 * Props:
 *  - open: boolean
 *  - onClose: () => void (Đóng modal xác nhận, tiếp tục ở lại màn hình thanh toán)
 *  - onConfirm: () => void (Đồng ý hủy giao dịch)
 *  - title: string (Tiêu đề, mặc định: "Xác nhận hủy")
 *  - message: string (Câu hỏi xác nhận)
 *  - warningText: string (Cảnh báo không thể hoàn tác)
 *  - transactionCode: string (Mã giao dịch)
 *  - amount: number | string (Số tiền thanh toán)
 *  - transactionTime: string | Date (Thời gian giao dịch)
 *  - paymentMethod: string (Phương thức thanh toán)
 *  - confirmText: string (Nhãn nút xác nhận hủy)
 *  - cancelText: string (Nhãn nút đóng)
 *  - invoice: object (Optional: hóa đơn để tự động trích xuất thông tin)
 *  - payment: object (Optional: thông tin thanh toán)
 *  - qrData: object (Optional: thông tin mã QR động)
 */
export default function CancelPaymentModal({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận hủy',
  message = 'Bạn có chắc chắn muốn hủy giao dịch này không?',
  warningText = 'Hành động này không thể hoàn tác.',
  transactionCode,
  amount,
  transactionTime,
  paymentMethod,
  confirmText = 'Hủy giao dịch',
  cancelText = 'Đóng',
  invoice,
  payment,
  qrData,
  loading = false,
}) {
  // Trích xuất thông tin linh hoạt từ props hoặc fallback
  const displayCode =
    transactionCode ||
    qrData?.transactionCode ||
    invoice?.transactionCode ||
    (invoice?.id || invoice?.rawId ? `TXN${invoice.id || invoice.rawId}` : 'TXN2026101007094532');

  const displayAmount =
    amount !== undefined && amount !== null
      ? formatVND(amount)
      : payment?.amount !== undefined
      ? formatVND(payment.amount)
      : qrData?.amount !== undefined
      ? formatVND(qrData.amount)
      : invoice?.totalAmount !== undefined
      ? formatVND(invoice.totalAmount)
      : '3.000.000 đ';

  const displayTime = formatDateTime(transactionTime || invoice?.createdAt || new Date());

  const displayMethod =
    paymentMethod ||
    payment?.methodLabel ||
    payment?.paymentMethod ||
    'VNPay';

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        if (!loading) onClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogContent className="p-6 bg-white relative">
        {/* Nút Đóng (X) góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Biểu tượng thùng rác màu đỏ nổi bật */}
        <div className="flex justify-center mb-4 pt-2">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
            <Trash2 size={30} className="text-rose-500 stroke-[1.8]" />
          </div>
        </div>

        {/* Tiêu đề & Thông điệp */}
        <div className="text-center space-y-1 mb-5">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm font-medium text-slate-600">
            {message}
          </p>
          <p className="text-xs text-slate-400">
            {warningText}
          </p>
        </div>

        {/* Khung thông tin giao dịch */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 sm:p-4.5 space-y-3 border border-slate-100 mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Mã giao dịch</span>
            <span className="font-medium text-slate-700 font-mono text-[13px] sm:text-sm">
              {displayCode}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Số tiền thanh toán</span>
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              {displayAmount}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Thời gian giao dịch</span>
            <span className="font-normal text-slate-700">
              {displayTime}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Phương thức thanh toán</span>
            <span className="font-medium text-slate-700">
              {displayMethod}
            </span>
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors cursor-pointer text-center disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Trash2 size={16} className="shrink-0 stroke-[2]" />
            <span>{confirmText}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

