import { Calendar, Inbox, UserCheck, Clock, Banknote } from 'lucide-react';

const statIcons = {
  appointments: Calendar,
  requests: Inbox,
  checkedIn: UserCheck,
  waiting: Clock,
  revenue: Banknote,
};

export default function StatsRow({ stats, loading }) {
  const items = [
    {
      key: 'appointments',
      label: 'Lịch hẹn hôm nay',
      value: stats?.appointmentsToday?.value ?? 0,
      sub: stats?.appointmentsToday?.compareLabel ?? 'Lịch hẹn',
      subColor: 'text-teal-600',
    },
    {
      key: 'requests',
      label: 'Yêu cầu đặt lịch',
      value: stats?.requestsToday?.value ?? 0,
      sub: stats?.requestsToday?.sub ?? 'Yêu cầu từ Web/App',
      subColor: 'text-blue-600',
    },
    {
      key: 'checkedIn',
      label: 'Đã tiếp nhận',
      value: stats?.checkedIn?.value ?? 0,
      sub: stats?.checkedIn?.ratio ?? '0% lịch hẹn',
      subColor: 'text-slate-500',
    },
    {
      key: 'waiting',
      label: 'Đang chờ',
      value: stats?.waiting?.value ?? 0,
      sub: stats?.waiting?.avgWait ?? 'Trung bình 12 phút',
      subColor: 'text-slate-500',
    },
    {
      key: 'revenue',
      label: 'Thu trong ca',
      value: stats?.revenue?.value ?? '0 tr',
      sub: stats?.revenue?.transactions ?? '0 giao dịch',
      subColor: 'text-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((item) => {
        const Icon = statIcons[item.key] || Calendar;
        return (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-slate-500 leading-none">
                {item.label}
              </p>
              <p className="mt-2 text-[26px] font-bold text-slate-800 leading-none tracking-tight">
                {loading ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200" />
                ) : (
                  item.value
                )}
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
