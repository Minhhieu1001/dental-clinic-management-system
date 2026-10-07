import React, { useRef } from 'react';
import { X, Printer, Calendar } from 'lucide-react';

const formatDateTimeDisplay = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

export default function FollowUpPrintModal({
  isOpen,
  onClose,
  followUp,
  patient,
  selectedSession,
}) {
  const printRef = useRef(null);

  if (!isOpen || !followUp) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Giấy Hẹn Tái Khám - ${patient?.fullName || 'Bệnh Nhân'}</title>
          <style>
            @body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
            .print-container { width: 100%; max-width: 700px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; }
            .header-table { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
            .clinic-name { font-size: 18px; font-weight: bold; color: #0f766e; text-transform: uppercase; }
            .clinic-sub { font-size: 11px; color: #475569; }
            .title { text-align: center; font-size: 20px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin: 20px 0 15px 0; }
            .info-table { width: 100%; margin-bottom: 16px; border-collapse: collapse; font-size: 13px; }
            .info-table td { padding: 6px 4px; vertical-align: top; }
            .label { font-weight: bold; color: #475569; width: 150px; }
            .appointment-box { background-color: #f0fdf4; border: 2px solid #0d9488; border-radius: 4px; padding: 16px; text-align: center; margin: 20px 0; }
            .appointment-time { font-size: 18px; font-weight: bold; color: #0f766e; margin-top: 4px; }
            .footer-table { width: 100%; margin-top: 40px; font-size: 12px; text-align: center; }
            .signature-title { font-weight: bold; margin-bottom: 60px; }
            @media print {
              .print-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-sm bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header toolbar */}
        <div className="flex items-center justify-between bg-slate-100 px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-teal-700" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              XEM TRƯỚC BẢN IN GIẤY HẸN TÁI KHÁM
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              <Printer size={14} /> In Giấy Hẹn
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable document area */}
        <div className="p-6 bg-slate-50 max-h-[75vh] overflow-y-auto">
          <div
            ref={printRef}
            className="print-container bg-white p-8 border border-slate-200 shadow-sm rounded-sm text-slate-800 text-xs mx-auto max-w-xl"
          >
            {/* Header Clinic */}
            <table className="header-table w-full border-b-2 border-teal-700 pb-3 mb-4">
              <tbody>
                <tr>
                  <td className="w-2/3">
                    <div className="clinic-name text-base font-extrabold text-teal-800 uppercase">
                      NHA KHOA QUỐC TẾ CROWN DENTAL
                    </div>
                    <div className="clinic-sub text-[11px] text-slate-600 mt-0.5">
                      Địa chỉ: 12 Nguyễn Văn Bảo, Phường 4, Q. Gò Vấp, TP. HCM
                    </div>
                    <div className="clinic-sub text-[11px] text-slate-600">
                      Hotline: 0343632524 | Email: contact@crowndental.com
                    </div>
                  </td>
                  <td className="w-1/3 text-right text-[11px] text-slate-500">
                    <div>Ngày lập: <strong>{formatDateDisplay(followUp.createAt || followUp.createdAt)}</strong></div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Title */}
            <div className="title text-center text-lg font-bold text-teal-800 uppercase tracking-wide my-4">
              GIẤY HẸN TÁI KHÁM
            </div>

            {/* Patient Info */}
            <table className="info-table w-full mb-4 text-xs">
              <tbody>
                <tr>
                  <td className="label font-bold text-slate-600 w-32 py-1">Họ tên bệnh nhân:</td>
                  <td className="font-bold text-slate-900 py-1">{patient?.fullName || followUp.patientName || '—'}</td>
                  <td className="label font-bold text-slate-600 w-24 py-1">Mã BN:</td>
                  <td className="font-bold text-teal-800 py-1 font-mono">{patient?.patientCode || followUp.patientCode || '—'}</td>
                </tr>
                <tr>
                  <td className="label font-bold text-slate-600 py-1">Số điện thoại:</td>
                  <td className="py-1">{patient?.phone || patient?.phoneNumber || followUp.patientPhone || '—'}</td>
                  <td className="label font-bold text-slate-600 py-1">Giới tính:</td>
                  <td className="py-1">{patient?.gender === 'FEMALE' ? 'Nữ' : patient?.gender === 'MALE' ? 'Nam' : patient?.gender || '—'}</td>
                </tr>
                {patient?.address && (
                  <tr>
                    <td className="label font-bold text-slate-600 py-1">Địa chỉ:</td>
                    <td colSpan={3} className="py-1">{patient.address}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Appointment Box */}
            <div className="appointment-box bg-emerald-50/80 border-2 border-teal-600 rounded-sm p-4 text-center my-4">
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                THỜI GIAN HẸN TÁI KHÁM
              </div>
              <div className="appointment-time text-base font-extrabold text-teal-900 mt-1 capitalize">
                {formatDateTimeDisplay(followUp.followUpDate)}
              </div>
            </div>

            {/* Reason & Note */}
            <table className="info-table w-full mb-4 text-xs">
              <tbody>
                <tr>
                  <td className="label font-bold text-slate-600 w-36 py-1.5">Lý do tái khám:</td>
                  <td className="font-bold text-slate-900 py-1.5">{followUp.reason || 'Tái khám kiểm tra định kỳ'}</td>
                </tr>
                {followUp.note && (
                  <tr>
                    <td className="label font-bold text-slate-600 py-1.5">Lời dặn của bác sĩ:</td>
                    <td className="py-1.5 italic text-slate-800">{followUp.note}</td>
                  </tr>
                )}
                <tr>
                  <td className="label font-bold text-slate-600 py-1.5">Bác sĩ phụ trách:</td>
                  <td className="font-bold text-slate-900 py-1.5">{followUp.dentistName || 'Nha sĩ phụ trách'}</td>
                </tr>
                <tr>
                  <td className="label font-bold text-slate-600 py-1.5">Địa điểm khám:</td>
                  <td className="py-1.5 text-slate-900">Phòng khám Nha Khoa Quốc Tế Crown Dental (12 Nguyễn Văn Bảo, Gò Vấp)</td>
                </tr>
              </tbody>
            </table>

            <p className="text-[11px] text-slate-500 italic mt-3">
              * Quý khách vui lòng mang theo giấy hẹn này và đến trước 10 phút để được phục vụ tốt nhất. Nếu cần hoãn/đổi lịch hẹn, vui lòng liên hệ Hotline: <strong>0343632524</strong>.
            </p>

            {/* Signatures */}
            <table className="footer-table w-full mt-8 text-center text-xs">
              <tbody>
                <tr>
                  <td className="w-1/2">
                    <div className="font-bold text-slate-700 mb-12">BỆNH NHÂN / NGƯỜI THÂN</div>
                    <div className="text-[11px] text-slate-400">(Ký và ghi rõ họ tên)</div>
                  </td>
                  <td className="w-1/2">
                    <div className="font-bold text-slate-700 mb-12">BÁC SĨ ĐIỀU TRỊ</div>
                    <div className="font-bold text-slate-900">{followUp.dentistName || 'BS. Nha Khoa Crown Dental'}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
