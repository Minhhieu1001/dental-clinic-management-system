import { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  AlertCircle,
  PhoneCall,
  Stethoscope,
} from 'lucide-react';

export default function AppointmentTable({
  appointments = [],
  loading = false,
  activePatientInfo = null,
  onSelectPatient = () => {},
  actionLoadingId = null,
  onCallIn = () => {},
  onStartTreatment = () => {},
  onOpenExamModal = () => {},
  onStatusChange = () => {},
}) {
  const [dateScope, setDateScope] = useState('today'); // 'today' | 'week'
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, WAITING, CALLED, IN_PROGRESS, COMPLETED
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc lịch hẹn theo dateScope ('today' | 'week')
  const dateScopedAppointments = useMemo(() => {
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

    return appointments.filter((apt) => {
      const dateVal = apt.appointmentDate || apt.appointmentTime;
      const aptDateStr = extractYYYYMMDD(dateVal);

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
      return true;
    });
  }, [appointments, dateScope]);

  // Filtered appointments by search term & activeTab
  const filteredAppointments = useMemo(() => {
    return dateScopedAppointments.filter((apt) => {
      const matchesSearch =
        (apt.patientName && apt.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.phone && apt.phone.includes(searchTerm)) ||
        (apt.patientCode && apt.patientCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.reason && apt.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'WAITING') {
        return apt.status === 'WAITING' || apt.status === 'CONFIRMED' || apt.status === 'PENDING' || apt.status === 'not-arrived';
      }
      if (activeTab === 'CALLED') {
        return apt.status === 'CALLED';
      }
      if (activeTab === 'IN_PROGRESS') {
        return apt.status === 'IN_PROGRESS';
      }
      if (activeTab === 'COMPLETED') {
        return apt.status === 'COMPLETED';
      }
      return true;
    });
  }, [dateScopedAppointments, searchTerm, activeTab]);

  const totalToday = dateScopedAppointments.length;
  const waitingCount = dateScopedAppointments.filter(
    (a) => a.status === 'WAITING' || a.status === 'CONFIRMED' || a.status === 'PENDING' || a.status === 'not-arrived'
  ).length;
  const calledCount = dateScopedAppointments.filter((a) => a.status === 'CALLED').length;
  const inProgressCount = dateScopedAppointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = dateScopedAppointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="min-w-0 flex-[7] rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between w-full">
      <div>
        {/* Header: Nút chọn Ngày/Tuần & Tìm kiếm */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Date Scope Toggle Pill */}
            <div className="flex items-center gap-1 rounded-[4px] bg-slate-100/90 p-0.5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setDateScope('today')}
                className={`rounded-[3px] px-2.5 py-1 text-[11px] font-bold transition-all ${
                  dateScope === 'today'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setDateScope('week')}
                className={`rounded-[3px] px-2.5 py-1 text-[11px] font-bold transition-all ${
                  dateScope === 'week'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần này
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-800">
              {dateScope === 'today' ? 'Lịch hẹn hôm nay' : 'Danh sách bệnh nhân theo tuần'}
            </h2>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bệnh nhân..."
              className="w-full sm:w-44 rounded-[4px] border border-slate-200 bg-slate-50/50 pl-7 pr-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-[4px] bg-slate-100 p-1 mb-3">
          {[
            { key: 'ALL', label: `Tất cả (${totalToday})` },
            { key: 'WAITING', label: `Chờ khám (${waitingCount})` },
            { key: 'CALLED', label: `Đã gọi (${calledCount})` },
            { key: 'IN_PROGRESS', label: `Đang điều trị (${inProgressCount})` },
            { key: 'COMPLETED', label: `Hoàn tất (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-[4px] px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                <th className="pb-2.5 font-semibold pl-1">Giờ</th>
                <th className="pb-2.5 font-semibold">Bệnh nhân</th>
                <th className="pb-2.5 font-semibold">Dịch vụ</th>
                <th className="pb-2.5 font-semibold">Trạng thái</th>
                <th className="pb-2.5 font-semibold text-right pr-1">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw size={20} className="mx-auto mb-1 animate-spin text-teal-600" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <AlertCircle size={24} className="mx-auto mb-1 text-slate-300" />
                    Hiện chưa có lịch khám phù hợp.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  let timeStr = '09:00';
                  if (apt.appointmentTime) {
                    try {
                      const d = new Date(apt.appointmentTime);
                      timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    } catch (e) {
                      timeStr = String(apt.appointmentTime).substring(11, 16) || '09:00';
                    }
                  }

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
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-50/70 border-l-2 border-l-teal-600 font-semibold'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Time */}
                      <td className="py-2.5 font-semibold text-slate-600 whitespace-nowrap pl-1">{timeStr}</td>

                      {/* Patient */}
                      <td className="py-2.5 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-800">{apt.patientName}</p>
                          <p className="text-[10px] text-slate-400">{apt.phone}</p>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-2.5 text-slate-600 font-medium max-w-[140px] truncate">
                        {apt.reason || 'Tư vấn nha khoa'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 whitespace-nowrap">
                        {isConfirmed && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Chưa đến
                          </span>
                        )}
                        {isWaiting && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            Đang chờ khám
                          </span>
                        )}
                        {isCalled && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                            Đã gọi
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Đang điều trị
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                            Hoàn thành
                          </span>
                        )}
                        {apt.status === 'CANCELLED' && (
                          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            Đã hủy
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 text-right whitespace-nowrap pr-1" onClick={(e) => e.stopPropagation()}>
                        {isConfirmed && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1 rounded-[3px] bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                          >
                            Chưa đến
                          </button>
                        )}

                        {isWaiting && (
                          <button
                            type="button"
                            onClick={() => onCallIn(apt)}
                            disabled={isExecuting}
                            className="inline-flex items-center gap-1 rounded-[3px] bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs hover:bg-purple-700 transition-colors"
                          >
                            <PhoneCall size={11} /> Gọi vào
                          </button>
                        )}

                        {isCalled && (
                          <button
                            type="button"
                            onClick={() => onStartTreatment(apt)}
                            disabled={isExecuting}
                            className="inline-flex items-center gap-1 rounded-[3px] bg-teal-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs hover:bg-teal-700 transition-colors animate-pulse"
                          >
                            <Stethoscope size={11} /> Điều trị
                          </button>
                        )}

                        {isInProgress && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenExamModal(apt)}
                              className="rounded-[3px] border border-teal-600 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                            >
                              Hồ sơ
                            </button>
                            <button
                              type="button"
                              onClick={() => onStatusChange(apt.id, 'COMPLETED')}
                              disabled={isExecuting}
                              className="rounded-[3px] bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                            >
                              Xong
                            </button>
                          </div>
                        )}

                        {apt.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => onOpenExamModal(apt)}
                            className="rounded-[3px] border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Xem
                          </button>
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

      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className="text-xs font-bold text-teal-700 hover:underline"
        >
          Xem tất cả lịch hẹn &rarr;
        </button>
      </div>
    </div>
  );
}
