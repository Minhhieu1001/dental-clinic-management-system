import { useState, useEffect, useCallback } from 'react';
import { getAppointmentRequestToday } from '../services/appointmentRequest.service';
import { getAppointments } from '../services/appointment.service';
import { useWebSocket } from './useWebSocket';

/**
 * Custom Hook: useReceptionistDashboard
 * Quản lý dữ liệu thật cho Dashboard Lễ Tân.
 */
export function useReceptionistDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    appointmentsThisWeek: { value: 0 },
    appointmentsToday: { value: 0 },
    acceptedToday: { value: 0 },
    notArrivedToday: { value: 0 },
    cancelledAppointments: { value: 0 },
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

    // Map status enum to UI status key directly
    let uiStatus = dto.status || 'CONFIRMED';
    if (dto.status === 'PENDING') uiStatus = 'CONFIRMED';

    // Generate call info string when status is CALLED
    const calledTimeStr = dto.updatedAt ? new Date(dto.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : timeStr;
    const roomStr = dto.roomName || 'Phòng 101';
    const dentistStr = dto.dentistName ? (dto.dentistName.startsWith('BS.') ? dto.dentistName : `BS. ${dto.dentistName}`) : 'BS. Nguyễn Thị Phương';
    const calledInfo = `${calledTimeStr} - ${dentistStr} - ${roomStr}`;

    return {
      id: dto.id,
      time: timeStr,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      patientName: patientName,
      patientCode: dto.patientCode || 'BN-NEW',
      phone: dto.phone || '09xx xxx xxx',
      initials: initials || 'BN',
      isNewPatient: !dto.patientCode || dto.patientCode === 'N/A',
      service: dto.reason || 'Khám tổng quát',
      dentist: dto.dentistName || 'Chưa phân công',
      roomName: roomStr,
      status: uiStatus,
      rawStatus: dto.status,
      notes: dto.notes || '',
      calledInfo: calledInfo,
    };
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;

      const [requestsRes, appointmentsRes] = await Promise.allSettled([
        getAppointmentRequestToday(),
        getAppointments(),
      ]);

      const requestsData = requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value) ? requestsRes.value : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' && Array.isArray(appointmentsRes.value) ? appointmentsRes.value : [];

      setRequests(requestsData);

      const formatted = appointmentsData.map(formatAppointment);
      setAppointments(formatted);

      // Helper function to extract YYYY-MM-DD
      const extractYYYYMMDD = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
          if (val.includes('T')) return val.split('T')[0];
          if (val.includes(' ')) return val.split(' ')[0];
          if (val.length >= 10) return val.substring(0, 10);
        }
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return null;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dt}`;
        } catch (e) {
          return null;
        }
      };

      // 1. Lịch hẹn trong tuần
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekAppointments = formatted.filter((a) => {
        const dVal = a.appointmentDate || a.appointmentTime;
        if (!dVal) return true;
        try {
          const d = new Date(dVal);
          return !isNaN(d.getTime()) && d >= monday && d <= sunday;
        } catch (e) {
          return true;
        }
      });

      // 2. Lịch hẹn hôm nay
      const todayAppointments = formatted.filter((a) => {
        const dVal = a.appointmentDate || a.appointmentTime;
        const dStr = extractYYYYMMDD(dVal);
        return dStr === todayStr;
      });

      // 3. Đã tiếp nhận (Bệnh nhân đã đến trong ngày: WAITING, CALLED, IN_PROGRESS, COMPLETED)
      const acceptedTodayCount = todayAppointments.filter((a) => {
        const s = a.rawStatus || a.status;
        return s === 'WAITING' || s === 'CALLED' || s === 'IN_PROGRESS' || s === 'COMPLETED' || s === 'waiting' || s === 'called';
      }).length;

      // 4. Bệnh nhân chưa đến trong ngày (CONFIRMED, PENDING, not-arrived)
      const notArrivedTodayCount = todayAppointments.filter((a) => {
        const s = a.rawStatus || a.status;
        return s === 'CONFIRMED' || s === 'PENDING' || s === 'not-arrived';
      }).length;

      // 5. Lịch hẹn bị hủy (CANCELLED)
      const cancelledAppointmentsCount = formatted.filter((a) => {
        const s = a.rawStatus || a.status;
        return s === 'CANCELLED' || s === 'cancelled' || s === 'REJECTED';
      }).length;

      setStats({
        appointmentsThisWeek: { value: weekAppointments.length },
        appointmentsToday: { value: todayAppointments.length },
        acceptedToday: { value: acceptedTodayCount },
        notArrivedToday: { value: notArrivedTodayCount },
        cancelledAppointments: { value: cancelledAppointmentsCount },
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

  // Realtime updates via WebSocket for Receptionist Dashboard (Cập nhật trực tiếp State, không gọi lại API)
  const handleRealtimeAppointment = useCallback((updatedApt) => {
    if (!updatedApt || !updatedApt.id) return;
    const formatted = formatAppointment(updatedApt);
    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === formatted.id);
      if (exists) {
        return prev.map((item) => (item.id === formatted.id ? { ...item, ...formatted } : item));
      } else {
        return [formatted, ...prev];
      }
    });
  }, []);

  const handleRealtimeRequest = useCallback((newReq) => {
    if (!newReq || !newReq.id) return;
    setRequests((prev) => {
      if (prev.some((r) => r.id === newReq.id)) return prev;
      return [newReq, ...prev];
    });
  }, []);

  useWebSocket(handleRealtimeAppointment, null, handleRealtimeRequest);

  return {
    stats,
    appointments,
    requests,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
