import { useState, useMemo, useEffect } from 'react';
import AppointmentDetail from '../receptionist/action/AppointmentDetail';
import {
  Search,
  RefreshCw,
  AlertCircle,
  PhoneCall,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';

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
  } catch (e) { }
  return '';
};

const formatRoomDisplay = (room) => {
  if (!room) return 'Chưa xếp phòng';
  const str = String(room).trim();
  if (!str) return 'Chưa xếp phòng';
  if (/^phòng/i.test(str)) return str;
  return `Phòng ${str}`;
};

const ITEMS_PER_PAGE = 5;

export default function AppointmentTable({
  appointments = [],
  selectedDate,
  onDateChange,
  loading = false,
  activePatientInfo = null,
  onSelectPatient = () => { },
  actionLoadingId = null,
  onCallIn = () => { },
  onStartTreatment = () => { },
  onOpenExamModal = () => { },
  onStatusChange = () => { },
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, WAITING, CALLED, IN_PROGRESS, COMPLETED
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal state
  const [detailApt, setDetailApt] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, activeTab, searchTerm, sortOrder]);

  const handleOpenDetail = (apt) => {
    let timeStr = '09:00';
    if (apt.appointmentTime) {
      try {
        const d = new Date(apt.appointmentTime);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        timeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
      }
    }
    setDetailApt({
      ...apt,
      time: timeStr,
      service: apt.service || apt.reason || 'Tư vấn nha khoa',
      dentist: apt.dentist || apt.dentistName || 'Bác sĩ điều trị',
      roomName: formatRoomDisplay(apt.roomName || apt.room || apt.roomNumber),
    });
    setIsDetailOpen(true);
  };

  const shiftDate = (days) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    onDateChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  // Filter the selected day's API results by search and status.
  const sortedAndFilteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = appointments.filter((apt) => {
      if (term) {
        const matchesSearch =
          (apt.patientName && apt.patientName.toLowerCase().includes(term)) ||
          (apt.phone && apt.phone.includes(term)) ||
          (apt.patientCode && apt.patientCode.toLowerCase().includes(term)) ||
          (apt.reason && apt.reason.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      if (activeTab === 'WAITING') {
        const isW = apt.status === 'WAITING' || apt.status === 'CONFIRMED' || apt.status === 'PENDING' || apt.status === 'not-arrived';
        if (!isW) return false;
      } else if (activeTab === 'CALLED') {
        if (apt.status !== 'CALLED') return false;
      } else if (activeTab === 'IN_PROGRESS') {
        if (apt.status !== 'IN_PROGRESS') return false;
      } else if (activeTab === 'COMPLETED') {
        if (apt.status !== 'COMPLETED') return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const timeA = new Date(a.appointmentTime || a.appointmentDate || 0).getTime();
      const timeB = new Date(b.appointmentTime || b.appointmentDate || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [appointments, searchTerm, activeTab, sortOrder]);

  const totalCount = appointments.length;
  const waitingCount = appointments.filter(
    (a) => a.status === 'WAITING' || a.status === 'CONFIRMED' || a.status === 'PENDING' || a.status === 'not-arrived'
  ).length;
  const calledCount = appointments.filter((a) => a.status === 'CALLED').length;
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  // Pagination calculations (strictly 5 items per page)
  const totalFiltered = sortedAndFilteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalFiltered);
  const paginatedAppointments = sortedAndFilteredAppointments.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const isFilterActive = searchTerm !== '' || activeTab !== 'ALL' || sortOrder !== 'asc';

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveTab('ALL');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return (
    <div className="min-w-0 flex-[7] rounded-lg border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between w-full">
      <div>
        {/* Selected date and total */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Danh sách lịch hẹn ngày {formatDisplayDate(selectedDate)}
            </h2>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-teal-800">{totalCount}</strong> ca khám
          </span>
        </div>

        {/* Search, appointment date, sort order and reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-slate-50/80 p-2.5 rounded-md border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 sm:shrink-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên bệnh nhân, SĐT, lý do..."
                className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-xs">
              <Calendar size={14} className="text-teal-700" />
              <label htmlFor="dentist-appointment-date" className="font-medium text-slate-700">Ngày khám</label>
              <button type="button" aria-label="Ngày trước" onClick={() => shiftDate(-1)}
                className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-100">
                <ChevronLeft size={14} />
              </button>
              <input id="dentist-appointment-date" type="date" value={selectedDate}
                onChange={(e) => { if (e.target.value) onDateChange(e.target.value); }}
                className="bg-transparent text-slate-700 focus:outline-none" />
              <button type="button" aria-label="Ngày tiếp theo" onClick={() => shiftDate(1)}
                className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-100">
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Sort Order Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-xs">
              <Clock size={13} className="text-slate-400 shrink-0" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="asc">Giờ: Sớm nhất trước</option>
                <option value="desc">Giờ: Muộn nhất trước</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw size={12} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1 mb-3">
          {[
            { key: 'ALL', label: `Tất cả (${totalCount})` },
            { key: 'WAITING', label: `Chờ khám (${waitingCount})` },
            { key: 'CALLED', label: `Đã gọi (${calledCount})` },
            { key: 'IN_PROGRESS', label: `Đang điều trị (${inProgressCount})` },
            { key: 'COMPLETED', label: `Hoàn tất (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${activeTab === tab.key
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table view */}
        <div className="overflow-x-auto rounded-md border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="w-[95px] py-2.5 pl-3 font-bold whitespace-nowrap">Thời gian</th>
                <th className="w-[150px] py-2.5 font-bold whitespace-nowrap">Bệnh nhân</th>
                <th className="py-2.5 font-bold min-w-[170px]">Lý do / Dịch vụ</th>
                <th className="w-[115px] py-2.5 font-bold text-center whitespace-nowrap">Trạng thái</th>
                <th className="w-[115px] py-2.5 font-bold text-center whitespace-nowrap">Phòng</th>
                <th className="w-[125px] py-2.5 font-bold text-right pr-3 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-teal-600" />
                    Đang tải danh sách lịch khám...
                  </td>
                </tr>
              ) : paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <AlertCircle size={26} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="font-medium text-slate-600">Không tìm thấy ca khám nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Thử điều chỉnh lại từ khóa hoặc bộ lọc</p>
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => {
                  let timeStr = '09:00';
                  if (apt.appointmentTime) {
                    try {
                      const d = new Date(apt.appointmentTime);
                      timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    } catch (e) {
                      timeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
                    }
                  }

                  const now = new Date();
                  const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                  const displayDate = formatDisplayDate(apt.appointmentDate || apt.appointmentTime || apt.date) || todayFormatted;

                  const isExecuting = actionLoadingId === apt.id;
                  const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'PENDING' || apt.status === 'not-arrived';
                  const isWaiting = apt.status === 'WAITING';
                  const isCalled = apt.status === 'CALLED';
                  const isInProgress = apt.status === 'IN_PROGRESS';
                  const isCompleted = apt.status === 'COMPLETED';
                  const isSelected = activePatientInfo?.id === apt.id;

                  return (
                    <tr
                      key={apt.id}
                      onClick={() => onSelectPatient(apt)}
                      onDoubleClick={() => handleOpenDetail(apt)}
                      title="Click để chọn dòng. Nhấp đúp (2 lần) để xem chi tiết lịch hẹn"
                      className={`cursor-pointer transition-colors ${isSelected
                        ? 'bg-teal-50/70 border-l-4 border-l-teal-600 font-semibold shadow-2xs'
                        : 'hover:bg-slate-50/70'
                        }`}
                    >
                      {/* Time & Date */}
                      <td className="w-[95px] py-3 whitespace-nowrap pl-3">
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <Clock size={12} className="text-teal-600 shrink-0" />
                            {timeStr}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium pl-4">{displayDate}</p>
                        </div>
                      </td>

                      {/* Patient Name & Phone */}
                      <td className="w-[150px] py-3 whitespace-nowrap pr-2">
                        <div>
                          <p className="font-bold text-slate-800 truncate" title={apt.patientName}>{apt.patientName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{apt.phone || 'Chưa có SĐT'}</p>
                        </div>
                      </td>

                      {/* Service / Reason */}
                      <td className="py-3 text-slate-700 font-medium break-words leading-relaxed pr-3">
                        <span className="line-clamp-2">{apt.reason || apt.service || 'Tư vấn nha khoa'}</span>
                      </td>

                      {/* Status */}
                      <td className="w-[115px] py-3 whitespace-nowrap text-center">
                        {isConfirmed && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            Chưa đến
                          </span>
                        )}
                        {isWaiting && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                            Chờ khám
                          </span>
                        )}
                        {isCalled && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                            Đã gọi vào
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                            Đang điều trị
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            Hoàn tất
                          </span>
                        )}
                        {apt.status === 'CANCELLED' && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                            Đã hủy
                          </span>
                        )}
                      </td>

                      {/* Room */}
                      <td className="w-[115px] py-3 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                          {formatRoomDisplay(apt.roomName || apt.room || apt.roomNumber)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="w-[125px] py-3 text-right whitespace-nowrap pr-3" onClick={(e) => e.stopPropagation()}>
                        {isConfirmed && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-md bg-amber-50/70 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/80 cursor-default opacity-85 select-none"
                          >
                            Chưa đến
                          </button>
                        )}

                        {isWaiting && (
                          <button
                            type="button"
                            onClick={() => onCallIn(apt)}
                            disabled={isExecuting}
                            className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-100 hover:text-purple-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            <PhoneCall size={12} /> Gọi vào
                          </button>
                        )}

                        {isCalled && (
                          <button
                            type="button"
                            onClick={() => onStartTreatment(apt)}
                            disabled={isExecuting}
                            className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Stethoscope size={12} /> Điều trị
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(apt.id, 'COMPLETED')}
                            disabled={isExecuting}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 size={12} /> Hoàn tất
                          </button>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center justify-center rounded-md bg-emerald-50/60 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60 cursor-default opacity-85 select-none">
                            Đã hoàn thành
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer (5 dòng mỗi trang) */}
      <div className="pt-3.5 border-t border-slate-100 mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-800">{startIndex} - {endIndex}</strong> trên <strong className="text-slate-800">{totalFiltered}</strong> ca khám
          </span>
          {isFilterActive && (
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">
              Đang lọc
            </span>
          )}
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            // Hiển thị gọn nếu nhiều trang
            if (
              totalPages > 7 &&
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - safeCurrentPage) > 1
            ) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            }

            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`flex h-7 min-w-[28px] px-1.5 items-center justify-center rounded-md text-xs font-bold transition-all cursor-pointer ${isActive
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Appointment Detail Modal (ERP Design) khi double click */}
      <AppointmentDetail
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailApt(null);
        }}
        appointment={detailApt}
      />
    </div>
  );
}
