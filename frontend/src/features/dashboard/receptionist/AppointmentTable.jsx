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

const formatDisplayDate = (dateVal, timeVal) => {
  const raw = dateVal || timeVal;
  if (!raw) return '';
  if (typeof raw === 'string') {
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  } catch (e) {
    // ignore
  }
  return '';
};

const formatRoomDisplay = (room) => {
  if (!room) return 'Chưa xếp phòng';
  const str = String(room).trim();
  if (!str) return 'Chưa xếp phòng';
  if (/^phòng/i.test(str)) return str;
  return `Phòng ${str}`;
};

const isReschedulableStatus = (status) => {
  if (!status) return true;
  const s = String(status).toUpperCase();
  return s === 'CONFIRMED' || s === 'PENDING' || status === 'not-arrived';
};

const isWithinOneHourOfCreation = (createdAt) => {
  if (!createdAt) return true;
  try {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return true;
    const now = Date.now();
    return (now - createdTime) <= 60 * 60 * 1000;
  } catch (e) {
    return true;
  }
};

export default function AppointmentTable({ appointments, onRefresh, onUpdateAppointment, onOpenEditModal, onOpenCreateModal, appointmentDate, onAppointmentDateChange, appointmentsLoading = false, appointmentsError = null, appointmentSearch, onSearchAppointments }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localAppointments, setLocalAppointments] = useState(appointments);

  // Selected row state for header reschedule action
  const [selectedAptId, setSelectedAptId] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const submitPhoneSearch = (event) => {
    event.preventDefault();
    const phone = phoneInput.trim();
    const normalized = phone.replace(/[^0-9]/g, '').replace(/^84/, '0');
    if (phone && (!/^[+0-9\s().-]+$/.test(phone) || !/^0[0-9]{9,10}$/.test(normalized))) {
      toast.error('Vui lòng nhập đầy đủ số điện thoại hợp lệ.');
      return;
    }
    setCurrentPage(1);
    setSelectedAptId(null);
    setActiveFilter('all');
    onSearchAppointments(phone, false);
  };
  const clearPhoneSearch = () => {
    setPhoneInput('');
    setCurrentPage(1);
    setSelectedAptId(null);
    onSearchAppointments('', false);
  };
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const changeDate = (date) => {
    if (!date || (date === appointmentDate && !appointmentSearch.allDates)) return;
    setCurrentPage(1);
    setSelectedAptId(null);
    onAppointmentDateChange(date);
  };
  const shiftDate = (offset) => {
    const date = new Date(`${appointmentDate}T00:00:00`);
    date.setDate(date.getDate() + offset);
    changeDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

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

      if (aptData.createdAt && !isWithinOneHourOfCreation(aptData.createdAt)) {
        toast.error('Lịch hẹn chỉ được phép sửa trong vòng 1 giờ kể từ thời điểm tạo (createdAt). Đã quá 1 giờ, không thể sửa!');
        return;
      }
    }

    try {
      let fullAptData = aptData;
      if (targetId && !String(targetId).startsWith('mock-')) {
        const fetched = await getAppointmentById(targetId).catch(() => null);
        if (fetched) {
          fullAptData = { ...fullAptData, ...fetched };
          if (fullAptData.createdAt && !isWithinOneHourOfCreation(fullAptData.createdAt)) {
            toast.error('Lịch hẹn chỉ được phép sửa trong vòng 1 giờ kể từ thời điểm tạo (createdAt). Đã quá 1 giờ, không thể sửa!');
            return;
          }
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
      let updatedData = { ...apt, status: 'WAITING', rawStatus: 'WAITING', isCheck: true };
      if (apt.id && !String(apt.id).startsWith('mock-')) {
        const res = await updateAppointment(apt.id, { status: 'WAITING' });
        if (res) {
          updatedData = { ...updatedData, ...res };
        }
      }

      setLocalAppointments((prev) =>
        prev.map((item) => (item.id === apt.id ? { ...item, ...updatedData, rawStatus: updatedData.status } : item))
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
    return localAppointments.filter((apt) => {
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
  }, [localAppointments, activeFilter]);

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
  const isSelectedOverOneHour = Boolean(
    selectedApt && selectedApt.createdAt && !isWithinOneHourOfCreation(selectedApt.createdAt)
  );
  const isRescheduleDisabled = isSelectedCheckedIn || isSelectedCancelled || isSelectedOverOneHour;

  return (
    <div className="rounded-[4px] border border-slate-200 bg-white">
      {/* Header with filter tabs & action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {appointmentSearch.allDates ? (
              <>
                <span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">Tất cả ngày</span>
                <button type="button" onClick={() => changeDate(appointmentDate)} className="text-xs text-teal-700 underline">
                  Về ngày {formatDisplayDate(appointmentDate)}
                </button>
              </>
            ) : <>
              <label htmlFor="appointment-date" className="mr-1 text-xs font-semibold text-slate-600">Ngày hẹn</label>
              <button type="button" onClick={() => shiftDate(-1)} title="Ngày trước" aria-label="Ngày trước"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100">
                <ChevronLeft size={15} />
              </button>
              <input id="appointment-date" type="date" value={appointmentDate}
                onChange={(e) => changeDate(e.target.value)}
                className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/20" />
              <button type="button" onClick={() => shiftDate(1)} title="Ngày tiếp theo" aria-label="Ngày tiếp theo"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100">
                <ChevronRight size={15} />
              </button>
              <button type="button" onClick={() => changeDate(todayStr)} disabled={appointmentDate === todayStr}
                className="h-7 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-teal-50 disabled:bg-teal-50 disabled:text-teal-800">
                Hôm nay
              </button>
            </>}
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
            disabled={isRescheduleDisabled}
            onClick={handleHeaderRescheduleClick}
            className={`flex items-center gap-1 rounded-[4px] border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs ${isRescheduleDisabled
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              : selectedAptId
                ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer'
              }`}
            title={
              isSelectedCheckedIn
                ? 'Lịch hẹn đã check-in (Đang chờ khám), không thể đổi lịch'
                : isSelectedCancelled
                  ? 'Lịch hẹn đã bị hủy, không thể đổi lịch'
                  : isSelectedOverOneHour
                    ? 'Lịch hẹn đã quá 1 giờ kể từ thời điểm tạo (createdAt), không được phép chỉnh sửa'
                    : selectedAptId
                      ? 'Bấm Đổi lịch để chỉnh sửa ca khám này'
                      : 'Chọn 1 dòng và bấm Đổi lịch để chỉnh sửa'
            }
          >
            <Calendar size={13} />
            <span>Đổi lịch</span>
          </button>

          {/* Header Action: Check-in (Nằm giữa Đổi lịch và Hủy lịch) */}
          <button
            type="button"
            disabled={actionLoadingId === selectedAptId || isSelectedCheckedIn || isSelectedCancelled}
            onClick={handleHeaderCheckinClick}
            className={`flex items-center gap-1 rounded-[4px] border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs ${isSelectedCheckedIn
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

      <form onSubmit={submitPhoneSearch} className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <label htmlFor="appointment-phone" className="text-xs font-semibold text-slate-600">Số điện thoại</label>
        <input id="appointment-phone" type="tel" maxLength={50} value={phoneInput}
          placeholder="Nhập SĐT đã đặt lịch"
          onChange={(event) => {
            setPhoneInput(event.target.value);
            if (!event.target.value.trim()) clearPhoneSearch();
          }}
          className="h-8 w-48 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-teal-600" />
        <button type="submit" className="h-8 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800">Tìm kiếm</button>
        {(phoneInput || appointmentSearch.phone) && <button type="button" onClick={clearPhoneSearch}
          className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-600">Xóa tìm kiếm</button>}
        {appointmentSearch.phone && <span className="text-xs text-slate-500">Kết quả cho SĐT: {appointmentSearch.phone}</span>}
        {appointmentSearch.phone && !appointmentSearch.allDates && <button type="button"
          onClick={() => {
            setCurrentPage(1);
            setSelectedAptId(null);
            setActiveFilter('all');
            onSearchAppointments(appointmentSearch.phone, true);
          }} className="text-xs font-semibold text-teal-700 underline">Tìm tất cả ngày</button>}
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="w-[105px] px-3.5 py-2.5 text-left">Thời gian</th>
              <th className="w-[18%] px-3.5 py-2.5 text-left">Bệnh nhân</th>
              <th className="w-[30%] px-3.5 py-2.5 text-left">Dịch vụ</th>
              <th className="w-[20%] px-3.5 py-2.5 text-left">Bác sĩ</th>
              <th className="w-[130px] px-3.5 py-2.5 text-left">Trạng thái</th>
              <th className="w-[80px] px-3 py-2.5 text-center">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((apt, idx) => {
              const statusConf = appointmentStatusConfig[apt.status] || appointmentStatusConfig.CONFIRMED;
              const isSelected = selectedAptId === apt.id;

              const now = new Date();
              const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
              const displayDate = formatDisplayDate(apt.appointmentDate || apt.appointmentTime || apt.date) || todayFormatted;

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
                  {/* Time & Date */}
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-slate-800 leading-tight">
                        {apt.time || '--:--'}
                      </span>
                      <span className="mt-0.5 text-[11px] font-medium text-slate-400 leading-tight">
                        {displayDate}
                      </span>
                    </div>
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
                      {(apt.appointmentCode || apt.code) && (
                        <p className="mt-0.5 text-[10.5px] font-mono font-bold text-teal-700 leading-tight truncate">
                          {apt.appointmentCode || apt.code}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    <span className="text-[13px] text-slate-600 block truncate" title={apt.service}>
                      {apt.service || 'Khám tổng quát'}
                    </span>
                  </td>

                  {/* Dentist */}
                  <td className="px-3.5 py-2.5 overflow-hidden">
                    <span className="text-[13px] text-slate-600 block truncate" title={apt.dentist}>
                      {apt.dentist || 'Chưa phân công'}
                    </span>
                  </td>

                  {/* Status & Room */}
                  <td className="px-3.5 py-2.5 whitespace-nowrap overflow-hidden">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-[3px] px-2 py-0.5 text-[11px] font-medium leading-tight ${statusConf.className}`}
                      >
                        {statusConf.label}
                      </span>
                      <span
                        className="text-[11px] font-medium text-slate-500 truncate max-w-full"
                        title={formatRoomDisplay(apt.roomName || apt.room || apt.roomNumber)}
                      >
                        {formatRoomDisplay(apt.roomName || apt.room || apt.roomNumber)}
                      </span>
                    </div>
                  </td>

                  {/* Ghi chú: Chấm xanh nếu có nội dung (click để mở view chi tiết), chấm xám nếu không có */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    {apt.notes && apt.notes.trim() ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(apt);
                        }}
                        className="group inline-flex items-center justify-center p-1.5 rounded-full hover:bg-emerald-50 transition-all cursor-pointer"
                        title={`Ghi chú: ${apt.notes} (Click để xem chi tiết)`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs ring-2 ring-emerald-200 group-hover:scale-125 transition-transform" />
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center p-1.5 cursor-default"
                        title="Không có ghi chú"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
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
      {appointmentsLoading && <p role="status" className="px-4 py-6 text-center text-sm text-slate-500">Đang tải lịch hẹn...</p>}
      {!appointmentsLoading && appointmentsError && <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">Không thể tải lịch hẹn. Vui lòng bấm làm mới để thử lại.</p>}
      {!appointmentsLoading && !appointmentsError && filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-[13px] text-slate-400">
          {appointmentSearch.phone
            ? `Không có lịch hẹn phù hợp với SĐT ${appointmentSearch.phone}${appointmentSearch.allDates ? '' : ` trong ngày ${formatDisplayDate(appointmentDate)}`}.`
            : 'Không có lịch hẹn phù hợp với bộ lọc.'}
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

