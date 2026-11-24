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
  const { appointmentSearch, searchAppointments, appointmentDate, changeAppointmentDate, dayAppointments, appointmentsLoading, appointmentsError, refreshAppointments, stats, appointments, requests, loading, refetch, updateAppointmentInState, requestDate, changeRequestDate, requestsLoading, requestsError, refreshRequests } = useReceptionistDashboard();
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

      {/* Stats row & Quick Actions trên cùng 1 hàng */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch w-full">
        {/* 5 khối thống kê tổng quan */}
        <div className="min-w-0 w-full lg:flex-[73]">
          <StatsRow stats={stats} loading={loading} />
        </div>

        {/* Khối thao tác nhanh */}
        <div className="w-full lg:flex-[27] min-w-0">
          <QuickActions onOpenCreateModal={() => handleOpenModal('add', null)} />
        </div>
      </div>

      {/* Main content: 2 columns */}
      <div className="flex flex-col lg:flex-row gap-3 items-start w-full">
        {/* Left column — Appointment table */}
        <div className="min-w-0 w-full lg:flex-[73]">
          <AppointmentTable
            appointments={dayAppointments}
            appointmentDate={appointmentDate}
            appointmentSearch={appointmentSearch}
            onSearchAppointments={searchAppointments}
            onAppointmentDateChange={changeAppointmentDate}
            appointmentsLoading={appointmentsLoading}
            appointmentsError={appointmentsError}
            onRefresh={refreshAppointments}
            onUpdateAppointment={updateAppointmentInState}
            onOpenEditModal={(apt) => handleOpenModal('edit', apt)}
          />
        </div>

        {/* Right column — Requests */}
        <div className="flex w-full lg:flex-[27] flex-col gap-3">
          <AppointmentRequests
            requestDate={requestDate}
            onRequestDateChange={changeRequestDate}
            requestsLoading={requestsLoading}
            requestsError={requestsError}
            requests={requests}
            appointments={appointments}
            onRefresh={refreshRequests}
            onOpenCreateModal={(reqData) => handleOpenModal('add', reqData)}
          />
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

////