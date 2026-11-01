import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Copy,
  Briefcase,
  Globe2,
  QrCode,
  Printer,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { getPatientById, updatePatient } from '../../../services/patient.service';
import { updateUser } from '../../../services/user.service';
import { uploadImage } from '../../../services/media.service';
import { useAuthStore } from '../../../store/authStore';
import Loading from '../../../components/ui/Loading';

// Cấu trúc dữ liệu mặc định chuẩn cho bệnh nhân (không chứa dữ liệu giả)
const EMPTY_PATIENT = {
  id: '',
  patientCode: '',
  fullName: '',
  avatarUrl: '',
  gender: 'OTHER',
  dateOfBirth: null,
  phoneNumber: '',
  phone: '',
  email: '',
  cccd: '',
  nationality: 'Việt Nam',
  hometown: '',
  job: '',
  address: '',
  systemicDisease: '',
  allergies: '',
  currentMedications: '',
  surgicalHistory: '',
  createdAt: null,
  patientInsurances: [],
  // Người liên hệ khẩn cấp mặc định chuỗi rỗng (bổ sung thuộc tính BE sau)
  emergencyContact: {
    fullName: '',
    relationship: '',
    phoneNumber: ''
  },
  stats: {
    totalVisits: 0,
    branchName: ''
  }
};

export default function InforPatient() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'insurance'
  const [isEditing, setIsEditing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  // Lấy patientId từ thông tin user đăng nhập
  const patientId = user?.patientId || user?.id;

  const [patientData, setPatientData] = useState(EMPTY_PATIENT);
  const [formData, setFormData] = useState(EMPTY_PATIENT);

  // Gọi API lấy dữ liệu thật của bệnh nhân
  const fetchPatientById = async (id) => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getPatientById(id);
      if (res) {
        // Chuẩn hóa dữ liệu trả về từ PatientDTO thật, không dùng mock
        const normalized = {
          ...EMPTY_PATIENT,
          ...res,
          id: res.id || id,
          patientCode: res.patientCode || user?.username || '',
          fullName: res.fullName || user?.fullName || '',
          phone: res.phone || res.phoneNumber || '',
          phoneNumber: res.phone || res.phoneNumber || '',
          email: res.email || user?.email || '',
          avatarUrl: user?.avatarUrl || '',
          gender: res.gender || 'OTHER',
          dateOfBirth: res.dateOfBirth || null,
          cccd: res.cccd || '',
          nationality: res.nationality || 'Việt Nam',
          hometown: res.hometown || '',
          job: res.job || '',
          address: res.address || '',
          systemicDisease: res.systemicDisease || '',
          allergies: res.allergies || '',
          currentMedications: res.currentMedications || '',
          surgicalHistory: res.surgicalHistory || '',
          createdAt: res.createdAt || null,
          patientInsurances: Array.isArray(res.patientInsurances) ? res.patientInsurances : [],
          emergencyContact: {
            fullName: res.emergencyContact?.fullName || '',
            relationship: res.emergencyContact?.relationship || '',
            phoneNumber: res.emergencyContact?.phoneNumber || ''
          },
          stats: {
            totalVisits: res.stats?.totalVisits ?? 0,
            branchName: res.stats?.branchName || ''
          }
        };
        setPatientData(normalized);
        setFormData(normalized);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin bệnh nhân:', error);
      toast.error('Không thể tải dữ liệu bệnh nhân từ máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return; // Đang chờ Zustand nạp thông tin user/token từ authStore
    if (patientId) {
      fetchPatientById(patientId);
    } else {
      setLoading(false);
    }
  }, [patientId, authLoading]);

  // Xử lý thay đổi input
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    }));
  };

  // Bắt đầu chỉnh sửa
  const handleStartEdit = () => {
    setFormData(patientData);
    setAvatarFile(null);
    setAvatarPreview(user?.avatarUrl || patientData?.avatarUrl || null);
    setIsEditing(true);
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setFormData(patientData);
    setAvatarFile(null);
    setAvatarPreview(user?.avatarUrl || patientData?.avatarUrl || null);
    setIsEditing(false);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh đại diện không được vượt quá 5MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Lưu chỉnh sửa (gọi API updatePatient thật)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData?.fullName?.trim()) {
      toast.error('Họ và tên không được để trống!');
      return;
    }
    const phoneVal = formData?.phoneNumber || formData?.phone;
    if (!phoneVal?.trim()) {
      toast.error('Số điện thoại không được để trống!');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user?.avatarUrl || patientData?.avatarUrl || null;
      if (avatarFile) {
        const uploadResult = await uploadImage(avatarFile);
        avatarUrl = uploadResult?.url || uploadResult?.secure_url || uploadResult;
        if (!avatarUrl) {
          throw new Error('Không nhận được đường dẫn ảnh đại diện sau khi tải lên.');
        }
        const updatedUser = await updateUser(user.id, { avatarUrl });
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user,
          avatarUrl: updatedUser?.avatarUrl || avatarUrl,
        });
      }

      if (patientId) {
        const payload = {
          fullName: formData.fullName.trim(),
          phone: phoneVal.trim(),
          cccd: formData.cccd?.trim() || null,
          email: formData.email?.trim() || null,
          gender: formData.gender || 'OTHER',
          dateOfBirth: formData.dateOfBirth
            ? (formData.dateOfBirth.includes('T') ? formData.dateOfBirth : `${formData.dateOfBirth}T00:00:00`)
            : null,
          address: formData.address?.trim() || null,
          nationality: formData.nationality?.trim() || 'Việt Nam',
          hometown: formData.hometown?.trim() || null,
          job: formData.job?.trim() || null,
          systemicDisease: formData.systemicDisease?.trim() || null,
          allergies: formData.allergies?.trim() || null,
          currentMedications: formData.currentMedications?.trim() || null,
          surgicalHistory: formData.surgicalHistory?.trim() || null
        };

        const updated = await updatePatient(patientId, payload);
        if (updated) {
          const merged = {
            ...patientData,
            ...updated,
            phone: updated.phone || updated.phoneNumber || phoneVal,
            phoneNumber: updated.phone || updated.phoneNumber || phoneVal,
            avatarUrl,
            emergencyContact: formData.emergencyContact || patientData.emergencyContact
          };
          setPatientData(merged);
          setFormData(merged);
        } else {
          setPatientData(formData);
        }
      } else {
        setPatientData({ ...formData, avatarUrl });
      }
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      setIsEditing(false);
      toast.success('Cập nhật thông tin bệnh nhân thành công!');
    } catch (err) {
      console.error('Lỗi khi lưu thông tin bệnh nhân:', err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin!');
    } finally {
      setSaving(false);
    }
  };

  // Sao chép văn bản
  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  // Tính tuổi từ ngày sinh
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    try {
      const birthYear = new Date(dobString).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      return isNaN(age) || age <= 0 ? '' : `${age} tuổi`;
    } catch {
      return '';
    }
  };

  // Format ngày sinh VN
  const formatDateVN = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Chưa cập nhật';
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Chưa cập nhật';
    }
  };

  // Format giới tính
  const formatGender = (gender) => {
    switch (gender) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      default:
        return 'Khác';
    }
  };

  // Đang tải dữ liệu từ API hoặc đang khởi tạo phiên đăng nhập
  if (loading || authLoading) {
    return (
      <div className="min-h-[460px] flex items-center justify-center rounded-3xl border border-slate-200/90 bg-white shadow-sm p-12">
        <Loading
          title="Đang tải thông tin hồ sơ bệnh nhân..."
          subtitle="Vui lòng đợi trong giây lát, hệ thống đang đồng bộ dữ liệu"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Loading Overlay của hệ thống khi đang lưu thay đổi */}
      {saving && (
        <Loading
          overlay
          title="Đang lưu thông tin hồ sơ..."
          subtitle="Vui lòng không đóng trang trong lúc hệ thống cập nhật"
          size="md"
        />
      )}

      {/* Layout 2 Cột: Bên trái Ảnh & Tóm tắt - Bên phải Toàn bộ thông tin cá nhân */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ==================== CỘT BÊN TRÁI: ẢNH ĐẠI DIỆN & TỔNG QUAN HỒ SƠ (ẨN TRÊN MOBILE) ==================== */}
        <div className="hidden lg:block lg:col-span-4 space-y-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm text-center flex flex-col items-center">

            {/* Ảnh đại diện lớn & Badge trạng thái */}
            <div className="relative mb-4 mt-2">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-tr from-teal-700 via-teal-800 to-emerald-700 text-white font-black text-4xl shadow-lg ring-4 ring-teal-50 select-none">
                {(avatarPreview || user?.avatarUrl || patientData?.avatarUrl) ? (
                  <img
                    src={avatarPreview || user?.avatarUrl || patientData.avatarUrl}
                    alt="Ảnh đại diện"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  patientData?.fullName
                    ? patientData.fullName.charAt(0).toUpperCase()
                    : (user?.username?.charAt(0)?.toUpperCase() || 'P')
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-sm"
                title="Hồ sơ hoạt động"
              >
                <CheckCircle2 size={18} />
              </div>
            </div>
            {isEditing && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mb-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
                >
                  {avatarPreview ? 'Đổi ảnh đại diện' : 'Chọn ảnh đại diện'}
                </button>
              </>
            )}

            {/* Họ tên bệnh nhân */}
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {patientData?.fullName || 'Chưa cập nhật'}
            </h2>

            {/* Mã bệnh nhân với nút sao chép */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200/60 font-mono">
              <span>{patientData?.patientCode || 'PA-Chưa cấp'}</span>
              {patientData?.patientCode && (
                <button
                  type="button"
                  onClick={() => handleCopyText(patientData.patientCode, 'Mã bệnh nhân')}
                  className="hover:text-teal-950 transition-colors cursor-pointer"
                  title="Sao chép mã"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>

            {/* Các nút hành động chính bên trái */}
            <div className="mt-6 w-full space-y-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-colors cursor-pointer active:scale-98"
                >
                  <Edit3 size={15} />
                  <span>Cập nhật hồ sơ</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X size={15} />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{saving ? 'Đang lưu...' : 'Lưu'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <QrCode size={15} className="text-teal-700" />
                <span>Mã QR Tiếp nhận khám</span>
              </button>
            </div>

            {/* Chi tiết tóm tắt nhanh dưới ảnh */}
            <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ngày mở hồ sơ:</span>
                <span className="font-semibold text-slate-800">{formatDateVN(patientData?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số lượt đã khám:</span>
                <span className="font-bold text-teal-700">{patientData?.stats?.totalVisits ?? 0} lượt</span>
              </div>
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 shrink-0">Cơ sở chính:</span>
                <span className="font-medium text-slate-800 text-right">
                  {patientData?.stats?.branchName || 'Nha khoa Crown Dental'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CỘT BÊN PHẢI: THÔNG TIN CÁ NHÂN & CHI TIẾT ==================== */}
        <div className="col-span-1 lg:col-span-8 space-y-5">

          {/* Navigation Tabs - 2 tab bo tròn */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'personal'
                ? 'border-teal-700 text-teal-800 bg-teal-50/60 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <User size={16} className={activeTab === 'personal' ? 'text-teal-700' : 'text-slate-400'} />
              <span>Thông tin cá nhân & Liên lạc</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('insurance')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'insurance'
                ? 'border-teal-700 text-teal-800 bg-teal-50/60 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <CreditCard size={16} className={activeTab === 'insurance' ? 'text-teal-700' : 'text-slate-400'} />
              <span>Bảo hiểm Y tế & Nha khoa</span>
              <span className="rounded-full bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 font-bold">
                {patientData?.patientInsurances?.length || 0}
              </span>
            </button>
          </div>

          {/* TAB 1: THÔNG TIN CÁ NHÂN & LIÊN LẠC (Dạng văn bản, an toàn dữ liệu null) */}
          {activeTab === 'personal' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">

              {/* Header của khối - Chống vỡ layout khi thu nhỏ */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
                    <User size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      Hồ sơ thông tin bệnh nhân
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate sm:whitespace-normal">
                      Thông tin nhân khẩu học, nơi cư trú và người thân liên hệ khẩn cấp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-teal-800 transition-colors cursor-pointer shrink-0"
                    title="Mã QR Tiếp nhận khám"
                  >
                    <QrCode size={15} />
                  </button>

                  {isEditing ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
                      Chế độ chỉnh sửa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/70 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      <Edit3 size={13} />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Phần 1: Thông tin nhân khẩu học */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  Thông tin nhân khẩu học
                </h4>

                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Họ và tên */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Họ và tên {isEditing && <span className="text-rose-500">*</span>}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.fullName || ''}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Nhập họ và tên..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {patientData?.fullName || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Giới tính
                    </span>
                    {isEditing ? (
                      <select
                        value={formData?.gender || 'OTHER'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatGender(patientData?.gender)}
                      </p>
                    )}
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ngày sinh
                    </span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData?.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    ) : (
                      <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{formatDateVN(patientData?.dateOfBirth)}</span>
                        {calculateAge(patientData?.dateOfBirth) && (
                          <span className="text-xs font-medium text-slate-500">
                            ({calculateAge(patientData.dateOfBirth)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Số CCCD / CMND */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Số CCCD / CMND
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.cccd || ''}
                        onChange={(e) => handleInputChange('cccd', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="12 số CCCD..."
                      />
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {patientData?.cccd || 'Chưa cập nhật'}
                        </span>
                        {patientData?.cccd && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(patientData.cccd, 'Số CCCD')}
                            className="text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                            title="Sao chép CCCD"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quốc tịch */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Quốc tịch
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.nationality || ''}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Globe2 size={14} className="text-slate-400" />
                        <span>{patientData?.nationality || 'Việt Nam'}</span>
                      </p>
                    )}
                  </div>

                  {/* Quê quán - Xuống dòng và cho phép textarea khi sửa để thấy đầy đủ dữ liệu */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Quê quán / Nguyên quán
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData?.hometown || ''}
                        onChange={(e) => handleInputChange('hometown', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 resize-none leading-relaxed"
                        placeholder="Nhập tỉnh/thành quê quán hoặc địa chỉ nguyên quán..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900 leading-relaxed">
                        {patientData?.hometown || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>

                  {/* Nghề nghiệp */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nghề nghiệp / Lĩnh vực công tác
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.job || ''}
                        onChange={(e) => handleInputChange('job', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Nghề nghiệp hiện tại..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-slate-400" />
                        <span>{patientData?.job || 'Chưa cập nhật'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Phần 2: Thông tin liên lạc & Nơi cư trú */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Thông tin liên lạc & Địa chỉ cư trú
                </h4>

                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {/* Số điện thoại */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Số điện thoại di động {isEditing && <span className="text-rose-500">*</span>}
                    </span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData?.phoneNumber || formData?.phone || ''}
                        onChange={(e) => {
                          handleInputChange('phoneNumber', e.target.value);
                          handleInputChange('phone', e.target.value);
                        }}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 font-mono"
                        placeholder="Số điện thoại..."
                      />
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <Phone size={14} className="text-emerald-600" />
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {patientData?.phoneNumber || patientData?.phone || 'Chưa cập nhật'}
                        </span>
                        {(patientData?.phoneNumber || patientData?.phone) && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(patientData.phoneNumber || patientData.phone, 'Số điện thoại')}
                            className="text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                            title="Sao chép SĐT"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Địa chỉ Email
                    </span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="example@gmail.com..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{patientData?.email || 'Chưa cập nhật'}</span>
                      </p>
                    )}
                  </div>

                  {/* Địa chỉ cư trú */}
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Địa chỉ thường trú / Chỗ ở hiện tại
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData?.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 resize-none leading-relaxed"
                        placeholder="Địa chỉ cư trú..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-900 flex items-start gap-2 leading-relaxed">
                        <MapPin size={15} className="text-teal-600 shrink-0 mt-0.5" />
                        <span>{patientData?.address || 'Chưa cập nhật địa chỉ'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Phần 3: Người liên hệ khẩn cấp (Không có dữ liệu giả, chuỗi rỗng) */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Người liên hệ khẩn cấp
                </h4>

                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Họ tên người thân
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.emergencyContact?.fullName || ''}
                        onChange={(e) => handleNestedChange('emergencyContact', 'fullName', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Họ tên người thân..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {patientData?.emergencyContact?.fullName || 'Chưa cung cấp'}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Mối quan hệ
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData?.emergencyContact?.relationship || ''}
                        onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Vợ/Chồng, Bố/Mẹ..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {patientData?.emergencyContact?.relationship || 'Chưa cung cấp'}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Số điện thoại
                    </span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData?.emergencyContact?.phoneNumber || ''}
                        onChange={(e) => handleNestedChange('emergencyContact', 'phoneNumber', e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold font-mono text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Số điện thoại..."
                      />
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span className="text-sm font-semibold font-mono text-slate-900">
                          {patientData?.emergencyContact?.phoneNumber || 'Chưa cung cấp'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thanh nút Lưu & Hủy ở cuối danh sách khi sửa */}
              {isEditing && (
                <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X size={15} />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: BẢO HIỂM Y TẾ & NHA KHOA */}
          {activeTab === 'insurance' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
                    <CreditCard size={17} />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                    Thẻ bảo hiểm y tế & Bảo lãnh viện phí
                  </h3>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 whitespace-nowrap shrink-0">
                  {patientData?.patientInsurances?.length || 0} thẻ đang hoạt động
                </span>
              </div>

              {/* Danh sách thẻ bảo hiểm thật nếu có */}
              {patientData?.patientInsurances && patientData.patientInsurances.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {patientData.patientInsurances.map((ins, index) => (
                    <div
                      key={ins.id || index}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-800 p-5 text-white shadow-md border border-teal-500/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-teal-200 uppercase tracking-widest">
                          {ins.type || 'Bảo hiểm'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Đang hiệu lực
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-slate-300">Đơn vị phát hành</p>
                        <h4 className="text-sm font-black text-white">
                          {ins.providerName || 'Bảo hiểm'}
                        </h4>
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] text-teal-300 uppercase tracking-wider font-semibold">Số thẻ bảo hiểm</p>
                        <p className="text-base font-mono font-bold tracking-wider text-amber-200">
                          {ins.policyNumber || 'Chưa có số thẻ'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Mức chi trả</span>
                          <span className="font-extrabold text-emerald-400 text-xs">
                            {ins.coveragePercent ? `${ins.coveragePercent}% chi phí` : 'Theo quy định'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Hạn sử dụng</span>
                          <span className="font-semibold text-white">
                            {formatDateVN(ins.expirationDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                  <CreditCard className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Chưa liên kết thẻ bảo hiểm</p>
                  <p className="text-xs text-slate-400">
                    Hồ sơ của bạn hiện chưa có thông tin BHYT hoặc bảo hiểm tư nhân nào được đăng ký tại phòng khám.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal Xem Mã QR Hồ sơ Y tế (Quick QR Pass) */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Mã QR Tiếp Nhận Nhanh</h3>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Quét mã này tại Kiosk hoặc quầy Lễ tân Crown Dental để làm thủ tục check-in khám nhanh.
              </p>

              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-slate-50 p-3 border-2 border-dashed border-teal-500/40">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <QrCode size={120} className="text-teal-800" />
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {patientData?.patientCode || 'Chưa cấp'}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">{patientData?.fullName || 'Chưa cập nhật'}</p>
                <p className="text-xs text-slate-500">CCCD: {patientData?.cccd || 'Chưa cập nhật'}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <Printer size={15} />
                <span>In Thẻ Bệnh Nhân</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
