import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Phone,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  XCircle,
  PlusCircle,
  Clock,
  Stethoscope,
  Building,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { requestStatusConfig } from './receptionistData';
import {
  getAppointmentRequestToday,
  updateAppointmentRequestStatus,
} from '../../../services/appointmentRequest.service';
import { getAppointmentsByDay } from '../../../services/appointment.service';

// Helper to clean up doctor titles (remove awkward "BS." or duplicate "ThS. BS.")
const cleanDoctorTitle = (nameStr) => {
  if (!nameStr) return 'Bác sĩ chuyên khoa';
  return nameStr
    .replace(/^ThS\.\s*BS\./i, 'ThS.')
    .replace(/^TS\.\s*BS\./i, 'TS.')
    .replace(/^BS\.\s*/i, '');
};

export default function AppointmentRequests({
  onOpenCreateModal,
  requests: propRequests,
  appointments: propAppointments,
  onRefresh,
}) {
  const { user } = useAuth();
  const currentUserDisplayName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Lễ tân';

  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Format single request item and check if doctor appointment already exists
  const formatRequestItem = (dto, apptsData = []) => {
    let formattedDate = 'Hôm nay';
    let rawDate = Date.now();
    const dateVal = dto.createAt || dto.createdAt;

    if (dateVal) {
      try {
        let d = null;
        if (Array.isArray(dateVal)) {
          const [y, m, dayVal, h = 0, min = 0, s = 0] = dateVal;
          d = new Date(y, m - 1, dayVal, h, min, s);
        } else {
          d = new Date(dateVal);
        }
        if (d && !isNaN(d.getTime())) {
          rawDate = d.getTime();
          formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(
            d.getMonth() + 1
          ).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(
            2,
            '0'
          )}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } catch (e) {
        formattedDate = String(dateVal);
      }
    }

    const rawName = dto.fullName || dto.full_name || dto.name || dto.patientName;
    const name = (rawName && typeof rawName === 'string' && rawName.trim()) ? rawName.trim() : 'Khách hàng Web';

    const rawPhone = dto.phone || dto.phoneNumber;
    const phone = (rawPhone && typeof rawPhone === 'string' && rawPhone.trim()) ? rawPhone.trim() : 'Chưa có SĐT';

    // Cross-reference only by the explicit request ID. Matching by phone can
    // associate an unrelated appointment with a still-pending request.
    const isCompletedRequest = dto.status === 'COMPLETED' || dto.status === 'PROCESSED';

    const matchedApt = Array.isArray(apptsData)
      ? apptsData.find(
        (apt) =>
          (apt.requestIdStr && String(apt.requestIdStr) === String(dto.id)) ||
          (apt.requestId && String(apt.requestId) === String(dto.id))
      )
      : null;

    // The request status is authoritative. An appointment alone must not make
    // a PENDING request appear as scheduled.
    const isScheduled = isCompletedRequest;

    let scheduledTimeStr = '';
    let doctorNameStr = '';
    let roomNameStr = '';
    let serviceNameStr = '';

    if (matchedApt) {
      doctorNameStr = cleanDoctorTitle(matchedApt.dentistName || matchedApt.dentist);
      roomNameStr = matchedApt.roomName || '';

      const s = matchedApt.serviceName || matchedApt.service || matchedApt.services || matchedApt.reason;
      if (Array.isArray(s)) {
        serviceNameStr = s.map((x) => (typeof x === 'string' ? x : (x?.name || x?.serviceName || ''))).filter(Boolean).join(', ');
      } else if (typeof s === 'object' && s !== null) {
        serviceNameStr = s.name || s.serviceName || '';
      } else if (typeof s === 'string') {
        serviceNameStr = s;
      }

      if (matchedApt.appointmentTime) {
        try {
          const d = new Date(matchedApt.appointmentTime);
          scheduledTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        } catch (e) {
          scheduledTimeStr = String(matchedApt.appointmentTime).substring(11, 16) || '09:00';
        }
      } else if (matchedApt.time) {
        scheduledTimeStr = matchedApt.time;
      } else {
        scheduledTimeStr = '09:00';
      }
    }

    if (!serviceNameStr && dto) {
      const s = dto.serviceName || dto.service || dto.services || dto.reason;
      if (Array.isArray(s)) {
        serviceNameStr = s.map((x) => (typeof x === 'string' ? x : (x?.name || x?.serviceName || ''))).filter(Boolean).join(', ');
      } else if (typeof s === 'object' && s !== null) {
        serviceNameStr = s.name || s.serviceName || '';
      } else if (typeof s === 'string') {
        serviceNameStr = s;
      }
    }

    if (!serviceNameStr) {
      serviceNameStr = dto.descriptions || dto.description || dto.note || 'Khám tổng quát';
    }

    const isConfirmed =
      dto.status === 'confirmed' ||
      dto.status === 'processing';

    const isRejected =
      dto.status === 'CANCELLED' ||
      dto.status === 'REJECTED' ||
      dto.status === 'rejected';

    let statusKey = 'new';
    if (isScheduled) statusKey = 'scheduled';
    else if (isConfirmed) statusKey = 'confirmed';
    else if (isRejected) statusKey = 'rejected';
    else if (dto.status === 'processing') statusKey = 'processing';

    const resolvedEmployeeName =
      dto.employeeName ||
      matchedApt?.employeeName ||
      ((isScheduled || isConfirmed) ? currentUserDisplayName : null);

    return {
      id: dto.id,
      name: name,
      phone: phone,
      date: formattedDate,
      rawDate: rawDate,
      note: dto.descriptions || dto.description || dto.note || 'Không có ghi chú',
      status: statusKey,
      employeeId: dto.employeeId || matchedApt?.employeeId || null,
      employeeName: resolvedEmployeeName,
      isApiData: true,
      isScheduled: isScheduled,
      matchedApt: matchedApt,
      doctorNameStr: doctorNameStr,
      scheduledTimeStr: scheduledTimeStr,
      roomNameStr: roomNameStr,
      serviceNameStr: serviceNameStr,
      branchId: dto.branchId || null,
      branchName: dto.branchName || 'Chưa xác định chi nhánh',
    };
  };

  // Helper to sort list: Unscheduled/New requests on top, Scheduled/Handled on bottom
  const sortRequests = (list) => {
    const unscheduled = list
      .filter((item) => !item.isScheduled && item.status !== 'rejected')
      .sort((a, b) => b.rawDate - a.rawDate);

    const scheduled = list
      .filter((item) => item.isScheduled)
      .sort((a, b) => b.rawDate - a.rawDate);

    const rejected = list
      .filter((item) => item.status === 'rejected')
      .sort((a, b) => b.rawDate - a.rawDate);

    return [...unscheduled, ...scheduled, ...rejected];
  };

  // Sync requests and appointments from props to avoid duplicate API calls
  useEffect(() => {
    if (propRequests !== undefined) {
      if (Array.isArray(propRequests)) {
        const formatted = propRequests.map((dto) => formatRequestItem(dto, propAppointments || []));
        setRequestList(sortRequests(formatted));
      } else {
        setRequestList([]);
      }
    }
  }, [propRequests, propAppointments]);

  // Fallback fetch only if parent did not provide propRequests (standalone usage)
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, apptsRes] = await Promise.all([
        getAppointmentRequestToday().catch(() => []),
        getAppointmentsByDay().catch(() => []),
      ]);

      const apptsData = Array.isArray(apptsRes) ? apptsRes : [];

      if (Array.isArray(requestsRes)) {
        const formatted = requestsRes.map((dto) => formatRequestItem(dto, apptsData));
        setRequestList(sortRequests(formatted));
      } else {
        setRequestList([]);
      }
    } catch (error) {
      console.warn('Lỗi tải Yêu cầu đặt lịch:', error);
      setRequestList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propRequests === undefined) {
      fetchRequests();
    }
  }, [propRequests, fetchRequests]);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setLoading(true);
      try {
        await onRefresh();
      } finally {
        setLoading(false);
      }
    } else {
      await fetchRequests();
    }
  };

  // Handle Confirm Request: Open modal to schedule appointment without updating status to COMPLETED prematurely
  const handleConfirm = (reqItem) => {
    if (onOpenCreateModal) {
      onOpenCreateModal(reqItem);
    }
  };

  // Rejection Confirmation Dialog States
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Trigger Reject Confirmation Modal
  const handleOpenRejectModal = (reqItem) => {
    setRejectTarget(reqItem);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Confirm Reject Request
  const confirmReject = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    const reqItem = rejectTarget;
    setProcessingId(reqItem.id);
    try {
      if (reqItem.isApiData) {
        await updateAppointmentRequestStatus(reqItem.id, 'CANCELLED').catch(() => null);
      }
      toast.success(`Đã từ chối yêu cầu của ${reqItem.name}`);

      setRequestList((prev) => {
        const updatedList = prev.map((item) => {
          if (item.id === reqItem.id) {
            return {
              ...item,
              status: 'rejected',
            };
          }
          return item;
        });
        return sortRequests(updatedList);
      });
      setIsRejectModalOpen(false);
      setRejectTarget(null);
    } catch (error) {
      console.error('Lỗi khi từ chối yêu cầu:', error);
      toast.error('Không thể từ chối yêu cầu đặt lịch');
    } finally {
      setIsRejecting(false);
      setProcessingId(null);
    }
  };

  const pendingCount = requestList.filter((r) => !r.isScheduled && r.status !== 'rejected').length;
  const scheduledCount = requestList.filter((r) => r.isScheduled).length;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Clean Modern ERP Header */}
      <div className="border-b border-slate-100 bg-white">
        {/* Row 1: Title & Actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100/80 text-teal-800 border border-teal-200/60">
              <Calendar size={15} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Yêu cầu đặt lịch hôm nay
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-200/70 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
              {requestList.length} tổng
            </span>
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={loading}
              title="Làm mới danh sách"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-colors border border-slate-200/80 disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Row 2: Balanced Counter Cards */}
        <div className="grid grid-cols-2 gap-2.5 px-4 py-2.5 bg-slate-50/30">
          <div className="flex items-center justify-between rounded-lg bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 text-xs shadow-2xs">
            <span className="font-semibold text-amber-900 whitespace-nowrap">Chưa phân công</span>
            <span className="rounded-md bg-amber-200/70 px-2 py-0.5 font-extrabold text-amber-900 text-[11px]">
              {pendingCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 text-xs shadow-2xs">
            <span className="font-semibold text-emerald-900 whitespace-nowrap">Đã lên lịch</span>
            <span className="rounded-md bg-emerald-200/70 px-2 py-0.5 font-extrabold text-emerald-900 text-[11px]">
              {scheduledCount}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Card List with Distinct Separation */}
      <div className="max-h-[460px] overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
        {loading && requestList.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-slate-400">
            Đang tải dữ liệu yêu cầu đặt lịch...
          </div>
        ) : requestList.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-slate-400">
            Không có yêu cầu đặt lịch nào hôm nay.
          </div>
        ) : (
          requestList.map((req) => {
            const isConfirmed = req.status === 'confirmed';
            const isRejected = req.status === 'rejected';
            const isProcessingThis = processingId === req.id;

            // Distinct card background styles:
            // - Processed / Scheduled: Soft green background & emerald border (Đã xử lý / Đã lên lịch)
            // - New / Unprocessed: Soft warm amber background & amber border (Chưa xử lý / Yêu cầu mới)
            // - Confirmed / Pending Schedule: Soft blue background & blue border
            // - Rejected: Soft slate background & dim state
            let cardBorderStyle = 'border-l-4 border-l-amber-500 border-amber-200/90 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-300';
            if (req.isScheduled) {
              cardBorderStyle = 'border-l-4 border-l-emerald-600 border-emerald-300/80 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-400';
            } else if (isConfirmed) {
              cardBorderStyle = 'border-l-4 border-l-blue-500 border-blue-200/90 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300';
            } else if (isRejected) {
              cardBorderStyle = 'border-l-4 border-l-red-500 border-red-200/90 bg-red-50/50 hover:bg-red-100/60 hover:border-red-300';
            }

            return (
              <div
                key={req.id}
                className={`rounded-lg border p-3 shadow-2xs transition-all hover:shadow-xs ${cardBorderStyle}`}
              >
                {/* Row 1: Patient Name + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold leading-tight truncate max-w-[170px] ${isRejected ? 'text-slate-700' : 'text-slate-900'}`}>
                    {req.name || 'Khách hàng Web'}
                  </p>

                  {/* Clean Single-Line Status Badges */}
                  {req.isScheduled ? (
                    <span className="shrink-0 flex items-center gap-1 rounded bg-emerald-100/80 px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300/80 whitespace-nowrap">
                      <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
                      Đã lên lịch
                    </span>
                  ) : isConfirmed ? (
                    <span className="shrink-0 flex items-center gap-1 rounded bg-blue-100/80 px-2 py-1 text-[11px] font-bold text-blue-800 border border-blue-300/80 whitespace-nowrap">
                      <Clock size={12} className="text-blue-700 shrink-0" />
                      Chờ lên lịch
                    </span>
                  ) : isRejected ? (
                    <span className="shrink-0 rounded bg-red-500 px-2 py-1 text-[11px] font-semibold text-white border border-red-600 whitespace-nowrap">
                      Đã từ chối
                    </span>
                  ) : (
                    <span className="shrink-0 rounded bg-amber-100/80 px-2 py-1 text-[11px] font-bold text-amber-900 border border-amber-300/80 whitespace-nowrap">
                      Yêu cầu mới
                    </span>
                  )}
                </div>

                {/* Row 2: Phone (Left) + Request Date (Right) */}
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Phone size={12} className="text-teal-600 shrink-0" />
                    {req.phone || 'Chưa có SĐT'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium shrink-0">
                    <Calendar size={11} className="text-slate-400 shrink-0" />
                    {req.date || 'Hôm nay'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-800">
                  <Building size={11} className="shrink-0 text-teal-600" />
                  <span className="truncate">Chi nhánh: {req.branchName}</span>
                </div>

                {/* Row 3: Request Note OR Doctor Scheduled Info Box */}
                {req.isScheduled ? (
                  /* Clean Doctor Scheduled Info Box */
                  <div className="mt-2 rounded-md bg-white/90 border border-emerald-200/90 p-2.5 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-1.5 font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-teal-900 font-bold truncate">
                        <Stethoscope size={13} className="text-teal-600 shrink-0" />
                        <span className="truncate">{req.doctorNameStr || 'Bác sĩ chuyên khoa'}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap shadow-2xs">
                        <Clock size={11} className="text-emerald-600 shrink-0" />
                        {req.scheduledTimeStr}
                      </span>
                    </div>
                    {/* Dịch vụ đăng ký / khám bên dưới khi đã xử lý */}
                    {req.serviceNameStr && (
                      <div className="pt-1.5 border-t border-emerald-100 flex items-start gap-1.5 text-[11px]">
                        <FileText size={12} className="text-teal-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500 font-medium">Dịch vụ: </span>
                          <span className="font-bold text-slate-800">{req.serviceNameStr}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Request Note / Service for Patients WITHOUT Appointment */
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs bg-white/80 px-2.5 py-1.5 rounded border border-amber-200/70">
                    <FileText size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="italic font-medium text-slate-800 leading-relaxed line-clamp-2">
                      &ldquo;{req.note}&rdquo;
                    </span>
                  </div>
                )}

                {/* Row 4: Action Buttons */}
                <div className="mt-1.5 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-1.5">
                  {req.isScheduled ? (
                    <div className="flex w-full items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        <UserCheck size={13} className="text-teal-600 shrink-0" />
                        NV xử lý: <strong className="font-semibold text-slate-900">{req.employeeName || currentUserDisplayName || 'Lễ tân'}</strong>
                      </span>
                    </div>
                  ) : isConfirmed ? (
                    <div className="flex w-full items-center justify-between gap-1 text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <AlertCircle size={12} className="text-amber-600 shrink-0" />
                        Chưa phân công
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenCreateModal && onOpenCreateModal(req)}
                        className="flex items-center gap-1.5 rounded bg-teal-700 px-3 py-1 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-2xs whitespace-nowrap"
                      >
                        <PlusCircle size={13} />
                        Đặt lịch khám
                      </button>
                    </div>
                  ) : isRejected ? (
                    <div className="flex w-full items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        <UserCheck size={12} className="text-slate-900 shrink-0" />
                        NV xử lý: {req.employeeName || currentUserDisplayName || 'Lễ tân'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirm(req)}
                        className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap"
                      >
                        Xác nhận lại
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(req)}
                        disabled={isProcessingThis}
                        className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-50 whitespace-nowrap"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirm(req)}
                        disabled={isProcessingThis}
                        className="flex items-center gap-1 rounded bg-teal-700 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 shadow-2xs whitespace-nowrap"
                      >
                        {isProcessingThis && (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Xác nhận & Đặt lịch
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Confirmation Modal */}
      {isRejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4 border border-rose-100">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">Xác nhận từ chối yêu cầu</h3>
                  <p className="text-xs text-slate-500 font-medium">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-lg bg-rose-50/70 border border-rose-100 p-3 space-y-1 text-xs text-slate-700">
              <p><strong>Bệnh nhân:</strong> <span className="font-bold text-slate-900">{rejectTarget.name}</span></p>
              {rejectTarget.phone && <p><strong>SĐT:</strong> {rejectTarget.phone}</p>}
              {rejectTarget.description && (
                <p><strong>Nội dung:</strong> {rejectTarget.description}</p>
              )}
            </div>

            {/* Quick Reason Options */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Lý do từ chối (Tùy chọn):</label>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['Lịch kín', 'Bệnh nhân báo hủy', 'Không liên lạc me', 'Khác'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectReason(r)}
                    className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${rejectReason === r
                      ? 'bg-rose-600 text-white border-rose-600 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={confirmReject}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
