import React from 'react';
import { Eye, Printer, Calendar, CheckCircle2 } from 'lucide-react';

export default function ShiftHistoryTable({
  historyList = [],
  loading = false,
  onViewDetail,
  onPrint,
}) {
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getShiftBadge = (type) => {
    switch (type) {
      case 'MORNING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Ca sáng</span>;
      case 'AFTERNOON':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Ca chiều</span>;
      case 'EVENING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Ca tối</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Cả ngày</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent mb-3" />
        <p className="text-xs font-semibold">Đang tải lịch sử kết ca...</p>
      </div>
    );
  }

  if (historyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-slate-200 text-center">
        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 mb-2.5">
          <Calendar className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800">Chưa có phiên kết ca nào</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">Các phiên chốt ca đã thực hiện sẽ được hiển thị tại đây.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="py-2.5 px-3">Mã ca</th>
            <th className="py-2.5 px-3">Ca trực</th>
            <th className="py-2.5 px-3">Người chốt</th>
            <th className="py-2.5 px-3">Người nhận</th>
            <th className="py-2.5 px-3 text-right">Doanh thu hệ thống</th>
            <th className="py-2.5 px-3 text-right">Tiền mặt két</th>
            <th className="py-2.5 px-3 text-center">Chênh lệch</th>
            <th className="py-2.5 px-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {historyList.map((item) => {
            const diff = Number(item.differenceAmount || 0);

            return (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {item.shiftCode}
                  <div className="text-[10px] text-slate-400 font-normal">
                    {formatDate(item.createdAt)}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  {getShiftBadge(item.shiftType)}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {item.employeeName || 'Nhân viên'}
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {item.handoverEmployeeName || '---'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatMoney(item.totalSystemRevenue)}
                  <div className="text-[10px] text-slate-400 font-normal">
                    {item.totalTransactions || 0} GD
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                  {formatMoney(item.totalCashActual)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {diff === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Khớp 0đ
                    </span>
                  ) : diff > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      +{formatMoney(diff)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {formatMoney(diff)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onPrint(item)}
                      title="In phiếu kết ca"
                      className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onViewDetail(item)}
                      title="Xem chi tiết"
                      className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
