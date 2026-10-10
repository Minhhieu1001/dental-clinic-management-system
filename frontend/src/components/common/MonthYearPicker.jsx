import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const MONTH_SHORT = [
  'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4',
  'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8',
  'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
];

/**
 * MonthYearPicker - Bộ lọc Năm & Tháng hiện đại chuẩn ERP, hỗ trợ duyệt năm vô hạn.
 * 
 * Props:
 * - selectedYear: string | number ('ALL' hoặc '2026')
 * - selectedMonth: string | number ('ALL' hoặc '01'..'12')
 * - onYearChange: (year: string) => void
 * - onMonthChange: (month: string) => void
 * - onChange: ({ year: string, month: string }) => void (tùy chọn)
 * - allowAllYears: boolean (mặc định true)
 * - allowAllMonths: boolean (mặc định true)
 * - align: 'left' | 'right' (căn lề dropdown, mặc định 'left')
 * - placeholder: string
 */
export default function MonthYearPicker({
  selectedYear = 'ALL',
  selectedMonth = 'ALL',
  onYearChange,
  onMonthChange,
  onChange,
  allowAllYears = true,
  allowAllMonths = true,
  align = 'right',
  placeholder = 'Chọn thời gian',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('months'); // 'months' | 'years'

  const currentRealYear = new Date().getFullYear();
  const currentRealMonth = new Date().getMonth() + 1;

  // Năm đang được focus hiển thị trên header bộ chọn
  const [navYear, setNavYear] = useState(() => {
    if (selectedYear && selectedYear !== 'ALL') {
      const parsed = parseInt(selectedYear, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return currentRealYear;
  });

  // Khi selectedYear thay đổi từ ngoài, cập nhật navYear nếu hợp lệ
  useEffect(() => {
    if (selectedYear && selectedYear !== 'ALL') {
      const parsed = parseInt(selectedYear, 10);
      if (!isNaN(parsed)) setNavYear(parsed);
    }
  }, [selectedYear]);

  const containerRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode('months');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Decade calculation (12 năm một trang)
  const decadeStart = Math.floor(navYear / 12) * 12;
  const yearsInDecade = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  const handleSelectYear = (year) => {
    const yearVal = String(year);
    if (onYearChange) onYearChange(yearVal);
    if (onChange) {
      onChange({
        year: yearVal,
        month: selectedMonth,
      });
    }
    setNavYear(typeof year === 'number' ? year : currentRealYear);
    setViewMode('months');
  };

  const handleSelectMonth = (monthVal) => {
    if (onMonthChange) onMonthChange(monthVal);
    // Nếu chưa chọn năm mà bấm chọn tháng, tự động lấy năm đang duyệt (navYear)
    let yearVal = selectedYear;
    if (selectedYear === 'ALL' && monthVal !== 'ALL') {
      yearVal = String(navYear);
      if (onYearChange) onYearChange(yearVal);
    }
    if (onChange) {
      onChange({
        year: yearVal,
        month: monthVal,
      });
    }
  };

  const handleResetAll = () => {
    if (onYearChange) onYearChange('ALL');
    if (onMonthChange) onMonthChange('ALL');
    if (onChange) {
      onChange({ year: 'ALL', month: 'ALL' });
    }
    setNavYear(currentRealYear);
    setViewMode('months');
  };

  const handleSelectCurrent = () => {
    const yStr = String(currentRealYear);
    const mStr = String(currentRealMonth).padStart(2, '0');
    if (onYearChange) onYearChange(yStr);
    if (onMonthChange) onMonthChange(mStr);
    if (onChange) {
      onChange({ year: yStr, month: mStr });
    }
    setNavYear(currentRealYear);
    setViewMode('months');
  };

  // Label hiển thị trên nút Trigger
  const getDisplayText = () => {
    const isAllYear = selectedYear === 'ALL' || !selectedYear;
    const isAllMonth = selectedMonth === 'ALL' || !selectedMonth;

    if (isAllYear && isAllMonth) {
      return 'Tất cả thời gian';
    }
    if (!isAllYear && isAllMonth) {
      return `Năm ${selectedYear}`;
    }
    if (isAllYear && !isAllMonth) {
      const mNum = parseInt(selectedMonth, 10);
      return `Tháng ${mNum} (Mọi năm)`;
    }
    const mNum = parseInt(selectedMonth, 10);
    return `T${mNum}/${selectedYear}`;
  };

  const hasFilter = (selectedYear && selectedYear !== 'ALL') || (selectedMonth && selectedMonth !== 'ALL');

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all shadow-2xs ${hasFilter
            ? 'bg-teal-50/80 border-teal-300 text-teal-800 hover:bg-teal-100/80'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            } focus:outline-none focus:ring-2 focus:ring-teal-700/20`}
        >
          <Calendar size={14} className={hasFilter ? 'text-teal-700' : 'text-slate-400'} />
          <span className="font-medium">{getDisplayText()}</span>
          {hasFilter && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleResetAll();
              }}
              title="Xóa lọc thời gian"
              className="ml-0.5 p-0.5 rounded-full hover:bg-teal-200/60 text-teal-700 hover:text-teal-900 transition-colors"
            >
              <X size={12} />
            </span>
          )}
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 animate-in fade-in zoom-in-95 duration-150 ${align === 'right' ? 'right-0' : 'left-0'
            }`}
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            {viewMode === 'months' ? (
              <>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setNavYear((prev) => prev - 10)}
                    title="Lùi 10 năm"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavYear((prev) => prev - 1)}
                    title="Năm trước"
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>

                {/* Switch to Year Grid View */}
                <button
                  type="button"
                  onClick={() => setViewMode('years')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors flex items-center gap-1 group"
                >
                  <span>Năm {navYear}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-teal-600 font-normal"></span>
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setNavYear((prev) => prev + 1)}
                    title="Năm sau"
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavYear((prev) => prev + 10)}
                    title="Tiến 10 năm"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              /* Header for Year Decades View */
              <>
                <button
                  type="button"
                  onClick={() => setNavYear((prev) => prev - 12)}
                  title="12 năm trước"
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-800">
                  {decadeStart} – {decadeStart + 11}
                </span>
                <button
                  type="button"
                  onClick={() => setNavYear((prev) => prev + 12)}
                  title="12 năm sau"
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Body Content */}
          {viewMode === 'years' ? (
            /* 12-Year Grid View (Duyệt năm vô hạn) */
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {yearsInDecade.map((yr) => {
                  const isSelected = String(selectedYear) === String(yr);
                  const isCurrent = yr === currentRealYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectYear(yr)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all ${isSelected
                        ? 'bg-teal-700 text-white shadow-xs'
                        : isCurrent
                          ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setViewMode('months')}
                className="w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                ← Quay lại chọn tháng
              </button>
            </div>
          ) : (
            /* Month Selection Grid */
            <div className="space-y-2.5">
              {/* Year quick actions (Tất cả năm / Chọn cả năm này) */}
              <div className="flex items-center gap-1.5">
                {allowAllYears && (
                  <button
                    type="button"
                    onClick={() => handleSelectYear('ALL')}
                    className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-all border ${selectedYear === 'ALL'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    Tất cả năm
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectYear(navYear);
                    handleSelectMonth('ALL');
                  }}
                  className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-all border ${String(selectedYear) === String(navYear) && selectedMonth === 'ALL'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  Cả năm {navYear}
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_NAMES.map((name, idx) => {
                  const mStr = (idx + 1).toString().padStart(2, '0');
                  const isSelected =
                    selectedMonth === mStr &&
                    (selectedYear === 'ALL' || String(selectedYear) === String(navYear));
                  const isCurrent =
                    idx + 1 === currentRealMonth && navYear === currentRealYear;

                  return (
                    <button
                      key={mStr}
                      type="button"
                      onClick={() => {
                        // Tự động gán năm đang xem nếu chưa chọn năm
                        if (selectedYear !== String(navYear)) {
                          handleSelectYear(navYear);
                        }
                        handleSelectMonth(mStr);
                      }}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center ${isSelected
                        ? 'bg-teal-700 text-white shadow-xs font-bold'
                        : isCurrent
                          ? 'bg-teal-50 text-teal-800 border border-teal-300 font-bold hover:bg-teal-100'
                          : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {MONTH_SHORT[idx]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Quick Presets */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectCurrent}
              className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
            >
              <Sparkles size={11} />
              Tháng này ({currentRealMonth}/{currentRealYear})
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={11} />
              Đặt lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
