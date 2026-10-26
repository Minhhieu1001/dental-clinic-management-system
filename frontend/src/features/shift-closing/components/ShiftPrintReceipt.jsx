import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, X } from 'lucide-react';

export default function ShiftPrintReceipt({ isOpen, onClose, shiftData }) {
  const printAreaRef = useRef(null);

  if (!isOpen || !shiftData) return null;

  const handlePrint = () => {
    window.print();
  };

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

  const getShiftTypeName = (type) => {
    switch (type) {
      case 'MORNING': return 'Ca Sáng (07:30 - 12:00)';
      case 'AFTERNOON': return 'Ca Chiều (12:00 - 17:30)';
      case 'EVENING': return 'Ca Tối (17:30 - 21:00)';
      case 'FULL_DAY': return 'Ca Cả Ngày';
      default: return 'Ca làm việc';
    }
  };

  const diff = Number(shiftData.differenceAmount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl border border-slate-200 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Top Control Bar (Ẩn khi in) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Biên bản kết toán ca làm việc</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              In phiếu (Ctrl + P)
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Khổ in chuẩn */}
        <div
          ref={printAreaRef}
          className="flex-1 overflow-y-auto p-6 font-sans text-slate-800 bg-white print:p-2 print:overflow-visible custom-scrollbar text-xs"
        >
          {/* Header Phòng Khám */}
          <div className="flex items-start justify-between border-b border-slate-300 pb-3 mb-4">
            <div>
              <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                NHA KHOA CROWN DENTAL
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                {shiftData.branchName || 'Chi nhánh Nha Khoa Crown Active'}
              </p>
              <p className="text-[10px] text-slate-400">
                Hotline: 1900 6868 • Email: contact@crowndental.vn
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-800 text-[11px] font-bold">
                {shiftData.shiftCode || 'KC-XXXXXX'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Ngày lập: {formatDate(new Date())}
              </p>
            </div>
          </div>

          {/* Tiêu đề */}
          <div className="text-center my-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              BIÊN BẢN KẾT TOÁN & BÀN GIAO CA LÀM VIỆC
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {getShiftTypeName(shiftData.shiftType)} • Thời gian: {formatDate(shiftData.startTime)} - {formatDate(shiftData.endTime)}
            </p>
          </div>

          {/* Thông tin nhân viên */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-slate-200 bg-slate-50/70 text-xs mb-4">
            <div>
              <span className="text-slate-500">Nhân viên chốt ca:</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {shiftData.employeeName || 'Nhân viên lễ tân'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Người nhận bàn giao:</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {shiftData.handoverEmployeeName || 'Quản lý / Thu ngân ca sau'}
              </p>
            </div>
          </div>

          {/* Phần 1: Doanh thu theo phương thức thanh toán */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
              1. Báo cáo doanh thu trong ca
            </h3>
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-2.5">Hình thức thanh toán</th>
                  <th className="py-1.5 px-2.5 text-right">Số tiền ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-2.5">1. Tiền mặt (Cash)</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">{formatMoney(shiftData.cashRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5">2. Chuyển khoản ngân hàng (Bank Transfer)</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">{formatMoney(shiftData.bankTransferRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5">3. Quẹt thẻ POS (Credit Card)</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">{formatMoney(shiftData.cardRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5">4. Ví điện tử (VNPay / MoMo)</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">{formatMoney(shiftData.eWalletRevenue)}</td>
                </tr>
                <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-300">
                  <td className="py-2 px-2.5 uppercase">TỔNG DOANH THU ({shiftData.totalTransactions || 0} giao dịch)</td>
                  <td className="py-2 px-2.5 text-right text-sm text-teal-800">{formatMoney(shiftData.totalSystemRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Phần 2: Đối soát tiền mặt két */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
              2. Đối soát tiền mặt trong két
            </h3>
            <table className="w-full text-xs text-left border border-slate-200">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-2.5 text-slate-600">Tiền mặt đầu ca (vào két ban đầu):</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">{formatMoney(shiftData.initialCash)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5 text-slate-600">+ Tiền mặt thu được trong ca:</td>
                  <td className="py-1.5 px-2.5 text-right font-semibold">+{formatMoney(shiftData.cashRevenue)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-1.5 px-2.5 text-slate-800">= Tổng tiền mặt dự kiến trong két:</td>
                  <td className="py-1.5 px-2.5 text-right">{formatMoney(shiftData.totalCashExpected)}</td>
                </tr>
                <tr className="font-extrabold">
                  <td className="py-2 px-2.5 text-slate-900">TIỀN MẶT THỰC TẾ KIỂM ĐẾM TRONG KÉT:</td>
                  <td className="py-2 px-2.5 text-right text-sm text-slate-900">{formatMoney(shiftData.totalCashActual)}</td>
                </tr>
                <tr className="border-t border-slate-300 bg-slate-50">
                  <td className="py-1.5 px-2.5 font-bold">Chênh lệch tiền mặt:</td>
                  <td className={`py-1.5 px-2.5 text-right font-black ${
                    diff === 0 ? 'text-emerald-700' : diff > 0 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {diff === 0 ? '0 đ (KHỚP TIỀN HOÀN TOÀN)' : `${diff > 0 ? '+' : ''}${formatMoney(diff)} (${diff > 0 ? 'THỪA TIỀN' : 'THIẾU TIỀN'})`}
                  </td>
                </tr>
                {shiftData.differenceReason && (
                  <tr>
                    <td className="py-1.5 px-2.5 text-slate-500 italic">Lý do chênh lệch:</td>
                    <td className="py-1.5 px-2.5 text-right text-slate-700 italic">{shiftData.differenceReason}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phần 3: Ghi chú */}
          {shiftData.note && (
            <div className="mb-4 p-2.5 rounded-md border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-700 block mb-0.5">Ghi chú bàn giao:</span>
              <p className="text-slate-600">{shiftData.note}</p>
            </div>
          )}

          {/* Chữ ký hai bên */}
          <div className="grid grid-cols-2 gap-6 text-center text-xs mt-8 pt-4 border-t border-slate-300">
            <div>
              <p className="font-bold text-slate-800 uppercase">NGƯỜI BÀN GIAO CA</p>
              <p className="text-[10px] text-slate-400 italic mb-14">(Ký, họ tên)</p>
              <p className="font-bold text-slate-800">{shiftData.employeeName || 'Nhân viên lễ tân'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase">NGƯỜI NHẬN BÀN GIAO</p>
              <p className="text-[10px] text-slate-400 italic mb-14">(Ký, họ tên)</p>
              <p className="font-bold text-slate-800">{shiftData.handoverEmployeeName || 'Quản lý / Ca sau'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
