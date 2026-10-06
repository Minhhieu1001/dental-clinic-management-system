import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  X,
  Receipt,
  User,
  Phone,
  IdCard,
  CreditCard,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  UserCheck,
  Stethoscope,
  Pill,
} from 'lucide-react';

export default function PaymentTransactionDetailModal({ open, onClose, transaction, invoice }) {
  if (!transaction) return null;

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  const txCode = transaction.transactionCode || transaction.id || 'N/A';
  const txName = transaction.paymentTransactionsName || 'Giao dịch thanh toán';
  const patientName = transaction.patientName || invoice?.patientName || 'Khách hàng';
  const patientCode = transaction.patientCode || invoice?.patientCode || invoice?.patientProfileCode || '-';
  const patientPhone = transaction.patientPhone || invoice?.patientPhone || '-';
  const employeeName = transaction.employeeName || transaction.staff || invoice?.employeeName || 'Nhân viên';

  const paymentTimeStr = transaction.paymentTime
    ? new Date(transaction.paymentTime).toLocaleString('vi-VN')
    : (transaction.date || '-');

  const methodRaw = transaction.paymentMethod || transaction.method;
  const methodLabel = methodRaw === 'BANK_TRANSFER'
    ? 'Chuyển khoản'
    : methodRaw === 'CASH'
      ? 'Tiền mặt'
      : methodRaw === 'CREDIT_CARD'
        ? 'Thẻ ngân hàng'
        : (methodRaw || 'Thanh toán');

  const serviceAmt = Number(transaction.serviceAmount ?? (transaction.totalAmount ? transaction.totalAmount - (transaction.medicineAmount || 0) : transaction.amount) ?? 0);
  const medicineAmt = Number(transaction.medicineAmount ?? 0);
  const totalAmt = Number(transaction.totalAmount ?? transaction.amount ?? 0);
  const receivedAmt = Number(transaction.amountReceived ?? transaction.customerCash ?? totalAmt);
  const changeAmt = Number(transaction.changeAmount ?? transaction.changeReturn ?? 0);

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{ style: { borderRadius: '6px', maxWidth: '680px', overflow: 'hidden' } }}
    >
      {/* Dialog Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              Chi tiết giao dịch thanh toán
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã giao dịch: <span className="font-semibold text-blue-600">{txCode}</span>
            </p>
          </div>
        </div>
        <IconButton onClick={onClose} size="small" className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 1, backgroundColor: '#f8fafc' }}>
        <div className="space-y-4">

          {/* Info Card: Patient & Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Patient Box */}
            <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <User size={14} className="text-blue-500" /> THÔNG TIN BỆNH NHÂN
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="text-sm font-bold text-slate-900">{patientName}</p>
                <p className="flex items-center gap-2">
                  <IdCard size={14} className="text-slate-400 shrink-0" />
                  <span>Mã hồ sơ: <strong className="text-slate-800 font-semibold">{patientCode}</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>SĐT: <strong className="text-slate-800 font-semibold">{patientPhone}</strong></span>
                </p>
              </div>
            </div>

            {/* Payment Info Box */}
            <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-500" /> VỀ THỜI GIAN & THU NGÂN
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <strong className="text-slate-900 font-semibold">{paymentTimeStr}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Phương thức:</span>
                  <Chip
                    label={methodLabel}
                    size="small"
                    sx={{
                      fontSize: '11px',
                      fontWeight: 600,
                      height: '20px',
                      backgroundColor: methodLabel === 'Tiền mặt' ? '#f0fdf4' : '#eff6ff',
                      color: methodLabel === 'Tiền mặt' ? '#166534' : '#1e40af',
                      border: `1px solid ${methodLabel === 'Tiền mặt' ? '#bbf7d0' : '#bfdbfe'}`,
                    }}
                  />
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Người thu tiền:</span>
                  <strong className="text-slate-900 font-semibold">{employeeName}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Financial Box */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
                BẢNG PHÂN BỔ KHOẢN TIỀN
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2 font-normal text-slate-700">
                  <Stethoscope size={15} className="text-blue-500" /> Tiền dịch vụ điều trị
                </span>
                <span className="font-semibold text-slate-900">{formatVND(serviceAmt)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2 font-normal text-slate-700">
                  <Pill size={15} className="text-emerald-500" /> Tiền thuốc
                </span>
                <span className="font-semibold text-slate-900">{formatVND(medicineAmt)}</span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Tổng tiền thu đợt này</span>
                <span className="font-bold text-emerald-600 text-base">{formatVND(totalAmt)}</span>
              </div>

              {/* Customer cash breakdown */}
              <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-xs text-slate-700 mt-2 border border-slate-200/70">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tiền khách đưa:</span>
                  <span className="font-semibold text-slate-900">{formatVND(receivedAmt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tiền trả lại khách:</span>
                  <span className="font-semibold text-emerald-700">{formatVND(changeAmt)}</span>
                </div>
              </div>

              {/* Note */}
              {transaction.note && (
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium block mb-0.5">Ghi chú giao dịch:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded text-xs italic">{transaction.note}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            backgroundColor: '#475569',
            borderRadius: '4px',
            px: 3,
            '&:hover': { backgroundColor: '#334155' },
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
