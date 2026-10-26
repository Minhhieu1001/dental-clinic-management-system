import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
  Sparkles,
  User,
} from 'lucide-react';
import { formatNumber, formatPercent } from './dashboardUtils';
import { AreaTrendChart, DonutChart } from './Charts';

export default function AppointmentSection({ data, loading }) {
  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('ALL');
  const [workloadFilter, setWorkloadFilter] = useState('ALL');
  const [cancellationFilter, setCancellationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('TOTAL_DESC');
  const [showFilters, setShowFilters] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500">
        <Activity className="h-6 w-6 animate-pulse text-teal-600" />
        <span className="text-xs font-semibold">Đang tải dữ liệu lịch hẹn nha khoa...</span>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalAppointments = 0,
    completedAppointments = 0,
    cancelledAppointments = 0,
    confirmedAppointments = 0,
    waitingAppointments = 0,
    inProgressAppointments = 0,
    completionRate = 0,
    cancellationRate = 0,
    totalGrowthRate = 0,
    statusBreakdown = [],
    trend = [],
    doctorStats = [],
    periodLabel = '',
  } = data;

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setPerformanceFilter('ALL');
    setWorkloadFilter('ALL');
    setCancellationFilter('ALL');
    setSortBy('TOTAL_DESC');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    performanceFilter !== 'ALL' ||
    workloadFilter !== 'ALL' ||
    cancellationFilter !== 'ALL' ||
    sortBy !== 'TOTAL_DESC';

  // Filter & Sort Doctor Stats
  const filteredDoctors = useMemo(() => {
    return doctorStats
      .filter((doc) => {
        // Search by doctor name
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term || (doc.doctorName || '').toLowerCase().includes(term);
        if (!matchesSearch) return false;

        const total = Number(doc.total) || 0;
        const comp = Number(doc.completed) || 0;
        const canc = Number(doc.cancelled) || 0;
        const rate = total > 0 ? Math.round((comp / total) * 100) : 0;

        // Performance Filter
        if (performanceFilter === 'HIGH_RATE' && rate < 50) return false;
        if (performanceFilter === 'LOW_RATE' && (rate >= 50 || total === 0)) return false;
        if (performanceFilter === 'HAS_COMPLETED' && comp <= 0) return false;

        // Workload Filter
        if (workloadFilter === 'HIGH_LOAD' && total < 5) return false;
        if (workloadFilter === 'LIGHT_LOAD' && total >= 5) return false;

        // Cancellation Filter
        if (cancellationFilter === 'NO_CANCEL' && canc > 0) return false;
        if (cancellationFilter === 'HAS_CANCEL' && canc <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        const totalA = Number(a.total) || 0;
        const totalB = Number(b.total) || 0;
        const compA = Number(a.completed) || 0;
        const compB = Number(b.completed) || 0;
        const cancA = Number(a.cancelled) || 0;
        const cancB = Number(b.cancelled) || 0;
        const rateA = totalA > 0 ? compA / totalA : 0;
        const rateB = totalB > 0 ? compB / totalB : 0;

        switch (sortBy) {
          case 'TOTAL_DESC':
            return totalB - totalA;
          case 'COMPLETED_DESC':
            return compB - compA;
          case 'RATE_DESC':
            return rateB - rateA;
          case 'CANCEL_ASC':
            return cancA - cancB;
          case 'CANCEL_DESC':
            return cancB - cancA;
          case 'NAME_ASC':
            return (a.doctorName || '').localeCompare(b.doctorName || '');
          default:
            return totalB - totalA;
        }
      });
  }, [doctorStats, searchTerm, performanceFilter, workloadFilter, cancellationFilter, sortBy]);

  const statusColors = {
    CONFIRMED: '#0d9488',
    COMPLETED: '#10b981',
    CANCELLED: '#f43f5e',
    IN_PROGRESS: '#6366f1',
    WAITING: '#f59e0b',
    PENDING: '#a855f7',
  };

  const donutItems = (statusBreakdown || []).map((s) => ({
    label: s.statusName,
    value: s.count,
    color: statusColors[s.status] || '#94a3b8',
  }));

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards - Clean, Consistent & Gentle Dental Medical Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng số lịch hẹn */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-teal-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tổng số lịch hẹn
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <CalendarCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(totalAppointments)}
            </span>
            <span className="text-xs font-medium text-slate-500">lượt hẹn</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs border-t border-slate-100 pt-2">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold ${
                totalGrowthRate >= 0
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {totalGrowthRate >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(totalGrowthRate)}
            </span>
            <span className="text-slate-500">so với kỳ trước</span>
          </div>
        </div>

        {/* Card 2: Lịch hoàn thành */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Lịch khám hoàn thành
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(completedAppointments)}
            </span>
            <span className="text-xs font-medium text-slate-500">ca khám</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-500">
            <span>Tỉ lệ hoàn thành:</span>
            <span className="font-bold text-emerald-700 text-sm">{completionRate}%</span>
          </div>
        </div>

        {/* Card 3: Lịch bị hủy */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Lịch bị hủy
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <XCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(cancelledAppointments)}
            </span>
            <span className="text-xs font-medium text-slate-500">lịch hủy</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-500">
            <span>Tỉ lệ hủy hẹn:</span>
            <span className="font-bold text-rose-600 text-sm">{cancellationRate}%</span>
          </div>
        </div>

        {/* Card 4: Đã xác nhận & Đang chờ */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition-all hover:border-sky-200 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Đã xác nhận & Chờ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatNumber(confirmedAppointments + waitingAppointments)}
            </span>
            <span className="text-xs font-medium text-slate-500">lịch sắp tới</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Đã xác nhận: <strong className="text-slate-700">{confirmedAppointments}</strong> · Chờ: <strong className="text-slate-700">{waitingAppointments}</strong>
          </p>
        </div>
      </div>

      {/* Xu hướng lịch hẹn & Phân bổ trạng thái (Giữ nguyên mô hình theo yêu cầu) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Xu hướng lịch hẹn theo thời gian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tiến độ tiếp nhận, hoàn thành và hủy hẹn trong {periodLabel}
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-100">
                {trend.length} mốc theo dõi
              </span>
            </div>

            <AreaTrendChart
              data={trend}
              series={[
                { key: 'total', label: 'Tổng lịch hẹn', color: '#0d9488', gradientId: 'tealGrad' },
                { key: 'completed', label: 'Hoàn thành', color: '#10b981', gradientId: 'emeraldGrad' },
                { key: 'cancelled', label: 'Đã hủy', color: '#f43f5e', gradientId: 'roseGrad' },
              ]}
              isCurrency={false}
              height={230}
            />
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Phân bổ trạng thái
              </h3>
              <Activity className="h-4 w-4 text-teal-600" />
            </div>

            <div className="py-1">
              <DonutChart
                items={donutItems}
                isCurrency={false}
                centerTitle="Tổng hẹn"
                centerValue={`${totalAppointments} lịch`}
                layout="horizontal"
                size={135}
              />
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="text-slate-500 font-medium">Hiệu suất phục vụ:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {totalAppointments > 0
                  ? `${(((completedAppointments + confirmedAppointments) / totalAppointments) * 100).toFixed(0)}% tích cực`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lịch hẹn theo từng Bác sĩ Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Top Control Bar: Search + Filter Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Lịch hẹn theo từng bác sĩ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Khối lượng tiếp nhận và tỷ lệ ca khám hoàn thành của từng bác sĩ trong {periodLabel}
              </p>
            </div>

            {/* Search and Advanced Filters Trigger */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <div className="relative w-full sm:w-64 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên bác sĩ..."
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
            <div className="mt-4 pt-4 border-t border-slate-100 bg-teal-50/30 p-3 rounded-lg border border-teal-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
              {/* Filter 1: Performance */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hiệu suất hoàn thành
                </label>
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả tỷ lệ</option>
                  <option value="HIGH_RATE">Hiệu suất cao (≥ 50%)</option>
                  <option value="LOW_RATE">Đang điều trị (&lt; 50%)</option>
                  <option value="HAS_COMPLETED">Đã có ca hoàn thành (&gt; 0)</option>
                </select>
              </div>

              {/* Filter 2: Workload */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Khối lượng tiếp nhận
                </label>
                <select
                  value={workloadFilter}
                  onChange={(e) => setWorkloadFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả khối lượng</option>
                  <option value="HIGH_LOAD">Tải ca cao (≥ 5 lịch hẹn)</option>
                  <option value="LIGHT_LOAD">Tải tiêu chuẩn (&lt; 5 lịch hẹn)</option>
                </select>
              </div>

              {/* Filter 3: Cancellation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tình trạng hủy hẹn
                </label>
                <select
                  value={cancellationFilter}
                  onChange={(e) => setCancellationFilter(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tất cả tình trạng</option>
                  <option value="NO_CANCEL">Không có ca hủy (0 hủy)</option>
                  <option value="HAS_CANCEL">Có phát sinh ca hủy (&gt; 0)</option>
                </select>
              </div>

              {/* Filter 4: Sort */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sắp xếp danh sách
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="TOTAL_DESC">Tổng lịch hẹn: Nhiều nhất</option>
                  <option value="COMPLETED_DESC">Ca hoàn thành: Nhiều nhất</option>
                  <option value="RATE_DESC">Tỷ lệ hoàn thành: Cao nhất</option>
                  <option value="CANCEL_ASC">Hủy hẹn: Ít nhất</option>
                  <option value="CANCEL_DESC">Hủy hẹn: Nhiều nhất</option>
                  <option value="NAME_ASC">Tên bác sĩ: A - Z</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Summary count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span>Đang hiển thị:</span>
              <span className="font-semibold text-slate-800">
                {filteredDoctors.length} / {doctorStats.length} bác sĩ
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
                <th className="px-4 py-3">Bác sĩ phụ trách</th>
                <th className="px-4 py-3 text-center">Tổng lịch hẹn</th>
                <th className="px-4 py-3 text-center">Hoàn thành</th>
                <th className="px-4 py-3 text-center">Hủy hẹn</th>
                <th className="px-4 py-3 text-center">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Sparkles className="h-6 w-6 text-slate-300" />
                      <p className="font-medium text-slate-500">
                        Không tìm thấy bác sĩ nào phù hợp với bộ lọc hiện tại
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
                filteredDoctors.map((doc, idx) => {
                  const compRate =
                    doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0;
                  const hasCompleted = Number(doc.completed) > 0;
                  const hasCancelled = Number(doc.cancelled) > 0;

                  return (
                    <tr
                      key={doc.dentistId || idx}
                      className="hover:bg-teal-50/20 transition-colors"
                    >
                      {/* Doctor Name with Avatar badge */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 font-bold text-xs shrink-0 shadow-2xs">
                            {(doc.doctorName || 'BS').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {doc.doctorName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Nha sĩ điều trị
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-800 text-sm">
                          {formatNumber(doc.total)}
                        </span>
                      </td>

                      {/* Completed */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                            hasCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                              : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {formatNumber(doc.completed)}
                        </span>
                      </td>

                      {/* Cancelled */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                            hasCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                              : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {formatNumber(doc.cancelled)}
                        </span>
                      </td>

                      {/* Completion Rate Bar */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 max-w-[130px] mx-auto">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${compRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8 text-right">
                            {compRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary of the filtered doctors */}
        <div className="px-5 py-3 bg-teal-50/30 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            <span>
              Tổng số lịch hẹn lọc được:{' '}
              <strong className="text-teal-900">
                {formatNumber(
                  filteredDoctors.reduce((sum, d) => sum + (Number(d.total) || 0), 0)
                )}
              </strong>{' '}
              · Đã hoàn thành:{' '}
              <strong className="text-emerald-700">
                {formatNumber(
                  filteredDoctors.reduce((sum, d) => sum + (Number(d.completed) || 0), 0)
                )}
              </strong>{' '}
              · Đã hủy:{' '}
              <strong className="text-rose-600">
                {formatNumber(
                  filteredDoctors.reduce((sum, d) => sum + (Number(d.cancelled) || 0), 0)
                )}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
