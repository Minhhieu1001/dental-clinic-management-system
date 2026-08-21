import { useNavigate } from 'react-router-dom';
import { UserX, UserPlus } from 'lucide-react';

export default function EmptyPatientState({
  patientInfo = null,
  phone = '',
  onCreateRecord = () => {},
}) {
  const navigate = useNavigate();

  if (!patientInfo) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
          <UserX size={28} />
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm">Chưa chọn bệnh nhân</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
            Vui lòng chọn một bệnh nhân từ danh sách lịch hẹn để xem thông tin chi tiết.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 text-center space-y-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
        <UserX size={28} />
      </div>

      <div>
        <h3 className="font-bold text-slate-800 text-sm">
          Bệnh nhân {patientInfo.patientName || 'này'} chưa có hồ sơ
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
          {phone
            ? `Số điện thoại (${phone}) chưa có dữ liệu hồ sơ bệnh án trong hệ thống.`
            : 'Chưa tìm thấy dữ liệu hồ sơ bệnh án cho ca khám này.'}
        </p>
      </div>

      {/* Nút Tạo Hồ Sơ */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (onCreateRecord) onCreateRecord(patientInfo);
            navigate('/dentist/patients', {
              state: {
                openCreateModal: true,
                patientName: patientInfo?.patientName,
                phone: phone,
              },
            });
          }}
          className="inline-flex items-center gap-2 rounded-[4px] bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-800 transition-colors cursor-pointer"
        >
          <UserPlus size={15} />
          <span>+ Tạo hồ sơ</span>
        </button>
      </div>
    </div>
  );
}
