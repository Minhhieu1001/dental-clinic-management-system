import { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import AdminProfileModal from '../../components/ui/AdminProfileModal';

export default function AdminHeader({ config }) {
  const { roleLabel } = config;
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Left Side: Search (Logo removed as requested) */}
        <div className="flex w-full max-w-md items-center">
          <div className="relative w-full group">
            <input
              type="text"
              placeholder="Tìm bệnh nhân, lịch hẹn..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
            />
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-500" />
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          
          {/* Role Badge (Hidden on mobile) */}
          <div className="hidden sm:flex items-center justify-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 shadow-sm">
            {roleLabel}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notification */}
            <button className="relative rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95">
              <Bell className="h-5 w-5" />
              {/* Notification Badge */}
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </span>
            </button>

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
