import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  MapPin,
  User,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  FileText,
  ClipboardList,
  Coins,
  Receipt,
  Check,
  Headphones,
  CreditCard,
  X,
  Activity,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getPatientStatistics, getPatientById, getPatientByPatientCode } from '../../../services/patient.service';
import { getInProgressTreatmentPlansByPatientId, getTreatmentPlansByPatientId } from '../../../services/treatmentPlan.service';
import { getExaminationResultsByPatientId } from '../../../services/examinationResult.service';
import {
  getCurrentMonthFollowUpAppointmentsByPatientId,
  updateFollowUpAppointment,
} from '../../../services/followUpAppointment.service';
import { getAppointmentsByPatient, getMyAppointments, updateAppointment } from '../../../services/appointment.service';
import { createNotification } from '../../../services/notification.service';
import {
  canModifyAppointment,
  checkAppointmentModifiable,
  canEditAppointment,
  checkAppointmentCreationEditable,
} from '../../../utils/appointmentTimeCheck';
import Loading from '../../../components/ui/Loading';
import PatientBookingModal from '../../appointment/patient/PatientBookingModal';

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// Chuẩn hóa tên bác sĩ không bị lặp học hàm/học vị (tránh BS. ThS. BS.)
const formatDoctorName = (name) => {
  if (!name || name === 'Chưa có') return 'BS. Nguyễn Văn Anh';
  let clean = String(name).trim();
  // Loại bỏ các trường hợp lặp prefix như: BS. ThS. BS., BS. BS., ThS. BS. BS.
  clean = clean.replace(/^(BS\.?\s*)+(ThS|TS|PGS|GS)\.?\s*(BS\.?\s*)?/i, '$2. BS. ');
  clean = clean.replace(/^(BS\.?\s*)+/i, 'BS. ');
  clean = clean.replace(/^(ThS\.?\s*)+/i, 'ThS. ');
  clean = clean.replace(/^(TS\.?\s*)+/i, 'TS. ');
  if (!/^(BS|ThS|TS|PGS|GS)\.?\s+/i.test(clean)) {
    clean = `BS. ${clean}`;
  }
  return clean.replace(/\s+/g, ' ');
};

// Chuẩn hóa ngày giờ: tính timeMs chính xác và format thời gian đẹp HH:mm (loại bỏ chuỗi ISO)
const parseAppointmentDateTime = (dateVal, timeVal) => {
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  let y = 2026, m = 1, d = 1;
  let hasValidDate = false;

  if (dateVal) {
    if (typeof dateVal === 'string') {
      const cleanDate = dateVal.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
        hasValidDate = true;
      }
    } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      y = dateVal.getFullYear();
      m = dateVal.getMonth() + 1;
      d = dateVal.getDate();
      hasValidDate = true;
    }
  }

  let hh = 9, mm = 0;
  let timeFormatted = '09:00';
  const effectiveTimeStr = timeVal || (typeof dateVal === 'string' && dateVal.includes('T') ? dateVal.split('T')[1] : null);
  if (effectiveTimeStr) {
    let tStr = String(effectiveTimeStr).trim();
    if (tStr.includes('T')) {
      tStr = tStr.split('T')[1];
    }
    const tParts = tStr.split(':');
    if (tParts.length >= 2) {
      hh = parseInt(tParts[0], 10) || 0;
      mm = parseInt(tParts[1], 10) || 0;
      timeFormatted = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
  }

  const dateObj = hasValidDate ? new Date(y, m - 1, d, hh, mm, 0) : null;
  const rawTimeMs = dateObj && !isNaN(dateObj.getTime()) ? dateObj.getTime() : 0;
  const isValid = rawTimeMs > 0;

  return {
    dateObj,
    rawTimeMs,
    timeFormatted,
    dayOfWeek: isValid ? dayNames[dateObj.getDay()] : 'Chưa có',
    dayNumber: isValid ? String(dateObj.getDate()).padStart(2, '0') : '--',
    monthNumber: isValid ? String(dateObj.getMonth() + 1).padStart(2, '0') : '--',
    monthShort: isValid ? `Thg ${dateObj.getMonth() + 1}` : '',
    monthYear: isValid ? `Tháng ${dateObj.getMonth() + 1}` : 'Chưa có',
    date: isValid ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}` : 'Chưa có',
    fullDate: isValid ? dateObj.toLocaleDateString('vi-VN') : 'Chưa có',
  };
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // User display info (defaults to user name if set, otherwise fallback)
  const displayName = user?.fullName || user?.username || 'Khách hàng';

  // State for interactive modals with smooth open/close transitions
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailActive, setIsDetailActive] = useState(false);

  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isHistoryActive, setIsHistoryActive] = useState(false);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSupportActive, setIsSupportActive] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 4;

  // Smooth open/close handlers for Detail Modal
  const handleOpenDetailModal = (apt) => {
    if (!apt) return;
    setSelectedAppointment(apt);
    setIsDetailActive(false);
    setTimeout(() => {
      setIsDetailActive(true);
    }, 20);
  };

  const handleCloseDetailModal = () => {
    setIsDetailActive(false);
    setTimeout(() => {
      setSelectedAppointment(null);
    }, 200);
  };

  // Smooth open/close handlers for Treatment History Modal
  const handleOpenHistoryModal = (item) => {
    if (!item) return;
    setSelectedHistory(item);
    setIsHistoryActive(false);
    setTimeout(() => {
      setIsHistoryActive(true);
    }, 20);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryActive(false);
    setTimeout(() => {
      setSelectedHistory(null);
    }, 200);
  };

  // Smooth open/close handlers for Support Hotline Modal
  const handleOpenSupportModal = () => {
    setIsSupportOpen(true);
    setIsSupportActive(false);
    setTimeout(() => {
      setIsSupportActive(true);
    }, 20);
  };

  const handleCloseSupportModal = () => {
    setIsSupportActive(false);
    setTimeout(() => {
      setIsSupportOpen(false);
    }, 200);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDetailActive) handleCloseDetailModal();
        if (isHistoryActive) handleCloseHistoryModal();
        if (isSupportActive) handleCloseSupportModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailActive, isHistoryActive, isSupportActive]);

  // Mở modal đặt lịch khám mới (reset editing appointment)
  const handleOpenNewBookingModal = () => {
    setEditingAppointment(null);
    setIsBookingModalOpen(true);
  };

  // Mở modal chỉnh sửa lại thông tin đặt lịch (áp dụng trong vòng 1h kể từ khi nhấn đặt lịch)
  const handleOpenEditBookingModal = (apt) => {
    if (!apt) return;
    const check = checkAppointmentCreationEditable(apt);
    if (!check.canEdit) {
      toast.error(check.reason);
      return;
    }
    handleCloseDetailModal();
    setEditingAppointment(apt);
    setIsBookingModalOpen(true);
  };

  // States quản lý dữ liệu từ từng API
  const [patientStatistics, setPatientStatistics] = useState(null);
  const [inProgressPlans, setInProgressPlans] = useState([]);
  const [examinationResults, setExaminationResults] = useState([]);
  const [followUpAppointments, setFollowUpAppointments] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [appointmentFilterTab, setAppointmentFilterTab] = useState('ALL'); // 'ALL' | 'APPOINTMENT' | 'FOLLOW_UP'
  const [loading, setLoading] = useState(true);

  // 1. Fetch Thống kê bệnh nhân
  const fetchPatientStatistics = async (patientId) => {
    try {
      const statistics = await getPatientStatistics(patientId);
      setPatientStatistics(statistics || null);
    } catch (error) {
      console.error("Lỗi lấy thống kê bệnh nhân:", error);
      setPatientStatistics(null);
    }
  };

  // 2. Fetch Kế hoạch điều trị đang tiến hành
  const fetchInProgressTreatmentPlansByPatientId = async (patientId) => {
    try {
      const res = await getInProgressTreatmentPlansByPatientId(patientId);
      let list = Array.isArray(res) ? res : (res?.data || []);
      if (!list || list.length === 0) {
        try {
          const allRes = await getTreatmentPlansByPatientId(patientId);
          list = Array.isArray(allRes) ? allRes : (allRes?.data || []);
        } catch (e) {
          // fallback ignore
        }
      }
      setInProgressPlans(list);
    } catch (error) {
      console.error("Lỗi lấy kế hoạch điều trị đang tiến hành:", error);
      setInProgressPlans([]);
    }
  };

  // 3. Fetch Lịch sử kết quả khám
  const fetchExaminationResultsByPatientId = async (patientId) => {
    try {
      const res = await getExaminationResultsByPatientId(patientId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setExaminationResults(list);
    } catch (error) {
      console.error("Lỗi lấy kết quả khám của bệnh nhân:", error);
      setExaminationResults([]);
    }
  };

  // 4. Fetch Lịch tái khám trong tháng của bệnh nhân (API: getCurrentMonthFollowUpAppointmentsByPatientId)
  const fetchCurrentMonthFollowUpAppointmentsByPatientId = async (patientId) => {
    try {
      let actualPatientId = patientId || user?.patientId;
      if (!actualPatientId || !isValidUUID(actualPatientId)) {
        if (user?.patientCode) {
          try {
            const pRes = await getPatientByPatientCode(user.patientCode);
            const pData = pRes?.data || pRes;
            if (pData?.id) actualPatientId = pData.id;
          } catch (e) {
            console.warn('Lookup by patientCode failed:', e);
          }
        }
        if ((!actualPatientId || !isValidUUID(actualPatientId)) && user?.id) {
          try {
            const pRes = await getPatientById(user.id);
            const pData = pRes?.data || pRes;
            if (pData?.id) actualPatientId = pData.id;
          } catch (e) {
            console.warn('Lookup by user.id failed:', e);
          }
        }
      }

      if (!actualPatientId || !isValidUUID(actualPatientId)) {
        setFollowUpAppointments([]);
        return;
      }

      const res = await getCurrentMonthFollowUpAppointmentsByPatientId(actualPatientId);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.result)
        ? res.result
        : Array.isArray(res)
        ? res
        : [];
      setFollowUpAppointments(list);
    } catch (error) {
      console.error("Lỗi lấy lịch tái khám trong tháng của bệnh nhân:", error);
      setFollowUpAppointments([]);
    }
  };

  // 5. Fetch Lịch hẹn khám (Appointments của bệnh nhân)
  const fetchPatientAppointments = async (patientId) => {
    try {
      let actualPatientId = user?.patientId;
      let actualPhone = user?.phone || user?.phoneNumber || (typeof localStorage !== 'undefined' ? localStorage.getItem('patient_phone') : null);

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

      const pLookupId = actualPatientId || patientId || user?.patientId || user?.id;
      let data = [];
      if (pLookupId) {
        try {
          data = await getAppointmentsByPatient(pLookupId);
        } catch (e) {
          console.warn('getAppointmentsByPatient error:', e);
        }
      }

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
      if (list.length > 0) {
        list = list.filter((apt) => {
          if (actualPatientId && (apt.patientId === actualPatientId || apt.patientId === user?.id)) return true;
          if (actualPhone && apt.phone && apt.phone.trim() === actualPhone.trim()) return true;
          if (user?.patientCode && apt.patientCode && apt.patientCode === user.patientCode) return true;
          if (user?.username && apt.patientName && apt.patientName.toLowerCase() === user.username.toLowerCase()) return true;
          return !apt.patientId || apt.patientId === pLookupId;
        });
      }
      setPatientAppointments(list);
    } catch (err) {
      console.warn('Lỗi khi lấy lịch hẹn khám của bệnh nhân:', err);
      setPatientAppointments([]);
    }
  };

  const loadAllDashboardData = (patientId) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.allSettled([
      fetchPatientStatistics(patientId),
      fetchInProgressTreatmentPlansByPatientId(patientId),
      fetchExaminationResultsByPatientId(patientId),
      fetchCurrentMonthFollowUpAppointmentsByPatientId(patientId),
      fetchPatientAppointments(patientId),
    ]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    const patientId = user?.patientId || user?.id;
    loadAllDashboardData(patientId);

    // Lắng nghe sự kiện khi tạo lịch hẹn mới để tự động đồng bộ tức thì
    const handleRefreshAppointments = () => {
      const pid = user?.patientId || user?.id;
      if (pid) {
        fetchPatientAppointments(pid);
        fetchCurrentMonthFollowUpAppointmentsByPatientId(pid);
        fetchPatientStatistics(pid);
        fetchInProgressTreatmentPlansByPatientId(pid);
      }
    };

    window.addEventListener('appointment_created', handleRefreshAppointments);
    return () => {
      window.removeEventListener('appointment_created', handleRefreshAppointments);
    };
  }, [user]);

  // Hợp nhất dữ liệu thật từ cả Lịch Hẹn Khám (patientAppointments) và Lịch Tái Khám (followUpAppointments)
  const upcomingAppointments = useMemo(() => {
    const mergedList = [];

    // 1. Chuẩn hóa các lịch hẹn khám (Appointments)
    if (patientAppointments && patientAppointments.length > 0) {
      patientAppointments.forEach((apt) => {
        const st = typeof apt.status === 'string' ? apt.status.toUpperCase() : '';
        if (st === 'CANCELLED' || st.includes('HỦY')) return;

        const dateParsed = parseAppointmentDateTime(apt.appointmentDate, apt.appointmentTime);

        mergedList.push({
          id: apt.id || Math.random().toString(),
          type: 'APPOINTMENT',
          typeLabel: 'Lịch hẹn khám',
          dayOfWeek: dateParsed.dayOfWeek,
          dayNumber: dateParsed.dayNumber,
          monthNumber: dateParsed.monthNumber,
          monthShort: dateParsed.monthShort,
          monthYear: dateParsed.monthYear,
          date: dateParsed.date,
          fullDate: dateParsed.fullDate,
          time: dateParsed.timeFormatted,
          appointmentDate: apt.appointmentDate,
          appointmentTime: dateParsed.timeFormatted,
          title: apt.reason || apt.serviceName || 'Khám răng tổng quát',
          status: apt.status === 'CONFIRMED' ? 'Đã xác nhận' : (apt.status === 'COMPLETED' ? 'Đã khám' : 'Đã lên lịch'),
          statusColor: apt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-teal-50 text-teal-700 border-teal-200',
          doctor: formatDoctorName(apt.dentistName),
          branch: apt.branchName || '',
          address: apt.addressBranch || apt.branchAddress || '',
          notes: apt.notes || 'Chưa có',
          rawDateTime: dateParsed.dateObj,
          rawTimeMs: dateParsed.rawTimeMs,
          raw: apt,
        });
      });
    }

    // 2. Chuẩn hóa các lịch tái khám (FollowUpAppointments)
    if (followUpAppointments && followUpAppointments.length > 0) {
      followUpAppointments.forEach((apt) => {
        const st = typeof apt.status === 'string' ? apt.status.toUpperCase() : '';
        if (st === 'CANCELLED' || st.includes('HỦY') || apt.status === false) return;

        const dateParsed = parseAppointmentDateTime(apt.followUpDate, apt.followUpTime);

        mergedList.push({
          id: apt.id || Math.random().toString(),
          type: 'FOLLOW_UP',
          typeLabel: 'Lịch tái khám',
          dayOfWeek: dateParsed.dayOfWeek,
          dayNumber: dateParsed.dayNumber,
          monthNumber: dateParsed.monthNumber,
          monthShort: dateParsed.monthShort,
          monthYear: dateParsed.monthYear,
          date: dateParsed.date,
          fullDate: dateParsed.fullDate,
          time: dateParsed.timeFormatted,
          appointmentDate: apt.followUpDate,
          appointmentTime: dateParsed.timeFormatted,
          title: apt.reason || apt.chiefComplaint || 'Tái khám định kỳ',
          status: apt.status ? 'Đã xác nhận' : 'Sắp tới',
          statusColor: apt.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-teal-50 text-teal-700 border-teal-200',
          doctor: formatDoctorName(apt.dentistName),
          branch: apt.branchName || '',
          address: apt.addressBranch || apt.branchAddress || '',
          notes: apt.note || 'Chưa có',
          rawDateTime: dateParsed.dateObj,
          rawTimeMs: dateParsed.rawTimeMs,
          raw: apt,
        });
      });
    }

    // 3. Sắp xếp danh sách theo thời gian sớm nhất diễn ra trước (Ascending)
    mergedList.sort((a, b) => {
      if (a.rawTimeMs && b.rawTimeMs) {
        return a.rawTimeMs - b.rawTimeMs;
      }
      return 0;
    });

    return mergedList;
  }, [patientAppointments, followUpAppointments]);

  // Danh sách lịch hẹn sau khi áp dụng bộ lọc tab ('ALL' | 'APPOINTMENT' | 'FOLLOW_UP')
  const displayedUpcomingAppointments = useMemo(() => {
    if (appointmentFilterTab === 'APPOINTMENT') {
      return upcomingAppointments.filter((item) => item.type === 'APPOINTMENT');
    }
    if (appointmentFilterTab === 'FOLLOW_UP') {
      return upcomingAppointments.filter((item) => item.type === 'FOLLOW_UP');
    }
    return upcomingAppointments;
  }, [upcomingAppointments, appointmentFilterTab]);

  const latestAppointment = upcomingAppointments[0] || null;

  // 5 Thẻ tóm tắt chỉ số (Dữ liệu từ API fetchPatientStatistics, tự động đồng bộ theo lịch hẹn thực tế)
  const stats = [
    {
      id: 'appointments',
      title: 'Lịch hẹn trong 30 ngày',
      count: (patientStatistics?.totalAppointmentsLast30Days && Number(patientStatistics.totalAppointmentsLast30Days) > 0)
        ? patientStatistics.totalAppointmentsLast30Days
        : upcomingAppointments.length,
      icon: CalendarCheck,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 border border-teal-100',
      to: '/patient/appointments',
    },
    {
      id: 'prescriptions',
      title: 'Tổng số đơn thuốc',
      count: patientStatistics?.totalPrescriptions ?? 0,
      icon: FileText,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border border-emerald-100',
      to: '/patient/prescriptions',
    },
    {
      id: 'treatment-plan',
      title: 'Kế hoạch điều trị',
      count: patientStatistics?.totalTreatmentPlans ?? 0,
      badge: `Đang điều trị: ${patientStatistics?.inProgressTreatmentPlans ?? 0}`,
      icon: ClipboardList,
      color: 'text-teal-800',
      bgColor: 'bg-teal-50 border border-teal-100',
      to: '/patient/medical-records',
    },
    {
      id: 'debt',
      title: 'Công nợ hiện tại',
      count: patientStatistics?.totalOutstandingDebt != null
        ? `${Number(patientStatistics.totalOutstandingDebt).toLocaleString('vi-VN')} đ`
        : '0 đ',
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border border-amber-100',
      to: '/patient/invoices',
    },
    {
      id: 'invoices',
      title: 'Tổng số hóa đơn',
      count: patientStatistics?.totalInvoices ?? 0,
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border border-rose-100',
      to: '/patient/invoices',
    },
  ];

  // Map dữ liệu kế hoạch điều trị thật từ API (fetchInProgressTreatmentPlansByPatientId)
  const treatmentPlans = useMemo(() => {
    if (!inProgressPlans || inProgressPlans.length === 0) return [];

    return inProgressPlans.map((plan, index) => {
      const phases = plan.phases || [];
      const completedPhasesCount = phases.filter((p) => p.status === 'COMPLETED').length;
      const inProgressIdx = phases.findIndex((p) => p.status === 'IN_PROGRESS');
      const progressPercent = phases.length > 0 ? Math.round((completedPhasesCount / phases.length) * 100) : 0;

      let currentStage = 'Chưa có';
      if (phases.length > 0) {
        if (inProgressIdx !== -1) {
          currentStage = `Giai đoạn ${inProgressIdx + 1}/${phases.length}`;
        } else if (completedPhasesCount === phases.length) {
          currentStage = `Hoàn thành ${phases.length}/${phases.length}`;
        } else {
          currentStage = `Giai đoạn 1/${phases.length}`;
        }
      }

      const steps = phases.map((phase, pIdx) => {
        const isCompleted = phase.status === 'COMPLETED';
        const isInProgress = phase.status === 'IN_PROGRESS';
        const expectedStartDate = phase.expectedStartDate ? new Date(phase.expectedStartDate) : null;
        const rawTitle = phase.phaseName || `Giai đoạn ${pIdx + 1}`;
        const cleanTitle = rawTitle.replace(/^Giai\s*đoạn\s*\d+\s*[:\-]\s*/i, '').trim();

        return {
          stepNum: pIdx + 1,
          title: cleanTitle || rawTitle,
          fullTitle: rawTitle,
          date: expectedStartDate && !isNaN(expectedStartDate.getTime())
            ? expectedStartDate.toLocaleDateString('vi-VN')
            : '',
          status: isCompleted ? 'Hoàn thành' : isInProgress ? 'Đang điều trị' : 'Chưa bắt đầu',
          statusType: isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'pending',
        };
      });

      const startDateObj = plan.startDate ? new Date(plan.startDate) : null;
      const endDateObj = plan.endDate ? new Date(plan.endDate) : null;

      return {
        id: plan.id || `tp-${index}`,
        title: plan.planName || 'Chưa có',
        doctor: formatDoctorName(plan.dentistName),
        startDate: startDateObj && !isNaN(startDateObj.getTime()) ? startDateObj.toLocaleDateString('vi-VN') : 'Chưa có',
        expectedEndDate: endDateObj && !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleDateString('vi-VN') : 'Chưa có',
        currentStage,
        progressPercent,
        status: plan.status === 'IN_PROGRESS' ? 'Đang điều trị' : plan.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa có',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        image: '/tooth-implant.jpg',
        steps,
        raw: plan,
      };
    });
  }, [inProgressPlans]);

  const activeTreatmentPlan = treatmentPlans[selectedPlanIndex] || treatmentPlans[0] || null;

  // Map dữ liệu lịch sử điều trị thật từ API (fetchExaminationResultsByPatientId)
  const treatmentHistory = useMemo(() => {
    if (!examinationResults || examinationResults.length === 0) return [];

    return examinationResults.map((item) => {
      const d = item.examinationDate ? new Date(item.examinationDate) : null;
      const diagList = item.diagnoses || [];
      const primaryDiag = diagList[0]?.diagnosisName || item.diagnosis?.diagnosisName;
      const resultText = diagList.length > 0
        ? diagList.map((x) => x.diagnosisName).filter(Boolean).join(', ')
        : 'Hoàn thành';

      return {
        id: item.id || Math.random().toString(),
        date: d && !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : 'Chưa có',
        service: item.chiefComplaint || primaryDiag || 'Khám tổng quát',
        doctor: formatDoctorName(item.dentistName),
        branch: item.branchName || 'Chưa có',
        result: resultText || 'chưa có',
        notes: item.diagnosis?.description || diagList[0]?.description || item.chiefComplaint || 'Chưa có',
        raw: item,
      };
    });
  }, [examinationResults]);

  // Phân trang lịch sử điều trị (tối đa 4 dòng mỗi trang)
  const totalHistoryPages = Math.ceil(treatmentHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * itemsPerPage;
    return treatmentHistory.slice(start, start + itemsPerPage);
  }, [treatmentHistory, historyPage]);

  // Đặt lại trang 1 nếu trang hiện tại vượt quá tổng số trang
  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(1);
    }
  }, [historyPage, totalHistoryPages]);

  // Quick Action Buttons (Emerald / Teal Unified Theme)
  const quickActions = [
    {
      title: 'Đặt lịch khám',
      icon: CalendarPlus,
      bgColor: 'bg-teal-50 border border-teal-100',
      textColor: 'text-teal-800',
      hoverColor: 'hover:bg-teal-100/70',
      onClick: handleOpenNewBookingModal,
    },
    {
      title: 'Xem lịch hẹn',
      icon: CalendarCheck,
      bgColor: 'bg-emerald-50 border border-emerald-100',
      textColor: 'text-emerald-800',
      hoverColor: 'hover:bg-emerald-100/70',
      onClick: () => navigate('/patient/appointments'),
    },
    {
      title: 'Xem đơn thuốc',
      icon: FileText,
      bgColor: 'bg-teal-50/80 border border-teal-100',
      textColor: 'text-teal-700',
      hoverColor: 'hover:bg-teal-100/80',
      onClick: () => navigate('/patient/prescriptions'),
    },
    {
      title: 'Hồ sơ bệnh án',
      icon: Activity,
      bgColor: 'bg-emerald-50/80 border border-emerald-100',
      textColor: 'text-emerald-700',
      hoverColor: 'hover:bg-emerald-100/80',
      onClick: () => navigate('/patient/medical-records'),
    },
    {
      title: 'Thanh toán hóa đơn',
      icon: CreditCard,
      bgColor: 'bg-rose-50 border border-rose-100',
      textColor: 'text-rose-700',
      hoverColor: 'hover:bg-rose-100/70',
      onClick: () => navigate('/patient/invoices'),
    },
    {
      title: 'Liên hệ hỗ trợ',
      icon: Headphones,
      bgColor: 'bg-cyan-50 border border-cyan-100',
      textColor: 'text-cyan-800',
      hoverColor: 'hover:bg-cyan-100/70',
      onClick: handleOpenSupportModal,
    },
  ];

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <Loading
          title="Đang tải bảng điều khiển bệnh nhân..."
          subtitle="Vui lòng đợi trong giây lát, hệ thống đang đồng bộ dữ liệu"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* 1. TOP HERO BANNER: Trải full màn hình web                */}
      {/* ======================================================== */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white shadow-md shadow-teal-950/10 border-b border-teal-500/20">
        {/* Soft background decor light glows */}
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        {/* Nội dung bên trong banner: Cách lề trái và phải cân đối chuẩn max-w-7xl */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            {/* Left Card: Lịch hẹn sắp tới (White Floating Card) */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="flex items-center gap-1.5 text-emerald-100 font-bold text-sm mb-2.5 drop-shadow-xs">
                <Calendar className="h-4.5 w-4.5 text-emerald-200" />
                <span>Lịch hẹn sắp tới</span>
              </div>

              <div className="rounded-xl bg-white p-4 sm:p-5 shadow-lg shadow-teal-950/15 border border-white/90 text-slate-800">
                {latestAppointment ? (
                  <>
                    <div className="flex items-start gap-4">
                      {/* Date Badge in Emerald theme */}
                      <div className="rounded-lg bg-teal-50 border border-teal-100/90 px-3.5 py-3 text-center min-w-[76px] shrink-0 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-teal-700 uppercase tracking-tight">
                          {latestAppointment.dayOfWeek}
                        </span>
                        <span className="text-3xl font-black text-teal-900 leading-none my-1">
                          {latestAppointment.dayNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {latestAppointment.monthYear}
                        </span>
                      </div>

                      {/* Appointment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {latestAppointment.title}
                          </h3>
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                            {latestAppointment.status}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{latestAppointment.doctor}</span>
                          </div>
                          {latestAppointment.branch ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{latestAppointment.branch}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{latestAppointment.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(latestAppointment)}
                        className={`${latestAppointment.type === 'FOLLOW_UP' ? 'w-full' : 'flex-1'
                          } rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors shadow-2xs cursor-pointer`}
                      >
                        Xem chi tiết
                      </button>
                      {latestAppointment.type !== 'FOLLOW_UP' && (
                        (() => {
                          const editCheck = checkAppointmentCreationEditable(latestAppointment);
                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenEditBookingModal(latestAppointment)}
                              disabled={!editCheck.canEdit}
                              title={editCheck.canEdit ? 'Chỉnh sửa thông tin đặt lịch (trong vòng 1h kể từ khi đặt)' : editCheck.reason}
                              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 ${editCheck.canEdit
                                ? 'bg-teal-700 text-white hover:bg-teal-800 cursor-pointer'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 border border-slate-300/60'
                                }`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Chỉnh sửa
                            </button>
                          );
                        })()
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-5 text-center">
                    <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Chưa có lịch hẹn nào sắp tới</p>
                    <p className="text-xs text-slate-400 mt-0.5">Đặt lịch khám để được bác sĩ theo dõi định kỳ</p>
                    <button
                      type="button"
                      onClick={handleOpenNewBookingModal}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Đặt lịch khám ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Banner: Greeting & Doctor Banner with Dental Slogan */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col md:flex-row items-center justify-between gap-6 pl-0 lg:pl-3">
              {/* Greeting & CTA */}
              <div className="max-w-md text-left space-y-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  Xin chào,<br />
                  <span className="text-emerald-100 font-black">{displayName}!</span>
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 leading-relaxed font-medium">
                  Cảm ơn bạn đã tin tưởng đồng hành cùng Crown Dental. Chúc bạn luôn có nụ cười khỏe mạnh!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenNewBookingModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-teal-900 shadow-md hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    Đặt lịch khám ngay
                    <ArrowRight className="h-4 w-4 text-teal-700" />
                  </button>
                </div>
              </div>

              {/* Model Face & Slogan Image Visual */}
              <div className="relative shrink-0 flex items-center justify-center">
                {/* Photo of model */}
                <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 border-white/60 shadow-xl shadow-teal-950/20 ring-4 ring-white/20">
                  <img
                    src="/patient-banner.jpg"
                    alt="Nụ cười khỏe đẹp"
                    className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Slogan pill banner (top-right of model) */}
                <div className="hidden sm:block absolute -right-4 -top-3 max-w-[155px] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-white text-center transform rotate-3">
                  <p className="text-[11px] font-bold text-teal-900 italic leading-snug">
                    "Nụ cười đẹp khởi đầu của sự tự tin ♡"
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NỘI DUNG BÊN DƯỚI BANNER: Cách lề trái và phải cân đối  */}
      {/* ======================================================== */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-12">
        {/* 2. STATS SUMMARY ROW: 5 Cards (Minimalist, modern, cohesive)  */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group relative flex h-full min-h-[84px] flex-row items-center gap-3 rounded-2xl bg-white p-4.5 border border-slate-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200/90 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex shrink-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bgColor} ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="min-w-0 flex-1 pr-3 text-left">
                  <div className="flex items-baseline justify-start gap-1.5 flex-wrap">
                    <p className="text-xl font-black text-slate-900 tracking-tight leading-none">
                      {item.count}
                    </p>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100/80 px-1.5 py-0.5 rounded-md leading-none">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1.5 truncate">
                    {item.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* 3. MIDDLE ROW: Lịch hẹn sắp tới & Kế hoạch điều trị      */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: Lịch hẹn sắp tới */}
          <div className="lg:col-span-6 rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              {/* Header: Title + Link to All */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Lịch hẹn sắp tới
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {upcomingAppointments.length}
                  </span>
                </div>

                <Link
                  to="/patient/appointments"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-0.5 transition-colors group"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Filter Tabs Segmented Control */}
              <div className="mt-3.5 flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAppointmentFilterTab('ALL')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer ${appointmentFilterTab === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  Tất cả ({upcomingAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentFilterTab('APPOINTMENT')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${appointmentFilterTab === 'APPOINTMENT'
                    ? 'bg-white text-teal-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Lịch hẹn ({upcomingAppointments.filter((x) => x.type === 'APPOINTMENT').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentFilterTab('FOLLOW_UP')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${appointmentFilterTab === 'FOLLOW_UP'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Tái khám ({upcomingAppointments.filter((x) => x.type === 'FOLLOW_UP').length})</span>
                </button>
              </div>

              {/* Appointment List */}
              <div className="mt-3.5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {displayedUpcomingAppointments.length > 0 ? (
                  displayedUpcomingAppointments.map((apt) => {
                    const isFollowUp = apt.type === 'FOLLOW_UP';
                    return (
                      <div
                        key={apt.id}
                        onClick={() => handleOpenDetailModal(apt)}
                        className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isFollowUp
                          ? 'border-slate-100/90 hover:border-indigo-200 hover:bg-indigo-50/20 bg-white'
                          : 'border-slate-100/90 hover:border-teal-200 hover:bg-teal-50/20 bg-white'
                          }`}
                      >
                        {/* Date badge: Cân đối, tinh tế, không bao giờ rớt dòng */}
                        <div
                          className={`flex flex-col items-center justify-center rounded-xl min-w-[58px] w-[58px] h-[52px] shrink-0 border transition-all gap-1 ${isFollowUp
                            ? 'bg-indigo-50/70 border-indigo-100/90 text-indigo-700'
                            : 'bg-teal-50/70 border-teal-100/90 text-teal-700'
                            }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wide leading-none text-slate-500 whitespace-nowrap">
                            {apt.dayOfWeek}
                          </span>
                          <span
                            className={`text-[13px] font-black leading-none whitespace-nowrap tracking-tight ${isFollowUp ? 'text-indigo-950' : 'text-teal-950'
                              }`}
                          >
                            {apt.dayNumber}/{apt.monthNumber}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors" title={apt.title}>
                              {apt.title}
                            </h4>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${isFollowUp
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-teal-50 text-teal-700 border-teal-200'
                                  }`}
                              >
                                {isFollowUp ? (
                                  <>
                                    <RefreshCw className="h-2.5 w-2.5 text-indigo-600" />
                                    Tái khám
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="h-2.5 w-2.5 text-teal-600" />
                                    Lịch hẹn
                                  </>
                                )}
                              </span>

                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${apt.statusColor}`}
                              >
                                {apt.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] shrink-0 border border-teal-100/60">
                              <Clock className="h-3 w-3 text-teal-600" />
                              {apt.time}
                            </span>
                            <span className="flex items-center gap-1 text-slate-700 truncate max-w-[140px] sm:max-w-[180px]" title={apt.doctor}>
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{apt.doctor}</span>
                            </span>
                            {apt.branch ? (
                              <span className="flex items-center gap-1 text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" title={apt.branch}>
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{apt.branch}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Chevron right button */}
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:text-teal-700 group-hover:bg-slate-100 transition-colors shrink-0"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {appointmentFilterTab === 'FOLLOW_UP'
                        ? 'Chưa có lịch tái khám nào'
                        : appointmentFilterTab === 'APPOINTMENT'
                          ? 'Chưa có lịch hẹn khám nào'
                          : 'Chưa có lịch hẹn nào sắp tới'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {appointmentFilterTab === 'FOLLOW_UP'
                        ? 'Lịch tái khám do Bác sĩ chỉ định sau quá trình điều trị sẽ hiển thị tại đây.'
                        : 'Đặt lịch khám để được bác sĩ theo dõi định kỳ.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Kế hoạch điều trị (Hỗ trợ nhiều bản ghi dạng Tabs) */}
          <div className="lg:col-span-6 rounded-2xl bg-white p-5 sm:p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Kế hoạch điều trị
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                    {treatmentPlans.length} kế hoạch
                  </span>
                </div>
                <Link
                  to="/patient/medical-records"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-0.5 transition-colors group"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {activeTreatmentPlan ? (
                <>
                  {/* Pill Tabs Switcher khi có từ 2 kế hoạch trở lên */}
                  {treatmentPlans.length > 1 && (
                    <div className="mt-3.5 flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                      {treatmentPlans.map((plan, index) => {
                        const isActive = index === selectedPlanIndex;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanIndex(index)}
                            className={`flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                              ? 'bg-white text-teal-800 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                              }`}
                          >
                            <span className="truncate">{plan.title}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${isActive
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-slate-200/60 text-slate-500'
                                }`}
                            >
                              {plan.progressPercent}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Plan Card Banner */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                        <Activity className="h-5 w-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {activeTreatmentPlan.title}
                          </h4>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${activeTreatmentPlan.statusColor || 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {activeTreatmentPlan.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1 truncate">
                          Bác sĩ phụ trách: <span className="font-bold text-slate-800">{activeTreatmentPlan.doctor}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-slate-500 font-medium space-y-0.5 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <p className="flex items-center sm:justify-end gap-1">
                        <span className="text-slate-400">Bắt đầu:</span>
                        <span className="font-bold text-slate-700">{activeTreatmentPlan.startDate}</span>
                      </p>
                      <p className="flex items-center sm:justify-end gap-1">
                        <span className="text-slate-400">Dự kiến:</span>
                        <span className="font-bold text-teal-800">{activeTreatmentPlan.expectedEndDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Activity className="h-3.5 w-3.5 text-teal-600" />
                        {activeTreatmentPlan.currentStage}
                      </span>
                      <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {activeTreatmentPlan.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, activeTreatmentPlan.progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  {activeTreatmentPlan.steps && activeTreatmentPlan.steps.length > 0 ? (
                    <div className="mt-5 relative pt-1 pb-1">
                      {/* Connecting Line: Centered behind the 32px (h-8) circle -> top is 16px */}
                      <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
                      <div
                        className="absolute top-4 left-8 h-0.5 bg-teal-600 -z-0 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((activeTreatmentPlan.steps.filter((s) => s.statusType === 'completed').length +
                                (activeTreatmentPlan.steps.some((s) => s.statusType === 'in-progress') ? 0.5 : 0)) /
                                (activeTreatmentPlan.steps.length - 1 || 1)) *
                              100 *
                              0.88
                            )
                          )}%`,
                        }}
                      />

                      <div
                        className="gap-2 sm:gap-3 text-center relative z-10"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${activeTreatmentPlan.steps.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {activeTreatmentPlan.steps.map((step) => {
                          const isCompleted = step.statusType === 'completed';
                          const isInProgress = step.statusType === 'in-progress';

                          return (
                            <div key={step.stepNum} className="flex flex-col items-center">
                              {/* Step Circle */}
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${isCompleted
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : isInProgress
                                    ? 'bg-teal-700 text-white ring-4 ring-teal-100 shadow-xs'
                                    : 'bg-white text-slate-400 border-2 border-slate-200'
                                  }`}
                              >
                                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.stepNum}
                              </div>

                              {/* Giai đoạn index */}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 block leading-none">
                                Giai đoạn {step.stepNum}
                              </span>

                              {/* Step Title (gọn gàng, thanh lịch, tooltip đầy đủ) */}
                              <p className="mt-1 text-xs font-bold text-slate-800 line-clamp-2 leading-snug px-1 text-center" title={step.fullTitle}>
                                {step.title}
                              </p>

                              {/* Step Date (chỉ hiện nếu có ngày thực tế) */}
                              {step.date && (
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  {step.date}
                                </p>
                              )}

                              {/* Step Badge */}
                              <span
                                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold leading-normal ${isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isInProgress
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200 ring-2 ring-teal-500/10'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200/60'
                                  }`}
                              >
                                {isInProgress && <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />}
                                {step.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 py-5 text-center rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Chưa có giai đoạn nào được ghi nhận cho kế hoạch này</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Chưa có kế hoạch điều trị nào đang tiến hành</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Các kế hoạch điều trị chuyên sâu đang thực hiện sẽ được cập nhật lộ trình chi tiết tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 4. BOTTOM ROW: Lịch sử điều trị (Table) & Thao tác nhanh */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: Lịch sử điều trị (Table) */}
          <div className="lg:col-span-8 rounded-xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  Lịch sử điều trị
                </h3>
                <Link
                  to="/patient/medical-records"
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
                >
                  Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Ngày điều trị</th>
                      <th className="py-3 px-3">Dịch vụ</th>
                      <th className="py-3 px-3">Bác sĩ</th>
                      <th className="py-3 px-3">Chi nhánh</th>
                      <th className="py-3 px-3">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedHistory.length > 0 ? (
                      paginatedHistory.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenHistoryModal(item)}
                          className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                            {item.service}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {item.doctor}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {item.branch}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {item.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                          Chưa có lịch sử điều trị
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Phân trang khi lịch sử điều trị quá 4 dòng */}
            {treatmentHistory.length > itemsPerPage && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500 font-medium">
                  Trang <span className="font-bold text-slate-800">{historyPage}</span> / {totalHistoryPages} ({treatmentHistory.length} kết quả)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalHistoryPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setHistoryPage(pageNum)}
                      className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${pageNum === historyPage
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={historyPage === totalHistoryPages}
                    onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Thao tác nhanh (6 Emerald / Teal Unified Tiles) */}
          <div className="lg:col-span-4 rounded-xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Thao tác nhanh
              </h3>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={action.onClick}
                      className={`flex flex-col items-center justify-center rounded-xl p-3.5 text-center transition-all duration-200 ${action.bgColor} ${action.textColor} ${action.hoverColor} hover:scale-[1.02] active:scale-95 shadow-2xs cursor-pointer min-h-[86px]`}
                    >
                      <Icon className="h-5.5 w-5.5 mb-1.5 shrink-0" />
                      <span className="text-xs font-bold leading-tight">
                        {action.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODALS & POPUPS                                       */}
      {/* ======================================================== */}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${isDetailActive
            ? 'bg-slate-950/50 backdrop-blur-xs opacity-100'
            : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetailModal();
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all duration-200 ease-out ${isDetailActive
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-2'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Chi tiết lịch hẹn</h3>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Loại phiếu:</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${selectedAppointment.type === 'FOLLOW_UP'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                    }`}
                >
                  {selectedAppointment.type === 'FOLLOW_UP' ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                      Lịch tái khám (Theo chỉ định Bác sĩ)
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      Lịch hẹn khám (Đăng ký dịch vụ)
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Dịch vụ / Lý do:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Bác sĩ phụ trách:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.doctor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Thời gian:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.time} - {selectedAppointment.dayOfWeek}, {selectedAppointment.date}</span>
              </div>
              {selectedAppointment.branch ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Chi nhánh:</span>
                  <span className="font-bold text-slate-900">{selectedAppointment.branch}</span>
                </div>
              ) : null}
              {selectedAppointment.address ? (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Địa chỉ:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[240px]">{selectedAppointment.address}</span>
                </div>
              ) : null}
              {selectedAppointment.notes && selectedAppointment.notes !== 'Chưa có' && (
                <div className="flex items-start justify-between pt-1">
                  <span className="text-slate-500 font-medium">Ghi chú:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[240px] text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {selectedAppointment.notes}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Trạng thái:</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {selectedAppointment.status}
                </span>
              </div>

              {/* Thông báo trạng thái và điều kiện chỉnh sửa */}
              {selectedAppointment.type === 'FOLLOW_UP' ? (
                <div className="rounded-xl bg-indigo-50/80 border border-indigo-200/80 p-3.5 text-xs text-indigo-900 leading-relaxed font-medium">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950">
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                    Lịch tái khám do Bác sĩ chỉ định
                  </p>
                  Lịch tái khám được chỉ định trực tiếp theo phác đồ điều trị của Bác sĩ phụ trách và không áp dụng chỉnh sửa trực tuyến. Nếu cần điều chỉnh, quý khách vui lòng liên hệ trực tiếp hotline hoặc nhân viên tại quầy.
                </div>
              ) : (
                (() => {
                  const editCheck = checkAppointmentCreationEditable(selectedAppointment);
                  return (
                    <div
                      className={`rounded-xl border p-3.5 text-xs leading-relaxed font-medium ${editCheck.canEdit
                        ? 'bg-teal-50 border-teal-200 text-teal-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                    >
                      <p className={`font-bold mb-0.5 ${editCheck.canEdit ? 'text-teal-950' : 'text-amber-950'}`}>
                        {editCheck.canEdit
                          ? 'Thời gian chỉnh sửa trực tuyến hợp lệ'
                          : 'Khóa chỉnh sửa trực tuyến'}
                      </p>
                      {editCheck.reason}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer action buttons */}
            {selectedAppointment.type === 'FOLLOW_UP' ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            ) : (
              (() => {
                const editCheck = checkAppointmentCreationEditable(selectedAppointment);
                return (
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBookingModal(selectedAppointment)}
                      disabled={!editCheck.canEdit}
                      title={
                        !editCheck.canEdit
                          ? editCheck.reason
                          : 'Chỉnh sửa lại thông tin đặt lịch (trong vòng 1h kể từ khi đặt)'
                      }
                      className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${editCheck.canEdit
                        ? 'bg-teal-700 text-white hover:bg-teal-800 cursor-pointer hover:shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 border border-slate-300/60'
                        }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Chỉnh sửa lịch hẹn
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDetailModal}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Treatment History Detail Modal */}
      {selectedHistory && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${isHistoryActive
            ? 'bg-slate-950/50 backdrop-blur-xs opacity-100'
            : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseHistoryModal();
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all duration-200 ease-out ${isHistoryActive
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-2'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Chi tiết đợt điều trị</h3>
              <button
                type="button"
                onClick={handleCloseHistoryModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dịch vụ:</span>
                <span className="font-bold text-slate-900">{selectedHistory.service}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày thực hiện:</span>
                <span className="font-bold text-slate-900">{selectedHistory.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bác sĩ phụ trách:</span>
                <span className="font-bold text-slate-900">{selectedHistory.doctor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chi nhánh:</span>
                <span className="font-bold text-slate-900">{selectedHistory.branch}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 text-xs block mb-1">Ghi chú & kết quả bác sĩ:</span>
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed font-medium border border-slate-100">
                  {selectedHistory.notes}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleCloseHistoryModal}
                className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support / Contact Hotline Modal */}
      {isSupportOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${isSupportActive
            ? 'bg-slate-950/50 backdrop-blur-xs opacity-100'
            : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
            }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseSupportModal();
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all duration-200 ease-out ${isSupportActive
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-2'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Headphones className="h-5 w-5 text-teal-700" />
                <h3 className="text-base font-bold">Trung tâm hỗ trợ bệnh nhân</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSupportModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              <div className="rounded-xl bg-teal-50 p-4 border border-teal-100 text-center">
                <p className="font-bold text-teal-900">Tổng đài chăm sóc khách hàng 24/7</p>
                <a
                  href="tel:19001234"
                  className="mt-1 block text-2xl font-black text-teal-800 hover:underline"
                >
                  1900 1234
                </a>
                <p className="text-[11px] text-teal-600 mt-1">Miễn phí cước gọi từ mọi mạng</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">Hệ thống chi nhánh Crown Dental:</p>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 1 (Quận 1):</p>
                  <p className="text-slate-500">123 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1 - ĐT: 028 3930 1111</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 2 (Tân Bình):</p>
                  <p className="text-slate-500">45 Hoàng Hoa Thám, P.13, Q. Tân Bình - ĐT: 028 3810 2222</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-2.5 space-y-1">
                  <p className="font-bold text-slate-800">Chi nhánh 3 (Thủ Đức):</p>
                  <p className="text-slate-500">88 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức - ĐT: 028 3720 3333</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleCloseSupportModal}
                className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Booking Appointment Multi-Step Modal */}
      <PatientBookingModal
        isOpen={isBookingModalOpen}
        initialAppointment={editingAppointment}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={() => {
          setEditingAppointment(null);
          const patientId = user?.patientId || user?.id;
          if (patientId) {
            loadAllDashboardData(patientId);
          }
        }}
      />

    </div>
  );
}
