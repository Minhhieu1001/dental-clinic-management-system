import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Phone,
  CreditCard,
  User,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  Search,
  MoreVertical,
  Plus,
  ChevronRight,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import InvoiceDetailModal from './action/InvoiceDetailModal';
import PaymentModal from './action/PaymentModal';
import PrintInvoiceModal from './action/PrintInvoiceModal';
import SelectPatientModal from './action/SelectPatientModal';
import CreateInvoiceModal from './action/CreateInvoiceModal';
import { getPatients, searchPatient, getPatientById, getPatientsByPhone } from '../../../services/patient.service';
import { getInvoicesByPatientId } from '../../../services/invoice.service';
import { mapBackendInvoiceToUi } from '../../../utils/invoiceMapper';
import Loading from '../../../components/ui/Loading';
import MonthYearPicker from '../../../components/common/MonthYearPicker';

export default function InvoiceLookup() {
  const [invoices, setInvoices] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multiple matched patients modal state (trường hợp 1 SĐT có nhiều hồ sơ)
  const [matchedPatients, setMatchedPatients] = useState([]);
  const [showSelectPatientModal, setShowSelectPatientModal] = useState(false);

  // Search & Filter State
  const [phoneSearch, setPhoneSearch] = useState('');
  const [cccdSearch, setCccdSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Invoice Filters State
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action menu state (3 dots menu)
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  const formatDob = (dobStr) => {
    if (!dobStr) return 'Chưa cập nhật';
    const d = new Date(dobStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return dobStr;
  };

  // 1. Fetch patient list on mount for dropdown only
  const fetchPatientList = async () => {
    try {
      const data = await getPatients();
      setPatientList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Lỗi lấy danh sách bệnh nhân:', err);
    }
  };

  // 2. Fetch patient info first, then fetch their invoices using patient ID
  const fetchPatientAndInvoices = useCallback(async (patientObjOrId) => {
    if (!patientObjOrId) {
      setActiveCustomer(null);
      setInvoices([]);
      return;
    }
    setLoading(true);
    try {
      let patient = null;
      if (typeof patientObjOrId === 'object' && patientObjOrId !== null) {
        patient = patientObjOrId;
      } else if (patientObjOrId) {
        patient = patientList.find((p) => p.id === patientObjOrId);
        if (!patient) {
          patient = await getPatientById(patientObjOrId);
        }
      }

      if (patient) {
        setActiveCustomer(patient);
        setSelectedPatientId(patient.id);
        const patientInvoices = await getInvoicesByPatientId(patient.id);
        const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
        setInvoices(mapped);
        if (mapped.length === 0) {
          toast(`Bệnh nhân "${patient.fullName || patient.name}" chưa có hóa đơn nào.`, { icon: 'ℹ️' });
        }
      } else {
        setActiveCustomer(null);
        setInvoices([]);
      }
    } catch (err) {
      console.warn('Lỗi lấy thông tin & hóa đơn bệnh nhân:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [patientList]);

  // Xử lý Tìm kiếm (Hỗ trợ nhập 1 tiêu chí SĐT / CCCD hoặc kết hợp CẢ 2 TIÊU CHÍ)
  const handleSearch = async () => {
    const phone = phoneSearch.trim();
    const cccd = cccdSearch.trim();

    if (!phone && !cccd) {
      toast.error('Vui lòng nhập SĐT hoặc số CCCD để tìm kiếm!');
      return;
    }

    setLoading(true);
    try {
      // Trường hợp 1: Nhập CẢ SĐT và CCCD (Tìm kiếm theo đa tiêu chí)
      if (phone && cccd) {
        let list = await getPatientsByPhone(phone);
        if (!Array.isArray(list) || list.length === 0) {
          const single = await searchPatient(phone);
          list = single ? [single] : [];
        }

        // Lọc bệnh nhân trùng khớp cả số CCCD
        const filteredBoth = list.filter((p) => {
          const pCccd = (p.cccd || p.identityCard || '').trim();
          return pCccd.includes(cccd);
        });

        if (filteredBoth.length === 1) {
          const p = filteredBoth[0];
          setSelectedPatientId(p.id);
          setActiveCustomer(p);
          toast.success(`Đã tìm thấy bệnh nhân khớp SĐT & CCCD: ${p.fullName || p.name}`);
          const patientInvoices = await getInvoicesByPatientId(p.id);
          const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
          setInvoices(mapped);
          if (mapped.length === 0) {
            toast(`Bệnh nhân "${p.fullName || p.name}" chưa có hóa đơn nào.`, { icon: 'ℹ️' });
          }
        } else if (filteredBoth.length > 1) {
          setMatchedPatients(filteredBoth);
          setShowSelectPatientModal(true);
          toast(`Phát hiện ${filteredBoth.length} hồ sơ khớp cả SĐT và CCCD!`, { icon: 'ℹ️' });
        } else {
          // Thử tra cứu theo CCCD trực tiếp nếu lọc danh sách SĐT không ra
          const pByCccd = await searchPatient(cccd);
          if (pByCccd && (pByCccd.phone || pByCccd.phoneNumber || '').includes(phone)) {
            setSelectedPatientId(pByCccd.id);
            setActiveCustomer(pByCccd);
            toast.success(`Đã tìm thấy bệnh nhân: ${pByCccd.fullName || pByCccd.name}`);
            const patientInvoices = await getInvoicesByPatientId(pByCccd.id);
            const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
            setInvoices(mapped);
          } else {
            setActiveCustomer(null);
            setInvoices([]);
            toast.error('Không tìm thấy bệnh nhân nào khớp cả SĐT và số CCCD đã nhập!');
          }
        }
      }
      // Trường hợp 2: Chỉ nhập SĐT
      else if (phone) {
        let list = await getPatientsByPhone(phone);
        if (!Array.isArray(list) || list.length === 0) {
          const single = await searchPatient(phone);
          list = single ? [single] : [];
        }

        if (list.length === 1) {
          const p = list[0];
          setSelectedPatientId(p.id);
          setActiveCustomer(p);
          toast.success(`Đã tìm thấy bệnh nhân: ${p.fullName || p.name}`);
          const patientInvoices = await getInvoicesByPatientId(p.id);
          const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
          setInvoices(mapped);
          if (mapped.length === 0) {
            toast(`Bệnh nhân "${p.fullName || p.name}" chưa có hóa đơn nào.`, { icon: 'ℹ️' });
          }
        } else if (list.length > 1) {
          setMatchedPatients(list);
          setShowSelectPatientModal(true);
          toast(`Phát hiện ${list.length} hồ sơ trùng SĐT. Vui lòng chọn hồ sơ!`, { icon: 'ℹ️' });
        } else {
          setActiveCustomer(null);
          setInvoices([]);
          toast.error('Không tìm thấy hồ sơ bệnh nhân nào với SĐT này!');
        }
      }
      // Trường hợp 3: Chỉ nhập CCCD
      else if (cccd) {
        const patient = await searchPatient(cccd);
        if (patient) {
          setSelectedPatientId(patient.id);
          setActiveCustomer(patient);
          toast.success(`Đã tìm thấy bệnh nhân: ${patient.fullName || patient.name}`);
          const patientInvoices = await getInvoicesByPatientId(patient.id);
          const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
          setInvoices(mapped);
          if (mapped.length === 0) {
            toast(`Bệnh nhân "${patient.fullName || patient.name}" chưa có hóa đơn nào.`, { icon: 'ℹ️' });
          }
        } else {
          setActiveCustomer(null);
          setInvoices([]);
          toast.error('Không tìm thấy hồ sơ bệnh nhân nào với số CCCD này!');
        }
      }
    } catch (err) {
      console.warn('Lỗi tìm kiếm bệnh nhân:', err);
      toast.error('Có lỗi xảy ra trong quá trình tìm kiếm!');
      setActiveCustomer(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Người dùng chọn 1 hồ sơ từ SelectPatientModal
  const handleChoosePatientFromList = async (patient) => {
    setShowSelectPatientModal(false);
    setMatchedPatients([]);
    if (patient && patient.id) {
      setSelectedPatientId(patient.id);
      setActiveCustomer(patient);
      toast.success(`Đã chọn bệnh nhân: ${patient.fullName || patient.name}`);
      setLoading(true);
      try {
        const patientInvoices = await getInvoicesByPatientId(patient.id);
        const mapped = (patientInvoices || []).map((inv) => mapBackendInvoiceToUi(inv));
        setInvoices(mapped);
        if (mapped.length === 0) {
          toast(`Bệnh nhân "${patient.fullName || patient.name}" chưa có hóa đơn nào.`, { icon: 'ℹ️' });
        }
      } catch (err) {
        console.warn('Lỗi lấy danh sách hóa đơn của bệnh nhân:', err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
  };

  // On mount, fetch patient list for dropdown
  useEffect(() => {
    fetchPatientList();
  }, []);

  const handleSelectPatient = async (id) => {
    setSelectedPatientId(id);
    setPhoneSearch('');
    setCccdSearch('');
    setPage(0);

    if (!id) {
      setActiveCustomer(null);
      setInvoices([]);
    } else {
      const patient = patientList.find((p) => p.id === id);
      if (patient) {
        toast.success(`Đã chọn bệnh nhân: ${patient.fullName || patient.name}`);
      }
      await fetchPatientAndInvoices(id);
    }
  };

  const handleResetFilters = () => {
    setPhoneSearch('');
    setCccdSearch('');
    setSelectedPatientId('');
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setActiveCustomer(null);
    setInvoices([]);
    setPage(0);
    toast.success('Đã đặt lại bộ lọc');
  };

  // Action Menu Handlers (3 dots menu)
  const handleOpenMenu = (e, inv) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuInvoice(inv);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  // Client-side filter on current invoice list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Date Filter (Year & Month)
      if (inv.date && inv.date !== 'Chưa lập hóa đơn') {
        const parts = inv.date.split('/');
        if (parts.length === 3) {
          const invMonth = parts[1];
          const invYear = parts[2];

          if (selectedYear !== 'ALL' && invYear !== selectedYear) {
            return false;
          }

          if (selectedMonth !== 'ALL') {
            const formattedMonth = selectedMonth.padStart(2, '0');
            if (invMonth !== formattedMonth) return false;
          }
        }
      }

      // 2. Status filter
      if (statusFilter === 'PAID' && inv.status !== 'Đã thanh toán') return false;
      if (statusFilter === 'PARTIAL' && inv.status !== 'Thanh toán một phần') return false;
      if (statusFilter === 'UNPAID' && inv.status !== 'Chưa thanh toán') return false;

      // 3. Search Query filter (Mã HĐ hoặc Tên bệnh nhân)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (inv.id || '').toLowerCase().includes(q);
        const matchesName = (inv.patientName || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  }, [invoices, selectedYear, selectedMonth, statusFilter, searchQuery]);

  const handlePaymentSuccess = (updatedInvoice) => {
    if (!updatedInvoice) return;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === updatedInvoice.id || (inv.rawId && inv.rawId === updatedInvoice.rawId)
          ? { ...inv, ...updatedInvoice }
          : inv
      )
    );
    setSelectedInvoice((prev) => (prev ? { ...prev, ...updatedInvoice } : prev));
  };

  // 5. CHUYỂN BẢN NHÁP TỪ MODAL TẠO SANG GIAO DIỆN XEM TRƯỚC VÀ XÁC NHẬN LƯU HÓA ĐƠN
  const handleCreateInvoiceDraft = (draftInvoice) => {
    setShowCreateModal(false);
    setSelectedInvoice(draftInvoice);
    setShowDetailModal(true);
    toast.success('Đã tạo bản xem trước hóa đơn! Kiểm tra và nhấn "Lưu hóa đơn" để lưu vào hệ thống.');
  };

  // 6. XÁC NHẬN LƯU HÓA ĐƠN VÀO HỆ THỐNG / DB
  const handleSaveDraftInvoice = async (officialInvoice) => {
    if (officialInvoice) {
      setSelectedInvoice(officialInvoice);
    }
    const targetPatientId = officialInvoice?.patientId || activeCustomer?.id || selectedPatientId;
    if (targetPatientId) {
      await fetchPatientAndInvoices(targetPatientId);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchPatientList();
      const targetId = activeCustomer?.id || selectedPatientId;
      if (targetId) {
        await fetchPatientAndInvoices(targetId);
        toast.success('Đã làm mới dữ liệu bệnh nhân và hóa đơn!');
      } else {
        toast.success('Đã làm mới danh sách!');
      }
    } catch (err) {
      console.warn('Lỗi làm mới dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-1 w-full">
      {/* Top Header Row (Breadcrumb: Thanh toán >> Tra cứu hóa đơn & Nút Làm mới) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 font-bold text-base sm:text-lg">
              <CreditCard size={18} className="text-slate-400" />
              Thanh toán
            </span>
            <ChevronRight size={16} className="text-slate-400" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Search size={22} className="text-teal-700" />
              <span>Tra cứu hóa đơn</span>
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Tìm kiếm theo SĐT hoặc CCCD để xem toàn bộ lịch sử hóa đơn và trạng thái thanh toán của bệnh nhân
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Làm mới dữ liệu tra cứu"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-teal-700' : ''} />
          </button>
        </div>
      </div>

      {/* PANEL 1: TRA CỨU THÔNG TIN BỆNH NHÂN */}
      <div className="bg-white p-3 sm:p-4 rounded border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter size={15} className="text-teal-700" />
            Bộ lọc & Tra cứu bệnh nhân
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

        {/* 2 Column Layout: Left side for Patient info, Right side for Search Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* BÊN TRÁI: THÔNG TIN BỆNH NHÂN */}
          <div className="lg:col-span-6 flex flex-col">
            {activeCustomer ? (
              <div className="bg-teal-50/70 border border-teal-200 p-3 rounded h-full flex flex-col justify-between space-y-2">
                {/* Header patient: Avatar + Name + Patient Code */}
                <div className="flex items-center gap-2.5 border-b border-teal-200/80 pb-2">
                  <div className="w-9 h-9 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {(activeCustomer.fullName || activeCustomer.name || 'K').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center justify-between w-full min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">
                      {activeCustomer.fullName || activeCustomer.name}
                    </h3>
                    <span className="bg-white text-teal-800 text-xs font-semibold px-2 py-0.5 rounded border border-teal-300 shrink-0">
                      Mã: {activeCustomer.patientCode || activeCustomer.id}
                    </span>
                  </div>
                </div>

                {/* Details list vertical & 2-col compact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded bg-teal-100/90 flex items-center justify-center text-teal-800 shrink-0">
                      <Phone size={13} />
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">SĐT:</span>
                    <strong className="text-teal-800 font-semibold truncate">
                      {activeCustomer.phone || activeCustomer.phoneNumber || 'Chưa có'}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded bg-teal-100/90 flex items-center justify-center text-teal-800 shrink-0">
                      <Calendar size={13} />
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">Ngày sinh:</span>
                    <strong className="text-slate-800 font-semibold truncate">
                      {formatDob(activeCustomer.dateOfBirth || activeCustomer.dob)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded bg-teal-100/90 flex items-center justify-center text-teal-800 shrink-0">
                      <ShieldCheck size={13} />
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">CCCD:</span>
                    <strong className="text-slate-800 font-semibold truncate">
                      {activeCustomer.cccd || activeCustomer.identityCard || 'Chưa cập nhật'}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded bg-teal-100/90 flex items-center justify-center text-teal-800 shrink-0">
                      <MapPin size={13} />
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">Địa chỉ:</span>
                    <span className="text-slate-800 font-medium truncate" title={activeCustomer.address}>
                      {activeCustomer.address || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 p-3 rounded h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-1">
                <User size={24} className="text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Chưa chọn thông tin bệnh nhân</p>
                <p className="text-[11px] text-slate-400">Vui lòng nhập SĐT, CCCD hoặc chọn ở thanh tìm kiếm</p>
              </div>
            )}
          </div>

          {/* BÊN PHẢI: THANH TÌM KIẾM SĐT, CCCD, CHỌN KHÁCH HÀNG */}
          <div className="lg:col-span-6 space-y-2.5 bg-slate-50/60 p-2.5 border border-slate-200 rounded flex flex-col justify-between">
            <div className="space-y-2.5">
              {/* HÀNG CÙNG NHAU: SĐT + CCCD + NÚT TÌM KIẾM */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                {/* 1. Tìm theo SĐT */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                    Tìm theo SĐT
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Nhập SĐT..."
                      value={phoneSearch}
                      onChange={(e) => {
                        setPhoneSearch(e.target.value);
                        setSelectedPatientId('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                      }}
                      className="w-full bg-white border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 rounded focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Tìm theo CCCD */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                    Tìm theo CCCD/CMND
                  </label>
                  <div className="relative">
                    <ShieldCheck size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Nhập số CCCD..."
                      value={cccdSearch}
                      onChange={(e) => {
                        setCccdSearch(e.target.value);
                        setSelectedPatientId('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                      }}
                      className="w-full bg-white border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 rounded focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Nút Tìm kiếm cùng 1 hàng */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full px-2 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs h-[31px]"
                  >
                    <Search size={14} />
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>

              {/* 3. Chọn danh sách khách hàng */}
              <div className="pt-1.5 border-t border-slate-200/80">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Hoặc chọn nhanh từ danh sách khách hàng
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    className="w-full bg-white border border-slate-300 pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 rounded focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">Chọn khách hàng</option>
                    {patientList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || p.name} ({p.phone || p.phoneNumber || 'Không SĐT'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 2: BỘ LỌC DANH SÁCH HÓA ĐƠN */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
        {/* Compact Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bộ lọc Tháng & Năm (Hỗ trợ vô hạn năm) */}
            <MonthYearPicker
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={(y) => {
                setSelectedYear(y);
                setPage(0);
              }}
              onMonthChange={(m) => {
                setSelectedMonth(m);
                setPage(0);
              }}
            />

            <div className="w-full sm:w-52">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-900 rounded focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán đủ</option>
                <option value="PARTIAL">Thanh toán một phần</option>
                <option value="UNPAID">Chưa thanh toán</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded shadow-2xs transition-colors cursor-pointer border border-teal-800 shrink-0 h-[31px]"
          >
            <Plus size={15} />
            <span>Tạo hóa đơn</span>
          </button>
        </div>
      </div>

      {/* Results Table Section */}
      <Paper elevation={0} className="relative rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs min-h-[260px]">
        {loading && (
          <Loading
            overlay={true}
            title="Đang tải dữ liệu hóa đơn..."
            subtitle="Hệ thống đang truy xuất thông tin và đối soát hóa đơn"
            size="md"
          />
        )}
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead className="bg-slate-100/80">
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Ngày lập</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Mã hóa đơn</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Tên khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Số điện thoại</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Tổng tiền</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Đã thanh toán</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Còn nợ</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Người tạo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Trạng thái</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={26} className="text-amber-500" />
                      <p className="font-semibold text-xs">
                        {activeCustomer
                          ? `Bệnh nhân "${activeCustomer.fullName || activeCustomer.name}" chưa có hóa đơn nào.`
                          : 'Vui lòng nhập SĐT, CCCD hoặc chọn bệnh nhân ở thanh tìm kiếm để tra cứu hóa đơn.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => (
                    <TableRow
                      key={inv.id}
                      hover
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowDetailModal(true);
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f8fafc' } }}
                    >
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>
                        {inv.date}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        {inv.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f766e' }}>
                        {inv.patientName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#475569' }}>
                        {inv.patientPhone}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        {formatVND(inv.totalAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#047857' }}>
                        {formatVND(inv.paidAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: inv.debtAmount > 0 ? '#e11d48' : '#64748b' }}>
                        {formatVND(inv.debtAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f766e' }}>
                        {inv.employeeName}
                      </TableCell>
                      <TableCell align="center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${inv.status === 'Đã thanh toán'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'Thanh toán một phần'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={(e) => handleOpenMenu(e, inv)}>
                          <MoreVertical size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Bar */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Hóa đơn mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `Tổng ${count} hóa đơn (${from}-${to})`}
        />
      </Paper>

      {/* Action Menu (3 dots) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ style: { borderRadius: '6px', minWidth: '150px' } }}
      >
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowDetailModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-medium text-slate-700 gap-2"
        >
          <Eye size={15} className="text-slate-500" /> Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowPaymentModal(true);
            handleCloseMenu();
          }}
          disabled={!menuInvoice || menuInvoice.debtAmount <= 0}
          className="text-xs font-medium text-teal-700 gap-2"
        >
          <CreditCard size={15} className="text-teal-700" /> Thanh toán
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowPrintModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-medium text-slate-700 gap-2"
        >
          <Printer size={15} className="text-slate-500" /> In hóa đơn
        </MenuItem>
      </Menu>

      {/* Modal Chọn Bệnh nhân khi có nhiều hồ sơ trùng SĐT */}
      <SelectPatientModal
        open={showSelectPatientModal}
        onClose={() => setShowSelectPatientModal(false)}
        patients={matchedPatients}
        phoneKeyword={phoneSearch}
        onSelectPatient={handleChoosePatientFromList}
      />

      {/* Modals */}
      <InvoiceDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
        onSaveInvoice={handleSaveDraftInvoice}
      />

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PrintInvoiceModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        invoice={selectedInvoice}
      />

      <CreateInvoiceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateInvoice={handleCreateInvoiceDraft}
      />
    </div>
  );
}
