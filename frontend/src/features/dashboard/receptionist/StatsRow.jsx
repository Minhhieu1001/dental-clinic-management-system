import { Calendar, Clock, UserCheck, UserX, XCircle } from 'lucide-react';

const statConfig = {
  thisWeek: {
    icon: Calendar,
    badge: 'Tuần này',
    sub: 'Thống kê trong tuần',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
    iconBg: 'bg-teal-50 border border-teal-200/80',
    iconColor: 'text-teal-700',
    textColor: 'text-teal-700',
    hoverBorder: 'hover:border-teal-300',
    accentGrad: 'from-teal-500/5 via-white to-white',
  },
  today: {
    icon: Clock,
    badge: 'Hôm nay',
    sub: 'Ca khám trong ngày',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
    iconBg: 'bg-sky-50 border border-sky-200/80',
    iconColor: 'text-sky-700',
    textColor: 'text-sky-700',
    hoverBorder: 'hover:border-sky-300',
    accentGrad: 'from-sky-500/5 via-white to-white',
  },
  accepted: {
    icon: UserCheck,
    badge: 'Đã đến',
    sub: 'Bệnh nhân đã đến',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    iconBg: 'bg-emerald-50 border border-emerald-200/80',
    iconColor: 'text-emerald-700',
    textColor: 'text-emerald-700',
    hoverBorder: 'hover:border-emerald-300',
    accentGrad: 'from-emerald-500/5 via-white to-white',
  },
  notArrived: {
    icon: UserX,
    badge: 'Chờ khám',
    sub: 'Bệnh nhân chưa đến',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    iconBg: 'bg-amber-50 border border-amber-200/80',
    iconColor: 'text-amber-700',
    textColor: 'text-amber-700',
    hoverBorder: 'hover:border-amber-300',
    accentGrad: 'from-amber-500/5 via-white to-white',
  },
  cancelled: {
    icon: XCircle,
    badge: 'Bị hủy',
    sub: 'Lịch khám bị hủy',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    iconBg: 'bg-rose-50 border border-rose-200/80',
    iconColor: 'text-rose-700',
    textColor: 'text-rose-700',
    hoverBorder: 'hover:border-rose-300',
    accentGrad: 'from-rose-500/5 via-white to-white',
  },
};

export default function StatsRow({ stats, loading }) {
  const items = [
    {
      key: 'thisWeek',
      label: 'Lịch trong tuần',
      value: stats?.appointmentsThisWeek?.value ?? 0,
      ...statConfig.thisWeek,
    },
    {
      key: 'today',
      label: 'Lịch hôm nay',
      value: stats?.appointmentsToday?.value ?? 0,
      ...statConfig.today,
    },
    {
      key: 'accepted',
      label: 'Đã tiếp nhận',
      value: stats?.acceptedToday?.value ?? 0,
      ...statConfig.accepted,
    },
    {
      key: 'notArrived',
      label: 'Chưa đến',
      value: stats?.notArrivedToday?.value ?? 0,
      ...statConfig.notArrived,
    },
    {
      key: 'cancelled',
      label: 'Lịch bị hủy',
      value: stats?.cancelledAppointments?.value ?? 0,
      ...statConfig.cancelled,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 h-full">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`flex flex-col justify-between rounded-[4px] border border-slate-200 bg-gradient-to-b ${item.accentGrad} p-3 xl:p-3.5 shadow-2xs ${item.hoverBorder} transition-all duration-150 h-full min-h-[112px] group`}
          >
            {/* Hàng trên: Icon nằm ở GÓC TRÁI + Badge nằm ở góc phải */}
            <div className="flex items-center justify-between">
              <div className={`flex h-8 w-8 items-center justify-center rounded-[3px] ${item.iconBg} ${item.iconColor} shadow-2xs group-hover:scale-105 transition-transform`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] border ${item.badgeClass}`}>
                {item.badge}
              </span>
            </div>

            {/* Hàng dưới: Số lượng to rõ + Tiêu đề + Chú thích phủ kín khối */}
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <p className="text-[24px] xl:text-[26px] font-black text-slate-900 leading-none tracking-tight">
                  {loading ? (
                    <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200" />
                  ) : (
                    item.value
                  )}
                </p>
                <span className="text-[10.5px] font-semibold text-slate-400">lịch</span>
              </div>
              <p className="text-[11.5px] font-bold text-slate-700 leading-tight mt-1.5 truncate" title={item.label}>
                {item.label}
              </p>
              <p className={`text-[10.5px] font-semibold ${item.textColor} leading-tight mt-0.5 truncate`} title={item.sub}>
                {item.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
