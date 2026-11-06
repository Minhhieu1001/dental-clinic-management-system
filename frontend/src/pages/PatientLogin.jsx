import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import bgImage from '../assets/images/dental-light-bg.png';
import { useAuth } from '../hooks/useAuth';

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

const formItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PatientLogin() {
  const navigate = useNavigate();
  const { patientLogin, isAuthenticated, user } = useAuth();

  const [patientCode, setPatientCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu đã đăng nhập thành công với role PATIENT -> điều hướng đến dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'PATIENT') {
      navigate('/patient/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!patientCode.trim()) {
      setError('Vui lòng nhập Mã bệnh nhân');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập Số điện thoại');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập Mật khẩu');
      return;
    }
    setIsLoading(true);

    try {
      localStorage.setItem('patient_phone', phone.trim());
      localStorage.setItem('patient_code', patientCode.trim());
      await patientLogin({
        patientCode: patientCode.trim(),
        phone: phone.trim(),
        password,
      });

      toast.success('Đăng nhập thành công! Chào mừng quý khách.', { id: 'patient-login-toast' });
      navigate('/patient/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin hồ sơ.';
      setError(msg);
      toast.error(msg, { id: 'patient-login-toast' });
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
              Cổng Bệnh Nhân
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/staff/login"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white shadow-sm transition-all border border-slate-200/80 hover:shadow"
          >
            Đăng nhập Nội bộ →
          </Link>
        </div>
      </motion.header>

      {/* Main Content - Chiều ngang mở rộng, 2 cột (Left: Brand/Content, Right: Form) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-3">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[1050px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[2.2rem] shadow-[0_20px_50px_-15px_rgba(13,148,136,0.14),0_0_25px_rgba(255,255,255,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* CỘT TRÁI: THÔNG TIN CỔNG BỆNH NHÂN */}
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
                CỔNG THÔNG TIN BỆNH NHÂN
              </motion.div>

              <motion.h2 variants={leftItemVariants} className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight mb-3">
                Đồng hành cùng nụ cười rạng rỡ của bạn
              </motion.h2>
              <motion.p variants={leftItemVariants} className="text-teal-100/90 text-xs sm:text-sm font-normal leading-relaxed mb-6">
                Đăng nhập để theo dõi hồ sơ y tế, tiến trình niềng răng, implant và nhận nhắc lịch tái khám từ bác sĩ.
              </motion.p>

              {/* Quick Perks */}
              <motion.div variants={leftItemVariants} className="space-y-3">
                {[
                  {
                    title: 'Tra cứu hồ sơ & phim X-quang',
                    desc: 'Dữ liệu chuẩn đoán nha khoa trực tuyến mọi lúc mọi nơi',
                  },
                  {
                    title: 'Lịch hẹn & Tái khám định kỳ',
                    desc: 'Nhận thông báo tự động, chủ động đổi lịch hẹn linh hoạt',
                  },
                  {
                    title: 'Đơn thuốc & Hướng dẫn sau điều trị',
                    desc: 'Lời dặn dò chi tiết từ bác sĩ điều trị trực tiếp',
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
                <p className="text-xs text-white/90 font-bold">Cần hỗ trợ tra cứu?</p>
                <p className="text-[11px] text-teal-100/80">Hotline phòng khám 24/7</p>
              </div>
              <span className="text-sm font-black text-emerald-300">1900 8059</span>
            </motion.div>
          </motion.div>

          {/* CỘT PHẢI: FORM ĐĂNG NHẬP 3 TRƯỜNG */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center"
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-600 mb-2.5 border border-teal-100 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Đăng nhập Bệnh nhân
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Nhập thông tin hồ sơ của bạn để tiếp tục
              </p>
            </div>

            {/* Error Message */}
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
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Field 1: Mã bệnh nhân */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã bệnh nhân <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="13" y2="12" />
                      <circle cx="16" cy="14" r="1.5" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={patientCode}
                    onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                    placeholder="VD: BN001248"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all uppercase duration-200"
                  />
                </div>
              </div>

              {/* Field 2: Số điện thoại */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="VD: 0912 345 678"
                    maxLength={11}
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Field 3: Mật khẩu */}
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
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Tính năng quên mật khẩu qua OTP sắp ra mắt!', { icon: 'ℹ️' });
                  }}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
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
                      Đăng nhập Cổng Bệnh Nhân
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Quick Switch to Register & Activate Existing */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-1.5">
              <p className="text-xs text-slate-600">
                Chưa có tài khoản bệnh nhân?{' '}
                <Link
                  to="/patient/register"
                  className="font-bold text-teal-600 hover:text-teal-700 hover:underline ml-1"
                >
                  Đăng ký mới
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Đã có hồ sơ tại phòng khám?{' '}
                <Link
                  to="/patient/activate"
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-1"
                >
                  Kích hoạt tài khoản có sẵn
                </Link>
              </p>
            </div>

          </motion.div>
        </motion.div>
      </main>

      {/* Footer Support */}
      <footer className="relative z-10 py-3 text-center text-xs text-slate-400">
        Cổng thông tin Bệnh nhân Crown Dental • Hotline 24/7:{' '}
        <a href="tel:19008059" className="font-bold text-teal-600 hover:underline">
          1900 8059
        </a>
      </footer>
    </div>
  );
}
