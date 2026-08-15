import { CalendarPlus, UserCheck, FilePlus, Receipt } from 'lucide-react';

const actions = [
  {
    key: 'schedule',
    icon: CalendarPlus,
    title: 'Đặt lịch nhanh',
    desc: 'Tạo lịch hẹn mới',
  },
  {
    key: 'checkin',
    icon: UserCheck,
    title: 'Tiếp nhận',
    desc: 'Check-in bệnh nhân',
  },
  {
    key: 'record',
    icon: FilePlus,
    title: 'Tạo hồ sơ',
    desc: 'Bệnh nhân mới',
  },
  {
    key: 'payment',
    icon: Receipt,
    title: 'Thu tiền',
    desc: 'Hóa đơn và công nợ',
  },
];

export default function QuickActions({ onOpenCreateModal }) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[14px] font-semibold text-slate-700">
          Thao tác nhanh
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-100">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                if (action.key === 'schedule' && onOpenCreateModal) {
                  onOpenCreateModal();
                }
              }}
              className="flex items-center gap-2.5 bg-white px-3.5 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-teal-50 text-teal-700">
                <Icon size={16} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-700 leading-tight">
                  {action.title}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {action.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
