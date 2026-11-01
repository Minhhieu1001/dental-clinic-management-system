import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Clock,
  UserCheck,
  Stethoscope,
  AlertTriangle,
  CreditCard,
  Calendar,
  ArrowRight,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notification.service';

const getNotifStyle = (type, isRead) => {
  if (isRead) {
    return {
      borderClass: 'border-l-2 border-l-transparent bg-white hover:bg-slate-50/90',
      iconBg: 'bg-slate-100 text-slate-500',
      titleClass: 'font-bold text-slate-700',
    };
  }

  switch (type) {
    case 'PATIENT_CHECKIN':
      return {
        borderClass: 'border-l-4 border-l-teal-600 bg-teal-50/70 hover:bg-teal-100/60 shadow-xs',
        iconBg: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300/50',
        titleClass: 'font-extrabold text-teal-950',
      };
    case 'STATUS_CHANGE':
      return {
        borderClass: 'border-l-4 border-l-purple-600 bg-purple-50/70 hover:bg-purple-100/60 shadow-xs',
        iconBg: 'bg-purple-100 text-purple-800 ring-1 ring-purple-300/50',
        titleClass: 'font-extrabold text-purple-950',
      };
    case 'AI_XRAY':
      return {
        borderClass: 'border-l-4 border-l-sky-600 bg-sky-50/70 hover:bg-sky-100/60 shadow-xs',
        iconBg: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300/50',
        titleClass: 'font-extrabold text-sky-950',
      };
    case 'FOLLOW_UP':
    case 'PAYMENT_SUCCESS':
      return {
        borderClass: 'border-l-4 border-l-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/60 shadow-xs',
        iconBg: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/50',
        titleClass: 'font-extrabold text-emerald-950',
      };
    case 'INVENTORY_ALERT':
      return {
        borderClass: 'border-l-4 border-l-rose-600 bg-rose-50/70 hover:bg-rose-100/60 shadow-xs',
        iconBg: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/50',
        titleClass: 'font-extrabold text-rose-950',
      };
    default:
      return {
        borderClass: 'border-l-4 border-l-teal-600 bg-teal-50/50 hover:bg-teal-100/50 shadow-xs',
        iconBg: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300/50',
        titleClass: 'font-extrabold text-slate-900',
      };
  }
};

const getNotifIcon = (type) => {
  switch (type) {
    case 'PATIENT_CHECKIN':
      return <UserCheck className="h-4 w-4" />;
    case 'STATUS_CHANGE':
      return <Stethoscope className="h-4 w-4" />;
    case 'AI_XRAY':
      return <Sparkles className="h-4 w-4" />;
    case 'FOLLOW_UP':
      return <Calendar className="h-4 w-4" />;
    case 'PAYMENT_SUCCESS':
      return <CreditCard className="h-4 w-4" />;
    case 'INVENTORY_ALERT':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Vừa xong';
    const diffMs = new Date().getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  } catch (e) {
    return 'Vừa xong';
  }
};

export default function NotificationDropdown({ role = 'DENTIST', buttonClassName }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Fetch real notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const data = await getNotificationsByUser(user.id);
    if (Array.isArray(data)) {
      setNotifications(data);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();

    const handleUpdated = () => {
      fetchNotifications();
    };
    window.addEventListener('notification_updated', handleUpdated);
    return () => window.removeEventListener('notification_updated', handleUpdated);
  }, [fetchNotifications]);

  // Realtime notification handler with Toast popup
  const handleRealtimeNotification = useCallback((newNotif) => {
    if (!newNotif) return;

    // Strict User ID matching: only accept notifications intended for this user
    if (newNotif.userId && user?.id && String(newNotif.userId) !== String(user.id)) {
      return;
    }

    // High Impact Toast Popup with Accent Left Border
    toast(
      (t) => (
        <div
          className="flex flex-col gap-1 cursor-pointer pr-2"
          onClick={() => {
            toast.dismiss(t.id);
            if (newNotif.targetUrl) navigate(newNotif.targetUrl);
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
            <p className="font-extrabold text-xs text-slate-900 tracking-tight">{newNotif.title || 'Thông báo mới'}</p>
          </div>
          <p className="text-[12px] font-medium text-slate-600 leading-snug">{newNotif.content}</p>
        </div>
      ),
      {
        duration: 5000,
        style: {
          borderRadius: '10px',
          background: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 12px 30px -8px rgba(0,0,0,0.18)',
          borderLeft: '5px solid #0D9488',
          borderTop: '1px solid #E2E8F0',
          borderRight: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 14px',
        },
      }
    );

    // Prepend to notification list without duplicates
    setNotifications((prev) => {
      if (prev.some((item) => item.id === newNotif.id)) {
        return prev;
      }
      return [{ ...newNotif, isRead: false }, ...prev];
    });
  }, [user?.id, navigate]);

  // Connect WebSocket STOMP
  useWebSocket(null, handleRealtimeNotification);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (user?.id) {
      await markAllNotificationsAsRead(user.id);
    }
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  const handleItemClick = async (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    if (item.id && typeof item.id === 'string' && !item.id.startsWith('mock-')) {
      await markNotificationAsRead(item.id);
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Number Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || "relative rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 cursor-pointer"}
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />

        {/* Static Number Badge */}
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {/* Popover Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl z-50 origin-top-right overflow-hidden"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Thông báo hệ thống</h3>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 border border-rose-200">
                    {unreadCount} mới
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                    Đã đọc hết
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-xs font-medium text-slate-400">
                  Hiện chưa có thông báo mới nào.
                </div>
              ) : (
                notifications.map((item) => {
                  const style = getNotifStyle(item.type, item.isRead);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex items-start gap-3.5 p-3.5 transition-all cursor-pointer ${style.borderClass}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs mt-0.5 ${style.iconBg}`}>
                        {getNotifIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${style.titleClass}`}>
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed font-medium">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="h-3 w-3" />
                            {item.createdAt ? formatTimeAgo(item.createdAt) : item.time || 'Vừa xong'}
                          </span>

                          <span className="text-teal-700 font-extrabold hover:underline flex items-center gap-0.5">
                            Chi tiết <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-2 text-center">
              <button
                type="button"
                onClick={() => {
                  fetchNotifications();
                  toast.success('Đã cập nhật danh sách thông báo!');
                }}
                className="text-[11px] font-extrabold text-slate-600 hover:text-teal-800 transition-colors"
              >
                Làm mới danh sách
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
