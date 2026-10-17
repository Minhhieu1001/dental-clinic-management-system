import React, { useEffect, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';
import toast from 'react-hot-toast';
import { payInvoice } from '../../../../services/invoice.service';
import { mapBackendInvoiceToUi } from '../../../../utils/invoiceMapper';
import { useAuthStore } from '../../../../store/authStore';

const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

const formatNumberDots = (num) => {
  const numeric = Number(String(num ?? '').replace(/\D/g, ''));
  if (!numeric) return '';
  return new Intl.NumberFormat('vi-VN').format(numeric);
};

// Gợi ý mệnh giá tiền khách đưa
const generateCashSuggestions = (amount) => {
  if (!amount) return [];
  const suggestions = [amount];
  [50000, 100000, 500000, 1000000].forEach((step) => {
    const val = Math.ceil(amount / step) * step;
    if (val >= amount && !suggestions.includes(val)) suggestions.push(val);
  });
  return suggestions.slice(0, 4);
};

/**
 * Modal xác nhận thanh toán + gọi API thanh toán.
 * - Tiền mặt: nhập tiền khách đưa, tính tiền thừa.
 * - Phương thức khác: chỉ xác nhận.
 *
 * Props:
 *  - payment: { amount, paymentMethod, methodLabel, note }
 *  - onSuccess(updatedInvoiceUi): gọi khi API thanh toán thành công
 */
export default function PaymentConfirmModal({ open, onClose, invoice, payment, onSuccess }) {
  const [customerCash, setCustomerCash] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(payment?.amount || 0);
  const isCash = payment?.paymentMethod === 'CASH';
  const changeReturn = Math.max(0, customerCash - amount);
  const isCashShort = isCash && customerCash < amount;

  useEffect(() => {
    if (open) setCustomerCash(amount);
  }, [open, amount]);

  if (!invoice || !payment) return null;

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleConfirm = async () => {
    const invoiceId = invoice.rawId;
    if (!invoiceId) {
      toast.error('Hóa đơn chưa được lưu, không thể thanh toán!');
      return;
    }
    if (isCashShort) return;

    setSubmitting(true);
    try {
      const employeeId = useAuthStore.getState().user?.employeeId || null;
      const res = await payInvoice(invoiceId, {
        branchId: payment?.branchId || null,
        amount,
        serviceAmount: payment.serviceAmount,
        medicineAmount: payment.medicineAmount,
        amountReceived: isCash ? customerCash : amount,
        paymentMethod: payment.paymentMethod,
        employeeId,
        note: payment.note,
      });

      // Giữ lại các thông tin hiển thị mà backend có thể không trả về
      const updated = {
        ...invoice,
        ...mapBackendInvoiceToUi(res),
        patientName: invoice.patientName,
        patientPhone: invoice.patientPhone,
        patientCode: invoice.patientCode,
      };

      await onSuccess?.(updated, {
        ...payment,
        amount,
        paymentMethod: payment.paymentMethod || 'CASH',
        methodLabel: payment.methodLabel || 'Tiền mặt',
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('Lỗi thanh toán hóa đơn:', err);
      toast.error(err.response?.data?.message || 'Không thể thực hiện thanh toán!');
    } finally {
      setSubmitting(false);
    }
  };

  const headerColor = isCash ? 'bg-emerald-700' : 'bg-blue-700';
  const HeaderIcon = isCash ? Banknote : CreditCard;

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        handleClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{ style: { borderRadius: '4px', overflow: 'hidden' } }}
    >
      <div className={`${headerColor} text-white px-5 py-3.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <HeaderIcon size={20} className="text-white/80" />
          <h3 className="text-sm font-bold tracking-tight">
            Xác nhận thanh toán {isCash ? 'tiền mặt' : `- ${payment.methodLabel}`}
          </h3>
        </div>
        <button
          onClick={handleClose}
          disabled={submitting}
          className="text-white/70 hover:text-white p-1 rounded-sm hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <DialogContent className="p-4 space-y-4 bg-slate-50">
        {/* Thông tin hóa đơn */}
        <div className="bg-white p-3 rounded-sm border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Bệnh nhân:</span>
            <span className="font-bold text-slate-800">{invoice.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mã hóa đơn:</span>
            <span className="font-bold text-slate-800">{invoice.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phương thức:</span>
            <span className="font-bold text-slate-800">{payment.methodLabel}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-slate-200 space-y-3.5 shadow-2xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Số tiền phải thu:</span>
            <span className="text-base font-black text-blue-600">{formatVND(amount)}</span>
          </div>

          {isCash && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Tiền khách đưa (đ)</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={formatNumberDots(customerCash)}
                    onChange={(e) => setCustomerCash(Number(e.target.value.replace(/\D/g, '')) || 0)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">đ</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {generateCashSuggestions(amount).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomerCash(amt)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-sm border transition-all cursor-pointer ${customerCash === amt
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {formatVND(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Tiền thừa trả khách:</span>
                {isCashShort ? (
                  <span className="text-xs font-bold text-rose-600">
                    Khách đưa thiếu {formatVND(amount - customerCash)}
                  </span>
                ) : (
                  <span className="text-base font-black text-emerald-600">{formatVND(changeReturn)}</span>
                )}
              </div>
            </>
          )}

          {payment.note && (
            <div className="text-xs text-slate-500">
              Ghi chú: <span className="font-semibold text-slate-700">{payment.note}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60"
          >
            Quay lại
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || isCashShort}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-sm font-bold text-xs transition-all shadow-xs border ${submitting || isCashShort
              ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              : isCash
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 cursor-pointer'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 cursor-pointer'
              }`}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>{submitting ? 'Đang xử lý...' : 'Xác nhận & Hoàn tất'}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
