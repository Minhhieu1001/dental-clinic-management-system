const statusLabels = {
  active: 'Hoạt động',
  locked: 'Bị khóa',
  inactive: 'Chưa kích hoạt',
};

const statusDotColors = {
  active: 'bg-emerald-500',
  locked: 'bg-red-500',
  inactive: 'bg-slate-400',
};

const statusTextColors = {
  active: 'text-emerald-600',
  locked: 'text-red-600',
  inactive: 'text-slate-500',
};

const roleBadgeStyles = {
  'Lễ tân': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Nhân viên': 'bg-blue-100 text-blue-800 border-blue-300',
  // Fallbacks just in case
  'Bác sĩ': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Quản trị viên': 'bg-purple-100 text-purple-800 border-purple-300',
  'Kho': 'bg-orange-100 text-orange-800 border-orange-300',
  'Khác': 'bg-slate-100 text-slate-800 border-slate-300',
};

export function RoleBadge({ role }) {
  const style = roleBadgeStyles[role] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {role}
    </span>
  );
}

const statusBadgeStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function StatusDot({ status, compact = false }) {
  const badgeStyle = statusBadgeStyles[status] || statusBadgeStyles.inactive;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${statusTextColors[status]}`}>
        <span className={`h-2 w-2 rounded-full ${statusDotColors[status]}`} />
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotColors[status]}`} />
      {statusLabels[status]}
    </span>
  );
}
