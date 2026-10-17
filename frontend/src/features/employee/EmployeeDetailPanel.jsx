import {
  Calendar,
  CalendarRange,
  Building2,
  Clock,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { RoleBadge, StatusDot } from './EmployeeBadges';

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function EmployeeDetailPanel({ isOpen, onClose, employee, onEdit, onToggleLock, processing }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  // Mượt mà animation trượt từ phải sang và chặn thao tác trên màn hình chính bằng Backdrop
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => {
        setActive(true);
      }, 20);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const isLocked = employee?.displayStatus === 'locked' || employee?.displayStatus === 'Bị khóa';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop làm mờ & ngăn mọi thao tác trên màn hình chính khi hiển thị drawer */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel - Cố định chiều cao (h-full), thu nhỏ chiều rộng (w-full max-w-[380px]), trượt mượt từ phải sang */}
      <div
        className={`fixed top-0 right-0 bottom-0 h-full w-full max-w-[380px] bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-out z-50 ${
          active ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Cố định ở trên */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <h2 className="text-sm font-bold text-slate-800">Thông tin chi tiết</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Cuộn nội dung riêng trong khung cố định */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {employee ? (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 relative flex flex-col items-center shadow-2xs">
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50 shadow-xs"
                />
                <h3 className="mt-3 text-base font-bold text-slate-900 text-center">{employee.name || 'Chưa cập nhật'}</h3>
                <p className="text-xs text-slate-500 mb-2">{employee.email || '—'}</p>
                <div className="flex items-center gap-1.5">
                  <RoleBadge role={employee.displayRole} />
                  <StatusDot status={employee.displayStatus} />
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">Thông tin cá nhân</h4>
                <div className="space-y-2.5">
                  <DetailRow icon={Mail} label="Email">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {employee.email || 'Chưa cập nhật'}
                    </p>
                  </DetailRow>

                  <div className="grid grid-cols-2 gap-2.5">
                    <DetailRow icon={Phone} label="Số điện thoại">
                      <p className="text-xs font-semibold text-slate-700">
                        {employee.phone || 'Chưa cập nhật'}
                      </p>
                    </DetailRow>
                    <DetailRow icon={User} label="Giới tính">
                      <p className="text-xs font-semibold text-slate-700">
                        {employee.displayGender || employee.gender || 'Chưa cập nhật'}
                      </p>
                    </DetailRow>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <DetailRow icon={Calendar} label="Ngày sinh">
                      <p className="text-xs font-semibold text-slate-700">
                        {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </p>
                    </DetailRow>
                  </div>

                  <DetailRow icon={MapPin} label="Địa chỉ">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words">
                      {employee.address || 'Chưa cập nhật'}
                    </p>
                  </DetailRow>
                </div>
              </div>

              {/* Công việc & Tài khoản */}
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">Công việc & Tài khoản</h4>
                <div className="space-y-2.5">
                  <DetailRow icon={UserRound} label="Vai trò">
                    <div className="mt-0.5">
                      <RoleBadge role={employee.displayRole} />
                    </div>
                  </DetailRow>

                  <DetailRow icon={CalendarRange} label="Ngày tạo tài khoản">
                    <p className="text-xs font-semibold text-slate-700">{employee.displayCreatedAt || '—'}</p>
                  </DetailRow>

                  <DetailRow icon={Clock} label="Trạng thái tài khoản">
                    <div className="mt-0.5">
                      <StatusDot status={employee.displayStatus} />
                    </div>
                  </DetailRow>
                  <DetailRow icon={Building2} label="Chi nhánh">
                    <p className="text-xs font-semibold text-slate-700">
                      {employee.branchName || 'Chưa phân chi nhánh'}
                    </p>
                  </DetailRow>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <UserRound className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-xs font-medium">Không có thông tin nhân viên</p>
            </div>
          )}
        </div>

        {/* Footer Actions - Cố định ở đáy panel */}
        {employee && (
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(employee)}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              Chỉnh sửa
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => onToggleLock(employee)}
              className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                isLocked
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              {isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
