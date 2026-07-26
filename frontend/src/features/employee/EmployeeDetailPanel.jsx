import {
  CalendarRange,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
  UserRound,
} from 'lucide-react';
import { RoleBadge, StatusDot } from './EmployeeBadges';

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 mt-0.5">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function EmployeeDetailPanel({ employee, onEdit }) {
  if (!employee) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
        <UserRound className="w-16 h-16 mb-4 text-slate-200" />
        <p className="text-sm font-medium text-slate-500">Chọn một nhân viên để xem chi tiết</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white">
        <h2 className="text-base font-bold text-slate-800">Thông tin nhân viên</h2>
      </div>

      {/* Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Hero section */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={employee.avatar}
            alt={employee.name}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-50 shadow-sm mb-3"
          />
          <h3 className="text-lg font-bold text-slate-900 mb-1">{employee.name || 'Chưa cập nhật'}</h3>
          <p className="text-sm text-slate-500 mb-3">{employee.email}</p>
          <div className="flex items-center justify-center gap-2">
            <RoleBadge role={employee.displayRole} />
            <StatusDot status={employee.displayStatus} />
          </div>
        </div>

        {/* Detailed Information */}
        <div className="space-y-6">
          <div>
            <div className="space-y-4">
              <DetailRow icon={User} label="Tên nhân viên">
                <p className="text-[13px] font-semibold text-slate-700">{employee.name || 'Chưa cập nhật'}</p>
              </DetailRow>

              <DetailRow icon={Mail} label="Email">
                <p className="text-[13px] font-medium text-slate-700 break-words">
                  {employee.email || 'Chưa cập nhật'}
                </p>
              </DetailRow>

              <DetailRow icon={Phone} label="Số điện thoại">
                <p className="text-[13px] font-medium text-slate-700">
                  {employee.phone || 'Chưa cập nhật'}
                </p>
              </DetailRow>

              <DetailRow icon={UserRound} label="Giới tính">
                <p className="text-[13px] font-medium text-slate-700">
                  {employee.displayGender || 'Chưa cập nhật'}
                </p>
              </DetailRow>

              <DetailRow icon={MapPin} label="Địa chỉ">
                <p className="text-[13px] font-medium text-slate-700">
                  {employee.address || 'Chưa cập nhật'}
                </p>
              </DetailRow>

              <DetailRow icon={UserRound} label="Vai trò">
                <div className="mt-1">
                  <RoleBadge role={employee.displayRole} />
                </div>
              </DetailRow>

              <DetailRow icon={CalendarRange} label="Ngày tạo tài khoản">
                <p className="text-[13px] font-medium text-slate-700">{employee.displayCreatedAt}</p>
              </DetailRow>

              <DetailRow icon={Clock} label="Trạng thái tài khoản">
                <div className="mt-1">
                  <StatusDot status={employee.displayStatus} />
                </div>
              </DetailRow>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (Update) */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => onEdit(employee)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:border-blue-300 active:scale-[0.98]"
        >
          <Pencil className="h-4 w-4" />
          Chỉnh sửa thông tin
        </button>
      </div>
    </div>
  );
}
