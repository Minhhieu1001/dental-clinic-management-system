import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Stethoscope,
  User,
  Clock,
  Link as LinkIcon,
  Phone,
  Calendar,
  IdCard,
  History,
  Receipt,
  X,
  Save,
} from 'lucide-react';
import {
  Dialog,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../hooks/useAuth';
import PrintInvoiceModal from './PrintInvoiceModal';
import PaymentModal from './PaymentModal';
import PaymentHistoryModal from './PaymentHistory';
import VoucherSelectModal from './VoucherSelectModal';
import PaymentSuccessModal from './action/PaymentSuccessModal';
import { createInvoice as createInvoiceApi } from '../../../../services/invoice.service';
import { getAvailableVoucherByCouponCode } from '../../../../services/promotion.service';
import { mapBackendInvoiceToUi } from '../../../../utils/invoiceMapper';
import { useAuthStore } from '../../../../store/authStore';
import { DEFAULT_DENTAL_CLINIC_NAME, DEFAULT_DENTAL_CLINIC_ADDRESS, PHONE_NUMBER_CLINIC, } from '../../../medical-record/dentist/medicalRecordHelpers';
import { getEmployeeAddressById } from '../../../../services/employee.service';

export default function InvoiceDetailModal({ open, onClose, invoice, onPaymentSuccess, onSaveInvoice, onSaveSuccess }) {
  const user = useAuthStore.getState().user;
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [branchInfo, setBranchInfo] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [voucherInput, setVoucherInput] = useState(invoice?.appliedVoucher || invoice?.couponCode || '');
  const [appliedVoucher, setAppliedVoucher] = useState(
    invoice?.couponCode || invoice?.appliedVoucher
      ? { couponCode: invoice.couponCode || invoice.appliedVoucher, discountAmount: invoice.discountAmount, title: invoice.promotionTitle, id: invoice.promotionId }
      : null
  );

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPaymentData, setSuccessPaymentData] = useState(null);

  const activeInvoice = currentInvoice || invoice;

  // Lấy thông tin chi nhánh của nhân viên tạo hóa đơn (CHỈ khi tạo mới / hóa đơn chưa lưu)
  React.useEffect(() => {
    // Nếu hóa đơn đã được lưu trên BE (isSave = true), lấy trực tiếp từ BE, KHÔNG gọi lấy thông tin nhân viên
    if (activeInvoice?.isSave) {
      setBranchInfo(null);
      return;
    }

    const empId = user?.employeeId || user?.id;
    if (empId) {
      getEmployeeAddressById(empId)
        .then((res) => {
          const data = res?.data || res;
          if (data) {
            setBranchInfo(data);
          }
        })
        .catch((err) => {
          console.warn('Lỗi lấy thông tin chi nhánh của nhân viên:', err);
        });
    }
  }, [activeInvoice?.isSave, user?.employeeId, user?.id]);

  React.useEffect(() => {
    setCurrentInvoice(invoice);
    if (invoice) {
      const code = invoice.appliedVoucher || invoice.couponCode || '';
      setVoucherInput(code);
      setAppliedVoucher(
        invoice.couponCode || invoice.appliedVoucher
          ? { couponCode: invoice.couponCode || invoice.appliedVoucher, discountAmount: invoice.discountAmount, title: invoice.promotionTitle, id: invoice.promotionId }
          : null
      );
    }
  }, [invoice]);

  if (!activeInvoice) return null;
  const isSaved = Boolean(activeInvoice.isSave);

  const handleOpenHistory = () => {
    if (!activeInvoice.isSave) {
      toast.error('Hóa đơn chưa được tạo, không có lịch sử giao dịch!');
      return;
    }
    setShowHistoryModal(true);
  };

  const handleOpenPayment = () => {
    if (!activeInvoice.isSave) {
      toast.error('Hóa đơn chưa được lưu! Vui lòng lưu hóa đơn trước khi thanh toán.');
      return;
    }
    setShowPaymentModal(true);
  };

  // Thanh toán thành công: cập nhật lại trang chi tiết, mở modal thông báo thành công, rồi báo cho trang cha fetch lại danh sách
  const handlePaymentDone = async (updatedInvoice, paymentInfo) => {
    if (updatedInvoice) setCurrentInvoice(updatedInvoice);

    // Lưu thông tin chi tiết thanh toán để hiển thị trên PaymentSuccessModal
    setSuccessPaymentData({
      amount: paymentInfo?.amount ?? (updatedInvoice && activeInvoice ? (updatedInvoice.paidAmount - (activeInvoice.paidAmount || 0)) : null),
      transactionCode: paymentInfo?.transactionCode || null,
      invoiceCode: updatedInvoice?.id || updatedInvoice?.code || activeInvoice?.id || activeInvoice?.code,
      paymentMethod:
        paymentInfo?.methodLabel ||
        (paymentInfo?.paymentMethod === 'CASH'
          ? 'Tiền mặt'
          : paymentInfo?.paymentMethod === 'BANK_TRANSFER'
            ? 'Chuyển khoản (VietQR)'
            : paymentInfo?.paymentMethod || 'Tiền mặt'),
      transactionTime: paymentInfo?.createdAt || new Date(),
    });
    setShowSuccessModal(true);

    await onPaymentSuccess?.(updatedInvoice);
  };

  const serviceTotal = activeInvoice.totalAmount || 0;

  const calculateDiscount = () => {
    if (isSaved) return Number(activeInvoice?.discountAmount || 0);
    if (!appliedVoucher) return 0;

    const baseTotal = serviceTotal;
    const { discountPercent, discountAmount, maxDiscountAmount, type, value, maxDiscount } = appliedVoucher;

    // Giảm theo %
    const percent = discountPercent ?? (type === 'percent' ? value : null);
    if (percent && Number(percent) > 0) {
      let disc = (baseTotal * Number(percent)) / 100;
      const maxDisc = maxDiscountAmount ?? maxDiscount;
      if (maxDisc && Number(maxDisc) > 0) disc = Math.min(disc, Number(maxDisc));
      return Math.min(baseTotal, disc);
    }

    // Giảm theo số tiền cố định
    const fixed = discountAmount ?? (type === 'fixed' ? value : null);
    if (fixed && Number(fixed) > 0) {
      return Math.min(baseTotal, Number(fixed));
    }

    return 0;
  };

  const discountAmount = calculateDiscount();
  const finalServiceTotal = Math.max(0, serviceTotal - discountAmount);
  const totalInvoiceAmount = finalServiceTotal;
  const paidAmount = activeInvoice.paidAmount || 0;
  const remainingDebt = Math.max(0, totalInvoiceAmount - paidAmount);

  const handleSaveInvoiceClick = async () => {
    if (savingInvoice) return;
    setSavingInvoice(true);
    try {
      // Khi tạo hóa đơn mới: Lấy chi nhánh của nhân viên tạo map vào
      const effectiveBranchId = branchInfo?.branchId || user?.branchId || null;

      const payload = {
        branchId: effectiveBranchId,
        patientId: activeInvoice.patientId,
        treatmentPlanId: activeInvoice.treatmentPlanId,
        employeeId: user?.employeeId,
        promotionId: appliedVoucher?.id || null,
        totalAmount: serviceTotal,
        discountAmount: discountAmount,
        finalAmount: finalServiceTotal,
        details: (activeInvoice.services || []).map((s) => ({
          treatmentServiceId: s.treatmentServiceId || null,
          itemName: s.name,
          quantity: s.quantity || 1,
          unitPrice: s.price || 0,
          subtotal: s.total || 0,
        })),
      };

      const res = await createInvoiceApi(payload);
      const savedBackendInvoice = res?.data || res?.result || res;

      if (!savedBackendInvoice || (!savedBackendInvoice.id && !savedBackendInvoice.invoiceCode)) {
        throw new Error('Không nhận được dữ liệu phản hồi từ máy chủ khi tạo hóa đơn!');
      }

      let officialInvoice = mapBackendInvoiceToUi(savedBackendInvoice);
      officialInvoice = {
        ...officialInvoice,
        branchId: savedBackendInvoice.branchId || effectiveBranchId,
        branchName: savedBackendInvoice.branchName || branchInfo?.branchName,
        branchAddress: savedBackendInvoice.branchAddress || branchInfo?.branchAddress,
        branchPhone: savedBackendInvoice.branchPhone || branchInfo?.phone,
        patientName: activeInvoice.patientName || officialInvoice.patientName,
        patientPhone: activeInvoice.patientPhone || officialInvoice.patientPhone,
        patientCode: activeInvoice.patientCode || officialInvoice.patientCode,
        employeeName: officialInvoice.employeeName || activeInvoice.employeeName || 'Nhân viên',
        isSave: true,
        isDraft: false,
      };

      // Cập nhật lại hóa đơn đã lưu vào màn hình hiển thị modal
      setCurrentInvoice(officialInvoice);
      toast.success(`Đã lưu thành công hóa đơn ${officialInvoice.id} vào hệ thống!`);

      // Gọi callback để phía parent (EmployeeBilling) tải lại dữ liệu từ backend
      const callback = onSaveSuccess || onSaveInvoice;
      if (callback) {
        await callback(officialInvoice);
      }
    } catch (err) {
      console.error('Lỗi khi lưu hóa đơn:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể lưu hóa đơn!';
      toast.error(errorMsg);
    } finally {
      setSavingInvoice(false);
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0);

  const handleOpenVoucherModal = () => {
    setIsVoucherModalOpen(true);
  };

  const handleSelectVoucher = (voucher) => {
    if (!voucher) {
      setVoucherInput('');
      setAppliedVoucher(null);
    } else {
      setVoucherInput(voucher.couponCode || '');
      setAppliedVoucher(voucher);
    }
  };

  const handleApplyVoucherClick = async () => {
    const code = voucherInput.trim();
    if (!code) {
      setAppliedVoucher(null);
      return;
    }
    try {
      const res = await getAvailableVoucherByCouponCode(code);
      const voucher = res?.data || res;
      if (voucher && voucher.couponCode) {
        setAppliedVoucher(voucher);
        toast.success(`Đã áp dụng mã khuyến mãi ${voucher.couponCode}!`);
      } else {
        toast.error('Mã giảm giá không hợp lệ!');
        setAppliedVoucher(null);
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra mã khuyến mãi:', err);
      const errorMsg = err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!';
      toast.error(errorMsg);
      setAppliedVoucher(null);
    }
  };

  // Chi nhánh chỉ lấy từ 1 nguồn duy nhất theo ngữ cảnh:
  // - Khi get/xem hóa đơn đã lưu (activeInvoice.isSave = true): Lấy 100% từ resp BE của hóa đơn
  // - Khi tạo hóa đơn mới (chưa lưu): Lấy thông tin chi nhánh của nhân viên đăng nhập map vào
  const displayBranchName = activeInvoice?.isSave
    ? (activeInvoice?.branchName || 'Chi Nhánh 1 Cơ Sở TPHCM')
    : (branchInfo?.branchName || 'Chi Nhánh 1 Cơ Sở TPHCM');

  const displayBranchAddress = activeInvoice?.isSave
    ? (activeInvoice?.branchAddress || DEFAULT_DENTAL_CLINIC_ADDRESS)
    : (branchInfo?.branchAddress || DEFAULT_DENTAL_CLINIC_ADDRESS);

  const displayBranchPhone = activeInvoice?.isSave
    ? (activeInvoice?.branchPhone || PHONE_NUMBER_CLINIC)
    : (branchInfo?.phone || PHONE_NUMBER_CLINIC);

  const displayBranchId = activeInvoice?.isSave
    ? activeInvoice?.branchId
    : (branchInfo?.branchId || user?.branchId || null);

  const invoiceForActions = {
    ...activeInvoice,
    branchId: displayBranchId,
    branchName: displayBranchName,
    branchAddress: displayBranchAddress,
    branchPhone: displayBranchPhone,
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: '#f8fafc',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          },
        }}
      >
        <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-800">

          {/* Top Control Header (Navigation) */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <Button
                onClick={onClose}
                startIcon={<ArrowLeft size={18} />}
                size="small"
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  borderRadius: '6px',
                  px: 2,
                  py: 0.6,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
                }}
              >
                Quay lại
              </Button>
              <div className="h-5 w-[1px] bg-slate-200" />
            </div>

            {/* Dấu X đóng modal ở góc phải */}
            <IconButton
              onClick={onClose}
              size="small"
            >
              <X size={18} />
            </IconButton>
          </div>

          {/* Main Content Layout */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="max-w-[1700px] mx-auto space-y-3">

              {/* VÙNG HEADER NẰM TRÊN 3 CỘT */}
              <div className="bg-white rounded-sm border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
                    <Receipt size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-bold text-slate-900 text-lg tracking-tight">
                        {invoice.isDraft ? 'HÓA ĐƠN MỚI' : `Hóa đơn thanh toán dịch vụ - ${invoice.id}`}
                      </h2>
                      <Chip
                        label={invoice.isDraft ? 'Hóa đơn chưa tạo' : invoice.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '11px',
                          height: '24px',
                          backgroundColor:
                            invoice.isDraft
                              ? '#fffbeb'
                              : invoice.status === 'Đã thanh toán'
                                ? '#ecfdf5'
                                : invoice.status === 'Thanh toán một phần'
                                  ? '#fffbeb'
                                  : '#fef2f2',
                          color:
                            invoice.isDraft
                              ? '#d97706'
                              : invoice.status === 'Đã thanh toán'
                                ? '#059669'
                                : invoice.status === 'Thanh toán một phần'
                                  ? '#d97706'
                                  : '#dc2626',
                          border: `1px solid ${invoice.isDraft
                            ? '#fde68a'
                            : invoice.status === 'Đã thanh toán'
                              ? '#a7f3d0'
                              : invoice.status === 'Thanh toán một phần'
                                ? '#fde68a'
                                : '#fecaca'
                            }`,
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nút thao tác bên phải Vùng Header */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    onClick={() => setShowPrintModal(true)}
                    startIcon={<Printer size={16} />}
                    variant="outlined"
                    size="medium"
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#334155',
                      backgroundColor: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      borderRadius: '4px',
                      px: 2.2,
                      py: 0.8,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f8fafc',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    In hóa đơn
                  </Button>

                  <Button
                    onClick={handleOpenHistory}
                    startIcon={<History size={17} />}
                    variant="outlined"
                    size="medium"
                    sx={{
                      color: '#2563eb',
                      borderColor: '#bfdbfe',
                      backgroundColor: '#eff6ff',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      borderRadius: '4px',
                      px: 2.5,
                      py: 0.8,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#dbeafe',
                        borderColor: '#93c5fd',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 4px 0 rgba(37, 99, 235, 0.12)',
                      },
                    }}
                  >
                    Lịch sử thanh toán
                  </Button>
                </div>
              </div>

              {/* 3 COLUMNS GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">

                {/* PANEL 1 (LEFT): Thông tin nha khoa + Khách hàng + Hóa đơn */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-sm border border-slate-200/90 divide-y divide-slate-100 shadow-xs h-[530px]">

                    {/* Section 1: Thông tin nha khoa */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">THÔNG TIN NHA KHOA</h3>
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                          <Stethoscope size={20} />
                        </div>
                        <div className="space-y-1 text-xs">
                          <h4 className="font-bold text-slate-900 text-sm">Nha Khoa Quốc Tế Crown Dental</h4>
                          <p className="text-slate-800 font-semibold">{displayBranchName}</p>
                          <p className="text-slate-500 leading-relaxed">{displayBranchAddress}</p>
                          <p className="text-slate-500">Điện thoại: <span className="font-semibold text-slate-700">{displayBranchPhone}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Thông tin khách hàng */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">THÔNG TIN KHÁCH HÀNG</h3>
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                          <User size={20} />
                        </div>
                        <div className="space-y-2 text-xs w-full">
                          <h4 className="font-bold text-slate-900 text-sm">{invoice.patientName}</h4>
                          <div className="space-y-1.5 text-slate-600 font-medium">
                            <p className="flex items-center gap-2">
                              <Phone size={14} className="text-blue-500" />
                              <span>SĐT: <strong className="text-slate-900 font-bold">{invoice.patientPhone}</strong></span>
                            </p>
                            <p className="flex items-center gap-2">
                              <IdCard size={14} className="text-blue-500" />
                              <span>Mã hồ sơ: <strong className="text-slate-900 font-bold">{invoice.patientCode || invoice.patientProfileCode || invoice.patientId}</strong></span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar size={14} className="text-blue-500" />
                              <span>Ngày sinh: <strong className="text-slate-900 font-bold">{invoice.patientDob || '15/05/1990'}</strong></span>
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Section 3: Thông tin hóa đơn */}
                    <div className="p-5 space-y-3 ">
                      <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">THÔNG TIN HÓA ĐƠN</h3>
                      <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mã hóa đơn:</span>
                          <strong className="text-slate-900 font-bold">{invoice.id}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ngày tạo:</span>
                          <strong className="text-slate-900 font-bold">{invoice.date} 10:24</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Người lập hóa đơn:</span>
                          <strong className="text-slate-900 font-bold">{invoice.employeeName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ghi chú:</span>
                          <strong className="text-slate-700 font-normal">{invoice.note || '-'}</strong>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* PANEL 2 (MIDDLE): Chi tiết dịch vụ + Tổng tiền */}
                <div className="lg:col-span-6">
                  <div className="bg-white rounded-sm border border-slate-200/90 shadow-xs overflow-hidden h-[530px] flex flex-col justify-between">

                    {/* Header & Table Container */}
                    <div className="flex flex-col flex-1 min-h-0">
                      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 shrink-0">
                        <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">CHI TIẾT DỊCH VỤ</h3>
                      </div>

                      {/* Scrollable Table Container */}
                      <TableContainer sx={{ flex: 1, maxHeight: '310px', overflowY: 'auto' }}>
                        <Table size="medium" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, width: 55, whiteSpace: 'nowrap' }}>STT</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, whiteSpace: 'nowrap' }}>DỊCH VỤ</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, whiteSpace: 'nowrap' }}>ĐƠN GIÁ</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, whiteSpace: 'nowrap', minWidth: 95 }}>SỐ LƯỢNG</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, whiteSpace: 'nowrap' }}>THÀNH TIỀN</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoice.services.map((item, idx) => (
                              <TableRow key={idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                <TableCell align="center" sx={{ fontSize: '13px', color: '#94a3b8', py: 1.5 }}>{idx + 1}</TableCell>
                                <TableCell sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', py: 1.5 }}>{item.name}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '13px', color: '#334155', py: 1.5 }}>{formatVND(item.price)}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', py: 1.5 }}>{item.quantity}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', py: 1.5 }}>{formatVND(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </div>

                    {/* Under-table summary */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
                      <div className="max-w-[460px] ml-auto space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between items-center font-medium text-slate-600">
                          <span>Tiền dịch vụ</span>
                          <span className="font-extrabold text-slate-900">{formatVND(serviceTotal)}</span>
                        </div>

                        {/* Promo row */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 font-medium shrink-0">Giảm giá</span>
                          <div className="flex items-center gap-2 flex-1 max-w-[300px]">
                            <input
                              type="text"
                              placeholder={isSaved ? "Hóa đơn đã lưu" : "Nhập mã giảm giá"}
                              value={voucherInput}
                              disabled={isSaved}
                              onChange={(e) => {
                                setVoucherInput(e.target.value);
                                if (!e.target.value.trim()) {
                                  setAppliedVoucher(null);
                                }
                              }}
                              className={`w-full border rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${isSaved
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-800 border-slate-300 placeholder-slate-400'
                                }`}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              disabled={isSaved}
                              onClick={voucherInput.trim() ? handleApplyVoucherClick : handleOpenVoucherModal}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                fontWeight: 700,
                                height: '30px',
                                px: 1,
                                borderColor: '#93c5fd',
                                color: '#2563eb',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                shrink: 0,
                                flexShrink: 0,
                                '&.Mui-disabled': {
                                  backgroundColor: '#f1f5f9',
                                  borderColor: '#e2e8f0',
                                  color: '#94a3b8',
                                },
                                '&:hover': { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
                              }}
                            >
                              {voucherInput.trim() ? 'Áp dụng' : 'Chọn voucher'}
                            </Button>
                          </div>
                          <span className="font-extrabold text-slate-900 w-20 text-right">{discountAmount > 0 ? formatVND(discountAmount) : '0'}</span>
                        </div>

                        <div className="flex justify-between items-center font-bold pt-2 border-t border-slate-200">
                          <span className="text-blue-600 font-extrabold">Tổng chi phí</span>
                          <span className="font-black text-blue-600 text-base">{formatVND(finalServiceTotal)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* PANEL 3 (RIGHT): Tổng quan + Thanh toán (Đưa 2 nút xuống cuối panel) */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-sm border border-slate-200/90 divide-y divide-slate-100 shadow-xs h-[530px] flex flex-col justify-between">

                    <div>
                      {/* Section 1: Tổng quan */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">TỔNG QUAN</h3>
                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Tổng tiền dịch vụ</span>
                            <span className="font-bold text-slate-900">{formatVND(serviceTotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Giảm giá</span>
                            <span className="font-bold text-slate-900">{discountAmount > 0 ? formatVND(discountAmount) : '0'}</span>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-sm">Tổng tiền</span>
                            <span className="font-black text-rose-600 text-xl">{formatVND(totalInvoiceAmount)}đ</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Thanh toán */}
                      <div className="p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">THANH TOÁN</h3>
                        <div className="space-y-3.5 text-xs sm:text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Đã thanh toán</span>
                            <div className="w-28 px-3 py-1 bg-slate-50 border border-slate-300 rounded-md text-right font-black text-slate-900">
                              {formatVND(paidAmount)}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Còn nợ</span>
                            <span className="font-black text-rose-600 text-base">{formatVND(remainingDebt)}</span>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-600 font-medium">Trạng thái</span>
                            <Chip
                              icon={<LinkIcon size={12} />}
                              label={invoice.isDraft ? 'Hóa đơn chưa tạo' : invoice.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '11.5px',
                                height: '24px',
                                backgroundColor: invoice.isDraft
                                  ? '#fffbeb'
                                  : invoice.status === 'Đã thanh toán'
                                    ? '#ecfdf5'
                                    : invoice.status === 'Thanh toán một phần'
                                      ? '#fffbeb'
                                      : '#fef2f2',
                                color: invoice.isDraft
                                  ? '#d97706'
                                  : invoice.status === 'Đã thanh toán'
                                    ? '#059669'
                                    : invoice.status === 'Thanh toán một phần'
                                      ? '#d97706'
                                      : '#dc2626',
                                border: `1px solid ${invoice.isDraft
                                  ? '#fde68a'
                                  : invoice.status === 'Đã thanh toán'
                                    ? '#a7f3d0'
                                    : invoice.status === 'Thanh toán một phần'
                                      ? '#fde68a'
                                      : '#fecaca'
                                  }`,
                                borderRadius: '12px',
                                '& .MuiChip-icon': {
                                  color: invoice.isDraft
                                    ? '#d97706'
                                    : invoice.status === 'Đã thanh toán'
                                      ? '#059669'
                                      : invoice.status === 'Thanh toán một phần'
                                        ? '#d97706'
                                        : '#dc2626'
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Đặt 2 Nút Lưu Hóa Đơn & Thanh Toán ở Cuối Panel */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50/40 mt-auto">
                      <div className="flex items-center gap-2.5">
                        <Button
                          variant="contained"
                          startIcon={<Save size={15} />}
                          onClick={handleSaveInvoiceClick}
                          disabled={savingInvoice || invoice.isSave}
                          size="medium"
                          className="flex-1"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '12.5px',
                            backgroundColor: invoice.isSave ? '#94a3b8' : '#16a34a',
                            color: '#ffffff',
                            borderRadius: '6px',
                            py: 1,
                            px: 1,
                            whiteSpace: 'nowrap',
                            boxShadow: 'none',
                            '&:hover': {
                              backgroundColor: invoice.isSave ? '#94a3b8' : '#15803d',
                              boxShadow: 'none',
                            },
                            '&:disabled': {
                              backgroundColor: invoice.isSave ? '#cbd5e1' : '#86efac',
                              color: invoice.isSave ? '#64748b' : '#ffffff',
                              cursor: 'not-allowed',
                            },
                          }}
                        >
                          {savingInvoice ? 'Đang lưu...' : invoice.isSave ? 'Đã lưu hóa đơn' : 'Lưu hóa đơn'}
                        </Button>

                        {remainingDebt > 0 && (
                          <Button
                            variant="contained"
                            startIcon={<CreditCard size={15} />}
                            onClick={handleOpenPayment}
                            size="medium"
                            className="flex-1"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              backgroundColor: '#2563eb',
                              borderRadius: '6px',
                              py: 1,
                              px: 1,
                              whiteSpace: 'nowrap',
                              boxShadow: 'none',
                              '&:hover': { backgroundColor: '#1d4ed8', boxShadow: 'none' },
                            }}
                          >
                            Thanh toán
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Payment Transaction History Modal */}
      <PaymentHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        invoice={activeInvoice}
      />

      {/* Printable PDF Modal */}
      <PrintInvoiceModal open={showPrintModal} onClose={() => setShowPrintModal(false)} invoice={invoiceForActions} />

      {/* Payment Processing Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoiceForActions}
        onPaymentSuccess={handlePaymentDone}
      />

      {/* Voucher Selection Modal */}
      <VoucherSelectModal
        open={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        appliedVoucher={appliedVoucher}
        onSelectVoucher={handleSelectVoucher}
      />

      {/* Modal Thông báo thanh toán thành công */}
      <PaymentSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        amount={successPaymentData?.amount}
        transactionCode={successPaymentData?.transactionCode}
        invoiceCode={successPaymentData?.invoiceCode}
        paymentMethod={successPaymentData?.paymentMethod}
        transactionTime={successPaymentData?.transactionTime}
        buttonText="Hoàn tất"
      />
    </>
  );
}
