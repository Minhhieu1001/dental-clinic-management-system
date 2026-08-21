import { ChevronLeft, Stethoscope, Printer, Save, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MedicalRecordHeader({
  patientName,
  patientCode,
  saving,
  onSave,
  onBack,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/90 bg-gradient-to-r from-white via-teal-50/20 to-white shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-all shadow-2xs cursor-pointer"
          title="Quay lại danh sách"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-100/80 text-teal-800 border border-teal-200 shrink-0">
              <Stethoscope size={16} />
            </span>
            <span>Hồ Sơ Bệnh Án Điện Tử</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-teal-800">{patientName || 'Bệnh Nhân'}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-2 pt-0.5">
            <span>Mã Bệnh Nhân:</span>
            <span className="font-extrabold text-teal-800 rounded bg-teal-50 px-2 py-0.2 border border-teal-200/80">
              {patientCode || 'N/A'}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck size={13} className="text-emerald-600" /> Hệ Thống Quản Lý Nha Khoa Crown
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => toast.success('Đã gửi yêu cầu in hồ sơ bệnh án!')}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-800 transition-all shadow-2xs cursor-pointer"
        >
          <Printer size={15} className="text-slate-500" />
          <span>In hồ sơ</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-700 to-teal-800 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:from-teal-800 hover:to-teal-900 transition-all cursor-pointer disabled:opacity-70"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
        </button>
      </div>
    </div>
  );
}
