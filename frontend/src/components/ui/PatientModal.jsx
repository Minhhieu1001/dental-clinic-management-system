import { useState, useEffect } from 'react';
import {
  User,
  UserPlus,
  Edit,
  Trash2,
  FileText,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Globe,
  X,
  Save,
  HeartPulse,
  AlertTriangle,
  Pill,
  Stethoscope,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getEmployeeAddressById } from '../../services/employee.service';
import { getDentistAddressById } from '../../services/dentist.service';
import { getBranchById, getBranches, getClinicById, getClinics } from '../../services/clinic.service';

const COMMON_SYSTEMIC_DISEASES = [
  'Huyết áp cao',
  'Tiểu đường',
  'Bệnh tim mạch',
  'Máu khó đông',
  'Bệnh hen suyễn',
  'Bệnh gan / Thận',
  'Bệnh dạ dày',
  'Khác',
];

const QUICK_MEDICAL_VALUES = {
  allergies: ['Không', 'Chưa rõ'],
  currentMedications: ['Không', 'Không nhớ'],
  surgicalHistory: ['Không', 'Chưa từng phẫu thuật'],
};

/**
 * Unified Patient Modal for CREATE, EDIT, VIEW, and DELETE operations.
 *
 * @param {boolean} open - Modal open status
 * @param {'CREATE' | 'EDIT' | 'VIEW' | 'DELETE'} type - Operation mode
 * @param {object} payload - Patient data object for EDIT, VIEW, or DELETE
 * @param {function} onClose - Close modal handler
 * @param {function} onSave - Save handler (receives formData for CREATE or EDIT)
 * @param {function} onConfirmDelete - Delete handler (receives payload for DELETE)
 */
export default function PatientModal({
  open,
  type = 'CREATE',
  payload = null,
  onClose,
  onSave,
  onConfirmDelete,
}) {
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [branchInfo, setBranchInfo] = useState(null);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [branchRetry, setBranchRetry] = useState(0);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const role = user?.role;
  const staffId = role === 'DENTIST' ? user?.dentistId : user?.employeeId;
  const isCreate = type === 'CREATE';
  const isEdit = type === 'EDIT';
  const isView = type === 'VIEW';
  const isReadOnly = isView;
  const branchScope = isCreate ? `${role}:${staffId || 'create'}` : `patient:${payload?.id || ''}`;

  useEffect(() => {
    if (!open || type === 'DELETE') return;
    let cancelled = false;
    const loadBranch = async () => {
      setBranchInfo(null);
      setBranchError('');
      setBranchLoading(true);
      try {
        if (type === 'CREATE' && role === 'ADMIN') {
          setSelectedBranchId('');
          const [branches, clinics] = await Promise.all([
            getBranches(),
            getClinics().catch(() => []),
          ]);
          const options = (Array.isArray(branches) ? branches : []).map((branch) => {
            const clinic = (Array.isArray(clinics) ? clinics : []).find((item) => item.clinicId === branch.clinicId);
            return {
              branchId: branch.branchId,
              branchName: branch.branchName,
              branchAddress: branch.address,
              dentalClinicName: clinic?.legalName || clinic?.brandName || branch.branchName,
            };
          });
          if (!options.length) throw new Error('Hệ thống chưa có chi nhánh để tạo hồ sơ bệnh nhân.');
          if (!cancelled) setBranchOptions(options);
        } else if (type === 'CREATE') {
          if (!staffId || !['EMPLOYEE', 'DENTIST'].includes(role)) {
            throw new Error('Không xác định được thông tin nhân viên hoặc bác sĩ đang đăng nhập.');
          }
          const profile = role === 'DENTIST'
            ? await getDentistAddressById(staffId)
            : await getEmployeeAddressById(staffId);
          if (!profile?.branchId) {
            throw new Error('Tài khoản chưa được gán chi nhánh. Vui lòng liên hệ quản trị viên.');
          }
          if (!cancelled) setBranchInfo({ ...profile, scope: branchScope });
        } else {
          if (!payload?.createdBranchId) throw new Error('Hồ sơ bệnh nhân chưa có thông tin chi nhánh tạo hồ sơ.');
          const branch = await getBranchById(payload.createdBranchId);
          const clinic = branch.clinicId ? await getClinicById(branch.clinicId).catch(() => null) : null;
          if (!cancelled) setBranchInfo({
            branchId: branch.branchId,
            branchName: branch.branchName,
            branchAddress: branch.address,
            dentalClinicName: clinic?.legalName || clinic?.brandName || branch.branchName,
            scope: branchScope,
          });
        }
      } catch (error) {
        if (!cancelled) setBranchError(error.response?.data?.message || error.message || 'Không tải được thông tin chi nhánh.');
      } finally {
        if (!cancelled) setBranchLoading(false);
      }
    };
    loadBranch();
    return () => { cancelled = true; };
  }, [open, type, role, staffId, branchRetry, payload?.id, payload?.createdBranchId, branchScope]);

  const currentBranch = isCreate && role === 'ADMIN'
    ? branchOptions.find((branch) => branch.branchId === selectedBranchId) || null
    : branchInfo?.scope === branchScope ? branchInfo : null;

  // Form state initialized from payload
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    cccd: '',
    email: '',
    nationality: 'Việt Nam',
    hometown: '',
    job: '',
    contactName: '',
    contactPhone: '',
    contactRelationship: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
    systemicDisease: [],
    allergies: '',
    currentMedications: '',
    surgicalHistory: '',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
    if (open && payload && (type === 'EDIT' || type === 'VIEW')) {
      setFormData({
        fullName: payload.fullName || payload.patientName || '',
        phone: payload.phone || payload.phoneNumber || '',
        cccd: payload.cccd || '',
        email: payload.email || payload.user?.email || '',
        nationality: payload.nationality || 'Việt Nam',
        hometown: payload.hometown || '',
        job: payload.job || '',
        contactName: payload.contactName || '',
        contactPhone: payload.contactPhone || '',
        contactRelationship: payload.contactRelationship || '',
        gender: payload.gender || 'MALE',
        dateOfBirth: payload.dateOfBirth ? payload.dateOfBirth.split('T')[0] : '',
        address: payload.address || '',
        systemicDisease: Array.isArray(payload.systemicDisease)
          ? payload.systemicDisease
          : typeof payload.systemicDisease === 'string'
            ? payload.systemicDisease.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        allergies: payload.allergies || '',
        currentMedications: payload.currentMedications || '',
        surgicalHistory: payload.surgicalHistory || payload.pastSurgeries || '',
        notes: payload.notes || '',
      });
    } else if (type === 'CREATE') {
      setFormData({
        fullName: '',
        phone: '',
        cccd: '',
        email: '',
        nationality: 'Việt Nam',
        hometown: '',
        job: '',
        contactName: '',
        contactPhone: '',
        contactRelationship: '',
        gender: 'MALE',
        dateOfBirth: '',
        address: '',
        systemicDisease: [],
        allergies: '',
        currentMedications: '',
        surgicalHistory: '',
        notes: '',
      });
    }
    }, 0);
    return () => clearTimeout(timer);
  }, [open, type, payload]);

  if (!open) return null;

  // Handle disease checkbox toggle
  const handleToggleDisease = (disease) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const exists = prev.systemicDisease.includes(disease);
      return {
        ...prev,
        systemicDisease: exists
          ? prev.systemicDisease.filter((d) => d !== disease)
          : [...prev.systemicDisease, disease],
      };

    });
  };

  const applyQuickMedicalValue = (field, value) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'VIEW') {
      onClose();
      return;
    }
    if (type === 'DELETE') {
      if (onConfirmDelete) {
        await onConfirmDelete(payload);
      }
      onClose();
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập Họ và tên bệnh nhân');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập Số điện thoại liên hệ');
      return;
    }

    if (type === 'CREATE' && (branchLoading || !currentBranch?.branchId)) {
      toast.error(branchError || 'Vui lòng chờ tải thông tin chi nhánh.');
      return;
    }
    setSubmitting(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          ...(type === 'CREATE' ? { branchId: currentBranch.branchId } : {}),
          id: payload?.id,
          patientCode: payload?.patientCode,
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving patient profile:', err);
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu hồ sơ bệnh nhân');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // TYPE 4: DELETE CONFIRMATION MODAL
  // =========================================================================
  if (type === 'DELETE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-scaleUp">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 border border-rose-200">
            <Trash2 size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Xác Nhận Xóa Hồ Sơ</h3>
            <p className="text-xs text-slate-500 pt-1">
              Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân{' '}
              <span className="font-bold text-slate-900">{payload?.fullName}</span>{' '}
              {payload?.patientCode ? `(${payload.patientCode})` : ''} không? Thao tác này không thể hoàn tác.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isView ? 'Đóng' : 'Hủy bỏ'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!onConfirmDelete) return;
                try {
                  await onConfirmDelete(payload);
                  onClose();
                } catch (error) {
                  toast.error(error.response?.data?.message || error.message || 'Không thể xóa bệnh nhân');
                }
              }}
              className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CREATE / EDIT / VIEW: shared patient form
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-6xl rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200/80 my-4 transform transition-all duration-300 animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-900 px-6 py-4 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700/60 border border-teal-500/30 text-teal-200">
              {isView ? <FileText size={22} /> : isEdit ? <Edit size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {isCreate
                  ? 'Tạo Hồ Sơ Bệnh Nhân Mới'
                  : isEdit
                    ? 'Chỉnh Sửa Hồ Sơ Bệnh Nhân'
                    : 'Chi Tiết Hồ Sơ Bệnh Nhân'}
              </h3>
              <p className="text-xs text-teal-200/90 font-medium pt-0.5">
                {payload?.patientCode ? `Mã BN: ${payload.patientCode} · ` : ''}{isView ? 'Thông tin bệnh nhân và tiền sử y tế' : 'Nhập thông tin bệnh nhân và tiền sử y tế'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-teal-200 hover:bg-teal-700 hover:text-white transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Clinic Information & Medical Record Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50/50 border border-teal-200/80 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-2xs shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-teal-950 uppercase tracking-wide">
                    {currentBranch?.dentalClinicName || (branchLoading ? 'Đang tải nha khoa...' : 'Chưa có tên nha khoa')}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                  <MapPin size={12} className="text-rose-500 shrink-0" />
                  <span>{currentBranch?.branchAddress || 'Chưa có địa chỉ chi nhánh'}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-teal-100/80">
              <span className="text-[11px] text-slate-400 font-semibold">Chi nhánh tạo hồ sơ:</span>
              {isCreate && role === 'ADMIN' ? (
                <select
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                  disabled={branchLoading}
                  aria-label="Chọn chi nhánh tạo hồ sơ"
                  className="max-w-64 rounded-md border border-teal-200 bg-white px-2.5 py-1 text-xs font-bold text-teal-900"
                >
                  <option value="">Chọn chi nhánh</option>
                  {branchOptions.map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>{branch.branchName}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-teal-900 bg-white px-2.5 py-1 rounded-md border border-teal-200 shadow-2xs">
                  {currentBranch?.branchName || 'Chưa xác định chi nhánh'}
                </span>
              )}
            </div>
          </div>

          {branchError && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {branchError}
              <button type="button" onClick={() => setBranchRetry((value) => value + 1)}
                className="ml-3 font-semibold underline">Thử lại</button>
            </div>
          )}

          {/* Personal Info Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
              <User size={15} className="text-teal-700" /> Thông Tin Hành Chính Bệnh Nhân
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Họ tên */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên Bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={!isView}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên bệnh nhân..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>


              {/* SĐT */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-teal-700" /> Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={!isView}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0901234567"
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-teal-700" /> Email liên hệ
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: patient@example.com"
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* CCCD */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CCCD</label>
                <input
                  type="text"
                  value={formData.cccd}
                  onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                  placeholder="Nhập số CCCD..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Giới tính */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none cursor-pointer transition-all shadow-2xs"
                >
                  <option value="MALE">Nam (MALE)</option>
                  <option value="FEMALE">Nữ (FEMALE)</option>
                  <option value="OTHER">Khác (OTHER)</option>
                </select>
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-teal-700" /> Ngày sinh
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Quốc tịch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe size={13} className="text-teal-700" /> Quốc tịch
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="VD: Việt Nam, Mỹ, Nhật..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Địa chỉ */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, Đường, Quận/Huyện..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Quê quán */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quê quán</label>
                <input
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                  placeholder="Tỉnh/Thành phố quê quán..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Nghề nghiệp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nghề nghiệp</label>
                <input
                  type="text"
                  value={formData.job}
                  onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                  placeholder="Nhập nghề nghiệp..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
              <Phone size={15} className="text-teal-700" /> Thông Tin Người Liên Hệ (Người Thân / Khẩn Cấp)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/60">
              {/* Họ tên người liên hệ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên người liên hệ
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="VD: Nguyễn Văn B (Bố / Mẹ / Vợ / Chồng...)"
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* SĐT người liên hệ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại người liên hệ
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="VD: 0987654321"
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Mối quan hệ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mối quan hệ với bệnh nhân
                </label>
                <input
                  type="text"
                  value={formData.contactRelationship}
                  onChange={(e) => setFormData({ ...formData, contactRelationship: e.target.value })}
                  placeholder="VD: Bố, Mẹ, Vợ, Chồng, Con, Anh/Chị/Em..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Medical History Section */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
              <HeartPulse size={15} className="text-rose-600" /> Tiền Sử Y Tế & Lâm Sàng
            </h4>

            {/* Bệnh lý toàn thân Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bệnh lý toàn thân (Bác sĩ tích chọn nếu có):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {COMMON_SYSTEMIC_DISEASES.map((dis) => {
                  const isChecked = formData.systemicDisease.includes(dis);
                  return (
                    <label
                      key={dis}
                      className={`flex items-center gap-2 text-xs p-2 rounded-md border transition-all cursor-pointer select-none ${isChecked
                        ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isReadOnly}
                        onChange={() => handleToggleDisease(dis)}
                        className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span className="truncate">{dis}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dị ứng, thuốc đang dùng và tiền sử phẫu thuật */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <AlertTriangle size={13} className="text-amber-600" /> Dị ứng (Lidocaine, Penicillin...):
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="VD: Dị ứng Thuốc tê Lidocaine..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {QUICK_MEDICAL_VALUES.allergies.map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => applyQuickMedicalValue('allergies', value)}
                      className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Pill size={13} className="text-purple-600" /> Thuốc đang sử dụng dài hạn:
                </label>
                <input
                  type="text"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                  placeholder="VD: Aspirin 81mg, Insulin..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {QUICK_MEDICAL_VALUES.currentMedications.map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => applyQuickMedicalValue('currentMedications', value)}
                      className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-800 hover:bg-purple-100 cursor-pointer"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Stethoscope size={13} className="text-teal-700" /> Tiền sử phẫu thuật:
                </label>
                <input
                  type="text"
                  value={formData.surgicalHistory}
                  onChange={(e) => setFormData({ ...formData, surgicalHistory: e.target.value })}
                  placeholder="VD: Mổ ruột thừa năm 2021..."
                  readOnly={isReadOnly}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {QUICK_MEDICAL_VALUES.surgicalHistory.map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => applyQuickMedicalValue('surgicalHistory', value)}
                      className="rounded border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText size={13} className="text-slate-600" /> Ghi chú lưu ý:
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Tiền sử phẫu thuật, lưu ý khi nhổ răng/khám..."
                readOnly={isReadOnly}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isView ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={submitting || (type === 'CREATE' && (branchLoading || !currentBranch?.branchId))}
                className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Save size={15} />
                <span>{submitting ? 'Đang lưu...' : type === 'EDIT' ? 'Lưu cập nhật' : 'Tạo hồ sơ bệnh nhân'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
