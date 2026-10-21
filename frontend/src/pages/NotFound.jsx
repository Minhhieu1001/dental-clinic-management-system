import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  ArrowLeft,
  Calendar,
  Sparkles,
  PhoneCall,
  Search,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function NotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    document.title = '404 - Không tìm thấy trang | CROWN Dental';
  }, []);

  // Điều hướng thông minh: Nếu đã đăng nhập thì về Dashboard theo Role, nếu chưa thì về Trang chủ
  const getHomeLink = () => {
    if (!isAuthenticated || !user) return { path: '/', label: 'Về Trang Chủ' };
    switch (user.role) {
      case 'ADMIN':
        return { path: '/admin/dashboard', label: 'Về Bàn Quản Trị' };
      case 'DENTIST':
        return { path: '/dentist/dashboard', label: 'Về Trang Bác Sĩ' };
      case 'EMPLOYEE':
        return { path: '/employee/dashboard', label: 'Về Trang Nhân Viên' };
      case 'PATIENT':
        return { path: '/patient/dashboard', label: 'Về Hồ Sơ Của Tôi' };
      default:
        return { path: '/', label: 'Về Trang Chủ' };
    }
  };

  const homeTarget = getHomeLink();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/40 to-slate-100 flex flex-col justify-between overflow-hidden text-slate-800">
      {/* Background decorative glowing orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />

      {/* Header bar */}
      <header className="relative z-10 w-full border-b border-slate-200/70 bg-white/70 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3 select-none group">
            <img
              src="/logo.png"
              alt="CROWN Dental Logo"
              className="h-10 w-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback nếu ảnh không tải được
                e.target.style.display = 'none';
              }}
            />
            <div className="leading-tight">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Nha Khoa</span>
              <p className="text-lg font-black tracking-tight text-[#1f4fb2]">CROWN Dental</p>
            </div>
          </Link>

          <a
            href="tel:19006868"
            className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition shadow-2xs"
          >
            <PhoneCall className="h-3.5 w-3.5 text-sky-600" />
            <span>Hotline 24/7: <strong className="text-sky-900">1900 6868</strong></span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-center"
        >
          {/* Animated Dental Tooth & Badge */}
          <div className="relative mx-auto mb-6 flex h-36 w-36 items-center justify-center">
            {/* Pulsing ring background */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.7, 0.35] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-500 blur-xl opacity-50"
            />

            {/* Glass circle container */}
            <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-white/80 bg-white/80 shadow-xl backdrop-blur-md">
              {/* Dental Tooth SVG Icon with interactive motion */}
              <motion.div
                animate={{ rotate: [-2, 2, -2], y: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="relative text-cyan-600"
              >
                <svg
                  className="h-16 w-16 drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Tooth geometry */}
                  <path d="M12 2C8 2 5 4.5 5 8c0 4 2 8 3 13 0.6 2.5 3 2.5 4 0 1-2.5 1-2.5 2 0 1 2.5 3.4 2.5 4 0 1-5 3-9 3-13 0-3.5-3-6-7-6z" />
                  <path d="M9 7c1 0.5 2 0.8 3 0.8s2-0.3 3-0.8" strokeWidth="1.5" strokeOpacity="0.7" />
                </svg>

                {/* Floating sparkles */}
                <motion.div
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                  className="absolute -top-2 -right-2 text-amber-400"
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>

                {/* Search glass overlay */}
                <div className="absolute -bottom-1 -left-2 rounded-full bg-white p-1 shadow-md border border-slate-100 text-blue-600">
                  <Search className="h-4 w-4" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* 404 Large Gradient Number */}
          <div className="relative inline-block select-none">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent drop-shadow-2xs">
              404
            </h1>
          </div>

          {/* Headline & Description */}
          <div className="mx-auto mt-4 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Oops! Trang này không tồn tại
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Đường dẫn bạn vừa truy cập có thể đã hết hạn, bị đổi tên hoặc không tồn tại trên hệ thống của{' '}
              <strong className="text-slate-800">CROWN Dental</strong>. Đừng lo lắng, nụ cười của bạn vẫn luôn được bảo vệ!
            </p>
          </div>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={homeTarget.path}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4fb2] to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Home className="h-4 w-4" />
              <span>{homeTarget.label}</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all active:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại trang trước</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} CROWN Dental Clinic Management System. Bảo vệ nụ cười Việt.</p>
      </footer>
    </div>
  );
}
