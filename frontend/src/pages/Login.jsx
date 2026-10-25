import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import bgImage from '../assets/images/dental-light-bg.png';

const ROLE_REDIRECT_MAP = {
  ADMIN: '/admin/dashboard',
  DENTIST: '/dentist/dashboard',
  EMPLOYEE: '/employee/dashboard',
  PATIENT: '/patient/dashboard',
};

// Motion Variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const leftContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const leftItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!authLoading && isAuthenticated && user) {
    const redirectTo = location.state?.from?.pathname || ROLE_REDIRECT_MAP[user.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });

      // Get fresh user state after login
      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        toast.success('Đăng nhập thành công!');
        const from = location.state?.from?.pathname;
        const redirectTo = from || ROLE_REDIRECT_MAP[currentUser.role] || '/';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex flex-col justify-between selection:bg-teal-200 selection:text-teal-900">
      {/* Background Image with Medical Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bgImage}
          alt="Dental Clinic Background"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-100/50 via-white/80 to-teal-50/90" />
      </div>

      {/* Top Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Crown Dental Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <div className="leading-tight">
            <span className="text-slate-900 text-base font-black tracking-tight block">
              Crown Dental
            </span>
            <span className="text-teal-600 text-[10px] font-bold uppercase tracking-wider">
              Hệ Thống Nội Bộ
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/patient/login"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white shadow-sm transition-all border border-slate-200/80 hover:shadow"
          >
            ← Cổng Bệnh Nhân
          </Link>
        </div>
      </motion.header>

      {/* Main Content - Cùng 1 form/card thống nhất (Left: Brand/Content, Right: Form) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[1050px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[2.2rem] shadow-[0_20px_50px_-15px_rgba(13,148,136,0.14),0_0_25px_rgba(255,255,255,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* CỘT TRÁI: NỘI DUNG GIỚI THIỆU HỆ THỐNG */}
          <motion.div
            variants={leftContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
            <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <motion.div variants={leftItemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-teal-100 text-[11px] font-semibold mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                HỆ THỐNG QUẢN LÝ NỘI BỘ
              </motion.div>

              <motion.h2 variants={leftItemVariants} className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight mb-3">
                Crown Dental Clinic System
              </motion.h2>
              <motion.p variants={leftItemVariants} className="text-teal-100/90 text-xs sm:text-sm font-normal leading-relaxed mb-6">
                Nền tảng điều hành dành cho Bác sĩ, Nhân viên y tế, Lễ tân và Quản trị viên phòng khám.
              </motion.p>

              {/* Danh sách tính năng */}
              <motion.div variants={leftItemVariants} className="space-y-3">
                {[
                  {
                    title: 'Quản lý lịch hẹn & tiếp đón',
                    desc: 'Tối ưu điều phối ghế điều trị, theo dõi hàng chờ thời gian thực',
                  },
                  {
                    title: 'Hồ sơ bệnh án điện tử (EMR)',
                    desc: 'Lưu trữ phác đồ, phim X-quang, chẩn đoán và kê toa an toàn',
                  },
                  {
                    title: 'Báo cáo doanh thu & vận hành',
                    desc: 'Dữ liệu trực quan, theo dõi vật tư và hiệu suất làm việc',
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="flex items-start gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/10 transition-colors cursor-default"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                      <p className="text-[11px] text-teal-100/80 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={leftItemVariants} className="mt-8 pt-5 border-t border-white/15 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/90 font-bold">Hỗ trợ kỹ thuật nội bộ</p>
                <p className="text-[11px] text-teal-100/80">Bộ phận CNTT / IT Support</p>
              </div>
              <span className="text-sm font-black text-emerald-300">1900 8059</span>
            </motion.div>
          </motion.div>

          {/* CỘT PHẢI: FORM ĐĂNG NHẬP NỘI BỘ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center"
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-600 mb-2.5 border border-teal-100 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Đăng nhập Nội bộ
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Nhập thông tin tài khoản được cấp để truy cập hệ thống
              </p>
            </div>

            {/* Thông báo lỗi */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email nhân viên <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <polyline points="3 7 12 13 21 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: bacsi@crowndental.vn"
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Field Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Nút Đăng nhập */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] hover:shadow-[0_8px_22px_rgba(13,148,136,0.35)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      Đăng nhập Hệ thống
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Liên kết Cổng bệnh nhân & Hỗ trợ */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1.5">
              <p className="text-xs text-slate-600">
                Bạn là bệnh nhân khám nha khoa?{' '}
                <Link
                  to="/patient/login"
                  className="font-bold text-teal-600 hover:text-teal-700 hover:underline ml-1"
                >
                  Cổng Bệnh Nhân
                </Link>
              </p>
              <p className="text-[11px] text-slate-400">
                Cần cấp tài khoản nhân viên mới? Vui lòng liên hệ Quản trị viên hệ thống.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Support */}
      <footer className="relative z-10 py-3 text-center text-xs text-slate-400">
        Crown Dental Clinic Management System • Hotline Kỹ thuật:{' '}
        <a href="tel:19008059" className="font-bold text-teal-600 hover:underline">
          1900 8059
        </a>
      </footer>
    </div>
  );
}

