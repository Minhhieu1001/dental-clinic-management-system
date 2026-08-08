import { useState, useMemo } from 'react';
import {
  FileText,
  PhoneCall,
  BellRing,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { appointmentStatusConfig } from './receptionistData';

const filterTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ đến' },
  { key: 'arrived', label: 'Đã đến' },
];

const actionIcons = {
  'Mở hồ sơ': FileText,
  'Gọi vào': PhoneCall,
  'Nhắc lịch': BellRing,
  'Thanh toán': CreditCard,
};

const ROWS_PER_PAGE = 5;

export default function AppointmentTable({ appointments }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'waiting')
        return apt.status === 'not-arrived' || apt.status === 'waiting';
      if (activeFilter === 'arrived')
        return apt.status === 'checked-in' || apt.status === 'completed';
      return true;
    });
  }, [appointments, activeFilter]);

  // Reset page when filter changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    // Will correct on next render
    setTimeout(() => setCurrentPage(safePage), 0);
  }

  const paginatedRows = filtered.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE
  );

  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, filtered.length);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  return (
    <div className="rounded-[4px] border border-slate-200 bg-white">
      {/* Header with filter tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[15px] font-semibold text-slate-700">
          Lịch hẹn hôm nay
        </h3>
        <div className="flex items-center gap-0.5 rounded-[4px] bg-slate-100 p-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleFilterChange(tab.key)}
              className={`rounded-[3px] px-3 py-1 text-[12px] font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Giờ
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Bệnh nhân
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Dịch vụ
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Bác sĩ
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Trạng thái
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((apt, idx) => {
              const statusConf = appointmentStatusConfig[apt.status];
              const ActionIcon = actionIcons[statusConf.action];
              return (
                <tr
                  key={apt.id}
                  className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${
                    idx === paginatedRows.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {/* Time */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-slate-700">
                      {apt.time}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[3px] bg-slate-100 text-[11px] font-bold text-slate-500">
                        {apt.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 leading-tight">
                          {apt.patientName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">
                          {apt.isNewPatient ? 'Khách mới' : apt.patientCode} ·{' '}
                          {apt.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-slate-600">
                      {apt.service}
                    </span>
                  </td>

                  {/* Dentist */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-slate-600">
                      {apt.dentist}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-[3px] px-2 py-0.5 text-[11px] font-medium leading-relaxed ${statusConf.className}`}
                    >
                      {statusConf.label}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-[3px] border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100"
                    >
                      {ActionIcon && (
                        <ActionIcon size={13} strokeWidth={1.8} />
                      )}
                      {statusConf.action}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-[13px] text-slate-400">
          Không có lịch hẹn phù hợp với bộ lọc.
        </div>
      )}

      {/* Pagination footer */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
          <p className="text-[12px] text-slate-500">
            Hiển thị {startRow}–{endRow} / {filtered.length} lịch hẹn
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-[3px] text-[12px] font-medium transition-colors ${
                  page === safePage
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
