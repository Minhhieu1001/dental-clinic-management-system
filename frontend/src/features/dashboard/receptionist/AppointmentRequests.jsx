import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { requestStatusConfig } from './receptionistData';
import {
  getAppointmentRequestToday,
  updateAppointmentRequestStatus,
} from '../../../services/appointmentRequest.service';
import { getAppointments } from '../../../services/appointment.service';

// Helper to clean up doctor titles (remove awkward "BS." or duplicate "ThS. BS.")
const cleanDoctorTitle = (nameStr) => {
  if (!nameStr) return 'Bác sĩ chuyên khoa';
  return nameStr
    .replace(/^ThS\.\s*BS\./i, 'ThS.')
    .replace(/^TS\.\s*BS\./i, 'TS.')
    .replace(/^BS\.\s*/i, '');
};

export default function AppointmentRequests({ onOpenCreateModal, requests: propRequests }) {
  const { user } = useAuth();
  const currentUserDisplayName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Lễ tân';

  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Format single request item and check if doctor appointment already exists
  const formatRequestItem = (dto, apptsData = []) => {
    let formattedDate = 'Hôm nay';
    let rawDate = 0;
    if (dto.createAt) {
      try {
        const d = new Date(dto.createAt);
        rawDate = d.getTime();
        formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(
          d.getMonth() + 1
        ).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(
          2,
          '0'
        )}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        formattedDate = dto.createAt;
      }
    }

    const name = dto.fullName || dto.name || 'Khách hàng';
    const phone = dto.phone || '';

    // Cross-reference with existing doctor appointments (match strictly by requestIdStr or completed request status)
    const isCompletedRequest = dto.status === 'COMPLETED' || dto.status === 'PROCESSED';

    const matchedApt = Array.isArray(apptsData)
      ? apptsData.find(
          (apt) =>
            (apt.requestIdStr && String(apt.requestIdStr) === String(dto.id)) ||
            (apt.requestId && String(apt.requestId) === String(dto.id)) ||
            (isCompletedRequest &&
              apt.phone &&
              phone &&
              apt.phone.trim() === phone.trim() &&
              Math.abs(new Date(apt.createdAt || 0).getTime() - rawDate) < 24 * 3600 * 1000)
        )
      : null;

    const isScheduled = !!matchedApt;

    let scheduledTimeStr = '';
    let doctorNameStr = '';
    let roomNameStr = '';

    if (matchedApt) {
      doctorNameStr = cleanDoctorTitle(matchedApt.dentistName || matchedApt.dentist);
      roomNameStr = matchedApt.roomName || '';
      if (matchedApt.appointmentTime) {
        try {
          const d = new Date(matchedApt.appointmentTime);
          scheduledTimeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        } catch (e) {
          scheduledTimeStr = String(matchedApt.appointmentTime).substring(11, 16) || '09:00';
        }
      } else {
        scheduledTimeStr = '09:00';
      }
    }

    const isConfirmed =
      dto.status === 'COMPLETED' ||
      dto.status === 'confirmed' ||
      dto.status === 'PROCESSED';

    const isRejected =
      dto.status === 'CANCELLED' ||
      dto.status === 'REJECTED' ||
      dto.status === 'rejected';

    let statusKey = 'new';
    if (isConfirmed) statusKey = 'confirmed';
    else if (isRejected) statusKey = 'rejected';
    else if (dto.status === 'processing') statusKey = 'processing';

    const resolvedEmployeeName =
      dto.employeeName ||
      matchedApt?.employeeName ||
      ((isScheduled || isConfirmed) ? currentUserDisplayName : null);

    return {
      id: dto.id,
      name: name,
      phone: phone || 'N/A',
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

  // Fetch today's appointment requests AND current doctor appointments to cross-reference
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, apptsRes] = await Promise.all([
        getAppointmentRequestToday().catch(() => []),
        getAppointments().catch(() => []),
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
    fetchRequests();
  }, [fetchRequests, propRequests]);

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
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Clean Balanced Header */}
      <div className="border-b border-slate-100 bg-white">
        {/* Row 1: Title & Actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100/80 text-teal-800 border border-teal-200">
              <Calendar size={15} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Yêu cầu đặt lịch hôm nay
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 whitespace-nowrap">
              {requestList.length} tổng
            </span>
            <button
              type="button"
              onClick={fetchRequests}
              disabled={loading}
              title="Làm mới danh sách"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-colors shadow-2xs border border-slate-200/80 disabled:opacity-50"
            >
              <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Row 2: Balanced Counter Cards */}
        <div className="grid grid-cols-2 gap-2.5 px-4 py-2.5 bg-slate-50/30">
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-xs shadow-2xs">
            <span className="font-semibold text-amber-900 whitespace-nowrap">Chưa phân công</span>
            <span className="rounded-md bg-amber-200/70 px-2 py-0.5 font-extrabold text-amber-900 text-[11px]">
              {pendingCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs shadow-2xs">
            <span className="font-semibold text-emerald-900 whitespace-nowrap">Đã lên lịch</span>
            <span className="rounded-md bg-emerald-200/70 px-2 py-0.5 font-extrabold text-emerald-900 text-[11px]">
              {scheduledCount}
            </span>
          </div>
        </div>
      </div>


      {/* Scrollable List */}
      <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
        {loading && requestList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Đang kiểm tra danh sách và đối soát lịch hẹn...
          </div>
        ) : requestList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Không có yêu cầu đặt lịch nào hôm nay.
          </div>
        ) : (
          requestList.map((req) => {
            const isConfirmed = req.status === 'confirmed';
            const isRejected = req.status === 'rejected';
            const isProcessingThis = processingId === req.id;

            return (
              <div
                key={req.id}
                className={`px-4 py-3.5 transition-colors ${
                  req.isScheduled
                    ? 'bg-emerald-50/20'
                    : isRejected
                    ? 'bg-slate-50/70'
                    : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                {/* Row 1: Name + Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold leading-tight truncate ${isRejected ? 'text-slate-400' : 'text-slate-900'}`}>
                    {req.name}
                  </p>

                  {/* Clean, Elegant Status Badges */}
                  {req.isScheduled ? (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-700" />
                      Đã lên lịch khám
                    </span>
                  ) : isConfirmed ? (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                      <Clock size={12} className="text-amber-700" />
                      Chờ lên lịch khám
                    </span>
                  ) : isRejected ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                      Đã từ chối
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                      Yêu cầu mới
                    </span>
                  )}
                </div>

                {/* Row 2: Phone + Request Date */}
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{req.phone}</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={11} className="text-slate-400" />
                    {req.date}
                  </span>
                </div>

                {/* Row 3: Request Note OR Doctor Scheduled Info Box */}
                {req.isScheduled ? (
                  /* Elegant Scheduled Info Box */
                  <div className="mt-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/80 p-2.5 text-xs shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-teal-900 font-bold">
                        <Stethoscope size={14} className="text-teal-700" />
                        {req.doctorNameStr}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-white/90 px-2 py-0.5 rounded-md border border-teal-200/80 shadow-2xs">
                        <Clock size={11} className="text-teal-600" /> {req.scheduledTimeStr}
                      </span>
                    </div>
                    {req.roomNameStr && (
                      <div className="mt-1 text-[11px] text-teal-700 font-medium flex items-center gap-1">
                        <Building size={11} /> {req.roomNameStr}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Request Note for Patients WITHOUT Appointment */
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2 italic">
                    &ldquo;{req.note}&rdquo;
                  </p>
                )}

                {/* Row 4: Action Buttons */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  {req.isScheduled ? (
                    <div className="flex w-full items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                        <UserCheck size={13} className="text-teal-600" />
                        NV xử lý: <strong className="font-semibold text-slate-900">{req.employeeName || currentUserDisplayName || 'Lễ tân'}</strong>
                      </span>
                    </div>
                  ) : isConfirmed ? (
                    <div className="flex w-full items-center justify-between gap-1 text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        <AlertCircle size={12} className="text-amber-600" />
                        Chưa phân công
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenCreateModal && onOpenCreateModal(req)}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-sm"
                      >
                        <PlusCircle size={13} />
                        Đặt lịch khám
                      </button>
                    </div>
                  ) : isRejected ? (
                    <div className="flex w-full items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                        <UserCheck size={12} className="text-slate-500" />
                        NV xử lý: {req.employeeName || currentUserDisplayName || 'Lễ tân'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirm(req)}
                        className="text-xs font-medium text-teal-700 hover:underline"
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirm(req)}
                        disabled={isProcessingThis}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1 text-xs font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 shadow-sm"
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
          <div className="w-full max-w-md rounded-[4px] bg-white p-5 shadow-xl space-y-4 border border-rose-100">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-rose-100">
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-[4px] hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-[4px] bg-rose-50/70 border border-rose-100 p-3 space-y-1 text-xs text-slate-700">
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
                {['Lịch kín', 'Bệnh nhân báo hủy', 'Không liên lạc được', 'Khác'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectReason(r)}
                    className={`px-2.5 py-1 rounded-[4px] border font-medium transition-all ${
                      rejectReason === r
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
                className="w-full rounded-[4px] border border-slate-200 p-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectTarget(null);
                }}
                className="rounded-[4px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={confirmReject}
                className="flex items-center gap-1.5 rounded-[4px] bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all disabled:opacity-50"
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
