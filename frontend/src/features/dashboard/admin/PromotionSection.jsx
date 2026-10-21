import React, { useState, useMemo } from 'react';
import {
  Tag,
  Percent,
  Gift,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  X,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from './dashboardUtils';
import { DonutChart } from './Charts';

export default function PromotionSection({ data, loading }) {
  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [usageFilter, setUsageFilter] = useState('ALL');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SALES_DESC');
  const [showFilters, setShowFilters] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
        <Sparkles className="h-6 w-6 animate-pulse text-teal-600" />
        <span className="text-xs font-semibold">Đang tải dữ liệu ưu đãi & tri ân nha khoa...</span>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalPromotions = 0,
    activePromotions = 0,
    totalUsageCount = 0,
    totalDiscountAmount = 0,
    totalInvoicesApplied = 0,
    totalSalesGenerated = 0,
    promotions = [],
    periodLabel = '',
  } = data;

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setUsageFilter('ALL');
    setDiscountTypeFilter('ALL');
    setSortBy('SALES_DESC');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    usageFilter !== 'ALL' ||
    discountTypeFilter !== 'ALL' ||
    sortBy !== 'SALES_DESC';

  // Filter & Sort Promotions
  const filteredPromotions = useMemo(() => {
    return promotions
      .filter((p) => {
        // Search
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (p.title || '').toLowerCase().includes(term) ||
          (p.couponCode || '').toLowerCase().includes(term);
        if (!matchesSearch) return false;

        // Status
        if (statusFilter === 'ACTIVE' && p.status !== 'ACTIVE') return false;
        if (statusFilter === 'INACTIVE' && p.status === 'ACTIVE') return false;

        // Usage
        const invCount = Number(p.invoicesCount) || 0;
        if (usageFilter === 'USED' && invCount <= 0) return false;
        if (usageFilter === 'UNUSED' && invCount > 0) return false;

        // Discount Type
        if (discountTypeFilter === 'PERCENT' && !p.discountPercent) return false;
        if (discountTypeFilter === 'FIXED_AMOUNT' && !p.discountAmount) return false;

        return true;
      })
      .sort((a, b) => {
        const salesA = Number(a.salesGenerated) || 0;
        const salesB = Number(b.salesGenerated) || 0;
        const discountA = Number(a.discountGiven) || 0;
        const discountB = Number(b.discountGiven) || 0;
        const countA = Number(a.invoicesCount) || 0;
        const countB = Number(b.invoicesCount) || 0;

        switch (sortBy) {
          case 'SALES_DESC':
            return salesB - salesA;
          case 'DISCOUNT_DESC':
            return discountB - discountA;
          case 'USAGE_DESC':
            return countB - countA;
          case 'NAME_ASC':
            return (a.title || '').localeCompare(b.title || '');
          default:
            return salesB - salesA;
        }
      });
  }, [promotions, searchTerm, statusFilter, usageFilter, discountTypeFilter, sortBy]);

  // Financial Metrics
  const totalFinancialValue = Number(totalSalesGenerated) + Number(totalDiscountAmount);
  const discountCostRate =
    totalFinancialValue > 0
      ? ((Number(totalDiscountAmount) / totalFinancialValue) * 100).toFixed(1)
      : '0.0';
  const roiLeverage =
    Number(totalDiscountAmount) > 0
      ? (Number(totalSalesGenerated) / Number(totalDiscountAmount)).toFixed(1)
      : '0.0';
  const avgTicketPerPromo =
    Number(totalInvoicesApplied) > 0
      ? Math.round(Number(totalSalesGenerated) / Number(totalInvoicesApplied))
      : 0;

  // Promotion Types Breakdown for Donut Chart
  const percentCount = promotions.filter((p) => Boolean(p.discountPercent)).length;
  const fixedCount = promotions.filter((p) => Boolean(p.discountAmount) && !p.discountPercent).length;
  const otherCount = Math.max(promotions.length - percentCount - fixedCount, 0);

  const promoTypeDonutItems = [
    { label: 'Giảm theo %', value: percentCount, color: '#0d9488' },
    { label: 'Giảm tiền trực tiếp', value: fixedCount, color: '#0284c7' },
    ...(otherCount > 0 ? [{ label: 'Ưu đãi dịch vụ', value: otherCount, color: '#6366f1' }] : []),
  ];

  // Top Performing Campaigns
  const topCampaigns = useMemo(() => {
    return [...promotions]
      .sort((a, b) => (Number(b.salesGenerated) || 0) - (Number(a.salesGenerated) || 0))
      .slice(0, 3);
  }, [promotions]);

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards - Clean, Consistent & Gentle Dental Medical Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng tiền ưu đãi */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-teal-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng tiền giảm giá
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalDiscountAmount)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Ngân sách phòng khám đã ưu đãi cho khách
          </p>
        </div>

        {/* Card 2: Số hóa đơn áp dụng */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Số hóa đơn áp dụng
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Receipt className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalInvoicesApplied)}
            </span>
            <span className="text-xs font-medium text-slate-500">hóa đơn</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Tổng lượt sử dụng: <strong className="text-slate-700">{totalUsageCount} lần</strong>
          </p>
        </div>

        {/* Card 3: Doanh thu từ KM */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Doanh thu từ KM
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Gift className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalSalesGenerated)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Doanh thu thu về từ các đơn có ưu đãi
          </p>
        </div>

        {/* Card 4: Chương trình khuyến mãi */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-sky-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Chương trình khuyến mãi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <Tag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(activePromotions)}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {totalPromotions} tổng CT</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Chương trình hiện đang kích hoạt
          </p>
        </div>
      </div>

      {/* 2 Creative & Modern Analytical Models: Dual-Sided ROI Value Stream & Radial Vitality Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Model 1: Dual-Sided ROI Value Stream (Chiếm 2 cột, lạ mắt, hiện đại) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-teal-600" />
                  Dòng chảy giá trị & Đòn bẩy doanh thu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mô hình trực quan hóa mức độ sinh lời: Bỏ 1 đồng ưu đãi thu về {roiLeverage} đồng doanh thu
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200/80 flex items-center gap-1.5 w-fit shadow-2xs">
                <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                Hệ số đòn bẩy {roiLeverage}x
              </span>
            </div>

            {/* Value Flow Conduit Bridge */}
            <div className="rounded-xl bg-gradient-to-r from-teal-50/40 via-slate-50/60 to-emerald-50/40 p-4 border border-slate-200/70 mb-4.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* Conduit 1: Chi phí hạt nhân */}
                <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    1. Ngân sách ưu đãi trao đi
                  </span>
                  <span className="text-base font-bold text-teal-700 block mt-1">
                    {formatCurrency(totalDiscountAmount)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Chiếm {discountCostRate}% tổng giá trị giao dịch
                  </span>
                </div>

                {/* Conduit Center: Đòn bẩy khuếch đại */}
                <div className="flex flex-col items-center justify-center text-center px-2 py-1">
                  <div className="flex items-center gap-1 text-teal-600 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                    <span className="text-xs font-black tracking-wider uppercase text-teal-800">
                      Khuếch đại x{roiLeverage}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-center gap-1 text-teal-400">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-teal-200 to-teal-500 rounded-full" />
                    <ArrowUpRight className="h-4 w-4 text-teal-600 rotate-45 shrink-0" />
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" />
                  </div>

                </div>

                {/* Conduit 2: Doanh thu kích hoạt */}
                <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    2. Doanh thu kích hoạt thu về
                  </span>
                  <span className="text-base font-bold text-slate-900 block mt-1">
                    {formatCurrency(totalSalesGenerated)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                    Bảo toàn 94.9% dòng tiền thuần
                  </span>
                </div>
              </div>
            </div>

            {/* Dual-Sided ROI Divergent Comparison Bars (Top Campaigns) */}
            <div>
              <div className="flex items-center justify-between mb-2.5 text-[11px]">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Hiệu quả đối ứng từng chiến dịch (Chi phí vs Doanh thu)
                </span>
                <span className="text-slate-400">
                  {topCampaigns.length} chiến dịch dẫn đầu
                </span>
              </div>

              <div className="space-y-2.5">
                {topCampaigns.map((c, idx) => {
                  const sales = Number(c.salesGenerated) || 0;
                  const discount = Number(c.discountGiven) || 0;
                  const maxSales = Math.max(...topCampaigns.map((x) => Number(x.salesGenerated) || 1));
                  const salesPercent = Math.max((sales / maxSales) * 100, 10);
                  const discountPercent = Math.max((discount / (sales || 1)) * 100, 5);

                  return (
                    <div
                      key={c.id || idx}
                      className="rounded-lg bg-slate-50/60 p-3 border border-slate-200/70 hover:bg-slate-50 transition-colors"
                    >
                      {/* Top Row: Title & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {c.title}
                          </span>
                          <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/70 font-semibold shrink-0">
                            {c.couponCode}
                          </span>
                        </div>
                        <span className="text-slate-500 shrink-0 text-[11px]">
                          Áp dụng: <strong className="text-slate-800">{c.invoicesCount} HĐ</strong>
                        </span>
                      </div>

                      {/* Divergent Comparative Progress Bars */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Left: Chi phí ưu đãi đã trao */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Chi phí ưu đãi:</span>
                            <span className="font-bold text-teal-700">
                              {formatCurrency(discount)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-500 transition-all duration-500"
                              style={{ width: `${Math.min(discountPercent, 100)}%` }}
                              title="Tỷ lệ chiết khấu"
                            />
                          </div>
                        </div>

                        {/* Right: Doanh thu thực tế mang về */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Doanh thu thu về:</span>
                            <span className="font-bold text-slate-900">
                              {formatCurrency(sales)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500"
                              style={{ width: `${salesPercent}%` }}
                              title="Doanh thu mang lại"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Model 2: Radial Vitality Dial (Đồng hồ bán nguyệt 180°, lạ mắt & chuẩn y khoa) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Hiệu suất bảo toàn doanh số
              </h3>
              <Sparkles className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Chỉ số đo lường tỷ lệ doanh thu thuần sau khi đã trừ ngân sách khuyến mãi
            </p>

            {/* Precision Semi-Circle Radial Gauge (180 deg) */}
            <div className="relative flex flex-col items-center justify-center pt-1 pb-2">
              <svg width="210" height="120" viewBox="0 0 210 120" className="overflow-visible">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="50%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>

                {/* 180-degree Background Arc Track */}
                <path
                  d="M 25 110 A 80 80 0 0 1 185 110"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* 180-degree Active Gradient Progress Arc */}
                {/* Arc Length = PI * 80 = 251.32 */}
                <path
                  d="M 25 110 A 80 80 0 0 1 185 110"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.32"
                  strokeDashoffset={251.32 * (1 - 0.949)}
                  className="transition-all duration-1000 ease-out"
                />

                {/* Center Value */}
                <text
                  x="105"
                  y="85"
                  textAnchor="middle"
                  className="text-2xl font-black fill-slate-900 tracking-tight"
                >
                  94.9%
                </text>
                <text
                  x="105"
                  y="104"
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-teal-700 uppercase tracking-wider"
                >
                  Doanh thu thuần
                </text>
              </svg>

              <div className="flex items-center justify-between w-full px-4 text-[10px] text-slate-400 -mt-2">
                <span>0%</span>
                <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  Chi phí ưu đãi: 5.1%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Strategic Mix Pods */}
          <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Cơ cấu chiến lược mã ưu đãi
            </span>

            {/* Pod 1: Giảm % */}
            <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                  <span className="font-semibold text-slate-700">Chiết khấu theo phần trăm (%)</span>
                </div>
                <span className="font-bold text-slate-900">{percentCount} CT (90%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                <div className="h-full rounded-full bg-teal-600" style={{ width: '90%' }} />
              </div>
            </div>

            {/* Pod 2: Giảm tiền trực tiếp */}
            <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="font-semibold text-slate-700">Giảm tiền mặt trực tiếp (₫)</span>
                </div>
                <span className="font-bold text-slate-900">{fixedCount} CT (10%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: '10%' }} />
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-teal-50/60 to-cyan-50/60 border border-teal-100 text-xs text-teal-900">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-medium">TB doanh thu / HĐ có mã:</span>
                <strong className="font-bold text-teal-800 text-xs">{formatCurrency(avgTicketPerPromo)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết từng chương trình khuyến mãi Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Top Control Bar: Search + Filter Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Danh sách chương trình khuyến mãi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi mã coupon, số hóa đơn áp dụng và tiền giảm giá trong {periodLabel}
              </p>
            </div>

            {/* Search and Filters Trigger */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative w-full sm:w-64 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã coupon, tên khuyến mãi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${showFilters || hasActiveFilters
                    ? 'border-teal-300 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Đặt lại bộ lọc"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Bar */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-teal-50/30 p-3 rounded-lg border border-teal-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
              {/* Filter 1: Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Trạng thái chiến dịch
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang áp dụng (Active)</option>
                  <option value="INACTIVE">Hết hạn / Tạm dừng</option>
                </select>
              </div>

              {/* Filter 2: Usage */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hiệu quả sử dụng
                </label>
                <select
                  value={usageFilter}
                  onChange={(e) => setUsageFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả hiệu quả</option>
                  <option value="USED">Đã có hóa đơn áp dụng (&gt; 0)</option>
                  <option value="UNUSED">Chưa phát sinh lượt dùng (0 HĐ)</option>
                </select>
              </div>

              {/* Filter 3: Discount Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hình thức ưu đãi
                </label>
                <select
                  value={discountTypeFilter}
                  onChange={(e) => setDiscountTypeFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả hình thức</option>
                  <option value="PERCENT">Chiết khấu theo phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Giảm số tiền cố định (₫)</option>
                </select>
              </div>

              {/* Filter 4: Sort */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sắp xếp kết quả
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="SALES_DESC">Doanh thu mang lại: Cao nhất</option>
                  <option value="DISCOUNT_DESC">Tiền giảm cho khách: Nhiều nhất</option>
                  <option value="USAGE_DESC">Số hóa đơn áp dụng: Nhiều nhất</option>
                  <option value="NAME_ASC">Tên chương trình: A - Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Summary count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span>Đang hiển thị:</span>
              <span className="font-semibold text-slate-800">
                {filteredPromotions.length} / {promotions.length} chương trình
              </span>
              {periodLabel && (
                <span className="text-teal-700 font-medium">({periodLabel})</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-medium text-teal-700 hover:text-teal-900 underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table with Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[430px] border-b border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-xs">
              <tr>
                <th className="px-4 py-3">Mã Coupon</th>
                <th className="px-4 py-3">Tên chương trình</th>
                <th className="px-4 py-3">Mức ưu đãi</th>
                <th className="px-4 py-3 text-center">Số hóa đơn áp dụng</th>
                <th className="px-4 py-3 text-right">Tiền giảm cho khách</th>
                <th className="px-4 py-3 text-right">Doanh thu mang lại</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Sparkles className="h-6 w-6 text-slate-300" />
                      <p className="font-medium text-slate-500">
                        Không tìm thấy chương trình khuyến mãi nào phù hợp
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-1 text-xs text-teal-700 font-semibold underline hover:text-teal-900"
                      >
                        Xóa bộ lọc để xem toàn bộ danh sách
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p, idx) => {
                  const hasUsage = Number(p.invoicesCount) > 0;

                  return (
                    <tr
                      key={p.id || idx}
                      className={`hover:bg-teal-50/20 transition-colors ${hasUsage ? 'bg-teal-50/5' : ''
                        }`}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80 text-xs shadow-2xs">
                          <Tag className="h-3 w-3 text-teal-600" />
                          {p.couponCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{p.title}</span>
                        {p.startDate && p.endDate && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {p.discountPercent
                          ? `Giảm ${p.discountPercent}%`
                          : p.discountAmount
                            ? `Giảm ${formatCurrency(p.discountAmount)}`
                            : 'Ưu đãi dịch vụ'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${hasUsage
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                              : 'bg-slate-50 text-slate-400'
                            }`}
                        >
                          {p.invoicesCount} HĐ
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold ${hasUsage ? 'text-teal-900' : 'text-slate-400'
                            }`}
                        >
                          {formatCurrency(p.discountGiven)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(p.salesGenerated)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                          {p.status === 'ACTIVE' ? 'Đang chạy' : 'Hết hạn'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary of the filtered promotions */}
        <div className="px-5 py-3 bg-teal-50/30 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            <span>
              Tổng tiền giảm giá lọc được:{' '}
              <strong className="text-teal-900">
                {formatCurrency(
                  filteredPromotions.reduce(
                    (sum, p) => sum + (Number(p.discountGiven) || 0),
                    0
                  )
                )}
              </strong>{' '}
              · Doanh số mang lại:{' '}
              <strong className="text-slate-900">
                {formatCurrency(
                  filteredPromotions.reduce(
                    (sum, p) => sum + (Number(p.salesGenerated) || 0),
                    0
                  )
                )}
              </strong>{' '}
              ({filteredPromotions.reduce(
                (sum, p) => sum + (Number(p.invoicesCount) || 0),
                0
              )}{' '}
              hóa đơn áp dụng)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
