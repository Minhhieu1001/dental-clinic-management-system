import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  ExternalLink,
  User,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  CreditCard,
  UserCheck,
  Bell,
  ArrowRight,
  Info,
  MapPin,
  FileText,
  Phone,
  Bookmark,
  Activity,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatDetailedDate = (dateInput) => {
  if (!dateInput) return '';
  try {
    let d;
    if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      d = new Date(year, month - 1, day, hour, minute, second);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return String(dateInput);

    const pad = (n) => String(n).padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = daysOfWeek[d.getDay()];

    return {
      time: `${hours}:${minutes}`,
      date: `${dayName}, ${day}/${month}/${year}`,
      full: `${hours}:${minutes} - ${dayName}, ${day}/${month}/${year}`,
    };
  } catch (e) {
    return { time: '', date: String(dateInput), full: String(dateInput) };
  }
};

// Trích xuất các thực thể thông minh từ nội dung thông báo
const extractEntities = (content = '') => {
  const result = {
    patientName: null,
    phone: null,
    time: null,
    date: null,
    clinicBranch: null,
    reasonOrService: null,
    dentistName: null,
    room: null,
  };

  if (!content) return result;

  // 1. Số điện thoại (10 số bắt đầu bằng 0)
  const phoneMatch = content.match(/(\b0\d{9,10}\b)/);
  if (phoneMatch) result.phone = phoneMatch[1];

  // 2. Giờ khám (hh:mm)
  const timeMatch = content.match(/(\b[0-2]?\d:[0-5]\d\b)/);
  if (timeMatch) result.time = timeMatch[1];

  // 3. Ngày (dd/mm/yyyy)
  const dateMatch = content.match(/(\b\d{1,2}\/\d{1,2}\/\d{4}\b)/);
  if (dateMatch) result.date = dateMatch[1];

  // 4. Chi nhánh
  const branchMatch = content.match(/tại\s+([^.,\n]+)/i);
  if (branchMatch) result.clinicBranch = branchMatch[1].trim();

  // 5. Bác sĩ
  const dentistMatch = content.match(/(bác sĩ|bs\.?|th\.?\s*bs\.?)\s+([^.,\n()]+)/i);
  if (dentistMatch) result.dentistName = `${dentistMatch[1]} ${dentistMatch[2]}`.trim();

  // 6. Phòng khám
  const roomMatch = content.match(/(phòng\s+khám\s+\w+|phòng\s+chỉnh\s+nha\s+\w+|ghế\s+\w+)/i);
  if (roomMatch) result.room = roomMatch[1].trim();

  // 7. Dịch vụ / Lý do trong ngoặc đơn (Mắc cài kim loại tiêu chuẩn)
  const parenMatch = content.match(/\(([^)]+)\)/);
  if (parenMatch && !phoneMatch?.[1]?.includes(parenMatch[1])) {
    result.reasonOrService = parenMatch[1].trim();
  }

  // 8. Tên bệnh nhân
  const patientMatch = content.match(/bệnh nhân\s+([^(\n,]+)/i);
  if (patientMatch) {
    result.patientName = patientMatch[1].trim();
  }

  return result;
};

export default function NotificationDetailModal({
  isOpen,
  onClose,
  notification,
  onDelete,
  resolvedType = 'SYSTEM',
  meta = {},
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const IconComp = meta.icon || Bell;
  const timeInfo = formatDetailedDate(notification?.createdAt);
  const entities = extractEntities(notification?.content);

  const handleNavigate = () => {
    onClose();
    if (notification?.targetUrl) {
      navigate(notification.targetUrl);
    }
  };

  const getActionLabel = () => {
    if (notification?.targetUrl) {
      if (notification.targetUrl.includes('treatment')) return 'Mở kế hoạch điều trị';
      if (notification.targetUrl.includes('appointment')) return 'Xem lịch khám chi tiết';
      if (notification.targetUrl.includes('invoice') || notification.targetUrl.includes('billing'))
        return 'Xem hóa đơn thanh toán';
      if (notification.targetUrl.includes('medical-record')) return 'Mở hồ sơ bệnh án';
      return 'Xem chi tiết tác vụ';
    }
    return null;
  };

  const actionLabel = getActionLabel();

  return (
    <AnimatePresence mode="wait">
      {isOpen && notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop Mượt mà */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[4px] cursor-pointer"
          />

          {/* Modal Container Mượt Mà & Hiện Đại Chuẩn ERP */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 380,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col my-auto"
          >
            {/* Top Accent Gradient Bar */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-700`}
            />

            {/* Modal Header Hiện Đại */}
            <div className="px-5 pt-4 pb-3.5 sm:px-6 sm:pt-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/90 via-white to-white">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform hover:scale-105 ${
                    meta.iconBg || 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                  }`}
                >
                  <IconComp size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                        meta.badgeBg || 'bg-teal-50 text-teal-800 border-teal-200'
                      }`}
                    >
                      {meta.badge || 'Thông báo'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={12} className="stroke-[2.5]" />
                      Đã xác nhận
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">
                    Chi tiết thông báo hệ thống
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Trình bày dữ liệu nghiệp vụ đầy đủ & trực quan */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Tiêu đề thông báo lớn & rõ nét */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 inline-block mb-1">
                  Tiêu đề thông báo
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {notification.title}
                </h2>
              </div>

              {/* Khung nội dung chi tiết dạng thẻ sang trọng */}
              <div className="p-4 rounded-lg bg-slate-50/90 border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Nội dung diễn biến
                </span>
                <p className="font-medium text-slate-800 text-[13.5px] leading-relaxed whitespace-pre-wrap">
                  {notification.content}
                </p>
              </div>

              {/* Trích xuất thông tin nghiệp vụ chính (Structured Entities) */}
              {(entities.time ||
                entities.date ||
                entities.clinicBranch ||
                entities.patientName ||
                entities.reasonOrService ||
                entities.dentistName ||
                entities.room) && (
                <div className="p-3.5 rounded-lg bg-teal-50/40 border border-teal-100 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-teal-100/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                      <Bookmark size={13} className="text-teal-700" />
                      Thông tin sự kiện nha khoa
                    </span>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                      Trích xuất tự động
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Ngày & Giờ hẹn */}
                    {(entities.time || entities.date) && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <Calendar size={14} className="text-teal-700 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Lịch hẹn</p>
                          <p className="font-bold text-teal-950 truncate">
                            {entities.time ? `${entities.time} ` : ''}
                            {entities.date ? `- Ngày ${entities.date}` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Lý do / Dịch vụ */}
                    {entities.reasonOrService && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <Activity size={14} className="text-emerald-700 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Lý do / Dịch vụ</p>
                          <p className="font-bold text-slate-800 truncate">
                            {entities.reasonOrService}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bệnh nhân / SĐT */}
                    {(entities.patientName || entities.phone) && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <User size={14} className="text-teal-700 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Bệnh nhân</p>
                          <p className="font-bold text-slate-800 truncate">
                            {entities.patientName || 'Bệnh nhân'}
                            {entities.phone ? ` (${entities.phone})` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bác sĩ phụ trách */}
                    {entities.dentistName && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <Stethoscope size={14} className="text-teal-700 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Bác sĩ phụ trách</p>
                          <p className="font-bold text-slate-800 truncate">
                            {entities.dentistName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Chi nhánh nha khoa */}
                    {entities.clinicBranch && (
                      <div className="sm:col-span-2 flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <MapPin size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Cơ sở nha khoa tiếp nhận</p>
                          <p className="font-bold text-slate-800 truncate">
                            {entities.clinicBranch}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phòng khám */}
                    {entities.room && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-teal-100/60 shadow-2xs">
                        <FileText size={14} className="text-teal-700 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Địa điểm phòng khám</p>
                          <p className="font-bold text-slate-800 truncate">
                            {entities.room}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin Meta: Người gửi, Thời gian tạo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-600">
                  <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Thời gian gửi</p>
                    <p className="font-bold text-slate-800 truncate">
                      {timeInfo.full || 'Vừa xong'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-600">
                  <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Người gửi / Tác nhân</p>
                    <p className="font-bold text-slate-800 truncate">
                      {notification.senderName || 'Hệ thống phòng khám'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Sang Trọng */}
            <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2.5">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(notification.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Xóa thông báo</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 transition-all cursor-pointer border border-slate-200 bg-white shadow-2xs"
                >
                  Đóng
                </button>

                {actionLabel && notification.targetUrl && (
                  <button
                    type="button"
                    onClick={handleNavigate}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-2xs transition-all cursor-pointer"
                  >
                    <span>{actionLabel}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
