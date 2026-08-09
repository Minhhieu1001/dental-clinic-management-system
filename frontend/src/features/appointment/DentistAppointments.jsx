import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  User,
  Stethoscope,
  CheckCircle2,
  Play,
  Building,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getDentistsList } from '../../services/dentist.service';
import { getMyAppointments, getAppointments, updateAppointmentStatus } from '../../services/appointment.service';
import ClinicalExamModal from '../../components/ui/ClinicalExamModal';
import CreateAppointmentModal from '../../components/ui/CreateAppointmentModal';

const TIME_SLOTS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

const WEEKDAYS = [
  { short: 'T2', full: 'Thứ hai' },
  { short: 'T3', full: 'Thứ ba' },
  { short: 'T4', full: 'Thứ tư' },
  { short: 'T5', full: 'Thứ năm' },
  { short: 'T6', full: 'Thứ sáu' },
  { short: 'T7', full: 'Thứ bảy' },
  { short: 'CN', full: 'Chủ nhật' },
];

export default function DentistAppointments() {
  const { user } = useAuth();
  const [dentistInfo, setDentistInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'WEEK' | 'DAY' | 'MONTH'
  const [viewMode, setViewMode] = useState('WEEK');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, WAITING, IN_PROGRESS, COMPLETED, CANCELLED

  // Date Navigation State (Current week start date)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  });

  // Modal States
  const [selectedExamAppt, setSelectedExamAppt] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Helper to format doctor title
  const formatDoctorTitle = (usr) => {
    if (!usr) return 'ThS. BS. Nguyễn Thị Phương';
    if (usr.fullName) {
      let fName = usr.fullName.trim();
      if (!/^(ThS\.|BS\.|TS\.|Dr\.)/i.test(fName)) fName = 'BS. ' + fName;
      return fName;
    }
    const uname = usr.username || usr.email?.split('@')[0] || '';
    if (uname.includes('nguyen.thi.phuong') || uname.includes('phuong')) {
      return 'ThS. BS. Nguyễn Thị Phương';
    }
    if (uname.includes('tran.quang') || uname.includes('quang')) {
      return 'BS. Trần Quang';
    }
    return 'BS. ' + uname.replace(/^(bs\.|dr\.)/i, '').replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Fetch appointments for current logged in dentist
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const dentistsList = await getDentistsList().catch(() => []);
      let currentDentist = null;

      if (Array.isArray(dentistsList) && dentistsList.length > 0) {
        currentDentist = dentistsList.find(
          (d) =>
            d.userId === user?.id ||
            (d.email && user?.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
            (d.name && user?.username && d.name.toLowerCase().includes(user.username.toLowerCase()))
        );
      }

      setDentistInfo(currentDentist);

      let myAppts = await getMyAppointments().catch(() => []);
      if (!Array.isArray(myAppts) || myAppts.length === 0) {
        if (currentDentist?.id) {
          myAppts = await getAppointments({ dentistId: currentDentist.id }).catch(() => []);
        }
        if (!Array.isArray(myAppts) || myAppts.length === 0) {
          myAppts = await getAppointments().catch(() => []);
        }
      }

      setAppointments(Array.isArray(myAppts) ? myAppts : []);
    } catch (err) {
      console.warn('Lỗi tải lịch hẹn bác sĩ:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Navigate Date
  const handlePrev = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'WEEK') newD.setDate(newD.getDate() - 7);
    else if (viewMode === 'DAY') newD.setDate(newD.getDate() - 1);
    else if (viewMode === 'MONTH') newD.setMonth(newD.getMonth() - 1);
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'WEEK') newD.setDate(newD.getDate() + 7);
    else if (viewMode === 'DAY') newD.setDate(newD.getDate() + 1);
    else if (viewMode === 'MONTH') newD.setMonth(newD.getMonth() + 1);
    setCurrentDate(newD);
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentDate(new Date(d.setDate(diff)));
  };

  // Get 7 days of the displayed week
  const weekDaysList = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Date range display label (e.g. 12 - 18 / 05 / 2025)
  const dateRangeLabel = useMemo(() => {
    if (weekDaysList.length < 7) return '';
    const start = weekDaysList[0];
    const end = weekDaysList[6];

    const dStart = String(start.getDate()).padStart(2, '0');
    const dEnd = String(end.getDate()).padStart(2, '0');
    const mEnd = String(end.getMonth() + 1).padStart(2, '0');
    const yEnd = end.getFullYear();

    return `${dStart} - ${dEnd} / ${mEnd} / ${yEnd}`;
  }, [weekDaysList]);

  // Live real-time stats count filtered STRICTLY by currently displayed date range
  const weekStats = useMemo(() => {
    let waiting = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    let filteredCount = 0;

    if (weekDaysList.length === 0) {
      return { waiting: 0, inProgress: 0, completed: 0, cancelled: 0, total: 0 };
    }

    const startWeek = new Date(weekDaysList[0]);
    startWeek.setHours(0, 0, 0, 0);

    const endWeek = new Date(weekDaysList[weekDaysList.length - 1]);
    endWeek.setHours(23, 59, 59, 999);

    appointments.forEach((apt) => {
      let aptDateObj = null;

      if (apt.appointmentTime) {
        const d = new Date(apt.appointmentTime);
        if (!isNaN(d.getTime())) aptDateObj = d;
      }
      if (!aptDateObj && apt.appointmentDate) {
        const d = new Date(apt.appointmentDate);
        if (!isNaN(d.getTime())) aptDateObj = d;
      }

      if (!aptDateObj) {
        aptDateObj = new Date();
      }

      // Check if appointment date falls strictly within the displayed week range
      if (aptDateObj >= startWeek && aptDateObj <= endWeek) {
        filteredCount++;
        if (apt.status === 'IN_PROGRESS') inProgress++;
        else if (apt.status === 'COMPLETED') completed++;
        else if (apt.status === 'CANCELLED') cancelled++;
        else waiting++;
      }
    });

    return { waiting, inProgress, completed, cancelled, total: filteredCount };
  }, [appointments, weekDaysList]);


  // Filter 100% REAL DATABASE APPOINTMENTS matching dayIdx and hourStr
  const getEventsForCell = (dayIdx, hourStr) => {
    const targetDayDate = weekDaysList[dayIdx];
    if (!targetDayDate) return [];

    const targetYear = targetDayDate.getFullYear();
    const targetMonth = targetDayDate.getMonth();
    const targetDateNum = targetDayDate.getDate();
    const targetHourNum = parseInt(hourStr.split(':')[0], 10);

    return appointments.filter((apt) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING' && (apt.status === 'IN_PROGRESS' || apt.status === 'COMPLETED' || apt.status === 'CANCELLED')) return false;
        if (statusFilter === 'IN_PROGRESS' && apt.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'COMPLETED' && apt.status !== 'COMPLETED') return false;
        if (statusFilter === 'CANCELLED' && apt.status !== 'CANCELLED') return false;
      }

      let aptDateObj = null;

      if (apt.appointmentTime) {
        const d = new Date(apt.appointmentTime);
        if (!isNaN(d.getTime())) aptDateObj = d;
      }

      if (!aptDateObj && apt.appointmentDate) {
        const d = new Date(apt.appointmentDate);
        if (!isNaN(d.getTime())) aptDateObj = d;
      }

      if (!aptDateObj) return false;

      const isSameDate =
        aptDateObj.getFullYear() === targetYear &&
        aptDateObj.getMonth() === targetMonth &&
        aptDateObj.getDate() === targetDateNum;

      if (!isSameDate) return false;

      const aptHourNum = aptDateObj.getHours();
      return aptHourNum === targetHourNum;
    });
  };

  // Status color styles & label mapping
  const getStatusCardStyle = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          cardBg: 'bg-purple-50/95 border-purple-600 text-purple-950 hover:bg-purple-100 hover:shadow-md',
          badgeBg: 'bg-purple-600 text-white',
          label: 'Đang khám',
          iconColor: 'text-purple-600',
        };
      case 'COMPLETED':
        return {
          cardBg: 'bg-emerald-50/95 border-emerald-600 text-emerald-950 hover:bg-emerald-100 hover:shadow-md',
          badgeBg: 'bg-emerald-600 text-white',
          label: 'Hoàn thành',
          iconColor: 'text-emerald-600',
        };
      case 'CANCELLED':
        return {
          cardBg: 'bg-rose-50/95 border-rose-500 text-rose-950 hover:bg-rose-100 hover:shadow-md',
          badgeBg: 'bg-rose-600 text-white',
          label: 'Đã hủy',
          iconColor: 'text-rose-600',
        };
      default:
        // WAITING, PENDING, CONFIRMED
        return {
          cardBg: 'bg-sky-50/95 border-sky-600 text-sky-950 hover:bg-sky-100 hover:shadow-md',
          badgeBg: 'bg-sky-600 text-white',
          label: 'Chưa khám',
          iconColor: 'text-sky-600',
        };
    }
  };

  // Open Clinical Exam Modal when clicking any appointment event card
  const handleEventClick = (event) => {
    setSelectedExamAppt(event);
    setIsExamModalOpen(true);
  };

  const doctorDisplayName = dentistInfo ? (dentistInfo.name || dentistInfo.fullName) : formatDoctorTitle(user);

  // Current real-time indicator line position (e.g. 11:15 AM -> 11.25)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const showRedLine = currentHour >= 7 && currentHour <= 17;
  const redLineTopPercent = ((currentHour - 7 + currentMin / 60) / 11) * 100;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 bg-[#F4F7F6]/60 min-h-screen text-slate-800 font-sans">
      {/* 1. Header Navigation Bar (Exact Match with Image 1) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        {/* Left Date Range Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/60 p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
          >
            Hôm nay
          </button>

          {/* Displayed Date Range */}
          <span className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight ml-2">
            {dateRangeLabel}
          </span>
        </div>

        {/* Right View Mode Controls & Add Action */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle Pill (Ngày | Tuần | Tháng) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('DAY')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'DAY'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'WEEK'
                  ? 'bg-[#E0F2FE] text-teal-900 shadow-xs border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng
            </button>
          </div>

          {/* Add Appointment Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800 transition-all"
          >
            <Plus size={16} />
            Tạo ca khám mới
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAppointments}
            disabled={loading}
            title="Làm mới lịch khám"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Professional Interactive Live Status Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 sm:px-5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Bộ lọc:</span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả <span className="rounded-md bg-white/20 px-1.5 py-0.2 text-[10px]">{weekStats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('WAITING')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'WAITING'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 border border-sky-200/80 hover:bg-sky-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Chưa khám
            <span className="rounded-md bg-sky-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.waiting}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Đang khám
            <span className="rounded-md bg-purple-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.inProgress}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Hoàn thành
            <span className="rounded-md bg-emerald-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.completed}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Đã hủy
            <span className="rounded-md bg-rose-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.cancelled}</span>
          </button>
        </div>

        <div className="text-[11px] font-medium text-slate-400 hidden lg:block">
          * Bấm nút trạng thái để lọc nhanh ca khám
        </div>
      </div>

      {/* 2. Calendar View Content (WEEK MATRIX VIEW - Responsive All 7 Days Visible) */}
      {viewMode === 'WEEK' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="w-full min-w-[700px] relative">
              {/* Matrix Table Header: Days of the Week */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-700">
                {/* Time slot column title */}
                <div className="p-3 border-r border-slate-200 text-slate-400 font-semibold text-[11px] flex items-center justify-center">
                  Giờ / Ngày
                </div>

                {/* 7 Days Header (T2 - CN) */}
                {weekDaysList.map((d, idx) => {
                  const isToday =
                    d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();

                  const dayNum = String(d.getDate()).padStart(2, '0');
                  const monthNum = String(d.getMonth() + 1).padStart(2, '0');

                  return (
                    <div
                      key={idx}
                      className={`p-3 border-r border-slate-200 last:border-r-0 ${
                        isToday ? 'bg-teal-50/80 text-teal-900 font-extrabold' : ''
                      }`}
                    >
                      <div className="text-xs font-extrabold uppercase">{WEEKDAYS[idx].short}</div>
                      <div className={`text-xs font-bold mt-0.5 ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
                        {dayNum}/{monthNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Grid Container */}
              <div className="relative divide-y divide-slate-100">
                {/* Current Time Indicator Red Line (Matching Image 1) */}
                {showRedLine && (
                  <div
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    style={{ top: `${redLineTopPercent}%` }}
                  >
                    <div className="h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-100 shadow-sm -ml-1.5" />
                    <div className="h-[2px] w-full bg-rose-500 shadow-xs" />
                  </div>
                )}

                {/* Time Slot Rows */}
                {TIME_SLOTS.map((hourStr) => (
                  <div key={hourStr} className="grid grid-cols-8 min-h-[88px]">
                    {/* Time Label Column */}
                    <div className="p-2 border-r border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-500 flex items-center justify-center">
                      {hourStr}
                    </div>

                    {/* 7 Day Matrix Cells */}
                    {weekDaysList.map((d, dayIdx) => {
                      const cellEvents = getEventsForCell(dayIdx, hourStr);

                      return (
                        <div
                          key={dayIdx}
                          className="p-1.5 border-r border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors relative min-h-[88px] flex flex-col justify-center gap-1.5"
                        >
                          {cellEvents.map((event) => {
                            const style = getStatusCardStyle(event.status);

                            let timeRange = `${hourStr} - ${String(parseInt(hourStr.split(':')[0], 10) + 1).padStart(2, '0')}:00`;
                            if (event.appointmentTime) {
                              try {
                                const dateObj = new Date(event.appointmentTime);
                                const startH = String(dateObj.getHours()).padStart(2, '0');
                                const startM = String(dateObj.getMinutes()).padStart(2, '0');
                                const endH = String(dateObj.getHours() + 1).padStart(2, '0');
                                timeRange = `${startH}:${startM} - ${endH}:${startM}`;
                              } catch (e) {
                                // fallback
                              }
                            }

                            return (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={`w-full p-2.5 rounded-xl border-l-[5px] shadow-xs hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer space-y-1.5 ${style.cardBg}`}
                              >
                                {/* Top Row: Time & Status Badge */}
                                <div className="flex items-center justify-between gap-1 border-b border-slate-200/60 pb-1">
                                  <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                    <Clock size={11} className={style.iconColor} /> {timeRange}
                                  </span>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black tracking-tight uppercase ${style.badgeBg}`}>
                                    {style.label}
                                  </span>
                                </div>

                                {/* Line 2: Full Patient Name (No truncation) */}
                                <p className="font-extrabold text-xs text-slate-900 leading-snug break-words">
                                  {event.patientName || event.fullName || 'Bệnh nhân'}
                                </p>

                                {/* Line 3: Phone Number */}
                                {event.phone && (
                                  <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                    <span>📞</span> {event.phone}
                                  </p>
                                )}

                                {/* Line 4: Service / Reason */}
                                <p className="text-[11px] font-bold text-slate-800 leading-tight flex items-center gap-1">
                                  <span>🩺</span> {event.reason || event.service || 'Khám tổng quát'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DAY VIEW MODE */}
      {viewMode === 'DAY' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={18} className="text-teal-700" />
              Lịch khám chi tiết ngày: <span className="text-teal-700">{currentDate.toLocaleDateString('vi-VN')}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Tổng số ca: {appointments.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {TIME_SLOTS.map((hourStr) => {
              const matchingEvents = appointments.filter((a) => {
                const timeStr = String(a.appointmentTime || '').substring(11, 16);
                return timeStr.startsWith(hourStr.split(':')[0]);
              });

              return (
                <div key={hourStr} className="flex items-start gap-4 py-3">
                  <span className="w-16 text-xs font-bold text-slate-400 shrink-0 mt-1">{hourStr}</span>
                  <div className="flex-1 space-y-2">
                    {matchingEvents.length === 0 ? (
                      <div className="text-xs text-slate-300 italic border border-dashed border-slate-100 rounded-lg p-2">
                        Khung giờ trống
                      </div>
                    ) : (
                      matchingEvents.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => handleEventClick(apt)}
                          className="flex items-center justify-between p-3 rounded-xl bg-teal-50/70 border border-teal-200 hover:shadow-md cursor-pointer transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{apt.patientName}</p>
                            <p className="text-[11px] text-teal-700 font-medium">{apt.reason}</p>
                          </div>
                          <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            {apt.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MONTH VIEW MODE */}
      {viewMode === 'MONTH' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-3 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w.short}>{w.full}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 min-h-[360px]">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = (i % 31) + 1;
              const hasAppt = i % 4 === 0;

              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 p-2 min-h-[70px] flex flex-col justify-between hover:bg-slate-100/60 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-700">{dayNum}</span>
                  {hasAppt && (
                    <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800 truncate">
                      2 ca khám
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinical Exam Modal */}
      <ClinicalExamModal
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          setSelectedExamAppt(null);
        }}
        appointment={selectedExamAppt}
        onSuccess={fetchAppointments}
      />

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
