import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { getEmployeeById } from '../../../../services/employee.service';
import { Dialog, DialogContent } from '@mui/material';
import { X, Printer, Smartphone, Building2, Phone } from 'lucide-react';

export default function CheckinQrModal({ open, onClose }) {
  const { user } = useAuth();
  const [employeeBranchId, setEmployeeBranchId] = useState('');
  useEffect(() => {
    setEmployeeBranchId('');
    if (!open || !user?.employeeId) return;
    let active = true;
    getEmployeeById(user.employeeId).then((employee) => {
      if (active) setEmployeeBranchId(employee.branchId || '');
    }).catch(() => {});
    return () => { active = false; };
  }, [open, user?.employeeId]);
  const branchId = employeeBranchId || user?.branchId;
  // Tự động phát hiện URL: Nếu mở bằng localhost thì đổi sang IP Wi-Fi máy tính để điện thoại quét được
  const getCheckinUrl = () => {
    const baseUrl = import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin;
    return `${baseUrl.replace(/\/$/, '')}/checkin?branchId=${encodeURIComponent(branchId || '')}`;
  };

  const checkinUrl = getCheckinUrl();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkinUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(13, 78, 64, 0.25)',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }} className="bg-white text-slate-900 font-sans">

          {/* Header */}
          <div className="relative bg-gradient-to-r from-teal-700 to-emerald-800 text-white p-5 text-center">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Mã QR Tự Check-in
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Quét mã để tự xác nhận lịch hẹn
            </p>
          </div>

          {/* Body: Chỉ hiện mã QR */}
          <div className="p-6 text-center space-y-4">
            <div className="inline-block p-3 bg-white rounded-2xl border-2 border-teal-500/20 shadow-sm">
              {branchId ? <img
                src={qrImageUrl}
                alt="Mã QR Check-in"
                className="w-60 h-60 object-contain mx-auto rounded-lg"
              /> : <p className="text-sm text-slate-500">Chưa xác định được chi nhánh của nhân viên.</p>}
              <p className="mt-2 text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-600" />
                <span>Quét bằng Camera hoặc Zalo</span>
              </p>
            </div>

            {/* Nút In Mã QR duy nhất */}
            <div>
              <button
                type="button"
                disabled={!branchId}
                onClick={handlePrint}
                className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition active:scale-[0.99] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Mã QR Để Bàn</span>
              </button>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Bản in Standee / Bảng để bàn khi bấm nút In (@media print) */}
      <div className="hidden print:flex fixed inset-0 bg-white z-[9999] flex-col items-center justify-center p-8 text-center font-sans">
        <div className="w-[400px] p-8 border-4 border-teal-700 rounded-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="w-8 h-8 text-teal-700" />
            <h1 className="text-2xl font-black text-slate-900">NHA KHOA CROWN DENTAL</h1>
          </div>

          <div className="bg-teal-700 text-white py-2 px-4 rounded-xl text-base font-black tracking-wider uppercase mb-5">
            QUÉT MÃ ĐỂ TỰ CHECK-IN
          </div>

          <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl inline-block mb-4">
            <img src={qrImageUrl} alt="QR Standee" className="w-64 h-64 mx-auto" />
          </div>

          <p className="text-sm font-bold text-slate-800 mb-1">
            Mở Camera điện thoại hoặc Zalo để quét
          </p>
          <p className="text-xs text-slate-500 mb-5">
            Xác nhận lịch hẹn nhanh chóng • Không cần xếp hàng
          </p>

          <div className="pt-3 border-t border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4 text-teal-700" />
            <span>Hotline hỗ trợ: 1900 8059</span>
          </div>
        </div>
      </div>
    </>
  );
}
