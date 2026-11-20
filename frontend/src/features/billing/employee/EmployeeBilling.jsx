import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
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
  Pill,
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
  LinearProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
import { getAllInvoiceDateDesc } from '../../../services/invoice.service';
import { getBranches } from '../../../services/clinic.service';
import InvoiceDetailModal from './action/InvoiceDetailModal';
import PaymentModal from './action/PaymentModal';
import PrintInvoiceModal from './action/PrintInvoiceModal';
import CreateInvoiceModal from './action/CreateInvoiceModal';
import MonthYearPicker from '../../../components/common/MonthYearPicker';
import { mapBackendInvoiceToUi } from '../../../utils/invoiceMapper';


const CURRENT_YEAR = String(new Date().getFullYear());


export default function EmployeeBilling() {

  // Danh sách hiển thị trên bảng (lọc theo năm, tháng, trạng thái, tìm kiếm)
  const [invoices, setInvoices] = useState([]);
  // Thống kê theo năm + tháng (backend tính)
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state (năm mặc định là năm hiện tại, tháng có thể không chọn)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState('ALL'); // 'ALL' or '01'..'12'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('ALL');

  useEffect(() => {
    getBranches()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setBranches(list);
      })
      .catch((err) => console.warn('Lỗi lấy danh sách chi nhánh:', err));
  }, []);

  // Search input state with DEBOUNCE setTimeout
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Action Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  // 1. DEBOUNCE SEARCH INPUT WITH setTimeout (Prevent API flooding)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 1000); // 450ms debounce delay

    return () => clearTimeout(handler);
  }, [searchInput]);

  // 2. GỌI API GET /invoices THEO BỘ LỌC
  //    - invoices: lọc theo năm / tháng / trạng thái / tìm kiếm (backend đã sắp xếp mới nhất)
  //    - summary : backend tính theo năm + tháng
  // ID của request mới nhất -> bỏ qua response cũ khi người dùng đổi bộ lọc nhanh
  const requestIdRef = useRef(0);

  const fetchInvoicesData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const { invoices: list, summary: sum } = await getAllInvoiceDateDesc({
        year: selectedYear,
        month: selectedMonth,
        status: statusFilter,
        search: debouncedSearch,
        branchId: branchFilter,
      });
      if (requestId !== requestIdRef.current) return;
      setInvoices(list.map(mapBackendInvoiceToUi));
      setSummary(sum);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Lỗi lấy danh sách hóa đơn từ API:', err);
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

  // Thống kê theo năm + tháng (do backend trả về)
  const computedStats = {
    totalRevenue: Number(summary?.totalRevenue || 0),
    totalPaid: Number(summary?.totalPaid || 0),
    totalMedicine: Number(summary?.totalMedicine || 0),
    totalTransaction: Number(summary?.totalTransaction || (Number(summary?.totalPaid || 0) + Number(summary?.totalMedicine || 0))),
    totalDebt: Number(summary?.totalDebt || 0),
    totalCount: Number(summary?.totalCount || 0),
  };

  const handleOpenMenu = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  const handleResetFilters = () => {
    setSelectedYear(CURRENT_YEAR);
    setSelectedMonth('ALL');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(0);
  };

  // 4. THANH TOÁN THÀNH CÔNG (API đã được gọi trong PaymentConfirmModal)
  //    -> cập nhật hóa đơn đang chọn và fetch lại danh sách từ backend
  const handlePaymentSuccess = async (updatedInvoice) => {
    if (updatedInvoice) setSelectedInvoice(updatedInvoice);
    await fetchInvoicesData();
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
    // Tải lại danh sách hóa đơn từ Backend
    await fetchInvoicesData();
  };

  return (
    <div className="space-y-3 p-1 sm:p-2 w-full">
      {/* Top Header Row (Title & Refresh / Create Action Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 font-bold text-base sm:text-lg">
              <CreditCard size={18} className="text-slate-400" />
              Thanh toán
            </span>
            <ChevronRight size={16} className="text-slate-400" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Receipt size={22} className="text-teal-700" />
              <span>Hóa đơn</span>
            </h1>

          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Quản lý danh sách hóa đơn, theo dõi dư nợ và thu chi phòng khám
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchInvoicesData()}
            disabled={loading}
            title="Làm mới danh sách hóa đơn"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-teal-700' : ''} />
          </button>

          {/* Create Payment Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer border border-teal-800 shrink-0"
          >
            <Plus size={16} />
            <span>Tạo thanh toán mới</span>
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS (DỮ LIỆU ĐƯỢC CẬP NHẬT ĐỘNG THEO BỘ LỌC BÊN DƯỚI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Tổng doanh thu */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Tổng thu HĐ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatVND(computedStats.totalRevenue)}
          </div>
        </div>

        {/* Card 2: Đã thanh toán dịch vụ */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Thực thu HĐ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight">
            {formatVND(computedStats.totalPaid)}
          </div>
        </div>

        {/* Card 3: Tiền thuốc đã thu (MỚI) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Thu từ thuốc</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Pill size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 tracking-tight">
            {formatVND(computedStats.totalMedicine)}
          </div>
        </div>

        {/* Card 4: Còn nợ */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Công nợ</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 tracking-tight">
            {formatVND(computedStats.totalDebt)}
          </div>
        </div>

        {/* Card 5: Hóa đơn */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Tổng số hóa đơn</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {computedStats.totalCount} <span className="text-xs font-bold text-slate-400">hóa đơn</span>
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
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="PARTIALLY_PAID">Thanh toán một phần</option>
                <option value="UNPAID">Chưa thanh toán</option>
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

      {/* Main Table Section */}
      <Paper elevation={0} className="relative rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs">
        {/* Thanh tiến trình mảnh nằm đè trên bảng -> không làm thay đổi chiều cao */}
        {loading && (
          <LinearProgress
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 2, backgroundColor: '#ccfbf1', '& .MuiLinearProgress-bar': { backgroundColor: '#0f766e' } }}
          />
        )}
        <TableContainer sx={{ opacity: loading && invoices.length > 0 ? 0.55 : 1, transition: 'opacity 150ms ease' }}>
          <Table sx={{ minWidth: 1000, tableLayout: 'fixed' }} aria-label="billing table">
            <TableHead className="bg-slate-100/80">
              <TableRow>
                <TableCell sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                  Ngày tạo
                </TableCell>
                <TableCell sx={{ width: 180, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Mã hóa đơn</TableCell>
                <TableCell sx={{ width: 160, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Khách hàng</TableCell>
                <TableCell align="right" sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Tổng tiền</TableCell>
                <TableCell align="right" sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Đã thanh toán</TableCell>
                <TableCell align="right" sx={{ width: 100, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Còn nợ</TableCell>
                <TableCell sx={{ width: 180, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Người tạo</TableCell>
                <TableCell align="center" sx={{ width: 120, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
                <TableCell align="center" sx={{ width: 80, fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#0f766e' }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-teal-700" />
                      <p className="font-bold text-xs text-slate-600">Đang tải danh sách hóa đơn theo bộ lọc...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={26} className="text-amber-500" />
                      <p className="font-bold text-xs">Không tìm thấy hóa đơn nào phù hợp với bộ lọc.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => (
                    <TableRow
                      key={inv.id}
                      hover
                      onDoubleClick={() => {
                        setSelectedInvoice(inv);
                        setShowDetailModal(true);
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f8fafc' } }}
                    >
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.date}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.id}>
                        {inv.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f766e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.patientName}>
                        {inv.patientName}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.finalAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#047857', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.paidAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: inv.debtAmount > 0 ? '#e11d48' : '#64748b', whiteSpace: 'nowrap' }}>
                        {formatVND(inv.debtAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f766e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.employeeName}>
                        {inv.employeeName}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${inv.status === 'Đã thanh toán'
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
                        <div className="flex items-center justify-center gap-1">
                          <IconButton size="small" onClick={(e) => handleOpenMenu(e, inv)}>
                            <MoreVertical size={16} />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination Bar */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={invoices.length}
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

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu} PaperProps={{ style: { borderRadius: '8px' } }}>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowDetailModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-slate-700 gap-2"
        >
          <Eye size={15} /> Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowDetailModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-teal-700 gap-2"
        >
          <CreditCard size={15} /> Thanh toán
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedInvoice(menuInvoice);
            setShowPrintModal(true);
            handleCloseMenu();
          }}
          className="text-xs font-bold text-slate-700 gap-2"
        >
          <Printer size={15} /> In hóa đơn
        </MenuItem>
      </Menu>

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
