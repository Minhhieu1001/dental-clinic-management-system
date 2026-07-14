import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    toast.success('Đã đăng xuất thành công');
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop to close modal when clicking outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 origin-top-right"
          >
            {/* User Info */}
            <div className="flex items-center gap-3 border-b border-slate-100 p-3 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold text-lg">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-slate-800">
                  Admin User
                </span>
                <span className="truncate text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{user?.email || 'admin@example.com'}</span>
                </span>
              </div>
            </div>

            {/* Role Info */}
            <div className="p-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600">
                <ShieldAlert className="h-4 w-4 text-sky-500" />
                <span className="font-medium text-slate-700">Role:</span> 
                <span className="ml-auto rounded-md bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-600">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}