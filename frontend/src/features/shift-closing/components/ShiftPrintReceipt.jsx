import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Coins,
  Receipt,
  CreditCard,
  FileText,
  Calendar,
} from 'lucide-react';

export default function ShiftPrintReceipt({ isOpen, onClose, shiftData }) {
  const printAreaRef = useRef(null);

  if (!isOpen || !shiftData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShiftTypeName = (type) => {
    switch (type) {
      case 'MORNING':
        return 'Ca Sáng (00:00 - 12:00)';
      case 'AFTERNOON':
        return 'Ca Chiều (12:00 - 17:30)';
      case 'EVENING':
        return 'Ca Tối (17:30 - 23:59)';
      case 'FULL_DAY':
        return 'Ca Cả Ngày (00:00 - 23:59)';
      default:
        return 'Ca làm việc';
    }
  };

  const cashDiff = Number(shiftData.differenceAmount || 0);
  const bankDiff = Number(shiftData.bankTransferDifference || 0);

  // Parse denominations nếu có
  let parsedDenoms = null;
  try {
    if (shiftData.denominationsJson) {
      const obj = JSON.parse(shiftData.denominationsJson);
      const entries = Object.entries(obj).filter(([_, count]) => Number(count) > 0);
      if (entries.length > 0) {
        parsedDenoms = entries.sort((a, b) => Number(b[0]) - Number(a[0]));
      }
    }
  } catch (e) {
    parsedDenoms = null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto">
      {/* CSS dành riêng khi in ấn: Khổ chuẩn A4, sắc nét, ẩn các nút điều khiển */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-slate-100 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white"
      >
        {/* Top Control Bar (Ẩn khi in) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Biên Bản Kết Toán Ca Làm Việc
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {shiftData.shiftCode || 'KC-XXXXXX'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Chứng từ kiểm đếm dòng tiền két và bàn giao công việc giữa các phiên trực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In phiếu (Ctrl + P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Khung tài liệu dạng trang giấy in chuẩn A4 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white custom-scrollbar">
          <div
            ref={printAreaRef}
            className="print-sheet mx-auto max-w-2xl bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200/80 text-slate-800 font-sans text-xs print:border-none print:shadow-none print:p-0"
          >
            {/* Header phòng khám & Mã biên bản */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-xs shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                    NHA KHOA QUỐC TẾ CROWN DENTAL
                  </h1>
                  <p className="text-xs font-bold text-teal-800 mt-0.5">
                    {shiftData.branchName || 'Cơ sở 1 - Trung tâm Nha khoa Quốc Tế'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hotline: <span className="font-semibold text-slate-700">1900 6868</span> • Email: <span className="font-semibold text-slate-700">contact@crowndental.vn</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block bg-slate-900 text-white px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider shadow-2xs">
                  {shiftData.shiftCode || 'KC-XXXXXX'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ngày lập: {formatDateTime(shiftData.createdAt || new Date())}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Đã hoàn tất bàn giao
                  </span>
                </div>
              </div>
            </div>

            {/* Tiêu đề biên bản */}
            <div className="text-center my-5">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                BIÊN BẢN KẾT TOÁN & BÀN GIAO CA LÀM VIỆC
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1 text-slate-600 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                  <Clock className="h-3 w-3" />
                  {getShiftTypeName(shiftData.shiftType)}
                </span>
                <span>•</span>
                <span>Khung giờ: {formatTimeOnly(shiftData.startTime)} - {formatTimeOnly(shiftData.endTime)}</span>
                <span>•</span>
                <span>Ngày: {formatDateOnly(shiftData.startTime)}</span>
              </div>
            </div>

            {/* Box thông tin nhân sự bàn giao */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs mb-5">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  Nhân viên kết ca (Bên giao):
                </span>
                <p className="font-black text-slate-900 text-sm mt-1">
                  {shiftData.employeeName || 'Nhân viên lễ tân'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nhân viên Lễ tân / Thu ngân
                </p>
              </div>

              <div className="pl-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-teal-600" />
                  Người nhận bàn giao (Bên nhận):
                </span>
                <p className="font-black text-slate-900 text-sm mt-1">
                  {shiftData.handoverEmployeeName || 'Quản lý / Thu ngân ca sau'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nhân viên nhận ca trực tiếp theo
                </p>
              </div>
            </div>

            {/* PHẦN 1: BÁO CÁO DOANH THU THỰC THU TRONG CA */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-teal-700" />
                  1. Báo cáo doanh thu thực thu trong ca
                </h3>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {shiftData.totalTransactions || 0} giao dịch thanh toán
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Hình thức thanh toán</th>
                      <th className="py-2 px-3 text-center">Phân loại</th>
                      <th className="py-2 px-3 text-right">Số tiền ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        1. Tiền mặt tại quầy (Cash)
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Nhập két
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatMoney(shiftData.cashRevenue)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        2. Chuyển khoản ngân hàng (Bank / VietQR)
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Tài khoản PK
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatMoney(shiftData.bankTransferRevenue)}
                      </td>
                    </tr>
                    <tr className="bg-teal-50/70 border-t-2 border-teal-700 font-black text-slate-900">
                      <td colSpan="2" className="py-2.5 px-3 uppercase text-teal-900 font-black">
                        TỔNG DOANH THU CA ({shiftData.totalTransactions || 0} GIAO DỊCH)
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-teal-900 font-black">
                        {formatMoney(shiftData.totalSystemRevenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PHẦN 2: ĐỐI SOÁT DÒNG TIỀN MẶT TRONG KÉT */}
            <div className="mb-5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-700" />
                2. Đối soát dòng tiền mặt trong két (Cash Flow)
              </h3>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-600">
                        A. Tiền mặt đầu ca (vào két ban đầu):
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        {formatMoney(shiftData.initialCash)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-600">
                        B. (+) Tiền mặt thu được từ hóa đơn trong ca:
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        +{formatMoney(shiftData.cashRevenue)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-2 px-3 text-slate-800">
                        = Tiền mặt dự kiến cần có trong két (A + B):
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        {formatMoney(shiftData.totalCashExpected)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 border-t border-slate-300">
                      <td className="py-2.5 px-3 font-black text-slate-900 uppercase">
                        TIỀN MẶT THỰC TẾ KIỂM ĐẾM TRONG KÉT:
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-sm text-slate-900">
                        {formatMoney(shiftData.totalCashActual)}
                      </td>
                    </tr>
                    <tr className="bg-white border-t border-slate-200">
                      <td className="py-2 px-3 font-bold text-slate-700">
                        Kết quả chênh lệch két tiền mặt:
                      </td>
                      <td className="py-2 px-3 text-right">
                        {cashDiff === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> 0 đ • KHỚP TIỀN HOÀN TOÀN
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black ${
                            cashDiff > 0 ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            {cashDiff > 0 ? '+' : ''}{formatMoney(cashDiff)} ({cashDiff > 0 ? 'THỪA TIỀN TRONG KÉT' : 'THIẾU TIỀN TRONG KÉT'})
                          </span>
                        )}
                      </td>
                    </tr>
                    {shiftData.differenceReason && (
                      <tr className="bg-rose-50/50">
                        <td className="py-2 px-3 text-rose-800 font-semibold italic">
                          Lý do giải trình chênh lệch tiền mặt:
                        </td>
                        <td className="py-2 px-3 text-right text-rose-900 italic font-medium">
                          {shiftData.differenceReason}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bảng chi tiết mệnh giá tiền nếu có kiểm đếm */}
              {parsedDenoms && (
                <div className="mt-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Chi tiết các mệnh giá kiểm đếm trong két:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedDenoms.map(([denom, count]) => (
                      <span
                        key={denom}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700 font-semibold shadow-2xs"
                      >
                        <span className="text-teal-800 font-bold">{Number(denom).toLocaleString('vi-VN')} đ</span>
                        <span className="text-slate-400">×</span>
                        <span className="font-black text-slate-900">{count} tờ</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN 3: ĐỐI SOÁT CHUYỂN KHOẢN NGÂN HÀNG */}
            <div className="mb-5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-blue-700" />
                3. Đối soát chuyển khoản ngân hàng (Bank / VietQR)
              </h3>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-600">
                        Doanh thu chuyển khoản phần mềm ghi nhận:
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        {formatMoney(shiftData.bankTransferRevenue)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 border-t border-slate-300">
                      <td className="py-2.5 px-3 font-black text-slate-900 uppercase">
                        TIỀN CHUYỂN KHOẢN THỰC NHẬN TRÊN APP / SAO KÊ:
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-sm text-blue-900">
                        {formatMoney(
                          shiftData.totalBankTransferActual !== undefined && shiftData.totalBankTransferActual !== null
                            ? shiftData.totalBankTransferActual
                            : shiftData.bankTransferRevenue
                        )}
                      </td>
                    </tr>
                    <tr className="bg-white border-t border-slate-200">
                      <td className="py-2 px-3 font-bold text-slate-700">
                        Kết quả chênh lệch chuyển khoản:
                      </td>
                      <td className="py-2 px-3 text-right">
                        {bankDiff === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> 0 đ • KHỚP CHUYỂN KHOẢN HOÀN TOÀN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            {bankDiff > 0 ? '+' : ''}{formatMoney(bankDiff)} (LỆCH SAO KÊ)
                          </span>
                        )}
                      </td>
                    </tr>
                    {shiftData.bankTransferDifferenceReason && (
                      <tr className="bg-rose-50/50">
                        <td className="py-2 px-3 text-rose-800 font-semibold italic">
                          Lý do giải trình chênh lệch chuyển khoản:
                        </td>
                        <td className="py-2 px-3 text-right text-rose-900 italic font-medium">
                          {shiftData.bankTransferDifferenceReason}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PHẦN 4: GHI CHÚ BÀN GIAO */}
            {shiftData.note && (
              <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Ghi chú bàn giao & Lưu ý ca trực:
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {shiftData.note}
                </p>
              </div>
            )}

            {/* PHẦN 5: CHỮ KÝ XÁC NHẬN BÀN GIAO 2 BÊN */}
            <div className="mt-8 pt-4 border-t-2 border-slate-200">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    NGƯỜI BÀN GIAO CA
                  </p>
                  <p className="text-[10px] text-slate-400 italic mb-16">
                    (Ký, ghi rõ họ tên)
                  </p>
                  <div className="border-t border-dashed border-slate-300 pt-2 w-48 mx-auto">
                    <p className="font-bold text-slate-900 text-xs">
                      {shiftData.employeeName || 'Bên giao ca'}
                    </p>
                    <p className="text-[10px] text-slate-400">Bên giao ca</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    NGƯỜI NHẬN BÀN GIAO
                  </p>
                  <p className="text-[10px] text-slate-400 italic mb-16">
                    (Ký, ghi rõ họ tên)
                  </p>
                  <div className="border-t border-dashed border-slate-300 pt-2 w-48 mx-auto">
                    <p className="font-bold text-slate-900 text-xs">
                      {shiftData.handoverEmployeeName || 'Quản lý / Thu ngân ca sau'}
                    </p>
                    <p className="text-[10px] text-slate-400">Bên nhận ca</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 italic mt-8 border-t border-slate-100 pt-3">
                Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để đối chiếu lưu trữ.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
