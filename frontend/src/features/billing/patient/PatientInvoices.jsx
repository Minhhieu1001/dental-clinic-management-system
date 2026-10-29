import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  Calendar,
  Eye,
  Printer,
  RefreshCw,
  Copy,
  X,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../../../components/ui/Loading';
import { getInvoicesByPatientId } from '../../../services/invoice.service';
import { mapBackendInvoiceToUi } from '../../../utils/invoiceMapper';
import PrintInvoiceModal from '../employee/action/PrintInvoiceModal';
import PatientInvoiceDetail from './action/PatientInvoiceDetail';

export default function PatientInvoices() {
  const reduceMotion = useReducedMotion();
  const viewTransition = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduceMotion ? 0 : -6 },
    transition: { duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] },
  };
  const { user, isLoading: authLoading } = useAuth();
  const patientId = user?.patientId || user?.id;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  // 1. Fetch danh sách hóa đơn theo patientId
  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getInvoicesByPatientId(patientId);
      const list = Array.isArray(res) ? res : res?.invoices || [];
      const mapped = list.map((inv) => mapBackendInvoiceToUi(inv)).filter(Boolean);

      // Sắp xếp ngày giảm dần (mới nhất lên trước)
      mapped.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0));
      setInvoices(mapped);

      if (isRefresh) {
        toast.success('Đã làm mới danh sách hóa đơn!');
      }
    } catch (error) {
      console.warn('Lỗi lấy danh sách hóa đơn bệnh nhân:', error);
      toast.error('Không thể tải danh sách hóa đơn. Vui lòng thử lại!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!authLoading && patientId) {
      fetchInvoices();
    } else if (!authLoading && !patientId) {
      setLoading(false);
    }
  }, [authLoading, patientId, fetchInvoices]);

  // 2. Thống kê số liệu hóa đơn
  const summary = useMemo(() => {
    const totalCount = invoices.length;
    let totalCost = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    invoices.forEach((inv) => {
      totalCost += Number(inv.finalAmount || 0);
      totalPaid += Number(inv.paidAmount || 0);
      totalDebt += Number(inv.debtAmount || 0);
      if (inv.status === 'Đã thanh toán') {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    return {
      totalCount,
      totalCost,
      totalPaid,
      totalDebt,
      paidCount,
      unpaidCount
    };
  }, [invoices]);

  // 3. Danh sách các năm phát sinh hóa đơn
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    invoices.forEach((inv) => {
      if (inv.rawDate) {
        const y = new Date(inv.rawDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [invoices]);

  // 4. Lọc hóa đơn theo điều kiện tìm kiếm
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Lọc trạng thái
      if (statusFilter === 'PAID' && inv.status !== 'Đã thanh toán') return false;
      if (statusFilter === 'UNPAID' && inv.status !== 'Chưa thanh toán') return false;
      if (statusFilter === 'PARTIAL' && inv.status !== 'Thanh toán một phần') return false;

      // Chỉ so khớp hóa đơn có ngày hợp lệ khi lọc thời gian.
      if (yearFilter !== 'ALL' || monthFilter !== 'ALL') {
        if (!inv.rawDate) return false;
        const invoiceDate = new Date(inv.rawDate);
        if (Number.isNaN(invoiceDate.getTime())) return false;
        if (yearFilter !== 'ALL' && invoiceDate.getFullYear() !== Number(yearFilter)) return false;
        if (monthFilter !== 'ALL' && invoiceDate.getMonth() + 1 !== Number(monthFilter)) return false;
      }

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (inv.id || '').toLowerCase().includes(q);
        const matchBranch = (inv.branchName || '').toLowerCase().includes(q);
        const matchServices = (inv.services || []).some((s) => (s.name || '').toLowerCase().includes(q));
        if (!matchId && !matchBranch && !matchServices) return false;
      }

      return true;
    });
  }, [invoices, statusFilter, yearFilter, monthFilter, searchQuery]);

  // Helpers hiển thị Badge trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Đã thanh toán':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã thanh toán
          </span>
        );
      case 'Thanh toán một phần':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Thanh toán một phần
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Chưa thanh toán
          </span>
        );
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <Loading
          size="lg"
          title="Đang tải danh sách hóa đơn..."
          subtitle="Vui lòng chờ trong giây lát"
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showDetailModal && selectedInvoice ? (
        <motion.div key="invoice-detail" {...viewTransition}>
          <PatientInvoiceDetail invoice={selectedInvoice} onBack={() => setShowDetailModal(false)} />
        </motion.div>
      ) : (
        <motion.div key="invoice-list" className="space-y-6" {...viewTransition}>

          {/* ================= 4 CARDS THỐNG KÊ TỔNG QUAN ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">

            {/* Thẻ 1: Tổng số hóa đơn */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tổng hóa đơn</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FileText size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">{summary.totalCount}</div>
                <span className="text-[11px] font-medium text-slate-400">chứng từ điều trị</span>
              </div>
            </div>

            {/* Thẻ 2: Tổng chi phí */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tổng viện phí</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-slate-900 truncate" title={formatVND(summary.totalCost)}>
                  {formatVND(summary.totalCost)}
                </div>
                <span className="text-[11px] font-medium text-slate-400">tổng giá trị dịch vụ</span>
              </div>
            </div>

            {/* Thẻ 3: Đã thanh toán */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Đã thanh toán</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-emerald-800 truncate" title={formatVND(summary.totalPaid)}>
                  {formatVND(summary.totalPaid)}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {summary.paidCount} hóa đơn hoàn tất
                </span>
              </div>
            </div>

            {/* Thẻ 4: Còn nợ / Chờ thanh toán */}
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-100 bg-amber-50/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">Còn lại cần trả</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-amber-800 truncate" title={formatVND(summary.totalDebt)}>
                  {formatVND(summary.totalDebt)}
                </div>
                <span className="text-[11px] font-semibold text-amber-600">
                  {summary.unpaidCount} hóa đơn chờ
                </span>
              </div>
            </div>

          </div>

          {/* ================= THANH TÌM KIẾM & BỘ LỌC ================= */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center gap-3">

              {/* Ô Input Search */}
              <div className="relative w-full md:w-80 lg:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Tìm hóa đơn theo mã, dịch vụ hoặc cơ sở"
                  placeholder="Tìm mã hóa đơn, dịch vụ, cơ sở..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Năm lấy từ dữ liệu hóa đơn thực tế, tháng theo lịch. */}
              <div className="grid w-full grid-cols-2 gap-3 md:ml-auto md:w-auto">
                <div className="flex min-w-0 flex-col gap-1.5 md:flex-row md:items-center md:gap-2">
                  <label htmlFor="invoice-year" className="text-xs font-semibold text-slate-500 shrink-0">Năm:</label>
                  <select
                    id="invoice-year"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer md:w-32"
                  >
                    <option value="ALL">Tất cả năm</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>Năm {y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 md:flex-row md:items-center md:gap-2">
                  <label htmlFor="invoice-month" className="text-xs font-semibold text-slate-500">Tháng:</label>
                  <select
                    id="invoice-month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer md:w-32"
                  >
                    <option value="ALL">Tất cả tháng</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={month}>Tháng {month}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Lọc Trạng thái (Pills) */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center">
              <span className="col-span-2 text-slate-500 font-semibold sm:pr-1">Trạng thái:</span>

              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`min-h-10 px-2 py-2 rounded-xl text-center font-bold transition-colors cursor-pointer sm:min-h-0 sm:px-3 sm:py-1.5 ${statusFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                Tất cả
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`min-h-10 px-2 py-2 rounded-xl text-center font-bold transition-colors cursor-pointer sm:min-h-0 sm:px-3 sm:py-1.5 ${statusFilter === 'PAID'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                Đã thanh toán
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('UNPAID')}
                className={`min-h-10 px-2 py-2 rounded-xl text-center font-bold transition-colors cursor-pointer sm:min-h-0 sm:px-3 sm:py-1.5 ${statusFilter === 'UNPAID'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                Chưa thanh toán
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PARTIAL')}
                className={`min-h-10 px-2 py-2 rounded-xl text-center font-bold transition-colors cursor-pointer sm:min-h-0 sm:px-3 sm:py-1.5 ${statusFilter === 'PARTIAL'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                Thanh toán một phần
              </button>
            </div>
          </div>

          {/* ================= DANH SÁCH HÓA ĐƠN ================= */}
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center mx-auto shadow-inner">
                <Receipt size={30} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Không tìm thấy hóa đơn nào</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL' || yearFilter !== 'ALL' || monthFilter !== 'ALL'
                  ? 'Không có hóa đơn nào khớp với bộ lọc tìm kiếm hiện tại. Hãy thử thay đổi điều kiện lọc.'
                  : 'Bạn chưa có hóa đơn điều trị nào được lưu trữ trong hệ thống.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || yearFilter !== 'ALL' || monthFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setYearFilter('ALL');
                    setMonthFilter('ALL');
                  }}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer pt-1"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">

              {/* 1. Giao diện dạng BẢNG (Desktop & Tablet: hidden sm:block) */}
              <div className="hidden md:block rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">STT</th>
                        <th className="py-3.5 px-4 w-36">Mã hóa đơn</th>
                        <th className="py-3.5 px-4 w-28">Ngày lập</th>
                        <th className="py-3.5 px-4 w-36 text-right">Tổng tiền</th>
                        <th className="py-3.5 px-4 w-36 text-right">Đã thanh toán</th>
                        <th className="py-3.5 px-4 w-36 text-right">Còn nợ</th>
                        <th className="py-3.5 px-4 w-36 text-center">Trạng thái</th>
                        <th className="py-3.5 px-4 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.map((inv, idx) => {
                        const services = inv.services || [];
                        const firstService = services[0]?.name;
                        const remainingCount = services.length - 1;

                        return (
                          <tr key={inv.id || idx} className="hover:bg-slate-50/70 transition-colors">

                            {/* STT */}
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Mã hóa đơn */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-mono font-bold text-teal-800">
                                <span>{inv.id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(inv.id, 'Mã hóa đơn')}
                                  className="text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                                  title="Sao chép mã"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                              {inv.branchName && (
                                <span className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[140px]" title={inv.branchName}>
                                  <Building2 size={11} className="shrink-0" />
                                  <span className="truncate">{inv.branchName}</span>
                                </span>
                              )}
                            </td>

                            {/* Ngày lập */}
                            <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-slate-400 shrink-0" />
                                <span>{inv.date}</span>
                              </div>
                            </td>

                            {/* Tổng tiền */}
                            <td className="py-3.5 px-4 text-right">
                              <strong className="font-bold text-slate-900 text-sm">
                                {formatVND(inv.finalAmount)}
                              </strong>
                              {Number(inv.discountAmount) > 0 && (
                                <span className="block text-[10px] text-emerald-600 font-semibold">
                                  (Giảm: {formatVND(inv.discountAmount)})
                                </span>
                              )}
                            </td>

                            {/* Đã thanh toán */}
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                              {formatVND(inv.paidAmount)}
                            </td>

                            {/* Còn nợ */}
                            <td className="py-3.5 px-4 text-right">
                              {Number(inv.debtAmount) > 0 ? (
                                <strong className="font-bold text-rose-600">
                                  {formatVND(inv.debtAmount)}
                                </strong>
                              ) : (
                                <span className="text-slate-400 font-medium">0 đ</span>
                              )}
                            </td>

                            {/* Trạng thái */}
                            <td className="py-3.5 px-4 text-center">
                              {renderStatusBadge(inv.status)}
                            </td>

                            {/* Nút Xem chi tiết & In */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                  title="Xem chi tiết hóa đơn"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setShowPrintModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="In hóa đơn"
                                >
                                  <Printer size={16} />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Giao diện dạng THẺ (Mobile View: block md:hidden) */}
              <div className="block md:hidden space-y-3.5">
                {filteredInvoices.map((inv, idx) => {
                  const services = inv.services || [];
                  const firstService = services[0]?.name;
                  const remainingCount = services.length - 1;

                  return (
                    <div
                      key={inv.id || idx}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3"
                    >
                      {/* Card Header: Mã hóa đơn & Trạng thái */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-teal-800">{inv.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(inv.id, 'Mã hóa đơn')}
                            className="text-slate-400 hover:text-teal-700 p-0.5"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        {renderStatusBadge(inv.status)}
                      </div>

                      {/* Thông tin dịch vụ & ngày */}
                      <div className="text-xs space-y-1.5 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Ngày lập:</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {inv.date}
                          </span>
                        </div>

                        {inv.branchName && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Cơ sở:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[190px]">
                              {inv.branchName}
                            </span>
                          </div>
                        )}

                      </div>

                      {/* Các khoản tiền */}
                      <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Tổng viện phí:</span>
                          <strong className="font-bold text-slate-900">{formatVND(inv.finalAmount)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-emerald-700">
                          <span>Đã thanh toán:</span>
                          <strong className="font-bold">{formatVND(inv.paidAmount)}</strong>
                        </div>
                        {Number(inv.debtAmount) > 0 && (
                          <div className="flex items-center justify-between text-rose-700 pt-0.5 border-t border-slate-200/60 font-bold">
                            <span>Còn nợ:</span>
                            <span>{formatVND(inv.debtAmount)}</span>
                          </div>
                        )}
                      </div>

                      {/* Nút hành động */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Xem chi tiết</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================= MODAL IN HÓA ĐƠN ================= */}
          {showPrintModal && selectedInvoice && (
            <PrintInvoiceModal
              open={showPrintModal}
              onClose={() => setShowPrintModal(false)}
              invoice={selectedInvoice}
            />
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
