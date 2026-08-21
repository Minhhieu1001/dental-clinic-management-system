import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Globe,
  Calendar,
  X,
  UserCheck,
  HeartPulse,
  AlertTriangle,
  Pill,
  Stethoscope,
  FileText,
  ShieldAlert,
  Save,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function PatientFormModal({
  isOpen,
  onClose,
  patient = null,
  onSave,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('PERSONAL'); // 'PERSONAL' | 'MEDICAL'

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationality: 'Việt Nam',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
    systemicDisease: [],
    allergies: '',
    currentMedications: '',
    pastSurgeries: '',
    notes: '',
  });

  // Populate data when editing existing patient or reset for new patient
  useEffect(() => {
    if (patient) {
      setFormData({
        fullName: patient.fullName || patient.patientName || '',
        phone: patient.phone || patient.phoneNumber || '',
        nationality: patient.nationality || 'Việt Nam',
        gender: patient.gender || 'MALE',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        address: patient.address || '',
        systemicDisease: Array.isArray(patient.systemicDisease)
          ? patient.systemicDisease
          : typeof patient.systemicDisease === 'string'
          ? patient.systemicDisease.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        allergies: patient.allergies || '',
        currentMedications: patient.currentMedications || '',
        pastSurgeries: patient.pastSurgeries || patient.surgicalHistory || '',
        notes: patient.notes || '',
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        nationality: 'Việt Nam',
        gender: 'MALE',
        dateOfBirth: '',
        address: '',
        systemicDisease: [],
        allergies: '',
        currentMedications: '',
        pastSurgeries: '',
        notes: '',
      });
    }
    setActiveTab('PERSONAL');
  }, [patient, isOpen]);

  if (!isOpen) return null;

  // Handle systemic disease checkbox toggle
  const handleToggleDisease = (disease) => {
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập Họ và tên bệnh nhân');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập Số điện thoại liên hệ');
      return;
    }

    setSubmitting(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      toast.success(
        patient
          ? 'Đã cập nhật thành công hồ sơ bệnh nhân!'
          : 'Đã tạo thành công hồ sơ bệnh nhân mới!'
      );
      onClose();
    } catch (err) {
      console.error('Error saving patient profile:', err);
      toast.error('Có lỗi xảy ra khi lưu hồ sơ bệnh nhân');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Container: Enlarged size max-w-4xl (896px) with smooth entrance animation */}
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200/80 my-4 transform transition-all duration-300 animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-900 px-6 py-4 text-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700/60 border border-teal-500/30 text-teal-200">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {patient ? 'Chỉnh Sửa Hồ Sơ Bệnh Nhân' : 'Tạo Hồ Sơ Bệnh Nhân Mới'}
              </h3>
              <p className="text-xs text-teal-200/90 font-medium pt-0.5">
                {patient?.patientCode ? `Mã BN: ${patient.patientCode} · ` : ''}Hệ thống quản lý thông tin hành chính & tiền sử y tế
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

        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-6 pt-3 gap-3 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('PERSONAL')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'PERSONAL'
                ? 'border-teal-700 text-teal-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <UserCheck size={16} />
            <span>1. Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEDICAL')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'MEDICAL'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg'
            }`}
          >
            <ShieldAlert size={16} />
            <span>2. Tiền sử y tế & Ghi chú bác sĩ</span>
            {formData.systemicDisease.length > 0 && (
              <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
                {formData.systemicDisease.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Content Body with Large Max Height */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Họ tên */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Bệnh nhân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nhập đầy đủ họ và tên..."
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
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0901234567"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIỀN SỬ Y TẾ & GHI CHÚ BÁC SĨ */}
          {activeTab === 'MEDICAL' && (
            <div className="space-y-4">
              {/* Bệnh lý toàn thân Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <HeartPulse size={15} className="text-rose-600" /> Bệnh lý toàn thân (Bác sĩ tích chọn nếu có):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {COMMON_SYSTEMIC_DISEASES.map((dis) => {
                    const isChecked = formData.systemicDisease.includes(dis);
                    return (
                      <label
                        key={dis}
                        className={`flex items-center gap-2 text-xs p-2 rounded-md border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDisease(dis)}
                          className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="truncate">{dis}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dị ứng, Thuốc dài hạn, Phẫu thuật Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Dị ứng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} className="text-amber-600" /> Dị ứng (Lidocaine, Penicillin...):
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="VD: Dị ứng Thuốc tê Lidocaine..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Thuốc đang dùng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Pill size={14} className="text-purple-600" /> Thuốc sử dụng dài hạn:
                  </label>
                  <input
                    type="text"
                    value={formData.currentMedications}
                    onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                    placeholder="VD: Aspirin 81mg, Insulin..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Tiền sử phẫu thuật */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Stethoscope size={14} className="text-teal-700" /> Tiền sử phẫu thuật:
                  </label>
                  <input
                    type="text"
                    value={formData.pastSurgeries}
                    onChange={(e) => setFormData({ ...formData, pastSurgeries: e.target.value })}
                    placeholder="VD: Phẫu thuật mổ ruột thừa 2021..."
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Ghi chú chuyên môn Bác sĩ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText size={14} className="text-slate-600" /> Ghi chú chuyên môn Bác sĩ:
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú lâm sàng, lưu ý điều trị đặc biệt..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 mt-6">
            <div className="flex items-center gap-2">
              {activeTab === 'PERSONAL' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('MEDICAL')}
                  className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  <span>Tiếp: Tiền sử y tế</span>
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('PERSONAL')}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Quay lại thông tin cá nhân</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Save size={15} />
                <span>{submitting ? 'Đang lưu...' : patient ? 'Lưu cập nhật' : 'Tạo hồ sơ bệnh nhân'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
