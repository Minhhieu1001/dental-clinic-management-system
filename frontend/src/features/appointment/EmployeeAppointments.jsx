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
  ListFilter,
  History,
  Activity,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getDentistsList } from '../../services/dentist.service';
import { getAppointments, getAppointmentById, updateAppointment } from '../../services/appointment.service';
import { getAppointmentRequestToday, updateAppointmentRequestStatus } from '../../services/appointmentRequest.service';
import CreateAppointmentModal from '../../components/ui/CreateAppointmentModal';
import AppointmentDetail from '../dashboard/receptionist/action/AppointmentDetail';

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
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
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

export default function EmployeeAppointments() {
  const { user } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [selectedDentistId, setSelectedDentistId] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Role Scope Filter: 'ALL' | 'MY_CREATED' | 'WEB_REQUESTS'
  const [creatorScopeFilter, setCreatorScopeFilter] = useState('ALL');

  // View state: 'WEEK' | 'DAY' | 'MONTH' | 'LIST'
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
  const [modalType, setModalType] = useState('add');

  const currentUsername = user?.username || user?.email?.split('@')[0] || 'employee01';

  // Fetch BACKEND DATA from both Appointments & Online Appointment Requests
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
              branchId: req.branchId || null,
              branchName: req.branchName || 'Chưa xác định chi nhánh',
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

  // Realtime WebSocket for live appointment updates in EmployeeAppointments
  const handleRealtimeAppointment = useCallback((updatedApt) => {
    if (!updatedApt || !updatedApt.id) return;
    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === updatedApt.id);
      if (exists) {
        return prev.map((item) => (item.id === updatedApt.id ? { ...item, ...updatedApt } : item));
      } else {
        return [updatedApt, ...prev];
      }
    });
  }, []);

  useWebSocket(handleRealtimeAppointment, null);

  // Handle Confirm & Schedule Online Request OR Edit / Reschedule Existing Appointment
  const handleOpenScheduleModal = async (apt) => {
    if (!apt) return;

    // Check if it's an online request that hasn't been scheduled as an appointment yet
    const isNewOnlineRequest = Boolean(
      apt.isOnlineRequest && (apt.status === 'PENDING' || (!apt.dentistId && !apt.dentistName))
    );

    if (isNewOnlineRequest) {
      setModalType('add');
      setSelectedRequestData({
        requestId: apt.id,
        fullName: apt.patientName || apt.fullName || '',
        phone: apt.phone || '',
        description: apt.reason || apt.notes || '',
        reason: apt.reason || apt.description || 'Tư vấn khám tổng quát',
        notes: apt.notes || apt.description || '',
        branchId: apt.branchId || null,
        branchName: apt.branchName || 'Chưa xác định chi nhánh',
        appointmentDate: apt.appointmentDate ? String(apt.appointmentDate).replace(' ', 'T').split('T')[0] : new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
      });
      setIsCreateModalOpen(true);
      return;
    }

    // Existing appointment: Mode is 'edit'
    let fullApt = { ...apt };
    if (apt.id && !String(apt.id).startsWith('mock-')) {
      try {
        const res = await getAppointmentById(apt.id);
        if (res) fullApt = { ...apt, ...res };
      } catch (err) {
        console.warn('Lỗi lấy chi tiết lịch hẹn:', err);
      }
    }

    setModalType('edit');
    setSelectedRequestData({
      ...fullApt,
      id: fullApt.id,
      appointmentId: fullApt.id,
      patientId: fullApt.patientId || null,
      patientName: fullApt.patientName || fullApt.fullName || '',
      fullName: fullApt.patientName || fullApt.fullName || '',
      phone: fullApt.phone || '',
      gender: fullApt.gender || 'Nam',
      dob: fullApt.dob || '',
      dentistId: fullApt.dentistId || null,
      dentistName: fullApt.dentistName || null,
      roomId: fullApt.roomId || null,
      roomName: fullApt.roomName || null,
      appointmentDate: fullApt.appointmentDate || null,
      appointmentTime: fullApt.appointmentTime || null,
      reason: fullApt.reason || fullApt.service || fullApt.notes || '',
      notes: fullApt.notes || '',
      status: fullApt.status || null,
      branchId: fullApt.branchId || null,
      branchName: fullApt.branchName || '',
      branchAddress: fullApt.branchAddress || '',
      createdAt: fullApt.createdAt || fullApt.createAt || null,
      allowReschedule: true,
    });
    setIsCreateModalOpen(true);
  };

  // Rejection Confirmation Dialog States
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Detail Modal State (khi double click hoặc xem lịch hẹn đã hủy/từ chối)
  const [detailApt, setDetailApt] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetailModal = (apt) => {
    if (!apt) return;
    let timeStr = '09:00';
    if (apt.appointmentTime) {
      try {
        const d = new Date(apt.appointmentTime);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        timeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
      }
    }
    setDetailApt({
      ...apt,
      time: timeStr,
      service: apt.service || apt.reason || 'Tư vấn nha khoa',
      dentist: apt.dentist || apt.dentistName || 'Bác sĩ điều trị',
      cancelReason: apt.notes || apt.rejectReason || apt.description || '',
    });
    setIsDetailOpen(true);
  };

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
    const finalReason = rejectReason.trim() || 'Lễ tân từ chối lịch hẹn';
    try {
      if (aptId && !String(aptId).startsWith('mock-')) {
        await updateAppointmentRequestStatus(aptId, 'CANCELLED', { notes: finalReason }).catch(() =>
          updateAppointment(aptId, { status: 'CANCELLED', notes: finalReason })
        );
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED', notes: finalReason } : a))
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
    if (viewMode === 'WEEK' || viewMode === 'LIST') newD.setDate(newD.getDate() - 7);
    else if (viewMode === 'DAY') newD.setDate(newD.getDate() - 1);
    else if (viewMode === 'MONTH') newD.setMonth(newD.getMonth() - 1);
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'WEEK' || viewMode === 'LIST') newD.setDate(newD.getDate() + 7);
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

  // Date range display label (e.g. 05 - 11 / 10 / 2026)
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

  // Dynamic Time Slots
  const displayTimeSlots = useMemo(() => {
    const hoursSet = new Set([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);

    appointments.forEach((apt) => {
      const d = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
      if (d) {
        hoursSet.add(d.getHours());
      }
    });

    return Array.from(hoursSet)
      .sort((a, b) => a - b)
      .map((h) => `${String(h).padStart(2, '0')}:00`);
  }, [appointments]);

  // Check if appointment was created by current employee or online
  const isApptByCurrentEmp = useCallback(
    (apt) => {
      if (!apt.employeeId && !apt.employeeName) return false;
      const empName = (apt.employeeName || '').toLowerCase();
      const curName = (currentUsername || '').toLowerCase();
      return empName.includes(curName) || (user?.id && apt.employeeId === user.id);
    },
    [currentUsername, user]
  );

  const isApptFromWeb = useCallback((apt) => {
    return !apt.employeeId && !apt.employeeName;
  }, []);

  // Live real-time stats count filtered STRICTLY by currently displayed date range
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

      const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate) || new Date();

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

  // Filter 7-day appointments list for LIST view
  const listFilteredAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        // Doctor Filter
        if (selectedDentistId !== 'ALL' && apt.dentistId && apt.dentistId !== selectedDentistId) {
          return false;
        }

        // Creator Scope Filter
        if (creatorScopeFilter === 'MY_CREATED' && !isApptByCurrentEmp(apt)) {
          return false;
        }
        if (creatorScopeFilter === 'WEB_REQUESTS' && !isApptFromWeb(apt)) {
          return false;
        }

        // Search Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchName = (apt.patientName || apt.fullName || '').toLowerCase().includes(q);
          const matchPhone = (apt.phone || '').includes(q);
          const matchCode = (apt.patientCode || '').toLowerCase().includes(q);
          const matchReason = (apt.reason || apt.service || '').toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCode && !matchReason) return false;
        }

        // Receptionist Status Filter
        const isUnassigned = !apt.dentistId && !apt.dentistName;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'UNASSIGNED' && apt.status !== 'PENDING' && !isUnassigned) return false;
          if (statusFilter === 'SCHEDULED' && (apt.status === 'CANCELLED' || apt.status === 'REJECTED' || apt.status === 'PENDING' || isUnassigned)) return false;
          if (statusFilter === 'REJECTED' && apt.status !== 'CANCELLED' && apt.status !== 'REJECTED') return false;
        }

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

        return true;
      })
      .sort((a, b) => {
        const dA = parseAppointmentDateTime(a.appointmentTime, a.appointmentDate);
        const dB = parseAppointmentDateTime(b.appointmentTime, b.appointmentDate);
        return (dB ? dB.getTime() : 0) - (dA ? dA.getTime() : 0);
      });
  }, [appointments, selectedDentistId, creatorScopeFilter, searchTerm, statusFilter, currentDate, isApptByCurrentEmp, isApptFromWeb]);

  const calendarDays = useMemo(() => {
    if (viewMode === 'DAY') return [currentDate];
    return weekDaysList;
  }, [viewMode, currentDate, weekDaysList]);

  // Filter APPOINTMENTS matching dayOrIdx and hourStr for Receptionist view
  const getEventsForCell = (dayOrIdx, hourStr) => {
    const targetDayDate = typeof dayOrIdx === 'number' ? weekDaysList[dayOrIdx] : dayOrIdx;
    if (!targetDayDate) return [];

    const targetYear = targetDayDate.getFullYear();
    const targetMonth = targetDayDate.getMonth();
    const targetDateNum = targetDayDate.getDate();
    const targetHourNum = parseInt(hourStr.split(':')[0], 10);

    return appointments.filter((apt) => {
      // Doctor Filter
      if (selectedDentistId !== 'ALL' && apt.dentistId && apt.dentistId !== selectedDentistId) {
        return false;
      }

      // Creator Scope Filter
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

      // Receptionist Status Filter
      const isUnassigned = !apt.dentistId && !apt.dentistName;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'UNASSIGNED' && apt.status !== 'PENDING' && !isUnassigned) return false;
        if (statusFilter === 'SCHEDULED' && (apt.status === 'CANCELLED' || apt.status === 'REJECTED' || apt.status === 'PENDING' || isUnassigned)) return false;
        if (statusFilter === 'REJECTED' && apt.status !== 'CANCELLED' && apt.status !== 'REJECTED') return false;
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

      const aptDateObj = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
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
        cardBg: 'bg-rose-50/90 border-l-rose-500 text-rose-950 hover:bg-rose-100/80 hover:shadow-2xs',
        badgeBg: 'bg-rose-600 text-white font-extrabold',
        label: 'Từ chối',
        iconColor: 'text-rose-600',
        type: 'REJECTED',
      };
    }

    if (status === 'PENDING' || isUnassigned) {
      return {
        cardBg: 'bg-amber-50/90 border-l-amber-500 text-amber-950 hover:bg-amber-100/80 hover:shadow-2xs',
        badgeBg: 'bg-amber-500 text-white font-extrabold',
        label: 'Chưa lên lịch',
        iconColor: 'text-amber-600',
        type: 'UNASSIGNED',
      };
    }

    return {
      cardBg: 'bg-[#F0FDF4] border-l-teal-600 text-teal-950 hover:bg-teal-100/80 hover:shadow-2xs',
      badgeBg: 'bg-teal-700 text-white font-extrabold',
      label: 'Đã lên lịch',
      iconColor: 'text-teal-700',
      type: 'SCHEDULED',
    };
  };

  const now = new Date();

  return (
    <div className="w-full px-1 sm:px-2 py-2 space-y-3 text-slate-800 text-xs font-sans">
      {/* 0. Hero Receptionist Dashboard Banner - Minimal & Clean */}
      <div className="rounded-sm bg-white p-4 text-slate-800 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Receptionist & Clinic Room Profile */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-teal-50 text-teal-700 border border-teal-200/90 shrink-0">
              <CalendarIcon size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
                  LỊCH TIẾP NHẬN & XẾP LỊCH HẸN BỆNH NHÂN
                </h1>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200/80 uppercase">
                  NHÂN VIÊN LỄ TÂN
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                Nha khoa Quốc tế Crown Dental • Quản lý tiếp nhận lịch hẹn trực tuyến, phân công bác sĩ & xếp lịch khám cho bệnh nhân.
              </p>
            </div>
          </div>

          {/* Right: Metric Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-slate-500 font-medium text-[11px]">Tổng ca tuần:</span>
              <strong className="text-slate-900 font-extrabold">{weekStats.total}</strong>
            </div>
            <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-amber-700 font-medium text-[11px]">Chưa lên lịch:</span>
              <strong className="text-amber-950 font-extrabold">{weekStats.unassigned}</strong>
            </div>
            <div className="flex items-center gap-2 bg-teal-50/80 border border-teal-200 text-teal-900 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-teal-700 font-medium text-[11px]">Đã lên lịch:</span>
              <strong className="text-teal-950 font-extrabold">{weekStats.scheduled}</strong>
            </div>
            <div className="flex items-center gap-2 bg-rose-50/80 border border-rose-200 text-rose-900 rounded-sm px-3 py-1.5 shadow-2xs">
              <span className="text-rose-700 font-medium text-[11px]">Từ chối:</span>
              <strong className="text-rose-950 font-extrabold">{weekStats.rejected}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Header Navigation Bar (Receptionist Control Bar - Sleek & Modern) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Left Date Range Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          <button
            type="button"
            onClick={handleToday}
            className="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hôm nay
          </button>

          <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight ml-1">
            {dateRangeLabel}
          </span>
        </div>

        {/* Right View Mode Controls & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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

          {/* Add Appointment Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedRequestData(null);
              setModalType('add');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-sm bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Tạo lịch hẹn</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAppointmentsData}
            disabled={loading}
            title="Làm mới lịch khám"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Dynamic Stacked Distribution Bar & Interactive KPI Cards Grid */}
      <div className="rounded-sm border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Top Line: Title & Filter Controls */}
        <div className="space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
              <Activity size={15} className="text-teal-700" />
              <span>Phân bổ lịch hẹn tuần ({dateRangeLabel})</span>
            </div>

            {/* Receptionist Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Creator Scope Filter Buttons */}
              <div className="flex items-center gap-0.5 rounded-sm bg-slate-100/90 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreatorScopeFilter('ALL')}
                  className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${creatorScopeFilter === 'ALL'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorScopeFilter('MY_CREATED')}
                  className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${creatorScopeFilter === 'MY_CREATED'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  Tại quầy
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorScopeFilter('WEB_REQUESTS')}
                  className={`rounded-sm px-3 py-1 text-xs font-bold transition-all cursor-pointer ${creatorScopeFilter === 'WEB_REQUESTS'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                >
                  Trực tuyến
                </button>
              </div>

              {/* Dentist Selector Dropdown */}
              <div className="flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                <Stethoscope size={14} className="text-teal-700 shrink-0" />
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

              {/* Quick Search Input */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên BN, SĐT, mã BN..."
                  className="w-full sm:w-52 rounded-sm border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Multi-color Stacked Progress Bar */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80 shadow-2xs">
            {weekStats.total === 0 ? (
              <div className="h-full w-full bg-slate-200/80 rounded-full" title="Chưa có lịch hẹn nào trong tuần" />
            ) : (
              <>
                {weekStats.unassigned > 0 && (
                  <div
                    style={{ width: `${(weekStats.unassigned / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Chưa lên lịch: ${weekStats.unassigned} (${Math.round((weekStats.unassigned / weekStats.total) * 100)}%)`}
                  />
                )}
                {weekStats.scheduled > 0 && (
                  <div
                    style={{ width: `${(weekStats.scheduled / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Đã lên lịch: ${weekStats.scheduled} (${Math.round((weekStats.scheduled / weekStats.total) * 100)}%)`}
                  />
                )}
                {weekStats.rejected > 0 && (
                  <div
                    style={{ width: `${(weekStats.rejected / weekStats.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`Từ chối: ${weekStats.rejected} (${Math.round((weekStats.rejected / weekStats.total) * 100)}%)`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Metric Cards Grid below the progress bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-xs select-none">
          {/* Card 1: Tất cả */}
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${statusFilter === 'ALL'
              ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600'
              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            title="Nhấp để xem tất cả lịch hẹn"
          >
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-extrabold">TỔNG LỊCH HẸN</div>
              <div className="text-xs font-extrabold text-slate-900 mt-0.5">{weekStats.total} ca hẹn</div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">100%</span>
          </div>

          {/* Card 2: Chưa lên lịch */}
          <div
            onClick={() => setStatusFilter('UNASSIGNED')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${statusFilter === 'UNASSIGNED'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500'
              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            title="Nhấp để lọc ca chưa xếp bác sĩ"
          >
            <div>
              <div className="text-[10px] text-amber-700 uppercase font-extrabold">CHƯA LÊN LỊCH</div>
              <div className="text-xs font-extrabold text-amber-950 mt-0.5">{weekStats.unassigned} ca</div>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">
              {weekStats.total > 0 ? Math.round((weekStats.unassigned / weekStats.total) * 100) : 0}%
            </span>
          </div>

          {/* Card 3: Đã lên lịch */}
          <div
            onClick={() => setStatusFilter('SCHEDULED')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${statusFilter === 'SCHEDULED'
              ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-600'
              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            title="Nhấp để lọc ca đã lên lịch thành công"
          >
            <div>
              <div className="text-[10px] text-teal-700 uppercase font-extrabold">ĐÃ LÊN LỊCH</div>
              <div className="text-xs font-extrabold text-teal-950 mt-0.5">{weekStats.scheduled} ca</div>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-teal-200">
              {weekStats.total > 0 ? Math.round((weekStats.scheduled / weekStats.total) * 100) : 0}%
            </span>
          </div>

          {/* Card 4: Từ chối */}
          <div
            onClick={() => setStatusFilter('REJECTED')}
            className={`rounded-sm p-2 px-2.5 border flex items-center justify-between shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 ${statusFilter === 'REJECTED'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500'
              : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
              }`}
            title="Nhấp để lọc ca đã bị từ chối / hủy"
          >
            <div>
              <div className="text-[10px] text-rose-700 uppercase font-extrabold">TỪ CHỐI</div>
              <div className="text-xs font-extrabold text-rose-950 mt-0.5">{weekStats.rejected} ca</div>
            </div>
            <span className="text-[11px] font-bold text-rose-800 bg-white px-1.5 py-0.5 rounded border border-rose-200">
              {weekStats.total > 0 ? Math.round((weekStats.rejected / weekStats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 Unassigned Requests Quick Schedule Alert Bar */}
      {weekStats.unassigned > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-amber-200 bg-amber-50/90 p-3 px-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-xs animate-pulse">
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
            className="shrink-0 rounded-sm bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
          >
            Xem ngay ({weekStats.unassigned})
          </button>
        </div>
      )}

      {/* 2.8 LIST VIEW MODE (LỊCH SỬ DẠNG DANH SÁCH 7 NGÀY) */}
      {viewMode === 'LIST' && (
        <div className="rounded-sm border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListFilter size={16} className="text-teal-700" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Danh sách tiếp nhận lịch hẹn ({dateRangeLabel})
              </h3>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {listFilteredAppointments.length} kết quả
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Sắp xếp theo thời gian gần nhất
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/90 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Bệnh nhân</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Chi nhánh</th>
                  <th className="p-3">Bác sĩ phụ trách</th>
                  <th className="p-3">Dịch vụ / Lý do</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listFilteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  listFilteredAppointments.map((apt) => {
                    const style = getStatusCardStyle(apt);
                    const aptDate = parseAppointmentDateTime(apt.appointmentTime, apt.appointmentDate);
                    const dateStr = aptDate
                      ? `${String(aptDate.getDate()).padStart(2, '0')}/${String(aptDate.getMonth() + 1).padStart(2, '0')}/${aptDate.getFullYear()} ${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`
                      : 'Chưa xác định';

                    const isCancelled = style.type === 'REJECTED';

                    return (
                      <tr
                        key={apt.id}
                        onDoubleClick={() => handleOpenDetailModal(apt)}
                        title={isCancelled ? "Ca đã hủy / từ chối - Double click để xem chi tiết & lý do hủy" : "Double click để xem chi tiết ca khám"}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900">
                          {apt.patientName || apt.fullName || 'Bệnh nhân'}
                          {apt.patientCode && (
                            <span className="ml-1.5 text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded">
                              {apt.patientCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-600">
                          {apt.phone || 'Chưa có'}
                        </td>
                        <td className="p-3 font-semibold text-teal-800 max-w-[180px] truncate">
                          {apt.branchName || 'Chưa xác định chi nhánh'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {apt.dentistName || <span className="text-amber-600 italic">Chưa phân công</span>}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {apt.reason || apt.service || 'Khám tổng quát'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${style.badgeBg}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {style.type === 'REJECTED' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenDetailModal(apt)}
                                className="px-2.5 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold shadow-2xs cursor-pointer"
                              >
                                Chi tiết hủy
                              </button>
                            ) : style.type === 'UNASSIGNED' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(apt)}
                                  className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                                >
                                  Từ chối
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenScheduleModal(apt)}
                                  className="px-2.5 py-1 rounded bg-teal-700 text-white hover:bg-teal-800 text-[10px] font-bold shadow-2xs cursor-pointer"
                                >
                                  + Xếp lịch
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(apt)}
                                className="px-2.5 py-1 rounded border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-[10px] font-bold shadow-2xs cursor-pointer"
                              >
                                Đổi lịch / BS
                              </button>
                            )}
                          </div>
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

      {/* 3. Receptionist Calendar View Content (WEEK MATRIX VIEW / DAY VIEW) */}
      {(viewMode === 'WEEK' || viewMode === 'DAY') && (
        <div className="rounded-sm border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className={`w-full ${viewMode === 'DAY' ? 'min-w-[600px]' : 'min-w-[1100px]'} relative`}>
              {/* Matrix Table Header: Days of the Week */}
              <div className={`grid ${viewMode === 'DAY' ? 'grid-cols-2' : 'grid-cols-8'} border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-700`}>
                {/* Time slot column title */}
                <div className="p-3 border-r border-slate-200 text-slate-400 font-semibold text-[11px] flex items-center justify-center">
                  Giờ / Ngày
                </div>

                {/* Days Header */}
                {calendarDays.map((d, idx) => {
                  const isToday =
                    d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();

                  const dayNum = String(d.getDate()).padStart(2, '0');
                  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
                  const wdIndex = (d.getDay() + 6) % 7;

                  return (
                    <div
                      key={idx}
                      className={`p-3 border-r border-slate-200 last:border-r-0 ${isToday ? 'bg-teal-50/90 text-teal-950 font-extrabold border-b-2 border-b-teal-600' : ''
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-extrabold uppercase">{WEEKDAYS[wdIndex]?.short || 'CN'}</span>
                        {isToday && (
                          <span className="bg-teal-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">
                            HÔM NAY
                          </span>
                        )}
                      </div>
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
                {displayTimeSlots.map((hourStr) => (
                  <div key={hourStr} className={`grid ${viewMode === 'DAY' ? 'grid-cols-2' : 'grid-cols-8'} min-h-[96px]`}>
                    {/* Time Label Column */}
                    <div className="p-2 border-r border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-500 flex items-center justify-center">
                      {hourStr}
                    </div>

                    {/* Day Matrix Cells */}
                    {calendarDays.map((d, dayIdx) => {
                      const cellEvents = getEventsForCell(d, hourStr);

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

                            const isCancelled = style.type === 'REJECTED';

                            return (
                              <div
                                key={event.id}
                                onDoubleClick={() => handleOpenDetailModal(event)}
                                title={isCancelled ? "Ca đã hủy / từ chối - Double click để xem chi tiết & lý do hủy" : "Double click để xem chi tiết ca khám"}
                                className={`w-full p-2.5 rounded-sm border-l-[3.5px] shadow-2xs hover:shadow-md transition-all space-y-1.5 overflow-hidden text-left cursor-pointer ${style.cardBg}`}
                              >
                                {isUrgent && (
                                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-rose-700 bg-rose-100/90 border border-rose-200 rounded px-1.5 py-0.5 w-max">
                                    <span>🚨 Ca cấp cứu</span>
                                  </div>
                                )}

                                {/* Top Row: Time & Status Badge */}
                                <div className="space-y-1 border-b border-slate-200/60 pb-1.5">
                                  <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                    <Clock size={11} className={style.iconColor} /> {timeRange}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`rounded-sm px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${style.badgeBg}`}>
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
                                      <span className="font-extrabold text-teal-800 bg-teal-100/70 border border-teal-200/80 rounded px-1 py-0.2 text-[9px]">
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

                                  {style.type === 'REJECTED' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDetailModal(event)}
                                      className="w-full flex items-center justify-center gap-1 rounded-sm bg-white border border-rose-200 hover:bg-rose-50 py-1 text-[10px] font-extrabold text-rose-800 shadow-2xs transition-colors mt-0.5 cursor-pointer"
                                    >
                                      <Eye size={11} className="text-rose-600" />
                                      Xem chi tiết & Lý do hủy
                                    </button>
                                  ) : style.type === 'UNASSIGNED' ? (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRejectModal(event)}
                                        className="flex-1 rounded-sm border border-slate-200 bg-white py-1 text-[10px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors text-center cursor-pointer"
                                      >
                                        Từ chối
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenScheduleModal(event)}
                                        className="flex-[1.4] rounded-sm bg-teal-700 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-teal-800 transition-colors text-center cursor-pointer"
                                      >
                                        + Xếp lịch
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenScheduleModal(event)}
                                      className="w-full flex items-center justify-center gap-1 rounded-sm bg-white border border-teal-200/90 hover:bg-teal-50 py-1 text-[10px] font-extrabold text-teal-800 shadow-2xs transition-colors mt-0.5 cursor-pointer"
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
        <div className="rounded-sm border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          {/* Month Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-teal-50 text-teal-700 border border-teal-200">
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
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded font-bold">
                <Clock size={13} /> {weekStats.unassigned} chưa xếp lịch
              </span>
              <span className="flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded font-bold">
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
                      className={`p-2 min-h-[95px] flex flex-col justify-start gap-1 transition-colors ${!item.isCurrentMonth
                        ? 'bg-slate-50/50 text-slate-300'
                        : isToday
                          ? 'bg-teal-50/70 font-bold'
                          : 'bg-white hover:bg-slate-50/80'
                        }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-extrabold px-1.5 py-0.2 rounded ${isToday
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : item.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-300'
                            }`}
                        >
                          {cellDate.getDate()}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-1 py-0.2 rounded">
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

                          const isAptCancelled = style.type === 'REJECTED';
                          return (
                            <div
                              key={apt.id}
                              onClick={() => {
                                if (isAptCancelled) {
                                  handleOpenDetailModal(apt);
                                } else {
                                  handleOpenScheduleModal(apt);
                                }
                              }}
                              onDoubleClick={() => handleOpenDetailModal(apt)}
                              title={isAptCancelled ? "Ca đã hủy - Double click để xem chi tiết & lý do" : "Click để đổi lịch, Double click xem chi tiết"}
                              className={`p-1 rounded border border-slate-200 text-[10px] cursor-pointer hover:shadow-2xs transition-all text-left truncate ${style.cardBg}`}
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
                            className="text-[9px] font-extrabold text-teal-800 hover:underline cursor-pointer text-center bg-teal-50 border border-teal-100 py-0.5 rounded"
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

      {/* Create / Schedule / Edit Appointment Modal for Receptionist */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedRequestData(null);
          setModalType('add');
        }}
        type={modalType}
        payload={selectedRequestData}
        initialData={selectedRequestData}
        onSuccess={fetchAppointmentsData}
      />

      {/* Rejection Confirmation Modal */}
      {isRejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-sm bg-white p-5 shadow-xl space-y-4 border border-rose-100">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-rose-100">
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded bg-rose-50/70 border border-rose-100 p-3 space-y-1 text-xs text-slate-700">
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
                    className={`px-2.5 py-1 rounded border font-medium transition-all ${rejectReason === r
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
                className="w-full rounded border border-slate-200 p-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={confirmRejectRequest}
                className="flex items-center gap-1.5 rounded bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal (Xem thông tin ca khám & lý do hủy) */}
      <AppointmentDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailApt(null);
        }}
        appointment={detailApt}
      />
    </div>
  );
}
