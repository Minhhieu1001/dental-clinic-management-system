import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {Search,Bell,Settings,LogOut,Mail,ShieldAlert,User,ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function DentistHeader({ config }) {
  const { roleLabel } = config;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    toast.success('Đã đăng xuất thành công');
    navigate('/login', { replace: true });
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'Nhân viên';
  const displayEmail = user?.email || 'employee@clinic.vn';
  const avatarUrl = user?.avatarUrl;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Left Side: Logo + Search */}
        <div className="flex items-center gap-4">
          <Link to="/employee/dashboard" className="hidden sm:flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-700">
              Dental Clinic
            </span>
            <span className="text-[15px] font-semibold text-slate-800">
              Staff Portal
            </span>
          </Link>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4">

          {/* Role Badge */}
          <div className="hidden sm:flex items-center justify-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
            {roleLabel}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notification */}
            <button className="relative rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </span>
            </button>

            {/* Settings */}
            <button className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95">
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          {/* Avatar Profile + Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-bold text-teal-700">
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
                <p className="text-sm font-semibold text-slate-700 leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Nhân viên lễ tân
                </p>
              </div>
              <ChevronDown className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 origin-top-right"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 pb-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-lg">
                        {avatarLetter}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {displayName}
                        </span>
                        <span className="truncate text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{displayEmail}</span>
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                      {/* Role Info */}
                      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600">
                        <ShieldAlert className="h-4 w-4 text-teal-500" />
                        <span className="font-medium text-slate-700">Role:</span>
                        <span className="ml-auto rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-600">
                          {user?.role || 'EMPLOYEE'}
                        </span>
                      </div>

                      {/* Xem hồ sơ cá nhân */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          toast('Chức năng đang phát triển', { icon: '🔧' });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
                      >
                        <User className="h-4 w-4" />
                        Xem hồ sơ cá nhân
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 p-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}
