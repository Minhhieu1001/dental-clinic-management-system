import React, { useState, useMemo } from 'react';
import {
  Phone,
  CreditCard,
  User,
  FileSearch,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Search,
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
} from '@mui/material';
import { MOCK_INVOICES, MOCK_PATIENTS } from './mockBillingData';
import InvoiceDetailModal from './action/InvoiceDetailModal';
import PaymentModal from './action/PaymentModal';
import PrintInvoiceModal from './action/PrintInvoiceModal';

export default function InvoiceLookup() {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);

  // Search & Filter State
  const [phoneSearch, setPhoneSearch] = useState('');
  const [cccdSearch, setCccdSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('P001'); // Default demo P001

  // Invoice Filters State (matching mockup image)
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  // Active Customer computed
  const activeCustomer = useMemo(() => {
    if (selectedPatientId && selectedPatientId !== 'ALL') {
      return MOCK_PATIENTS.find((p) => p.id === selectedPatientId) || null;
    }
    if (phoneSearch.trim()) {
      return MOCK_PATIENTS.find((p) => p.phone.includes(phoneSearch.trim())) || null;
    }
    if (cccdSearch.trim()) {
      return MOCK_PATIENTS.find((p) => p.cccd.includes(cccdSearch.trim())) || null;
    }
    return null;
  }, [selectedPatientId, phoneSearch, cccdSearch]);

  // Filter invoices logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Patient lookup filter
      if (selectedPatientId && selectedPatientId !== 'ALL') {
        if (inv.patientId !== selectedPatientId) return false;
      } else {
        if (phoneSearch.trim() && !inv.patientPhone.includes(phoneSearch.trim())) {
          return false;
        }
        if (cccdSearch.trim() && !(inv.patientCccd || '').includes(cccdSearch.trim())) {
          return false;
        }
      }

      // 2. Date Filter (Year & Month)
      const parts = inv.date.split('/');
      const invMonth = parts[1];
      const invYear = parts[2];

      if (selectedYear !== 'ALL' && invYear !== selectedYear) {
        return false;
      }

      if (selectedMonth !== 'ALL') {
        const formattedMonth = selectedMonth.padStart(2, '0');
        if (invMonth !== formattedMonth) return false;
      }

      // 3. Status filter
      if (statusFilter === 'PAID' && inv.status !== 'Đã thanh toán') return false;
      if (statusFilter === 'PARTIAL' && inv.status !== 'Thanh toán một phần') return false;
      if (statusFilter === 'UNPAID' && inv.status !== 'Chưa thanh toán') return false;

      // 4. Search Query filter (Mã HĐ hoặc Tên bệnh nhân)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = inv.id.toLowerCase().includes(q);
        const matchesName = inv.patientName.toLowerCase().includes(q);
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  }, [invoices, selectedPatientId, phoneSearch, cccdSearch, selectedYear, selectedMonth, statusFilter, searchQuery]);

  const handleResetFilters = () => {
    setPhoneSearch('');
    setCccdSearch('');
    setSelectedPatientId('ALL');
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setPage(0);
  };

  // Nhận hóa đơn đã cập nhật từ PaymentConfirmModal
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

  return (
    <div className="space-y-3 p-1 w-full">

      {/* PANEL 1: TRA CỨU THÔNG TIN BỆNH NHÂN */}
      <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-300 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Filter size={16} className="text-teal-700" />
            Bộ lọc & Tìm kiếm tra cứu bệnh nhân
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

        {/* Controls Row: Phone Search on Left, CCCD & Patient Select on Right */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left Side: Tìm theo SĐT */}
          <div className="w-full lg:w-72">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-1.5">
              Tìm theo Số điện thoại (SĐT)
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nhập SĐT khách hàng..."
                value={phoneSearch}
                onChange={(e) => {
                  setPhoneSearch(e.target.value);
                  if (e.target.value) setSelectedPatientId('ALL');
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Side: Tìm theo CCCD & Chọn danh sách khách hàng */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-1.5">
                Tìm theo Số CCCD/CMND
              </label>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nhập số CCCD/CMND..."
                  value={cccdSearch}
                  onChange={(e) => {
                    setCccdSearch(e.target.value);
                    if (e.target.value) setSelectedPatientId('ALL');
                    setPage(0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="w-full sm:w-72">
              <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-1.5">
                Chọn danh sách khách hàng
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setPhoneSearch('');
                    setCccdSearch('');
                    setPage(0);
                  }}
                  className="w-full bg-slate-50 border border-teal-700 pl-9 pr-8 py-2 text-sm font-bold text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">-- Tất cả khách hàng ({MOCK_PATIENTS.length}) --</option>
                  {MOCK_PATIENTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Crisp ERP Patient Details Card */}
        {activeCustomer && (
          <div className="bg-emerald-50/90 border border-emerald-300 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all mt-2">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-sm bg-teal-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                {activeCustomer.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-extrabold text-base text-slate-900">{activeCustomer.name}</h3>
                  <span className="bg-white text-teal-800 text-xs font-extrabold px-2.5 py-0.5 rounded-sm border border-teal-300">
                    Mã hồ sơ: {activeCustomer.id}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Số điện thoại: <strong className="text-teal-800 font-bold">{activeCustomer.phone}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Ngày sinh: <strong className="text-slate-900 font-bold">{activeCustomer.dob || '15/08/1990'}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>CCCD: <strong className="text-slate-900 font-bold">{activeCustomer.cccd}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Địa chỉ: <span className="text-slate-800 font-medium">{activeCustomer.address}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PANEL 2: BỘ LỌC DANH SÁCH HÓA ĐƠN */}
      <div className="bg-white p-4 sm:p-2 rounded-sm border border-slate-300 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Filter size={16} className="text-teal-700" />
            Bộ lọc danh sách hóa đơn
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

        {/* Compact Filters Row: Year & Month on Left, Payment Status on Right */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left Side: Lọc theo Năm & Tháng */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter 1: Lọc theo Năm */}
            <div className="w-full sm:w-44">
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setPage(0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">-- Tất cả năm --</option>
                  <option value="2026">Năm 2026</option>
                  <option value="2025">Năm 2025</option>
                  <option value="2024">Năm 2024</option>
                </select>
              </div>
            </div>

            {/* Filter 2: Lọc theo Tháng */}
            <div className="w-full sm:w-48">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">-- Tất cả các tháng --</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const mStr = (i + 1).toString().padStart(2, '0');
                  return (
                    <option key={mStr} value={mStr}>
                      Tháng {i + 1}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Right Side: Trạng thái thanh toán (Pushed to Far Right) */}
          <div className="w-full sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 rounded-sm focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán đủ</option>
              <option value="PARTIAL">Thanh toán một phần</option>
              <option value="UNPAID">Chưa thanh toán</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table Section */}
      <Paper elevation={0} className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead className="bg-slate-100/80">
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Ngày lập</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Mã hóa đơn</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Tên khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Số điện thoại</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Tổng tiền</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Đã thanh toán</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Còn nợ</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Trạng thái</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={26} className="text-amber-500" />
                      <p className="font-bold text-xs">Không tìm thấy hóa đơn nào trùng khớp tiêu chí tra cứu.</p>
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
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                        {inv.date}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                        {inv.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f766e' }}>
                        {inv.patientName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                        {inv.patientPhone}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                        {formatVND(inv.totalAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#047857' }}>
                        {formatVND(inv.paidAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 800, color: inv.debtAmount > 0 ? '#e11d48' : '#64748b' }}>
                        {formatVND(inv.debtAmount).replace(' đ', '')}
                      </TableCell>
                      <TableCell align="center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${inv.status === 'Đã thanh toán'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.status === 'Thanh toán một phần'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowDetailModal(true);
                            }}
                            title="Xem chi tiết"
                            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye size={17} />
                          </button>
                          {inv.debtAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPaymentModal(true);
                              }}
                              title="Thanh toán"
                              className="p-1.5 rounded text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <CreditCard size={17} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowPrintModal(true);
                            }}
                            title="In hóa đơn"
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Printer size={17} />
                          </button>
                        </div>
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

      {/* Modals */}
      <InvoiceDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
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

