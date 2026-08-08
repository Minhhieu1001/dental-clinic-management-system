import { useState, useEffect, useCallback } from 'react';
import { getAppointmentRequestToday, } from '../services/appointmentRequest.service';
import { getAppointments } from '../services/appointment.service';
import { statsData as mockStats, todayAppointments as mockAppointments, appointmentRequests as mockRequests } from '../features/dashboard/receptionist/receptionistData';

/**
 * Custom Hook: useReceptionistDashboard
 * Quản lý dữ liệu thật cho Dashboard Lễ Tân.
 * Tự động fetch API, tổng hợp số liệu thống kê cho StatsRow,
 * và hỗ trợ fallback dữ liệu giả khi API chưa sẵn sàng.
 */
export function useReceptionistDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States dữ liệu
  const [stats, setStats] = useState(mockStats);
  const [appointments, setAppointments] = useState(mockAppointments);
  const [requests, setRequests] = useState(mockRequests);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch đồng thời các API cần thiết
      const [requestsRes, appointmentsRes] = await Promise.allSettled([
        getAppointmentRequestToday(),
        getAppointments(),
      ]);

      const requestsData = requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value) ? requestsRes.value : null;
      const appointmentsData = appointmentsRes.status === 'fulfilled' && Array.isArray(appointmentsRes.value) ? appointmentsRes.value : null;

      // 2. Cập nhật Yêu cầu đặt lịch
      if (requestsData) {
        setRequests(requestsData);
      }

      // 3. Cập nhật Lịch hẹn hôm nay
      if (appointmentsData && appointmentsData.length > 0) {
        setAppointments(appointmentsData);
      }

      // 4. Tính toán số liệu thực tế cho StatsRow
      const activeRequests = requestsData ? requestsData.length : mockRequests.length;
      const activeAppointments = appointmentsData ? appointmentsData.length : mockAppointments.length;

      const checkedInCount = appointmentsData
        ? appointmentsData.filter((a) => a.status === 'checked-in' || a.status === 'COMPLETED').length
        : mockStats.checkedIn.value;

      const waitingCount = appointmentsData
        ? appointmentsData.filter((a) => a.status === 'waiting' || a.status === 'PENDING').length
        : mockStats.waiting.value;

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
        revenue: mockStats.revenue, // Có thể thay bằng API doanh thu khi backend sẵn sàng
      });
    } catch (err) {
      console.warn('Sử dụng dữ liệu mock cho Dashboard Lễ Tân do API chưa sẵn sàng:', err);
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
