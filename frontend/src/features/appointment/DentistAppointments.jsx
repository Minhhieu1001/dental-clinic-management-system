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
  ListFilter,
  History,
  Search,
  ShieldCheck,
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

const parseAppointmentDateTime = (dateTimeVal, dateBackupVal) => {
  if (!dateTimeVal && !dateBackupVal) return null;
  const target = dateTimeVal || dateBackupVal;
  if (!target) return null;
  if (target instanceof Date) return target;
  let str = String(target).trim();
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
};

export default function DentistAppointments() {
  const { user } = useAuth();
  const [dentistInfo, setDentistInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // View state: 'WEEK' | 'DAY' | 'MONTH' | 'LIST'
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

      const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
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

  // Month View Days Grid Calculation
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Get appointments for a specific day cell in Month View
  const getEventsForMonthCell = (cellDate) => {
    const targetYear = cellDate.getFullYear();
    const targetMonth = cellDate.getMonth();
    const targetDateNum = cellDate.getDate();

    return appointments.filter((apt) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING' && (apt.status === 'IN_PROGRESS' || apt.status === 'COMPLETED' || apt.status === 'CANCELLED')) return false;
        if (statusFilter === 'IN_PROGRESS' && apt.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'COMPLETED' && apt.status !== 'COMPLETED') return false;
        if (statusFilter === 'CANCELLED' && apt.status !== 'CANCELLED') return false;
      }

      const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
      if (!aptDateObj) return false;

      return (
        aptDateObj.getFullYear() === targetYear &&
        aptDateObj.getMonth() === targetMonth &&
        aptDateObj.getDate() === targetDateNum
      );
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

  // Filtered 7-day appointments list for LIST view
  const listFilteredAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        // 1. Status Filter
        if (
          statusFilter === 'WAITING' &&
          !(apt.status === 'WAITING' || apt.status === 'PENDING' || apt.status === 'UNASSIGNED')
        )
          return false;
        if (statusFilter === 'IN_PROGRESS' && apt.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'COMPLETED' && apt.status !== 'COMPLETED') return false;
        if (statusFilter === 'CANCELLED' && apt.status !== 'CANCELLED') return false;

        // 2. Date Range Filter (7 Days of the currently selected week)
        const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
        if (!aptDateObj) return false;

        const weekStart = new Date(currentDate);
        const dayOfWeek = (weekStart.getDay() + 6) % 7;
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        if (aptDateObj < weekStart || aptDateObj > weekEnd) return false;

        // 3. Search Term Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchName = (apt.patientName || apt.fullName || '').toLowerCase().includes(q);
          const matchPhone = (apt.phone || '').includes(q);
          const matchCode = (apt.patientCode || '').toLowerCase().includes(q);
          const matchReason = (apt.reason || apt.service || '').toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCode && !matchReason) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dA = parseAppointmentDateTime(a.appointmentTime, a.appointmentDate);
        const dB = parseAppointmentDateTime(b.appointmentTime, b.appointmentDate);
        return (dB ? dB.getTime() : 0) - (dA ? dA.getTime() : 0);
      });
  }, [appointments, statusFilter, currentDate, searchTerm]);

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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-[4px] border border-slate-200/80 bg-white p-4 shadow-xs">
        {/* Left Date Range Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-slate-50/60 p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="rounded-[4px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
          >
            Hôm nay
          </button>

          {/* Displayed Date Range */}
          <span className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight ml-2">
            {dateRangeLabel}
          </span>
        </div>

        {/* Right View Mode Controls & Add Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle Pill (Ngày | Tuần | Tháng | List) */}
          <div className="flex items-center gap-1 rounded-[4px] bg-slate-100/90 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('DAY')}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
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
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
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
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'LIST'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter size={13} />
              Dạng List
            </button>
          </div>

          {/* Dedicated 7-Day History List Button */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'LIST' ? 'WEEK' : 'LIST')}
            className={`flex items-center gap-1.5 rounded-[4px] border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
              viewMode === 'LIST'
                ? 'border-teal-700 bg-teal-800 text-white'
                : 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <History size={15} className={viewMode === 'LIST' ? 'text-white' : 'text-teal-700'} />
            <span>Lịch sử 7 ngày</span>
          </button>

          {/* Add Appointment Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[4px] bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800 transition-all"
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
            className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Professional Interactive Live Status Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[4px] border border-slate-200/80 bg-white p-3 sm:px-5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Bộ lọc:</span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả <span className="rounded-[4px] bg-white/20 px-1.5 py-0.2 text-[10px]">{weekStats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('WAITING')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'WAITING'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 border border-sky-200/80 hover:bg-sky-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Chưa khám
            <span className="rounded-[4px] bg-sky-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.waiting}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Đang khám
            <span className="rounded-[4px] bg-purple-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.inProgress}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Hoàn thành
            <span className="rounded-[4px] bg-emerald-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.completed}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Đã hủy
            <span className="rounded-[4px] bg-rose-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.cancelled}</span>
          </button>
        </div>

        <div className="text-[11px] font-medium text-slate-400 hidden lg:block">
          * Bấm nút trạng thái để lọc nhanh ca khám
        </div>
      </div>

      {/* 2. Calendar View Content (WEEK MATRIX VIEW - Responsive All 7 Days Visible) */}
      {viewMode === 'WEEK' && (
        <div className="rounded-[4px] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="w-full min-w-[1050px] relative">
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
                          className="p-1.5 border-r border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors relative min-h-[88px] flex flex-col justify-start gap-2 overflow-visible"
                        >
                          {cellEvents.map((event) => {
                            const style = getStatusCardStyle(event.status);
                            const isUrgent = event.notes && event.notes.includes('[ƯU TIÊN / CẤP CỨU]');

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
                                className={`w-full p-2.5 rounded-[4px] border-l-[4px] shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1.5 overflow-hidden text-left ${style.cardBg}`}
                              >
                                {isUrgent && (
                                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100/90 border border-rose-200 rounded-[3px] px-1.5 py-0.5 w-max">
                                    <span>🚨 Cấp cứu</span>
                                  </div>
                                )}

                                {/* Top Row: Time & Status Badge */}
                                <div className="space-y-1 border-b border-slate-200/60 pb-1.5">
                                  <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                    <Clock size={11} className={style.iconColor} /> {timeRange}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`rounded-[3px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${style.badgeBg}`}>
                                      {style.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Patient Name, Code & Phone */}
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-xs text-slate-900 leading-snug break-words">
                                    {event.patientName || event.fullName || 'Bệnh nhân'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                    {event.patientCode && (
                                      <span className="font-extrabold text-teal-800 bg-teal-100/70 border border-teal-200/80 rounded-[3px] px-1 py-0.2 text-[9px]">
                                        {event.patientCode}
                                      </span>
                                    )}
                                    {event.phone && (
                                      <span className="font-semibold text-slate-500 flex items-center gap-0.5">
                                        📞 {event.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Service / Reason */}
                                <p className="text-[11px] font-extrabold text-teal-950 leading-tight flex items-start gap-1">
                                  <FileText size={11} className="text-teal-700 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{event.reason || event.service || 'Khám tổng quát'}</span>
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
        <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Month Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-teal-50 text-teal-700 border border-teal-200">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Lịch khám Tháng {String(currentDate.getMonth() + 1).padStart(2, '0')} / {currentDate.getFullYear()}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tổng hợp ca khám theo từng ngày trong tháng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-[3px] font-bold">
                <CheckCircle2 size={13} /> {weekStats.completed} ca hoàn thành
              </span>
              <span className="flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-[3px] font-bold">
                <Clock size={13} /> {weekStats.waiting} ca chưa khám
              </span>
            </div>
          </div>

          {/* Month Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Day Headers (T2 - CN) */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-extrabold text-slate-700 uppercase py-2">
                <div>Thứ 2</div>
                <div>Thứ 3</div>
                <div>Thứ 4</div>
                <div>Thứ 5</div>
                <div>Thứ 6</div>
                <div>Thứ 7</div>
                <div className="text-rose-600">Chủ nhật</div>
              </div>

              {/* Month Days Cells Grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 min-h-[440px]">
                {monthCalendarDays.map((item, idx) => {
                  const cellDate = item.date;
                  const isToday =
                    cellDate.getDate() === now.getDate() &&
                    cellDate.getMonth() === now.getMonth() &&
                    cellDate.getFullYear() === now.getFullYear();

                  const dayAppts = getEventsForMonthCell(cellDate);

                  return (
                    <div
                      key={idx}
                      className={`p-2 min-h-[95px] flex flex-col justify-start gap-1 transition-colors ${
                        !item.isCurrentMonth
                          ? 'bg-slate-50/50 text-slate-300'
                          : isToday
                          ? 'bg-teal-50/70 font-bold'
                          : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-extrabold px-1.5 py-0.2 rounded-[3px] ${
                            isToday
                              ? 'bg-teal-700 text-white shadow-2xs'
                              : item.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {cellDate.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-1 py-0.2 rounded-[3px]">
                            {dayAppts.length} ca
                          </span>
                        )}
                      </div>

                      {/* Day Appointments List inside Month Cell */}
                      <div className="space-y-1 mt-0.5 overflow-hidden">
                        {dayAppts.slice(0, 2).map((apt) => {
                          const style = getStatusCardStyle(apt.status);
                          let timeStr = '09:00';
                          if (apt.appointmentTime) {
                            try {
                              const d = new Date(apt.appointmentTime);
                              timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                            } catch (e) {
                              timeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
                            }
                          }

                          return (
                            <div
                              key={apt.id}
                              onClick={() => handleEventClick(apt)}
                              className={`p-1 rounded-[3px] border border-slate-200 text-[10px] cursor-pointer hover:shadow-2xs transition-all text-left truncate ${style.cardBg}`}
                            >
                              <div className="font-bold truncate flex items-center justify-between gap-1">
                                <span className="truncate">{apt.patientName || apt.fullName}</span>
                                <span className="text-[9px] font-semibold opacity-80 shrink-0">{timeStr}</span>
                              </div>
                            </div>
                          );
                        })}

                        {dayAppts.length > 2 && (
                          <div
                            onClick={() => {
                              setCurrentDate(new Date(cellDate));
                              setViewMode('DAY');
                            }}
                            className="text-[9px] font-extrabold text-teal-800 hover:underline cursor-pointer text-center bg-teal-50 border border-teal-100 py-0.5 rounded-[3px]"
                          >
                            +{dayAppts.length - 2} ca khác &rarr;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 7-DAY WEEKLY HISTORY LIST VIEW MODE */}
      {viewMode === 'LIST' && (
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* List View Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-teal-50 text-teal-700 border border-teal-200">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Lịch sử khám bệnh 1 tuần qua ({dateRangeLabel})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hiển thị tổng cộng <strong className="text-teal-800 font-bold">{listFilteredAppointments.length}</strong> ca khám trong tuần
                  </p>
                </div>
              </div>
            </div>

            {/* Quick search input in List View */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bệnh nhân, SĐT, mã BN..."
                className="w-full sm:w-64 rounded-[4px] border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* List Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Thời gian & Ngày</th>
                  <th className="py-3 px-3">Bệnh nhân</th>
                  <th className="py-3 px-3">Bác sĩ & Phòng</th>
                  <th className="py-3 px-3">Dịch vụ & Chẩn đoán</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listFilteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-300" />
                      Không tìm thấy ca khám nào phù hợp trong khoảng thời gian này.
                    </td>
                  </tr>
                ) : (
                  listFilteredAppointments.map((apt) => {
                    const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
                    const formattedDateStr = aptDateObj
                      ? `${WEEKDAYS[(aptDateObj.getDay() + 6) % 7].short}, ${String(aptDateObj.getDate()).padStart(2, '0')}/${String(aptDateObj.getMonth() + 1).padStart(2, '0')}/${aptDateObj.getFullYear()}`
                      : '---';

                    let timeRangeStr = '09:00 - 10:00';
                    if (apt.appointmentTime) {
                      try {
                        const d = new Date(apt.appointmentTime);
                        const startH = String(d.getHours()).padStart(2, '0');
                        const startM = String(d.getMinutes()).padStart(2, '0');
                        const endH = String(d.getHours() + 1).padStart(2, '0');
                        timeRangeStr = `${startH}:${startM} - ${endH}:${startM}`;
                      } catch (e) {
                        timeRangeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
                      }
                    }

                    const style = getStatusCardStyle(apt.status);
                    const isUrgent = apt.notes && apt.notes.includes('[ƯU TIÊN / CẤP CỨU]');

                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Time & Date */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">{formattedDateStr}</div>
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-teal-600" /> {timeRangeStr}
                          </div>
                        </td>

                        {/* Patient Info */}
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {apt.patientName || apt.fullName || 'Bệnh nhân'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                            {apt.patientCode && (
                              <span className="font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-1 py-0.2 rounded-[3px]">
                                {apt.patientCode}
                              </span>
                            )}
                            {apt.phone && (
                              <span className="text-slate-500 font-medium">📞 {apt.phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Doctor & Room */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                            <Stethoscope size={12} className="text-teal-700 shrink-0" />
                            <span>{apt.dentistName || doctorDisplayName}</span>
                          </div>
                          {apt.roomName && (
                            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building size={11} className="text-amber-600 shrink-0" />
                              <span>{apt.roomName}</span>
                            </div>
                          )}
                        </td>

                        {/* Service & Diagnosis */}
                        <td className="py-3 px-3 max-w-[220px]">
                          <div className="font-bold text-teal-950 text-xs truncate">
                            {apt.reason || apt.service || 'Khám tổng quát nha khoa'}
                          </div>
                          {apt.diagnosis ? (
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              Chẩn đoán: <span className="text-slate-700 font-semibold">{apt.diagnosis}</span>
                            </div>
                          ) : isUrgent ? (
                            <div className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 rounded-[3px] px-1 py-0.2 mt-0.5">
                              🚨 Ca cấp cứu
                            </div>
                          ) : null}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`rounded-[3px] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider inline-block ${style.badgeBg}`}>
                            {style.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEventClick(apt)}
                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
                          >
                            <Eye size={13} className="text-teal-700" />
                            <span>Xem hồ sơ</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
