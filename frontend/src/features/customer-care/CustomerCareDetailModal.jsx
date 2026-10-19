import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import customerCareService from '../../services/customerCare.service';

export default function CustomerCareDetailModal({
  isOpen,
  onClose,
  patientId,
  appointmentId,
  invoiceId,
  initialPatientData,
  currentStaffName = 'Nguyệt Nguyễn',
  dentistOptions = [],
  onDataChanged,
}) {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Pagination for Care History
  const [carePage, setCarePage] = useState(1);
  const CARE_PAGE_SIZE = 5;

  // Pagination for Appointments
  const [aptPage, setAptPage] = useState(1);
  const APT_PAGE_SIZE = 10;

  // Pagination for Invoices
  const [invoicePage, setInvoicePage] = useState(1);
  const INVOICE_PAGE_SIZE = 5;

  // Sub-modal: Thêm chăm sóc
  const [showAddCareModal, setShowAddCareModal] = useState(false);
  const [addCareForm, setAddCareForm] = useState({
    channel: 'PHONE',
    status: 'COMPLETED',
    careType: invoiceId ? 'PAYMENT' : 'APPOINTMENT_REMINDER',
    notes: '',
    careTime: new Date().toISOString().substring(0, 16),
  });
  const [submittingCare, setSubmittingCare] = useState(false);

  // Sub-modal: Thêm / Sửa lịch hẹn
  const [showAddAptModal, setShowAddAptModal] = useState(false);
  const [editingAptId, setEditingAptId] = useState(null);
  const [aptForm, setAptForm] = useState({
    appointmentTime: new Date().toISOString().substring(0, 16),
    appointmentType: 'Đặt trước',
    dentistId: '',
    content: '',
    notes: '',
    status: 'PENDING',
  });
  const [submittingApt, setSubmittingApt] = useState(false);

  // Load patient care detail
  const loadDetail = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await customerCareService.getPatientCareDetail(patientId, appointmentId, invoiceId);
      setDetailData(res.data);
    } catch (err) {
      console.error('Failed to load patient care detail:', err);
      // Fallback with initial data if available
      if (initialPatientData) {
        setDetailData({
          patientId: patientId,
          patientCode: initialPatientData.patientCode || '—',
          fullName: initialPatientData.fullName || initialPatientData.patientName || '—',
          phone: initialPatientData.phoneNumber || initialPatientData.phone || '—',
          dateOfBirthFormatted: initialPatientData.dateOfBirthFormatted || '—',
          reminderInfo: {
            timeFormatted: initialPatientData.appointmentTime || '—',
            dentistName: initialPatientData.dentistName || '—',
            status: initialPatientData.scheduleStatus || 'Chưa đến',
            content: initialPatientData.serviceName || initialPatientData.reason || '—',
          },
          careHistory: [],
          appointments: [],
        });
      } else {
        toast.error('Không thể tải chi tiết chăm sóc khách hàng');
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, initialPatientData]);

  useEffect(() => {
    if (isOpen && patientId) {
      setCarePage(1);
      setAptPage(1);
      loadDetail();
    }
  }, [isOpen, patientId, loadDetail]);

  // Format datetime
  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      const d = new Date(dt);
      if (isNaN(d.getTime())) return dt;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    } catch {
      return dt;
    }
  };

  // Care status badge styling
  const getCareStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn thành') || s.includes('completed')) {
      return 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]';
    }
    if (s.includes('lại') || s.includes('recare')) {
      return 'bg-amber-50 text-amber-700 border-amber-300';
    }
    if (s.includes('thất bại') || s.includes('không nghe máy') || s.includes('failed')) {
      return 'bg-red-50 text-red-600 border-red-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-300';
  };

  // Appointment status select background styling (matches image)
  const getAppointmentStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('chưa đến') || s.includes('pending')) {
      return 'bg-[#76cca6] text-emerald-950 border-[#5cb88f]';
    }
    if (s.includes('đang điều trị') || s.includes('in_progress')) {
      return 'bg-[#f0a969] text-amber-950 border-[#e59550]';
    }
    if (s.includes('hẹn lại') || s.includes('waiting')) {
      return 'bg-[#a6b1ba] text-slate-900 border-[#94a0aa]';
    }
    if (s.includes('xong') || s.includes('hoàn thành') || s.includes('completed')) {
      return 'bg-emerald-500 text-white border-emerald-600';
    }
    if (s.includes('hủy') || s.includes('cancelled')) {
      return 'bg-rose-400 text-white border-rose-500';
    }
    return 'bg-[#76cca6] text-emerald-950 border-[#5cb88f]';
  };

  // Sanitize and render appointment type badge nicely
  const renderAppointmentTypeBadge = (rawType) => {
    let type = (rawType || '').trim();
    // If raw type is a UUID string, fallback to "Đặt trước"
    if (!type || /^[0-9a-fA-F-]{20,}$/.test(type)) {
      type = 'Đặt trước';
    }

    const lower = type.toLowerCase();
    if (lower.includes('dự kiến')) {
      return (
        <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-medium border border-amber-300 bg-amber-50 text-amber-700 whitespace-nowrap">
          {type}
        </span>
      );
    }
    if (lower.includes('tái khám')) {
      return (
        <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-medium border border-purple-300 bg-purple-50 text-purple-700 whitespace-nowrap">
          {type}
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-medium border border-gray-300 bg-white text-gray-700 whitespace-nowrap">
        {type}
      </span>
    );
  };

  // Handle appointment status change directly from dropdown
  const handleStatusChange = async (aptId, newStatus) => {
    try {
      await customerCareService.updateAppointmentStatus(aptId, newStatus);
      toast.success(`Đã cập nhật trạng thái: ${newStatus}`);
      loadDetail();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  // Handle appointment deletion
  const handleDeleteApt = async (aptId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này không?')) return;
    try {
      await customerCareService.deleteAppointment(aptId);
      toast.success('Đã xóa lịch hẹn thành công');
      loadDetail();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      toast.error('Không thể xóa lịch hẹn');
    }
  };

  // Handle open Edit appointment modal
  const handleOpenEditApt = (apt) => {
    setEditingAptId(apt.id);
    let timeStr = new Date().toISOString().substring(0, 16);
    if (apt.appointmentTime) {
      const d = new Date(apt.appointmentTime);
      if (!isNaN(d.getTime())) {
        timeStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
      }
    }
    setAptForm({
      appointmentTime: timeStr,
      appointmentType: apt.appointmentType || 'Đặt trước',
      dentistId: apt.dentistId || '',
      content: apt.content || '',
      notes: apt.notes || '',
      status: apt.statusLabel || apt.status || 'PENDING',
    });
    setShowAddAptModal(true);
  };

  // Handle submit appointment (create or edit)
  const handleSubmitApt = async (e) => {
    e.preventDefault();
    if (!aptForm.appointmentTime) {
      toast.error('Vui lòng chọn thời gian hẹn');
      return;
    }
    setSubmittingApt(true);
    try {
      if (editingAptId) {
        // Update existing status / appointment
        await customerCareService.updateAppointmentStatus(editingAptId, aptForm.status);
        toast.success('Đã cập nhật lịch hẹn thành công');
      } else {
        // Create new appointment
        await customerCareService.createPatientAppointment(patientId, {
          appointmentTime: aptForm.appointmentTime,
          appointmentType: aptForm.appointmentType,
          dentistId: aptForm.dentistId || null,
          content: aptForm.content,
          notes: aptForm.notes,
          status: aptForm.status,
        });
        toast.success('Tạo lịch hẹn mới thành công');
      }
      setShowAddAptModal(false);
      setEditingAptId(null);
      loadDetail();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to save appointment:', err);
      toast.error('Thao tác lịch hẹn thất bại');
    } finally {
      setSubmittingApt(false);
    }
  };

  // Handle submit new Customer Care record
  const handleSubmitCare = async (e) => {
    e.preventDefault();
    if (!addCareForm.notes.trim()) {
      toast.error('Vui lòng nhập nội dung chăm sóc');
      return;
    }
    setSubmittingCare(true);
    try {
      await customerCareService.createCareRecord({
        patientId: patientId,
        appointmentId: appointmentId || null,
        invoiceId: invoiceId || null,
        channel: addCareForm.channel,
        status: addCareForm.status,
        careType: addCareForm.careType,
        notes: addCareForm.notes,
        careTime: addCareForm.careTime,
        createdByName: currentStaffName,
      });
      toast.success('Ghi nhận chăm sóc khách hàng thành công');
      setShowAddCareModal(false);
      setAddCareForm({
        channel: 'PHONE',
        status: 'COMPLETED',
        careType: invoiceId ? 'PAYMENT' : 'APPOINTMENT_REMINDER',
        notes: '',
        careTime: new Date().toISOString().substring(0, 16),
      });
      loadDetail();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to create care record:', err);
      toast.error('Không thể tạo chăm sóc');
    } finally {
      setSubmittingCare(false);
    }
  };

  if (!isOpen) return null;

  // Pagination slicing
  const careHistory = detailData?.careHistory || [];
  const totalCarePages = Math.max(1, Math.ceil(careHistory.length / CARE_PAGE_SIZE));
  const careStartIndex = (carePage - 1) * CARE_PAGE_SIZE;
  const careEndIndex = careStartIndex + CARE_PAGE_SIZE;
  const currentCareRecords = careHistory.slice(careStartIndex, careEndIndex);

  const appointments = detailData?.appointments || [];
  const totalAptPages = Math.max(1, Math.ceil(appointments.length / APT_PAGE_SIZE));
  const aptStartIndex = (aptPage - 1) * APT_PAGE_SIZE;
  const aptEndIndex = aptStartIndex + APT_PAGE_SIZE;
  const currentAppointments = appointments.slice(aptStartIndex, aptEndIndex);

  const invoicesList = detailData?.invoices || [];
  const totalInvoicePages = Math.max(1, Math.ceil(invoicesList.length / INVOICE_PAGE_SIZE));
  const invoiceStartIndex = (invoicePage - 1) * INVOICE_PAGE_SIZE;
  const invoiceEndIndex = invoiceStartIndex + INVOICE_PAGE_SIZE;
  const currentInvoices = invoicesList.slice(invoiceStartIndex, invoiceEndIndex);

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* ===================== MODAL HEADER ===================== */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
          <h2 className="text-sm font-bold text-gray-800 tracking-wide uppercase">
            CHI TIẾT CHĂM SÓC KHÁCH HÀNG
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================== MODAL BODY ===================== */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 bg-white">
          {loading && !detailData ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-purple-600" />
              <p className="text-xs">Đang tải chi tiết chăm sóc khách hàng...</p>
            </div>
          ) : (
            <>
              {/* ===================== PHẦN 1 & 2: TOP INFO SECTION ===================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 border-b border-gray-100 text-xs">
                {/* PHẦN 1: Thông tin khách hàng */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 text-xs">Thông tin khách hàng</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="text-gray-500">Mã hồ sơ:</span>{' '}
                      <span className="text-[#6366f1] font-semibold hover:underline cursor-pointer">
                        {detailData?.patientCode || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Số điện thoại:</span>{' '}
                      <span className="text-gray-800 font-medium">
                        {detailData?.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Họ tên:</span>{' '}
                      <span className="text-[#6366f1] font-semibold hover:underline cursor-pointer">
                        {detailData?.fullName || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ngày sinh:</span>{' '}
                      <span className="text-gray-800 font-medium">
                        {detailData?.dateOfBirthFormatted || '—'}
                      </span>
                    </div>
                    {detailData?.address && (
                      <div className="col-span-2 text-gray-700">
                        <span className="text-gray-500">Địa chỉ:</span>{' '}
                        <span className="font-medium text-gray-800">{detailData.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PHẦN 2: THÔNG TIN NHẮC LỊCH HẸN & HÓA ĐƠN CÔNG NỢ */}
                <div className="space-y-2">
                  {detailData?.reminderInfo && detailData?.invoiceInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Card 1: Thông tin nhắc lịch hẹn */}
                      <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs">
                          <Calendar size={13} className="text-purple-600" />
                          <span>Thông tin nhắc lịch hẹn</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          <div>
                            <span className="text-gray-500 text-[11px]">Thời gian:</span>{' '}
                            <span className="text-gray-800 font-medium">{detailData.reminderInfo.timeFormatted || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Bác sĩ:</span>{' '}
                            <span className="text-gray-800 font-medium">{detailData.reminderInfo.dentistName || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Trạng thái:</span>{' '}
                            <span className="text-gray-800 font-medium">{detailData.reminderInfo.status || 'Chưa đến'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Nội dung:</span>{' '}
                            <span className="text-gray-800 font-medium truncate block" title={detailData.reminderInfo.content}>
                              {detailData.reminderInfo.content || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Thông tin hóa đơn & công nợ */}
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-gray-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={13} className="text-emerald-600" />
                            <span>Thông tin hóa đơn & công nợ</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            detailData.invoiceInfo.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {detailData.invoiceInfo.paymentStatusLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                          <div>
                            <span className="text-gray-500 text-[11px]">Mã HĐ:</span>{' '}
                            <span className="font-mono font-bold text-purple-700">{detailData.invoiceInfo.invoiceCode}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Tổng tiền:</span>{' '}
                            <span className="font-bold text-gray-800">{formatCurrency(detailData.invoiceInfo.finalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Đã trả:</span>{' '}
                            <span className="font-semibold text-emerald-600">{formatCurrency(detailData.invoiceInfo.paidAmount)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 text-[11px]">Ngày lập:</span>{' '}
                            <span className="text-gray-700 font-medium">{detailData.invoiceInfo.dateFormatted || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Còn nợ:</span>{' '}
                            <span className={`font-bold ${Number(detailData.invoiceInfo.remainingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatCurrency(detailData.invoiceInfo.remainingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : detailData?.invoiceInfo ? (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-gray-800 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={13} className="text-emerald-600" />
                          <span>Thông tin hóa đơn & công nợ hiện tại</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          detailData.invoiceInfo.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {detailData.invoiceInfo.paymentStatusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-gray-500 text-[11px]">Mã HĐ:</span>{' '}
                          <span className="font-mono font-bold text-purple-700">{detailData.invoiceInfo.invoiceCode}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[11px]">Ngày lập:</span>{' '}
                          <span className="text-gray-800 font-medium">{detailData.invoiceInfo.dateFormatted || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[11px]">Tổng tiền:</span>{' '}
                          <span className="font-bold text-gray-800">{formatCurrency(detailData.invoiceInfo.finalAmount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[11px]">Đã trả:</span>{' '}
                          <span className="font-semibold text-emerald-600">{formatCurrency(detailData.invoiceInfo.paidAmount)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 text-[11px]">Thu ngân:</span>{' '}
                          <span className="text-gray-700 font-medium">{detailData.invoiceInfo.employeeName || '—'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 text-[11px]">Số tiền còn nợ:</span>{' '}
                          <span className={`font-bold text-sm ${Number(detailData.invoiceInfo.remainingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(detailData.invoiceInfo.remainingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-gray-800 text-xs mb-1.5">Thông tin nhắc lịch hẹn</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-gray-500">Thời gian:</span>{' '}
                          <span className="text-gray-800 font-medium">{detailData?.reminderInfo?.timeFormatted || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bác sĩ:</span>{' '}
                          <span className="text-gray-800 font-medium">{detailData?.reminderInfo?.dentistName || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Trạng thái:</span>{' '}
                          <span className="text-gray-800 font-medium">{detailData?.reminderInfo?.status || 'Chưa đến'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Nội dung:</span>{' '}
                          <span className="text-gray-800 font-medium">{detailData?.reminderInfo?.content || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ===================== PHẦN 3: LỊCH SỬ CHĂM SÓC ===================== */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800">Lịch sử chăm sóc</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAddCareForm({
                        channel: 'PHONE',
                        status: 'COMPLETED',
                        careType: 'APPOINTMENT_REMINDER',
                        notes: '',
                        careTime: new Date().toISOString().substring(0, 16),
                      });
                      setShowAddCareModal(true);
                    }}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Thêm chăm sóc
                  </button>
                </div>

                {/* Table: Lịch sử chăm sóc */}
                <div className="border border-gray-200 rounded-lg overflow-y-auto overflow-x-auto max-h-[200px] relative shadow-2xs custom-scrollbar">
                  <table className="w-full min-w-[760px] text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-36 whitespace-nowrap border-b border-slate-200">Thời gian</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-28 whitespace-nowrap border-b border-slate-200">Kênh chăm sóc</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-center w-36 whitespace-nowrap border-b border-slate-200">Trạng thái chăm sóc</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-36 whitespace-nowrap border-b border-slate-200">Người tạo</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 min-w-[200px] border-b border-slate-200">Nội dung</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {currentCareRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400 italic border-b border-gray-100">
                            Chưa có lịch sử chăm sóc
                          </td>
                        </tr>
                      ) : (
                        currentCareRecords.map((c) => (
                          <tr key={c.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2.5 px-3 text-gray-800 whitespace-nowrap border-b border-gray-100">
                              {formatDateTime(c.careTime || c.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {c.channelLabel || c.channel || 'Gọi điện'}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-b border-gray-100">
                              <span
                                className={`inline-block px-3 py-0.5 rounded-md text-[11px] font-medium border ${getCareStatusBadgeClass(
                                  c.statusLabel || c.status
                                )}`}
                              >
                                {c.statusLabel || c.status || 'Hoàn thành'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {c.createdByName || 'Nguyệt Nguyễn'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-700 max-w-md truncate border-b border-gray-100" title={c.notes}>
                              {c.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination: Lịch sử chăm sóc */}
                <div className="flex items-center justify-end gap-2 text-xs text-gray-500 pt-1">
                  <span>
                    {careHistory.length === 0
                      ? '0-0 trên 0 bản ghi'
                      : `${careStartIndex + 1}-${Math.min(careEndIndex, careHistory.length)} trên ${careHistory.length} bản ghi`}
                  </span>
                  <button
                    type="button"
                    disabled={carePage <= 1}
                    onClick={() => setCarePage((p) => p - 1)}
                    className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="w-6 h-6 rounded-md bg-[#7c3aed] text-white flex items-center justify-center text-xs font-semibold">
                    {carePage}
                  </span>
                  <button
                    type="button"
                    disabled={carePage >= totalCarePages}
                    onClick={() => setCarePage((p) => p + 1)}
                    className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* ===================== PHẦN 4: LỊCH HẸN ===================== */}
              <div className="space-y-2.5 pt-1">
                <div className="sticky top-0 z-10 bg-white py-1 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800">Lịch hẹn</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAptId(null);
                      setAptForm({
                        appointmentTime: new Date().toISOString().substring(0, 16),
                        appointmentType: 'Đặt trước',
                        dentistId: dentistOptions[0]?.id || '',
                        content: '',
                        notes: '',
                        status: 'PENDING',
                      });
                      setShowAddAptModal(true);
                    }}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Thêm lịch hẹn
                  </button>
                </div>

                {/* Table: Lịch hẹn */}
                <div className="border border-gray-200 rounded-lg overflow-y-auto overflow-x-auto max-h-[220px] relative shadow-2xs custom-scrollbar">
                  <table className="w-full min-w-[940px] text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-36 min-w-[135px] whitespace-nowrap border-b border-slate-200">Thời gian</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-center w-28 min-w-[105px] whitespace-nowrap border-b border-slate-200">Loại lịch hẹn</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-44 min-w-[165px] whitespace-nowrap border-b border-slate-200">Bác sĩ</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 min-w-[180px] border-b border-slate-200">Nội dung</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 min-w-[140px] max-w-[200px] border-b border-slate-200">Ghi chú</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-center w-36 min-w-[135px] whitespace-nowrap border-b border-slate-200">Trạng thái</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-center w-20 min-w-[80px] whitespace-nowrap border-b border-slate-200">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {currentAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-gray-400 italic border-b border-gray-100">
                            Chưa có lịch hẹn nào
                          </td>
                        </tr>
                      ) : (
                        currentAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2.5 px-3 text-gray-800 whitespace-nowrap font-medium border-b border-gray-100">
                              {apt.timeFormatted || formatDateTime(apt.appointmentTime)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-b border-gray-100">
                              {renderAppointmentTypeBadge(apt.appointmentType)}
                            </td>
                            <td className="py-2.5 px-3 text-gray-800 whitespace-nowrap border-b border-gray-100">
                              {apt.dentistName || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-800 whitespace-nowrap font-medium border-b border-gray-100">
                              {apt.content || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate border-b border-gray-100" title={apt.notes}>
                              {apt.notes || ''}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-b border-gray-100">
                              {/* Status Select dropdown styled exactly like Image 1 */}
                              <div className="relative inline-block text-left">
                                <select
                                  value={apt.statusLabel || apt.status}
                                  onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                                  className={`cursor-pointer appearance-none text-xs font-semibold px-3 py-1 pr-7 rounded transition-colors border shadow-xs ${getAppointmentStatusClass(
                                    apt.statusLabel || apt.status
                                  )}`}
                                >
                                  <option value="Chưa đến" className="bg-white text-gray-800">
                                    Chưa đến
                                  </option>
                                  <option value="Đang điều trị" className="bg-white text-gray-800">
                                    Đang điều trị
                                  </option>
                                  <option value="Đã hẹn lại" className="bg-white text-gray-800">
                                    Đã hẹn lại
                                  </option>
                                  <option value="Đã xong" className="bg-white text-gray-800">
                                    Đã xong
                                  </option>
                                  <option value="Đã hủy" className="bg-white text-gray-800">
                                    Đã hủy
                                  </option>
                                </select>
                                <ChevronDown
                                  size={13}
                                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-800"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-b border-gray-100">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  title="Chỉnh sửa lịch hẹn"
                                  onClick={() => handleOpenEditApt(apt)}
                                  className="w-6 h-6 rounded-md border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  type="button"
                                  title="Xóa lịch hẹn"
                                  onClick={() => handleDeleteApt(apt.id)}
                                  className="w-6 h-6 rounded-md border border-rose-300 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination: Lịch hẹn */}
                <div className="flex items-center justify-end gap-2 text-xs text-gray-500 pt-1">
                  <span>
                    {appointments.length === 0
                      ? '0-0 trên 0 bản ghi'
                      : `${aptStartIndex + 1}-${Math.min(aptEndIndex, appointments.length)} trên ${appointments.length} bản ghi`}
                  </span>
                  <button
                    type="button"
                    disabled={aptPage <= 1}
                    onClick={() => setAptPage((p) => p - 1)}
                    className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="w-6 h-6 rounded-md bg-[#7c3aed] text-white flex items-center justify-center text-xs font-semibold">
                    {aptPage}
                  </span>
                  <button
                    type="button"
                    disabled={aptPage >= totalAptPages}
                    onClick={() => setAptPage((p) => p + 1)}
                    className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* ===================== PHẦN 5: HÓA ĐƠN & CÔNG NỢ ===================== */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-purple-600" />
                    <h3 className="text-xs font-bold text-gray-800">
                      Hóa đơn & Công nợ ({invoicesList.length})
                    </h3>
                  </div>
                  {detailData?.totalPatientDebt !== undefined && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Đã thanh toán: <strong className="text-emerald-600">{formatCurrency(detailData.totalPatientPaid)}</strong>
                      </span>
                      <span className="text-gray-500">
                        Tổng nợ: <strong className="text-rose-600">{formatCurrency(detailData.totalPatientDebt)}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Table: Hóa đơn & công nợ */}
                <div className="border border-gray-200 rounded-lg overflow-y-auto overflow-x-auto max-h-[220px] relative shadow-2xs custom-scrollbar">
                  <table className="w-full min-w-[760px] text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-28 whitespace-nowrap border-b border-slate-200">Mã hóa đơn</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-36 whitespace-nowrap border-b border-slate-200">Ngày lập</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-right w-28 whitespace-nowrap border-b border-slate-200">Tổng tiền</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-right w-28 whitespace-nowrap border-b border-slate-200">Đã trả</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-right w-28 whitespace-nowrap border-b border-slate-200">Còn nợ</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 text-center w-36 whitespace-nowrap border-b border-slate-200">Trạng thái HĐ</th>
                        <th className="sticky top-0 bg-slate-100 z-20 py-2.5 px-3 font-bold text-slate-700 w-36 whitespace-nowrap border-b border-slate-200">Thu ngân</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {currentInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-gray-400 italic border-b border-gray-100">
                            Bệnh nhân chưa có hóa đơn thanh toán nào
                          </td>
                        </tr>
                      ) : (
                        currentInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-700 whitespace-nowrap border-b border-gray-100">
                              {inv.invoiceCode || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {inv.timeFormatted || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800 whitespace-nowrap border-b border-gray-100">
                              {formatCurrency(inv.finalAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 whitespace-nowrap border-b border-gray-100">
                              {formatCurrency(inv.paidAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap border-b border-gray-100">
                              {Number(inv.remainingAmount || 0) > 0 ? (
                                <span className="font-bold text-rose-600">{formatCurrency(inv.remainingAmount)}</span>
                              ) : (
                                <span className="font-medium text-emerald-600">0 đ</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap border-b border-gray-100">
                              {inv.paymentStatus === 'PAID' ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  Đã thanh toán
                                </span>
                              ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  Thanh toán 1 phần
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                                  Chưa thanh toán
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {inv.employeeName || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination: Hóa đơn */}
                {invoicesList.length > INVOICE_PAGE_SIZE && (
                  <div className="flex items-center justify-end gap-2 text-xs text-gray-500 pt-1">
                    <span>
                      {`${invoiceStartIndex + 1}-${Math.min(invoiceEndIndex, invoicesList.length)} trên ${invoicesList.length} hóa đơn`}
                    </span>
                    <button
                      type="button"
                      disabled={invoicePage <= 1}
                      onClick={() => setInvoicePage((p) => p - 1)}
                      className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="w-6 h-6 rounded-md bg-[#7c3aed] text-white flex items-center justify-center text-xs font-semibold">
                      {invoicePage}
                    </span>
                    <button
                      type="button"
                      disabled={invoicePage >= totalInvoicePages}
                      onClick={() => setInvoicePage((p) => p + 1)}
                      className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===================== SUB-MODAL: THÊM CHĂM SÓC ===================== */}
      {showAddCareModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 border border-gray-200 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-800 uppercase">Thêm chăm sóc mới</h4>
              <button
                type="button"
                onClick={() => setShowAddCareModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitCare} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Loại chăm sóc</label>
                <select
                  value={addCareForm.careType}
                  onChange={(e) => setAddCareForm({ ...addCareForm, careType: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                >
                  <option value="APPOINTMENT_REMINDER">Nhắc lịch hẹn</option>
                  <option value="PAYMENT">Thanh toán / Công nợ</option>
                  <option value="BIRTHDAY">Ngày sinh nhật</option>
                  <option value="GENERAL_CARE">Chăm sóc tổng hợp</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Kênh chăm sóc</label>
                <select
                  value={addCareForm.channel}
                  onChange={(e) => setAddCareForm({ ...addCareForm, channel: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                >
                  <option value="PHONE">Gọi điện</option>
                  <option value="GMAIL">Gmail</option>
                  <option value="SMS">Tin nhắn SMS</option>
                  <option value="DIRECT">Trực tiếp</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Trạng thái chăm sóc</label>
                <select
                  value={addCareForm.status}
                  onChange={(e) => setAddCareForm({ ...addCareForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                >
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="RECARE">Cần chăm sóc lại</option>
                  <option value="NO_ANSWER">Không nghe máy</option>
                  <option value="FAILED">Gửi thất bại</option>
                  <option value="PENDING">Chưa chăm sóc</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Thời gian thực hiện</label>
                <input
                  type="datetime-local"
                  value={addCareForm.careTime}
                  onChange={(e) => setAddCareForm({ ...addCareForm, careTime: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Nội dung chăm sóc *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: khách đồng ý thời gian đó đến được..."
                  value={addCareForm.notes}
                  onChange={(e) => setAddCareForm({ ...addCareForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddCareModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCare}
                  className="px-4 py-1.5 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  {submittingCare ? 'Đang lưu...' : 'Lưu chăm sóc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== SUB-MODAL: THÊM / SỬA LỊCH HẸN ===================== */}
      {showAddAptModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 border border-gray-200 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-800 uppercase">
                {editingAptId ? 'Chỉnh sửa lịch hẹn' : 'Thêm lịch hẹn mới'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddAptModal(false);
                  setEditingAptId(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitApt} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Thời gian hẹn *</label>
                <input
                  type="datetime-local"
                  required
                  value={aptForm.appointmentTime}
                  onChange={(e) => setAptForm({ ...aptForm, appointmentTime: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Loại lịch hẹn</label>
                  <select
                    value={aptForm.appointmentType}
                    onChange={(e) => setAptForm({ ...aptForm, appointmentType: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                  >
                    <option value="Đặt trước">Đặt trước</option>
                    <option value="Dự kiến">Dự kiến</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Trạng thái</label>
                  <select
                    value={aptForm.status}
                    onChange={(e) => setAptForm({ ...aptForm, status: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                  >
                    <option value="Chưa đến">Chưa đến</option>
                    <option value="Đang điều trị">Đang điều trị</option>
                    <option value="Đã hẹn lại">Đã hẹn lại</option>
                    <option value="Đã xong">Đã xong</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Bác sĩ phụ trách</label>
                <select
                  value={aptForm.dentistId}
                  onChange={(e) => setAptForm({ ...aptForm, dentistId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {dentistOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Nội dung khám / Dịch vụ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều trị tủy, Bọc răng, Cấy ghép Implant..."
                  value={aptForm.content}
                  onChange={(e) => setAptForm({ ...aptForm, content: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm..."
                  value={aptForm.notes}
                  onChange={(e) => setAptForm({ ...aptForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAptModal(false);
                    setEditingAptId(null);
                  }}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingApt}
                  className="px-4 py-1.5 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  {submittingApt ? 'Đang lưu...' : editingAptId ? 'Lưu thay đổi' : 'Tạo lịch hẹn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
