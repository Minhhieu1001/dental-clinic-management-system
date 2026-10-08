import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { Check, CheckCircle2, Home, X } from 'lucide-react';

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
 * Modal thông báo thanh toán thành công (dành cho cả Tiền mặt & Chuyển khoản QR).
 * 
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - amount: number | string (Số tiền vừa thanh toán)
 *  - transactionCode: string (Mã giao dịch - chỉ hiển thị nếu có, tiền mặt có thể bỏ trống)
 *  - invoiceCode: string (Mã hóa đơn)
 *  - paymentMethod: string (Phương thức thanh toán: Tiền mặt, Chuyển khoản, VNPay...)
 *  - transactionTime: string | Date (Thời gian thực hiện giao dịch)
 *  - invoice: object (Optional: hóa đơn để tự động trích xuất thông tin)
 *  - payment: object (Optional: thông tin giao dịch thanh toán)
 *  - buttonText: string (Nhãn nút dưới cùng, mặc định: "Về trang chủ")
 *  - onButtonClick: () => void (Callback khi click nút dưới cùng, mặc định gọi onClose)
 */
export default function PaymentSuccessModal({
  open,
  onClose,
  amount,
  transactionCode,
  invoiceCode,
  paymentMethod,
  transactionTime,
  invoice,
  payment,
  buttonText = 'Về trang chủ',
  onButtonClick,
}) {
  // Trích xuất các trường dữ liệu linh hoạt
  const finalAmount =
    amount !== undefined && amount !== null
      ? formatVND(amount)
      : payment?.amount !== undefined
      ? formatVND(payment.amount)
      : invoice?.paidAmount !== undefined
      ? formatVND(invoice.paidAmount)
      : invoice?.totalAmount !== undefined
      ? formatVND(invoice.totalAmount)
      : '3.000.000 đ';

  const finalTxCode =
    transactionCode ||
    payment?.transactionCode ||
    invoice?.transactionCode ||
    null;

  const finalInvoiceCode =
    invoiceCode ||
    invoice?.id ||
    invoice?.code ||
    invoice?.rawId ||
    'HD202610070123';

  const finalMethod =
    paymentMethod ||
    payment?.methodLabel ||
    (payment?.paymentMethod === 'CASH'
      ? 'Tiền mặt'
      : payment?.paymentMethod === 'BANK_TRANSFER'
      ? 'Chuyển khoản (VietQR)'
      : payment?.paymentMethod || 'VNPAY');

  const finalTime = formatDateTime(transactionTime || payment?.createdAt || invoice?.createdAt || new Date());

  const handleAction = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '24px',
          overflow: 'hidden',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogContent className="p-6 bg-white relative">
        {/* Nút Đóng (X) góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Biểu tượng Check Xanh Lá + Hạt Confetti trang trí xung quanh */}
        <div className="relative flex justify-center items-center my-3 pt-2">
          {/* Confetti trang trí */}
          <div className="absolute w-44 h-24 pointer-events-none">
            {/* Vệt confetti xanh lá bên trái */}
            <span className="absolute top-2 left-6 w-3.5 h-1.5 bg-emerald-500 rounded-full transform -rotate-45" />
            <span className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-emerald-300 rounded-full" />
            <span className="absolute top-10 left-2 w-3 h-1 bg-teal-400 rounded-full transform -rotate-12" />

            {/* Vệt confetti vàng bên trái */}
            <span className="absolute top-8 left-7 w-3 h-1.5 bg-amber-400 rounded-full transform rotate-30" />
            <span className="absolute bottom-1 left-9 w-2.5 h-1 bg-amber-400 rounded-full transform rotate-45" />

            {/* Vệt confetti xanh lá bên phải */}
            <span className="absolute top-3 right-7 w-3.5 h-1.5 bg-emerald-500 rounded-full transform rotate-45" />
            <span className="absolute bottom-2 right-4 w-3.5 h-1.5 bg-teal-400 rounded-full transform -rotate-25" />
            <span className="absolute top-1 right-12 w-1.5 h-1.5 bg-emerald-300 rounded-full" />

            {/* Vệt confetti vàng bên phải */}
            <span className="absolute top-10 right-2 w-3 h-1.5 bg-amber-400 rounded-full transform -rotate-30" />
          </div>

          {/* Vòng tròn xanh lá chính giữa */}
          <div className="w-20 h-20 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg shadow-emerald-500/20 z-10">
            <Check size={42} className="text-white stroke-[3.5]" />
          </div>
        </div>

        {/* Tiêu đề & Lời cảm ơn */}
        <div className="text-center space-y-1 mb-5">
          <h2 className="text-2xl font-bold text-[#0D6832] tracking-tight">
            Thanh toán thành công!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Giao dịch của bạn đã được xử lý thành công.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cảm ơn bạn đã sử dụng dịch vụ!
          </p>
        </div>

        {/* Thẻ Số tiền thanh toán */}
        <div className="bg-[#ECFDF5] rounded-2xl p-3.5 sm:p-4 text-center border border-emerald-100 mb-4">
          <p className="text-xs text-slate-500 font-medium">Số tiền thanh toán</p>
          <p className="text-2xl sm:text-[28px] font-black text-[#0D6832] mt-0.5 tracking-tight">
            {finalAmount}
          </p>
        </div>

        {/* Thẻ Chi tiết giao dịch */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 mb-6 bg-white">
          {/* Mã giao dịch (Chỉ hiển thị nếu có) */}
          {finalTxCode && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-500 font-normal">Mã giao dịch</span>
              <span className="font-semibold text-slate-700 font-mono text-[13px] sm:text-sm">
                {finalTxCode}
              </span>
            </div>
          )}

          {/* Mã hóa đơn */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Mã hóa đơn</span>
            <span className="font-semibold text-slate-700">
              {finalInvoiceCode}
            </span>
          </div>

          {/* Phương thức thanh toán */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Phương thức thanh toán</span>
            <span className="font-semibold text-slate-700 uppercase">
              {finalMethod}
            </span>
          </div>

          {/* Thời gian thanh toán */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Thời gian thanh toán</span>
            <span className="font-normal text-slate-700">
              {finalTime}
            </span>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-normal">Trạng thái</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] sm:text-xs font-bold">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Thành công</span>
            </span>
          </div>
        </div>

        {/* Nút Về trang chủ / Hoàn tất */}
        <button
          type="button"
          onClick={handleAction}
          className="w-full py-3 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home size={18} />
          <span>{buttonText}</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
