import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Vault,
  X,
  Receipt,
  Coins,
  ShieldCheck,
  FileCheck,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';

export default function OvernightRevenueRemitModal({
  isOpen,
  onClose,
  shiftDate,
  totalOvernightCash = 0,
  previousShift = {},
  previousDayShifts = [],
  onConfirm,
  loading = false,
}) {
  const [retainedCash, setRetainedCash] = useState(2000000);
  const [receivedBy, setReceivedBy] = useState('Thủ quỹ phòng khám');
  const [note, setNote] = useState('');

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Tính số tiền doanh thu trích nộp
  const remittedAmount = useMemo(() => {
    const total = Number(totalOvernightCash || 0);
    const retained = Number(retainedCash || 0);
    return Math.max(0, total - retained);
  }, [totalOvernightCash, retainedCash]);

  // Tổng doanh thu ngày hôm trước
  const totalPrevRevenue = useMemo(() => {
    return (previousDayShifts || []).reduce(
      (sum, s) => sum + Number(s.totalSystemRevenue || 0),
      0
    );
  }, [previousDayShifts]);

  const totalPrevCash = useMemo(() => {
    return (previousDayShifts || []).reduce(
      (sum, s) => sum + Number(s.cashRevenue || 0),
      0
    );
  }, [previousDayShifts]);

  const totalPrevBank = useMemo(() => {
    return (previousDayShifts || []).reduce(
      (sum, s) => sum + Number(s.bankTransferRevenue || 0),
      0
    );
  }, [previousDayShifts]);

  useEffect(() => {
    if (isOpen) {
      setRetainedCash(2000000);
      setReceivedBy('Thủ quỹ phòng khám');
      setNote(
        `Nộp doanh thu ngày hôm trước vào két sắt trung tâm, khởi tạo quỹ 2.000.000 đ cho ngày mới`
      );
    }
  }, [isOpen, shiftDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onConfirm) {
      onConfirm({
        shiftDate,
        totalOvernightCash: Number(totalOvernightCash || 0),
        retainedFloatCash: Number(retainedCash || 2000000),
        remittedAmount,
        fromShiftClosingId: previousShift?.id || null,
        receivedBy,
        note,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/80 flex flex-col max-h-[92vh]"
      >
        {/* Header - Phong cách nha khoa tối giản, thanh lịch */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                Đối Soát Doanh Thu & Nộp Tiền Két Qua Đêm
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kiểm tra doanh thu các ca hôm trước và nộp tiền két qua đêm về thủ quỹ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nội dung đối soát & xác nhận nộp */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* PHẦN 1: BẢNG KIỂM TRA DOANH THU CÁC CA NGÀY HÔM TRƯỚC */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-teal-700" />
                1. Báo cáo doanh thu các ca trực hôm trước
              </span>
              <span className="text-[11px] font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Tổng DT: {formatMoney(totalPrevRevenue)}
              </span>
            </div>

            {previousDayShifts && previousDayShifts.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Ca trực</th>
                      <th className="py-2.5 px-3">Thu ngân</th>
                      <th className="py-2.5 px-3 text-right">Thu tiền mặt</th>
                      <th className="py-2.5 px-3 text-right">Chuyển khoản</th>
                      <th className="py-2.5 px-3 text-right">Két cuối ca</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {previousDayShifts.map((s) => {
                      const shiftBadgeClass =
                        s.shiftType === 'MORNING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : s.shiftType === 'AFTERNOON'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200';

                      const shiftLabel =
                        s.shiftType === 'MORNING'
                          ? 'Ca Sáng'
                          : s.shiftType === 'AFTERNOON'
                          ? 'Ca Chiều'
                          : 'Ca Tối';

                      return (
                        <tr key={s.shiftCode} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${shiftBadgeClass}`}>
                                {shiftLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({s.shiftCode})
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {s.employeeName || 'Thu ngân'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-700 font-mono">
                            +{formatMoney(s.cashRevenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-600 font-mono">
                            {formatMoney(s.bankTransferRevenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                            {formatMoney(s.totalCashActual)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/70 font-semibold border-t border-slate-200 text-slate-800">
                      <td colSpan="2" className="py-2.5 px-3 uppercase text-[10px] tracking-wider text-slate-600">
                        Tổng cộng hôm trước:
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-mono">
                        {formatMoney(totalPrevCash)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                        {formatMoney(totalPrevBank)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 font-bold font-mono">
                        {formatMoney(totalOvernightCash)} <span className="text-[10px] text-slate-500 font-normal block sm:inline">(Két qua đêm)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-500 text-center">
                Nhận số liệu két niêm phong qua đêm: <strong className="font-mono text-slate-800">{formatMoney(totalOvernightCash)}</strong>
              </div>
            )}
          </div>

          {/* PHẦN 2: PHƯƠNG ÁN TRÍCH NỘP TIỀN KÉT & KHỞI TẠO QUỸ MỚI */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3.5 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-teal-700" />
              2. Phương án trích nộp tiền mặt két qua đêm
            </span>

            {/* 3 Thẻ tóm tắt thông số trực quan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tiền két qua đêm đang giữ */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Két qua đêm đang giữ
                </span>
                <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                  {formatMoney(totalOvernightCash)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Kiểm đếm từ ca tối hôm trước
                </span>
              </div>

              {/* Số tiền trích nộp */}
              <div className="p-3 rounded-xl border border-blue-200/90 bg-blue-50/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Doanh thu trích nộp
                </span>
                <span className="text-base font-black text-blue-800 font-mono mt-1 block">
                  -{formatMoney(remittedAmount)}
                </span>
                <span className="text-[10px] text-blue-600/90 block mt-0.5">
                  Nộp thủ quỹ / két sắt trung tâm
                </span>
              </div>

              {/* Quỹ tiền lẻ giữ lại cho ngày mới */}
              <div className="p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Quỹ giữ lại (Ca sáng)
                </span>
                <span className="text-base font-black text-emerald-800 font-mono mt-1 block">
                  {formatMoney(retainedCash)}
                </span>
                <span className="text-[10px] text-emerald-600/90 block mt-0.5">
                  Làm tiền thối đầu ngày mới
                </span>
              </div>
            </div>

            {/* Form nhập thông tin nộp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Người nhận bàn giao tiền nộp:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Ví dụ: Thủ quỹ phòng khám, Quản lý..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quỹ định mức để lại (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    max={totalOvernightCash}
                    value={retainedCash}
                    onChange={(e) => setRetainedCash(Number(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-xs font-bold text-emerald-800 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/20 font-mono transition-colors"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ghi chú chứng từ nộp:
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú chi tiết cho biên bản nộp..."
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* QUY TẮC ĐỐI SOÁT KẾ TOÁN MINH BẠCH */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="block font-bold text-slate-900 mb-0.5">
                Quy tắc nghiệp vụ kế toán:
              </strong>
              Sau khi xác nhận nộp, hệ thống sẽ lưu biên bản nộp tiền vào sổ sách.
              Tiền mặt đầu ca sáng của ngày hôm nay sẽ <strong>khóa cố định ở mức quỹ {formatMoney(retainedCash)}</strong> nhằm đảm bảo tính toàn vẹn và không cho phép hoàn tác.
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || remittedAmount <= 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý nộp tiền...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>
                    Xác nhận nộp {formatMoney(remittedAmount)} & Giữ quỹ {formatMoney(retainedCash)}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
