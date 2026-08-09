import DentistDashboard from '../dashboard/DentistDashboard';

export default function DentistAppointments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản Lý Lịch Hẹn Khám Bác Sĩ</h2>
          <p className="text-xs text-slate-500">Xem và xử lý toàn bộ lịch hẹn khám bệnh nhân trong ca làm việc</p>
        </div>
      </div>
      <DentistDashboard />
    </div>
  );
}
