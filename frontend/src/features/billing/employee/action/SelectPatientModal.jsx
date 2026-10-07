import React from 'react';
import { Users, X } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

/**
 * SelectPatientModal - Modal cho phép chọn 1 hồ sơ bệnh nhân khi có nhiều hồ sơ trùng SĐT
 */
export default function SelectPatientModal({
  open,
  onClose,
  patients = [],
  phoneKeyword = '',
  onSelectPatient,
}) {
  const formatDob = (dobStr) => {
    if (!dobStr) return 'Chưa cập nhật';
    const d = new Date(dobStr);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return dobStr;
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ style: { borderRadius: '8px' } }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
          <Users size={18} />
          <span>Phát hiện nhiều hồ sơ trùng số điện thoại ({patients.length})</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </DialogTitle>

      <DialogContent className="!pt-4 pb-4 space-y-3">
        <p className="text-xs text-slate-600 pt-1">
          Số điện thoại <strong className="text-teal-700">{phoneKeyword}</strong> có {patients.length} hồ sơ bệnh nhân. Vui lòng chọn đúng bệnh nhân:
        </p>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p)}
              className="flex items-center justify-between p-3 border border-slate-200 rounded hover:border-teal-600 hover:bg-teal-50/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {(p.fullName || p.name || 'K').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-900">{p.fullName || p.name}</h4>
                    <span className="bg-teal-50 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded border border-teal-200">
                      Mã: {p.patientCode || p.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>SĐT: <strong className="text-slate-800">{p.phone || p.phoneNumber}</strong></span>
                    <span>Ngày sinh: <strong className="text-slate-800">{formatDob(p.dateOfBirth || p.dob)}</strong></span>
                    {(p.cccd || p.identityCard) && (
                      <span>CCCD: <strong className="text-slate-800">{p.cccd || p.identityCard}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPatient(p);
                }}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer shrink-0"
              >
                Chọn hồ sơ
              </button>
            </div>
          ))}
        </div>
      </DialogContent>

      <DialogActions className="border-t border-slate-200 px-4 py-2.5">
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
        >
          Đóng
        </button>
      </DialogActions>
    </Dialog>
  );
}
