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
  Search,
  Filter,
  Phone,
  UserCheck,
  Globe,
  UserCheck2,
  UserPlus,
  XCircle,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getDentistsList } from '../../services/dentist.service';
import { getAppointments, updateAppointmentStatus } from '../../services/appointment.service';
import { getAppointmentRequestToday, updateAppointmentRequestStatus } from '../../services/appointmentRequest.service';
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

export default function EmployeeAppointments() {
  const { user } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [selectedDentistId, setSelectedDentistId] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Role Scope Filter: 'ALL' | 'MY_CREATED' | 'WEB_REQUESTS'
  const [creatorScopeFilter, setCreatorScopeFilter] = useState('ALL');

  // View state: 'WEEK' | 'DAY' | 'MONTH'
  const [viewMode, setViewMode] = useState('WEEK');
  
  // Receptionist Status Filter: 'ALL' | 'UNASSIGNED' | 'SCHEDULED' | 'REJECTED'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Date Navigation State (Current week start date)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestData, setSelectedRequestData] = useState(null);

  const currentUsername = user?.username || user?.email?.split('@')[0] || 'employee01';

  // Fetch 100% REAL BACKEND DATA from both Appointments & Online Appointment Requests
  const fetchAppointmentsData = useCallback(async () => {
    setLoading(true);
    try {
      const [dentistsList, apptsList, requestsList] = await Promise.all([
        getDentistsList().catch(() => []),
        getAppointments().catch(() => []),
        getAppointmentRequestToday().catch(() => []),
      ]);

      setDentists(Array.isArray(dentistsList) ? dentistsList : []);

      let mergedList = [];
      
      // 1. Add clinic appointments
      if (Array.isArray(apptsList)) {
        mergedList = apptsList.map((apt) => ({
          ...apt,
          isOnlineRequest: false,
        }));
      }

      // 2. Add online appointment requests needing scheduling from Backend API
      if (Array.isArray(requestsList)) {
        requestsList.forEach((req) => {
          // Check if request is already converted into a formal appointment
          const isAlreadyProcessed = mergedList.some(
            (a) => a.requestIdStr === req.id || a.id === req.id
          );

          if (!isAlreadyProcessed) {
            const reqStatus = req.statustAppointmentRequest || req.status || 'PENDING';
            let mappedStatus = 'PENDING';
            if (reqStatus === 'COMPLETED') mappedStatus = 'CONFIRMED';
            else if (reqStatus === 'CANCELLED' || reqStatus === 'REJECTED') mappedStatus = 'REJECTED';

            mergedList.push({
              id: req.id || `req-${Math.random()}`,
              patientName: req.fullName || req.full_name || 'Khách hàng Web',
              phone: req.phone || '',
              reason: req.description || req.descriptions || 'Đặt lịch trực tuyến qua Web',
              appointmentTime: req.createAt || req.createdAt || new Date().toISOString(),
              appointmentDate: req.createAt || req.createdAt || new Date().toISOString(),
              status: mappedStatus,
              dentistId: req.dentistId || null,
              dentistName: req.dentistName || null,
              employeeId: req.employeeId || null,
              employeeName: req.employeeId ? 'employee01' : null,
              isOnlineRequest: true,
            });
          }
        });
      }


      setAppointments(mergedList);
    } catch (err) {
      console.warn('Lỗi tải danh sách lịch hẹn Lễ tân từ Backend:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointmentsData();
  }, [fetchAppointmentsData]);

  // Handle Confirm & Schedule Online Request
  const handleOpenScheduleModal = (apt) => {
    setSelectedRequestData({
      fullName: apt.patientName || apt.fullName,
      phone: apt.phone,
      description: apt.reason || apt.notes,
      requestId: apt.id,
    });
    setIsCreateModalOpen(true);
  };

  // Rejection Confirmation Dialog States
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Trigger Reject Confirmation Modal
  const handleOpenRejectModal = (apt) => {
    setRejectTarget(apt);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Confirm Reject Request
  const confirmRejectRequest = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    const aptId = rejectTarget.id;
    try {
      if (aptId && !String(aptId).startsWith('mock-')) {
        await updateAppointmentRequestStatus(aptId, 'CANCELLED').catch(() =>
          updateAppointmentStatus(aptId, 'CANCELLED')
        );
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED' } : a))
      );
      toast.success(`Đã từ chối lịch hẹn của ${rejectTarget.patientName || rejectTarget.fullName || 'bệnh nhân'}`);
      setIsRejectModalOpen(false);
      setRejectTarget(null);
    } catch (err) {
      console.warn('Lỗi từ chối yêu cầu đặt lịch:', err);
      toast.error('Không thể từ chối yêu cầu đặt lịch');
    } finally {
      setIsRejecting(false);
    }
  };

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

  // Check if appointment was created by current employee or online
  const isApptByCurrentEmp = useCallback((apt) => {
    if (!apt.employeeId && !apt.employeeName) return false;
    const empName = (apt.employeeName || '').toLowerCase();
    const curName = (currentUsername || '').toLowerCase();
    return empName.includes(curName) || (user?.id && apt.employeeId === user.id);
  }, [currentUsername, user]);

  const isApptFromWeb = useCallback((apt) => {
    return !apt.employeeId && !apt.employeeName;
  }, []);

  // Live real-time stats count filtered STRICTLY by currently displayed date range & doctor filter for Receptionist Role
  const weekStats = useMemo(() => {
    let unassigned = 0;
    let scheduled = 0;
    let rejected = 0;
    let filteredCount = 0;
    let myCreatedCount = 0;
    let webRequestCount = 0;

    if (weekDaysList.length === 0) {
      return { unassigned: 0, scheduled: 0, rejected: 0, total: 0, myCreatedCount: 0, webRequestCount: 0 };
    }

    const startWeek = new Date(weekDaysList[0]);
    startWeek.setHours(0, 0, 0, 0);

    const endWeek = new Date(weekDaysList[weekDaysList.length - 1]);
    endWeek.setHours(23, 59, 59, 999);

    appointments.forEach((apt) => {
      // Doctor filter check
      if (selectedDentistId !== 'ALL' && apt.dentistId !== selectedDentistId) {
        return;
      }

      // Search term check
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (apt.patientName || '').toLowerCase().includes(term);
        const matchesPhone = (apt.phone || '').includes(term);
        const matchesCode = (apt.patientCode || '').toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesCode) return;
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

      if (!aptDateObj) aptDateObj = new Date();

      // Check date range
      if (aptDateObj >= startWeek && aptDateObj <= endWeek) {
        filteredCount++;

        if (isApptByCurrentEmp(apt)) myCreatedCount++;
        if (isApptFromWeb(apt)) webRequestCount++;

        const isUnassigned = !apt.dentistId && !apt.dentistName;

        if (apt.status === 'CANCELLED' || apt.status === 'REJECTED') {
          rejected++;
        } else if (apt.status === 'PENDING' || isUnassigned) {
          unassigned++;
        } else {
          scheduled++; // SCHEDULED / CONFIRMED / WAITING / IN_PROGRESS / COMPLETED
        }
      }
    });

    return { unassigned, scheduled, rejected, total: filteredCount, myCreatedCount, webRequestCount };
  }, [appointments, weekDaysList, selectedDentistId, searchTerm, isApptByCurrentEmp, isApptFromWeb]);

  // Filter 100% REAL DATABASE APPOINTMENTS matching dayIdx and hourStr for Receptionist view
  const getEventsForCell = (dayIdx, hourStr) => {
    const targetDayDate = weekDaysList[dayIdx];
    if (!targetDayDate) return [];

    const targetYear = targetDayDate.getFullYear();
    const targetMonth = targetDayDate.getMonth();
    const targetDateNum = targetDayDate.getDate();
    const targetHourNum = parseInt(hourStr.split(':')[0], 10);

    return appointments.filter((apt) => {
      // Doctor Filter (Only filter if appointment has an assigned dentist)
      if (selectedDentistId !== 'ALL' && apt.dentistId && apt.dentistId !== selectedDentistId) {
        return false;
      }


      // Creator Scope Filter (Do tôi tạo vs Web vs Tất cả)
      if (creatorScopeFilter === 'MY_CREATED' && !isApptByCurrentEmp(apt)) {
        return false;
      }
      if (creatorScopeFilter === 'WEB_REQUESTS' && !isApptFromWeb(apt)) {
        return false;
      }

      // Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (apt.patientName || '').toLowerCase().includes(term);
        const matchesPhone = (apt.phone || '').includes(term);
        const matchesCode = (apt.patientCode || '').toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesCode) return false;
      }

      // Receptionist Status Filter (Chưa lên lịch | Đã lên lịch | Từ chối)
      const isUnassigned = !apt.dentistId && !apt.dentistName;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'UNASSIGNED' && apt.status !== 'PENDING' && !isUnassigned) return false;
        if (statusFilter === 'SCHEDULED' && (apt.status === 'CANCELLED' || apt.status === 'REJECTED' || apt.status === 'PENDING' || isUnassigned)) return false;
        if (statusFilter === 'REJECTED' && apt.status !== 'CANCELLED' && apt.status !== 'REJECTED') return false;
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

  // Month View Days Grid Calculation for Receptionist
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
      if (selectedDentistId !== 'ALL' && apt.dentistId !== selectedDentistId) return false;
      if (creatorScopeFilter === 'MY_CREATED' && !isApptByCurrentEmp(apt)) return false;
      if (creatorScopeFilter === 'WEB_REQUESTS' && !isApptFromWeb(apt)) return false;

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

      return (
        aptDateObj.getFullYear() === targetYear &&
        aptDateObj.getMonth() === targetMonth &&
        aptDateObj.getDate() === targetDateNum
      );
    });
  };

  // Status color styles & label mapping tailored SPECIFICALLY for Employee (Receptionist) role
  const getStatusCardStyle = (apt) => {
    const status = apt?.status;
    const isUnassigned = !apt?.dentistId && !apt?.dentistName;

    if (status === 'CANCELLED' || status === 'REJECTED') {
      return {
        cardBg: 'bg-rose-50/90 border-l-rose-500 text-rose-950 hover:bg-rose-100/80 hover:shadow-sm',
        badgeBg: 'bg-rose-600 text-white font-extrabold',
        label: 'Từ chối',
        iconColor: 'text-rose-600',
        type: 'REJECTED',
      };
    }

    if (status === 'PENDING' || isUnassigned) {
      return {
        cardBg: 'bg-amber-50/90 border-l-amber-500 text-amber-950 hover:bg-amber-100/80 hover:shadow-sm',
        badgeBg: 'bg-amber-500 text-white font-extrabold',
        label: 'Chưa lên lịch',
        iconColor: 'text-amber-600',
        type: 'UNASSIGNED',
      };
    }

    // CONFIRMED / WAITING / IN_PROGRESS / COMPLETED
    return {
      cardBg: 'bg-teal-50/90 border-l-teal-600 text-teal-950 hover:bg-teal-100/80 hover:shadow-sm',
      badgeBg: 'bg-teal-700 text-white font-extrabold',
      label: 'Đã lên lịch',
      iconColor: 'text-teal-700',
      type: 'SCHEDULED',
    };
  };

  // Creator Badge for Card showing WHICH Employee confirmed & scheduled
  const getCreatorBadge = (apt) => {
    const isScheduled = apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' || apt.status === 'COMPLETED' || apt.status === 'IN_PROGRESS' || apt.dentistId;
    const empName = apt.employeeName || (apt.employeeId ? (currentUsername || 'employee02') : (isScheduled ? currentUsername : null));

    if (empName) {
      const isMe = empName.toLowerCase().includes(currentUsername.toLowerCase()) || (user?.id && apt.employeeId === user.id);
      return (
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold border ${
          isMe
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200/90 shadow-2xs'
            : 'bg-slate-100 text-slate-800 border-slate-200'
        }`}>
          <UserCheck2 size={10} className={isMe ? 'text-emerald-600' : 'text-slate-500'} />
          <span>NV xác nhận: <strong className="font-black text-slate-950">{empName}</strong></span>
        </span>
      );
    }

    // Web request without employee assignment yet
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200/80">
        <Globe size={10} className="text-amber-600" />
        <span>Yêu cầu Web (Chờ phân công)</span>
      </span>
    );
  };



  // Current real-time indicator line position
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const showRedLine = currentHour >= 7 && currentHour <= 17;
  const redLineTopPercent = ((currentHour - 7 + currentMin / 60) / 11) * 100;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 bg-[#F4F7F6]/60 min-h-screen text-slate-800 font-sans">
      {/* 1. Header Navigation Bar (Receptionist Control Bar) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-[4px] border border-slate-200 bg-white p-4 shadow-xs">
        {/* Left Date Range & Navigation */}
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

        {/* Center & Right Receptionist Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Creator Scope Filter Toggle (Do tôi tạo | Web/Hotline | Tất cả) */}
          <div className="flex items-center gap-1 rounded-[4px] bg-slate-100/90 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setCreatorScopeFilter('ALL')}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                creatorScopeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({weekStats.total})
            </button>

            <button
              type="button"
              onClick={() => setCreatorScopeFilter('MY_CREATED')}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                creatorScopeFilter === 'MY_CREATED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Do tôi tạo ({weekStats.myCreatedCount})
            </button>

            <button
              type="button"
              onClick={() => setCreatorScopeFilter('WEB_REQUESTS')}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
                creatorScopeFilter === 'WEB_REQUESTS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Web / Hotline ({weekStats.webRequestCount})
            </button>
          </div>

          {/* Doctor Selection Dropdown */}
          <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Stethoscope size={15} className="text-teal-700 shrink-0" />
            <select
              value={selectedDentistId}
              onChange={(e) => setSelectedDentistId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Tất cả bác sĩ nha khoa</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.fullName || 'Bác sĩ'}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Quick Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên, SĐT, mã BN..."
              className="w-36 sm:w-44 rounded-[4px] border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* View Mode Toggle Pill (Ngày | Tuần | Tháng) */}
          <div className="flex items-center gap-1 rounded-[4px] bg-slate-100/90 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('DAY')}
              className={`rounded-[4px] px-3 py-1 text-xs font-bold transition-all ${
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
              className={`rounded-[4px] px-3 py-1 text-xs font-bold transition-all ${
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
              className={`rounded-[4px] px-3 py-1 text-xs font-bold transition-all ${
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
            onClick={() => {
              setSelectedRequestData(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-[4px] bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800 transition-all"
          >
            <Plus size={16} />
            <span>Tạo lịch hẹn</span>

          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAppointmentsData}
            disabled={loading}
            title="Làm mới lịch khám"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Receptionist Live Status Filter Strip (Strictly: Chưa lên lịch | Đã lên lịch | Từ chối) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white p-3 sm:px-5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Bộ lọc:</span>

          {/* Tất cả */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả <span className="rounded-[3px] bg-white/20 px-1.5 py-0.2 text-[10px]">{weekStats.total}</span>
          </button>

          {/* Chưa lên lịch */}
          <button
            type="button"
            onClick={() => setStatusFilter('UNASSIGNED')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Chưa lên lịch
            <span className="rounded-[3px] bg-amber-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.unassigned}</span>
          </button>

          {/* Đã lên lịch */}
          <button
            type="button"
            onClick={() => setStatusFilter('SCHEDULED')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'SCHEDULED'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-teal-50 text-teal-900 border border-teal-200/80 hover:bg-teal-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Đã lên lịch
            <span className="rounded-[3px] bg-teal-800/30 px-1.5 py-0.2 text-[10px]">{weekStats.scheduled}</span>
          </button>

          {/* Từ chối */}
          <button
            type="button"
            onClick={() => setStatusFilter('REJECTED')}
            className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Từ chối
            <span className="rounded-[4px] bg-rose-700/30 px-1.5 py-0.2 text-[10px]">{weekStats.rejected}</span>
          </button>
        </div>

        <div className="text-[11px] font-medium text-slate-400 hidden lg:block">
          * Quy trình Lễ tân: Chưa lên lịch ➔ Đã lên lịch ➔ Từ chối
        </div>
      </div>

      {/* 2.5 Unassigned Requests Quick Schedule Alert Bar */}
      {weekStats.unassigned > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-amber-200 bg-amber-50/90 p-3.5 px-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-xs animate-pulse">
              {weekStats.unassigned}
            </span>
            <div>
              <p className="text-xs font-extrabold text-amber-950">
                Có {weekStats.unassigned} yêu cầu đặt lịch hẹn trực tuyến từ bệnh nhân chưa lên lịch!
              </p>
              <p className="text-[11px] text-amber-800 font-medium">
                Vui lòng kiểm tra và bấm "Xác nhận & Đặt lịch" để xếp Bác sĩ & phòng khám.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('UNASSIGNED')}
            className="shrink-0 rounded-[4px] bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
          >
            Xem ngay ({weekStats.unassigned})
          </button>
        </div>
      )}


      {/* 3. Receptionist Calendar View Content (WEEK MATRIX VIEW) */}
      {viewMode === 'WEEK' && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="w-full min-w-[1100px] relative">
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
                  <div key={hourStr} className="grid grid-cols-8 min-h-[96px]">
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
                          className="p-1.5 border-r border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors relative min-h-[96px] flex flex-col justify-start gap-2 overflow-visible"
                        >

                          {cellEvents.map((event) => {
                            const style = getStatusCardStyle(event);
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
                                className={`w-full p-2.5 rounded-[4px] border-l-[4px] shadow-2xs hover:shadow-md transition-all space-y-1.5 overflow-hidden text-left ${style.cardBg}`}
                              >
                                {/* Urgent Alert Tag if Emergency */}
                                {isUrgent && (
                                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100/90 border border-rose-200 rounded-[3px] px-1.5 py-0.5 w-max">
                                    <span>🚨 Ca cấp cứu</span>
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
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                    {event.patientCode && (
                                      <span className="font-extrabold text-teal-800 bg-teal-100/70 border border-teal-200/80 rounded-[3px] px-1 py-0.2 text-[9px]">
                                        {event.patientCode}
                                      </span>
                                    )}
                                    {event.phone && (
                                      <span className="font-semibold text-slate-500 flex items-center gap-0.5">
                                        <Phone size={10} className="text-slate-400 shrink-0" /> {event.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Doctor & Room Info */}
                                <div className="space-y-0.5 text-[10px]">
                                  <div className="font-semibold text-slate-700 flex items-center gap-1 truncate">
                                    <Stethoscope size={11} className="text-teal-700 shrink-0" />
                                    <span className="truncate font-bold">
                                      {event.dentistName ? event.dentistName : '⚠️ Chưa phân công BS'}
                                    </span>
                                  </div>

                                  {event.roomName && (
                                    <div className="text-slate-500 font-medium flex items-center gap-1 truncate">
                                      <Building size={11} className="text-amber-600 shrink-0" />
                                      <span className="truncate">{event.roomName}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Service / Reason */}
                                <div className="text-[11px] font-extrabold text-teal-950 leading-tight flex items-start gap-1">
                                  <FileText size={11} className="text-teal-700 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{event.reason || event.service || 'Khám tổng quát'}</span>
                                </div>

                                {/* Confirmer & Action Footer */}
                                <div className="pt-1.5 border-t border-slate-200/60 flex flex-col gap-1">
                                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                                    <span className="flex items-center gap-1 text-slate-600 truncate">
                                      <UserCheck size={10} className="text-teal-600 shrink-0" /> NV: <strong className="font-extrabold text-slate-800 truncate">{event.employeeName || currentUsername}</strong>
                                    </span>
                                  </div>

                                  {style.type === 'UNASSIGNED' ? (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRejectModal(event)}
                                        className="flex-1 rounded-[4px] border border-slate-200 bg-white py-1 text-[10px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors text-center"
                                      >
                                        Từ chối
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenScheduleModal(event)}
                                        className="flex-[1.4] rounded-[4px] bg-teal-700 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-teal-800 transition-colors text-center"
                                      >
                                        + Xếp lịch
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenScheduleModal(event)}
                                      className="w-full flex items-center justify-center gap-1 rounded-[4px] bg-white border border-teal-200/90 hover:bg-teal-50 py-1 text-[10px] font-extrabold text-teal-800 shadow-2xs transition-colors mt-0.5"
                                    >
                                      <CheckCircle2 size={11} className="text-teal-600" />
                                      Xếp / Đổi lịch
                                    </button>
                                  )}
                                </div>
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

      {/* 4. RECEPTIONIST MONTH VIEW MODE */}
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
                  Lịch phòng khám Tháng {String(currentDate.getMonth() + 1).padStart(2, '0')} / {currentDate.getFullYear()}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tổng quan tất cả lịch hẹn bệnh nhân trong tháng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-[3px] font-bold">
                <Clock size={13} /> {weekStats.unassigned} chưa xếp lịch
              </span>
              <span className="flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-[3px] font-bold">
                <CheckCircle2 size={13} /> {weekStats.scheduled} đã lên lịch
              </span>
            </div>
          </div>

          {/* Month Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-extrabold text-slate-700 uppercase py-2">
                <div>Thứ 2</div>
                <div>Thứ 3</div>
                <div>Thứ 4</div>
                <div>Thứ 5</div>
                <div>Thứ 6</div>
                <div>Thứ 7</div>
                <div className="text-rose-600">Chủ nhật</div>
              </div>

              {/* Month Days Grid */}
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

                      {/* Day Appointments List */}
                      <div className="space-y-1 mt-0.5 overflow-hidden">
                        {dayAppts.slice(0, 2).map((apt) => {
                          const style = getStatusCardStyle(apt);
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
                              onClick={() => {
                                setSelectedRequestData(apt);
                                setIsCreateModalOpen(true);
                              }}
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
                              setViewMode('WEEK');
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

      {/* Create / Schedule Appointment Modal for Receptionist */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedRequestData(null);
        }}
        initialData={selectedRequestData}
        onSuccess={fetchAppointmentsData}
      />

      {/* Rejection Confirmation Modal */}
      {isRejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[4px] bg-white p-5 shadow-xl space-y-4 border border-rose-100">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-rose-100">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">Xác nhận từ chối lịch hẹn</h3>
                  <p className="text-xs text-slate-500 font-medium">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-[4px] hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-[4px] bg-rose-50/70 border border-rose-100 p-3 space-y-1 text-xs text-slate-700">
              <p><strong>Bệnh nhân:</strong> <span className="font-bold text-slate-900">{rejectTarget.patientName || rejectTarget.fullName || rejectTarget.name}</span></p>
              {rejectTarget.phone && <p><strong>SĐT:</strong> {rejectTarget.phone}</p>}
              {(rejectTarget.reason || rejectTarget.description) && (
                <p><strong>Dịch vụ/Lý do:</strong> {rejectTarget.reason || rejectTarget.description}</p>
              )}
            </div>

            {/* Quick Reason Options */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Lý do từ chối (Tùy chọn):</label>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['Lịch kín', 'Bệnh nhân báo hủy', 'Không liên lạc được', 'Khác'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectReason(r)}
                    className={`px-2.5 py-1 rounded-[4px] border font-medium transition-all ${
                      rejectReason === r
                        ? 'bg-rose-600 text-white border-rose-600 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                className="w-full rounded-[4px] border border-slate-200 p-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="rounded-[4px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={confirmRejectRequest}
                className="flex items-center gap-1.5 rounded-[4px] bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
