import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  Receipt,
  Newspaper,
  Bell,
  LogOut,
  Mail,
  User,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Home,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import NotificationDropdown from '../../components/common/NotificationDropdown';

const navItems = [
  { label: 'Tổng quan', to: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Lịch hẹn', to: '/patient/appointments', icon: Calendar },
  { label: 'Hồ sơ bệnh án', to: '/patient/medical-records', icon: FileText },
  { label: 'Đơn thuốc', to: '/patient/prescriptions', icon: Pill },
  { label: 'Hóa đơn', to: '/patient/invoices', icon: Receipt },
  { label: 'Thông báo', to: '/patient/notifications', icon: Bell },
];

export default function PatientHeader({ config }) {
  const { roleLabel } = config || {};
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      toast.success('Đã đăng xuất thành công');
      navigate('/patient/login', { replace: true });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const displayName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Bệnh nhân';
  const displayEmail = user?.email || (user?.phone ? `SĐT: ${user.phone}` : 'patient@clinic.vn');
  const avatarUrl = user?.avatarUrl;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white shadow-lg shadow-teal-950/15 backdrop-blur-md border-b border-teal-500/30">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-4">

          {/* Left Side: Logo Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/patient/dashboard" className="flex items-center gap-3 select-none group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-teal-900/30 ring-2 ring-white/30 transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="Crown Dental Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest">NHA KHOA</p>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-none my-0.5 group-hover:text-emerald-100 transition-colors">
                  CROWN Dental
                </h1>
                <p className="text-[9px] text-teal-200/90 uppercase tracking-wider font-semibold">CỔNG BỆNH NHÂN</p>
              </div>
            </Link>
          </div>

          {/* Right Side: Horizontal Navigation Menu (adjacent to bell) + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Horizontal Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1.5 mr-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${isActive
                      ? 'bg-white shadow-sm shadow-black/10 ring-1 ring-white/60'
                      : 'text-teal-50 hover:bg-white/15 hover:text-white'
                      }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#0f766e]' : 'text-teal-200'}`} />
                    <span className={isActive ? 'text-[#0f766e] font-bold' : 'text-teal-50'}>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Notification Dropdown with light styling */}
            <NotificationDropdown
              role="PATIENT"
              buttonClassName="relative rounded-full p-2 text-teal-100 transition-all hover:bg-white/15 hover:text-white active:scale-95 cursor-pointer ring-1 ring-white/20"
            />

            {/* Divider */}
            <div className="hidden h-7 w-px bg-white/20 lg:block" />

            {/* Avatar Profile + Dropdown */}
            <div className="relative hidden lg:block" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 rounded-full p-1 sm:pr-3 transition-all border border-white/20 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
              >
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-teal-700 font-bold text-sm shadow-inner ring-1 ring-white/50">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate max-w-[120px]">
                    {displayName}
                  </p>
                  <p className="text-[11px] font-medium text-teal-200">
                    Bệnh nhân
                  </p>
                </div>
                <ChevronDown className={`hidden sm:block h-4 w-4 text-teal-200 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-2 text-slate-800 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] z-50 origin-top-right ring-1 ring-slate-900/5"
                    >
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/50 p-3 border border-teal-100/60">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-lg shadow-sm">
                          {avatarLetter}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate text-sm font-bold text-slate-800">
                            {displayName}
                          </span>
                          <span className="truncate text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{displayEmail}</span>
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full w-fit">
                            <ShieldCheck className="h-3 w-3" />
                            Bệnh nhân Crown Dental
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Menu Links */}
                      <div className="mt-2 space-y-0.5 border-b border-slate-100 pb-2">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/patient/profile');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Thông tin tài khoản
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/patient/appointments');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <Calendar className="h-4 w-4 text-slate-400" />
                          Lịch hẹn của tôi
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/patient/medical-records');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <FileText className="h-4 w-4 text-slate-400" />
                          Hồ sơ bệnh án
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/patient/prescriptions');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <Pill className="h-4 w-4 text-slate-400" />
                          Đơn thuốc cá nhân
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/patient/invoices');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <Receipt className="h-4 w-4 text-slate-400" />
                          Hóa đơn thanh toán
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                        >
                          <Home className="h-4 w-4 text-slate-400" />
                          Trang chủ phòng khám
                        </button>
                      </div>

                      {/* Logout Button */}
                      <div className="pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất tài khoản
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden rounded-xl p-2 text-teal-100 hover:bg-white/15 hover:text-white transition-all ring-1 ring-white/20"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile / Tablet Side Drawer (Slide in from Right using Portal) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-[9999] lg:hidden">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                />

                {/* Slide-over Panel from Right (Full screen height, 100% Solid Opaque) */}
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 h-screen w-[280px] sm:w-[320px] bg-[#0d5c4d] text-white shadow-2xl flex flex-col z-10 border-l border-emerald-600/40"
                  style={{ backgroundColor: '#0d5c4d' }}
                >
                  {/* User Profile Info (Click outside to close) */}
                  <div className="p-4 border-b border-white/10 bg-[#0a4d40]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0d5c4d] font-bold text-base shadow-sm ring-2 ring-white/30">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          avatarLetter
                        )}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-xs text-emerald-200 truncate mt-0.5">{displayEmail}</p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="h-3 w-3" />
                          Bệnh nhân Crown Dental
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links list */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                      Danh mục chính
                    </p>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname.startsWith(item.to);

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                            ? 'bg-white shadow-md text-[#0d5c4d] font-bold'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#0d5c4d]' : 'text-emerald-200'}`} />
                          <span className={isActive ? 'text-[#0d5c4d] font-bold' : 'text-white'}>{item.label}</span>
                        </NavLink>
                      );
                    })}

                    <div className="pt-3 border-t border-white/10 mt-3 space-y-1">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                        Tài khoản & Tiện ích
                      </p>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/patient/profile');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <User className="h-4.5 w-4.5 text-emerald-200" />
                        <span>Thông tin tài khoản</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Home className="h-4.5 w-4.5 text-emerald-200" />
                        <span>Trang chủ phòng khám</span>
                      </button>
                    </div>
                  </div>

                  {/* Drawer Footer with Logout & Hotline */}
                  <div className="border-t border-white/10 p-4 bg-[#08382e] space-y-2.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600/30 border border-rose-400/40 px-3 py-2.5 text-xs font-bold text-rose-100 transition-colors hover:bg-rose-600 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất tài khoản
                    </button>
                    <div className="text-center text-xs text-emerald-200">
                      Hotline hỗ trợ: <span className="font-bold text-white">1900 1234</span>
                    </div>
                  </div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
}
