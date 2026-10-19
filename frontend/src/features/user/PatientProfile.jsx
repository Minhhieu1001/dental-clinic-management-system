import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Save,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/auth.service';

export default function PatientProfile() {
  const { user } = useAuth();

  // State đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <UserCheck size={22} className="text-teal-700" />
          <span>Hồ Sơ Tài Khoản & Bảo Mật</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin tài khoản người dùng và thiết lập mật khẩu đăng nhập cổng bệnh nhân.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin tài khoản bệnh nhân */}
        <div className="space-y-4">
          <div className="rounded-[2px] border border-slate-300 bg-white p-5 shadow-2xs">
            {/* Header hồ sơ */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200">
              <div className="relative mb-3">
                <div className="h-20 w-20 rounded-full border-2 border-teal-600 bg-teal-50 flex items-center justify-center text-teal-800 font-extrabold text-2xl overflow-hidden shadow-2xs">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.username || 'Patient'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{(user?.username || 'BN').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 right-1 rounded-full bg-emerald-500 p-1 border-2 border-white" />
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {user?.username || 'Bệnh nhân'}
              </h2>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </span>
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-teal-800 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  PATIENT
                </span>
              </div>
            </div>

            {/* Chi tiết liên hệ */}
            <div className="pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-teal-700 shrink-0" />
                <span className="truncate">{user?.email || 'Chưa cập nhật email'}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-teal-700 shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span>Vai trò: Khách hàng / Bệnh nhân phòng khám</span>
              </div>
            </div>
          </div>

          {/* Hướng dẫn an toàn */}
          <div className="rounded-[2px] border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={15} className="text-amber-700" />
              <span>Khuyến nghị bảo mật:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Không chia sẻ mật khẩu của bạn với bất kỳ ai để bảo vệ thông tin hồ sơ sức khỏe và lịch sử điều trị cá nhân.
            </p>
          </div>
        </div>

        {/* Cột phải: Form đổi mật khẩu */}
        <div className="lg:col-span-2">
          <div className="rounded-[2px] border border-slate-300 bg-white p-5 shadow-2xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <KeyRound size={16} className="text-teal-800" />
                Đổi mật khẩu đăng nhập
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập mật khẩu hiện tại và thiết lập mật khẩu mới cho tài khoản bệnh nhân của bạn.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              {/* Mật khẩu hiện tại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu hiện tại <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu bạn đang dùng"
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

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

              {/* Tiêu chí an toàn */}
              <div className="rounded-[2px] border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-teal-800" />
                  Quy định mật khẩu:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500 text-[11px]">
                  <li>Tối thiểu từ 8 ký tự trở lên.</li>
                  <li>Phải chứa cả chữ cái và chữ số.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="inline-flex items-center gap-1.5 rounded-[2px] bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-900 cursor-pointer disabled:opacity-70 transition-colors"
                >
                  <Save size={14} />
                  <span>{isChangingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
