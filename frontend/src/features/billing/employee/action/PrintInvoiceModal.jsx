import React from 'react';
import { Printer, X, Stethoscope } from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';

export default function PrintInvoiceModal({ open, onClose, invoice }) {
  if (!invoice) return null;

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  const handlePrint = () => {
    window.print();
  };

  const servicesSum = invoice.services?.reduce((s, i) => s + (Number(i.total) || 0), 0) || 0;
  const serviceTotal = servicesSum > 0 ? servicesSum : Number(invoice.totalAmount || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const finalTotal = Number(invoice.finalAmount ?? Math.max(0, serviceTotal - discountAmount));
  const paidAmount = Number(invoice.paidAmount || 0);
  const remainingDebt = Number(invoice.debtAmount ?? Math.max(0, finalTotal - paidAmount));

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .MuiDialog-paper, .MuiDialog-container, .MuiDialog-root {
            position: static !important;
            overflow: visible !important;
            box-shadow: none !important;
            background: transparent !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .MuiBackdrop-root {
            display: none !important;
          }
        }
      `}</style>

      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          onClose();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '4px',
            overflow: 'hidden',
            maxWidth: '720px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-blue-400" />
            <span className="font-bold text-sm">Xem trước Hóa đơn thanh toán</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer border border-blue-500 shadow-xs"
            >
              <Printer size={14} />
              <span>In hóa đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body with scrollable content */}
        <DialogContent className="bg-slate-100 p-4 sm:p-6 overflow-y-auto flex justify-center items-start print:p-0 print:bg-white">
          {/* Unified Printable Sheet Card */}
          <div
            id="printable-invoice"
            className="bg-white w-full max-w-[660px] p-6 sm:p-8 rounded-sm text-slate-800 font-sans space-y-6 border border-slate-200 shadow-sm my-auto print:shadow-none print:border-none print:my-0 print:p-0"
          >
            {/* Header: Logo & Clinic Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">NHA KHOA QUỐC TẾ CROWN DENTAL</h2>
                  <p className="text-[11px] text-slate-700 font-semibold">{invoice.branchName || 'Chi Nhánh 1 Cơ Sở TPHCM'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
                <p><span className="text-slate-500">Địa chỉ:</span> <span className="font-bold text-slate-800">{invoice.branchAddress || '59C Nguyễn Đình Chiểu, Phường Võ Thị Sáu, Quận 3, TP.HCM'}</span></p>
                <p><span className="text-slate-500">Hotline:</span> <span className="font-bold text-slate-800">{invoice.branchPhone || '0777888555'}</span></p>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-center py-1">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">HÓA ĐƠN THANH TOÁN</h1>
            </div>

            {/* Patient & Invoice Info */}
            <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: Patient Info */}
              <div className="space-y-0.5  pb-2 sm:pb-0 sm:pr-4">
                <p className="flex items-center">
                  <span className="text-slate-500 font-medium w-24 shrink-0">Họ và tên:</span>
                  <strong className="text-slate-900 font-bold">{invoice.patientName || 'Khách hàng'}</strong>
                </p>
                <p className="flex items-center">
                  <span className="text-slate-500 font-medium w-24 shrink-0">Số điện thoại:</span>
                  <strong className="text-slate-800 font-semibold">{invoice.patientPhone || '-'}</strong>
                </p>
                <p className="flex items-center">
                  <span className="text-slate-500 font-medium w-24 shrink-0">Ngày sinh:</span>
                  <span className="text-slate-800 font-medium">{invoice.patientDob || '-'}</span>
                </p>
                <p className="flex items-start">
                  <span className="text-slate-500 font-medium w-24 shrink-0">Địa chỉ:</span>
                  <span className="text-slate-800 font-medium">{invoice.patientAddress || '-'}</span>
                </p>
              </div>

              {/* Right Column: Invoice Info (Aligned Far Right) */}
              <div className="space-y-0.5 sm:pl-2 text-left sm:text-right">
                <p className="flex sm:justify-end items-center gap-2">
                  <span className="text-slate-500 font-medium">Mã hóa đơn:</span>
                  <strong className="text-slate-900 font-bold">{invoice.id}</strong>
                </p>
                <p className="flex sm:justify-end items-center gap-2">
                  <span className="text-slate-500 font-medium">Ngày tạo:</span>
                  <strong className="text-slate-800 font-bold">{invoice.date}</strong>
                </p>
                <p className="flex sm:justify-end items-center gap-2">
                  <span className="text-slate-500 font-medium">Người lập:</span>
                  <strong className="text-slate-800 font-semibold">{invoice.employeeName || 'Nhân viên'}</strong>
                </p>
              </div>
            </div>

            {/* Service Table */}
            <div className="border border-slate-200 rounded-sm overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[480px]">
                <thead className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">STT</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Tên dịch vụ</th>
                    <th className="py-2.5 px-3 text-right border-r border-slate-200">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center w-14 border-r border-slate-200">SL</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {invoice.services?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">{index + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">{item.name}</td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200">{formatVND(item.price)}</td>
                      <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">{formatVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-1">
              <div className="w-full sm:w-80 bg-slate-50 p-3 sm:p-4 rounded-sm border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Tổng tiền dịch vụ:</span>
                  <span className="font-bold text-slate-900">{formatVND(serviceTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Tiền giảm giá:</span>
                  <span className="font-bold text-emerald-600">
                    {discountAmount > 0 ? `-${formatVND(discountAmount)}` : '0 đ'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-900 font-bold pt-2 border-t border-slate-200 text-xs sm:text-sm">
                  <span>Tổng tiền thanh toán cuối:</span>
                  <span className="font-black text-slate-900">{formatVND(finalTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 font-medium pt-1">
                  <span>Đã thanh toán:</span>
                  <span className="font-bold text-emerald-700">{formatVND(paidAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-rose-600 font-bold pt-1.5 border-t border-slate-200">
                  <span>Còn nợ:</span>
                  <span className="text-sm sm:text-base font-black">{formatVND(remainingDebt)}</span>
                </div>
              </div>
            </div>

            {/* Signature Block - strictly inside white card container */}
            <div className="pt-6 border-t border-dashed border-slate-300 flex justify-between items-end text-xs">
              <div className="text-center px-4">
                <p className="font-bold text-slate-800">Khách hàng ký tên</p>
                <div className="h-14"></div>
                <p className="text-[11px] text-slate-500 font-medium">{invoice.patientName || 'Khách hàng'}</p>
              </div>

              <div className="text-center px-4">
                <p className="font-bold text-slate-800">Người lập hóa đơn</p>
                <div className="h-14"></div>
                <p className="text-[11px] text-slate-600 font-semibold">{invoice.employeeName || invoice.creator || 'Nhân viên'}</p>
              </div>
            </div>

            {/* Footer Thank You Note */}
            <div className="text-center pt-2 pb-1">
              <p className="text-[11px] font-medium text-slate-400 italic">
                Cảm ơn quý khách đã sử dụng dịch vụ tại Nha Khoa Quốc Tế Crown Dental!
              </p>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
