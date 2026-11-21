import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  CreditCard,
  Stethoscope,
  Sparkles,
  Inbox,
  RefreshCw,
  ChevronRight,
  Filter,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
  AlertCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../services/notification.service';

// Phân loại thông báo thông minh & hiện đại theo nghiệp vụ phòng khám nha khoa
const resolveNotificationType = (item) => {
  const type = item.type;
  const title = (item.title || '').toLowerCase();
  const content = (item.content || '').toLowerCase();

  // 1. Check-in / Tiếp nhận tại quầy
  if (
    type === 'PATIENT_CHECKIN' &&
    (title.includes('check-in') ||
      title.includes('tiếp nhận') ||
      title.includes('có mặt') ||
      content.includes('check-in') ||
      content.includes('chờ khám') ||
      content.includes('vào phòng'))
  ) {
    return 'PATIENT_CHECKIN';
  }

  // 2. Nhắc lịch tái khám định kỳ & hẹn sắp đến
  if (
    title.includes('nhắc lịch') ||
    title.includes('tái khám') ||
    content.includes('tái khám') ||
    type === 'FOLLOW_UP'
  ) {
    return 'FOLLOW_UP';
  }

  // 3. Lịch hẹn mới xếp / Thay đổi lịch hẹn
  if (
    title.includes('lịch hẹn') ||
    title.includes('đặt hẹn') ||
    title.includes('đổi lịch') ||
    title.includes('hủy') ||
    type === 'STATUS_CHANGE'
  ) {
    return 'STATUS_CHANGE';
  }

  // 4. Thanh toán viện phí & Hóa đơn
  if (title.includes('thanh toán') || title.includes('hóa đơn') || type === 'PAYMENT_SUCCESS') {
    return 'PAYMENT_SUCCESS';
  }

  // 5. Phân tích X-quang AI
  if (title.includes('x-quang') || title.includes('ai') || title.includes('chẩn đoán') || type === 'AI_XRAY') {
    return 'AI_XRAY';
  }

  return type || 'SYSTEM';
};

const getNotificationMeta = (resolvedType) => {
  switch (resolvedType) {
    case 'PATIENT_CHECKIN':
      return {
        badge: 'Tiếp nhận',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        icon: UserCheck,
        iconBg: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
        accentBar: 'bg-emerald-500',
        cardBorderHover: 'hover:border-emerald-300',
      };
    case 'STATUS_CHANGE':
      return {
        badge: 'Lịch mới',
        badgeBg: 'bg-teal-50 text-teal-800 border-teal-200/80',
        icon: Calendar,
        iconBg: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
        accentBar: 'bg-teal-600',
        cardBorderHover: 'hover:border-teal-300',
      };
    case 'FOLLOW_UP':
      return {
        badge: 'Tái khám',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        icon: Stethoscope,
        iconBg: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
        accentBar: 'bg-blue-500',
        cardBorderHover: 'hover:border-blue-300',
      };
    case 'PAYMENT_SUCCESS':
      return {
        badge: 'Thanh toán',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        icon: CreditCard,
        iconBg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        accentBar: 'bg-amber-500',
        cardBorderHover: 'hover:border-amber-300',
      };
    case 'AI_XRAY':
      return {
        badge: 'AI X-quang',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        icon: Sparkles,
        iconBg: 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
        accentBar: 'bg-purple-500',
        cardBorderHover: 'hover:border-purple-300',
      };
    default:
      return {
        badge: 'Hệ thống',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Bell,
        iconBg: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        accentBar: 'bg-slate-400',
        cardBorderHover: 'hover:border-slate-300',
      };
  }
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  try {
    let d;
    if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      d = new Date(year, month - 1, day, hour, minute, second);
    } else {
      d = new Date(dateInput);
    }

    const time = d.getTime();
    if (isNaN(time)) return String(dateInput);

    const diff = (Date.now() - time) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;

    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return String(dateInput);
  }
};

export default function NotificationCenter({
  role = 'EMPLOYEE',
  pageTitle = 'Trung tâm thông báo',
  pageDescription = 'Cập nhật kịp thời các diễn biến ca khám, tiếp nhận và hoạt động phòng khám.',
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('notification_view_mode') || 'COMPACT';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('notification_view_mode', mode);
    } catch (e) {}
  };

  const userId = user?.id || user?.userId || null;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        const data = await getNotificationsByUser(userId);
        const list = Array.isArray(data) ? data : data?.data || [];
        setNotifications(list);
      }
    } catch (err) {
      console.warn('Lỗi khi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const handleUpdated = () => fetchNotifications();
    window.addEventListener('notification_updated', handleUpdated);
    return () => window.removeEventListener('notification_updated', handleUpdated);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item, e) => {
    if (e) e.stopPropagation();
    if (item.isRead) return;
    try {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notification_updated'));
    } catch (err) {
      console.warn('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    if (unreadItems.length === 0) {
      toast('Tất cả thông báo đã được đọc.');
      return;
    }
    try {
      if (userId) {
        await markAllNotificationsAsRead(userId);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('notification_updated'));
      toast.success('Đã đánh dấu tất cả là đã đọc.');
    } catch (err) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc.');
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Đã xóa thông báo.');
      window.dispatchEvent(new CustomEvent('notification_updated'));
    } catch (err) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Đã xóa thông báo.');
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item);
    }
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  // Filter thông báo
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (activeTab === 'READ' && !n.isRead) return false;

      const resolved = resolveNotificationType(n);
      if (typeFilter !== 'ALL' && resolved !== typeFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = (n.title || '').toLowerCase().includes(query);
        const matchContent = (n.content || '').toLowerCase().includes(query);
        const matchSender = (n.senderName || '').toLowerCase().includes(query);
        if (!matchTitle && !matchContent && !matchSender) return false;
      }
      return true;
    });
  }, [notifications, activeTab, typeFilter, searchTerm]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Đếm nhanh số lượng theo từng nhóm nghiệp vụ
  const countsByType = useMemo(() => {
    const counts = {
      FOLLOW_UP: 0,
      STATUS_CHANGE: 0,
      PATIENT_CHECKIN: 0,
      PAYMENT_SUCCESS: 0,
      AI_XRAY: 0,
    };
    notifications.forEach((n) => {
      const type = resolveNotificationType(n);
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return counts;
  }, [notifications]);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 max-w-7xl mx-auto pb-8">
      {/* 1. Header Banner Thiết kế Nhẹ Nhàng, Thanh Lịch & Bo Góc Vừa Vặn */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-200/70 text-teal-700 shadow-2xs">
              <Bell size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800">
                  {pageTitle}
                </h1>
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {unreadCount} chưa đọc
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    Đã cập nhật
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed max-w-2xl">
                {pageDescription}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Làm mới danh sách"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
              <span>Làm mới</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition-all shadow-2xs cursor-pointer"
              >
                <CheckCheck size={14} className="stroke-[2.5]" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips - Tinh tế nhẹ nhàng, sạch sẽ không số rườm rà */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-400 font-medium text-[11.5px] mr-1 shrink-0">Phân loại:</span>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'ALL'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTypeFilter('FOLLOW_UP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'FOLLOW_UP'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Nhắc tái khám
          </button>
          <button
            onClick={() => setTypeFilter('STATUS_CHANGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'STATUS_CHANGE'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Lịch hẹn mới
          </button>
          <button
            onClick={() => setTypeFilter('PATIENT_CHECKIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'PATIENT_CHECKIN'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Tiếp nhận
          </button>
          <button
            onClick={() => setTypeFilter('PAYMENT_SUCCESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'PAYMENT_SUCCESS'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Hóa đơn
          </button>
          <button
            onClick={() => setTypeFilter('AI_XRAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === 'AI_XRAY'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            AI Chẩn đoán
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Tabs, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Tab Trạng thái - Gọn gàng chuyên nghiệp */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UNREAD')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'UNREAD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Chưa đọc</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('READ')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'READ'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã đọc
          </button>
        </div>

        {/* Search, Filter & View Toggle */}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nội dung, tên..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50/60">
            <button
              onClick={() => handleToggleViewMode('COMPACT')}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'COMPACT'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Chế độ Danh sách (List View)"
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => handleToggleViewMode('CARD')}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'CARD'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Chế độ Thẻ (Card View)"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Danh sách thông báo */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
          <p className="mt-3 text-xs font-bold text-slate-500">Đang tải danh sách thông báo...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 border border-teal-100 text-teal-600 mb-3">
            <Inbox size={26} className="stroke-[1.6]" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không có thông báo nào</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'ALL' || activeTab !== 'ALL'
              ? 'Không tìm thấy thông báo phù hợp với bộ lọc hiện tại. Hãy thử chọn Tất cả.'
              : 'Tất cả các thông báo và nhắc nhở quan trọng sẽ xuất hiện tại đây.'}
          </p>
        </div>
      ) : viewMode === 'CARD' ? (
        /* ==================== CARD GRID VIEW ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNotifications.map((item) => {
            const resolvedType = resolveNotificationType(item);
            const meta = getNotificationMeta(resolvedType);
            const IconComp = meta.icon || Bell;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex flex-col justify-between bg-white rounded-xl border p-4.5 transition-all duration-200 cursor-pointer shadow-2xs ${
                  item.isRead
                    ? 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                    : `border-slate-200/80 ${meta.cardBorderHover} hover:shadow-xs ring-1 ring-slate-100`
                }`}
              >
                {/* Vạch màu định danh bên trái */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                    item.isRead ? 'bg-slate-200' : meta.accentBar
                  }`}
                />

                {/* Phần trên: Icon + Badge + Thời gian */}
                <div>
                  <div className="flex items-center justify-between gap-2 pl-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconBg}`}
                      >
                        <IconComp size={15} className="stroke-[2.2]" />
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.badgeBg}`}
                      >
                        {meta.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Clock size={11} />
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-teal-600 ring-2 ring-teal-100 ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Tiêu đề & Nội dung */}
                  <div className="pl-2">
                    <h4
                      className={`text-sm tracking-tight leading-snug ${
                        item.isRead ? 'font-bold text-slate-800' : 'font-extrabold text-teal-950'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* Phần dưới: Người gửi + Nút thao tác */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between pl-2">
                  <div className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                    {item.senderName && item.senderName !== 'Hệ thống' ? (
                      <span>
                        Từ: <strong className="text-slate-600 font-semibold">{item.senderName}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">Crown Dental System</span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item, e)}
                        className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(item.id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={14} />
                    </button>

                    {item.targetUrl && (
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className="flex items-center gap-1 pl-2 pr-1 py-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== COMPACT LIST VIEW ==================== */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
          {filteredNotifications.map((item) => {
            const resolvedType = resolveNotificationType(item);
            const meta = getNotificationMeta(resolvedType);
            const IconComp = meta.icon || Bell;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-white hover:bg-slate-50/80 border-l-2 border-l-transparent'
                    : 'bg-teal-50/20 hover:bg-teal-50/50 border-l-2 border-l-teal-600'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}
                  >
                    <IconComp size={15} className="stroke-[2.2]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${meta.badgeBg}`}
                      >
                        {meta.badge}
                      </span>
                      <h4
                        className={`text-xs sm:text-sm tracking-tight truncate ${
                          item.isRead ? 'font-bold text-slate-800' : 'font-extrabold text-teal-950'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-600 ring-2 ring-teal-100 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-3xl font-medium">
                      {item.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
                    {formatTimeAgo(item.createdAt)}
                  </span>

                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item, e)}
                        className="p-1.5 rounded-md hover:bg-teal-50 text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(item.id, e)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={14} />
                    </button>

                    {item.targetUrl && (
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
