import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  FileText,
  CheckCircle2,
  ChevronDown,
  Search,
  Building,
  ShieldAlert,
  AlertCircle,
  Sparkles,
  Award,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getDentistsList } from '../../services/dentist.service';
import { createAppointment, updateAppointment } from '../../services/appointment.service';
import { getEmployeeAddressById } from '../../services/employee.service';
import api from '../../services/axios';

const COMMON_SERVICES = [
  'Tư vấn niềng răng trong suốt Invisalign',
  'Tư vấn niềng răng mắc cài kim loại/sứ',
  'Cạo vôi răng & Đánh bóng 2 hàm',
  'Trám răng thẩm mỹ Composite',
  'Nhổ răng khôn (R8) mọc lệch',
  'Cấy ghép Implant Nha khoa',
  'Tẩy trắng răng công nghệ Laser',
  'Bọc răng sứ thẩm mỹ',
  'Khám tổng quát & Chụp phim X-quang',
];

const cleanTitleName = (str) => {
  if (!str) return 'Bác sĩ chuyên khoa';
  return str
    .replace(/^ThS\.\s*BS\./i, 'ThS.')
    .replace(/^TS\.\s*BS\./i, 'TS.')
    .replace(/^BS\.\s*/i, '');
};

// Helper functions for doctor name and specialization display
const getDoctorName = (doc) => {
  if (!doc) return 'Bác sĩ chuyên khoa';
  let rawName = '';
  if (doc.name && doc.name.trim()) rawName = doc.name;
  else if (doc.fullName && doc.fullName.trim()) rawName = doc.fullName;
  else if (doc.user && doc.user.fullName && doc.user.fullName.trim()) rawName = doc.user.fullName;
  else if (doc.user && doc.user.username) {
    const uname = doc.user.username;
    if (uname.includes('nguyen.thi.phuong') || uname.includes('phuong')) return 'ThS. Nguyễn Thị Phương';
    if (uname.includes('tran.quang') || uname.includes('quang')) return 'Trần Quang';
    rawName = uname.replace(/^(bs\.|dr\.)/i, '').replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  } else if (doc.email) {
    rawName = doc.email.split('@')[0];
  }
  return cleanTitleName(rawName);
};


const getDoctorSpecialization = (doc) => {
  if (!doc) return 'Chuyên khoa Nha Khoa';
  if (doc.description && doc.description.trim()) return doc.description;
  if (doc.specialization && doc.specialization.trim()) return doc.specialization;
  if (Array.isArray(doc.specializations) && doc.specializations.length > 0) {
    return doc.specializations.map((s) => s.name || s).join(', ');
  }
  if (doc.qualification && doc.qualification.trim()) return doc.qualification;
  return 'Chuyên khoa Nha Khoa Tổng Quát';
};

const getDoctorInitials = (doc) => {
  const name = getDoctorName(doc);
  const cleanName = name.replace(/^(ThS\.|BS\.|Dr\.)\s*/i, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleanName.substring(0, 2).toUpperCase() || 'BS';
};

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  type = 'add', // 'add' | 'edit'
  payload = null,
  initialData = null,
  onSuccess,
}) {
  const { user } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Doctor Select State
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const isEditMode = type === 'edit';
  const targetData = payload || initialData;

  const isCreatedOverOneHour = useMemo(() => {
    if (!isEditMode) return false;
    if (targetData?.allowReschedule) return false;
    const cVal = targetData?.createdAt || targetData?.createAt;
    if (!cVal) return false;
    try {
      const cTime = new Date(cVal).getTime();
      if (isNaN(cTime)) return false;
      return (Date.now() - cTime) > 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }, [isEditMode, targetData]);

  // Form states
  const [formData, setFormData] = useState({
    appointmentId: null,
    requestId: null,
    patientId: null,
    branchId: '',
    branchName: '',
    branchAddress: '',
    fullName: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    dentistId: '',
    roomId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    reason: COMMON_SERVICES[0],
    priority: 'NORMAL', // NORMAL, URGENT
    notes: '',
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDoctorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dentists list & rooms
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoadingDentists(true);
      try {
        // 1. Fetch Dentists
        const rawDentists = await getDentistsList().catch(() => []);
        let processedDentists = [];

        if (Array.isArray(rawDentists) && rawDentists.length > 0) {
          const seen = new Set();
          processedDentists = rawDentists.filter((d) => {
            const name = getDoctorName(d);
            if (seen.has(name)) return false;
            seen.add(name);
            return true;
          });
        }

        // Default clean dentist fallback list if needed
        if (processedDentists.length === 0) {
          processedDentists = [
            {
              id: 'a1111111-1111-1111-1111-111111111111',
              name: 'ThS. Nguyễn Thị Phương',
              fullName: 'ThS. Nguyễn Thị Phương',
              specialization: 'Chuyên khoa Niềng Răng & Chỉnh Hình',
              experienceYears: 12,
            },
            {
              id: 'a2222222-2222-2222-2222-222222222222',
              name: 'Trần Quang',
              fullName: 'Trần Quang',
              specialization: 'Chuyên khoa Implant & Phục Hình Sứ',
              experienceYears: 10,
            },
          ];
        }

        setDentists(processedDentists);

        // 2. Fetch Rooms
        const roomsRes = await api.get('/appointments/rooms').catch(() => null);
        if (roomsRes && Array.isArray(roomsRes.data) && roomsRes.data.length > 0) {
          setRooms(roomsRes.data);
        } else {
          setRooms([
            { id: 'f1111111-1111-1111-1111-111111111111', roomName: 'Phòng khám 01', floorName: 'Tầng 1' },
            { id: 'f2222222-2222-2222-2222-222222222222', roomName: 'Phòng chỉnh nha 02', floorName: 'Tầng 2' },
          ]);
        }

        // Set initial selected dentist
        if (processedDentists.length > 0) {
          setFormData((prev) => {
            let matchedId = prev.dentistId;
            if (!matchedId && targetData?.dentistName) {
              const matched = processedDentists.find(
                (d) => getDoctorName(d).toLowerCase() === targetData.dentistName.toLowerCase()
              );
              if (matched) matchedId = matched.id;
            }
            return {
              ...prev,
              dentistId: matchedId || processedDentists[0].id,
            };
          });
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo dữ liệu modal:', err);
      } finally {
        setLoadingDentists(false);
      }
    };

    fetchInitialData();

    if (targetData) {
      if (isEditMode) {
        // Edit mode (Reschedule existing appointment)
        const aptId = targetData.appointmentId || targetData.id || null;
        let dateVal = new Date().toISOString().split('T')[0];
        if (targetData.appointmentDate) {
          try {
            const raw = String(targetData.appointmentDate).trim().replace(' ', 'T');
            const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
              dateVal = datePart;
            } else {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) {
                dateVal = d.toISOString().split('T')[0];
              }
            }
          } catch (e) {
            dateVal = new Date().toISOString().split('T')[0];
          }
        }

        let timeVal = '09:00';
        const rawTime = targetData.time || targetData.appointmentTime;
        if (rawTime) {
          try {
            const raw = String(rawTime).trim().replace(' ', 'T');
            const timePart = raw.includes('T') ? raw.split('T')[1] : raw;
            const parts = timePart.split(':');
            if (parts.length >= 2) {
              timeVal = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            } else {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) {
                timeVal = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              }
            }
          } catch (e) {
            timeVal = '09:00';
          }
        }

        const rawNotes = targetData.notes || targetData.description || '';
        const isUrgent = rawNotes.includes('[ƯU TIÊN / CẤP CỨU]');
        const cleanNotes = rawNotes.replace(/^\[ƯU TIÊN \/ CẤP CỨU\]\s*/, '').trim();

        setFormData((prev) => ({
          ...prev,
          appointmentId: aptId,
          patientId: targetData.patientId || null,
          requestId: null,
          branchId: targetData.branchId || '',
          branchName: targetData.branchName || '',
          branchAddress: targetData.branchAddress || '',
          fullName: targetData.patientName || targetData.fullName || targetData.name || '',
          phone: targetData.phone || '',
          gender: targetData.gender || 'Nam',
          dob: targetData.dob || '',
          dentistId: targetData.dentistId || prev.dentistId,
          roomId: targetData.roomId || prev.roomId,
          appointmentDate: dateVal,
          appointmentTime: timeVal,
          reason: targetData.service || targetData.reason || targetData.note || targetData.description || COMMON_SERVICES[0],
          priority: isUrgent ? 'URGENT' : 'NORMAL',
          notes: cleanNotes,
          status: targetData.status || targetData.rawStatus || null,
        }));
      } else {
        // Add mode (Creating new appointment from request or empty)
        let addDateVal = new Date().toISOString().split('T')[0];
        const rawAddDate = targetData.date || targetData.appointmentDate;
        if (rawAddDate) {
          try {
            const raw = String(rawAddDate).trim().replace(' ', 'T');
            const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
              addDateVal = datePart;
            }
          } catch (e) {}
        }

        let addTimeVal = '09:00';
        const rawAddTime = targetData.time || targetData.appointmentTime;
        if (rawAddTime) {
          try {
            const raw = String(rawAddTime).trim().replace(' ', 'T');
            const timePart = raw.includes('T') ? raw.split('T')[1] : raw;
            const parts = timePart.split(':');
            if (parts.length >= 2) {
              addTimeVal = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
          } catch (e) {}
        }

        const rawNotes = targetData.notes || targetData.description || targetData.note || '';
        const isUrgent = rawNotes.includes('[ƯU TIÊN / CẤP CỨU]');
        const cleanNotes = rawNotes.replace(/^\[ƯU TIÊN \/ CẤP CỨU\]\s*/, '').trim();

        setFormData((prev) => ({
          ...prev,
          appointmentId: null,
          requestId: targetData.id || targetData.requestId || null,
          patientId: targetData.patientId || null,
          branchId: targetData.branchId || '',
          branchName: targetData.branchName || '',
          branchAddress: targetData.branchAddress || '',
          fullName: targetData.name || targetData.fullName || targetData.patientName || '',
          phone: targetData.phone || '',
          gender: targetData.gender || 'Nam',
          dob: targetData.dob || '',
          dentistId: targetData.dentistId || prev.dentistId,
          roomId: targetData.roomId || prev.roomId,
          appointmentDate: addDateVal,
          appointmentTime: addTimeVal,
          reason: targetData.note || targetData.description || targetData.service || COMMON_SERVICES[0],
          priority: isUrgent ? 'URGENT' : 'NORMAL',
          notes: cleanNotes,
        }));
      }
    } else {
      setFormData({
        appointmentId: null,
        requestId: null,
        patientId: null,
        branchId: '',
        branchName: '',
        branchAddress: '',
        fullName: '',
        phone: '',
        gender: 'Nam',
        dob: '',
        dentistId: '',
        roomId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
        reason: COMMON_SERVICES[0],
        priority: 'NORMAL',
        notes: '',
      });
    }
  }, [isOpen, targetData, type]);

  // Lấy chi nhánh của nhân viên khi tạo lịch hẹn cho khách vãng lai / khách đến bất ngờ
  useEffect(() => {
    if (!isOpen) return;
    if (targetData?.branchId) return;

    const empId = user?.employeeId || user?.id;
    if (!empId) return;

    getEmployeeAddressById(empId)
      .then((res) => {
        const emp = res?.data || res;
        if (emp) {
          setFormData((prev) => ({
            ...prev,
            branchId: emp.branchId || '',
            branchName: emp.branchName || '',
            branchAddress: emp.branchAddress || '',
          }));
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi lấy chi nhánh của nhân viên:', err);
      });
  }, [isOpen, targetData, user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectDoctor = (doctor) => {
    setFormData((prev) => ({ ...prev, dentistId: doctor.id }));
    setIsDoctorDropdownOpen(false);
  };

  const selectedDoctor =
    dentists.find(
      (d) => String(d.id).toLowerCase() === String(formData.dentistId).toLowerCase()
    ) || dentists[0];

  const filteredDentists = dentists.filter((d) => {
    const term = doctorSearchTerm.toLowerCase();
    const name = getDoctorName(d).toLowerCase();
    const spec = getDoctorSpecialization(d).toLowerCase();
    return name.includes(term) || spec.includes(term);
  });

  const isValidUUID = (str) =>
    typeof str === 'string' &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditMode && isCreatedOverOneHour) {
      toast.error('Lịch hẹn chỉ được phép sửa trong vòng 1 giờ kể từ thời điểm tạo (createdAt). Đã quá 1 giờ, không thể sửa!');
      return;
    }
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại bệnh nhân!');
      return;
    }

    setSubmitting(true);
    try {
      const rawNotes = (formData.notes || '').trim();
      const cleanNotes = rawNotes.replace(/^\[ƯU TIÊN \/ CẤP CỨU\]\s*/, '').trim();
      const finalNotes = formData.priority === 'URGENT'
        ? `[ƯU TIÊN / CẤP CỨU] ${cleanNotes}`.trim()
        : cleanNotes;

      const payloadData = {
        requestId: isValidUUID(formData.requestId) ? formData.requestId : null,
        patientId: user?.role === 'PATIENT'
          ? (isValidUUID(user?.patientId) ? user.patientId : null)
          : (isValidUUID(formData.patientId) ? formData.patientId : null),
        branchId: formData.branchId || null,
        branchName: formData.branchName || null,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        dentistId: isValidUUID(formData.dentistId) ? formData.dentistId : null,
        roomId: isValidUUID(formData.roomId) ? formData.roomId : null,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason.trim(),
        notes: finalNotes,
        status: isEditMode
          ? (formData.status === 'PENDING' && formData.dentistId ? 'CONFIRMED' : formData.status || 'CONFIRMED')
          : undefined,
      };

      if (isEditMode && formData.appointmentId && !String(formData.appointmentId).startsWith('mock-')) {
        await updateAppointment(formData.appointmentId, payloadData);
        toast.success(`Đã đổi lịch khám thành công cho bệnh nhân ${formData.fullName}!`);
      } else {
        await createAppointment(payloadData);
        const docName = selectedDoctor ? getDoctorName(selectedDoctor) : 'Bác sĩ';
        toast.success(`Đã phân công và tạo lịch khám cho ${docName}!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi lưu lịch hẹn:', err);
      toast.error(err.response?.data?.message || 'Thao tác thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-sm bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col font-sans text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-teal-800/40 bg-teal-800 px-5 py-3.5 text-white shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/15 border border-white/20 text-white shadow-2xs shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200">
                  {isEditMode ? 'Đổi Lịch Khám Bệnh Nhân' : 'Đặt Lịch Khám Bệnh Nhân'}
                </span>
                <span className="rounded-sm bg-white/20 px-2 py-0.5 text-[9px] font-extrabold text-white flex items-center gap-1">
                  <Sparkles size={10} /> Đã kết nối Hệ thống Bác sĩ
                </span>
              </div>
              <h3 className="text-base font-extrabold leading-tight text-white tracking-wide">
                {isEditMode ? 'Cập Nhật Thông Tin & Đổi Ca Khám' : 'Phân Công Bác Sĩ & Tạo Ca Khám'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-teal-100 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-slate-800">
          {isCreatedOverOneHour && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-sm shadow-2xs">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>
                Lịch hẹn này đã quá 1 giờ kể từ thời điểm tạo (createdAt). Theo quy định, không được phép chỉnh sửa sau 1 giờ!
              </span>
            </div>
          )}

          {/* Section 1: Patient Information */}
          <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <User size={14} className="text-teal-700" /> Thông tin bệnh nhân
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09xx xxx xxx"
                  className="w-full rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày / Năm sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {targetData?.id || targetData?.requestId ? 'Chi nhánh khách đã đặt hẹn' : 'Chi nhánh tiếp nhận khám'}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 rounded-sm border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building size={14} className="text-teal-700 shrink-0" />
                    <span className="font-bold truncate">
                      {formData.branchName || 'Đang tải thông tin chi nhánh...'}
                    </span>
                  </div>
                  {formData.branchAddress && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-normal shrink-0">
                      <MapPin size={13} className="text-rose-500 shrink-0" />
                      <span>{formData.branchAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Professional Doctor Selector (CUSTOM DROPDOWN) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={14} className="text-teal-700" />
                Bác sĩ phụ trách chuyên môn <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500">Lịch khám sẽ hiển thị ở tài khoản Bác sĩ đã chọn</span>
            </label>

            {/* Custom Doctor Select Trigger Card */}
            <div
              onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
              className="flex items-center justify-between rounded-sm border border-teal-600/40 bg-teal-50/50 p-2.5 shadow-2xs hover:border-teal-700 hover:bg-teal-50/80 cursor-pointer transition-all"
            >
              {selectedDoctor ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-teal-700 font-extrabold text-white text-xs border border-teal-800 shadow-2xs">
                    {getDoctorInitials(selectedDoctor)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-900">
                        {getDoctorName(selectedDoctor)}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-sm bg-teal-100 px-1.5 py-0.2 text-[9px] font-extrabold text-teal-800 border border-teal-200">
                        <Award size={9} /> {selectedDoctor.experienceYears || 8}+ năm KN
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-700 font-bold mt-0.2">
                      {getDoctorSpecialization(selectedDoctor)}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Chọn Bác sĩ trong danh sách...</span>
              )}
              <ChevronDown
                size={18}
                className={`text-teal-700 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Custom Floating Searchable Dropdown Menu */}
            {isDoctorDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-sm border border-slate-300 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar */}
                <div className="border-b border-slate-200 p-2 bg-slate-50">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
                      className="w-full rounded-sm border border-slate-200 bg-white pl-7 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Doctor List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                  {filteredDentists.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">Không tìm thấy bác sĩ phù hợp</div>
                  ) : (
                    filteredDentists.map((doc) => {
                      const isSelected = doc.id === formData.dentistId;
                      const docName = getDoctorName(doc);
                      const docSpec = getDoctorSpecialization(doc);
                      const initials = getDoctorInitials(doc);

                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectDoctor(doc)}
                          className={`flex items-center justify-between p-2.5 rounded-sm cursor-pointer transition-all ${isSelected
                            ? 'bg-teal-700 text-white font-bold shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm font-bold text-xs ${isSelected ? 'bg-white text-teal-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                  {docName}
                                </p>
                                <span
                                  className={`rounded-sm px-1.5 py-0.2 text-[9px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                    }`}
                                >
                                  {doc.experienceYears || 8}+ năm KN
                                </span>
                              </div>
                              <p className={`text-[10px] font-medium mt-0.2 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                                {docSpec}
                              </p>
                            </div>
                          </div>

                          {isSelected && <CheckCircle2 size={16} className="text-white shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Schedule, Room & Service details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Room */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Building size={13} className="text-teal-700" /> Phòng khám xếp lịch
                </span>
              </label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">-- Chọn phòng khám --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomName} {r.floorName ? `(${r.floorName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <ShieldAlert size={13} className="text-amber-600" /> Mức độ ưu tiên
                </span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="NORMAL">Khám thông thường (Theo thứ tự)</option>
                <option value="URGENT">⚠️ Ưu tiên / Ca cấp cứu nha khoa</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-teal-700" /> Ngày hẹn khám <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                name="appointmentDate"
                required
                value={formData.appointmentDate}
                onChange={handleChange}
                className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-teal-700" /> Giờ khám <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="time"
                name="appointmentTime"
                required
                value={formData.appointmentTime}
                onChange={handleChange}
                className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Service Selector / Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <FileText size={13} className="text-teal-700" /> Dịch vụ / Lý do khám bệnh <span className="text-rose-500">*</span>
              </span>
            </label>
            <div className="space-y-1.5">
              <select
                value={COMMON_SERVICES.includes(formData.reason) ? formData.reason : 'OTHER'}
                onChange={(e) => {
                  if (e.target.value !== 'OTHER') {
                    setFormData((prev) => ({ ...prev, reason: e.target.value }));
                  }
                }}
                className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                {COMMON_SERVICES.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
                <option value="OTHER">-- Khác (Tự nhập chi tiết dịch vụ) --</option>
              </select>

              {!COMMON_SERVICES.includes(formData.reason) && (
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Nhập lý do hoặc dịch vụ nha khoa cụ thể..."
                  className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              )}
            </div>
          </div>

          {/* Notes & Medical History */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ghi chú
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-sm border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 resize-none"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy / Đóng
            </button>
            <button
              type="submit"
              disabled={submitting || isCreatedOverOneHour}
              title={isCreatedOverOneHour ? 'Đã quá 1 giờ kể từ khi tạo lịch hẹn (createdAt), không thể cập nhật' : undefined}
              className={`flex items-center gap-1.5 rounded-sm px-5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors ${isCreatedOverOneHour
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800 disabled:opacity-50 cursor-pointer'
                }`}
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {isEditMode ? 'Xác Nhận Đổi Lịch' : 'Xác Nhận Tạo Lịch Hẹn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
