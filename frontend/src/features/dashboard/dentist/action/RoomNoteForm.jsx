import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Building2,
  FileText,
  X,
  CheckCircle2,
  RefreshCw,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';

export default function RoomNoteForm({
  isOpen,
  onClose,
  appointment,
  rooms = [],
  initialRoomId = '',
  initialNotes = '',
  isSaving = false,
  onConfirm,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');

  // Quản lý hiệu ứng mở / đóng mượt mà (Fade + Scale + Slide)
  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setRoomId(initialRoomId || appointment?.roomId || appointment?.room_id || '');
      setNotes(initialNotes || appointment?.notes || '');
      setShouldRender(true);
      timeoutId = setTimeout(() => {
        setIsAnimating(true);
      }, 20);
    } else {
      setIsAnimating(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 250);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen, appointment, initialRoomId, initialNotes]);

  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!shouldRender) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onConfirm) {
      onConfirm({ roomId, notes });
    }
  };

  const patientName = appointment?.patientName || appointment?.fullName || 'Bệnh nhân';
  const serviceName = appointment?.reason || appointment?.serviceName || 'Khám răng tổng quát';
  let timeStr = appointment?.appointmentTime || '09:00';
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    timeStr = timeStr.substring(11, 16);
  } else if (typeof timeStr === 'string' && timeStr.length > 5) {
    timeStr = timeStr.substring(0, 5);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250 ease-out ${
        isAnimating
          ? 'bg-slate-900/45 backdrop-blur-xs opacity-100'
          : 'bg-slate-900/0 backdrop-blur-none opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-2xl transition-all duration-250 ease-out transform ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-3'
        }`}
      >
        {/* Header: Đồng màu xanh ngọc thanh lịch */}
        <div className="flex items-center justify-between border-b border-teal-100/80 bg-gradient-to-r from-teal-50 via-teal-50/60 to-emerald-50/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30 shrink-0">
              <DoorOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-teal-950">Chọn phòng khám & Ghi chú</h3>
              <p className="text-[11px] font-medium text-teal-700/80">
                Tiếp nhận bệnh nhân vào phòng điều trị
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-teal-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            {/* Card thông tin tóm tắt bệnh nhân */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <User size={13} className="text-teal-700 shrink-0" />
                  <span className="truncate">{patientName}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Stethoscope size={12} className="text-teal-600 shrink-0" />
                  <span className="truncate">{serviceName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-100/70 border border-teal-200/80 px-2 py-1 rounded-lg text-[11px] shrink-0">
                <Clock size={12} className="text-teal-700" />
                <span>{timeStr}</span>
              </div>
            </div>

            {/* Chọn phòng khám */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Building2 size={13} className="text-teal-600" />
                <span>Phòng khám tiếp nhận</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">-- Chọn phòng khám --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomName || room.name || `Phòng ${room.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Ghi chú ca khám */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText size={13} className="text-teal-600" />
                <span>Ghi chú tiếp nhận</span>
                <span className="text-[11px] font-normal text-slate-400">(không bắt buộc)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của ca khám..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs outline-none transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-white" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-teal-200" />
                  <span>Xác nhận gọi vào</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

