import { Calendar, Clock, UserCheck, UserX, XCircle } from 'lucide-react';

const statIcons = {
  thisWeek: Calendar,
  today: Clock,
  accepted: UserCheck,
  notArrived: UserX,
  cancelled: XCircle,
};

export default function StatsRow({ stats, loading }) {
  const items = [
    {
      key: 'thisWeek',
      label: 'Lịch hẹn trong tuần',
      value: stats?.appointmentsThisWeek?.value ?? 0,
      sub: 'Thống kê trong tuần',
      color: 'text-teal-600',
    },
    {
      key: 'today',
      label: 'Lịch hẹn hôm nay',
      value: stats?.appointmentsToday?.value ?? 0,
      sub: 'Trong ngày hôm nay',
      color: 'text-blue-600',
    },
    {
      key: 'accepted',
      label: 'Đã tiếp nhận',
      value: stats?.acceptedToday?.value ?? 0,
      sub: 'Bệnh nhân đã đến',
      color: 'text-emerald-600',
    },
    {
      key: 'notArrived',
      label: 'Chưa đến',
      value: stats?.notArrivedToday?.value ?? 0,
      sub: 'Bệnh nhân chưa đến',
      color: 'text-amber-600',
    },
    {
      key: 'cancelled',
      label: 'Lịch hẹn bị hủy',
      value: stats?.cancelledAppointments?.value ?? 0,
      sub: 'Ca khám bị hủy',
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((item) => {
        const Icon = statIcons[item.key] || Calendar;
        return (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white px-4 py-3.5 shadow-2xs"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-500 leading-none">
                {item.label}
              </p>
              <p className="mt-2 text-[24px] font-extrabold text-slate-800 leading-none tracking-tight">
                {loading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200" />
                ) : (
                  item.value
                )}
              </p>
              <p className={`mt-1.5 text-[11px] font-semibold ${item.color}`}>
                {item.sub}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-slate-50 text-slate-400">
              <Icon size={18} strokeWidth={1.8} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
