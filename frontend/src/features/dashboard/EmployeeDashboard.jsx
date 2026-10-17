import { useState } from 'react';
import DashboardHeader from './receptionist/DashboardHeader';
import StatsRow from './receptionist/StatsRow';
import AppointmentTable from './receptionist/AppointmentTable';
import AppointmentRequests from './receptionist/AppointmentRequests';
import QuickActions from './receptionist/QuickActions';
import CreateAppointmentModal from '../../components/ui/CreateAppointmentModal';
import { useReceptionistDashboard } from '../../hooks/useReceptionistDashboard';
import { staffName } from './receptionist/receptionistData';

export default function EmployeeDashboard() {
  const { stats, appointments, requests, loading, refetch } = useReceptionistDashboard();
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
    <div className="mx-auto max-w-[1400px] px-1">
      {/* Header */}
      <DashboardHeader
        staffName={staffName}
        onOpenCreateModal={() => handleOpenModal('add', null)}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Stats row */}
      <div className="mt-3">
        <StatsRow stats={stats} loading={loading} />
      </div>

      {/* Main content: 2 columns */}
      <div className="mt-3 flex gap-3 items-start">
        {/* Left column — Appointment table */}
        <div className="min-w-0 flex-[73]">
          <AppointmentTable
            appointments={appointments}
            onRefresh={refetch}
            onOpenEditModal={(apt) => handleOpenModal('edit', apt)}
          />
        </div>

        {/* Right column — Requests + Quick actions */}
        <div className="flex flex-[27] flex-col gap-3">
          <AppointmentRequests
            requests={requests}
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
