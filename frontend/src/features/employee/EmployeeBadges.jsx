const statusLabels = {
  active: 'Hoạt động',
  locked: 'Bị khóa',
  inactive: 'Chưa kích hoạt',
  'Hoạt động': 'Hoạt động',
  'Bị khóa': 'Bị khóa',
  'Chưa kích hoạt': 'Chưa kích hoạt',
};

const statusDotColors = {
  active: 'bg-emerald-500',
  locked: 'bg-rose-500',
  inactive: 'bg-slate-400',
  'Hoạt động': 'bg-emerald-500',
  'Bị khóa': 'bg-rose-500',
  'Chưa kích hoạt': 'bg-slate-400',
};

const statusTextColors = {
  active: 'text-emerald-700',
  locked: 'text-rose-700',
  inactive: 'text-slate-600',
  'Hoạt động': 'text-emerald-700',
  'Bị khóa': 'text-rose-700',
  'Chưa kích hoạt': 'text-slate-600',
};

const roleBadgeStyles = {
  'Lễ tân': 'bg-teal-50 text-teal-800 border-teal-300 font-bold',
  'Nhân viên': 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
  'Bác sĩ': 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  'Quản trị viên': 'bg-purple-50 text-purple-800 border-purple-300 font-bold',
  'Kho': 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
  'Khác': 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
};

export function RoleBadge({ role }) {
  const style = roleBadgeStyles[role] || 'bg-slate-50 text-slate-700 border-slate-300 font-medium';
  return (
    <span className={`inline-flex items-center rounded-[2px] border px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${style}`}>
      {role}
    </span>
  );
}

const statusBadgeStyles = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  locked: 'bg-rose-50 text-rose-800 border-rose-300',
  inactive: 'bg-slate-50 text-slate-700 border-slate-300',
  'Hoạt động': 'bg-emerald-50 text-emerald-800 border-emerald-300',
  'Bị khóa': 'bg-rose-50 text-rose-800 border-rose-300',
  'Chưa kích hoạt': 'bg-slate-50 text-slate-700 border-slate-300',
};

export function StatusDot({ status, compact = false }) {
  const badgeStyle = statusBadgeStyles[status] || statusBadgeStyles.inactive;
  const label = statusLabels[status] || status || 'Chưa xác định';
  const dotColor = statusDotColors[status] || 'bg-slate-400';
  const textColor = statusTextColors[status] || 'text-slate-600';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textColor}`}>
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-0.5 text-[11px] font-bold ${badgeStyle}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}
