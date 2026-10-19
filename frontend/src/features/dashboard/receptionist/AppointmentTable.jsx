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
  XCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentStatusConfig } from './receptionistData';
import { updateAppointment, getAppointmentById } from '../../../services/appointment.service';
import AppointmentDetail from './action/AppointmentDetail';

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

export default function AppointmentTable({ appointments, onRefresh, onUpdateAppointment, onOpenEditModal, onOpenCreateModal }) {
  const [dateScope, setDateScope] = useState('today'); // 'today' | 'week'
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  // Selected row state for header reschedule action
  const [selectedAptId, setSelectedAptId] = useState(null);

  // Detail Modal state
  const [detailApt, setDetailApt] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = (apt) => {
    setDetailApt(apt);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailApt(null);
  };

  // Sync state when props change
  useMemo(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Cancel Appointment Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetApt, setCancelTargetApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleHeaderCancelClick = () => {
    let targetId = selectedAptId;
    if (!targetId) {
      if (filtered.length > 0) {
        targetId = filtered[0].id;
        setSelectedAptId(targetId);
      } else {
        toast.error('Vui lòng chọn 1 dòng lịch hẹn trong bảng để hủy lịch!');
        return;
      }
    }

    const aptData = localAppointments.find((a) => a.id === targetId);
    if (!aptData) {
      toast.error('Không tìm thấy thông tin lịch hẹn đã chọn!');
      return;
    }

    const isAlreadyCancelled =
      aptData.status === 'CANCELLED' ||
      aptData.status === 'cancelled' ||
      aptData.rawStatus === 'CANCELLED';

    if (isAlreadyCancelled) {
      toast.error('Lịch hẹn này đã ở trạng thái hủy!');
      return;
    }

    setCancelTargetApt(aptData);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetApt) return;
    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do hủy lịch hẹn!');
      return;
    }

    setIsCancelling(true);
    try {
      if (cancelTargetApt.id && !String(cancelTargetApt.id).startsWith('mock-')) {
        await updateAppointment(cancelTargetApt.id, { status: 'CANCELLED', notes: trimmedReason });
      }

      const updatedCancel = {
        ...cancelTargetApt,
        status: 'CANCELLED',
        rawStatus: 'CANCELLED',
        notes: trimmedReason,
      };

      setLocalAppointments((prev) =>
        prev.map((item) => (item.id === cancelTargetApt.id ? updatedCancel : item))
      );

      if (onUpdateAppointment) {
        onUpdateAppointment(updatedCancel);
      }

      toast.success(`Đã hủy lịch hẹn của bệnh nhân ${cancelTargetApt.patientName}!`);
      setIsCancelModalOpen(false);
      setCancelTargetApt(null);
      setCancelReason('');
    } catch (err) {
      console.error('Lỗi khi hủy lịch hẹn:', err);
      toast.error('Không thể hủy lịch hẹn, vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

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
      let updatedData = { ...apt, status: 'WAITING', rawStatus: 'WAITING' };
      if (apt.id && !String(apt.id).startsWith('mock-')) {
        const res = await updateAppointment(apt.id, { status: 'WAITING' });
        if (res) {
          updatedData = { ...updatedData, ...res };
        }
      }

      setLocalAppointments((prev) =>
        prev.map((item) => (item.id === apt.id ? { ...item, status: 'WAITING', rawStatus: 'WAITING' } : item))
      );

      // Cập nhật trực tiếp lên State Dashboard cha (không cần gọi lại API refresh)
      if (onUpdateAppointment) {
        onUpdateAppointment(updatedData);
      }

      toast.success(`Đã check-in cho bệnh nhân ${apt.patientName}!`);
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

  const handleHeaderCheckinClick = async () => {
    let targetId = selectedAptId;
    if (!targetId) {
      if (filtered.length > 0) {
        targetId = filtered[0].id;
        setSelectedAptId(targetId);
      } else {
        toast.error('Vui lòng chọn 1 dòng lịch hẹn trong bảng để check-in!');
        return;
      }
    }

    const aptData = localAppointments.find((a) => a.id === targetId);
    if (!aptData) {
      toast.error('Không tìm thấy thông tin lịch hẹn đã chọn!');
      return;
    }

    const st = aptData.rawStatus || aptData.status;
    if (st === 'CANCELLED' || st === 'cancelled') {
      toast.error('Lịch hẹn này đã bị hủy, không thể check-in!');
      return;
    }

    if (
      st === 'WAITING' || st === 'waiting' ||
      st === 'CALLED' || st === 'called' ||
      st === 'IN_PROGRESS' || st === 'in-progress' ||
      st === 'COMPLETED' || st === 'completed'
    ) {
      toast.error(`Bệnh nhân ${aptData.patientName} đã check-in trước đó!`);
      return;
    }

    await handleCheckin(aptData);
  };

  const selectedApt = localAppointments.find((a) => a.id === selectedAptId);
  const isSelectedCheckedIn = selectedApt && (
    selectedApt.status === 'WAITING' || selectedApt.status === 'waiting' ||
    selectedApt.status === 'CALLED' || selectedApt.status === 'called' ||
    selectedApt.status === 'IN_PROGRESS' || selectedApt.status === 'in-progress' ||
    selectedApt.status === 'COMPLETED' || selectedApt.status === 'completed'
  );
  const isSelectedCancelled = selectedApt && (
    selectedApt.status === 'CANCELLED' || selectedApt.status === 'cancelled' || selectedApt.rawStatus === 'CANCELLED'
  );

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

          {/* Header Action: Check-in (Nằm giữa Đổi lịch và Hủy lịch) */}
          <button
            type="button"
            disabled={actionLoadingId === selectedAptId || isSelectedCheckedIn || isSelectedCancelled}
            onClick={handleHeaderCheckinClick}
            className={`flex items-center gap-1 rounded-[4px] border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs ${
              isSelectedCheckedIn
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-not-allowed opacity-90'
                : isSelectedCancelled
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : selectedAptId
                    ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-xs'
                    : 'border-teal-400 bg-teal-50 text-teal-800 hover:bg-teal-100 cursor-pointer'
            }`}
            title={
              isSelectedCheckedIn
                ? 'Bệnh nhân này đã check-in'
                : isSelectedCancelled
                  ? 'Lịch hẹn đã bị hủy'
                  : 'Chọn 1 dòng và bấm Check-in để tiếp nhận bệnh nhân'
            }
          >
            {actionLoadingId === selectedAptId ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : isSelectedCheckedIn ? (
              <CheckCircle2 size={13} />
            ) : (
              <UserCheck size={13} />
            )}
            <span>{isSelectedCheckedIn ? 'Đã Check-in' : 'Check-in'}</span>
          </button>

          {/* Header Action: Cancel Appointment */}
          <button
            type="button"
            onClick={handleHeaderCancelClick}
            className={`flex items-center gap-1 rounded-[4px] border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs ${selectedApt && (selectedApt.status === 'CANCELLED' || selectedApt.rawStatus === 'CANCELLED')
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              : selectedAptId
                ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 cursor-pointer'
                : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
              }`}
            title="Chọn 1 dòng và bấm Hủy lịch để hủy ca khám"
          >
            <XCircle size={13} />
            <span>Hủy lịch</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="w-[70px] px-3.5 py-2.5 text-left">Giờ</th>
              <th className="w-[22%] px-3.5 py-2.5 text-left">Bệnh nhân</th>
              <th className="w-[28%] px-3.5 py-2.5 text-left">Dịch vụ</th>
              <th className="w-[22%] px-3.5 py-2.5 text-left">Bác sĩ</th>
              <th className="w-[125px] px-3.5 py-2.5 text-left">Trạng thái</th>
              <th className="px-3.5 py-2.5 text-left">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((apt, idx) => {
              const statusConf = appointmentStatusConfig[apt.status] || appointmentStatusConfig.CONFIRMED;
              const isCancelled = apt.status === 'CANCELLED' || apt.status === 'cancelled' || apt.rawStatus === 'CANCELLED';
              const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'not-arrived';
              const isCalled = apt.status === 'CALLED' || apt.status === 'called';
              const isInProgress = apt.status === 'IN_PROGRESS' || apt.status === 'in-progress';
              const isWaiting = apt.status === 'WAITING' || apt.status === 'waiting';
              const isSelected = selectedAptId === apt.id;

              return (
                <tr
                  key={apt.id}
                  onClick={() => setSelectedAptId(apt.id)}
                  onDoubleClick={() => handleOpenDetail(apt)}
                  title="Click để chọn dòng. Click 2 lần để mở chi tiết ca khám"
                  className={`border-b border-slate-100/80 transition-colors cursor-pointer ${isSelected
                    ? 'bg-teal-50/80 border-l-4 border-l-teal-600 font-medium'
                    : 'hover:bg-slate-50/70 border-l-4 border-l-transparent'
                    } ${idx === paginatedRows.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Time */}
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <span className="text-[13px] font-semibold text-slate-700">
                      {apt.time}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate" title={apt.patientName}>
                        {apt.patientName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 leading-tight truncate">
                        {apt.phone}
                      </p>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    <span className="text-[13px] text-slate-600 block truncate" title={apt.service}>
                      {apt.service}
                    </span>
                  </td>

                  {/* Dentist */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    <span className="text-[13px] text-slate-600 block truncate" title={apt.dentist}>
                      {apt.dentist}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3.5 py-2.5 whitespace-nowrap overflow-hidden">
                    <span
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-[11px] font-medium leading-tight ${statusConf.className}`}
                    >
                      {statusConf.label}
                    </span>
                  </td>

                  {/* Ghi chú */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    {isCancelled ? (
                      <span
                        className="text-[11px] text-rose-600 font-medium block truncate"
                        title={apt.notes ? `Lý do hủy: ${apt.notes}` : 'Đã hủy lịch'}
                      >
                        {apt.notes || 'Đã hủy lịch'}
                      </span>
                    ) : isCalled || isInProgress ? (
                      <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200 truncate max-w-full" title={apt.roomName || 'Phòng 101'}>
                        {`${apt.roomName || 'Phòng 101'}`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 block truncate" title={apt.notes || '-'}>
                        {apt.notes || '-'}
                      </span>
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

      {/* Appointment Detail Modal (ERP Design) */}
      <AppointmentDetail
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        appointment={detailApt}
        onCheckin={handleCheckin}
      />

      {/* Modal Nhập lý do hủy lịch hẹn (ERP Design) */}
      {isCancelModalOpen && cancelTargetApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[4px] border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-rose-50/70 px-4 py-3">
              <div className="flex items-center gap-2 text-rose-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-rose-100 border border-rose-200">
                  <XCircle size={16} className="text-rose-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Xác nhận hủy lịch hẹn</h4>
                  <p className="text-[11px] text-slate-500">Trạng thái lịch sẽ chuyển sang Đã hủy và lưu lý do</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCancelling) {
                    setIsCancelModalOpen(false);
                    setCancelTargetApt(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 rounded-[3px] p-1 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3">
              {/* Target Appointment Info */}
              <div className="rounded-[4px] border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bệnh nhân:</span>
                  <span className="font-bold text-slate-800">{cancelTargetApt.patientName} ({cancelTargetApt.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className="font-semibold text-slate-700">
                    {cancelTargetApt.time} - {cancelTargetApt.appointmentDate ? String(cancelTargetApt.appointmentDate).split('T')[0] : 'Hôm nay'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bác sĩ:</span>
                  <span className="font-semibold text-slate-700">{cancelTargetApt.dentist}</span>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lý do hủy lịch khám <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy ca khám (Ví dụ: Bệnh nhân bận việc đột xuất, đổi ý không đến...)"
                  className="w-full rounded-[4px] border border-slate-200 p-2 text-xs text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                  autoFocus
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-slate-500">Gợi ý lý do nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Bệnh nhân bận đột xuất',
                    'Bệnh nhân đổi lịch hẹn khác',
                    'Không liên lạc được bệnh nhân',
                    'Bệnh nhân yêu cầu hủy',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCancelReason(chip)}
                      className="rounded-[3px] border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelTargetApt(null);
                }}
                className="rounded-[4px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                disabled={isCancelling || !cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 rounded-[4px] border border-rose-600 bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    <span>Xác nhận hủy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

