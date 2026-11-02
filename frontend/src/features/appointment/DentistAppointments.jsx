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
  Activity,
  Phone,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getDentistsList } from '../../services/dentist.service';
import { getAppointments, getMyAppointments } from '../../services/appointment.service';
import ClinicalExamModal from '../../components/ui/ClinicalExamModal';

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

  // Realtime update handler
  const handleRealtimeAppt = useCallback((updatedApt) => {
    if (!updatedApt || !updatedApt.id) return;
    toast.success('Cập nhật ca khám mới!', { id: 'realtime-appt' });
    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === updatedApt.id);
      if (exists) {
        return prev.map((item) => (item.id === updatedApt.id ? { ...item, ...updatedApt } : item));
      } else {
        return [updatedApt, ...prev];
      }
    });
  }, []);

  const handleRealtimeNotif = useCallback((notif) => {
    toast(`${notif.title || 'Thông báo'}: ${notif.content || notif.message || ''}`, { id: 'realtime-notif' });
  }, []);

  useWebSocket(handleRealtimeAppt, handleRealtimeNotif);

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

  // Date range display label (e.g. 28 - 04 / 10 / 2026)
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

  // Filter appointments matching dayIdx and hourStr
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

      // Search term filter if entered
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (apt.patientName || apt.fullName || '').toLowerCase().includes(q);
        const matchPhone = (apt.phone || '').includes(q);
        const matchCode = (apt.patientCode || '').toLowerCase().includes(q);
        const matchReason = (apt.reason || apt.service || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode && !matchReason) return false;
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

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (apt.patientName || apt.fullName || '').toLowerCase().includes(q);
        const matchPhone = (apt.phone || '').includes(q);
        const matchCode = (apt.patientCode || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode) return false;
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

  // Status color styles & label mapping (Modern, Minimal & Clean White Theme)
  const getStatusCardStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'not-arrived':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-amber-500 text-slate-900 hover:border-amber-400 hover:shadow-xs transition-all',
          badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200/80',
          label: 'Chưa đến',
          iconColor: 'text-amber-600',
        };
      case 'WAITING':
      case 'waiting':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-sky-500 text-slate-900 hover:border-sky-400 hover:shadow-xs transition-all',
          badgeBg: 'bg-sky-50 text-sky-800 border border-sky-200/80',
          label: 'Chờ khám',
          iconColor: 'text-sky-600',
        };
      case 'CALLED':
      case 'called':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-purple-500 text-slate-900 hover:border-purple-400 hover:shadow-xs transition-all',
          badgeBg: 'bg-purple-50 text-purple-800 border border-purple-200/80',
          label: 'Đã gọi vào',
          iconColor: 'text-purple-600',
        };
      case 'IN_PROGRESS':
      case 'in-progress':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-teal-600 text-slate-900 hover:border-teal-400 hover:shadow-xs transition-all',
          badgeBg: 'bg-teal-50 text-teal-800 border border-teal-200/80',
          label: 'Đang khám',
          iconColor: 'text-teal-600',
        };
      case 'COMPLETED':
      case 'completed':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-slate-400 text-slate-900 hover:border-slate-300 hover:shadow-xs transition-all',
          badgeBg: 'bg-slate-100 text-slate-700 border border-slate-200',
          label: 'Hoàn thành',
          iconColor: 'text-slate-600',
        };
      case 'CANCELLED':
      case 'cancelled':
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-rose-500 text-slate-900 hover:border-rose-300 hover:shadow-xs transition-all',
          badgeBg: 'bg-rose-50 text-rose-800 border border-rose-200/80',
          label: 'Đã hủy',
          iconColor: 'text-rose-600',
        };
      default:
        return {
          cardBg: 'bg-white border border-slate-200 border-l-[3.5px] border-l-teal-600 text-slate-900 hover:border-teal-400 hover:shadow-xs transition-all',
          badgeBg: 'bg-teal-50 text-teal-800 border border-teal-200/80',
          label: 'Lịch hẹn',
          iconColor: 'text-teal-600',
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
        if (
          statusFilter === 'WAITING' &&
          !(apt.status === 'WAITING' || apt.status === 'PENDING' || apt.status === 'UNASSIGNED' || apt.status === 'CONFIRMED' || apt.status === 'not-arrived')
        )
          return false;
        if (statusFilter === 'IN_PROGRESS' && apt.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'COMPLETED' && apt.status !== 'COMPLETED') return false;
        if (statusFilter === 'CANCELLED' && apt.status !== 'CANCELLED') return false;

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

  // Next / active patient appointment for Doctor Dashboard Hero Banner
  const nextPatientAppt = useMemo(() => {
    const waitingOrActive = appointments.filter((apt) => {
      if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') return false;
      return true;
    }).sort((a, b) => {
      const dA = parseAppointmentDateTime(a.appointmentTime, a.appointmentDate);
      const dB = parseAppointmentDateTime(b.appointmentTime, b.appointmentDate);
      return (dA ? dA.getTime() : 0) - (dB ? dB.getTime() : 0);
    });
    return waitingOrActive[0] || null;
  }, [appointments]);

  const doctorDisplayName = dentistInfo ? (dentistInfo.name || dentistInfo.fullName) : formatDoctorTitle(user);

  const now = new Date();

  return (
    <div className="w-full p-1 space-y-3 text-slate-800 text-xs font-sans">
      {/* 0. Hero Doctor Dashboard Banner - Minimal & Clean */}
      <div className="rounded-sm bg-white p-4 text-slate-800 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Doctor & Clinic Room Profile */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-teal-50 text-teal-700 border border-teal-200/90 shrink-0">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
                  LỊCH LÀM VIỆC & KHÁM BỆNH BÁC SĨ
                </h1>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200/80 uppercase">
                  {doctorDisplayName}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                Nha khoa Quốc tế Crown Dental • Lịch khám theo tuần, mở hồ sơ bệnh án khám lâm sàng & kê đơn thuốc cho bệnh nhân.
              </p>
            </div>
          </div>

          {/* Right: Metric Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-slate-500 font-medium text-[11px]">Tổng ca tuần:</span>
              <strong className="text-slate-900 font-extrabold">{weekStats.total}</strong>
            </div>
            <div className="flex items-center gap-2 bg-sky-50/80 border border-sky-200 text-sky-900 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-sky-700 font-medium text-[11px]">Chờ khám:</span>
              <strong className="text-sky-950 font-extrabold">{weekStats.waiting}</strong>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-emerald-700 font-medium text-[11px]">Hoàn thành:</span>
              <strong className="text-emerald-950 font-extrabold">{weekStats.completed}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Header Navigation Bar (Modern, Minimal & Clean) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Left Date Range Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-0.5 rounded-sm border border-slate-200 bg-slate-50/70 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hôm nay
          </button>

          {/* Displayed Date Range */}
          <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight ml-1">
            {dateRangeLabel}
          </span>
        </div>

        {/* Right View Mode Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle Segmented Control */}
          <div className="flex items-center gap-0.5 rounded-sm bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('DAY')}
              className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${viewMode === 'DAY'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${viewMode === 'WEEK'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${viewMode === 'MONTH'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`rounded-sm px-3 py-1 text-xs font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer active:scale-95 ${viewMode === 'LIST'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <ListFilter size={13} />
              Danh sách
            </button>
          </div>

          {/* Dedicated 7-Day History List Button */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'LIST' ? 'WEEK' : 'LIST')}
            className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-bold transition-all duration-150 shadow-2xs cursor-pointer active:scale-95 ${viewMode === 'LIST'
              ? 'border-teal-700 bg-teal-800 text-white'
              : 'border-teal-200 bg-teal-50/80 text-teal-800 hover:bg-teal-100'
              }`}
          >
            <History size={14} className={viewMode === 'LIST' ? 'text-white' : 'text-teal-700'} />
            <span>Lịch sử 7 ngày</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAppointments}
            disabled={loading}
            title="Làm mới lịch khám"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Dynamic Stacked Distribution Bar & Interactive KPI Cards Grid */}
      <div className="rounded-sm border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Top Line: Title & Distribution Bar */}
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Activity size={15} className="text-teal-700" />
              <span>Phân bổ lịch khám tuần ({dateRangeLabel})</span>
            </div>
            {/* Quick Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên BN, SĐT, dịch vụ..."
                className="w-full sm:w-60 rounded-sm border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Dynamic Stacked Distribution Bar */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80 shadow-2xs">
            {weekStats.total === 0 ? (
              <div className="h-full w-full bg-slate-200/80 rounded-full" title="Chưa có ca khám nào trong tuần" />
            ) : (
              <>
                {weekStats.waiting > 0 && (
                  <div
                    style={{ width: `${(weekStats.waiting / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Chưa khám: ${weekStats.waiting} (${Math.round((weekStats.waiting / weekStats.total) * 100)}%)`}
                  />
                )}
                {weekStats.inProgress > 0 && (
                  <div
                    style={{ width: `${(weekStats.inProgress / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Đang khám: ${weekStats.inProgress} (${Math.round((weekStats.inProgress / weekStats.total) * 100)}%)`}
                  />
                )}
                {weekStats.completed > 0 && (
                  <div
                    style={{ width: `${(weekStats.completed / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Hoàn thành: ${weekStats.completed} (${Math.round((weekStats.completed / weekStats.total) * 100)}%)`}
                  />
                )}
                {weekStats.cancelled > 0 && (
                  <div
                    style={{ width: `${(weekStats.cancelled / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Đã hủy: ${weekStats.cancelled} (${Math.round((weekStats.cancelled / weekStats.total) * 100)}%)`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Metric Cards Grid below the progress bar (Interactive Filters matching User's Image) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5 text-xs select-none">
          {/* Card 1: Tất cả */}
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600'
                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
            }`}
            title="Nhấp để lọc xem tất cả cuộc hẹn"
          >
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-extrabold">TỔNG LỊCH HẸN</div>
              <div className="text-xs font-extrabold text-slate-900 mt-0.5">{weekStats.total} ca khám</div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">100%</span>
          </div>

          {/* Card 2: Chưa khám */}
          <div
            onClick={() => setStatusFilter('WAITING')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${
              statusFilter === 'WAITING'
                ? 'bg-sky-100/90 border-sky-600 ring-2 ring-sky-600'
                : 'bg-sky-50/50 border-sky-200/80 hover:bg-sky-100/60'
            }`}
            title="Nhấp để lọc ca chưa khám"
          >
            <div>
              <div className="text-[10px] text-sky-800 uppercase font-extrabold">CHƯA KHÁM</div>
              <div className="text-xs font-extrabold text-sky-950 mt-0.5">{weekStats.waiting} ca</div>
            </div>
            <span className="text-[11px] font-extrabold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200">
              {weekStats.total > 0 ? Math.round((weekStats.waiting / weekStats.total) * 100) : 0}%
            </span>
          </div>

          {/* Card 3: Đang khám */}
          <div
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-purple-100/90 border-purple-600 ring-2 ring-purple-600'
                : 'bg-purple-50/50 border-purple-200/80 hover:bg-purple-100/60'
            }`}
            title="Nhấp để lọc ca đang khám"
          >
            <div>
              <div className="text-[10px] text-purple-800 uppercase font-extrabold">ĐANG KHÁM</div>
              <div className="text-xs font-extrabold text-purple-950 mt-0.5">{weekStats.inProgress} ca</div>
            </div>
            <span className="text-[11px] font-extrabold text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
              {weekStats.total > 0 ? Math.round((weekStats.inProgress / weekStats.total) * 100) : 0}%
            </span>
          </div>

          {/* Card 4: Hoàn thành */}
          <div
            onClick={() => setStatusFilter('COMPLETED')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-600'
                : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-100/60'
            }`}
            title="Nhấp để lọc ca hoàn thành"
          >
            <div>
              <div className="text-[10px] text-emerald-800 uppercase font-extrabold">HOÀN THÀNH</div>
              <div className="text-xs font-extrabold text-emerald-950 mt-0.5">{weekStats.completed} xong</div>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
              {weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%
            </span>
          </div>

          {/* Card 5: Đã hủy */}
          <div
            onClick={() => setStatusFilter('CANCELLED')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-100/90 border-rose-600 ring-2 ring-rose-600'
                : 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/60'
            }`}
            title="Nhấp để lọc ca đã hủy"
          >
            <div>
              <div className="text-[10px] text-rose-800 uppercase font-extrabold">ĐÃ HỦY</div>
              <div className="text-xs font-extrabold text-rose-950 mt-0.5">{weekStats.cancelled} ca hủy</div>
            </div>
            <span className="text-[11px] font-extrabold text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
              {weekStats.total > 0 ? Math.round((weekStats.cancelled / weekStats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Calendar Matrix View (WEEK VIEW) */}
      {viewMode === 'WEEK' && (
        <div className="rounded-sm border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="w-full min-w-[1050px] relative">
              {/* Matrix Table Header: Days of the Week */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-700">
                {/* Time slot column title */}
                <div className="p-2.5 border-r border-slate-200/80 text-slate-400 font-semibold text-[11px] flex items-center justify-center">
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
                      className={`p-2.5 border-r border-slate-200/80 last:border-r-0 ${isToday ? 'bg-teal-50/90 text-teal-950 font-extrabold' : ''
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide">{WEEKDAYS[idx].short}</span>
                        {isToday && (
                          <span className="text-[9px] font-extrabold bg-teal-700 text-white px-1 py-0.2 rounded-xs uppercase">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-bold mt-0.5 ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
                        {dayNum}/{monthNum}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Grid Container */}
              <div className="relative divide-y divide-slate-100">
                {TIME_SLOTS.map((hourStr) => (
                  <div key={hourStr} className="grid grid-cols-8 min-h-[92px]">
                    {/* Time Label Column */}
                    <div className="p-2 border-r border-slate-200/80 bg-slate-50/40 text-xs font-bold text-slate-500 flex items-center justify-center">
                      {hourStr}
                    </div>

                    {/* 7 Day Matrix Cells */}
                    {weekDaysList.map((d, dayIdx) => {
                      const cellEvents = getEventsForCell(dayIdx, hourStr);

                      return (
                        <div
                          key={dayIdx}
                          className="p-1.5 border-r border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors relative min-h-[92px] flex flex-col justify-start gap-1.5 overflow-visible group"
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

                            const hasValidCode = event.patientCode && event.patientCode !== 'N/A' && event.patientCode !== 'null';

                            return (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                title="Nhấp vào để xem hồ sơ khám & kê đơn thuốc"
                                className={`w-full p-2 rounded-sm shadow-2xs cursor-pointer space-y-1 text-left ${style.cardBg}`}
                              >
                                {isUrgent && (
                                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-1.5 py-0.5 w-max">
                                    <span>🚨 Cấp cứu</span>
                                  </div>
                                )}

                                {/* Top Row: Time & Status Badge */}
                                <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1">
                                  <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                    <Clock size={11} className={style.iconColor} /> {timeRange}
                                  </div>
                                  <span className={`rounded-sm px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${style.badgeBg}`}>
                                    {style.label}
                                  </span>
                                </div>

                                {/* Patient Name, Code & Phone */}
                                <div className="space-y-0.5 pt-0.5">
                                  <p className="font-extrabold text-xs text-slate-900 leading-snug break-words flex items-center justify-between gap-1">
                                    <span>{event.patientName || event.fullName || 'Bệnh nhân'}</span>
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                    {hasValidCode && (
                                      <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200/80 rounded-sm px-1 py-0.2 text-[9px]">
                                        {event.patientCode}
                                      </span>
                                    )}
                                    {event.phone && (
                                      <span className="font-medium text-slate-500">
                                        📞 {event.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Service / Reason */}
                                <p className="text-[11px] font-semibold text-teal-900 leading-tight flex items-start gap-1 pt-0.5">
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
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarIcon size={16} className="text-teal-700" />
              Lịch khám chi tiết ngày: <span className="text-teal-700">{currentDate.toLocaleDateString('vi-VN')}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Tổng số ca: <strong className="text-slate-900 font-extrabold">{appointments.length}</strong>
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
                      <div className="text-xs text-slate-300 italic border border-dashed border-slate-200 rounded-sm p-2">
                        Khung giờ trống
                      </div>
                    ) : (
                      matchingEvents.map((apt) => {
                        const style = getStatusCardStyle(apt.status);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => handleEventClick(apt)}
                            className={`flex items-center justify-between p-3 rounded-sm border cursor-pointer hover:shadow-2xs transition-all ${style.cardBg}`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{apt.patientName}</p>
                              <p className="text-[11px] text-teal-700 font-medium">{apt.reason}</p>
                            </div>
                            <span className={`rounded-sm px-2.5 py-0.5 text-[10px] font-extrabold ${style.badgeBg}`}>
                              {style.label}
                            </span>
                          </div>
                        );
                      })
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
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          {/* Month Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-teal-50 text-teal-700 border border-teal-200">
                <CalendarIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Lịch khám Tháng {String(currentDate.getMonth() + 1).padStart(2, '0')} / {currentDate.getFullYear()}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Tổng hợp ca khám theo từng ngày trong tháng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-sm font-bold">
                <CheckCircle2 size={13} /> {weekStats.completed} ca hoàn thành
              </span>
              <span className="flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-sm font-bold">
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
                      className={`p-2 min-h-[95px] flex flex-col justify-start gap-1 transition-colors ${!item.isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300'
                        : isToday
                          ? 'bg-teal-50/70 font-bold'
                          : 'bg-white hover:bg-slate-50/80'
                        }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-extrabold px-1.5 py-0.2 rounded-sm ${isToday
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : item.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-300'
                            }`}
                        >
                          {cellDate.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-1 py-0.2 rounded-sm">
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
                              className={`p-1 rounded-sm border border-slate-200 text-[10px] cursor-pointer hover:shadow-2xs transition-all text-left truncate ${style.cardBg}`}
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
                            className="text-[9px] font-extrabold text-teal-800 hover:underline cursor-pointer text-center bg-teal-50 border border-teal-100 py-0.5 rounded-sm"
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
        <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          {/* List View Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-teal-50 text-teal-700 border border-teal-200">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Lịch sử khám bệnh 1 tuần qua ({dateRangeLabel})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
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
                className="w-full sm:w-64 rounded-sm border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* List Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Thời gian & Ngày</th>
                  <th className="py-2.5 px-3">Bệnh nhân</th>
                  <th className="py-2.5 px-3">Bác sĩ & Phòng</th>
                  <th className="py-2.5 px-3">Dịch vụ & Chẩn đoán</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
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
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        {/* Time & Date */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">{formattedDateStr}</div>
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-teal-600" /> {timeRangeStr}
                          </div>
                        </td>

                        {/* Patient Info */}
                        <td className="py-2.5 px-3">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {apt.patientName || apt.fullName || 'Bệnh nhân'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                            {apt.patientCode && apt.patientCode !== 'N/A' && (
                              <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded-sm">
                                {apt.patientCode}
                              </span>
                            )}
                            {apt.phone && (
                              <span className="text-slate-500 font-medium">📞 {apt.phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Doctor & Room */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
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
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="font-bold text-teal-950 text-xs truncate">
                            {apt.reason || apt.service || 'Khám tổng quát nha khoa'}
                          </div>
                          {apt.diagnosis ? (
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              Chẩn đoán: <span className="text-slate-700 font-semibold">{apt.diagnosis}</span>
                            </div>
                          ) : isUrgent ? (
                            <div className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-1 py-0.2 mt-0.5">
                              🚨 Ca cấp cứu
                            </div>
                          ) : null}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`rounded-sm px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider inline-block ${style.badgeBg}`}>
                            {style.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEventClick(apt)}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-teal-600 bg-teal-50/80 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
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
    </div>
  );
}
