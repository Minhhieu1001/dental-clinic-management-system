import { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDentistsList } from '../../services/dentist.service';
import { createAppointment } from '../../services/appointment.service';
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

export default function CreateAppointmentModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const [dentists, setDentists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Custom Doctor Select State
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    requestId: null,
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
          setFormData((prev) => ({
            ...prev,
            dentistId: prev.dentistId || processedDentists[0].id,
          }));
        }
      } catch (err) {
        console.warn('Lỗi khởi tạo dữ liệu modal:', err);
      } finally {
        setLoadingDentists(false);
      }
    };

    fetchInitialData();

    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        requestId: initialData.id || null,
        fullName: initialData.name || initialData.fullName || '',
        phone: initialData.phone || '',
        dentistId: initialData.dentistId || prev.dentistId,
        appointmentDate: initialData.date ? initialData.date.split(' ')[0] : new Date().toISOString().split('T')[0],
        appointmentTime: '09:00',
        reason: initialData.note || initialData.description || COMMON_SERVICES[0],
        notes: initialData.notes || '',
      }));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectDoctor = (doctor) => {
    setFormData((prev) => ({ ...prev, dentistId: doctor.id }));
    setIsDoctorDropdownOpen(false);
  };

  const selectedDoctor = dentists.find((d) => d.id === formData.dentistId) || dentists[0];

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
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại bệnh nhân!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requestId: isValidUUID(formData.requestId) ? formData.requestId : null,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        dentistId: isValidUUID(formData.dentistId) ? formData.dentistId : null,
        roomId: isValidUUID(formData.roomId) ? formData.roomId : null,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason.trim(),
        notes: `${formData.priority === 'URGENT' ? '[ƯU TIÊN / CẤP CỨU] ' : ''}${formData.notes.trim()}`,
      };

      await createAppointment(payload);

      const docName = selectedDoctor ? getDoctorName(selectedDoctor) : 'Bác sĩ';
      toast.success(`Đã phân công và tạo lịch khám cho ${docName}!`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi tạo lịch hẹn:', err);
      toast.error(err.response?.data?.message || 'Tạo lịch hẹn thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-md">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Đặt Lịch Khám Bệnh Nhân</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <Sparkles size={11} /> Đã kết nối Hệ thống Bác sĩ
                </span>
              </div>
              <h3 className="text-lg font-bold leading-tight">Phân Công Bác Sĩ & Tạo Ca Khám</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: Patient Information */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <User size={14} className="text-teal-600" /> Thông tin bệnh nhân
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Professional Doctor Selector (CUSTOM DROPDOWN) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[12px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={15} className="text-teal-600" />
                Bác sĩ phụ trách chuyên môn <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">Lịch khám sẽ hiển thị ở tài khoản Bác sĩ đã chọn</span>
            </label>

            {/* Custom Doctor Select Trigger Card */}
            <div
              onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
              className="flex items-center justify-between rounded-xl border border-teal-600/30 bg-teal-50/40 p-3 shadow-sm hover:border-teal-600 hover:bg-teal-50/60 cursor-pointer transition-all"
            >
              {selectedDoctor ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 font-extrabold text-white shadow-md text-sm border border-teal-800">
                    {getDoctorInitials(selectedDoctor)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-800">
                        {getDoctorName(selectedDoctor)}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                        <Award size={10} /> {selectedDoctor.experienceYears || 8}+ năm KN
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-700 font-bold mt-0.5">
                      {getDoctorSpecialization(selectedDoctor)}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Chọn Bác sĩ trong danh sách...</span>
              )}
              <ChevronDown
                size={20}
                className={`text-teal-700 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Custom Floating Searchable Dropdown Menu */}
            {isDoctorDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar */}
                <div className="border-b border-slate-100 p-2.5 bg-slate-50/70">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
                      className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Doctor List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1.5">
                  {filteredDentists.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">Không tìm thấy bác sĩ phù hợp</div>
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
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-700 text-white font-bold shadow-md shadow-teal-700/20'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                                isSelected ? 'bg-white text-teal-800' : 'bg-teal-50 text-teal-700 border border-teal-100'
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
                                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                  }`}
                                >
                                  {doc.experienceYears || 8}+ năm KN
                                </span>
                              </div>
                              <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                                {docSpec}
                              </p>
                            </div>
                          </div>

                          {isSelected && <CheckCircle2 size={18} className="text-white shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Schedule, Room & Service details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Room */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Building size={13} className="text-teal-600" /> Phòng khám xếp lịch
                </span>
              </label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="NORMAL">Khám thông thường (Theo thứ tự)</option>
                <option value="URGENT">⚠️ Ưu tiên / Ca cấp cứu nha khoa</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-teal-600" /> Ngày hẹn khám <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="date"
                name="appointmentDate"
                required
                value={formData.appointmentDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-teal-600" /> Giờ khám <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="time"
                name="appointmentTime"
                required
                value={formData.appointmentTime}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Service Selector / Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <FileText size={13} className="text-teal-600" /> Dịch vụ / Lý do khám bệnh <span className="text-rose-500">*</span>
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              )}
            </div>
          </div>

          {/* Notes & Medical History */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ghi chú thêm & Tiền sử bệnh lý (Dị ứng thuốc, bệnh nền,...)
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Nhập tiền sử bệnh lý hoặc lời dặn của bệnh nhân..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy / Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Xác Nhận Tạo Lịch Hẹn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
