import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Building2,
  CreditCard,
  Wallet,
  QrCode,
  Tag,
  Pill,
  CheckCircle2,
  X,
  User,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Dialog, DialogContent, TextField } from '@mui/material';
import toast from 'react-hot-toast';
import PrescriptionSelectModal from './PrescriptionSelectModal';
import VoucherSelectModal from './VoucherSelectModal';
import PaymentConfirmModal from './PaymentConfirmModal';
import BankQrPaymentModal from './BankQrPaymentModal';
import { useAuthStore } from '../../../../store/authStore';
import { getEmployeeAddressById } from '../../../../services/employee.service';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Tiền mặt', icon: Banknote },
  { id: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: Building2 },
  { id: 'CREDIT_CARD', label: 'Thẻ ngân hàng', icon: CreditCard },
  { id: 'MOMO', label: 'Ví điện tử', icon: Wallet },
  { id: 'VNPAY', label: 'VNPAY QR', icon: QrCode },
];

export default function PaymentModal({ open, onClose, invoice, onPaymentSuccess }) {
  const user = useAuthStore.getState().user;
  const [employeeBranchId, setEmployeeBranchId] = useState(null);

  // Lấy chi nhánh của nhân viên đăng nhập thực hiện thanh toán qua getEmployeeAddressById
  useEffect(() => {
    const empId = user?.employeeId || user?.id;
    if (empId) {
      getEmployeeAddressById(empId)
        .then((res) => {
          const data = res?.data || res;
          if (data?.branchId) {
            setEmployeeBranchId(data.branchId);
          }
        })
        .catch((err) => {
          console.warn('Lỗi lấy thông tin chi nhánh nhân viên thanh toán:', err);
        });
    }
  }, [user?.employeeId, user?.id]);

  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [payAmount, setPayAmount] = useState(invoice?.debtAmount ?? 0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [note, setNote] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [showRxModal, setShowRxModal] = useState(false);
  const [extraRxItems, setExtraRxItems] = useState([]);

  // Modal xác nhận thanh toán (xử lý gọi API)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formatNumberDots = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const numeric = typeof num === 'number' ? num : Number(String(num).replace(/\D/g, ''));
    if (isNaN(numeric) || numeric === 0) return '';
    return new Intl.NumberFormat('vi-VN').format(numeric);
  };

  useEffect(() => {
    if (open) {
      if (invoice) {
        const initialAmt = invoice.debtAmount;
        setPayAmount(initialAmt);
        setDisplayAmount(formatNumberDots(initialAmt));
        setNextPaymentDate(invoice.nextPaymentDate ?? '');
      }
      setExtraRxItems([]);
    } else {
      setExtraRxItems([]);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const handleCloseModal = () => {
    setExtraRxItems([]);
    onClose();
  };

  const handleInputChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setPayAmount(0);
      setDisplayAmount('');
      return;
    }
    const val = Math.min(Number(rawDigits), Math.max(0, Number(invoice.debtAmount) || 0));
    setPayAmount(val);
    setDisplayAmount(new Intl.NumberFormat('vi-VN').format(val));
  };

  const handleSetPayAmount = (val) => {
    setPayAmount(val);
    setDisplayAmount(formatNumberDots(val));
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  const rxTotal = extraRxItems.totalAmount || 0;// tiền thuốc
  const invoiceDebt = invoice.debtAmount;// tiền nợ


  // Tổng tiền phải thu từ khách hàng (bao gồm nợ hóa đơn + tiền thuốc)
  const finalPayable = Math.max(0, Number(payAmount) + rxTotal);

  // Số tiền trừ nợ hóa đơn (serviceAmount)
  const servicePayAmount = Math.max(0, Number(payAmount));
  const remainingAfterPayment = Math.max(0, Number(invoiceDebt) - servicePayAmount);

  const handleAddRxItems = (items) => {
    setExtraRxItems(items);
    console.log("itemm", items)
  };

  const paymentPayload = {
    branchId: employeeBranchId || null, // Lấy chi nhánh của nhân viên đăng nhập thực hiện thanh toán, KHÔNG lấy của hóa đơn
    amount: finalPayable,
    serviceAmount: servicePayAmount,
    medicineAmount: rxTotal,
    paymentMethod: selectedMethod,
    methodLabel: PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label || 'Tiền mặt',
    note,
    nextPaymentDate: remainingAfterPayment > 0 ? nextPaymentDate || null : null,
  };

  // Kiểm tra dữ liệu rồi mở modal xác nhận (modal xác nhận sẽ gọi API)
  const handlePaymentSubmit = () => {
    if (remainingAfterPayment > 0 && !nextPaymentDate) {
      toast.error('Vui lòng chọn ngày thanh toán tiếp theo khi hóa đơn còn nợ');
      return;
    }
    if (selectedMethod !== 'CASH' && selectedMethod !== 'BANK_TRANSFER') {
      const selectedLabel = PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label || 'Phương thức này';
      toast.error(`Phương thức thanh toán ${selectedLabel} chưa được triển khai!`);
      return;
    }
    if (finalPayable <= 0) {
      toast.error('Số tiền thanh toán phải lớn hơn 0');
      return;
    }
    if (payAmount > invoiceDebt) {
      toast.error(`Số tiền thanh toán nợ hóa đơn không được vượt quá số tiền còn nợ (${formatVND(invoiceDebt)})`);
      return;
    }
    setShowConfirmModal(true);
  };

  // API thanh toán thành công -> đóng các modal và trả hóa đơn mới cho trang cha
  const handleConfirmSuccess = async (updatedInvoice, paymentInfo) => {
    setShowConfirmModal(false);
    onClose();
    await onPaymentSuccess?.(updatedInvoice, paymentInfo || paymentPayload);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          handleCloseModal();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { borderRadius: '4px', overflow: 'hidden' } }}
      >
        {/* Header Modal mới theo hình mẫu */}
        <div className="bg-white border-b border-slate-200 px-5 py-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Thanh toán hóa đơn
          </h3>
          <button
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <DialogContent className="p-4 space-y-2 bg-slate-50">
          {/* PANEL CHUNG: Thông tin khách hàng (trái), Thông tin hóa đơn (phải) & Số tiền (dưới) */}
          <div className="bg-white rounded-sm border border-slate-200/90 p-3 shadow-2xs space-y-2.5">

            {/* Hàng trên: Thông tin khách hàng & Thông tin hóa đơn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              {/* Trái: Thông tin khách hàng */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Thông tin khách hàng</h4>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <User size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{invoice.patientName}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      SĐT: <span className="font-semibold text-slate-700">{invoice.patientPhone || '0912345678'}</span>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      Mã hồ sơ: <span className="font-semibold text-slate-700">{invoice.patientCode || invoice.patientProfileCode || invoice.patientId || ''}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Phải: Thông tin hóa đơn */}
              <div className="space-y-1 pt-2 md:pt-0 md:pl-3">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Thông tin hóa đơn</h4>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Receipt size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 text-xs">{invoice.id}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ngày tạo: <span className="font-semibold text-slate-700">{invoice.date} 10:24</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Phân cách & Hàng dưới: Thống kê số tiền 3 cột */}
            <div className="border-t border-slate-100 pt-2">
              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center md:text-left">
                <div className="px-2 first:pl-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Tổng tiền hóa đơn</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {formatVND(invoice.finalAmount)}
                  </span>
                </div>
                <div className="px-2">
                  <span className="text-[11px] text-slate-500 font-medium block">Đã thanh toán</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {formatVND(invoice.paidAmount || 0)}
                  </span>
                </div>
                <div className="px-2 last:pr-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Còn nợ</span>
                  <span className="text-sm sm:text-base font-bold text-rose-600">
                    {formatVND(invoiceDebt)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Chọn phương thức thanh toán */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phương thức thanh toán
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-sm border transition-all cursor-pointer select-none ${isSelected
                      ? 'border-blue-600 bg-blue-50/90 text-blue-900 font-extrabold shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <IconComponent size={18} className={isSelected ? 'text-blue-600' : 'text-slate-500'} />
                    <span className="text-[11px]">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Thông tin chi tiết thanh toán */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Thông tin chi tiết thanh toán
            </h4>

            {/* PANEL CHUNG DÀNH CHO THANH TOÁN */}
            <div className="bg-white p-3 rounded-sm border border-slate-200/90 space-y-2.5 shadow-2xs">

              {/* Hàng 1: Số tiền thanh toán thực thu */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Số tiền thanh toán
                  </label>
                </div>

                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={displayAmount}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-sm px-3 py-1.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">đ</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSetPayAmount(invoiceDebt)}
                    className="px-3.5 py-1.5 text-xs rounded-sm border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={13} />
                    <span>Tất cả</span>
                  </button>
                </div>
              </div>

              {/* Hàng 2: Tiền thuốc đơn thuốc */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Tiền thuốc đơn thuốc
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={rxTotal > 0 ? formatVND(rxTotal) : '0 đ'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRxModal(true)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Xem đơn thuốc khách hàng"
                  >
                    <Pill size={14} className="text-amber-600" />
                    <span>Lấy đơn thuốc</span>
                  </button>
                </div>
              </div>

              {/* Hàng 3: Dòng TỔNG TIỀN CẦN THANH TOÁN */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm sm:text-base font-black text-rose-600 tracking-tight">
                  {formatVND(finalPayable)}
                </span>
                <span className="text-[11px] font-bold text-slate-700">Tổng tiền cần thanh toán</span>
              </div>

            </div>

            {remainingAfterPayment > 0 && (
              <TextField
                label="Ngày thanh toán tiếp theo"
                required
                error={!nextPaymentDate}
                type="date"
                size="small"
                fullWidth
                value={nextPaymentDate}
                onChange={(event) => setNextPaymentDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={`Còn nợ sau lần thanh toán này: ${formatVND(remainingAfterPayment)}. Vui lòng chọn ngày thanh toán tiếp theo để xác nhận.`}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px', backgroundColor: 'white' } }}
              />
            )}

            {/* Note Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Ghi chú </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú (nếu có)..."
                className="w-full bg-white border border-slate-300 rounded-sm px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              onClick={handleCloseModal}
              className="px-4 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handlePaymentSubmit}
              disabled={remainingAfterPayment > 0 && !nextPaymentDate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard size={14} />
              <span>Xác nhận thanh toán</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL XÁC NHẬN THANH TOÁN TIỀN MẶT */}
      <PaymentConfirmModal
        open={showConfirmModal && selectedMethod === 'CASH'}
        onClose={() => setShowConfirmModal(false)}
        invoice={invoice}
        payment={paymentPayload}
        onSuccess={handleConfirmSuccess}
      />

      {/* MODAL XÁC NHẬN THANH TOÁN CHUYỂN KHOẢN (Chỉ mở khi là BANK_TRANSFER) */}
      <BankQrPaymentModal
        open={showConfirmModal && selectedMethod === 'BANK_TRANSFER'}
        onClose={() => setShowConfirmModal(false)}
        invoice={invoice}
        payment={paymentPayload}
        onSuccess={handleConfirmSuccess}
      />

      {/* Prescription Select Modal */}
      <PrescriptionSelectModal
        open={showRxModal}
        onClose={() => setShowRxModal(false)}
        patientName={invoice.patientName}
        patientId={invoice.patientId}
        patientCode={invoice.patientCode}
        onAddPrescriptionItems={handleAddRxItems}
      />
    </>
  );
}
