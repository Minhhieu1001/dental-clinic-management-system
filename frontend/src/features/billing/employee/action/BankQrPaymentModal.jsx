import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, CheckCircle2, Loader2, X, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';
import toast from 'react-hot-toast';
import { payInvoice, initiateQrPayment, cancelQrDraft, getInvoiceById } from '../../../../services/invoice.service';
import { mapBackendInvoiceToUi } from '../../../../utils/invoiceMapper';
import { useAuthStore } from '../../../../store/authStore';
import { useWebSocket } from '../../../../hooks/useWebSocket';
import VietQrPaymentCard from './VietQrPaymentCard';
import CancelPaymentModal from './action/CancelPaymentModal';

const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

/**
 * Modal độc lập dành riêng cho Thanh toán Chuyển khoản (VietQR).
 * Đồng bộ 100% với Backend (Sprint 2 - Casso Webhook & PaymentDraftCache RAM & WebSocket STOMP).
 */
export default function BankQrPaymentModal({ open, onClose, invoice, payment, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const amount = Number(payment?.amount || 0);

  // 0. Lắng nghe thông báo WebSocket Real-Time RIÊNG TƯ (Unicast) từ Casso Webhook
  const handlePaymentRealtime = useCallback(
    async (payload) => {
      const currentInvoiceId = invoice?.rawId || invoice?.id;
      if (!payload || !currentInvoiceId || !open) return;

      if (
        String(payload.invoiceId) === String(currentInvoiceId) &&
        payload.status === 'SUCCESS'
      ) {
        try {
          // Lấy dữ liệu mới nhất của hóa đơn vừa được gạch nợ thành công
          const updatedRaw = await getInvoiceById(currentInvoiceId);
          const updated = {
            ...invoice,
            ...mapBackendInvoiceToUi(updatedRaw),
            patientName: invoice.patientName,
            patientPhone: invoice.patientPhone,
            patientCode: invoice.patientCode,
          };
          const paymentInfo = {
            amount: payload.amount || amount,
            paymentMethod: 'BANK_TRANSFER',
            methodLabel: 'Chuyển khoản (VietQR)',
            transactionCode: payload.transactionCode || qrData?.transactionCode,
            createdAt: new Date(),
          };
          await onSuccess?.(updated, paymentInfo);
        } catch (err) {
          console.warn('Lỗi lấy hóa đơn mới nhất sau khi nhận WebSocket:', err);
          await onSuccess?.(invoice, {
            amount,
            paymentMethod: 'BANK_TRANSFER',
            methodLabel: 'Chuyển khoản (VietQR)',
            transactionCode: qrData?.transactionCode,
            createdAt: new Date(),
          });
        } finally {
          onClose();
        }
      }
    },
    [open, invoice, onSuccess, onClose, amount, qrData]
  );

  useWebSocket(null, null, null, handlePaymentRealtime);

  // 1. Khi Modal mở: Gọi API Backend khởi tạo mã QR & lưu Draft RAM Cache
  useEffect(() => {
    if (!open || !invoice?.rawId || amount <= 0) {
      setQrData(null);
      return;
    }

    setQrData(null); // Clear old QR data to ensure fresh loading UI
    let isMounted = true;
    const fetchQr = async () => {
      setQrLoading(true);
      try {
        const employeeId = useAuthStore.getState().user?.employeeId || null;
        const res = await initiateQrPayment({
          invoiceId: invoice.rawId,
          branchId: payment?.branchId || null,
          amount,
          serviceAmount: payment.serviceAmount,
          medicineAmount: payment.medicineAmount,
          paymentMethod: payment.paymentMethod || 'BANK_TRANSFER',
          employeeId,
          note: payment.note,
        });

        if (isMounted) {
          setQrData(res);
        }
      } catch (err) {
        console.error('Lỗi gọi API khởi tạo VietQR Backend:', err);
        toast.error('Không thể tạo mã QR từ máy chủ!');
      } finally {
        if (isMounted) setQrLoading(false);
      }
    };

    fetchQr();

    return () => {
      isMounted = false;
    };
  }, [open, invoice?.rawId, amount]);

  if (!invoice || !payment) return null;

  // Nhấn X hoặc Quay lại -> Hiển thị modal xác nhận hủy
  const handleRequestClose = () => {
    if (!submitting) {
      setShowCancelConfirm(true);
    }
  };

  // Xác nhận hủy thanh toán thành công trong modal xác nhận
  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    if (invoice?.rawId) {
      cancelQrDraft(invoice.rawId).catch(() => { });
    }
    onClose();
  };

  const handleConfirm = async () => {
    const invoiceId = invoice.rawId;
    if (!invoiceId) {
      toast.error('Hóa đơn chưa được lưu, không thể thanh toán!');
      return;
    }

    setSubmitting(true);
    try {
      const employeeId = useAuthStore.getState().user?.employeeId || null;
      const res = await payInvoice(invoiceId, {
        branchId: payment?.branchId || null,
        amount,
        serviceAmount: payment.serviceAmount,
        medicineAmount: payment.medicineAmount,
        amountReceived: amount,
        paymentMethod: payment.paymentMethod || 'BANK_TRANSFER',
        employeeId,
        note: payment.note,
      });

      const updated = {
        ...invoice,
        ...mapBackendInvoiceToUi(res),
        patientName: invoice.patientName,
        patientPhone: invoice.patientPhone,
        patientCode: invoice.patientCode,
      };

      const paymentInfo = {
        amount,
        paymentMethod: payment.paymentMethod || 'BANK_TRANSFER',
        methodLabel: payment.methodLabel || 'Chuyển khoản (VietQR)',
        transactionCode: qrData?.transactionCode,
        createdAt: new Date(),
      };
      await onSuccess?.(updated, paymentInfo);
    } catch (err) {
      console.error('Lỗi thanh toán chuyển khoản:', err);
      toast.error(err.response?.data?.message || 'Không thể thực hiện thanh toán!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          handleRequestClose();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { borderRadius: '4px', overflow: 'hidden' } }}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center border border-white/20">
              <QrCode size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight uppercase">
                Xác nhận thanh toán chuyển khoản - {payment.methodLabel || 'Ngân hàng'}
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">Quét mã QR bằng App Ngân hàng hoặc Momo để hoàn tất</p>
            </div>
          </div>
          <button
            onClick={handleRequestClose}
            disabled={submitting}
            className="text-white/70 hover:text-white p-1 rounded-sm hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <DialogContent className="p-4 space-y-3 bg-slate-50">
          {qrLoading ? (
            <div className="bg-white rounded-sm border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Đang khởi tạo mã QR từ Backend máy chủ...</span>
            </div>
          ) : (
            <VietQrPaymentCard
              amount={amount}
              invoiceId={invoice.id || invoice.rawId}
              patientName={invoice.patientName}
              qrData={qrData}
              onSimulatePayment={() => {
                toast.success('Giả lập Webhook Casso thành công!');
                handleConfirm();
              }}
            />
          )}

          {payment.note && (
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-sm border border-slate-200">
              Ghi chú: <span className="font-semibold text-slate-800">{payment.note}</span>
            </div>
          )}

          {/* Footer Buttons - Chỉ giữ lại nút Quay lại (vì thanh toán VietQR được gạch nợ tự động 100%) */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={handleRequestClose}
              disabled={submitting}
              className="px-5 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60"
            >
              Quay lại
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Xác nhận hủy giao dịch thanh toán */}
      <CancelPaymentModal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        invoice={invoice}
        payment={payment}
        qrData={qrData}
        amount={amount}
      />
    </>
  );
}

