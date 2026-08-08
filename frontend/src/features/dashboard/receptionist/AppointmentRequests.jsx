import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestStatusConfig } from './receptionistData';
import {
  getAppointmentRequestToday,
  processAppointmentRequest,
  updateAppointmentRequest,
} from '../../../services/appointmentRequest.service';

export default function AppointmentRequests({ requests: initialRequests = [] }) {
  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Map API DTO to UI component format
  const formatRequestItem = (dto) => {
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

    return {
      id: dto.id,
      name: dto.fullName || dto.name || 'Khách hàng',
      phone: dto.phone || 'N/A',
      date: formattedDate,
      rawDate: rawDate,
      note: dto.descriptions || dto.description || dto.note || 'Không có ghi chú',
      status: statusKey,
      employeeId: dto.employeeId || null,
      employeeName: dto.employeeName || null,
      isApiData: true,
    };
  };

  // Helper to sort list: Unprocessed (new) on top, Handled (confirmed/rejected) moved to bottom
  const sortRequests = (list) => {
    const pending = list
      .filter((item) => item.status !== 'confirmed' && item.status !== 'rejected')
      .sort((a, b) => b.rawDate - a.rawDate);

    const handled = list
      .filter((item) => item.status === 'confirmed' || item.status === 'rejected')
      .sort((a, b) => b.rawDate - a.rawDate);

    return [...pending, ...handled];
  };

  // Fetch today's appointment requests from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAppointmentRequestToday();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(formatRequestItem);
        setRequestList(sortRequests(formatted));
      } else {
        const formattedMock = initialRequests.map((item) => ({
          ...item,
          rawDate: item.date ? new Date().getTime() : 0,
        }));
        setRequestList(sortRequests(formattedMock));
      }
    } catch (error) {
      console.warn('Dùng dữ liệu giả cho Yêu cầu đặt lịch do lỗi hoặc chưa kết nối:', error);
      const formattedMock = initialRequests.map((item) => ({
        ...item,
        rawDate: item.date ? new Date().getTime() : 0,
      }));
      setRequestList(sortRequests(formattedMock));
    } finally {
      setLoading(false);
    }
  }, [initialRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Confirm / Process Request
  const handleConfirm = async (reqItem) => {
    setProcessingId(reqItem.id);
    try {
      let updatedDto = null;
      if (reqItem.isApiData) {
        updatedDto = await processAppointmentRequest(reqItem.id);
      }
      toast.success(`Đã xác nhận yêu cầu của ${reqItem.name}`);

      setRequestList((prev) => {
        const updatedList = prev.map((item) => {
          if (item.id === reqItem.id) {
            return {
              ...item,
              status: 'confirmed',
              employeeId: updatedDto?.employeeId || item.employeeId || 'emp-id',
              employeeName: updatedDto?.employeeName || item.employeeName || 'Nhân viên lễ tân',
            };
          }
          return item;
        });

        // Re-sort: Unprocessed on top, handled (confirmed/rejected) moved to bottom
        return sortRequests(updatedList);
      });
    } catch (error) {
      console.error('Lỗi khi xử lý yêu cầu đặt lịch:', error);
      toast.error(
        error.response?.data?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại!'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Request: Update status to CANCELLED in DB & move to bottom without removing from UI
  const handleReject = async (reqItem) => {
    setProcessingId(reqItem.id);
    try {
      let updatedDto = null;
      if (reqItem.isApiData) {
        updatedDto = await updateAppointmentRequestStatus(reqItem.id, 'CANCELLED');
      }
      toast.error(`Đã từ chối yêu cầu của ${reqItem.name}`);

      setRequestList((prev) => {
        const updatedList = prev.map((item) => {
          if (item.id === reqItem.id) {
            return {
              ...item,
              status: 'rejected',
              employeeId: updatedDto?.employeeId || item.employeeId || 'emp-id',
              employeeName: updatedDto?.employeeName || item.employeeName || 'Nhân viên lễ tân',
            };
          }
          return item;
        });

        // Re-sort: Moved to bottom
        return sortRequests(updatedList);
      });
    } catch (error) {
      console.error('Lỗi khi từ chối yêu cầu:', error);
      toast.error(
        error.response?.data?.message || 'Không thể cập nhật trạng thái từ chối!'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Count pending & total requests
  const pendingCount = requestList.filter(
    (r) => r.status !== 'confirmed' && r.status !== 'rejected'
  ).length;

  return (
    <div className="flex flex-col rounded-[4px] border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-slate-700">
            Yêu cầu đặt lịch hôm nay
          </h3>
          <span className="rounded-[3px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            {pendingCount} xử lý / {requestList.length} tổng
          </span>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          title="Làm mới danh sách"
          className="flex h-7 w-7 items-center justify-center rounded-[3px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
        >
          <RefreshCw size={14} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading && requestList.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-slate-400">
            Đang tải danh sách yêu cầu...
          </div>
        ) : requestList.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-slate-400">
            Không có yêu cầu đặt lịch nào hôm nay.
          </div>
        ) : (
          requestList.map((req, idx) => {
            const isConfirmed = req.status === 'confirmed';
            const isRejected = req.status === 'rejected';
            const isHandled = isConfirmed || isRejected;

            const statusConf = requestStatusConfig[req.status] || requestStatusConfig['new'];
            const isProcessingThis = processingId === req.id;

            return (
              <div
                key={req.id}
                className={`px-4 py-3 transition-colors ${isHandled ? 'bg-slate-50/70' : 'bg-white hover:bg-slate-50/50'
                  } ${idx < requestList.length - 1 ? 'border-b border-slate-200' : ''}`}
              >
                {/* Row 1: Name + badge */}
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[13px] font-semibold leading-tight truncate ${isHandled ? 'text-slate-500' : 'text-slate-800'
                      }`}
                  >
                    {req.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${statusConf.className}`}
                  >
                    {statusConf.label}
                  </span>
                </div>

                {/* Row 2: Phone + date */}
                <div className="mt-1 flex items-center gap-3 text-[12px] text-slate-500">
                  <span className="font-medium text-slate-700">{req.phone}</span>
                  <span className="flex items-center gap-1 text-[12px] text-slate-400">
                    <Calendar size={11} strokeWidth={2} className="text-slate-400" />
                    {req.date}
                  </span>
                </div>

                {/* Row 3: Note */}
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 line-clamp-2 italic">
                  &ldquo;{req.note}&rdquo;
                </p>

                {/* Row 4: Actions / Processor info */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  {isConfirmed ? (
                    <div className="flex w-full items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-[3px]">
                        <UserCheck size={12} className="text-teal-600" />
                        NV xử lý: {req.employeeName || 'Nhân viên lễ tân'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 size={13} />
                        Đã xác nhận
                      </span>
                    </div>
                  ) : isRejected ? (
                    <div className="flex w-full items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-[3px]">
                        <UserCheck size={12} className="text-slate-500" />
                        NV xử lý: {req.employeeName || 'Nhân viên lễ tân'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <XCircle size={13} />
                          Đã từ chối
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConfirm(req)}
                          className="text-[11px] font-medium text-teal-700 hover:underline"
                        >
                          Xác nhận lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(req)}
                        disabled={isProcessingThis}
                        className="rounded-[3px] border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirm(req)}
                        disabled={isProcessingThis}
                        className="flex items-center gap-1 rounded-[3px] bg-teal-700 px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
                      >
                        {isProcessingThis && (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Xác nhận
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
