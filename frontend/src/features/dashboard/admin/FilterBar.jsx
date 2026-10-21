import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  CalendarDays,
  Check,
  X,
} from 'lucide-react';
import { ToothIcon } from './OverviewTab';

export default function FilterBar({
  filter,
  onChange,
  onRefresh,
  loading = false,
  periodLabel = '',
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // Đồng hồ hệ thống chạy thời gian thực liên tục từng giây (không icon)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentType = filter.filterType || 'YEAR';
  const currentYear = filter.year || 2026;
  const currentMonth = filter.month || 10;
  const currentQuarter = filter.quarter || 4;

  // Năm hiện hành cao nhất (không hiển thị năm tương lai)
  const CURRENT_MAX_YEAR = 2026;

  // Dải năm phong phú chỉ từ quá khứ đến năm hiện hành 2026
  const yearScrollRef = useRef(null);
  const availableYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  const scrollYears = (direction) => {
    if (yearScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      yearScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Tự động cuộn đến năm đang chọn khi mở hoặc thay đổi
  useEffect(() => {
    if (currentType === 'YEAR' && yearScrollRef.current) {
      const selectedBtn = yearScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentType, currentYear]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    if (onRefresh) onRefresh();
  };

  // 7 chế độ xem phân tích (Segmented View Modes) - dàn đều 100% chiều ngang
  const viewModes = [
    { type: 'YEAR', label: 'Theo Năm' },
    { type: 'QUARTER', label: 'Theo Quý' },
    { type: 'MONTH', label: 'Theo Tháng' },
    { type: 'LAST_7_DAYS', label: '7 Ngày Qua' },
    { type: 'LAST_30_DAYS', label: '30 Ngày Qua' },
    { type: 'TODAY', label: 'Hôm Nay' },
    { type: 'CUSTOM', label: 'Khoảng Ngày' },
  ];

  // Smart Presets (Chu kỳ nhanh phổ biến)
  const quickPresets = [
    { label: 'Năm 2026', filterType: 'YEAR', year: 2026 },
    { label: 'Quý 4/2026', filterType: 'QUARTER', year: 2026, quarter: 4 },
    { label: 'Quý 3/2026', filterType: 'QUARTER', year: 2026, quarter: 3 },
    { label: 'Tháng 10/2026', filterType: 'MONTH', year: 2026, month: 10 },
    { label: 'Tháng 9/2026', filterType: 'MONTH', year: 2026, month: 9 },
    { label: 'Tháng 7/2026', filterType: 'MONTH', year: 2026, month: 7 },
    { label: '7 ngày qua', filterType: 'LAST_7_DAYS', year: 2026 },
    { label: '30 ngày qua', filterType: 'LAST_30_DAYS', year: 2026 },
  ];

  // Điều hướng chu kỳ 1-chạm (Stepper: Previous / Next) - Chặn năm tương lai
  const handleStepPeriod = (direction) => {
    const delta = direction === 'next' ? 1 : -1;

    if (currentType === 'YEAR') {
      const newYear = currentYear + delta;
      if (newYear > CURRENT_MAX_YEAR) return; // Không cho phép chọn năm tương lai
      onChange({ ...filter, year: newYear });
    } else if (currentType === 'QUARTER') {
      let newQ = currentQuarter + delta;
      let newY = currentYear;
      if (newQ > 4) {
        newQ = 1;
        newY += 1;
      } else if (newQ < 1) {
        newQ = 4;
        newY -= 1;
      }
      if (newY > CURRENT_MAX_YEAR) return; // Không cho phép sang năm tương lai
      onChange({ ...filter, quarter: newQ, year: newY });
    } else if (currentType === 'MONTH') {
      let newM = currentMonth + delta;
      let newY = currentYear;
      if (newM > 12) {
        newM = 1;
        newY += 1;
      } else if (newM < 1) {
        newM = 12;
        newY -= 1;
      }
      if (newY > CURRENT_MAX_YEAR) return; // Không cho phép sang năm tương lai
      onChange({ ...filter, month: newM, year: newY });
    } else if (currentType === 'DAY' || currentType === 'TODAY') {
      const baseDate = filter.date ? new Date(filter.date) : new Date(2026, 9, 20);
      baseDate.setDate(baseDate.getDate() + delta);
      const iso = baseDate.toISOString().slice(0, 10);
      onChange({ ...filter, filterType: 'DAY', date: iso });
    }
  };

  // Tính số ngày của khoảng ngày tùy chọn
  const customDaysCount = useMemo(() => {
    if (currentType !== 'CUSTOM' || !filter.startDate || !filter.endDate) return null;
    const s = new Date(filter.startDate);
    const e = new Date(filter.endDate);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [currentType, filter.startDate, filter.endDate]);

  // Kiểm tra xem bộ lọc có khác mặc định (Năm 2026) không
  const isFiltered = currentType !== 'YEAR' || currentYear !== 2026 || Boolean(filter.branchId);

  // Nhãn mô tả điều hướng
  const getStepperLabel = () => {
    if (currentType === 'YEAR') return `Năm ${currentYear}`;
    if (currentType === 'QUARTER') return `Quý ${currentQuarter}/${currentYear}`;
    if (currentType === 'MONTH') return `Tháng ${currentMonth}/${currentYear}`;
    if (currentType === 'DAY' || currentType === 'TODAY') return filter.date || 'Hôm nay';
    if (currentType === 'LAST_7_DAYS') return '7 ngày gần nhất';
    if (currentType === 'LAST_30_DAYS') return '30 ngày gần nhất';
    if (currentType === 'CUSTOM') return `${filter.startDate || '...'} → ${filter.endDate || '...'}`;
    return periodLabel || 'Năm 2026';
  };

  const isStepperDisabled = currentType === 'CUSTOM' || currentType === 'LAST_7_DAYS' || currentType === 'LAST_30_DAYS';
  const isNextDisabled =
    isStepperDisabled ||
    (currentType === 'YEAR' && currentYear >= CURRENT_MAX_YEAR) ||
    (currentType === 'QUARTER' && currentYear >= CURRENT_MAX_YEAR && currentQuarter >= 4) ||
    (currentType === 'MONTH' && currentYear >= CURRENT_MAX_YEAR && currentMonth >= 12);

  return (
    <div className="rounded-lg border border-cyan-100/90 bg-white p-4 shadow-2xs transition-all">
      {/* 1. Header Row: Tiêu đề, Live Clock, Stepper điều hướng & Nút thao tác */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-slate-100">
        {/* Left: Tên bộ điều hành & Chu kỳ hiện hành */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-2xs">
            <ToothIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Trung Tâm Điều Hành Dữ Liệu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800 border border-cyan-200 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                {periodLabel || 'Năm 2026'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Đồng bộ dữ liệu tức thì theo thời gian thực &middot; Chuẩn y khoa Crown Dental
            </p>
          </div>
        </div>

        {/* Right: Đồng hồ chạy trực tiếp (Live Clock) + Stepper + Nút hành động */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* Live Clock: Chạy từng giây liên tục, không icon */}
          <div className="hidden sm:flex items-center rounded-md bg-slate-50 px-2.5 py-1 border border-slate-200/80 text-[11px] text-slate-600 font-medium">
            <span>
              Thời gian: <strong className="text-slate-800 font-mono text-xs font-bold">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </span>
          </div>

          {/* Quick Stepper: [<] [Kỳ hiện tại] [>] */}
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={isStepperDisabled}
              onClick={() => handleStepPeriod('prev')}
              title="Chuyển về kỳ trước"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-cyan-700 hover:shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2.5 text-xs font-bold text-slate-800 whitespace-nowrap min-w-[100px] text-center">
              {getStepperLabel()}
            </span>

            <button
              type="button"
              disabled={isNextDisabled}
              onClick={() => handleStepPeriod('next')}
              title={isNextDisabled ? 'Đã ở chu kỳ mới nhất' : 'Chuyển sang kỳ kế tiếp'}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-cyan-700 hover:shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle Nâng Cao Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              showAdvanced
                ? 'bg-cyan-700 text-white shadow-cyan-700/20'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Tùy chỉnh</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showAdvanced ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-cyan-700 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* 2. Main Row: 7 Chế Độ Lọc Dàn Đều 100% Chiều Ngang (Cân đối, đầy đặn, không bị trống) */}
      <div className="mt-3 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 w-full bg-slate-100/90 p-1.5 rounded-lg border border-slate-200/70 shadow-2xs">
          {viewModes.map((m) => {
            const active = currentType === m.type;
            return (
              <button
                key={m.type}
                type="button"
                onClick={() => {
                  onChange({
                    ...filter,
                    filterType: m.type,
                    year: filter.year || 2026,
                    month: filter.month || 10,
                    quarter: filter.quarter || 4,
                  });
                }}
                className={`w-full text-center py-2 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-cyan-800 shadow-xs ring-1 ring-cyan-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Selector Row: Xổ Xuống Trực Quan Theo Chế Độ Đang Chọn (Đầy đặn & cân đối 100%) */}
      {/* 3.1 Nếu chọn Theo Tháng: 12 Tháng dàn đều 12 cột */}
      {currentType === 'MONTH' && (
        <div className="mt-2.5 w-full rounded-lg bg-slate-50/90 border border-cyan-100/80 p-2.5 flex flex-col md:flex-row items-center gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 self-start md:self-center whitespace-nowrap">
            <span className="text-xs font-semibold text-slate-600">Năm:</span>
            <select
              value={currentYear}
              onChange={(e) => onChange({ ...filter, year: parseInt(e.target.value) })}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:border-cyan-600 focus:outline-none cursor-pointer"
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                <option key={y} value={y}>Năm {y} {y === 2026 ? '(Hiện hành)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 w-full flex-1">
            {[...Array(12)].map((_, i) => {
              const m = i + 1;
              const isSelected = currentMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ ...filter, month: m })}
                  className={`w-full py-1.5 text-center text-xs font-semibold rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold shadow-2xs ring-1 ring-cyan-600'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-cyan-50 hover:text-cyan-800'
                  }`}
                >
                  T{m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3.2 Nếu chọn Theo Quý: 4 Quý dàn đều 4 cột */}
      {currentType === 'QUARTER' && (
        <div className="mt-2.5 w-full rounded-lg bg-slate-50/90 border border-cyan-100/80 p-2.5 flex flex-col md:flex-row items-center gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 self-start md:self-center whitespace-nowrap">
            <span className="text-xs font-semibold text-slate-600">Năm:</span>
            <select
              value={currentYear}
              onChange={(e) => onChange({ ...filter, year: parseInt(e.target.value) })}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:border-cyan-600 focus:outline-none cursor-pointer"
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                <option key={y} value={y}>Năm {y} {y === 2026 ? '(Hiện hành)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full flex-1">
            {[
              { q: 1, label: 'Quý 1', sub: 'Tháng 1 - Tháng 3' },
              { q: 2, label: 'Quý 2', sub: 'Tháng 4 - Tháng 6' },
              { q: 3, label: 'Quý 3', sub: 'Tháng 7 - Tháng 9' },
              { q: 4, label: 'Quý 4', sub: 'Tháng 10 - Tháng 12' },
            ].map((item) => (
              <button
                key={item.q}
                type="button"
                onClick={() => onChange({ ...filter, quarter: item.q })}
                className={`w-full py-1.5 px-2 text-center rounded transition-all cursor-pointer ${
                  currentQuarter === item.q
                    ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-cyan-50 hover:text-cyan-800'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] ml-1.5 ${currentQuarter === item.q ? 'text-cyan-100' : 'text-slate-400'}`}>
                  ({item.sub})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3.3 Nếu chọn Theo Năm: Dải lướt ngang các năm phong phú & linh hoạt (Horizontal Scroll Carousel) */}
      {currentType === 'YEAR' && (
        <div className="mt-2.5 w-full rounded-lg bg-slate-50/90 border border-cyan-100/80 p-2 flex items-center gap-1.5 animate-in fade-in duration-150">
          {/* Nút lướt sang trái */}
          <button
            type="button"
            onClick={() => scrollYears('left')}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-800 shadow-2xs transition-colors cursor-pointer"
            title="Lướt về các năm trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dải trượt ngang các năm: Vuốt chạm hoặc click mượt mà */}
          <div
            ref={yearScrollRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-thin py-1 px-1"
          >
            {availableYears.map((y) => {
              const isSelected = currentYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => onChange({ ...filter, year: y })}
                  className={`whitespace-nowrap px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold shadow-2xs ring-1 ring-cyan-600'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-cyan-50 hover:text-cyan-800'
                  }`}
                >
                  Năm {y} {y === 2026 && '(Hiện hành)'}
                </button>
              );
            })}
          </div>

          {/* Nút lướt sang phải */}
          <button
            type="button"
            onClick={() => scrollYears('right')}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-800 shadow-2xs transition-colors cursor-pointer"
            title="Lướt về các năm sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Bộ chọn dropdown nhanh nếu muốn chọn năm xa hơn */}
          <div className="shrink-0 pl-1.5 border-l border-slate-200 flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Khác:</span>
            <select
              value={currentYear}
              onChange={(e) => onChange({ ...filter, year: parseInt(e.target.value) })}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:border-cyan-600 focus:outline-none cursor-pointer"
              title="Chọn năm cụ thể"
            >
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
                <option key={y} value={y}>
                  Năm {y} {y === 2026 ? '(Hiện hành)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3.4 Nếu chọn Khoảng Ngày Tùy Chọn */}
      {currentType === 'CUSTOM' && (
        <div className="mt-2.5 w-full rounded-lg bg-slate-50/90 border border-cyan-100/80 p-2.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Từ ngày:
              </label>
              <input
                type="date"
                value={filter.startDate || '2026-10-01'}
                onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-cyan-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Đến ngày:
              </label>
              <input
                type="date"
                value={filter.endDate || '2026-10-31'}
                onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-cyan-600 focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <span className="text-xs text-slate-500 mb-1">
                Số ngày chu kỳ: <strong className="text-cyan-800">{customDaysCount || 0} ngày</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...filter,
                      startDate: '2026-10-01',
                      endDate: '2026-10-31',
                    })
                  }
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-50 shadow-2xs"
                >
                  Trọn Tháng 10
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...filter,
                      startDate: '2026-01-01',
                      endDate: '2026-12-31',
                    })
                  }
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-50 shadow-2xs"
                >
                  Cả Năm 2026
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 Nếu chọn Hôm Nay / 7 Ngày / 30 Ngày */}
      {(currentType === 'TODAY' || currentType === 'LAST_7_DAYS' || currentType === 'LAST_30_DAYS') && (
        <div className="mt-2.5 w-full rounded-lg bg-slate-50/90 border border-cyan-100/80 px-3 py-2 text-xs text-slate-600 flex items-center justify-between animate-in fade-in duration-150">
          <span>
            Hệ thống đang thống kê tự động: <strong className="text-slate-800">{getStepperLabel()}</strong>
          </span>
          <span className="text-[11px] text-cyan-700 font-medium">
            Tự động làm mới theo chu kỳ dữ liệu
          </span>
        </div>
      )}

      {/* 4. Collapsible Advanced Clinical Filter Drawer (Bảng Điều Khiển Nâng Cao Đa Chiều) */}
      {showAdvanced && (
        <div className="mt-3.5 rounded-lg border border-cyan-100 bg-slate-50/60 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header of Advanced Drawer */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Thiết Lập Bộ Lọc Nâng Cao
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Thu gọn
            </button>
          </div>

          {/* Section A: Khoảng thời gian nhanh (Clinical Smart Presets) */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 block mb-2">
              Chọn nhanh chu kỳ phổ biến:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p, idx) => {
                const isActive =
                  p.filterType === currentType &&
                  (!p.year || p.year === currentYear) &&
                  (!p.month || p.month === currentMonth) &&
                  (!p.quarter || p.quarter === currentQuarter);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...filter,
                        filterType: p.filterType,
                        year: p.year || currentYear,
                        month: p.month || currentMonth,
                        quarter: p.quarter || currentQuarter,
                      });
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-2xs font-bold ring-1 ring-cyan-600'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Phạm vi Cơ sở & Chi nhánh phòng khám */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-200/70">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-700" />
              <span className="text-xs font-semibold text-slate-700">Phạm vi cơ sở:</span>
              <select
                value={filter.branchId || ''}
                onChange={(e) => onChange({ ...filter, branchId: e.target.value || null })}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-cyan-600 focus:outline-none cursor-pointer"
              >
                <option value="">Toàn hệ thống (Crown Dental Central)</option>
                <option value="BRANCH_Q1">Cơ sở 1 - Trung tâm Nha khoa Quốc Tế</option>
                <option value="BRANCH_BT">Cơ sở 2 - Nha khoa Thẩm mỹ Công nghệ cao</option>
              </select>
            </div>

            {/* Action Buttons inside Drawer */}
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    filterType: 'YEAR',
                    year: 2026,
                    month: 10,
                    quarter: 4,
                    branchId: null,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 text-slate-400" />
                <span>Đặt lại mặc định</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdvanced(false);
                  handleRefresh();
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-cyan-700 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Áp dụng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Active Filters Status Summary Strip (Thanh hiển thị nhanh bộ lọc đang kích hoạt - không icon/emoji) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Đang áp dụng:</span>
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
            {getStepperLabel()}
          </span>
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
            {filter.branchId ? 'Chi nhánh đã chọn' : 'Toàn hệ thống'}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  filterType: 'YEAR',
                  year: 2026,
                  month: 10,
                  quarter: 4,
                  branchId: null,
                })
              }
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer ml-1"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Đặt lại Năm 2026
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Tự động chuẩn hóa dữ liệu tài chính & điều trị
        </div>
      </div>
    </div>
  );
}
