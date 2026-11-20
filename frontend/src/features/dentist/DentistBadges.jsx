const statusLabels = {
  active: 'Hoạt động',
  locked: 'Bị khóa',
  leave: 'Nghỉ phép',
};

const statusDotColors = {
  active: 'bg-emerald-500',
  locked: 'bg-red-500',
  leave: 'bg-amber-500',
};

const statusTextColors = {
  active: 'text-emerald-600',
  locked: 'text-red-600',
  leave: 'text-amber-600',
};

const statusBadgeStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
  leave: 'bg-amber-50 text-amber-700 border-amber-200',
};

const specialtyBadgeStyles = {
  Implant: 'bg-blue-50 text-blue-700 border-blue-200',
  'Nha sĩ Implant': 'bg-blue-50 text-blue-700 border-blue-200',
  'Chỉnh nha': 'bg-purple-50 text-purple-700 border-purple-200',
  'Nhổ răng': 'bg-orange-50 text-orange-700 border-orange-200',
  'Nha khoa tổng quát': 'bg-teal-50 text-teal-700 border-teal-200',
  'Nha chu': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Thẩm mỹ nha khoa': 'bg-pink-50 text-pink-700 border-pink-200',
};

const fallbackColors = [
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-lime-50 text-lime-700 border-lime-200',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-violet-50 text-violet-700 border-violet-200',
];

export function SpecialtyBadge({ label, labels, className = '' }) {
  const items = labels || (label ? [label] : ['Chưa cập nhật']);
  const maxDisplay = 2;
  const displayItems = items.slice(0, maxDisplay);
  const hiddenCount = items.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayItems.map((lbl, idx) => {
        let style =
          specialtyBadgeStyles[lbl] ||
          Object.entries(specialtyBadgeStyles).find(([key]) => lbl?.includes(key))?.[1];

        if (!style) {
          const charCode = lbl?.charCodeAt(0) || 0;
          style = fallbackColors[(charCode + idx) % fallbackColors.length];
        }

        return (
          <span
            key={idx}
            className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style}`}
          >
            {lbl}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center rounded-[2px] border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

export function DentistStatusDot({ status, compact = false }) {
  const badgeStyle = statusBadgeStyles[status] || statusBadgeStyles.leave;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${statusTextColors[status]}`}>
        <span className={`h-2 w-2 rounded-[2px] ${statusDotColors[status]}`} />
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotColors[status]}`} />
      {statusLabels[status]}
    </span>
  );
}
