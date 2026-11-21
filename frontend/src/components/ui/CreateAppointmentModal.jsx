import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Check,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Star,
  Building,
  Edit3,
  Stethoscope,
  FileText,
  Phone,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getBranches } from '../../services/clinic.service';
import { getDentistsList } from '../../services/dentist.service';
import { APPOINTMENT_REASONS } from '../../constants/appointmentReasons';
import {
  createAppointment,
  updateAppointment,
  checkDentistAppointmentSlot,
  getDentistBookedTimesByDate,
} from '../../services/appointment.service';
import { getEmployeeAddressById, getEmployeesList } from '../../services/employee.service';

export const getCategoryLabel = (category) => {
  switch (category) {
    case 'KHAM_DIEU_TRI':
      return 'Khám & Chẩn đoán';
    case 'RANG_SU':
      return 'Răng sứ & Thẩm mỹ';
    case 'TAY_TRANG':
      return 'Tẩy trắng răng';
    case 'IMPLANT':
      return 'Cấy ghép Implant';
    case 'NIENG_RANG':
      return 'Niềng răng - Chỉnh nha';
    default:
      return 'Khám nha khoa';
  }
};

export const getIconTypeByCategory = (category) => {
  switch (category) {
    case 'NIENG_RANG':
      return 'ortho';
    case 'IMPLANT':
      return 'implant';
    case 'RANG_SU':
      return 'crown';
    case 'TAY_TRANG':
      return 'whitening';
    default:
      return 'general';
  }
};

const SERVICE_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'KHAM_DIEU_TRI', label: 'Khám & Chẩn đoán' },
  { id: 'RANG_SU', label: 'Răng sứ & Thẩm mỹ' },
  { id: 'TAY_TRANG', label: 'Tẩy trắng răng' },
  { id: 'IMPLANT', label: 'Cấy ghép Implant' },
  { id: 'NIENG_RANG', label: 'Niềng răng' },
  { id: 'OTHER', label: 'Khác / Yêu cầu riêng' },
];

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const EVENING_SLOTS = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

const formatYMD = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatVND = (num) => {
  if (num == null || isNaN(num)) return '0đ';
  return Number(num).toLocaleString('vi-VN') + 'đ';
};

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const cleanDoctorTitle = (name) => {
  if (!name || name === 'Chưa có') return 'BS. Crown Dental';
  let clean = String(name).trim();
  clean = clean.replace(/^(BS\.?\s*)+(ThS|TS|PGS|GS)\.?\s*(BS\.?\s*)?/i, '$2. BS. ');
  clean = clean.replace(/^(BS\.?\s*)+/i, 'BS. ');
  clean = clean.replace(/^(ThS\.?\s*)+/i, 'ThS. ');
  clean = clean.replace(/^(TS\.?\s*)+/i, 'TS. ');
  if (!/^(BS|ThS|TS|PGS|GS)\.?\s+/i.test(clean)) {
    clean = `BS. ${clean}`;
  }
  return clean.replace(/\s+/g, ' ');
};

const DentalToothIcon = ({ className = 'w-8 h-8' }) => (
  <div className={`flex items-center justify-center rounded-lg bg-teal-50 border border-teal-600/20 p-1.5 text-teal-700 shadow-xs ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-xs">
      <path d="M12 2C8.5 2 7 4 7 7c0 2 1 4 1 6.5 0 2.5-.5 5 1 6.5 1 1 2 0 3-3 1 3 2 4 3 3 1.5-1.5 1-4 1-6.5 0-2.5 1-4.5 1-6.5 0-3-1.5-5-5-5z" />
      <path d="M9 7c1 1.5 2 1.5 3 0 1 1.5 2 1.5 3 0" />
    </svg>
  </div>
);

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
      <div className={`${className} rounded-full bg-teal-800 text-teal-100 border border-teal-700 flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} rounded-full object-cover border border-slate-200 shrink-0`}
    />
  );
};

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  type = 'add',
  payload = null,
  initialData = null,
  onSuccess,
}) {
  const { user } = useAuth();
  const isEditMode = type === 'edit';
  const targetData = payload || initialData;

  // Step state: 1 -> 4
  const [step, setStep] = useState(1);

  // Data lists
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [branches, setBranches] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Dịch vụ / Lý do khám
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedService, setSelectedService] = useState(null);
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');

  // Step 2: Chi nhánh & Bác sĩ
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [employeeBranchId, setEmployeeBranchId] = useState(null);
  const [employeeBranchName, setEmployeeBranchName] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');

  // Step 3: Ngày & Giờ khám
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatYMD(tomorrow);
  });
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Step 4: Thông tin bệnh nhân & Xác nhận (Đã BỎ: dob, roomId, priority)
  const [patientInfo, setPatientInfo] = useState({
    fullName: '',
    phone: '',
    gender: 'Nam',
  });
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // 1-hour editing rule check (bypass if allowReschedule is true)
  const isCreatedOverOneHour = useMemo(() => {
    if (!isEditMode) return false;
    if (targetData?.allowReschedule) return false;
    const cVal = targetData?.createdAt || targetData?.createAt;
    if (!cVal) return false;
    try {
      const cTime = new Date(cVal).getTime();
      if (isNaN(cTime)) return false;
      return Date.now() - cTime > 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }, [isEditMode, targetData]);

  // Load Initial Data (Branches, Dentists, Employee Branch, Target Data)
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);

    const initData = async () => {
      try {
        // 0. Sử dụng danh mục lý do khám tĩnh chuẩn (APPOINTMENT_REASONS)
        setLoadingServices(true);
        const mappedReasons = APPOINTMENT_REASONS.map((r) => ({
          id: r.id,
          serviceCode: r.id,
          serviceName: r.reasonName,
          category: r.category || 'KHAM_DIEU_TRI',
          categoryLabel: getCategoryLabel(r.category),
          price: 0,
          discountedPrice: null,
          estimatedDuration: r.estimatedDuration || 30,
          description: r.description || 'Lý do khám và tư vấn điều trị',
          imageUrl: '',
          iconType: getIconTypeByCategory(r.category),
        }));

        setServices(mappedReasons);
        setLoadingServices(false);

        // 1. Fetch Branches directly from DB
        const rawBranches = await getBranches().catch(() => []);
        let bList = Array.isArray(rawBranches) ? rawBranches : rawBranches?.data || [];
        bList = bList.map((b) => ({
          branchId: b.branchId || b.id,
          id: b.branchId || b.id,
          branchName: b.branchName || b.name || 'Crown Dental - Trung tâm Nha khoa',
          address: b.address || b.clinicAddress || 'TP. Hồ Chí Minh',
          openHours: b.openHours || '08:00 - 20:00 (Thứ 2 - Chủ nhật)',
          image: b.image || b.imageUrl || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
        }));
        setBranches(bList);

        // 2. Fetch Employee's Branch (Lấy chi nhánh của employee đang đăng nhập)
        let empBranchId = user?.branchId || null;
        let empBranchName = user?.branchName || null;

        try {
          let empProfile = null;
          const empId = user?.employeeId;
          if (empId) {
            empProfile = await getEmployeeAddressById(empId).catch(() => null);
          }
          if (!empProfile && user?.id) {
            empProfile = await getEmployeeAddressById(user.id).catch(() => null);
          }
          if (!empProfile) {
            const empListRes = await getEmployeesList().catch(() => []);
            const empList = Array.isArray(empListRes) ? empListRes : empListRes?.data || [];
            const found = empList.find(
              (e) =>
                (user?.id && (e.userId === user.id || e.id === user.id)) ||
                (user?.email && e.email === user.email) ||
                (user?.username &&
                  (e.name === user.username ||
                    e.username === user.username ||
                    (e.fullName && e.fullName.toLowerCase().includes(user.username.toLowerCase()))))
            );
            if (found) {
              empProfile = found;
            }
          }

          const pData = empProfile?.data || empProfile;
          if (pData?.branchId) {
            empBranchId = pData.branchId;
            empBranchName = pData.branchName || empBranchName;
          }
        } catch (err) {
          console.warn('Lỗi lấy chi nhánh của employee:', err);
        }

        setEmployeeBranchId(empBranchId);
        setEmployeeBranchName(empBranchName);

        // Set default selected branch based on logged-in employee's branch
        let defaultBranch = bList[0] || null;
        if (isEditMode && targetData?.branchId) {
          // If editing existing appointment, respect existing appointment branch
          const matched = bList.find(
            (b) => String(b.branchId || b.id).toLowerCase() === String(targetData.branchId).toLowerCase()
          );
          if (matched) defaultBranch = matched;
        } else if (empBranchId) {
          // Mặc định lấy theo chi nhánh của employee đang đăng nhập
          const matched = bList.find(
            (b) => String(b.branchId || b.id).toLowerCase() === String(empBranchId).toLowerCase()
          );
          if (matched) defaultBranch = matched;
        } else if (empBranchName) {
          const matched = bList.find(
            (b) =>
              b.branchName &&
              (b.branchName.toLowerCase().includes(empBranchName.toLowerCase()) ||
                empBranchName.toLowerCase().includes(b.branchName.toLowerCase()))
          );
          if (matched) defaultBranch = matched;
        } else if (targetData?.branchId) {
          const matched = bList.find(
            (b) => String(b.branchId || b.id).toLowerCase() === String(targetData.branchId).toLowerCase()
          );
          if (matched) defaultBranch = matched;
        }
        setSelectedBranch(defaultBranch);

        // 3. Fetch Dentists directly from DB (Giữ nguyên branchId và branchName thực tế của từng bác sĩ)
        const rawDentists = await getDentistsList().catch(() => []);
        let dList = Array.isArray(rawDentists) ? rawDentists : rawDentists?.data || [];
        const seen = new Set();
        dList = dList
          .filter((d) => {
            const rawName = d.fullName || d.name || d.user?.fullName || d.user?.username || '';
            if (!rawName || seen.has(rawName)) return false;
            seen.add(rawName);
            return true;
          })
          .map((d) => {
            const rawName = d.fullName || d.name || d.user?.fullName || d.user?.username || 'Bác sĩ chuyên khoa';
            const cleanName = cleanDoctorTitle(rawName);
            const specialty =
              d.specialization ||
              d.description ||
              d.qualification ||
              (Array.isArray(d.specializations) && d.specializations.length > 0
                ? d.specializations.map((s) => s.name || s).join(', ')
                : 'Chuyên khoa Nha khoa tổng quát');
            return {
              id: d.id,
              name: cleanName,
              fullName: cleanName,
              specialization: specialty,
              rating: 4.9,
              reviewCount: 95,
              experienceYears: d.experienceYears || 10,
              avatar: d.avatar || d.user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
              branchId: d.branchId || d.branch_id || (d.branch && (d.branch.branchId || d.branch.id)) || null,
              branchName: d.branchName || d.branch_name || (d.branch && d.branch.branchName) || '',
            };
          });
        setDentists(dList);

        // 4. Populate existing data if targetData is provided (edit or from online request)
        if (targetData) {
          // Patient info
          const pName = targetData.patientName || targetData.fullName || targetData.name || '';
          const pPhone = targetData.phone || targetData.phoneNumber || '';
          const pGender = targetData.gender === 'Nữ' || targetData.gender === 'FEMALE' ? 'Nữ' : 'Nam';
          setPatientInfo({
            fullName: pName,
            phone: pPhone,
            gender: pGender,
          });

          // Notes
          const rawNotes = targetData.notes || targetData.description || targetData.note || '';
          const cleanNotes = rawNotes.replace(/^\[ƯU TIÊN \/ CẤP CỨU\]\s*/, '').trim();
          setAppointmentNotes(cleanNotes);

          // Reason / Service
          const targetReason = targetData.service || targetData.reason || targetData.title || targetData.note || '';
          const foundService = fetchedServices.find(
            (s) => s.serviceName.toLowerCase() === targetReason.toLowerCase()
          );
          if (foundService) {
            setSelectedService(foundService);
            setIsCustomReason(false);
          } else if (targetReason) {
            setIsCustomReason(true);
            setCustomReasonText(targetReason);
            setSelectedService({
              id: 'custom-reason',
              serviceName: targetReason,
              categoryLabel: 'Lý do khám',
              category: 'OTHER',
              price: 0,
              estimatedDuration: 45,
              description: targetReason,
            });
          } else {
            setSelectedService(fetchedServices[0] || null);
          }

          // Dentist pre-selection
          if (targetData.dentistId || targetData.dentistName || targetData.doctor) {
            const matchDentist = dList.find(
              (d) =>
                d.id === targetData.dentistId ||
                (targetData.dentistName && d.name.toLowerCase().includes(targetData.dentistName.toLowerCase())) ||
                (targetData.doctor && d.name.toLowerCase().includes(targetData.doctor.toLowerCase()))
            );
            if (matchDentist) setSelectedDentist(matchDentist);
          }

          // Date & Time
          let dateStr = new Date().toISOString().split('T')[0];
          const rawDate = targetData.appointmentDate || targetData.date;
          if (rawDate) {
            try {
              const raw = String(rawDate).trim().replace(' ', 'T');
              const dPart = raw.includes('T') ? raw.split('T')[0] : raw;
              if (/^\d{4}-\d{2}-\d{2}$/.test(dPart)) {
                dateStr = dPart;
              }
            } catch (e) { }
          }
          setSelectedDate(dateStr);
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            setCalendarMonth(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
          }

          let timeStr = '09:00';
          const rawTime = targetData.appointmentTime || targetData.time;
          if (rawTime) {
            try {
              const raw = String(rawTime).trim().replace(' ', 'T');
              const tPart = raw.includes('T') ? raw.split('T')[1] : raw;
              const tSplits = tPart.split(':');
              if (tSplits.length >= 2) {
                timeStr = `${tSplits[0].padStart(2, '0')}:${tSplits[1].padStart(2, '0')}`;
              }
            } catch (e) { }
          }
          setSelectedTime(timeStr);
        } else {
          // Fresh appointment defaults
          setSelectedService(fetchedServices[0] || null);
          setIsCustomReason(false);
          setCustomReasonText('');
          setPatientInfo({
            fullName: '',
            phone: '',
            gender: 'Nam',
          });
          setAppointmentNotes('');
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = formatYMD(tomorrow);
          setSelectedDate(tomorrowStr);
          setSelectedTime('09:00');
          setCalendarMonth(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu đặt lịch hẹn:', err);
      }
    };

    initData();
  }, [isOpen, targetData, isEditMode, user]);

  // Kiểm tra danh sách khung giờ đã có lịch hẹn của bác sĩ từ DB theo ngày đã chọn
  useEffect(() => {
    if (!selectedDentist?.id || !selectedDate) {
      setBookedTimes([]);
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);

    getDentistBookedTimesByDate(
      selectedDentist.id,
      selectedDate,
      isEditMode ? targetData?.id : null
    )
      .then((times) => {
        if (!isMounted) return;
        setBookedTimes(times);
        setSelectedTime((currentTime) => {
          if (!times.includes(currentTime)) return currentTime;
          return [...MORNING_SLOTS, ...AFTERNOON_SLOTS, ...EVENING_SLOTS]
            .find((time) => !times.includes(time)) || '';
        });
      })
      .catch((err) => {
        console.warn('Lỗi lấy danh sách giờ hẹn đã đặt của bác sĩ:', err);
        if (isMounted) setBookedTimes([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDentist?.id, selectedDate, isEditMode, targetData?.id]);

  // Filtered Services for Step 1
  const filteredServices = useMemo(() => {
    if (activeTab === 'ALL') return services;
    if (activeTab === 'OTHER') {
      return services.filter(
        (s) => !['KHAM_DIEU_TRI', 'RANG_SU', 'TAY_TRANG', 'IMPLANT', 'NIENG_RANG'].includes(s.category)
      );
    }
    return services.filter((s) => s.category === activeTab);
  }, [services, activeTab]);

  // Danh sách bác sĩ lọc CHÍNH XÁC theo chi nhánh đang chọn (mặc định theo chi nhánh của employee đăng nhập)
  const availableDentists = useMemo(() => {
    if (!selectedBranch) return [];
    const targetBranchId = String(selectedBranch.branchId || selectedBranch.id || '').trim().toLowerCase();
    const targetBranchName = String(selectedBranch.branchName || '').trim().toLowerCase();

    let list = dentists.filter((d) => {
      const dBranchId = String(d.branchId || '').trim().toLowerCase();
      const dBranchName = String(d.branchName || '').trim().toLowerCase();

      // 1. So khớp trực tiếp theo ID chi nhánh
      if (dBranchId && targetBranchId) {
        if (dBranchId === targetBranchId || dBranchId.includes(targetBranchId) || targetBranchId.includes(dBranchId)) {
          return true;
        }
      }

      // 2. So khớp theo Tên chi nhánh
      if (dBranchName && targetBranchName) {
        if (dBranchName === targetBranchName || dBranchName.includes(targetBranchName) || targetBranchName.includes(dBranchName)) {
          return true;
        }
        // Phân tích mã Cơ sở 1 (Q1), Cơ sở 2 (BT)...
        const getBranchCode = (str) => {
          const m = str.match(/cơ\s*sở\s*(\d+)/i) || str.match(/chi\s*nhánh\s*(\d+)/i) || str.match(/branch_?(\w+)/i);
          return m ? m[1].toLowerCase() : null;
        };
        const c1 = getBranchCode(dBranchName) || getBranchCode(dBranchId);
        const c2 = getBranchCode(targetBranchName) || getBranchCode(targetBranchId);
        if (c1 && c2 && c1 === c2) return true;
      }

      return false;
    });

    // Specialty filter
    if (specialtyFilter !== 'ALL') {
      list = list.filter((d) => d.specialization && d.specialization.toLowerCase().includes(specialtyFilter.toLowerCase()));
    }
    return list;
  }, [dentists, selectedBranch, specialtyFilter]);

  // Ensure a dentist is selected when branch changes
  useEffect(() => {
    if (availableDentists.length > 0) {
      const isStillAvailable = availableDentists.some((d) => d.id === selectedDentist?.id);
      if (!isStillAvailable) {
        setSelectedDentist(availableDentists[0]);
      }
    } else {
      setSelectedDentist(null);
    }
  }, [availableDentists, selectedDentist]);

  // Mini Calendar generation logic for Step 3
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 7 : startDay; // T2 là 1, CN là 7

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Ngày của tháng trước
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

    // Ngày trong tháng hiện tại
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateString: formatYMD(d),
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Ngày của tháng sau để đủ 42 ô
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

  // Format chosen date for Vietnamese display
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayName = dayNames[d.getDay()];
      return `${dayName}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return selectedDate;
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  // Handle final submission (Tạo lịch hoặc Đổi lịch)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isEditMode && isCreatedOverOneHour) {
      toast.error('Lịch hẹn chỉ được phép sửa trong vòng 1 giờ kể từ thời điểm tạo. Đã quá 1 giờ, không thể sửa!');
      return;
    }

    if (!patientInfo.fullName.trim() || !patientInfo.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại bệnh nhân!');
      setStep(4);
      return;
    }

    if (!selectedDentist) {
      toast.error('Vui lòng chọn bác sĩ phụ trách ca khám!');
      setStep(2);
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn ngày và giờ khám!');
      setStep(3);
      return;
    }
    if (bookedTimes.includes(selectedTime)) {
      toast.error('Khung giờ này đã có lịch của bác sĩ, vui lòng chọn giờ khác.');
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const aptId = targetData?.appointmentId || targetData?.id || null;
      const reqId = targetData?.requestId || targetData?.id || null;
      const finalReason = selectedService?.serviceName || customReasonText || 'Khám tổng quát';

      const payloadData = {
        requestId: isValidUUID(reqId) && !isEditMode ? reqId : null,
        patientId: isValidUUID(targetData?.patientId) ? targetData.patientId : null,
        branchId: selectedBranch?.branchId || selectedBranch?.id || null,
        branchName: selectedBranch?.branchName || null,
        fullName: patientInfo.fullName.trim(),
        phone: patientInfo.phone.trim(),
        gender: patientInfo.gender || 'Nam',
        dentistId: isValidUUID(selectedDentist?.id) ? selectedDentist.id : null,
        roomId: null, // Đã bỏ trường phòng khám theo yêu cầu
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: finalReason.trim(),
        notes: appointmentNotes.trim(),
        status: isEditMode
          ? targetData?.status === 'PENDING' && selectedDentist?.id
            ? 'CONFIRMED'
            : targetData?.status || 'CONFIRMED'
          : undefined,
      };

      if (isEditMode && aptId && !String(aptId).startsWith('mock-')) {
        await updateAppointment(aptId, payloadData);
        toast.success(`Đã đổi lịch khám thành công cho bệnh nhân ${patientInfo.fullName}!`);
      } else {
        await createAppointment(payloadData);
        toast.success(`Đã tạo lịch khám thành công cho bác sĩ ${selectedDentist.name}!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu lịch hẹn:', err);
      toast.error(err.response?.data?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[96vh] flex flex-col font-sans text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-teal-800/40 bg-teal-800 px-5 py-3.5 text-white shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 border border-white/20 text-white shadow-2xs shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200">
                  {isEditMode ? 'Xếp / Đổi Lịch Khám Bệnh Nhân' : 'Đặt Lịch Khám Bệnh Nhân'}
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                  <Sparkles size={10} /> Đã kết nối Hệ thống Bác sĩ
                </span>
              </div>
              <h3 className="text-base font-extrabold leading-tight text-white tracking-wide">
                {isEditMode ? 'Cập Nhật & Phân Công Ca Khám' : 'Phân Công Bác Sĩ & Tạo Ca Khám'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-teal-100 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar (Giống như bên role patient) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div
              onClick={() => setStep(1)}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div
                className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700/20 shadow-xs'
                  : step > 1
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }`}
              >
                {step > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-xs font-semibold ${step === 1 ? 'text-teal-800 font-bold' : step > 1 ? 'text-slate-700' : 'text-slate-400'}`}>
                Thông tin & Lý do khám
              </span>
            </div>

            <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 2 ? 'bg-teal-700' : 'bg-slate-200'}`} />

            {/* Step 2 */}
            <div
              onClick={() => step > 2 && setStep(2)}
              className={`flex items-center gap-2 select-none ${step >= 2 ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700/20 shadow-xs'
                  : step > 2
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }`}
              >
                {step > 2 ? <Check className="h-3 w-3 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-teal-800 font-bold' : step > 2 ? 'text-slate-700' : 'text-slate-400'}`}>
                Chi nhánh & Bác sĩ
              </span>
            </div>

            <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 3 ? 'bg-teal-700' : 'bg-slate-200'}`} />

            {/* Step 3 */}
            <div
              onClick={() => step > 3 && setStep(3)}
              className={`flex items-center gap-2 select-none ${step >= 3 ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 3
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700/20 shadow-xs'
                  : step > 3
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }`}
              >
                {step > 3 ? <Check className="h-3 w-3 stroke-[3]" /> : '3'}
              </div>
              <span className={`text-xs font-semibold ${step === 3 ? 'text-teal-800 font-bold' : step > 3 ? 'text-slate-700' : 'text-slate-400'}`}>
                Thời gian khám
              </span>
            </div>

            <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 4 ? 'bg-teal-700' : 'bg-slate-200'}`} />

            {/* Step 4 */}
            <div className="flex items-center gap-2 select-none">
              <div
                className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 4
                  ? 'bg-teal-700 text-white ring-2 ring-teal-700/20 shadow-xs'
                  : 'bg-slate-200 text-slate-500'
                  }`}
              >
                4
              </div>
              <span className={`text-xs font-semibold ${step === 4 ? 'text-teal-800 font-bold' : 'text-slate-400'}`}>
                Xác nhận
              </span>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/60">
          {/* ================= STEP 1: THÔNG TIN BỆNH NHÂN & LÝ DO KHÁM ================= */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* PHẦN NHẬP THÔNG TIN BỆNH NHÂN (ĐƯỢC CHUYỂN LÊN ĐẦU THEO YÊU CẦU) */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5.5 w-5.5 rounded bg-teal-50 text-teal-700 flex items-center justify-center">
                      <User size={13} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Thông tin bệnh nhân
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Bắt buộc Họ tên & SĐT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
                  {/* Họ và tên */}
                  <div className="sm:col-span-1 lg:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={patientInfo.fullName}
                        onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 shadow-2xs"
                      />
                      <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="sm:col-span-1 lg:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={patientInfo.phone}
                        onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                        placeholder="09xx xxx xxx"
                        className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 shadow-2xs"
                      />
                      <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Giới tính */}
                  <div className="sm:col-span-1 lg:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Giới tính</label>
                    <select
                      value={patientInfo.gender}
                      onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 bg-white cursor-pointer shadow-2xs"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* Chi nhánh tiếp nhận khám */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-12">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Chi nhánh tiếp nhận khám</label>
                    <div className="p-2 rounded-md bg-teal-50/70 border border-teal-200/80 flex items-center justify-between text-xs text-teal-900 font-medium">
                      <div className="flex items-center gap-2 truncate">
                        <Building size={14} className="text-teal-700 shrink-0" />
                        <span className="font-bold truncate">{selectedBranch?.branchName || 'Chi nhánh Crown Dental'}</span>
                        <span className="text-[11px] text-slate-500 truncate hidden sm:inline">({selectedBranch?.address})</span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Tabs Chọn dịch vụ / Lý do khám */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-teal-700" />
                    Lý do khám bệnh <span className="text-rose-500">*</span>
                  </h3>
                  <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Đã chọn: {selectedService?.serviceName || 'Chưa chọn'}
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
                  {SERVICE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'OTHER') {
                          setIsCustomReason(true);
                          if (!customReasonText) {
                            setSelectedService({
                              id: 'custom',
                              serviceName: 'Khám theo yêu cầu',
                              price: 0,
                              estimatedDuration: 30,
                              description: 'Khám theo yêu cầu bệnh nhân',
                              category: 'OTHER',
                              categoryLabel: 'Khác',
                            });
                          }
                        }
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === tab.id
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-teal-50 border border-slate-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ô nhập lý do tùy ý khi chọn tab Khác */}
              {activeTab === 'OTHER' && (
                <div className="bg-white p-3 rounded-lg border border-teal-700/40 bg-teal-50/30 shadow-2xs space-y-1.5 animate-in fade-in duration-100">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Nhập chi tiết lý do khám / dịch vụ theo yêu cầu: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customReasonText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomReasonText(val);
                      setIsCustomReason(true);
                      setSelectedService({
                        id: 'custom',
                        serviceName: val || 'Khám theo yêu cầu',
                        price: 0,
                        estimatedDuration: 30,
                        description: val || 'Khám theo yêu cầu bệnh nhân',
                        category: 'OTHER',
                        categoryLabel: 'Khác',
                      });
                    }}
                    placeholder="Ví dụ: Đau nhức răng hàm dưới, tư vấn niềng răng mắc cài..."
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700/30 bg-white"
                  />
                </div>
              )}

              {/* Service Cards Grid */}
              {loadingServices ? (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
                  <div className="h-6 w-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Đang tải danh mục dịch vụ từ cơ sở dữ liệu...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredServices.map((srv) => {
                    const isSelected = selectedService?.serviceName === srv.serviceName;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedService(srv);
                          setIsCustomReason(false);
                        }}
                        className={`relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                          ? 'border-teal-700 bg-teal-50/50 shadow-2xs ring-1 ring-teal-700/30'
                          : 'border-slate-200 bg-white hover:border-teal-700/40 hover:shadow-2xs'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <DentalToothIcon className="w-8 h-8 rounded-md" />
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white'
                              }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                              {srv.serviceName}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {srv.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            ~{srv.estimatedDuration} phút
                          </span>
                          <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {srv.categoryLabel || 'Khám & Tư vấn'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: CHỌN CHI NHÁNH & BÁC SĨ ================= */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-in fade-in duration-150">
              {/* Left Column: Chi nhánh tiếp nhận khám (Readonly theo tài khoản nhân viên đang đăng nhập) */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-teal-700" />
                    Chi nhánh tiếp nhận khám
                  </h3>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                    <ShieldCheck size={11} /> Cố định theo tài khoản
                  </span>
                </div>

                {selectedBranch ? (
                  <div className="p-3 rounded-lg border border-teal-700 bg-teal-50/50 shadow-2xs ring-1 ring-teal-700/30 flex gap-3 select-none">
                    <img
                      src={selectedBranch.image}
                      alt={selectedBranch.branchName}
                      className="h-16 w-16 rounded-md object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{selectedBranch.branchName}</h4>
                        <div className="h-4 w-4 rounded-full border border-teal-700 bg-teal-700 text-white flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-teal-800 bg-teal-100/90 border border-teal-200 px-1.5 py-0.2 rounded mt-1 inline-block">
                        Chi nhánh của bạn (Readonly)
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedBranch.address}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{selectedBranch.openHours}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-slate-200 bg-white text-center text-slate-500 text-xs">
                    Đang tải chi nhánh của nhân viên...
                  </div>
                )}


              </div>

              {/* Right Column: Chọn bác sĩ */}
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                      Bác sĩ phụ trách chuyên môn <span className="text-rose-500">*</span>
                    </h3>
                    <p className="text-[10px] text-teal-700 font-medium mt-0.5">
                      Hiển thị {availableDentists.length} bác sĩ thuộc {selectedBranch?.branchName || 'chi nhánh'}
                    </p>
                  </div>

                  {/* Specialty Filter Dropdown */}
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="ALL">Tất cả chuyên khoa</option>
                    <option value="Implant">Implant</option>
                    <option value="Răng sứ">Răng sứ thẩm mỹ</option>
                    <option value="Nha chu">Nha chu</option>
                    <option value="Tổng quát">Tổng quát</option>
                    <option value="Niềng">Niềng răng</option>
                  </select>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1 max-h-[440px]">
                  {availableDentists.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
                      <User className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-600">Không tìm thấy bác sĩ tại {selectedBranch?.branchName || 'chi nhánh này'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng kiểm tra phân công chi nhánh hoặc chọn bộ lọc chuyên khoa khác</p>
                    </div>
                  ) : (
                    availableDentists.map((doc) => {
                      const isSelected = selectedDentist?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 select-none ${isSelected
                            ? 'border-teal-700 bg-teal-50/50 shadow-2xs ring-1 ring-teal-700/30'
                            : 'border-slate-200 bg-white hover:border-teal-700/40'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <DoctorAvatar src={doc.avatar} name={doc.name} className="h-10 w-10" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-slate-800 truncate">{doc.name}</h4>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-1.5 py-0.2 rounded">
                                  <Award size={10} /> {doc.experienceYears || 10}+ năm KN
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {doc.specialization}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {typeof doc.rating === 'number' ? doc.rating.toFixed(1) : doc.rating || '5.0'}
                                </span>
                                <span className="text-slate-400">({doc.reviewCount || 100} đánh giá)</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDentist(doc)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${isSelected
                              ? 'bg-teal-700 text-white shadow-2xs font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                              }`}
                          >
                            {isSelected ? 'Đã chọn' : 'Chọn'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CHỌN THỜI GIAN KHÁM ================= */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-in fade-in duration-150">
              {/* Cột 1: Chọn ngày khám */}
              <div className="lg:col-span-5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800">Chọn ngày khám</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                      }
                      className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 min-w-[85px] text-center">
                      Tháng {calendarMonth.getMonth() + 1}/{calendarMonth.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                      }
                      className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        setSelectedDate(formatYMD(now));
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-teal-700 hover:bg-teal-50 rounded-sm border border-teal-700/30 cursor-pointer transition-colors"
                    >
                      Hôm nay
                    </button>
                  </div>
                </div>

                {/* Day of Week Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayItem, idx) => {
                    const isSelected = selectedDate === dayItem.dateString;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (dayItem.dateString) {
                            setSelectedDate(dayItem.dateString);
                            if (!dayItem.isCurrentMonth) {
                              setCalendarMonth(new Date(dayItem.date.getFullYear(), dayItem.date.getMonth(), 1));
                            }
                          }
                        }}
                        className={`relative h-7.5 rounded-md flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${isSelected
                          ? 'bg-teal-700 text-white shadow-2xs scale-105 z-10'
                          : dayItem.isCurrentMonth
                            ? 'text-slate-800 hover:bg-teal-50 hover:text-teal-700'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                      >
                        <span>{dayItem.dayNumber || dayItem.date.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input chọn ngày trực tiếp */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-teal-700" />
                    Ngày hẹn khám:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedDate(val);
                        const parts = val.split('-');
                        if (parts.length === 3) {
                          setCalendarMonth(new Date(Number(parts[0]), Number(parts[1]) - 1, 1));
                        }
                      }
                    }}
                    className="flex-1 max-w-[155px] px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-white border border-slate-200 focus:border-teal-700 focus:bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Cột 2: Chọn khung giờ */}
              <div className="lg:col-span-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Khung giờ khám</h3>
                    {loadingSlots ? (
                      <span className="text-[10px] text-teal-600 italic">Đang kiểm tra lịch trống...</span>
                    ) : bookedTimes.length > 0 ? (
                      <span className="text-[10px] text-amber-600 font-medium">Bác sĩ có {bookedTimes.length} giờ đã kín</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Tất cả khung giờ đều sẵn sàng</span>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-700/20">
                    {selectedTime}
                  </span>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1 max-h-[350px]">
                  {/* Buổi sáng */}
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                      <Clock className="h-3 w-3 text-teal-700" />
                      Sáng (08:00 - 11:30)
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {MORNING_SLOTS.map((time) => {
                        const isSelected = selectedTime === time;
                        const isBooked = bookedTimes.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            title={isBooked ? 'Bác sĩ đã có lịch khám vào khung giờ này' : `Chọn giờ ${time}`}
                            onClick={() => !isBooked && setSelectedTime(time)}
                            className={`relative py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-teal-700 text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 cursor-pointer'
                            }`}
                          >
                            {time}
                            {isBooked && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buổi chiều */}
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      Chiều (13:30 - 17:00)
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {AFTERNOON_SLOTS.map((time) => {
                        const isSelected = selectedTime === time;
                        const isBooked = bookedTimes.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            title={isBooked ? 'Bác sĩ đã có lịch khám vào khung giờ này' : `Chọn giờ ${time}`}
                            onClick={() => !isBooked && setSelectedTime(time)}
                            className={`relative py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-teal-700 text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 cursor-pointer'
                            }`}
                          >
                            {time}
                            {isBooked && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buổi tối */}
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      Tối (17:30 - 20:00)
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {EVENING_SLOTS.map((time) => {
                        const isSelected = selectedTime === time;
                        const isBooked = bookedTimes.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBooked}
                            title={isBooked ? 'Bác sĩ đã có lịch khám vào khung giờ này' : `Chọn giờ ${time}`}
                            onClick={() => !isBooked && setSelectedTime(time)}
                            className={`relative py-1.5 rounded-md text-xs font-semibold transition-all ${
                              isBooked
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-teal-700 text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 cursor-pointer'
                            }`}
                          >
                            {time}
                            {isBooked && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nhập giờ tùy ý */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-teal-700" />
                        Hoặc nhập giờ khám:
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={async (e) => {
                          const time = e.target.value;
                          if (!time) return;
                          if (bookedTimes.includes(time)) {
                            toast.error('Khung giờ này đã có lịch của bác sĩ.');
                            return;
                          }
                          if (selectedDentist?.id && selectedDate) {
                            try {
                              const appointments = await checkDentistAppointmentSlot(
                                selectedDentist.id,
                                selectedDate,
                                time
                              );
                              const hasConflict = appointments.some(
                                (appointment) =>
                                  !isEditMode ||
                                  String(appointment.id) !== String(targetData?.id)
                              );
                              if (hasConflict) {
                                toast.error('Khung giờ này đã có lịch của bác sĩ.');
                                return;
                              }
                            } catch (error) {
                              console.warn('Lỗi kiểm tra giờ hẹn tùy ý:', error);
                              toast.error('Không thể kiểm tra khung giờ này.');
                              return;
                            }
                          }
                          setSelectedTime(time);
                        }}
                        className="flex-1 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-teal-800 px-2 py-1 bg-teal-50 rounded-md border border-teal-700/20">
                        {selectedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 3: Tóm tắt thông tin đã chọn */}
              <div className="lg:col-span-3 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 p-3.5 rounded-lg border border-teal-700/20 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div>
                  <h3 className="text-xs font-bold text-teal-900 pb-1.5 border-b border-teal-700/20">
                    Thông tin ca khám
                  </h3>

                  <div className="space-y-2 mt-2 text-xs">
                    {/* Dịch vụ */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Dịch vụ</p>
                        <p className="font-bold text-slate-800 line-clamp-1">{selectedService?.serviceName}</p>
                        <p className="text-[11px] text-teal-800 font-semibold">{selectedService?.estimatedDuration} phút</p>
                      </div>
                    </div>

                    {/* Chi nhánh */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Building className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Chi nhánh</p>
                        <p className="font-bold text-slate-800 truncate">{selectedBranch?.branchName}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{selectedBranch?.address}</p>
                      </div>
                    </div>

                    {/* Bác sĩ */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Bác sĩ</p>
                        <p className="font-bold text-slate-800 truncate">{selectedDentist?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{selectedDentist?.specialization}</p>
                      </div>
                    </div>

                    {/* Ngày giờ */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Thời gian</p>
                        <p className="font-bold text-slate-800">{formattedSelectedDate}</p>
                        <p className="text-[11px] font-extrabold text-teal-800">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 rounded-md bg-white/80 border border-teal-700/20 text-[10px] text-slate-500 text-center font-medium">
                  Hệ thống tự động nhắc lịch hẹn qua SMS / Thông báo
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: THÔNG TIN BỆNH NHÂN & XÁC NHẬN ================= */}
          {/* ĐÃ BỎ: Ngày / Năm sinh, Phòng khám xếp lịch, và Mức độ ưu tiên */}
          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-in fade-in duration-150">
              {/* Cột trái: Tóm tắt thông tin phiếu hẹn */}
              <div className="lg:col-span-5 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin ca khám</h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    Đổi bước 1
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Service item */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <DentalToothIcon className="w-8 h-8 rounded-md shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{selectedService?.serviceName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Thời lượng: ~{selectedService?.estimatedDuration} phút</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
                      {selectedService?.categoryLabel || 'Dịch vụ'}
                    </span>
                  </div>

                  {/* Branch item */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <img
                      src={selectedBranch?.image}
                      alt={selectedBranch?.branchName}
                      className="h-9 w-9 rounded-md object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{selectedBranch?.branchName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{selectedBranch?.address}</p>
                    </div>
                  </div>

                  {/* Doctor item */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <DoctorAvatar
                      src={selectedDentist?.avatar}
                      name={selectedDentist?.name}
                      className="h-9 w-9"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{selectedDentist?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{selectedDentist?.specialization}</p>
                    </div>
                  </div>

                  {/* Date & Time item */}
                  <div className="p-2.5 rounded-md bg-teal-50/80 border border-teal-700/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-700" />
                      <div>
                        <p className="font-bold text-slate-800">{formattedSelectedDate}</p>
                        <p className="text-[11px] text-teal-800 font-extrabold">{selectedTime}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-700/15 text-teal-800 text-[10px] font-bold">
                      {isEditMode ? 'Cập nhật' : 'Sẵn sàng xếp lịch'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Thông tin bệnh nhân đã nhập (Hiển thị thẻ tổng quan có sẵn thông tin đã nhập từ Bước 1) & Ghi chú */}
              <div className="lg:col-span-7 space-y-3">
                {/* Thông tin bệnh nhân đã nhập từ bước 1 */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5.5 w-5.5 rounded bg-teal-50 text-teal-700 flex items-center justify-center">
                        <User size={13} />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Thông tin bệnh nhân
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      Chỉnh sửa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Họ và tên */}
                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <User size={12} className="text-teal-700" />
                        Họ và tên bệnh nhân
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5 truncate text-xs sm:text-[13px]">
                        {patientInfo.fullName || 'Chưa cung cấp'}
                      </p>
                    </div>

                    {/* Số điện thoại */}
                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Phone size={12} className="text-teal-700" />
                        Số điện thoại
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="font-bold text-slate-900 text-xs sm:text-[13px]">{patientInfo.phone || 'Chưa cung cấp'}</p>
                        {patientInfo.phone && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hợp lệ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Giới tính */}
                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Giới tính</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-slate-700 border border-slate-200">
                        {patientInfo.gender || 'Nam'}
                      </span>
                    </div>

                    {/* Chi nhánh tiếp nhận */}
                    <div className="p-2.5 rounded-md bg-teal-50/70 border border-teal-200/80 flex items-center gap-2">
                      <Building size={14} className="text-teal-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-teal-800 font-semibold block uppercase">Cơ sở khám</span>
                        <p className="font-bold text-teal-950 truncate text-[11px]">{selectedBranch?.branchName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ghi chú đón tiếp & Dặn dò */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded bg-teal-50 text-teal-700 flex items-center justify-center">
                        <FileText size={12} />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Ghi chú đón tiếp & Tình trạng răng miệng
                      </h3>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    placeholder="Nhập ghi chú yêu cầu của bệnh nhân hoặc lưu ý dặn dò khi tiếp đón..."
                    className="w-full p-2.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy / Đóng
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  if (!patientInfo.fullName.trim() || !patientInfo.phone.trim()) {
                    toast.error('Vui lòng nhập đầy đủ họ tên và số điện thoại bệnh nhân!');
                    return;
                  }
                  if (!selectedService) {
                    toast.error('Vui lòng chọn 1 dịch vụ khám!');
                    return;
                  }
                }
                if (step === 2 && (!selectedBranch || !selectedDentist)) {
                  toast.error('Vui lòng chọn chi nhánh và bác sĩ!');
                  return;
                }
                if (step === 3 && (!selectedDate || !selectedTime)) {
                  toast.error('Vui lòng chọn ngày và giờ hẹn khám!');
                  return;
                }
                setStep(step + 1);
              }}
              className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Tiếp tục
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-teal-700/50 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-3.5 w-3.5" />
                  {isEditMode ? 'Xác Nhận Đổi Lịch Hẹn' : 'Xác Nhận Tạo Lịch Hẹn'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div >
  );
}
