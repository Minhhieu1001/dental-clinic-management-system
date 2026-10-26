import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Search,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  SlidersHorizontal,
  RotateCcw,
  X,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from './dashboardUtils';
import { BarTrendChart, DonutChart } from './Charts';

export default function ServiceSection({ data, loading }) {
  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUsageStatus, setSelectedUsageStatus] = useState('ALL');
  const [selectedPriceTier, setSelectedPriceTier] = useState('ALL');
  const [selectedRevenueTier, setSelectedRevenueTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('REVENUE_DESC');
  const [showFilters, setShowFilters] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
        <Activity className="h-6 w-6 animate-pulse text-teal-600" />
        <span className="text-xs font-semibold">Đang tải dữ liệu dịch vụ nha khoa...</span>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalServicesCount = 0,
    activeServicesCount = 0,
    totalUsageCount = 0,
    totalServiceRevenue = 0,
    revenueGrowthPercent = 0,
    usageGrowthPercent = 0,
    monthlyStats = [],
    services = [],
    categoryStats = [],
    periodLabel = '',
  } = data;

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedUsageStatus('ALL');
    setSelectedPriceTier('ALL');
    setSelectedRevenueTier('ALL');
    setSortBy('REVENUE_DESC');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'ALL' ||
    selectedUsageStatus !== 'ALL' ||
    selectedPriceTier !== 'ALL' ||
    selectedRevenueTier !== 'ALL' ||
    sortBy !== 'REVENUE_DESC';

  // Filter & Sort Services
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        // Search term
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (s.serviceName || '').toLowerCase().includes(term) ||
          (s.serviceCode || '').toLowerCase().includes(term) ||
          (s.categoryName || '').toLowerCase().includes(term);

        if (!matchesSearch) return false;

        // Category filter
        if (selectedCategory !== 'ALL' && s.category !== selectedCategory) {
          return false;
        }

        // Usage status
        const count = Number(s.usageCount) || 0;
        if (selectedUsageStatus === 'USED' && count <= 0) return false;
        if (selectedUsageStatus === 'UNUSED' && count > 0) return false;

        // Price Tier
        const price = Number(s.basePrice) || 0;
        if (selectedPriceTier === 'UNDER_1M' && price >= 1000000) return false;
        if (selectedPriceTier === 'FROM_1M_TO_3M' && (price < 1000000 || price > 3000000))
          return false;
        if (selectedPriceTier === 'FROM_3M_TO_5M' && (price < 3000000 || price > 5000000))
          return false;
        if (selectedPriceTier === 'OVER_5M' && price <= 5000000) return false;

        // Revenue Tier
        const rev = Number(s.totalRevenue) || 0;
        if (selectedRevenueTier === 'HAS_REVENUE' && rev <= 0) return false;
        if (selectedRevenueTier === 'OVER_5M' && rev < 5000000) return false;

        return true;
      })
      .sort((a, b) => {
        const revA = Number(a.totalRevenue) || 0;
        const revB = Number(b.totalRevenue) || 0;
        const countA = Number(a.usageCount) || 0;
        const countB = Number(b.usageCount) || 0;
        const priceA = Number(a.basePrice) || 0;
        const priceB = Number(b.basePrice) || 0;
        const growthA = Number(a.growthPercent) || 0;
        const growthB = Number(b.growthPercent) || 0;

        switch (sortBy) {
          case 'REVENUE_DESC':
            return revB - revA;
          case 'REVENUE_ASC':
            return revA - revB;
          case 'USAGE_DESC':
            return countB - countA;
          case 'PRICE_DESC':
            return priceB - priceA;
          case 'PRICE_ASC':
            return priceA - priceB;
          case 'GROWTH_DESC':
            return growthB - growthA;
          case 'NAME_ASC':
            return (a.serviceName || '').localeCompare(b.serviceName || '');
          default:
            return revB - revA;
        }
      });
  }, [
    services,
    searchTerm,
    selectedCategory,
    selectedUsageStatus,
    selectedPriceTier,
    selectedRevenueTier,
    sortBy,
  ]);

  // Harmonious clinical dental palette
  const dentalPalette = ['#0d9488', '#0284c7', '#06b6d4', '#10b981', '#6366f1', '#8b5cf6'];

  // Sort categories by revenue descending so active categories appear first with primary colors
  const sortedCategories = useMemo(() => {
    return [...(categoryStats || [])].sort(
      (a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0)
    );
  }, [categoryStats]);

  // Donut chart with harmonious dental palette
  const categoryDonutItems = sortedCategories.map((c, i) => ({
    label: c.categoryName,
    value: c.totalRevenue,
    color: dentalPalette[i % dentalPalette.length],
  }));

  const topService = services.length > 0 ? services[0] : null;

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards - Clean, Consistent & Gentle Dental Medical Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Doanh Thu Dịch Vụ */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-teal-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Doanh thu dịch vụ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <Receipt className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalServiceRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs border-t border-slate-100 pt-2">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${
                revenueGrowthPercent >= 0
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {revenueGrowthPercent >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(revenueGrowthPercent)}
            </span>
            <span className="text-slate-500">so với kỳ trước</span>
          </div>
        </div>

        {/* Card 2: Lượt Sử Dụng Dịch Vụ */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng lượt sử dụng
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalUsageCount)}
            </span>
            <span className="text-xs font-medium text-slate-500">lượt thực hiện</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs border-t border-slate-100 pt-2">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${
                usageGrowthPercent >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {usageGrowthPercent >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(usageGrowthPercent)}
            </span>
            <span className="text-slate-500">tần suất chỉ định</span>
          </div>
        </div>

        {/* Card 3: Danh Mục Dịch Vụ */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Danh mục dịch vụ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(activeServicesCount)}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {totalServicesCount} dịch vụ</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Đang niêm yết & vận hành
          </p>
        </div>

        {/* Card 4: Dịch Vụ Hàng Đầu */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-sky-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Dịch vụ hàng đầu
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xs font-bold text-slate-800 truncate" title={topService ? topService.serviceName : ''}>
              {topService ? topService.serviceName : 'Chưa ghi nhận'}
            </p>
            <p className="text-lg font-bold text-teal-700 mt-1">
              {topService ? formatCurrency(topService.totalRevenue) : '0 ₫'}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2">
            Doanh thu dẫn đầu kỳ này
          </p>
        </div>
      </div>

      {/* Dịch vụ sử dụng trong từng tháng & Phân bổ nhóm dịch vụ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Service Trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Dịch vụ được sử dụng trong từng tháng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xu hướng doanh thu dịch vụ theo các tháng trong năm
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 border border-teal-100">
                {monthlyStats.length} tháng ghi nhận
              </span>
            </div>

            <BarTrendChart
              data={monthlyStats}
              xKey="label"
              yKey="revenue"
              isCurrency={true}
              barColor="#0d9488"
              barGradient="linear-gradient(180deg, #2dd4bf 0%, #0d9488 100%)"
              height={220}
            />
          </div>
        </div>

        {/* Phân bổ theo Nhóm danh mục dịch vụ */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Nhóm danh mục dịch vụ
              </h3>
              <Layers className="h-4 w-4 text-teal-600" />
            </div>

            {/* Centered Donut with vertical layout - guaranteed never to overflow horizontally */}
            <div className="flex justify-center py-1">
              <DonutChart
                items={categoryDonutItems}
                isCurrency={true}
                centerTitle="Tổng DV"
                centerValue={formatCurrency(totalServiceRevenue)}
                layout="vertical"
                showLegend={false}
                size={135}
              />
            </div>
          </div>

          {/* Clean Segmented Revenue Breakdown with full width */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Phân bổ nhóm doanh thu
              </span>
              <span className="text-[11px] text-slate-400">
                {sortedCategories.filter((c) => Number(c.totalRevenue) > 0).length} nhóm phát sinh
              </span>
            </div>

            <div className="space-y-2">
              {sortedCategories.slice(0, 4).map((c, idx) => {
                const rev = Number(c.totalRevenue) || 0;
                const pct = totalServiceRevenue > 0 ? (rev / totalServiceRevenue) * 100 : 0;
                const color = dentalPalette[idx % dentalPalette.length];
                const hasRev = rev > 0;
                return (
                  <div
                    key={idx}
                    className={`rounded-lg p-2.5 border transition-colors ${
                      hasRev
                        ? 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-50'
                        : 'bg-slate-50/40 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-700 truncate text-[11px]">
                          {c.categoryName}
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-[11px]">
                          {formatCurrency(rev)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({pct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${hasRev ? Math.min(Math.max(pct, 2), 100) : 0}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết từng dịch vụ Table Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Top Control Bar: Search + Quick Category + Filter Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bảng chi tiết dịch vụ trong kỳ
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi lượt dùng, doanh thu và tỉ lệ tăng giảm so với kỳ trước trong {periodLabel}
              </p>
            </div>

            {/* Search and Advanced Filters Trigger */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative w-full sm:w-64 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên hoặc mã dịch vụ..."
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
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                  showFilters || hasActiveFilters
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
            <div className="mt-4 pt-4 border-t border-slate-100 bg-teal-50/30 p-3 rounded-md border border-teal-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
              {/* Filter 1: Category */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nhóm chuyên khoa nha khoa
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {categoryStats.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Usage Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Trạng thái thực hiện
                </label>
                <select
                  value={selectedUsageStatus}
                  onChange={(e) => setSelectedUsageStatus(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="USED">Đã phát sinh lượt dùng (&gt; 0)</option>
                  <option value="UNUSED">Chưa phát sinh lượt dùng</option>
                </select>
              </div>

              {/* Filter 3: Price Range */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phân khúc đơn giá niêm yết
                </label>
                <select
                  value={selectedPriceTier}
                  onChange={(e) => setSelectedPriceTier(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả mức giá</option>
                  <option value="UNDER_1M">Dưới 1 triệu (Chăm sóc cơ bản)</option>
                  <option value="FROM_1M_TO_3M">1 - 3 triệu (Điều trị chuyên khoa)</option>
                  <option value="FROM_3M_TO_5M">3 - 5 triệu (Phục hình thẩm mỹ)</option>
                  <option value="OVER_5M">Trên 5 triệu (Kỹ thuật cao / Implant)</option>
                </select>
              </div>

              {/* Filter 4: Sort By */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sắp xếp kết quả
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="REVENUE_DESC">Doanh thu: Cao nhất</option>
                  <option value="REVENUE_ASC">Doanh thu: Thấp nhất</option>
                  <option value="USAGE_DESC">Lượt sử dụng: Nhiều nhất</option>
                  <option value="PRICE_DESC">Đơn giá: Cao nhất</option>
                  <option value="PRICE_ASC">Đơn giá: Thấp nhất</option>
                  <option value="GROWTH_DESC">Tăng trưởng: Cao nhất</option>
                  <option value="NAME_ASC">Tên dịch vụ: A - Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Summary count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span>Đang hiển thị:</span>
              <span className="font-semibold text-slate-800">
                {filteredServices.length} / {services.length} dịch vụ
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
                <th className="px-4 py-3">Tên dịch vụ</th>
                <th className="px-4 py-3">Mã & Danh mục</th>
                <th className="px-4 py-3">Đơn vị</th>
                <th className="px-4 py-3">Đơn giá niêm yết</th>
                <th className="px-4 py-3 text-center">Lượt sử dụng</th>
                <th className="px-4 py-3 text-right">Doanh thu trong kỳ</th>
                <th className="px-4 py-3 text-right">Doanh thu kỳ trước</th>
                <th className="px-4 py-3 text-center">Tăng / Giảm (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Sparkles className="h-6 w-6 text-slate-300" />
                      <p className="font-medium text-slate-500">
                        Không tìm thấy dịch vụ nào phù hợp với bộ lọc hiện tại
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-1 text-xs text-teal-700 font-semibold underline hover:text-teal-900"
                      >
                        Xóa bộ lọc để xem toàn bộ danh mục
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv, idx) => {
                  const isPositive = srv.growthPercent >= 0;
                  const isUsed = Number(srv.usageCount) > 0;

                  return (
                    <tr
                      key={srv.serviceId || idx}
                      className={`hover:bg-teal-50/30 transition-colors ${
                        isUsed ? 'bg-teal-50/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">{srv.serviceName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-500 text-[11px] block">
                          {srv.serviceCode || '-'}
                        </span>
                        <span className="text-[11px] text-teal-800 font-medium">
                          {srv.categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{srv.unit || 'Lần'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {formatCurrency(srv.basePrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                            isUsed
                              ? 'bg-teal-50 text-teal-800 border border-teal-200/70'
                              : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {formatNumber(srv.usageCount)} lượt
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-bold ${
                            isUsed ? 'text-teal-900' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(srv.totalRevenue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 font-medium">
                        {formatCurrency(srv.prevPeriodRevenue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-semibold border ${
                            isPositive
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatPercent(srv.growthPercent)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary of the filtered services */}
        <div className="px-5 py-3 bg-teal-50/30 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            <span>
              Tổng doanh thu dịch vụ lọc được:{' '}
              <strong className="text-teal-900">
                {formatCurrency(
                  filteredServices.reduce(
                    (sum, s) => sum + (Number(s.totalRevenue) || 0),
                    0
                  )
                )}
              </strong>{' '}
              (
              {filteredServices.reduce(
                (sum, s) => sum + (Number(s.usageCount) || 0),
                0
              )}{' '}
              lượt thực hiện)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
