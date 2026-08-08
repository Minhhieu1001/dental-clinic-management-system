import DashboardHeader from './receptionist/DashboardHeader';
import StatsRow from './receptionist/StatsRow';
import AppointmentTable from './receptionist/AppointmentTable';
import AppointmentRequests from './receptionist/AppointmentRequests';
import QuickActions from './receptionist/QuickActions';
import { useReceptionistDashboard } from '../../hooks/useReceptionistDashboard';
import { staffName } from './receptionist/receptionistData';

export default function EmployeeDashboard() {
  const { stats, appointments, requests, loading } = useReceptionistDashboard();

  return (
    <div className="mx-auto max-w-[1400px] px-1">
      {/* Header */}
      <DashboardHeader staffName={staffName} />

      {/* Stats row */}
      <div className="mt-3">
        <StatsRow stats={stats} loading={loading} />
      </div>

      {/* Main content: 2 columns */}
      <div className="mt-3 flex gap-3 items-start">
        {/* Left column — Appointment table */}
        <div className="min-w-0 flex-[73]">
          <AppointmentTable appointments={appointments} />
        </div>

        {/* Right column — Requests + Quick actions */}
        <div className="flex flex-[27] flex-col gap-3">
          <AppointmentRequests requests={requests} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
