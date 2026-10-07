import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  MapPin,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function FollowUpCalendarView({
  followUps = [],
  selectedPatient,
  onSelectFollowUp,
  onEditFollowUp,
  onAddNewOnDate,
  isEmployee = false,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate 35 or 42 grid day cells
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is 0, Sunday is 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Trailing days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Trailing days for next month
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Group follow-up appointments by date string "YYYY-MM-DD"
  const followUpsByDate = useMemo(() => {
    const map = {};
    followUps.forEach((item) => {
      if (!item.followUpDate) return;
      const d = new Date(item.followUpDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [followUps]);

  const today = new Date();

  // Statistics for current month view
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let total = 0;
    let confirmed = 0;
    let cancelled = 0;

    followUps.forEach((item) => {
      if (!item.followUpDate) return;
      const d = new Date(item.followUpDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        total++;
        if (item.status !== false) confirmed++;
        else cancelled++;
      }
    });

    return { total, confirmed, cancelled };
  }, [followUps, currentDate]);

  return (
    <div className="bg-white border border-slate-300 rounded-sm shadow-2xs overflow-hidden text-slate-800 text-xs font-sans">
      {/* 1. CALENDAR CONTROLS & HEADER TOOLBAR */}
      <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-sm p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-sm text-slate-700 cursor-pointer transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-0.5 text-xs font-extrabold text-teal-800 hover:bg-teal-50 rounded-sm cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-sm text-slate-700 cursor-pointer transition-colors"
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <CalendarIcon size={18} className="text-teal-700" />
            <span>
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </span>
          </h2>
        </div>

        {/* Monthly Summary Badges */}
        <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
          <span className="px-2.5 py-1 rounded-sm bg-slate-200 text-slate-800 font-extrabold">
            Tổng: {monthStats.total} lịch hẹn
          </span>
          <span className="px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300">
            ✓ {monthStats.confirmed} Xác nhận
          </span>
          {monthStats.cancelled > 0 && (
            <span className="px-2.5 py-1 rounded-sm bg-rose-100 text-rose-900 font-extrabold border border-rose-300">
              ✕ {monthStats.cancelled} Đã hủy
            </span>
          )}
        </div>
      </div>

      {/* 2. WEEKDAYS HEADER */}
      <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-200/90 text-slate-800 font-extrabold text-center py-2 text-[11px] uppercase tracking-wide select-none">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`${idx >= 5 ? 'text-rose-700 font-extrabold' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 3. CALENDAR GRID */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200 min-h-[580px]">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const itemsOnDay = followUpsByDate[key] || [];
          const isTodayCell = isSameDay(date, today);

          return (
            <div
              key={idx}
              className={`group relative min-h-[115px] p-2 transition-colors duration-150 flex flex-col justify-start ${
                !isCurrentMonth
                  ? 'bg-slate-100/60 text-slate-400'
                  : isTodayCell
                  ? 'bg-teal-50/80 text-slate-900 ring-2 ring-teal-600 ring-inset z-10'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1 select-none">
                <span
                  className={`text-xs px-2 py-0.5 rounded-sm font-extrabold ${
                    isTodayCell
                      ? 'bg-teal-700 text-white shadow-xs'
                      : isCurrentMonth
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {date.getDate()}
                  {date.getDate() === 1 && (
                    <span className="text-[10px] font-semibold ml-0.5">
                      /{date.getMonth() + 1}
                    </span>
                  )}
                </span>

                {/* Quick Add Button on Hover */}
                {selectedPatient && isCurrentMonth && !isEmployee && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddNewOnDate) onAddNewOnDate(date);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-teal-800 hover:bg-teal-100 rounded-sm transition-opacity cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                    title={`Lên lịch tái khám cho ngày ${date.getDate()}/${date.getMonth() + 1}`}
                  >
                    <Plus size={13} />
                    <span>Hẹn</span>
                  </button>
                )}
              </div>

              {/* Items List in Cell */}
              <div className="space-y-1.5 overflow-y-auto max-h-[95px] pr-0.5">
                {itemsOnDay.map((item, iIdx) => {
                  const isConfirmed = item.status !== false;
                  return (
                    <div
                      key={item.id || iIdx}
                      onClick={() => onSelectFollowUp(item)}
                      className={`p-1.5 rounded-sm text-[11px] border cursor-pointer transition-all hover:shadow-md relative group/card ${
                        isConfirmed
                          ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                          : 'bg-rose-50/90 border-l-4 border-l-rose-600 border-rose-200 text-rose-950 hover:bg-rose-100'
                      }`}
                    >
                      <div className="flex items-center justify-between font-extrabold">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className={isConfirmed ? 'text-emerald-700' : 'text-rose-700'} />
                          {formatTimeOnly(item.followUpDate) || '09:00'}
                        </span>
                        {!isEmployee && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditFollowUp(item, e);
                              }}
                              className="p-0.5 text-slate-700 hover:text-teal-800 rounded cursor-pointer"
                              title="Sửa"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="font-bold truncate mt-0.5 text-slate-900" title={item.reason || 'Tái khám'}>
                        {item.reason || 'Tái khám định kỳ'}
                      </div>
                      {item.dentistName && (
                        <div className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                          BS. {item.dentistName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    {/* 4. CALENDAR FOOTER INSTRUCTIONS */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
            Lịch hẹn đã xác nhận
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block"></span>
            Lịch hẹn đã hủy
          </span>
        </div>
        <span className="italic">Rê chuột vào ô ngày bất kỳ để nhấn "Hẹn" hoặc nhấp cuộc hẹn để xem chi tiết</span>
      </div>
    </div>
  );
}
