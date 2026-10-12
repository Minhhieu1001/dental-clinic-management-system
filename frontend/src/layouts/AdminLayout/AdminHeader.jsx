import { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import AdminProfileModal from '../../components/ui/AdminProfileModal';
import NotificationDropdown from '../../components/common/NotificationDropdown';

export default function AdminHeader({ config }) {
  const { roleLabel } = config;
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-2 sm:px-3 lg:px-4">

        {/* Left Side: Crown Dental Branding (Text only) */}
        <div className="flex items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-900">
                CROWN<span className="text-[#005f73]">DENTAL</span> <span className="font-medium text-slate-400 text-xs tracking-normal">CLINIC SYSTEM</span>
              </span>

            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Hệ Thống Quản Lý Nha Khoa Thẩm Mỹ & Điều Trị Chuyên Nghiệp
            </span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4">

          {/* Role Badge (Hidden on mobile) */}
          <div className="hidden sm:flex items-center justify-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 shadow-sm">
            {roleLabel}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notification Dropdown */}
            <NotificationDropdown role="ADMIN" />

            {/* Settings */}
            <button className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95">
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-slate-200 sm:block"></div>

          {/* Avatar Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <img
                src="https://i.pravatar.cc/100?img=33"
                alt="Admin Avatar"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-700 leading-tight">
                  Admin
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Quản trị hệ thống
                </p>
              </div>
            </button>

            <AdminProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
            />
          </div>

        </div>
      </div>
    </header>
  );
}
