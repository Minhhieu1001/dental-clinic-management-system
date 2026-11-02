import { useState } from 'react';
import Loading from '../../components/ui/Loading';
import DashboardHeader from './receptionist/DashboardHeader';
import StatsRow from './receptionist/StatsRow';
import AppointmentTable from './receptionist/AppointmentTable';
import AppointmentRequests from './receptionist/AppointmentRequests';
import QuickActions from './receptionist/QuickActions';
import CreateAppointmentModal from '../../components/ui/CreateAppointmentModal';
import { useReceptionistDashboard } from '../../hooks/useReceptionistDashboard';
import { staffName } from './receptionist/receptionistData';

export default function EmployeeDashboard() {
  const { stats, appointments, requests, loading, refetch, updateAppointmentInState } = useReceptionistDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [modalPayload, setModalPayload] = useState(null);

  const handleOpenModal = (type = 'add', payloadData = null) => {
    setModalType(type);
    setModalPayload(payloadData);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalPayload(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  return (
    <div className="relative w-full space-y-3 p-1" aria-busy={loading}>
      {loading && appointments.length === 0 && <Loading overlay title="Đang tải dữ liệu..." />}
      {/* Header */}
      <DashboardHeader
        staffName={staffName}
        onOpenCreateModal={() => handleOpenModal('add', null)}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Stats row */}
      <div>
        <StatsRow stats={stats} loading={loading} />
      </div>

      {/* Main content: 2 columns */}
      <div className="flex flex-col lg:flex-row gap-3 items-start w-full">
        {/* Left column — Appointment table */}
        <div className="min-w-0 w-full lg:flex-[73]">
          <AppointmentTable
            appointments={appointments}
            onRefresh={refetch}
            onUpdateAppointment={updateAppointmentInState}
            onOpenEditModal={(apt) => handleOpenModal('edit', apt)}
          />
        </div>

        {/* Right column — Requests + Quick actions */}
        <div className="flex w-full lg:flex-[27] flex-col gap-3">
          <AppointmentRequests
            requests={requests}
            appointments={appointments}
            onRefresh={refetch}
            onOpenCreateModal={(reqData) => handleOpenModal('add', reqData)}
          />
          <QuickActions onOpenCreateModal={() => handleOpenModal('add', null)} />
        </div>
      </div>

      {/* Modal create/edit appointment */}
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        type={modalType}
        payload={modalPayload}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
