import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatDateTime } from './dashboardUtils';
import { AreaTrendChart, DonutChart } from './Charts';

export default function RevenueSection({ data, loading }) {
  // Advanced filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [amountRange, setAmountRange] = useState('ALL');
  const [sortBy, setSortBy] = useState('TIME_DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedCode, setCopiedCode] = useState(null);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Đang tải dữ liệu doanh thu...
      </div>
    );
  }

  if (!data) return null;

  const {
    totalInvoices = 0,
    invoiceRevenue = 0,
    actualCollected = 0,
    remainingDebt = 0,
    invoiceCountGrowthRate = 0,
    invoiceRevenueGrowthRate = 0,
    actualCollectedGrowthRate = 0,
    remainingDebtGrowthRate = 0,
    totalAmount = 0,
    totalDiscount = 0,
    serviceAmount = 0,
    medicineAmount = 0,
    otherAmount = 0,
    trend = [],
    paymentMethods = [],
    invoiceStatuses = [],
    recentPayments = [],
    periodLabel = '',
  } = data;

  // Donut payment method colors
  const methodColors = {
    CASH: '#10b981',
    BANK_TRANSFER: '#0d9488',
    CREDIT_CARD: '#6366f1',
    MOMO: '#ec4899',
    VNPAY: '#f59e0b',
  };

  const donutItems = (paymentMethods || []).map((m) => ({
    label: m.methodName,
    value: m.amount,
    color: methodColors[m.method] || '#94a3b8',
  }));

  // Ratio percentages for visual bar
  const totalBreakdown = Math.max(actualCollected, 1);
  const servicePct = Math.min(100, Math.round((serviceAmount / totalBreakdown) * 100));
  const medicinePct = Math.min(100 - servicePct, Math.round((medicineAmount / totalBreakdown) * 100));
  const otherPct = Math.max(0, 100 - servicePct - medicinePct);

  // Handle copy transaction code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMethod('ALL');
    setAmountRange('ALL');
    setSortBy('TIME_DESC');
    setCurrentPage(1);
  };

  const isFiltered =
    searchTerm.trim() !== '' ||
    selectedMethod !== 'ALL' ||
    amountRange !== 'ALL' ||
    sortBy !== 'TIME_DESC';

  // Filter & Sort Transactions
  const filteredPayments = useMemo(() => {
    let result = [...recentPayments];

    // Search filter (patient name, invoice code, transaction code, cashier)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.patientName && p.patientName.toLowerCase().includes(q)) ||
          (p.invoiceCode && p.invoiceCode.toLowerCase().includes(q)) ||
          (p.transactionCode && p.transactionCode.toLowerCase().includes(q)) ||
          (p.cashierName && p.cashierName.toLowerCase().includes(q))
      );
    }

    // Payment method filter
    if (selectedMethod !== 'ALL') {
      result = result.filter((p) => p.paymentMethod === selectedMethod);
    }

    // Amount range filter
    if (amountRange === 'UNDER_1M') {
      result = result.filter((p) => Number(p.amount) < 1000000);
    } else if (amountRange === 'FROM_1M_TO_5M') {
      result = result.filter(
        (p) => Number(p.amount) >= 1000000 && Number(p.amount) <= 5000000
      );
    } else if (amountRange === 'OVER_5M') {
      result = result.filter((p) => Number(p.amount) > 5000000);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'TIME_DESC') {
        return new Date(b.paymentTime || 0) - new Date(a.paymentTime || 0);
      }
      if (sortBy === 'TIME_ASC') {
        return new Date(a.paymentTime || 0) - new Date(b.paymentTime || 0);
      }
      if (sortBy === 'AMOUNT_DESC') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === 'AMOUNT_ASC') {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      return 0;
    });

    return result;
  }, [recentPayments, searchTerm, selectedMethod, amountRange, sortBy]);

  // Paginated list
  const totalItems = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + pageSize);

  // Total amount of currently filtered payments
  const totalFilteredAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-5">
      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Tổng số hóa đơn */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng số hóa đơn
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalInvoices)}
            </span>
            <span className="text-xs text-slate-400">hóa đơn</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${invoiceCountGrowthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
            >
              {invoiceCountGrowthRate >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(invoiceCountGrowthRate)}
            </span>
            <span className="text-slate-400">so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 2: Doanh thu hóa đơn */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Doanh thu hóa đơn
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(invoiceRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${invoiceRevenueGrowthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
            >
              {invoiceRevenueGrowthRate >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(invoiceRevenueGrowthRate)}
            </span>
            <span className="text-slate-400">so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 3: Thực thu */}
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Thực thu (Tiền về)
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">
              {formatCurrency(actualCollected)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${actualCollectedGrowthRate >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
            >
              {actualCollectedGrowthRate >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(actualCollectedGrowthRate)}
            </span>
            <span className="text-emerald-700/70">dựa trên giao dịch</span>
          </div>
        </div>

        {/* KPI 4: Công nợ còn lại */}
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs transition-shadow ring-1 ring-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Công nợ còn lại
            </span>
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-700">
              {formatCurrency(remainingDebt)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-800/80">
            <span>Tỉ lệ nợ / Doanh thu:</span>
            <span className="font-semibold text-amber-900">
              {invoiceRevenue > 0
                ? `${((remainingDebt / invoiceRevenue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Chi tiết phân rã Doanh thu & Cấu trúc tiền */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Chi tiết cấu trúc doanh thu thực thu trong kỳ
              </h3>
              <p className="text-[11px] text-slate-400">
                Phân bổ dòng tiền thu từ dịch vụ nha khoa, thuốc và các khoản khác
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            {periodLabel}
          </span>
        </div>

        {/* Proportional visual bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
            <span>Tỷ trọng dòng tiền thực thu:</span>
            <span>
              Dịch vụ {servicePct}% {medicinePct > 0 ? `• Thuốc ${medicinePct}%` : ''} {otherPct > 0 ? `• Khác ${otherPct}%` : ''}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
            {servicePct > 0 && (
              <div
                style={{ width: `${servicePct}%` }}
                className="h-full bg-teal-500 transition-all duration-300"
                title={`Dịch vụ: ${formatCurrency(serviceAmount)} (${servicePct}%)`}
              />
            )}
            {medicinePct > 0 && (
              <div
                style={{ width: `${medicinePct}%` }}
                className="h-full bg-violet-500 transition-all duration-300"
                title={`Thuốc: ${formatCurrency(medicineAmount)} (${medicinePct}%)`}
              />
            )}
            {otherPct > 0 && (
              <div
                style={{ width: `${otherPct}%` }}
                className="h-full bg-sky-400 transition-all duration-300"
                title={`Khác: ${formatCurrency(otherAmount)} (${otherPct}%)`}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Tổng tiền trước giảm */}
          <div className="rounded-lg bg-slate-50/70 p-3.5 border border-slate-100 hover:border-slate-200 transition-colors">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">
              Tổng tiền trước giảm
            </span>
            <p className="mt-1 text-base font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tổng giá niêm yết các mục</p>
          </div>

          {/* Tiền dịch vụ */}
          <div className="rounded-lg bg-teal-50/40 p-3.5 border border-teal-100 hover:border-teal-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-teal-800 uppercase tracking-wide">
                Tiền dịch vụ
              </span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-100/60 px-1.5 py-0.2 rounded">
                {servicePct}%
              </span>
            </div>
            <p className="mt-1 text-base font-bold text-teal-900">{formatCurrency(serviceAmount)}</p>
            <p className="text-[10px] text-teal-600/80 mt-0.5">Thủ thuật nha khoa & điều trị</p>
          </div>

          {/* Tiền thuốc */}
          <div className="rounded-lg bg-violet-50/40 p-3.5 border border-violet-100 hover:border-violet-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-violet-800 uppercase tracking-wide">
                Tiền thuốc
              </span>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-100/60 px-1.5 py-0.2 rounded">
                {medicinePct}%
              </span>
            </div>
            <p className="mt-1 text-base font-bold text-violet-900">{formatCurrency(medicineAmount)}</p>
            <p className="text-[10px] text-violet-600/80 mt-0.5">Đơn thuốc & dược phẩm</p>
          </div>

          {/* Thu hộ / khác */}
          <div className="rounded-lg bg-sky-50/40 p-3.5 border border-sky-100 hover:border-sky-200 transition-colors">
            <span className="text-[10.5px] font-semibold text-sky-800 uppercase tracking-wide">
              Thu hộ / Khác
            </span>
            <p className="mt-1 text-base font-bold text-sky-900">{formatCurrency(otherAmount)}</p>
            <p className="text-[10px] text-sky-600/80 mt-0.5">Phụ thu, phí đối tác, khác</p>
          </div>

          {/* Khuyến mãi / Giảm giá */}
          <div className="rounded-lg bg-rose-50/40 p-3.5 border border-rose-100 hover:border-rose-200 transition-colors">
            <span className="text-[10.5px] font-semibold text-rose-800 uppercase tracking-wide">
              Tổng giảm giá
            </span>
            <p className="mt-1 text-base font-bold text-rose-600">{formatCurrency(totalDiscount)}</p>
            <p className="text-[10px] text-rose-500/80 mt-0.5">Chiết khấu voucher & CTKM</p>
          </div>
        </div>
      </div>

      {/* Xu hướng doanh thu Chart & Phân bổ thanh toán */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Xu hướng doanh thu qua các mốc thời gian */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Xu hướng doanh thu</h3>
                <p className="text-xs text-slate-400">
                  So sánh tiến độ Doanh thu hóa đơn vs Thực thu tiền về
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200/80">
                {trend.length} mốc thống kê
              </span>
            </div>

            <AreaTrendChart
              data={trend}
              series={[
                { key: 'invoiceRevenue', label: 'Doanh thu HĐ', color: '#0d9488', gradientId: 'tealGrad' },
                { key: 'actualCollected', label: 'Thực thu', color: '#10b981', gradientId: 'emeraldGrad' },
                { key: 'remainingDebt', label: 'Công nợ', color: '#f59e0b', gradientId: 'roseGrad' },
              ]}
              height={250}
            />
          </div>
        </div>

        {/* Phân bổ Phương thức thanh toán */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Phương thức thanh toán</h3>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>

            <DonutChart
              items={donutItems}
              isCurrency={true}
              centerTitle="Thực thu"
              centerValue={formatCurrency(actualCollected)}
            />
          </div>

          {/* Invoice status breakdown chips */}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-2 uppercase tracking-wide">
              Trạng thái hóa đơn trong kỳ:
            </span>
            <div className="space-y-1.5">
              {invoiceStatuses.map((st, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${st.status === 'PAID'
                          ? 'bg-emerald-500'
                          : st.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-500'
                            : st.status === 'UNPAID'
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                        }`}
                    />
                    {st.statusName} ({st.count} HĐ)
                  </span>
                  <span className="font-semibold text-slate-800">{formatCurrency(st.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách giao dịch thanh toán kèm BỘ LỌC NÂNG CAO */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Table Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Giao dịch thanh toán thành công
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhật ký tiền về thực tế từ bảng
              </p>
            </div>
          </div>

          {/* Live stat counter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-slate-800">{filteredPayments.length}</span> / {recentPayments.length} giao dịch
            </span>
            {isFiltered && (
              <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Tổng lọc: {formatCurrency(totalFilteredAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Thanh Bộ Lọc Nâng Cao (Advanced Filters Toolbar) */}
        <div className="rounded-lg bg-slate-50/70 border border-slate-200/60 p-3 mb-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm bệnh nhân, mã GD, mã HĐ, thu ngân..."
                className="w-full rounded-md border border-slate-200 bg-white pl-8.5 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Payment Method */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Hình thức:</span>
              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
              >
                <option value="ALL">Tất cả hình thức</option>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
                <option value="MOMO">Ví MoMo</option>
                <option value="VNPAY">VNPay</option>
              </select>
            </div>

            {/* Filter by Amount Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Mức tiền:</span>
              <select
                value={amountRange}
                onChange={(e) => {
                  setAmountRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
              >
                <option value="ALL">Tất cả mức tiền</option>
                <option value="UNDER_1M">Dưới 1.000.000 đ</option>
                <option value="FROM_1M_TO_5M">Từ 1 - 5 triệu đ</option>
                <option value="OVER_5M">Trên 5.000.000 đ</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
              >
                <option value="TIME_DESC">Mới nhất trước</option>
                <option value="TIME_ASC">Cũ nhất trước</option>
                <option value="AMOUNT_DESC">Số tiền cao nhất</option>
                <option value="AMOUNT_ASC">Số tiền thấp nhất</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Bảng Dữ Liệu Thanh Toán - Có thể cuộn dọc nội bộ với tiêu đề cố định */}
        <div className="max-h-[380px] overflow-y-auto overflow-x-auto rounded-lg border border-slate-200/80 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5 bg-slate-50">Mã giao dịch</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Mã hóa đơn</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Bệnh nhân</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Số tiền thanh toán</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Hình thức</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Thời gian GD</th>
                <th className="px-3.5 py-2.5 bg-slate-50">Thu ngân</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Filter className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600">
                        Không tìm thấy giao dịch nào phù hợp với bộ lọc
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc các tiêu chí lọc ở trên
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => {
                  const isCopied = copiedCode === p.transactionCode;
                  return (
                    <tr
                      key={p.id || idx}
                      className="hover:bg-teal-50/20 transition-colors duration-150"
                    >
                      {/* Mã giao dịch */}
                      <td className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(p.transactionCode)}
                          className="group inline-flex items-center gap-1 font-mono font-medium text-teal-700 hover:text-teal-900 transition-colors"
                          title="Bấm để sao chép mã GD"
                        >
                          <span>{p.transactionCode}</span>
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-600 animate-in fade-in" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Mã hóa đơn */}
                      <td className="px-3.5 py-2.5 font-medium text-slate-800">
                        {p.invoiceCode || '-'}
                      </td>

                      {/* Bệnh nhân */}
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {p.patientName}
                      </td>

                      {/* Số tiền */}
                      <td className="px-3.5 py-2.5 font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Hình thức thanh toán */}
                      <td className="px-3.5 py-2.5">
                        {p.paymentMethod === 'BANK_TRANSFER' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700 border border-teal-200/60">
                            <CreditCard className="h-3 w-3 text-teal-600" />
                            Chuyển khoản
                          </span>
                        ) : p.paymentMethod === 'CASH' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                            <DollarSign className="h-3 w-3 text-emerald-600" />
                            Tiền mặt
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Thời gian */}
                      <td className="px-3.5 py-2.5 text-slate-500">
                        {formatDateTime(p.paymentTime)}
                      </td>

                      {/* Thu ngân */}
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {p.cashierName || 'Hệ thống'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang nhẹ nhàng (Pagination Toolbar) */}
        {totalItems > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-teal-500"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>Tất cả ({totalItems})</option>
              </select>
              <span>
                (từ {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} trên {totalItems} giao dịch)
              </span>
            </div>

            {/* Page navigation buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <span className="px-2 font-medium text-slate-700">
                  Trang {validCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
