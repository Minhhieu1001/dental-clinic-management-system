import { useState, useEffect, useCallback } from 'react';
import { getAppointmentRequestToday } from '../services/appointmentRequest.service';
import { getAppointments } from '../services/appointment.service';
import { statsData as mockStats, todayAppointments as mockAppointments, appointmentRequests as mockRequests } from '../features/dashboard/receptionist/receptionistData';

/**
 * Custom Hook: useReceptionistDashboard
 * Quản lý dữ liệu thật cho Dashboard Lễ Tân.
 */
export function useReceptionistDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    appointmentsToday: { value: 0, compareLabel: 'Lịch hẹn hôm nay' },
    requestsToday: { value: 0 },
    checkedIn: { value: 0, ratio: '0% lịch hẹn' },
    waiting: { value: 0, avgWait: 'Trung bình 12 phút' },
    revenue: mockStats.revenue,
  });
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);

  const formatAppointment = (dto) => {
    let timeStr = '09:00';
    if (dto.appointmentTime) {
      try {
        const d = new Date(dto.appointmentTime);
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch (e) {
        timeStr = String(dto.appointmentTime).substring(11, 16) || '09:00';
      }
    }

    const patientName = dto.patientName || 'Khách vãng lai';
    const initials = patientName
      .split(' ')
      .map((n) => n[0])
      .slice(-2)
      .join('')
      .toUpperCase();

    // Map status enum to UI status key
    let uiStatus = 'waiting';
    if (dto.status === 'COMPLETED') uiStatus = 'completed';
    else if (dto.status === 'IN_PROGRESS') uiStatus = 'in-progress';
    else if (dto.status === 'WAITING' || dto.status === 'CONFIRMED') uiStatus = 'waiting';
    else if (dto.status === 'CANCELLED') uiStatus = 'cancelled';
    else if (dto.status === 'PENDING') uiStatus = 'not-arrived';

    return {
      id: dto.id,
      time: timeStr,
      patientName: patientName,
      patientCode: dto.patientCode || 'BN-NEW',
      phone: dto.phone || '09xx xxx xxx',
      initials: initials || 'BN',
      isNewPatient: !dto.patientCode || dto.patientCode === 'N/A',
      service: dto.reason || 'Khám tổng quát',
      dentist: dto.dentistName || 'Chưa phân công',
      status: uiStatus,
      rawStatus: dto.status,
    };
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsRes, appointmentsRes] = await Promise.allSettled([
        getAppointmentRequestToday(),
        getAppointments(),
      ]);

      const requestsData = requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value) ? requestsRes.value : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' && Array.isArray(appointmentsRes.value) ? appointmentsRes.value : [];

      setRequests(requestsData);

      if (appointmentsData.length > 0) {
        const formatted = appointmentsData.map(formatAppointment);
        setAppointments(formatted);
      } else {
        setAppointments([]);
      }

      const activeRequests = requestsData.length;
      const activeAppointments = appointmentsData.length;

      const checkedInCount = appointmentsData.filter(
        (a) => a.status === 'COMPLETED' || a.status === 'IN_PROGRESS'
      ).length;

      const waitingCount = appointmentsData.filter(
        (a) => a.status === 'WAITING' || a.status === 'CONFIRMED' || a.status === 'PENDING'
      ).length;

      setStats({
        appointmentsToday: {
          value: activeAppointments,
          compareLabel: '↑ Lịch hẹn hôm nay',
        },
        requestsToday: {
          value: activeRequests,
        },
        checkedIn: {
          value: checkedInCount,
          ratio: `${Math.round((checkedInCount / (activeAppointments || 1)) * 100)}% lịch hẹn`,
        },
        waiting: {
          value: waitingCount,
          avgWait: 'Trung bình 12 phút',
        },
        revenue: mockStats.revenue,
      });
    } catch (err) {
      console.warn('Lỗi fetch dữ liệu cho Dashboard Lễ Tân:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    appointments,
    requests,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
