import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  Award,
  Camera,
  KeyRound,
  Save,
  Clock,
  Stethoscope,
  Briefcase,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Printer,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  ZoomIn,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { changePassword } from '../../../services/auth.service';
import { getDentistAddressById, getDentistsList } from '../../../services/dentist.service';
import { getEmployeeAddressById, getEmployeesList } from '../../../services/employee.service';

export default function StaffGeneralSettingsView({ role = 'EMPLOYEE' }) {
  const { user } = useAuth();
  const isDentist = role === 'DENTIST';

  // Dữ liệu API thực tế - 1 nguồn chính duy nhất
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Thứ tự Tabs:
  // - Nhân viên: 'personal' -> 'security'
  // - Bác sĩ:    'personal' -> 'professional' (Chứng chỉ) -> 'security'
  const [activeTab, setActiveTab] = useState('personal');

  // Modal xem chi tiết chứng chỉ
  const [selectedCert, setSelectedCert] = useState(null);

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Gọi API lấy dữ liệu thật
  const fetchProfileData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (isDentist) {
        let dentistId = user?.dentistId;
        if (!dentistId) {
          const list = await getDentistsList();
          const found = list?.find(
            (d) => (user?.id && d.userId === user.id) || (user?.email && d.email === user.email)
          ) || list?.[0];
          dentistId = found?.id;
        }

        if (dentistId) {
          const res = await getDentistAddressById(dentistId);
          setProfile(res);
        } else {
          setProfile(null);
        }
      } else {
        let employeeId = user?.employeeId;
        if (!employeeId) {
          const list = await getEmployeesList();
          const found = list?.find(
            (e) => (user?.id && e.userId === user.id) || (user?.email && e.email === user.email)
          ) || list?.[0];
          employeeId = found?.id;
        }

        if (employeeId) {
          const res = await getEmployeeAddressById(employeeId);
          setProfile(res);
        } else {
          setProfile(null);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin chi tiết:', err);
      setFetchError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [role, user]);

  // Xử lý đổi mật khẩu qua API backend
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
      toast.error('Mật khẩu mới phải bao gồm cả chữ và số');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.data && Object.values(err.response.data.data)[0]) ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      toast.error(msg);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Trạng thái Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] rounded-[4px] border border-teal-100 bg-white p-12 text-center shadow-xs">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-teal-700 border-t-transparent mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Đang tải hồ sơ nhân sự Crown Dental...</p>
      </div>
    );
  }

  // Trạng thái lỗi không tải được API
  if (fetchError && !profile) {
    return (
      <div className="rounded-[4px] border border-rose-200 bg-rose-50/80 p-8 text-center space-y-3 shadow-xs">
        <AlertCircle size={32} className="mx-auto text-rose-600" />
        <h3 className="text-sm font-bold text-rose-900">Không thể kết nối hồ sơ máy chủ</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{fetchError}</p>
        <button
          type="button"
          onClick={fetchProfileData}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} /> Thử lại
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[4px] border border-slate-200 bg-white p-8 text-center text-slate-600 space-y-2 shadow-xs">
        <p className="text-sm font-bold">Không tìm thấy thông tin nhân sự trong hệ thống.</p>
        <p className="text-xs text-slate-500">Vui lòng kiểm tra lại tài khoản hoặc phân quyền chi nhánh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* ================= HEADER BAR TƯƠI SÁNG & CHUYÊN NGHIỆP ================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50/50 via-white to-transparent pb-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-teal-700 px-2.5 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider shadow-xs">
              {isDentist ? <Stethoscope size={13} /> : <Briefcase size={13} />}
              {isDentist ? 'Hồ Sơ Bác Sĩ Nha Khoa' : 'Hồ Sơ Nhân Sự Vận Hành'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Building2 size={13} className="text-teal-600" />
            <span className="font-semibold text-slate-700">
              {profile.dentalClinicName || 'Hệ thống Nha khoa Crown Dental'}
            </span>
            <span className="text-slate-300">•</span>
            <span>{profile.branchName ? `Chi nhánh: ${profile.branchName}` : 'Cơ sở chính'}</span>
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchProfileData}
            title="Làm mới dữ liệu từ máy chủ"
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-teal-200 bg-white px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13} className="text-teal-600" />
            <span className="hidden sm:inline">Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN GRID (1/3 - 2/3) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= CỘT TRÁI (1/3): PROFILE SUMMARY THIẾT KẾ ĐẸP & ĐỒNG BỘ ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-[4px] border border-teal-100 bg-white shadow-sm overflow-hidden text-center relative">
            {/* Top banner teal thanh lịch */}
            <div className="h-20 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 relative">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />
            </div>

            <div className="px-5 pb-5 pt-0 relative">
              {/* Avatar nổi bật với viền ring trắng bóng */}
              <div className="relative mx-auto h-24 w-24 -mt-12">
                <img
                  src={
                    profile.avatar ||
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={profile.name || 'Avatar'}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md mx-auto bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => toast('Tính năng cập nhật ảnh đại diện sẵn sàng kết nối API', { icon: '📸' })}
                  title="Cập nhật ảnh đại diện"
                  className="absolute bottom-0 right-0 rounded-full bg-teal-700 p-1.5 text-white hover:bg-teal-800 transition-transform shadow-md cursor-pointer ring-2 ring-white"
                >
                  <Camera size={13} />
                </button>
              </div>

              {/* Tên nhân sự */}
              <h2 className="mt-3 text-lg font-black text-slate-900 tracking-tight">{profile.name || '—'}</h2>

              {/* Mã nhân sự (Mã bác sĩ / Mã nhân viên) */}
              {(profile.dentistCode || profile.employeeCode) && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-[3px] bg-teal-50 border border-teal-300/80 px-2.5 py-0.5 text-[11px] font-mono font-bold text-teal-900 shadow-2xs">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-teal-700 tracking-wider">
                    {isDentist ? 'Mã BS:' : 'Mã NV:'}
                  </span>
                  <span>{profile.dentistCode || profile.employeeCode}</span>
                </div>
              )}

              {/* Vị trí công tác */}
              <div className="mt-2">
                <span className="inline-block rounded-[3px] bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-extrabold text-teal-800 tracking-wide uppercase">
                  {isDentist
                    ? (profile.qualification ? `Bác sĩ - ${profile.qualification}` : 'Bác sĩ Nha khoa')
                    : 'Nhân viên Tiếp đón'}
                </span>
              </div>

              {/* Trạng thái tài khoản & Role */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {profile.statusUser || 'ACTIVE'}
                </span>
                <span className="rounded-[3px] bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-800 border border-cyan-300 uppercase shadow-2xs tracking-wider">
                  {isDentist ? 'DENTIST' : (profile.role || 'EMPLOYEE')}
                </span>
              </div>

              {/* Phím tắt chuyển tab Đổi mật khẩu */}
              <div className="mt-5 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-center gap-2 rounded-[3px] border py-2.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${activeTab === 'security'
                    ? 'bg-teal-700 border-teal-700 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900'
                    }`}
                >
                  <KeyRound size={14} className={activeTab === 'security' ? 'text-white' : 'text-teal-700'} />
                  <span>Cài đặt đổi mật khẩu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chi nhánh công tác chính */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="p-1 rounded-[3px] bg-teal-50 text-teal-700">
                <Building2 size={14} />
              </span>
              Chi nhánh công tác chính
            </h3>
            <div className="bg-slate-50/70 p-3 rounded-[3px] border border-slate-100">
              <p className="text-xs font-extrabold text-slate-900">{profile.branchName || 'Chưa phân chi nhánh'}</p>
              {profile.branchAddress && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed flex items-start gap-1">
                  <MapPin size={13} className="shrink-0 text-teal-600 mt-0.5" />
                  {profile.branchAddress}
                </p>
              )}
            </div>
            {profile.createdAt && (
              <div className="rounded-[3px] bg-teal-50/50 p-2.5 border border-teal-100 text-xs flex items-center justify-between text-teal-900">
                <span className="text-slate-600 font-medium">Ngày tạo hồ sơ:</span>
                <span className="font-bold">
                  {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================= CỘT PHẢI (2/3): TABS VĂN BẢN CHUẨN ERP ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab Navigation:
              - Nhân viên: 1. Thông tin cá nhân -> 2. Cài đặt đổi mật khẩu
              - Bác sĩ:    1. Thông tin cá nhân -> 2. Chứng chỉ & Bằng cấp -> 3. Cài đặt đổi mật khẩu
          */}
          <div className="flex items-center border-b border-slate-300 bg-slate-100/80 p-1 rounded-[2px] gap-1 overflow-x-auto">
            {/* Tab 1: Thông tin cá nhân */}
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[2px] whitespace-nowrap ${activeTab === 'personal'
                ? 'bg-white text-teal-900 border border-slate-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <User size={14} />
              Thông tin cá nhân
            </button>

            {/* Tab 2 (Bác sĩ): Chứng chỉ & Bằng cấp */}
            {isDentist && (
              <button
                type="button"
                onClick={() => setActiveTab('professional')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[2px] whitespace-nowrap ${activeTab === 'professional'
                  ? 'bg-white text-teal-900 border border-slate-300 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <Award size={14} />
                Chứng chỉ & Bằng cấp ({profile.certificates?.length || 0})
              </button>
            )}

            {/* Tab Đổi mật khẩu */}
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[2px] whitespace-nowrap ${activeTab === 'security'
                ? 'bg-white text-teal-900 border border-slate-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <KeyRound size={14} />
              Cài đặt đổi mật khẩu
            </button>
          </div>

          {/* ================= NỘI DUNG TAB 1: THÔNG TIN CÁ NHÂN (VĂN BẢN ERP) ================= */}
          {activeTab === 'personal' && (
            <div className="rounded-[2px] border border-slate-300 bg-white p-5 shadow-2xs space-y-6">
              {/* Mục I: Định danh & Liên hệ */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <User size={15} className="text-teal-800" />
                    I. Thông tin định danh & Liên hệ
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Dữ liệu thực tế máy chủ</span>
                </div>

                <div className="border border-slate-200 divide-y divide-slate-200 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-3 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên</span>
                      <span className="block text-sm font-bold text-slate-900 mt-0.5">{profile.name || '—'}</span>
                    </div>
                    <div className="p-3 bg-teal-50/30">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                        {isDentist ? 'Mã bác sĩ' : 'Mã nhân viên'}
                      </span>
                      <span className="block text-xs font-mono font-extrabold text-teal-900 mt-1">
                        {(isDentist ? profile.dentistCode : profile.employeeCode) || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giới tính</span>
                      <span className="block text-xs font-bold text-slate-800 mt-1">{profile.gender || '—'}</span>
                    </div>
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày sinh</span>
                      <span className="block text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Calendar size={13} className="text-teal-700" />
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái tài khoản</span>
                      <span className="block text-xs font-bold text-emerald-700 mt-1 uppercase">
                        {profile.statusUser || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại liên hệ</span>
                      <span className="block text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Phone size={13} className="text-teal-800" />
                        {profile.phone || '—'}
                      </span>
                    </div>
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email liên hệ</span>
                      <span className="block text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <Mail size={13} className="text-teal-800" />
                        {profile.email || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Địa chỉ thường trú / Nơi ở</span>
                    <span className="block text-xs font-semibold text-slate-800 mt-1 flex items-start gap-1.5">
                      <MapPin size={13} className="shrink-0 text-slate-400 mt-0.5" />
                      {profile.address || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mục II: Vị trí công tác & Hoạt động chuyên môn */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Briefcase size={15} className="text-teal-800" />
                    II. Vị trí công tác & Vận hành chuyên môn
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Dữ liệu vận hành</span>
                </div>

                <div className="border border-slate-200 divide-y divide-slate-200 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isDentist ? 'Trình độ / Bác sĩ' : 'Chức vụ / Vị trí'}
                      </span>
                      <span className="block text-xs font-bold text-slate-900 mt-1">
                        {isDentist
                          ? (profile.qualification ? `Bác sĩ - ${profile.qualification}` : 'Bác sĩ Nha khoa')
                          : (profile.position || '—')}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isDentist ? 'Kinh nghiệm lâm sàng' : 'Vai trò hệ thống'}
                      </span>
                      <span className="block text-xs font-bold text-slate-900 mt-1">
                        {isDentist
                          ? (profile.experienceYears !== null && profile.experienceYears !== undefined
                            ? `${profile.experienceYears} năm`
                            : '—')
                          : (profile.role || '—')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chi nhánh công tác</span>
                      <span className="block text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Building2 size={13} className="text-teal-800" />
                        {profile.branchName || '—'}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khung ca làm việc</span>
                      <span className="block text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                        <Clock size={13} className="text-teal-800" />
                        {profile.shift || 'Theo phân ca phòng khám'}
                      </span>
                    </div>
                  </div>

                  {isDentist && (
                    <div className="p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Tiểu sử & Mô tả chuyên môn
                      </span>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-[2px] border border-slate-200">
                        {profile.description || 'Chưa cập nhật mô tả chuyên môn.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= NỘI DUNG TAB 2 (BÁC SĨ): CHỨNG CHỈ & BẰNG CẤP (ITEM THUMBNAIL + THÔNG TIN) ================= */}
          {isDentist && activeTab === 'professional' && (
            <div className="rounded-[2px] border border-slate-300 bg-white p-5 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Award size={15} className="text-teal-800" />
                    Chứng chỉ & Bằng cấp chuyên môn ({profile.certificates?.length || 0})
                  </h3>
                </div>
              </div>

              {/* Danh sách items chứng chỉ: Bên trái ảnh view, bên phải thông tin, click xem chi tiết */}
              <div className="space-y-3">
                {profile.certificates && profile.certificates.length > 0 ? (
                  profile.certificates.map((cert, index) => (
                    <div
                      key={cert.id || index}
                      onClick={() => setSelectedCert(cert)}
                      className="group flex flex-col sm:flex-row rounded-[2px] border border-slate-300 bg-white hover:border-teal-700 hover:shadow-xs transition-all cursor-pointer overflow-hidden"
                    >
                      {/* BÊN TRÁI: VIEW ẢNH CHỨNG CHỈ */}
                      <div className="w-full sm:w-44 h-32 sm:h-auto shrink-0 bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-200 relative flex items-center justify-center overflow-hidden">
                        {cert.certificateFileUrl ? (
                          <>
                            <img
                              src={cert.certificateFileUrl}
                              alt={cert.certificateName || 'Chứng chỉ'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] bg-white/90 text-slate-900 text-[10px] font-bold shadow-xs">
                                <ZoomIn size={12} /> Xem ảnh
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-slate-400 text-center">
                            <FileText size={28} className="mb-1 text-slate-400 group-hover:text-teal-700 transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Bản scan chứng chỉ
                            </span>
                          </div>
                        )}
                      </div>

                      {/* BÊN PHẢI: VIEW THÔNG TIN CHỨNG CHỈ */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                              {cert.certificateName || '—'}
                            </h4>
                            <span className="inline-block rounded-[2px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                              {cert.certificateType || 'Chuyên môn'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">Số hiệu chứng chỉ:</span>
                              <span className="block font-mono font-bold text-slate-800">
                                {cert.certificateNumber || '—'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">Cơ quan / Nơi cấp:</span>
                              <span className="block font-semibold text-slate-800">
                                {cert.issuedBy || '—'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">Ngày cấp:</span>
                              <span className="block text-slate-700">
                                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('vi-VN') : '—'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400">Hạn sử dụng:</span>
                              <span className="block text-slate-700">
                                {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Đã xác thực
                          </span>
                          <span className="font-bold text-teal-800 group-hover:underline flex items-center gap-1">
                            Click xem chi tiết &gt;
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[2px] border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-slate-500">
                    <FileCheck2 size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Chưa có chứng chỉ hoặc bằng cấp nào được ghi nhận</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bác sĩ có thể tải lên chứng chỉ đào tạo liên tục hoặc liên hệ phòng nhân sự để thẩm định.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= NỘI DUNG TAB: ĐỔI MẬT KHẨU (ĐỨNG SAU CÙNG) ================= */}
          {activeTab === 'security' && (
            <div className="rounded-[2px] border border-slate-300 bg-white p-5 shadow-2xs space-y-5">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <KeyRound size={15} className="text-teal-800" />
                  Cài đặt bảo mật & Đổi mật khẩu tài khoản
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Thay đổi mật khẩu xác thực người dùng trên hệ thống ERP Crown Dental.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mật khẩu hiện tại <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đang sử dụng"
                      className="w-full rounded-[2px] border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-800 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mật khẩu mới <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự (chữ và số)"
                      className="w-full rounded-[2px] border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-800 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Xác nhận lại mật khẩu mới <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại chính xác mật khẩu mới"
                      className="w-full rounded-[2px] border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-800 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-[2px] border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-teal-800" />
                    Quy chuẩn an toàn mật khẩu ERP:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                    <li>Độ dài tối thiểu từ 8 ký tự trở lên.</li>
                    <li>Nên bao gồm ít nhất 1 chữ in hoa và 1 chữ số.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="inline-flex items-center gap-1.5 rounded-[2px] bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-900 cursor-pointer disabled:opacity-70"
                  >
                    <Save size={14} />
                    <span>{isChangingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL XEM CHI TIẾT ĐẦY ĐỦ THÔNG TIN CHỨNG CHỈ ================= */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
          <div className="w-full max-w-2xl rounded-[4px] bg-white border border-teal-200 shadow-2xl overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50 to-white px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-teal-100 text-teal-800">
                  <Award size={18} />
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Chi tiết chứng chỉ / Văn bằng y khoa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Xem ảnh lớn */}
              {selectedCert.certificateFileUrl ? (
                <div className="rounded-[3px] border border-slate-200 bg-slate-50 p-2.5 text-center">
                  <img
                    src={selectedCert.certificateFileUrl}
                    alt={selectedCert.certificateName || 'Ảnh chứng chỉ'}
                    className="max-h-72 w-auto mx-auto rounded-[2px] object-contain shadow-xs border border-slate-200 bg-white"
                  />
                  <div className="mt-2.5 flex justify-end">
                    <a
                      href={selectedCert.certificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 hover:underline"
                    >
                      <ExternalLink size={13} /> Mở ảnh gốc trong tab mới
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-[3px] border border-dashed border-teal-200 bg-teal-50/30 p-8 text-center text-slate-400">
                  <FileText size={36} className="mx-auto mb-1.5 text-teal-600/60" />
                  <p className="text-xs font-bold text-slate-700">Chưa có tệp scan hình ảnh đính kèm cho chứng chỉ này</p>
                </div>
              )}

              {/* Bảng thông tin chi tiết */}
              <div className="border border-slate-200 rounded-[3px] overflow-hidden divide-y divide-slate-200">
                <div className="p-3.5 bg-gradient-to-r from-teal-50/60 to-white">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Tên chứng chỉ / Văn bằng:</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{selectedCert.certificateName || '—'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <div className="p-3.5 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Số hiệu chứng chỉ:</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedCert.certificateNumber || '—'}</p>
                  </div>
                  <div className="p-3.5 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Phân loại chứng chỉ:</span>
                    <p className="font-extrabold text-teal-900 mt-0.5">{selectedCert.certificateType || 'Chuyên môn y khoa'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Cơ quan / Đơn vị cấp bằng:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedCert.issuedBy || '—'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <div className="p-3.5 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Ngày cấp hiệu lực:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedCert.issueDate ? new Date(selectedCert.issueDate).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-white">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Ngày hết hạn:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedCert.expiryDate ? new Date(selectedCert.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="rounded-[3px] border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
