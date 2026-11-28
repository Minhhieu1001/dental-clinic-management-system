import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Calendar,
  Search,
  Eye,
  CreditCard,
  Printer,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Filter,
  MoreVertical,
  RotateCcw,
  RefreshCw,
  ArrowUpDown,
  Download,
  Percent,
  Layers,
  Clock,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import {
  Menu,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tooltip,
} from '@mui/material';
import toast from 'react-hot-toast';
import { getAllInvoiceDateDesc } from '../../../services/invoice.service';
import { getBranches } from '../../../services/clinic.service';
import InvoiceDetailModal from '../employee/action/InvoiceDetailModal';
import PaymentModal from '../employee/action/PaymentModal';
import PrintInvoiceModal from '../employee/action/PrintInvoiceModal';
import MonthYearPicker from '../../../components/common/MonthYearPicker';
import Loading from '../../../components/ui/Loading';
import { mapBackendInvoiceToUi } from '../../../utils/invoiceMapper';

const CURRENT_YEAR = String(new Date().getFullYear());

export default function AdminBilling() {
  // Danh sách hóa đơn và thống kê từ Backend
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'DEBT' | 'PAID'
  const [sortBy, setSortBy] = useState('DATE_DESC'); // 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'DEBT_DESC'

  useEffect(() => {
    getBranches()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setBranches(list);
      })
      .catch((err) => console.warn('Lỗi lấy danh sách chi nhánh Admin:', err));
  }, []);

  // Search input với debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Action Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  // Phân trang
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  // 1. Debounce Search Input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. Fetch danh sách hóa đơn từ backend
  const requestIdRef = useRef(0);

  const fetchInvoicesData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const { invoices: list, summary: sum } = await getAllInvoiceDateDesc({
        year: selectedYear,
        month: selectedMonth,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch,
        branchId: branchFilter,
      });
      if (requestId !== requestIdRef.current) return;
      setInvoices(list.map(mapBackendInvoiceToUi));
      setSummary(sum);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Lỗi lấy danh sách hóa đơn Admin:', err);
      toast.error('Không thể tải danh sách hóa đơn');
      setInvoices([]);
      setSummary(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [selectedYear, selectedMonth, statusFilter, debouncedSearch, branchFilter]);

  useEffect(() => {
    fetchInvoicesData();
  }, [fetchInvoicesData]);

  // 3. Tính toán KPI thống kê
  const computedStats = useMemo(() => {
    const totalRevenue = Number(summary?.totalRevenue || 0);
    const totalPaid = Number(summary?.totalPaid || 0);
    const totalMedicine = Number(summary?.totalMedicine || 0);
    const totalTransaction = Number(summary?.totalTransaction || (totalPaid + totalMedicine));
    const totalDebt = Number(summary?.totalDebt || 0);
    const totalCount = Number(summary?.totalCount || 0);
    const collectionRate = totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : '100';

    return {
      totalRevenue,
      totalPaid,
      totalMedicine,
      totalTransaction,
      totalDebt,
      totalCount,
      collectionRate,
    };
  }, [summary]);

  // 4. Lọc & Sắp xếp hóa đơn phía Client theo Tab và Tiêu chí Sort
  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    // Lọc theo Tab nhanh
    if (activeTab === 'DEBT') {
      result = result.filter((inv) => inv.status !== 'Đã hủy' && inv.debtAmount > 0);
    } else if (activeTab === 'PAID') {
      result = result.filter((inv) => inv.status === 'Đã thanh toán');
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortBy === 'AMOUNT_DESC') {
        return (b.finalAmount || 0) - (a.finalAmount || 0);
      }
      if (sortBy === 'DEBT_DESC') {
        return (b.debtAmount || 0) - (a.debtAmount || 0);
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.rawDate || 0) - new Date(b.rawDate || 0);
      }
      // Mặc định DATE_DESC
      return new Date(b.rawDate || 0) - new Date(a.rawDate || 0);
    });

    return result;
  }, [invoices, activeTab, sortBy]);

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedYear(CURRENT_YEAR);
    setSelectedMonth('ALL');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setActiveTab('ALL');
    setSortBy('DATE_DESC');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(0);
  };

  // Menu action
  const handleOpenMenu = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  // Thanh toán thành công
  const handlePaymentSuccess = async (updatedInvoice) => {
    if (updatedInvoice) setSelectedInvoice(updatedInvoice);
    await fetchInvoicesData();
  };

  const handleSaveDraftInvoice = async (officialInvoice) => {
    if (officialInvoice) {
      setSelectedInvoice(officialInvoice);
    }
    await fetchInvoicesData();
  };

  // 5. Xuất báo cáo danh sách hóa đơn ra Excel/CSV (UTF-8 BOM)
  const handleExportCSV = () => {
    if (filteredAndSortedInvoices.length === 0) {
      toast.error('Không có dữ liệu để xuất file');
      return;
    }

    const headers = [
      'Mã hóa đơn',
      'Ngày tạo',
      'Mã bệnh nhân',
      'Tên bệnh nhân',
      'Số điện thoại',
      'Tổng tiền (VNĐ)',
      'Giảm giá (VNĐ)',
      'Thành tiền (VNĐ)',
      'Đã thanh toán (VNĐ)',
      'Còn nợ (VNĐ)',
      'Trạng thái',
      'Người lập',
    ];

    const rows = filteredAndSortedInvoices.map((inv) => [
      `"${inv.id || ''}"`,
      `"${inv.date || ''}"`,
      `"${inv.patientCode || ''}"`,
      `"${inv.patientName || ''}"`,
      `"${inv.patientPhone || ''}"`,
      inv.totalAmount || 0,
      inv.discountAmount || 0,
      inv.finalAmount || 0,
      inv.paidAmount || 0,
      inv.debtAmount || 0,
      `"${inv.status || ''}"`,
      `"${inv.employeeName || 'Hệ thống'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Bao_cao_hoa_don_${selectedYear}_${selectedMonth === 'ALL' ? 'ca_nam' : 'T' + selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file báo cáo hóa đơn thành công!');
  };

  return (
    <div className="space-y-2 p-2 sm:p-4 w-full">
      {/* Top Header Row (Title, Export CSV, Refresh - Không có nút Tạo Hóa Đơn) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Quản lý Hóa đơn & Thu ngân
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Giám sát chứng từ, quản lý dòng tiền và theo dõi dư nợ toàn hệ thống phòng khám
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Xuất Excel/CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-300 shadow-xs transition-all cursor-pointer"
            title="Xuất dữ liệu hóa đơn hiện tại ra file CSV/Excel"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Xuất Excel / CSV</span>
          </button>

          {/* Làm mới dữ liệu */}
          <button
            onClick={() => fetchInvoicesData()}
            disabled={loading}
            title="Tải lại danh sách hóa đơn"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-teal-700' : ''} />
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS BAR (6 THẺ TRỰC QUAN TOÀN DIỆN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Tổng doanh thu phát sinh */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Tổng thu HĐ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 tracking-tight">
            {formatVND(computedStats.totalRevenue)}
          </div>
        </div>

        {/* Card 2: Thực thu dịch vụ */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Thực thu HĐ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-base font-black text-emerald-700 tracking-tight">
            {formatVND(computedStats.totalPaid)}
          </div>
        </div>

        {/* Card 3: Tiền thuốc đã thu (MỚI) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Thu từ thuốc</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Pill size={18} />
            </div>
          </div>
          <div className="text-base font-black text-purple-700 tracking-tight">
            {formatVND(computedStats.totalMedicine)}
          </div>
        </div>

        {/* Card 4: Còn nợ */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Công nợ</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-base font-black text-rose-600 tracking-tight">
            {formatVND(computedStats.totalDebt)}
          </div>
        </div>

        {/* Card 6: Tổng số hóa đơn */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Tổng hóa đơn</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 tracking-tight">
            {computedStats.totalCount} <span className="text-xs font-bold text-slate-400">HĐ</span>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          {/* BÊN TRÁI: CÁC BỘ LỌC THU GỌN VỪA VẶN (ĐÃ BỎ LABEL) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Lọc theo Năm & Tháng (Hỗ trợ vô hạn năm) */}
            <MonthYearPicker
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              allowAllYears={false}
              onYearChange={(y) => {
                setSelectedYear(y);
                setPage(0);
              }}
              onMonthChange={(m) => {
                setSelectedMonth(m);
                setPage(0);
              }}
            />

            {/* 2. Lọc theo Chi nhánh */}
            <div className="w-[190px]">
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.branchId || b.id} value={b.branchId || b.id}>
                    {b.branchName || b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lọc theo Trạng thái */}
            <div className="w-[155px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActiveTab('ALL');
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="PARTIALLY_PAID">Thanh toán một phần</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            {/* 4. Sắp xếp */}
            <div className="w-[150px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="DATE_DESC">Ngày tạo mới nhất</option>
                <option value="DATE_ASC">Ngày tạo cũ nhất</option>
                <option value="AMOUNT_DESC">Số tiền lớn nhất</option>
                <option value="DEBT_DESC">Còn nợ nhiều nhất</option>
              </select>
            </div>
          </div>

          {/* BÊN PHẢI: TÌM KIẾM VÀ ĐẶT LẠI BỘ LỌC */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Ô tìm kiếm */}
            <div className="w-full sm:w-[240px]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Mã HĐ, Tên BN, SĐT..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Nút Đặt lại bộ lọc bên phải */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 h-[31px] px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-800 text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="Đặt lại tất cả bộ lọc về mặc định"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>
      </div>

      {/* INVOICES TABLE SECTION */}
      <Paper elevation={0} className="relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs min-h-[300px]">
        {/* Loading Overlay khi đang refresh / tải dữ liệu */}
        {loading && (
          <Loading
            overlay={true}
            title="Đang đồng bộ dữ liệu hóa đơn..."
            subtitle="Hệ thống đang truy xuất hóa đơn và đối soát giao dịch"
            size="md"
          />
        )}

        <TableContainer sx={{ opacity: loading && invoices.length > 0 ? 0.35 : 1, transition: 'opacity 200ms ease' }}>
          <Table sx={{ minWidth: 1050, tableLayout: 'fixed' }} aria-label="admin billing table">
            <TableHead className="bg-slate-100/90">
              <TableRow>
                <TableCell sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Ngày lập
                </TableCell>
                <TableCell sx={{ width: 170, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Mã hóa đơn
                </TableCell>
                <TableCell sx={{ width: 180, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Bệnh nhân
                </TableCell>
                <TableCell align="right" sx={{ width: 110, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Tổng tiền
                </TableCell>
                <TableCell align="right" sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Giảm giá
                </TableCell>
                <TableCell align="right" sx={{ width: 110, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Đã thanh toán
                </TableCell>
                <TableCell align="right" sx={{ width: 110, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Còn nợ
                </TableCell>
                <TableCell sx={{ width: 150, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Người tạo
                </TableCell>
                <TableCell align="center" sx={{ width: 130, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Trạng thái
                </TableCell>
                <TableCell align="center" sx={{ width: 90, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filteredAndSortedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={28} className="text-amber-500" />
                      <p className="font-bold text-xs text-slate-600">Không tìm thấy hóa đơn nào phù hợp với bộ lọc hiện tại.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs font-bold text-teal-700 hover:underline mt-1 cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => (
                    <TableRow
                      key={inv.id || inv.rawId}
                      hover
                      onDoubleClick={() => {
                        setSelectedInvoice(inv);
                        setShowDetailModal(true);
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f8fafc' } }}
                    >
                      {/* 1. Ngày tạo */}
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>
                        {inv.date}
                      </TableCell>

                      {/* 2. Mã HĐ & Tag */}
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div className="flex flex-col">
                          <span className="font-bold text-teal-900" title={inv.id}>
                            {inv.id}
                          </span>
                          {inv.isSave ? (
                            <span className="text-[10px] text-emerald-700 font-bold">Chính thức</span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-bold">Bản nháp</span>
                          )}
                        </div>
                      </TableCell>

                      {/* 3. Bệnh nhân */}
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f766e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div className="flex flex-col" title={inv.patientName}>
                          <span className="font-bold text-slate-800 truncate">{inv.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{inv.patientPhone || inv.patientCode || 'Không có SĐT'}</span>
                        </div>
                      </TableCell>

                      {/* 4. Tổng tiền */}
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.totalAmount).replace(' đ', '')}
                      </TableCell>

                      {/* 5. Giảm giá */}
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: inv.discountAmount > 0 ? '#ea580c' : '#94a3b8', whiteSpace: 'nowrap' }}>
                        {inv.discountAmount > 0 ? `-${formatVND(inv.discountAmount).replace(' đ', '')}` : '0'}
                      </TableCell>

                      {/* 6. Đã thanh toán */}
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#047857', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.paidAmount).replace(' đ', '')}
                      </TableCell>

                      {/* 7. Còn nợ */}
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: inv.debtAmount > 0 ? '#e11d48' : '#64748b', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.debtAmount).replace(' đ', '')}
                      </TableCell>

                      {/* 8. Người tạo */}
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.employeeName}>
                        {inv.employeeName || 'Hệ thống'}
                      </TableCell>

                      {/* 9. Trạng thái */}
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${inv.status === 'Đã thanh toán'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'Thanh toán một phần'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : inv.status === 'Đã hủy'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {inv.status}
                        </span>
                      </TableCell>

                      {/* 10. Thao tác */}
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

        {/* Phân trang */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAndSortedInvoices.length}
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

      {/* Action Menu (3 chấm) */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu} PaperProps={{ style: { borderRadius: '10px' } }}>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowDetailModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-slate-700 gap-2"
        >
          <Eye size={15} /> Chi tiết
        </MenuItem>
        <MenuItem
          disabled={menuInvoice?.status === 'Đã hủy' || menuInvoice?.status === 'Đã thanh toán'}
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowPaymentModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-teal-700 gap-2"
        >
          <CreditCard size={15} />  Thanh toán
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowPrintModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-slate-700 gap-2"
        >
          <Printer size={15} /> In phiếu thu
        </MenuItem>
      </Menu>

      {/* Modals */}
      <InvoiceDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
        onCancelSuccess={handlePaymentSuccess}
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
    </div>
  );
}
