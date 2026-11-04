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
  Maximize2,
  Minimize2,
  Phone,
  Mail,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { getBranches } from '../../../services/clinic.service';
import { getDentistsList } from '../../../services/dentist.service';
import { getServices } from '../../../services/service.service';
import { createAppointment, updateAppointment, getAppointments } from '../../../services/appointment.service';
import {
  getPatientById,
  getPatientByPatientCode,
  getPatientsByPhone,
  searchPatient,
} from '../../../services/patient.service';

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

const formatVND = (num) => {
  if (!num && num !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
};

const formatDOB = (dobStr) => {
  if (!dobStr) return 'Chưa cập nhật';
  try {
    const clean = String(dobStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
  } catch (e) {
    return dobStr;
  }
};

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// Tooth Illustration Icon Component in Green Theme
const DentalToothIcon = ({ className = 'w-9 h-9' }) => {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-[#e6f7f0] border border-[#009766]/20 p-2 text-[#009766] shadow-xs ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-xs">
        <path d="M12 2C8.5 2 7 4 7 7c0 2 1 4 1 6.5 0 2.5-.5 5 1 6.5 1 1 2 0 3-3 1 3 2 4 3 3 1.5-1.5 1-4 1-6.5 0-2.5 1-4.5 1-6.5 0-3-1.5-5-5-5z" />
        <path d="M9 7c1 1.5 2 1.5 3 0 1 1.5 2 1.5 3 0" />
      </svg>
    </div>
  );
};

// Chuẩn hóa tên bác sĩ không bị lặp học hàm/học vị (tránh BS. ThS. BS.)
const formatDoctorName = (name) => {
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

// Doctor Avatar with robust fallback to initials
const DoctorAvatar = ({ src, name, className = 'h-11 w-11' }) => {
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
      <div className={`${className} rounded-full bg-emerald-50 text-[#009766] border border-emerald-200/80 flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs`}>
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

export default function PatientBookingModal({ isOpen, onClose, onSuccess, initialAppointment = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Smooth modal transition state & Maximize state
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Current Step: 1 -> 4
  const [step, setStep] = useState(1);

  // Data lists - Sử dụng dữ liệu thực tế từ DB & API
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [branches, setBranches] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ref to prevent duplicate API fetches when modal is already open
  const hasLoadedRef = useRef(false);

  // Step 1: Dịch vụ / Lý do khám bệnh
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedService, setSelectedService] = useState(null);
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');

  // Step 2: Branch & Dentist Selection
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');

  // Step 3: Date & Time Selection
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatYMD(tomorrow);
  });
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Step 4: Patient Info & Confirmation
  const [patientInfo, setPatientInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Nam',
  });
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [reasonNotes, setReasonNotes] = useState('');
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Handle smooth open and close transitions
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => {
        setActive(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSmoothClose = useCallback(() => {
    setActive(false);
    setIsMaximized(false);
    setTimeout(() => {
      onClose();
    }, 250);
  }, [onClose]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSmoothClose]);

  // Initialize and load data when modal opens (only once per open)
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      return;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setStep(1);
    setIsCustomReason(false);
    setCustomReasonText('');

    const loadData = async () => {
      try {
        // 0. Fetch Real Services from Database
        setLoadingServices(true);
        let fetchedServices = [];
        try {
          const rawServices = await getServices();
          const sList = Array.isArray(rawServices) ? rawServices : (rawServices?.data || []);
          if (sList.length > 0) {
            fetchedServices = sList
              .filter((s) => s.isActive !== false)
              .map((s) => ({
                id: s.id,
                serviceCode: s.serviceCode,
                serviceName: s.serviceName,
                category: s.category || 'KHAM_DIEU_TRI',
                categoryLabel: getCategoryLabel(s.category),
                price: Number(s.price || 0),
                discountedPrice: s.discountedPrice ? Number(s.discountedPrice) : null,
                estimatedDuration: s.estimatedDuration || 30,
                description: s.description || 'Dịch vụ khám & điều trị chuyên sâu',
                imageUrl: s.imageUrl || '',
                iconType: getIconTypeByCategory(s.category),
              }));
          }
        } catch (sErr) {
          console.warn('Lỗi tải danh sách dịch vụ từ DB:', sErr);
        }

        setServices(fetchedServices);
        setLoadingServices(false);

        // If editing existing appointment, populate fields from initialAppointment
        if (initialAppointment) {
          const targetReason = initialAppointment.title || initialAppointment.reason || '';
          const foundSrv = fetchedServices.find(
            (s) => s.serviceName.toLowerCase() === targetReason.toLowerCase()
          );
          if (foundSrv) {
            setSelectedService(foundSrv);
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
              estimatedDuration: 30,
              description: targetReason,
            });
          }

          if (initialAppointment.appointmentDate) {
            const cleanDate = typeof initialAppointment.appointmentDate === 'string'
              ? initialAppointment.appointmentDate.split('T')[0]
              : formatYMD(initialAppointment.appointmentDate);
            setSelectedDate(cleanDate);
          }

          if (initialAppointment.appointmentTime || initialAppointment.time) {
            let t = String(initialAppointment.appointmentTime || initialAppointment.time).trim();
            if (t.includes('T')) t = t.split('T')[1];
            if (t.length > 5) t = t.substring(0, 5);
            setSelectedTime(t);
          }

          if (initialAppointment.notes && initialAppointment.notes !== 'Chưa có') {
            setReasonNotes(initialAppointment.notes);
          }
        } else {
          setSelectedService(fetchedServices[0] || null);
        }

        // Initialize patient info from auth / localStorage
        const savedPhone = user?.phone || user?.phoneNumber || (typeof localStorage !== 'undefined' ? localStorage.getItem('patient_phone') : '') || '';
        const initialName = (user?.fullName && user.fullName !== user.username)
          ? user.fullName
          : (user?.username && !user.username.startsWith('PA-'))
            ? user.username
            : '';

        setPatientInfo({
          fullName: initialName || user?.username || '',
          phone: savedPhone,
          email: user?.email || '',
          dob: user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '2000-08-15',
          gender: user?.gender === 'FEMALE' ? 'Nữ' : 'Nam',
        });

        // Fetch full Patient profile from DB to get exact phone, full name, dob, gender
        const patientLookup = async () => {
          let p = null;
          const pid = user?.patientId || user?.id;
          if (isValidUUID(pid)) {
            p = await getPatientById(pid).catch(() => null);
          }
          if (!p && user?.username) {
            p = await getPatientByPatientCode(user.username).catch(() => null);
          }
          if (!p && (user?.phone || user?.phoneNumber || savedPhone)) {
            const phoneToSearch = (user?.phone || user?.phoneNumber || savedPhone).replace(/\s+/g, '');
            if (phoneToSearch) {
              const byPhone = await getPatientsByPhone(phoneToSearch).catch(() => []);
              if (Array.isArray(byPhone) && byPhone.length > 0) {
                p = byPhone[0];
              }
            }
          }
          if (!p && (user?.fullName || user?.username)) {
            p = await searchPatient(user?.fullName || user?.username).catch(() => null);
          }

          if (p) {
            const pPhone = p.phone || p.phoneNumber || savedPhone;
            if (pPhone && typeof localStorage !== 'undefined') {
              localStorage.setItem('patient_phone', pPhone);
            }
            const pName = p.fullName || initialName || user?.fullName || user?.username || '';
            setPatientInfo({
              fullName: pName,
              phone: pPhone,
              email: p.email || user?.email || '',
              dob: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : (user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '2000-08-15'),
              gender: (p.gender === 'FEMALE' || p.gender === 'Nữ' || user?.gender === 'FEMALE') ? 'Nữ' : 'Nam',
            });
          }
        };
        patientLookup();

        // 1. Fetch Branches directly from DB
        const bRes = await getBranches().catch(() => []);
        let bList = Array.isArray(bRes) ? bRes : (bRes?.data || []);
        bList = bList.map((b) => ({
          branchId: b.branchId || b.id,
          id: b.branchId || b.id,
          branchName: b.branchName || b.name || 'Crown Dental - Trung tâm Nha khoa',
          address: b.address || b.clinicAddress || 'TP. Hồ Chí Minh',
          openHours: b.openHours || '08:00 - 20:00 (Thứ 2 - Chủ nhật)',
          image: b.image || b.imageUrl || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
        }));
        setBranches(bList);
        setSelectedBranch(bList[0] || null);

        // 2. Fetch Dentists directly from DB
        const dRes = await getDentistsList().catch(() => []);
        let dList = Array.isArray(dRes) ? dRes : (dRes?.data || []);
        dList = dList.map((d) => {
          const rawName = d.fullName || d.name || d.user?.fullName || d.user?.username || 'Bác sĩ chuyên khoa';
          const cleanName = rawName.startsWith('BS.') || rawName.startsWith('ThS.') || rawName.startsWith('TS.') ? rawName : `BS. ${rawName}`;
          const specialty = d.specialization || d.qualification || d.description || (Array.isArray(d.specializations) && d.specializations.length > 0 ? d.specializations.map((s) => s.name || s).join(', ') : 'Chuyên khoa Nha khoa tổng quát');
          return {
            id: d.id,
            name: cleanName,
            fullName: cleanName,
            specialization: specialty,
            rating: 4.8 + Math.round(Math.random() * 2) / 10,
            reviewCount: 50 + Math.floor(Math.random() * 100),
            avatar: d.avatar || d.user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
            branchId: d.branchId || d.branch_id || (d.branch && (d.branch.branchId || d.branch.id)) || null,
            branchName: d.branchName || d.branch_name || (d.branch && d.branch.branchName) || '',
          };
        });
        setDentists(dList);

        // Pre-select dentist and branch based on initialAppointment if present
        if (initialAppointment) {
          const matchDentist = dList.find(
            (d) => d.id === initialAppointment.dentistId ||
              (initialAppointment.doctor && (
                d.fullName?.toLowerCase() === initialAppointment.doctor?.toLowerCase() ||
                initialAppointment.doctor?.toLowerCase().includes(d.fullName?.toLowerCase())
              ))
          );
          setSelectedDentist(matchDentist || dList[0]);

          const matchBranch = bList.find(
            (b) => b.branchId === initialAppointment.branchId ||
              b.id === initialAppointment.branchId ||
              (initialAppointment.branch && (
                b.branchName?.toLowerCase() === initialAppointment.branch?.toLowerCase() ||
                initialAppointment.branch?.toLowerCase().includes(b.branchName?.toLowerCase())
              ))
          );
          setSelectedBranch(matchBranch || bList[0]);
        } else {
          setSelectedDentist(dList[0]);
        }
      } catch (err) {
        console.warn('Lỗi khi tải dữ liệu modal:', err);
      }
    };

    loadData();
  }, [isOpen, user?.id, initialAppointment?.id]);

  // Kiểm tra danh sách khung giờ đã có lịch hẹn của bác sĩ từ DB theo ngày đã chọn
  useEffect(() => {
    if (!selectedDentist?.id || !selectedDate) {
      setBookedTimes([]);
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);

    getAppointments({ dentistId: selectedDentist.id, date: selectedDate })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.data || [];
        const times = list
          .filter((apt) => {
            const st = String(apt.status || '').toUpperCase();
            if (st === 'CANCELLED') return false;
            if (initialAppointment?.id && String(apt.id) === String(initialAppointment.id)) {
              return false;
            }
            return true;
          })
          .map((apt) => {
            let t = apt.appointmentTime || apt.time || '';
            if (typeof t === 'string') {
              if (t.includes('T')) t = t.split('T')[1];
              return t.substring(0, 5);
            }
            return '';
          })
          .filter(Boolean);

        setBookedTimes(times);
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
  }, [selectedDentist?.id, selectedDate, initialAppointment?.id]);

  // Update default reason note when service changes
  useEffect(() => {
    if (selectedService && !reasonNotes) {
      setReasonNotes(`Kiểm tra và thực hiện dịch vụ: ${selectedService.serviceName}. Có nhu cầu tư vấn thêm.`);
    }
  }, [selectedService]);

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

  // Filtered Dentists for Step 2 based on chosen branch & specialty
  const availableDentists = useMemo(() => {
    if (!selectedBranch) return dentists;
    const branchKey = String(selectedBranch.branchId || selectedBranch.id || '').trim().toLowerCase();
    const branchName = String(selectedBranch.branchName || '').trim().toLowerCase();

    let list = dentists.filter((d) => {
      const dBranchId = String(d.branchId || '').trim().toLowerCase();
      const dBranchName = String(d.branchName || '').trim().toLowerCase();

      if (dBranchId && branchKey) {
        if (dBranchId === branchKey || dBranchId.includes(branchKey) || branchKey.includes(dBranchId)) {
          return true;
        }
      }

      if (dBranchName && branchName) {
        if (dBranchName === branchName || dBranchName.includes(branchName) || branchName.includes(dBranchName)) {
          return true;
        }
        const getBranchCode = (str) => {
          const m = str.match(/cơ\s*sở\s*(\d+)/i) || str.match(/chi\s*nhánh\s*(\d+)/i) || str.match(/branch_?(\w+)/i);
          return m ? m[1].toLowerCase() : null;
        };
        const c1 = getBranchCode(dBranchName) || getBranchCode(dBranchId);
        const c2 = getBranchCode(branchName) || getBranchCode(branchKey);
        if (c1 && c2 && c1 === c2) return true;
      }

      return false;
    });

    if (list.length === 0) list = dentists;

    if (specialtyFilter !== 'ALL') {
      list = list.filter((d) => d.specialization && d.specialization.toLowerCase().includes(specialtyFilter.toLowerCase()));
    }
    return list;
  }, [dentists, selectedBranch, specialtyFilter]);

  // Ensure a dentist is selected when branch changes
  useEffect(() => {
    if (availableDentists.length > 0) {
      const isCurrentSelectedStillAvailable = availableDentists.some((d) => d.id === selectedDentist?.id);
      if (!isCurrentSelectedStillAvailable) {
        setSelectedDentist(availableDentists[0]);
      }
    }
  }, [availableDentists, selectedDentist]);

  // Mini Calendar generation logic for Step 3 - Cho phép chọn bất cứ ngày nào
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
        slotStatus: 'AVAILABLE',
      });
    }

    // Ngày trong tháng hiện tại
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = formatYMD(d);
      days.push({
        date: d,
        dateString: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        slotStatus: 'AVAILABLE',
      });
    }

    // Ngày của tháng sau để đủ 42 ô (6 tuần)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateString: formatYMD(d),
        dayNumber: i,
        isCurrentMonth: false,
        slotStatus: 'AVAILABLE',
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

  if (!mounted) return null;

  // Handle final submission to createAppointment API
  const handleConfirmBooking = async () => {
    if (submitting) return;

    if (!patientInfo.fullName.trim() || !patientInfo.phone.trim()) {
      toast.error('Vui lòng cung cấp đầy đủ Họ tên và Số điện thoại!');
      setIsEditingPatient(true);
      return;
    }

    if (!agreedTerms) {
      toast.error('Vui lòng xác nhận đồng ý với quy định đặt lịch!');
      return;
    }

    setSubmitting(true);
    try {
      const pId = isValidUUID(user?.patientId)
        ? user.patientId
        : isValidUUID(user?.id)
          ? user.id
          : null;

      const dId = isValidUUID(selectedDentist?.id) ? selectedDentist.id : null;

      const payload = {
        requestId: null,
        patientId: pId,
        branchId: selectedBranch?.branchId || selectedBranch?.id || null,
        branchName: selectedBranch?.branchName || null,
        fullName: patientInfo.fullName.trim(),
        phone: patientInfo.phone.trim(),
        dentistId: dId,
        roomId: null,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: selectedService?.serviceName || 'Khám răng tổng quát & Chụp phim X-quang',
        notes: reasonNotes.trim() || 'Bệnh nhân đặt lịch trực tuyến qua Dashboard',
        status: 'CONFIRMED',
      };

      if (initialAppointment?.id) {
        // Mode: Chỉnh sửa lại thông tin đặt lịch
        await updateAppointment(initialAppointment.id, payload);
        toast.success('Chỉnh sửa thông tin đặt lịch thành công!', { duration: 3500 });
      } else {
        // Mode: Đặt lịch khám mới (Backend tự lưu lịch và gửi notification realtime)
        await createAppointment(payload);
        toast.success('Đặt lịch khám thành công! Crown Dental đã ghi nhận lịch hẹn của bạn.', { duration: 3500 });
      }

      // Kích hoạt cập nhật chuông và làm mới dữ liệu realtime ngay lập tức
      window.dispatchEvent(new CustomEvent('notification_updated'));
      window.dispatchEvent(new CustomEvent('appointment_created'));

      // Đóng modal ngay lập tức một cách smooth, không giữ lại màn hình
      handleSmoothClose();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Lỗi khi đặt lịch khám:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể tạo lịch khám. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${isMaximized ? 'p-0' : 'p-0 sm:p-5 backdrop-blur-xs'
        } ${active ? 'bg-slate-900/50 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
        }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div
        className={`relative w-full bg-white overflow-hidden flex flex-col font-sans transition-all duration-300 ease-out transform ${isMaximized
          ? 'h-full w-full max-w-none max-h-none rounded-none border-0 shadow-none'
          : 'h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl rounded-none sm:rounded-lg shadow-xl border-0 sm:border sm:border-slate-200/90'
          } ${active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2'
          }`}
      >
        {/* Top Header & Brand in Green Brand Theme (Matches exterior banner) */}
        <div
          className="relative px-4 py-2.5 sm:px-5 sm:py-3 text-white flex items-center justify-between border-b border-[#028562]/30 shadow-xs shrink-0"
          style={{ background: 'linear-gradient(90deg, #009766 0%, #028562 50%, #037860 100%)' }}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-md bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  {initialAppointment ? 'Chỉnh sửa thông tin đặt lịch' : 'Đặt lịch khám'}
                </h2>
                <span className="px-1.5 py-0.5 rounded-sm bg-white/20 text-white text-[9px] font-bold tracking-wider uppercase shrink-0">
                  Crown Dental
                </span>
              </div>
              <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate">
                {step === 1 && 'Chọn lý do khám bệnh phù hợp'}
                {step === 2 && 'Chọn chi nhánh và bác sĩ phụ trách'}
                {step === 3 && 'Chọn ngày khám và khung giờ thuận tiện'}
                {step === 4 && (initialAppointment ? 'Kiểm tra và cập nhật lại thông tin đặt lịch' : 'Kiểm tra và xác nhận thông tin')}
              </p>
            </div>
          </div>

          {/* Action buttons: Maximize/Restore (desktop only) & Close */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex rounded-md p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSmoothClose}
              className="rounded-md p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Mobile Stepper (sm:hidden) */}
            <div className="sm:hidden px-3.5 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#009766] flex items-center gap-1.5 truncate">
                  <span className="h-4.5 w-4.5 rounded-full bg-[#009766] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {step}
                  </span>
                  {step === 1 && '1. Lý do khám bệnh'}
                  {step === 2 && '2. Chi nhánh & Bác sĩ'}
                  {step === 3 && '3. Thời gian khám'}
                  {step === 4 && '4. Xác nhận thông tin'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                  {step}/4
                </span>
              </div>
              {/* 4 Segmented Progress Bar */}
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    onClick={() => step > num && setStep(num)}
                    className={`h-1 rounded-sm transition-all ${num <= step ? 'bg-[#009766]' : 'bg-slate-200'
                      } ${step > num ? 'cursor-pointer' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Stepper (hidden sm:block) */}
            <div className="hidden sm:block bg-slate-50/90 border-b border-slate-200 px-5 py-2.5 shrink-0">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                {/* Step 1 */}
                <div
                  onClick={() => step > 1 && setStep(1)}
                  className={`flex items-center gap-2 transition-all select-none ${step >= 1 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1
                      ? 'bg-[#009766] text-white ring-2 ring-[#009766]/20 shadow-xs'
                      : step > 1
                        ? 'bg-[#009766] text-white'
                        : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {step > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${step === 1 ? 'text-[#009766] font-bold' : step > 1 ? 'text-slate-700' : 'text-slate-400'}`}>
                    Lý do khám
                  </span>
                </div>

                <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 2 ? 'bg-[#009766]' : 'bg-slate-200'}`} />

                {/* Step 2 */}
                <div
                  onClick={() => step > 2 && setStep(2)}
                  className={`flex items-center gap-2 transition-all select-none ${step >= 2 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2
                      ? 'bg-[#009766] text-white ring-2 ring-[#009766]/20 shadow-xs'
                      : step > 2
                        ? 'bg-[#009766] text-white'
                        : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {step > 2 ? <Check className="h-3 w-3 stroke-[3]" /> : '2'}
                  </div>
                  <span className={`text-xs font-semibold ${step === 2 ? 'text-[#009766] font-bold' : step > 2 ? 'text-slate-700' : 'text-slate-400'}`}>
                    Chi nhánh & Bác sĩ
                  </span>
                </div>

                <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 3 ? 'bg-[#009766]' : 'bg-slate-200'}`} />

                {/* Step 3 */}
                <div
                  onClick={() => step > 3 && setStep(3)}
                  className={`flex items-center gap-2 transition-all select-none ${step >= 3 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 3
                      ? 'bg-[#009766] text-white ring-2 ring-[#009766]/20 shadow-xs'
                      : step > 3
                        ? 'bg-[#009766] text-white'
                        : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {step > 3 ? <Check className="h-3 w-3 stroke-[3]" /> : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${step === 3 ? 'text-[#009766] font-bold' : step > 3 ? 'text-slate-700' : 'text-slate-400'}`}>
                    Thời gian khám
                  </span>
                </div>

                <div className={`flex-1 h-[1.5px] mx-3 transition-colors ${step >= 4 ? 'bg-[#009766]' : 'bg-slate-200'}`} />

                {/* Step 4 */}
                <div className="flex items-center gap-2 select-none">
                  <div
                    className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 4
                      ? 'bg-[#009766] text-white ring-2 ring-[#009766]/20 shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    4
                  </div>
                  <span className={`text-xs font-semibold ${step === 4 ? 'text-[#009766] font-bold' : 'text-slate-400'}`}>
                    Xác nhận
                  </span>
                </div>
              </div>
            </div>

        {/* Main Body per Step */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
          {/* ================= STEP 1: CHỌN DỊCH VỤ ================= */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Title & Tabs with subtle border radius */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-[#009766]" />
                    Lý do khám bệnh <span className="text-rose-500">*</span>
                  </h3>
                  <span className="text-[11px] text-[#009766] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Đã chọn: {selectedService?.serviceName || 'Chưa chọn'}
                  </span>
                </div>

                {/* Filter Tabs in Green Theme */}
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
                              description: 'Bệnh nhân tự nhập lý do khám',
                              category: 'OTHER',
                              categoryLabel: 'Khác',
                            });
                          }
                        }
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-[#009766] text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-[#e6f7f0] border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ô nhập lý do tùy ý khi chọn tab Khác */}
              {activeTab === 'OTHER' && (
                <div className="bg-white p-3.5 rounded-lg border border-[#009766]/40 bg-[#e6f7f0]/30 shadow-2xs space-y-2 animate-in fade-in duration-100">
                  <label className="block text-xs font-bold text-slate-800">
                    Nhập chi tiết lý do bạn muốn đến khám: <span className="text-rose-500">*</span>
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
                        description: val || 'Bệnh nhân tự nhập lý do khám',
                        category: 'OTHER',
                        categoryLabel: 'Khác',
                      });
                    }}
                    placeholder="Ví dụ: Răng hàm bị đau nhức ê buốt khi ăn đồ lạnh..."
                    className="w-full p-2.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766] bg-white shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    Bác sĩ sẽ kiểm tra và tư vấn phác đồ điều trị chi tiết theo nhu cầu thực tế khi bạn đến khám.
                  </p>
                </div>
              )}

              {/* Service Cards Grid in Green Theme */}
              {loadingServices ? (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
                  <div className="h-6 w-6 border-2 border-[#009766] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Đang tải danh mục dịch vụ từ cơ sở dữ liệu...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                          ? 'border-[#009766] bg-[#e6f7f0]/40 shadow-2xs ring-1 ring-[#009766]/30'
                          : 'border-slate-200 bg-white hover:border-[#009766]/40 hover:shadow-2xs'
                          }`}
                      >
                        {/* Top icon & radio */}
                        <div className="flex items-start justify-between gap-2.5">
                          <DentalToothIcon className="w-8 h-8 rounded-md" />
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-[#009766] bg-[#009766] text-white' : 'border-slate-300 bg-white'
                              }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="mt-2">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#009766]">
                            {srv.serviceName}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {srv.description}
                          </p>
                        </div>

                        {/* Meta: Duration & Price */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            ~{srv.estimatedDuration} phút
                          </span>
                          <span className="text-[11px] font-extrabold text-[#009766] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {srv.price > 0 ? formatVND(srv.price) : 'Miễn phí khám'}
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
              {/* Left Column: Chọn chi nhánh */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#009766]" />
                    Chọn chi nhánh
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {branches.length} chi nhánh
                  </span>
                </div>

                <div className={`space-y-2 overflow-y-auto pr-1 ${isMaximized ? 'max-h-[calc(100vh-270px)]' : 'max-h-[460px]'}`}>
                  {branches.map((br) => {
                    const brKey = br.branchId || br.id;
                    const isSelected = selectedBranch && (selectedBranch.branchId === brKey || selectedBranch.id === brKey);
                    return (
                      <div
                        key={brKey}
                        onClick={() => setSelectedBranch(br)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex gap-2.5 select-none ${isSelected
                          ? 'border-[#009766] bg-[#e6f7f0]/40 shadow-2xs ring-1 ring-[#009766]/30'
                          : 'border-slate-200 bg-white hover:border-[#009766]/40'
                          }`}
                      >
                        <img
                          src={br.image}
                          alt={br.branchName}
                          className="h-12 w-12 rounded-md object-cover border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{br.branchName}</h4>
                            <div
                              className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#009766] bg-[#009766] text-white' : 'border-slate-300 bg-white'
                                }`}
                            >
                              {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            {br.address}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            {br.openHours}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chọn bác sĩ */}
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-[#009766]" />
                    Chọn bác sĩ phụ trách
                  </h3>

                  {/* Specialty Filter Dropdown */}
                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#009766]"
                  >
                    <option value="ALL">Tất cả chuyên khoa</option>
                    <option value="Implant">Implant</option>
                    <option value="Răng sứ">Răng sứ thẩm mỹ</option>
                    <option value="Nha chu">Nha chu</option>
                    <option value="Tổng quát">Tổng quát</option>
                    <option value="Niềng">Niềng răng</option>
                  </select>
                </div>

                <div className={`space-y-2 overflow-y-auto pr-1 ${isMaximized ? 'max-h-[calc(100vh-270px)]' : 'max-h-[460px]'}`}>
                  {availableDentists.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
                      <User className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-600">Không tìm thấy bác sĩ phù hợp</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng chọn chi nhánh khác hoặc bộ lọc chuyên khoa</p>
                    </div>
                  ) : (
                    availableDentists.map((doc) => {
                      const isSelected = selectedDentist?.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 select-none ${isSelected
                            ? 'border-[#009766] bg-[#e6f7f0]/40 shadow-2xs ring-1 ring-[#009766]/30'
                            : 'border-slate-200 bg-white hover:border-[#009766]/40'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <DoctorAvatar src={doc.avatar} name={doc.name} className="h-10 w-10" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{doc.name}</h4>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {doc.specialization}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {typeof doc.rating === 'number' ? doc.rating.toFixed(1) : (doc.rating || '5.0')}
                                </span>
                                <span className="text-slate-400">({doc.reviewCount} đánh giá)</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDentist(doc)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${isSelected
                              ? 'bg-[#009766] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-[#e6f7f0] hover:text-[#009766]'
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
                      className="px-1.5 py-0.5 text-[10px] font-bold text-[#009766] hover:bg-[#e6f7f0] rounded-sm border border-[#009766]/30 cursor-pointer transition-colors"
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
                          ? 'bg-[#009766] text-white shadow-2xs scale-105 z-10'
                          : dayItem.isCurrentMonth
                            ? 'text-slate-800 hover:bg-[#e6f7f0] hover:text-[#009766]'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                      >
                        <span>{dayItem.dayNumber || dayItem.date.getDate()}</span>
                        {dayItem.isCurrentMonth && !isSelected && (
                          <span
                            className={`h-1 w-1 rounded-full mt-0.5 ${dayItem.slotStatus === 'AVAILABLE'
                              ? 'bg-[#009766]'
                              : dayItem.slotStatus === 'FEW'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Input chọn ngày cụ thể tùy ý */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-[#009766]" />
                    Ngày khám:
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
                    className="flex-1 max-w-[155px] px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-white border border-slate-200 focus:border-[#009766] focus:bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#009766] cursor-pointer"
                  />
                </div>
              </div>

              {/* Cột 2: Chọn khung giờ */}
              <div className="lg:col-span-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-800">Khung giờ khám</h3>
                    {loadingSlots ? (
                      <span className="text-[10px] text-amber-600 font-medium animate-pulse">Đang kiểm tra lịch trống...</span>
                    ) : bookedTimes.length > 0 ? (
                      <span className="text-[10px] text-rose-500 font-medium">Bác sĩ có {bookedTimes.length} giờ đã kín</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Tất cả khung giờ đều sẵn sàng</span>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-[#009766] bg-[#e6f7f0] px-2 py-0.5 rounded-md border border-[#009766]/20">
                    {selectedTime}
                  </span>
                </div>

                <div className={`space-y-2 overflow-y-auto pr-1 ${isMaximized ? 'max-h-[calc(100vh-310px)]' : 'max-h-[360px]'}`}>
                  {/* Buổi sáng */}
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                      <Clock className="h-3 w-3 text-[#009766]" />
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
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-[#009766] text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-[#e6f7f0] hover:text-[#009766] text-slate-700 border border-slate-200 cursor-pointer'
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
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-[#009766] text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-[#e6f7f0] hover:text-[#009766] text-slate-700 border border-slate-200 cursor-pointer'
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
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-[#009766] text-white shadow-2xs font-bold cursor-pointer'
                                : 'bg-slate-50 hover:bg-[#e6f7f0] hover:text-[#009766] text-slate-700 border border-slate-200 cursor-pointer'
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

                  {/* Chọn giờ chính xác tùy ý */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#009766]" />
                        Hoặc nhập giờ tùy ý:
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedTime(e.target.value);
                          }
                        }}
                        className="flex-1 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766] cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-[#009766] px-2 py-1 bg-[#e6f7f0] rounded-md border border-[#009766]/20">
                        {selectedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 3: Tóm tắt thông tin đã chọn */}
              <div className="lg:col-span-3 bg-gradient-to-br from-[#e6f7f0]/80 to-emerald-50/50 p-3.5 rounded-lg border border-[#009766]/20 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div>
                  <h3 className="text-xs font-bold text-[#027555] pb-1.5 border-b border-[#009766]/20">
                    Thông tin đã chọn
                  </h3>

                  <div className="space-y-2 mt-2 text-xs">
                    {/* Dịch vụ */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-[#009766] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Dịch vụ</p>
                        <p className="font-bold text-slate-800 line-clamp-1">{selectedService?.serviceName}</p>
                        <p className="text-[11px] text-[#009766] font-semibold">{selectedService?.estimatedDuration} phút</p>
                      </div>
                    </div>

                    {/* Chi nhánh */}
                    <div className="flex items-start gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-[#009766] text-white flex items-center justify-center shrink-0 mt-0.5">
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
                      <div className="h-5.5 w-5.5 rounded bg-[#009766] text-white flex items-center justify-center shrink-0 mt-0.5">
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
                      <div className="h-5.5 w-5.5 rounded bg-[#028562] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Thời gian</p>
                        <p className="font-bold text-slate-800">{formattedSelectedDate}</p>
                        <p className="text-[11px] font-extrabold text-[#009766]">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 rounded-md bg-white/80 border border-[#009766]/20 text-[10px] text-slate-500 text-center">
                  Vui lòng đến trước 10 phút để đón tiếp chu đáo
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: XÁC NHẬN THÔNG TIN ================= */}
          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-in fade-in duration-150">
              {/* Left Column: Tóm tắt thông tin đặt lịch */}
              <div className="lg:col-span-6 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin phiếu hẹn</h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#009766] hover:text-[#028562] cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    Chỉnh sửa
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Reason item */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <DentalToothIcon className="w-8 h-8 rounded-md" />
                      <div>
                        <p className="font-bold text-slate-800">{selectedService?.serviceName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Thời gian dự kiến: ~{selectedService?.estimatedDuration} phút</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      Lý do khám
                    </span>
                  </div>

                  {/* Branch item */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <img
                      src={selectedBranch?.image}
                      alt={selectedBranch?.branchName}
                      className="h-8 w-8 rounded-md object-cover shrink-0"
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
                      className="h-8 w-8"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{selectedDentist?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{selectedDentist?.specialization}</p>
                    </div>
                  </div>

                  {/* Date & Time item */}
                  <div className="p-2.5 rounded-md bg-[#e6f7f0]/70 border border-[#009766]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#009766]" />
                      <div>
                        <p className="font-bold text-slate-800">{formattedSelectedDate}</p>
                        <p className="text-[11px] text-[#009766] font-extrabold">{selectedTime}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#009766]/15 text-[#009766] text-[10px] font-bold">
                      Đã giữ chỗ
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Thông tin bệnh nhân & Lý do khám */}
              <div className="lg:col-span-6 space-y-2.5">
                {/* Thông tin bệnh nhân */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5.5 w-5.5 rounded bg-emerald-50 text-[#009766] flex items-center justify-center">
                        <User size={13} />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Thông tin bệnh nhân
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingPatient(!isEditingPatient)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#009766] hover:text-[#028562] transition-colors cursor-pointer"
                    >
                      <Edit3 size={12} />
                      {isEditingPatient ? 'Xong' : 'Chỉnh sửa'}
                    </button>
                  </div>

                  {isEditingPatient ? (
                    <div className="grid grid-cols-2 gap-2 text-xs animate-in fade-in duration-100">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={patientInfo.fullName}
                          onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Số điện thoại <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={patientInfo.phone}
                          onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email</label>
                        <input
                          type="email"
                          value={patientInfo.email}
                          onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ngày sinh</label>
                        <input
                          type="date"
                          value={patientInfo.dob}
                          onChange={(e) => setPatientInfo({ ...patientInfo, dob: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Giới tính</label>
                        <select
                          value={patientInfo.gender}
                          onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766] bg-white cursor-pointer"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Họ tên */}
                      <div className="col-span-1 p-2 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <User size={12} className="text-[#009766]" />
                          Họ và tên
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5 truncate text-xs sm:text-[13px]">
                          {patientInfo.fullName || 'Chưa cung cấp'}
                        </p>
                      </div>

                      {/* Số điện thoại */}
                      <div className="col-span-1 p-2 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Phone size={12} className="text-[#009766]" />
                          Số điện thoại
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="font-bold text-slate-900 text-xs sm:text-[13px]">{patientInfo.phone || 'Chưa cung cấp'}</p>
                          {patientInfo.phone && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-[#009766] border border-emerald-200">
                              Đã xác thực
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-span-1 p-2 rounded-md bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Mail size={12} className="text-[#009766]" />
                          Email
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5 truncate text-xs" title={patientInfo.email}>
                          {patientInfo.email || 'Chưa cập nhật'}
                        </p>
                      </div>

                      {/* Ngày sinh & Giới tính */}
                      <div className="col-span-1 p-2 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Calendar size={12} className="text-[#009766]" />
                            Ngày sinh
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5 text-xs">
                            {formatDOB(patientInfo.dob)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-medium block">Giới tính</span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {patientInfo.gender || 'Nam'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lý do khám & Ghi chú */}
                <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded bg-emerald-50 text-[#009766] flex items-center justify-center">
                        <FileText size={12} />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Lý do khám & Ghi chú
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingReason(!isEditingReason)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#009766] hover:text-[#028562] transition-colors cursor-pointer"
                    >
                      <Edit3 size={12} />
                      {isEditingReason ? 'Xong' : 'Chỉnh sửa'}
                    </button>
                  </div>

                  {isEditingReason ? (
                    <textarea
                      rows={2}
                      value={reasonNotes}
                      onChange={(e) => setReasonNotes(e.target.value)}
                      placeholder="Mô tả cụ thể triệu chứng răng miệng hoặc yêu cầu điều trị..."
                      className="w-full p-2 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#009766] focus:border-[#009766]"
                    />
                  ) : (
                    <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                      <span className="text-[#009766] font-bold mr-1">Nội dung:</span>
                      {reasonNotes || 'Khám răng định kỳ & thực hiện theo dịch vụ đã đăng ký.'}
                    </div>
                  )}
                </div>

                {/* Cam kết & Đồng ý điều khoản */}
                <div
                  onClick={() => setAgreedTerms(!agreedTerms)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 select-none ${agreedTerms
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${agreedTerms ? 'border-[#009766] bg-[#009766] text-white' : 'border-slate-300 bg-white'
                      }`}
                  >
                    {agreedTerms && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Xác nhận thông tin & Đồng ý đặt lịch
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#009766] bg-emerald-100/60 px-1.5 py-0.2 rounded-sm">
                        <ShieldCheck size={10} />
                        Bảo mật
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Tôi cam kết các thông tin đăng ký trên là chính xác và đồng ý với quy định khám chữa bệnh của Crown Dental.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSmoothClose}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy / Đóng
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !selectedService) {
                  toast.error('Vui lòng chọn 1 dịch vụ khám!');
                  return;
                }
                if (step === 2 && (!selectedBranch || !selectedDentist)) {
                  toast.error('Vui lòng chọn chi nhánh và bác sĩ!');
                  return;
                }
                if (step === 3 && (!selectedDate || !selectedTime)) {
                  toast.error('Vui lòng chọn ngày và khung giờ khám!');
                  return;
                }
                setStep(step + 1);
              }}
              className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-md bg-[#009766] hover:bg-[#028562] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Tiếp tục
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmBooking}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-md bg-[#009766] hover:bg-[#028562] disabled:bg-[#009766]/50 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-3.5 w-3.5" />
                  {initialAppointment ? 'Cập nhật lịch khám' : 'Xác nhận đặt lịch'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
