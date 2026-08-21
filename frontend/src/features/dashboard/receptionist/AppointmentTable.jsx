import { useState, useMemo } from 'react';
import {
  FileText,
  PhoneCall,
  BellRing,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentStatusConfig } from './receptionistData';
import { updateAppointmentStatus, getAppointmentById } from '../../../services/appointment.service';

const filterTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'confirmed', label: 'Chưa đến' },
  { key: 'waiting', label: 'Đang chờ khám' },
  { key: 'called', label: 'Gọi vào' },
];

const ROWS_PER_PAGE = 5;

const isReschedulableStatus = (status) => {
  if (!status) return true;
  const s = String(status).toUpperCase();
  return s === 'CONFIRMED' || s === 'PENDING' || status === 'not-arrived';
};

export default function AppointmentTable({ appointments, onRefresh, onOpenEditModal, onOpenCreateModal }) {
  const [dateScope, setDateScope] = useState('today'); // 'today' | 'week'
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  // Selected row state for header reschedule action
  const [selectedAptId, setSelectedAptId] = useState(null);

  // Sync state when props change
  useMemo(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  const handleTableRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success('Đã cập nhật danh sách lịch hẹn!');
      } catch {
        toast.error('Không thể làm mới danh sách');
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const handleHeaderRescheduleClick = async () => {
    let targetId = selectedAptId;
    if (!targetId) {
      if (filtered.length > 0) {
        targetId = filtered[0].id;
        setSelectedAptId(targetId);
      } else {
        toast.error('Vui lòng chọn 1 dòng lịch hẹn trong bảng để đổi lịch!');
        return;
      }
    }

    const aptData = localAppointments.find((a) => a.id === targetId);
    if (aptData) {
      const st = aptData.rawStatus || aptData.status;
      if (!isReschedulableStatus(st)) {
        toast.error('Lịch hẹn này đã check-in (Đang chờ khám / Đã khám), không thể đổi lịch nữa!');
        return;
      }
    }

    try {
      let fullAptData = aptData;
      if (targetId && !String(targetId).startsWith('mock-')) {
        const fetched = await getAppointmentById(targetId).catch(() => null);
        if (fetched) {
          fullAptData = { ...fullAptData, ...fetched };
        }
      }

      const openFn = onOpenEditModal || onOpenCreateModal;
      if (fullAptData && openFn) {
        openFn(fullAptData);
      }
    } catch (err) {
      console.warn('Lỗi get lịch hẹn by id:', err);
      const openFn = onOpenEditModal || onOpenCreateModal;
      if (aptData && openFn) {
        openFn(aptData);
      }
    }
  };

  const handleCheckin = async (apt) => {
    setActionLoadingId(apt.id);
    try {
      if (apt.id && !String(apt.id).startsWith('mock-')) {
        await updateAppointmentStatus(apt.id, 'WAITING');
      }
      setLocalAppointments((prev) =>
        prev.map((item) => (item.id === apt.id ? { ...item, status: 'WAITING', rawStatus: 'WAITING' } : item))
      );
      toast.success(`Đã check-in cho bệnh nhân ${apt.patientName}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Lỗi check-in:', err);
      toast.error('Không thể thực hiện check-in.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;

    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const extractYYYYMMDD = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        if (val.includes('T')) return val.split('T')[0];
        if (val.includes(' ')) return val.split(' ')[0];
        if (val.length >= 10) return val.substring(0, 10);
      }
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      } catch (e) {
        return null;
      }
    };

    return localAppointments.filter((apt) => {
      const dateVal = apt.appointmentDate || apt.appointmentTime;
      const aptDateStr = extractYYYYMMDD(dateVal);

      // 1. Date Scope Filter
      if (dateScope === 'today') {
        if (aptDateStr && aptDateStr !== todayStr) {
          return false;
        }
      } else if (dateScope === 'week') {
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime()) && (d < monday || d > sunday)) {
            return false;
          }
        }
      }

      // 2. Status Filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'confirmed')
        return apt.status === 'CONFIRMED' || apt.status === 'not-arrived';
      if (activeFilter === 'waiting')
        return apt.status === 'WAITING' || apt.status === 'waiting';
      if (activeFilter === 'called')
        return apt.status === 'CALLED' || apt.status === 'called';
      return true;
    });
  }, [localAppointments, activeFilter, dateScope]);

  // Reset page when filter changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
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

  const selectedApt = localAppointments.find((a) => a.id === selectedAptId);
  const isSelectedCheckedIn = selectedApt && !isReschedulableStatus(selectedApt.rawStatus || selectedApt.status);

  return (
    <div className="rounded-[4px] border border-slate-200 bg-white">
      {/* Header with filter tabs & action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Date Scope Toggle Pill */}
          <div className="flex items-center gap-1 rounded-[4px] bg-slate-100/90 p-0.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setDateScope('today');
                setCurrentPage(1);
              }}
              className={`rounded-[3px] px-2.5 py-1 text-[12px] font-bold transition-all ${dateScope === 'today'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => {
                setDateScope('week');
                setCurrentPage(1);
              }}
              className={`rounded-[3px] px-2.5 py-1 text-[12px] font-bold transition-all ${dateScope === 'week'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tuần này
            </button>
          </div>

          <h3 className="text-[15px] font-semibold text-slate-700">
            {dateScope === 'today' ? 'Lịch hẹn hôm nay' : 'Danh sách lịch hẹn trong tuần'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-[4px] bg-slate-100 p-0.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleFilterChange(tab.key)}
                className={`rounded-[3px] px-3 py-1 text-[12px] font-medium transition-colors ${activeFilter === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Header Action: Reschedule */}
          <button
            type="button"
            onClick={handleHeaderRescheduleClick}
            className={`flex items-center gap-1 rounded-[4px] border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs ${isSelectedCheckedIn
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              : selectedAptId
                ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer'
              }`}
            title={isSelectedCheckedIn ? 'Lịch hẹn đã check-in (Đang chờ khám), không thể đổi lịch' : 'Chọn 1 dòng và bấm Đổi lịch để chỉnh sửa'}
          >
            <Calendar size={13} />
            <span>Đổi lịch</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={handleTableRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Tải lại danh sách lịch hẹn"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'} />
              <span>Làm mới</span>
            </button>
          )}
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
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ghi chú
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((apt, idx) => {
              const statusConf = appointmentStatusConfig[apt.status] || appointmentStatusConfig.CONFIRMED;
              const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'not-arrived';
              const isCalled = apt.status === 'CALLED' || apt.status === 'called';
              const isWaiting = apt.status === 'WAITING' || apt.status === 'waiting';
              const isSelected = selectedAptId === apt.id;

              return (
                <tr
                  key={apt.id}
                  onClick={() => setSelectedAptId(apt.id)}
                  className={`border-b border-slate-50 transition-colors cursor-pointer ${isSelected
                    ? 'bg-amber-50/80 font-medium'
                    : 'hover:bg-slate-50/50'
                    } ${idx === paginatedRows.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Time */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-slate-700">
                      {apt.time}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                        {apt.patientName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">
                        {apt.phone}
                      </p>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-2.5">
                    <span className="text-[13px] text-slate-600">
                      {apt.service}
                    </span>
                  </td>

                  {/* Dentist */}
                  <td className="px-4 py-2.5">
                    <span className="text-[13px] text-slate-600">
                      {apt.dentist}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-[11px] font-medium leading-tight ${statusConf.className}`}
                    >
                      {statusConf.label}
                    </span>
                  </td>

                  {/* Ghi chú */}
                  <td className="px-4 py-2.5">
                    {isCalled ? (
                      <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                        {apt.calledInfo || `${apt.time} - ${apt.dentist} - ${apt.roomName || 'Phòng 101'}`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        {apt.notes || '-'}
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {isConfirmed ? (
                      <button
                        type="button"
                        disabled={actionLoadingId === apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckin(apt);
                        }}
                        className="inline-flex items-center gap-1 rounded-[3px] border border-teal-600 bg-teal-600 px-2.5 py-0.5 text-[11px] font-semibold text-white transition-all hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 cursor-pointer"
                      >
                        <UserCheck size={11} strokeWidth={2} />
                        Check-in
                      </button>
                    ) : isWaiting ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 rounded-[3px] border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                      >
                        <CheckCircle2 size={11} strokeWidth={1.8} />
                        Đã Check-in
                      </button>
                    ) : isCalled ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 rounded-[3px] border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 cursor-not-allowed"
                      >
                        <PhoneCall size={11} strokeWidth={1.8} />
                        Gọi vào
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 rounded-[3px] border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 cursor-not-allowed"
                      >
                        {statusConf.action}
                      </button>
                    )}
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
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-[3px] text-[12px] font-medium transition-colors ${page === safePage
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

