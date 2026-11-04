import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CalendarCheck,
  CalendarPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  LayoutGrid,
  Calendar as CalendarIcon,
  Clock3,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Check,
  Trash2,
  Eye,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CalendarDays,
  CheckCheck,
  CalendarClock,
  ArrowUpRight,
  Activity,
  RefreshCw,
  Edit3,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import {
  getAppointmentsByPatient,
  getMyAppointments,
  updateAppointment,
} from '../../services/appointment.service';
import { getFollowUpAppointments } from '../../services/followUpAppointment.service';
import { getPatientById, getPatientByPatientCode } from '../../services/patient.service';
import {
  canModifyAppointment,
  checkAppointmentModifiable,
  canEditAppointment,
  checkAppointmentCreationEditable,
} from '../../utils/appointmentTimeCheck';
import PatientBookingModal from './patient/PatientBookingModal';
import Loading from '../../components/ui/Loading';

// Helper: Format Date & Time
const formatDateTime = (dateStr, timeStr) => {
  try {
    let d = dateStr ? new Date(dateStr) : null;
    let dateFormatted = d && !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : (dateStr || '--');
    let dayOfWeek = '';
    if (d && !isNaN(d.getTime())) {
      const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      dayOfWeek = days[d.getDay()];
    }
    let timeFormatted = timeStr || '09:00';
    if (timeStr && timeStr.includes('T')) {
      const t = new Date(timeStr);
      timeFormatted = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
    return { date: dateFormatted, time: timeFormatted, dayOfWeek, rawDate: d };
  } catch (e) {
    return { date: dateStr || '--', time: timeStr || '--', dayOfWeek: '', rawDate: null };
  }
};

const formatYMD = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// Avatar helper with fallback to doctor initials
const DoctorAvatar = ({ src, name, className = 'h-10 w-10' }) => {
  const [imgError, setImgError] = useState(false);
  const initials = useMemo(() => {
    if (!name) return 'BS';
    const clean = name.replace(/^BS\.?\s*/i, '').replace(/^ThS\.?\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  }, [name]);

  if (!src || imgError) {
    return (
      <div
        className={`${className} rounded-full bg-emerald-50 text-[#009766] border border-emerald-200/80 flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} rounded-full object-cover border border-slate-200 shrink-0 shadow-xs`}
    />
  );
};

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Mở modal đặt lịch khám mới
  const handleOpenNewBookingModal = () => {
    setEditingAppointment(null);
    setIsBookingModalOpen(true);
  };

  // Mở modal chỉnh sửa thông tin đặt lịch (trong vòng 1h kể từ khi đặt lịch)
  const handleOpenEditBookingModal = (apt) => {
    if (!apt) return;
    const check = checkAppointmentCreationEditable(apt);
    if (!check.canEdit) {
      toast.error(check.reason);
      return;
    }
    setEditingAppointment(apt);
    setIsBookingModalOpen(true);
    if (isDetailOpen) {
      handleCloseDetail();
    }
  };

  // View modes: 'GRID' (Card), 'CALENDAR' (Lịch), 'TIMELINE' (Dòng thời gian)
  const [viewMode, setViewMode] = useState('GRID');

  // Filter Tabs: ALL, UPCOMING, COMPLETED, CANCELLED
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected appointment for detail modal (smooth transition)
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailActive, setIsDetailActive] = useState(false);

  // Cancel modal state (smooth transition)
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [isCancelActive, setIsCancelActive] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Smooth handlers for Detail Modal
  const handleOpenDetail = (apt) => {
    setSelectedAppointment(apt);
    setIsDetailOpen(true);
    setTimeout(() => {
      setIsDetailActive(true);
    }, 20);
  };

  const handleCloseDetail = () => {
    setIsDetailActive(false);
    setTimeout(() => {
      setIsDetailOpen(false);
      setSelectedAppointment(null);
    }, 200);
  };

  // Smooth handlers for Cancel Modal
  const handleOpenCancel = (id) => {
    const apt = appointments.find((a) => a.id === id) || (selectedAppointment?.id === id ? selectedAppointment : null);
    if (apt) {
      const check = checkAppointmentModifiable(apt);
      if (!check.canModify) {
        toast.error(check.reason);
        return;
      }
    }
    setCancellingId(id);
    setShowCancelConfirmModal(true);
    setTimeout(() => {
      setIsCancelActive(true);
    }, 20);
  };

  const handleCloseCancel = () => {
    setIsCancelActive(false);
    setTimeout(() => {
      setShowCancelConfirmModal(false);
      setCancellingId(null);
      setCancelReasonText('');
    }, 200);
  };

  // Close modals smoothly on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCancelConfirmModal) {
          handleCloseCancel();
        } else if (isDetailOpen) {
          handleCloseDetail();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCancelConfirmModal, isDetailOpen]);

  // Lock background scrolling completely when modal is open
  useEffect(() => {
    if (isDetailOpen || showCancelConfirmModal) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
      };
    }
  }, [isDetailOpen, showCancelConfirmModal]);

  // Calendar View State
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(formatYMD(today));

  // Fetch appointments belonging strictly to this logged-in patient
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let actualPatientId = user?.patientId;
      let actualPhone = user?.phone || user?.phoneNumber || (typeof localStorage !== 'undefined' ? localStorage.getItem('patient_phone') : null);

      // 1. Resolve actual patient ID if user.patientId is missing or user.patientId === user.id
      if (!actualPatientId || !isValidUUID(actualPatientId)) {
        if (user?.patientCode) {
          try {
            const pRes = await getPatientByPatientCode(user.patientCode);
            const pData = pRes?.data || pRes;
            if (pData?.id) {
              actualPatientId = pData.id;
              if (pData.phoneNumber) actualPhone = pData.phoneNumber;
            }
          } catch (e) {
            console.warn('Lookup by patientCode failed:', e);
          }
        }

        if ((!actualPatientId || !isValidUUID(actualPatientId)) && user?.id) {
          try {
            const pRes = await getPatientById(user.id);
            const pData = pRes?.data || pRes;
            if (pData?.id) {
              actualPatientId = pData.id;
              if (pData.phoneNumber) actualPhone = pData.phoneNumber;
            }
          } catch (e) {
            console.warn('Lookup by user.id failed:', e);
          }
        }
      }

      const pLookupId = actualPatientId || user?.patientId || user?.id;
      let data = [];
      if (pLookupId) {
        try {
          data = await getAppointmentsByPatient(pLookupId);
        } catch (e) {
          console.warn('getAppointmentsByPatient error:', e);
        }
      }

      // 2. Fallback to /my-appointments if needed
      if ((!data || data.length === 0) && user) {
        try {
          const myAppts = await getMyAppointments();
          if (Array.isArray(myAppts) && myAppts.length > 0) {
            data = myAppts;
          }
        } catch (e) {
          console.warn('getMyAppointments error:', e);
        }
      }

      let list = Array.isArray(data) ? data : [];

      // 3. Strict Patient Data Integrity Filter:
      // Guarantee that whoever logs in only sees their own appointments
      if (list.length > 0) {
        list = list.filter((apt) => {
          if (actualPatientId && (apt.patientId === actualPatientId || apt.patientId === user?.id)) return true;
          if (actualPhone && apt.phone && apt.phone.trim() === actualPhone.trim()) return true;
          if (user?.patientCode && apt.patientCode && apt.patientCode === user.patientCode) return true;
          if (user?.username && apt.patientName && apt.patientName.toLowerCase() === user.username.toLowerCase()) return true;
          return !apt.patientId || apt.patientId === pLookupId;
        });
      }

      // 4. Lấy danh sách Lịch tái khám (Follow-up) từ bác sĩ/lễ tân để hiển thị đầy đủ
      let followUps = [];
      try {
        const fuData = await getFollowUpAppointments({
          patientId: pLookupId,
          patientCode: user?.patientCode,
        });
        if (Array.isArray(fuData) && fuData.length > 0) {
          followUps = fuData.map((fu) => ({
            id: fu.id,
            type: 'FOLLOW_UP',
            typeLabel: 'Lịch tái khám',
            isFollowUp: true,
            patientId: fu.patientId,
            patientName: fu.patientName || user?.username,
            dentistName: fu.dentistName,
            appointmentDate: fu.followUpDate,
            appointmentTime: fu.followUpDate ? fu.followUpDate.split('T')[1] : '09:00:00',
            reason: fu.reason || fu.chiefComplaint || 'Tái khám định kỳ',
            notes: fu.note,
            status: fu.status !== false ? 'DOCTOR_ORDERED' : 'CANCELLED',
            branchId: fu.branchId,
            branchName: fu.branchName || '',
            branchAddress: fu.branchAddress || '',
            raw: fu,
          }));
        }
      } catch (fuErr) {
        console.warn('Lỗi khi tải lịch tái khám:', fuErr);
      }

      const mergedList = [
        ...list.map((a) => ({ ...a, type: a.type || 'APPOINTMENT', typeLabel: a.typeLabel || 'Lịch hẹn' })),
        ...followUps,
      ];

      setAppointments(mergedList);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách lịch hẹn:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const handleCreated = () => {
      fetchAppointments();
    };
    window.addEventListener('appointment_created', handleCreated);
    return () => window.removeEventListener('appointment_created', handleCreated);
  }, [user]);

  // Handle Cancel Appointment
  const handleConfirmCancelAppointment = async () => {
    if (!cancellingId) return;
    try {
      await updateAppointment(cancellingId, {
        status: 'CANCELLED',
        notes: cancelReasonText ? `Bệnh nhân hủy hẹn: ${cancelReasonText}` : 'Bệnh nhân tự hủy lịch hẹn qua cổng trực tuyến',
      });
      toast.success('Đã hủy lịch hẹn thành công!');
      handleCloseCancel();
      if (selectedAppointment?.id === cancellingId) {
        handleCloseDetail();
      }
      fetchAppointments();
    } catch (err) {
      console.error('Lỗi khi hủy lịch hẹn:', err);
      toast.error('Không thể hủy lịch hẹn. Vui lòng thử lại hoặc liên hệ hotline phòng khám!');
    }
  };

  // Status Badge Helper - Đồng bộ 100% với Employee (appointmentStatusConfig)
  const getStatusBadge = (status, item = null) => {
    // 1. Đối với Lịch tái khám (Do Bác sĩ chỉ định)
    if (item?.type === 'FOLLOW_UP' || item?.isFollowUp || status === 'DOCTOR_ORDERED') {
      if (status === 'CANCELLED' || item?.status === false || item?.raw?.status === false) {
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <AlertCircle className="h-3 w-3" />
            Đã hủy
          </span>
        );
      }
      return null;
    }

    // 2. Đối với Lịch hẹn khám (APPOINTMENT từ API)
    const st = typeof status === 'string' ? status.toUpperCase().trim() : '';
    switch (st) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Chưa đến
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Chờ xác nhận
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Đang chờ khám
          </span>
        );
      case 'CALLED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Gọi vào
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Activity className="h-3 w-3" />
            Đang điều trị
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Check className="h-3 w-3" />
            Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <AlertCircle className="h-3 w-3" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Chưa đến
          </span>
        );
    }
  };

  // Metrics calculation
  const stats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

    // Nearest upcoming appointment
    const sortedUpcoming = [...upcoming].sort((a, b) => {
      const da = new Date(a.appointmentDate || 0);
      const db = new Date(b.appointmentDate || 0);
      return da - db;
    });
    const nextAppt = sortedUpcoming[0] || null;

    return {
      total,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      nextAppt,
    };
  }, [appointments]);

  // Filtered Appointments based on search and status tabs
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const serviceName = apt.reason || apt.serviceName || '';
      const doctorName = apt.dentistName || '';
      const branchName = apt.branchName || '';
      const aptId = String(apt.id || '');

      const matchesSearch =
        serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aptId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'UPCOMING') {
        return apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';
      }
      if (activeTab === 'COMPLETED') {
        return apt.status === 'COMPLETED';
      }
      if (activeTab === 'CANCELLED') {
        return apt.status === 'CANCELLED';
      }
      return true;
    });
  }, [appointments, searchQuery, activeTab]);

  // Calendar generation for CALENDAR view mode
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 7 : startDay; // T2 = 1, CN = 7

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Prev month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i > 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i + 1);
      days.push({
        date: d,
        dateString: formatYMD(d),
        dayNumber: prevMonthLastDay - i + 1,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = formatYMD(d);
      days.push({
        date: d,
        dateString: dStr,
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Next month days to reach 42 cells
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateString: formatYMD(d),
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarMonth]);

  // Appointments on selected calendar date
  const appointmentsOnSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return appointments.filter((apt) => {
      if (!apt.appointmentDate) return false;
      return formatYMD(apt.appointmentDate) === selectedCalendarDate;
    });
  }, [appointments, selectedCalendarDate]);

  // Map of dates that have appointments for calendar dot indicators
  const appointmentDatesMap = useMemo(() => {
    const map = new Map();
    appointments.forEach((apt) => {
      if (apt.appointmentDate) {
        const ymd = formatYMD(apt.appointmentDate);
        if (!map.has(ymd)) map.set(ymd, []);
        map.get(ymd).push(apt);
      }
    });
    return map;
  }, [appointments]);

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto px-0 sm:px-0 py-0.5 sm:py-1 font-sans animate-in fade-in duration-150">
      {/* ================= TOP BANNER: CROWN DENTAL PATIENT PORTAL ================= */}
      <div
        className="rounded-xl p-3.5 sm:p-5 text-white shadow-md shadow-emerald-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-5 relative overflow-hidden border border-emerald-600/30"
        style={{
          background: 'linear-gradient(135deg, #015e3f 0%, #008055 45%, #009766 85%, #01a36e 100%)',
        }}
      >
        {/* Ambient background decoration & glow mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none blur-xl" />
        <div className="absolute right-44 -top-16 w-36 h-36 rounded-full bg-emerald-300/[0.08] pointer-events-none blur-lg" />

        {/* Left: Branding & Page Title */}
        <div className="relative z-10 min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner shrink-0">
              <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                  Lịch Hẹn Của Tôi
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Crown Dental Clinic
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-emerald-50/90 font-medium mt-1 max-w-xl leading-relaxed">
                Theo dõi tiến trình khám nha khoa, kết nối bác sĩ chuyên khoa và cập nhật hồ sơ điều trị điện tử.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Primary Call to action */}
        <div className="relative z-10 flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={handleOpenNewBookingModal}
            className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-white text-[#009766] hover:bg-emerald-50 text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/20 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <div className="h-5 w-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-[#009766] group-hover:bg-[#009766] group-hover:text-white transition-colors duration-200">
              <CalendarPlus className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span>Đặt lịch khám mới</span>
          </button>
        </div>
      </div>

      {/* ================= 4 COMPACT STAT CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Tổng cuộc hẹn */}
        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Tổng cuộc hẹn
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1">
              {stats.total}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium gap-1">
            <span className="truncate">Đã đồng bộ</span>
            <span className="shrink-0">Toàn bộ</span>
          </div>
        </div>

        {/* Card 2: Lịch hẹn sắp tới */}
        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Lịch hẹn sắp tới
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1">
              {stats.upcomingCount}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium gap-1">
            <span className="inline-flex items-center gap-1 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Chờ khám
            </span>
            <span className="shrink-0">Đã lên lịch</span>
          </div>
        </div>

        {/* Card 3: Đã khám xong */}
        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Đã khám xong
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1">
              {stats.completedCount}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium gap-1">
            <span className="truncate">Lịch sử khám</span>
            <span className="shrink-0">Hoàn tất</span>
          </div>
        </div>

        {/* Card 4: Hẹn gần nhất */}
        <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              Hẹn gần nhất
            </span>
            {stats.nextAppt ? (
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  {formatDateTime(stats.nextAppt.appointmentDate, stats.nextAppt.appointmentTime).date}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {formatDateTime(stats.nextAppt.appointmentDate, stats.nextAppt.appointmentTime).time}
                </span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-400 mt-1">
                Chưa có lịch hẹn mới
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium gap-1">
            <span className="truncate">
              {stats.nextAppt
                ? (stats.nextAppt.reason || 'Sắp tới')
                : 'Lên lịch ngay'}
            </span>
            <span className="shrink-0">Nhắc hẹn</span>
          </div>
        </div>
      </div>

      {/* ================= FILTER TOOLBAR & VIEW CONTROLS ================= */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Segmented Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/60 overflow-x-auto scrollbar-none gap-1">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'UPCOMING', label: 'Sắp tới' },
            { id: 'COMPLETED', label: 'Đã khám' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer select-none shrink-0 ${isActive
                    ? 'bg-white text-slate-900 font-extrabold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 font-semibold hover:bg-white/60'
                  }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search Input + View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm dịch vụ, bác sĩ, cơ sở..."
              className="w-full pl-8.5 pr-8 py-1.5 rounded-lg border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009766]/20 focus:border-[#009766] transition-all bg-slate-50/60 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Modes Switcher: Grid vs Calendar vs Timeline */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/60 shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer select-none ${viewMode === 'GRID'
                  ? 'bg-white text-[#009766] shadow-xs font-bold border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              title="Dạng xem thẻ"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Thẻ</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('CALENDAR')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer select-none ${viewMode === 'CALENDAR'
                  ? 'bg-white text-[#009766] shadow-xs font-bold border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              title="Dạng xem lịch"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Lịch</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer select-none ${viewMode === 'TIMELINE'
                  ? 'bg-white text-[#009766] shadow-xs font-bold border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              title="Dạng xem dòng thời gian"
            >
              <Clock3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Lộ trình</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body per View Mode */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loading />
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-white p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-[#009766] flex items-center justify-center mx-auto border border-emerald-100">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy lịch hẹn phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Bạn chưa có lịch hẹn khám nào trong danh mục đã chọn. Hãy bấm nút dưới đây để đăng ký lịch khám nha khoa nhanh chóng.
          </p>
          <button
            type="button"
            onClick={handleOpenNewBookingModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009766] hover:bg-[#028562] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            Đặt lịch khám ngay
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* ================= 1. DẠNG XEM THẺ (GRID VIEW) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((apt) => {
            const dt = formatDateTime(apt.appointmentDate, apt.appointmentTime);
            const isUpcoming = apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Header */}
                <div className="p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#009766] transition-colors">
                        {apt.reason || 'Khám răng tổng quát'}
                      </span>
                      {apt.type === 'FOLLOW_UP' ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0">
                          <RefreshCw className="h-2.5 w-2.5" />
                          Lịch tái khám
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold border bg-teal-50 text-teal-700 border-teal-200 shrink-0">
                          <Calendar className="h-2.5 w-2.5" />
                          Lịch hẹn
                        </span>
                      )}
                    </div>
                    {getStatusBadge(apt.status, apt)}
                  </div>

                  {/* Date & Time Highlight Box */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80">
                    <div className="h-9 w-9 rounded-md bg-[#009766] text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[8px] font-bold uppercase">
                        {dt.dayOfWeek
                          ? dt.dayOfWeek.startsWith('Thứ ')
                            ? `T.${dt.dayOfWeek.split(' ')[1]}`
                            : dt.dayOfWeek === 'Chủ nhật'
                              ? 'CN'
                              : dt.dayOfWeek.substring(0, 3)
                          : 'HẸN'}
                      </span>
                      <span className="text-xs font-extrabold leading-none">{dt.date.split('/')[0] || '01'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">{dt.dayOfWeek ? `${dt.dayOfWeek}, ${dt.date}` : dt.date}</p>
                      <p className="text-xs font-extrabold text-[#009766] mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dt.time}
                      </p>
                    </div>
                  </div>

                  {/* Doctor & Location Info */}
                  <div className="space-y-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2.5">
                      <DoctorAvatar src={apt.dentistAvatar} name={apt.dentistName} className="h-7 w-7" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">{apt.dentistName || 'Bác sĩ chuyên khoa'}</span>
                        <span className="text-[10px] text-slate-400 block">Bác sĩ phụ trách khám</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#009766] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        {apt.branchName && (
                          <span className="text-slate-700 font-medium block truncate">{apt.branchName}</span>
                        )}
                        {Boolean(apt.branchAddress || apt.addressBranch) && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{apt.branchAddress || apt.addressBranch}</span>
                        )}
                      </div>
                    </div>

                    {apt.roomName && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Building className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>Phòng khám: <strong>{apt.roomName}</strong></span>
                      </div>
                    )}

                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2 italic">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    #{String(apt.id || '').substring(0, 8)}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => {
                          const check = checkAppointmentModifiable(apt);
                          if (!check.canModify) {
                            toast.error(check.reason);
                            return;
                          }
                          handleOpenCancel(apt.id);
                        }}
                        disabled={!canModifyAppointment(apt)}
                        title={!canModifyAppointment(apt) ? checkAppointmentModifiable(apt).reason : 'Hủy lịch hẹn'}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                          canModifyAppointment(apt)
                            ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                            : 'text-slate-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Hủy hẹn
                      </button>
                    )}

                    {/* Nút Chỉnh sửa (Áp dụng trong vòng 1h kể từ khi đặt lịch - Chỉ lịch hẹn, không áp dụng lịch tái khám) */}
                    {apt.type !== 'FOLLOW_UP' && !apt.isFollowUp && isUpcoming && (
                      (() => {
                        const editCheck = checkAppointmentCreationEditable(apt);
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenEditBookingModal(apt)}
                            disabled={!editCheck.canEdit}
                            title={
                              editCheck.canEdit
                                ? 'Chỉnh sửa lại thông tin đặt lịch (trong vòng 1h kể từ khi đặt)'
                                : editCheck.reason
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shadow-2xs ${
                              editCheck.canEdit
                                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer'
                                : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Chỉnh sửa</span>
                          </button>
                        );
                      })()
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(apt)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-[#e6f7f0] border border-slate-200 hover:border-[#009766]/50 text-[#009766] rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'CALENDAR' ? (
        /* ================= 2. DẠNG XEM LỊCH (CALENDAR VIEW) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 animate-in fade-in duration-150">
          {/* Cột Trái: Month Calendar Grid */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#009766] flex items-center justify-center border border-emerald-100/80 shrink-0">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Tháng {calendarMonth.getMonth() + 1}, Năm {calendarMonth.getFullYear()}
                </h3>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedCalendarDate(formatYMD(now));
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-[#009766] hover:bg-white rounded-md transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Header Row */}
            <div className="grid grid-cols-7 py-1.5 bg-slate-50/80 rounded-lg text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((dayItem, idx) => {
                const isSelected = selectedCalendarDate === dayItem.dateString;
                const isToday = formatYMD(today) === dayItem.dateString;
                const hasAppointments = appointmentDatesMap.has(dayItem.dateString);
                const apptsOnDay = hasAppointments ? appointmentDatesMap.get(dayItem.dateString) : [];
                const firstApptTime = apptsOnDay[0] ? formatDateTime(apptsOnDay[0].appointmentDate, apptsOnDay[0].appointmentTime).time : '';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCalendarDate(dayItem.dateString)}
                    className={`min-h-[58px] sm:min-h-[62px] p-2 rounded-lg border flex flex-col justify-between items-center transition-all duration-150 cursor-pointer ${isSelected
                        ? 'border-[#009766] bg-emerald-50/50 ring-2 ring-[#009766]/20 shadow-2xs'
                        : hasAppointments
                          ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-[#009766]/60 hover:bg-emerald-50/40 shadow-2xs'
                          : dayItem.isCurrentMonth
                            ? 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                            : 'border-transparent bg-slate-50/40 text-slate-300 hover:bg-slate-100/50'
                      }`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-center w-full">
                      <span
                        className={`text-xs font-bold transition-colors ${isSelected
                            ? 'h-6 w-6 rounded-full bg-[#009766] text-white flex items-center justify-center text-xs shadow-2xs'
                            : isToday
                              ? 'h-6 w-6 rounded-full border-2 border-[#009766] text-[#009766] font-black flex items-center justify-center text-xs'
                              : dayItem.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-300'
                          }`}
                      >
                        {dayItem.dayNumber}
                      </span>
                    </div>

                    {/* Appointment Indicator (Clear 'Có lịch' badge, no hour clutter) */}
                    {hasAppointments ? (
                      <div className="w-full flex items-center justify-center mt-auto pt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100/80 text-[#009766] text-[10px] font-bold shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#009766] animate-pulse" />
                          <span>Có lịch</span>
                        </span>
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend Footer */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#009766]" />
                Ngày có lịch hẹn khám
              </span>
              <span>Nhấp ngày để xem chi tiết</span>
            </div>
          </div>

          {/* Cột Phải: Appointments of Selected Date */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Danh sách cuộc hẹn
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {selectedCalendarDate
                      ? `${formatDateTime(selectedCalendarDate).dayOfWeek || 'Ngày'}, ${formatDateTime(selectedCalendarDate).date}`
                      : 'Chưa chọn ngày'}
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {appointmentsOnSelectedDate.length} cuộc hẹn
                </span>
              </div>

              {appointmentsOnSelectedDate.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2.5">
                  <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Không có lịch hẹn vào ngày này</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Bạn có thể chọn một ngày khác trên lịch hoặc đặt lịch khám mới trực tiếp.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewBookingModal}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#009766] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Đặt lịch khám mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {appointmentsOnSelectedDate.map((apt) => {
                    const dt = formatDateTime(apt.appointmentDate, apt.appointmentTime);
                    const isUpcoming = apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';

                    return (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/50 hover:bg-white space-y-2.5 transition-all shadow-2xs group"
                      >
                        {/* Header: Service Name & Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#009766] transition-colors leading-snug">
                            {apt.reason || apt.serviceName || 'Khám răng tổng quát'}
                          </span>
                          {getStatusBadge(apt.status, apt)}
                        </div>

                        {/* Time & Room chip */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-[#009766] border border-emerald-200/70 font-extrabold text-xs">
                            <Clock className="h-3 w-3" />
                            {dt.time}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium truncate">
                            {apt.roomName || 'Phòng khám tổng quát'}
                          </span>
                        </div>

                        {/* Doctor and Clinic Info */}
                        <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <DoctorAvatar src={apt.dentistAvatar} name={apt.dentistName} className="h-6 w-6" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">
                                {apt.dentistName || 'Bác sĩ chuyên khoa'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="h-3 w-3 text-[#009766] shrink-0" />
                            <span className="truncate">{apt.branchName}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{String(apt.id || '').substring(0, 8)}
                          </span>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {isUpcoming && (
                              <button
                                type="button"
                                onClick={() => {
                                  const check = checkAppointmentModifiable(apt);
                                  if (!check.canModify) {
                                    toast.error(check.reason);
                                    return;
                                  }
                                  handleOpenCancel(apt.id);
                                }}
                                disabled={!canModifyAppointment(apt)}
                                title={!canModifyAppointment(apt) ? checkAppointmentModifiable(apt).reason : 'Hủy lịch hẹn'}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                                  canModifyAppointment(apt)
                                    ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                                    : 'text-slate-300 cursor-not-allowed opacity-50'
                                }`}
                              >
                                Hủy hẹn
                              </button>
                            )}

                            {/* Nút Chỉnh sửa (Áp dụng trong vòng 1h kể từ khi đặt lịch - Chỉ lịch hẹn, không áp dụng lịch tái khám) */}
                            {apt.type !== 'FOLLOW_UP' && !apt.isFollowUp && isUpcoming && (
                              (() => {
                                const editCheck = checkAppointmentCreationEditable(apt);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBookingModal(apt)}
                                    disabled={!editCheck.canEdit}
                                    title={
                                      editCheck.canEdit
                                        ? 'Chỉnh sửa lại thông tin đặt lịch (trong vòng 1h kể từ khi đặt)'
                                        : editCheck.reason
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shadow-2xs ${
                                      editCheck.canEdit
                                        ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer'
                                        : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50'
                                    }`}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Chỉnh sửa</span>
                                  </button>
                                );
                              })()
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenDetail(apt)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[#009766] rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= 3. DẠNG XEM DÒNG THỜI GIAN (TIMELINE VIEW) ================= */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Lộ trình chăm sóc răng miệng (Timeline)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Toàn bộ hành trình thăm khám và chăm sóc sức khỏe của bạn tại Crown Dental</p>
            </div>
            <span className="text-xs font-bold text-[#009766] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {filteredAppointments.length} mốc điều trị
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200">
            {filteredAppointments.map((apt, index) => {
              const dt = formatDateTime(apt.appointmentDate, apt.appointmentTime);
              const isUpcoming = apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';

              return (
                <div key={apt.id} className="relative group">
                  {/* Timeline Dot Node */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center transition-all ${isUpcoming
                        ? 'bg-[#009766] ring-4 ring-[#009766]/20'
                        : apt.status === 'COMPLETED'
                          ? 'bg-slate-700'
                          : 'bg-rose-500'
                      }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-slate-50/70 hover:bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#009766] bg-white px-2.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                            {dt.dayOfWeek ? `${dt.dayOfWeek}, ${dt.date}` : dt.date} • {dt.time}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">#{String(apt.id || '').substring(0, 8)}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1.5">{apt.reason || 'Khám răng tổng quát'}</h4>
                      </div>

                      {getStatusBadge(apt.status, apt)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <DoctorAvatar src={apt.dentistAvatar} name={apt.dentistName} className="h-6 w-6" />
                        <span className="font-semibold text-slate-800">{apt.dentistName || 'Bác sĩ chuyên khoa'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#009766] shrink-0" />
                        <span className="truncate">{apt.branchName}</span>
                      </div>
                    </div>

                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/70 italic">
                        Ghi chú: {apt.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end gap-2">
                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => {
                            const check = checkAppointmentModifiable(apt);
                            if (!check.canModify) {
                              toast.error(check.reason);
                              return;
                            }
                            handleOpenCancel(apt.id);
                          }}
                          disabled={!canModifyAppointment(apt)}
                          title={!canModifyAppointment(apt) ? checkAppointmentModifiable(apt).reason : 'Hủy lịch hẹn'}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            canModifyAppointment(apt)
                              ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Hủy hẹn
                        </button>
                      )}

                      {/* Nút Chỉnh sửa (Áp dụng trong vòng 1h kể từ khi đặt lịch - Chỉ lịch hẹn, không áp dụng lịch tái khám) */}
                      {apt.type !== 'FOLLOW_UP' && !apt.isFollowUp && isUpcoming && (
                        (() => {
                          const editCheck = checkAppointmentCreationEditable(apt);
                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenEditBookingModal(apt)}
                              disabled={!editCheck.canEdit}
                              title={
                                editCheck.canEdit
                                  ? 'Chỉnh sửa lại thông tin đặt lịch (trong vòng 1h kể từ khi đặt)'
                                  : editCheck.reason
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs transition-colors shadow-2xs ${
                                editCheck.canEdit
                                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer'
                                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Chỉnh sửa</span>
                            </button>
                          );
                        })()
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDetail(apt)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-[#009766] font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết phiếu hẹn
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT LỊCH HẸN (PORTAL + REFINED BORDER RADIUS) ================= */}
      {isDetailOpen && selectedAppointment && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 transition-all duration-200 ease-out ${isDetailActive ? 'bg-slate-900/60 backdrop-blur-xs opacity-100' : 'bg-slate-900/0 backdrop-blur-none opacity-0 pointer-events-none'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
        >
          <div
            className={`relative w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-lg rounded-none sm:rounded-xl bg-white sm:shadow-2xl sm:border border-slate-200 overflow-hidden font-sans flex flex-col transform transition-all duration-200 ease-out ${isDetailActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 sm:translate-y-2 sm:scale-95'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-4 py-3 sm:px-5 sm:py-3.5 text-white shrink-0 relative shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #015e3f 0%, #008055 45%, #009766 85%, #01a36e 100%)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                    <CalendarCheck className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                      Phiếu hẹn khám bệnh điện tử
                    </h3>
                    <span className="text-[10px] text-emerald-100/90 font-mono block">
                      Mã cuộc hẹn: #{String(selectedAppointment.id || '').substring(0, 8)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="h-8 w-8 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
                  title="Đóng phiếu khám"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto scrollbar-none flex-1 bg-slate-50/60">
              {/* Thẻ 1: Header Phiếu & Trạng thái */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedAppointment.type === 'FOLLOW_UP' || selectedAppointment.isFollowUp ? 'Loại phiếu' : 'Trạng thái phiếu'}
                  </p>
                  <div className="mt-0.5">
                    {selectedAppointment.type === 'FOLLOW_UP' || selectedAppointment.isFollowUp ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                        <RefreshCw className="h-3 w-3" />
                        Lịch tái khám
                      </span>
                    ) : (
                      getStatusBadge(selectedAppointment.status, selectedAppointment)
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian tạo phiếu</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {selectedAppointment.createdAt
                      ? formatDateTime(selectedAppointment.createdAt).date
                      : 'Hệ thống Crown Dental'}
                  </p>
                </div>
              </div>

              {/* Thẻ 2: Dịch vụ đăng ký & Thời gian khám (Trọng tâm) */}
              <div className="bg-white p-3.5 rounded-lg border border-emerald-200/90 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Dịch vụ đăng ký khám
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                  {selectedAppointment.reason || 'Khám răng tổng quát'}
                </p>

                <div className="p-2.5 rounded-md bg-emerald-50/80 border border-emerald-100 flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#009766]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(selectedAppointment.appointmentDate).date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(selectedAppointment.appointmentDate, selectedAppointment.appointmentTime).time}
                  </span>
                </div>
              </div>

              {/* Thẻ 3: Thông tin Bác sĩ & Phòng khám */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Bác sĩ phụ trách
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <DoctorAvatar src={selectedAppointment.dentistAvatar} name={selectedAppointment.dentistName} className="h-7.5 w-7.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate" title={selectedAppointment.dentistName}>
                        {selectedAppointment.dentistName || 'Bác sĩ chuyên khoa'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">Nha sĩ chính</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Phòng khám
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate" title={selectedAppointment.roomName}>
                      {selectedAppointment.roomName || 'Phòng khám tổng quát'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate" title={selectedAppointment.branchName}>
                      {selectedAppointment.branchName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thẻ 4: Địa chỉ tiếp đón */}
              {(selectedAppointment.branchName || selectedAppointment.branchAddress || selectedAppointment.addressBranch) && (
                <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs text-xs space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#009766]" /> Địa chỉ tiếp đón
                  </span>
                  {selectedAppointment.branchName && (
                    <p className="font-bold text-slate-800 text-xs">{selectedAppointment.branchName}</p>
                  )}
                  {Boolean(selectedAppointment.branchAddress || selectedAppointment.addressBranch) && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {selectedAppointment.branchAddress || selectedAppointment.addressBranch}
                    </p>
                  )}
                </div>
              )}

              {/* Thẻ 5: Ghi chú lịch hẹn */}
              {selectedAppointment.notes && (
                <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs text-xs space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500" /> Ghi chú lịch hẹn
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Thẻ 6: Thông báo phân quyền chỉnh sửa lịch hẹn / tái khám */}
              {selectedAppointment.type === 'FOLLOW_UP' || selectedAppointment.isFollowUp ? (
                <div className="bg-indigo-50/80 border border-indigo-200/80 p-3 rounded-lg text-xs text-indigo-900 space-y-1 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                    Lịch tái khám do Bác sĩ chỉ định
                  </div>
                  <p className="text-indigo-900/90 leading-relaxed text-[11px]">
                    Lịch tái khám được chỉ định trực tiếp theo phác đồ điều trị của Bác sĩ phụ trách và không áp dụng chỉnh sửa trực tuyến. Nếu cần điều chỉnh, quý khách vui lòng liên hệ trực tiếp hotline hoặc nhân viên tại quầy.
                  </p>
                </div>
              ) : (
                (() => {
                  const editCheck = checkAppointmentCreationEditable(selectedAppointment);
                  return (
                    <div
                      className={`p-3 rounded-lg border text-xs leading-relaxed font-medium space-y-0.5 ${
                        editCheck.canEdit
                          ? 'bg-teal-50 border-teal-200 text-teal-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className={`h-3.5 w-3.5 ${editCheck.canEdit ? 'text-teal-600' : 'text-amber-600'}`} />
                        <span>{editCheck.canEdit ? 'Thời gian chỉnh sửa trực tuyến hợp lệ' : 'Khóa chỉnh sửa trực tuyến'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{editCheck.reason}</p>
                    </div>
                  );
                })()
              )}

              {/* Thẻ 7: Hướng dẫn khi đến khám */}
              <div className="bg-blue-50/80 border border-blue-200/80 p-3 rounded-lg text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-800">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  Hướng dẫn bệnh nhân
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 pl-1 leading-relaxed">
                  <li>Vui lòng có mặt trước giờ hẹn từ 10 - 15 phút tại quầy lễ tân.</li>
                  <li>Mang theo CCCD hoặc BHYT (nếu có) để đối chiếu thông tin.</li>
                  <li>Nếu có thay đổi lịch trình, vui lòng thông báo trước 2 giờ.</li>
                </ul>
              </div>
            </div>

            {/* Warning if cannot modify */}
            {!canModifyAppointment(selectedAppointment) && (
              <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 sm:px-5 text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{checkAppointmentModifiable(selectedAppointment).reason}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-200/90 px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
              {selectedAppointment.status !== 'COMPLETED' && selectedAppointment.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  onClick={() => {
                    const check = checkAppointmentModifiable(selectedAppointment);
                    if (!check.canModify) {
                      toast.error(check.reason);
                      return;
                    }
                    handleOpenCancel(selectedAppointment.id);
                  }}
                  disabled={!canModifyAppointment(selectedAppointment)}
                  title={!canModifyAppointment(selectedAppointment) ? checkAppointmentModifiable(selectedAppointment).reason : 'Hủy lịch hẹn này'}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    canModifyAppointment(selectedAppointment)
                      ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                      : 'text-slate-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hủy lịch hẹn này</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {/* Nút Chỉnh sửa (chỉ cho Lịch hẹn, Lịch tái khám không sửa được) */}
                {selectedAppointment.type !== 'FOLLOW_UP' && !selectedAppointment.isFollowUp && (
                  (() => {
                    const editCheck = checkAppointmentCreationEditable(selectedAppointment);
                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenEditBookingModal(selectedAppointment)}
                        disabled={!editCheck.canEdit}
                        title={
                          editCheck.canEdit
                            ? 'Chỉnh sửa lại thông tin đặt lịch (trong vòng 1h kể từ khi đặt)'
                            : editCheck.reason
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          editCheck.canEdit
                            ? 'bg-[#009766] hover:bg-[#028562] text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>
                    );
                  })()
                )}

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer min-w-[80px] text-center"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL XÁC NHẬN HỦY LỊCH HẸN (CENTERED DIALOG - REFINED BORDER RADIUS) ================= */}
      {showCancelConfirmModal && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-200 ease-out ${isCancelActive ? 'bg-slate-900/60 backdrop-blur-xs opacity-100' : 'bg-slate-900/0 backdrop-blur-none opacity-0 pointer-events-none'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseCancel();
          }}
        >
          <div
            className={`w-full max-w-sm sm:max-w-md bg-white rounded-xl p-5 shadow-2xl border border-slate-100 space-y-3.5 transform transition-all duration-200 ease-out ${isCancelActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 text-rose-600">
              <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Xác nhận hủy cuộc hẹn?</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Hành động này sẽ giải phóng khung giờ khám của bạn trên hệ thống Crown Dental.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do hủy hẹn (tùy chọn):
              </label>
              <textarea
                rows={2}
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="Ví dụ: Bận đột xuất, đổi kế hoạch công tác..."
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCloseCancel}
                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Không, giữ lịch
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAppointment}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Patient Booking Modal */}
      <PatientBookingModal
        isOpen={isBookingModalOpen}
        initialAppointment={editingAppointment}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={() => {
          setIsBookingModalOpen(false);
          setEditingAppointment(null);
          fetchAppointments();
        }}
      />
    </div>
  );
}
