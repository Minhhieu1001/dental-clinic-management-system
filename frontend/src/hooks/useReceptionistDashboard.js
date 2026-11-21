import { useState, useEffect, useCallback } from 'react';
import { getAppointmentRequestToday } from '../services/appointmentRequest.service';
import { getAppointmentsByDay, getAppointmentsByWeek } from '../services/appointment.service';
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
    const roomStr = dto.roomName || null;
    const dentistStr = dto.dentistName ? (dto.dentistName.startsWith('BS.') ? dto.dentistName : `BS. ${dto.dentistName}`) : 'BS. Nguyễn Thị Phương';
    const calledInfo = roomStr ? `${calledTimeStr} - ${dentistStr} - ${roomStr}` : `${calledTimeStr} - ${dentistStr}`;

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
      dentistName: dto.dentistName || 'Chưa phân công',
      roomName: roomStr,
      status: uiStatus,
      rawStatus: dto.status,
      notes: dto.notes || '',
      calledInfo: calledInfo,
      branchId: dto.branchId || null,
      branchName: dto.branchName || null,
      branchAddress: dto.branchAddress || null,
      requestIdStr: dto.requestIdStr || dto.attribute || null,
      requestId: dto.requestId || dto.requestIdStr || dto.attribute || null,
      createdAt: dto.createdAt || null,
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

      const [requestsRes, weekAppointmentsRes, dayAppointmentsRes] = await Promise.allSettled([
        getAppointmentRequestToday(),
        getAppointmentsByWeek(todayStr),
        getAppointmentsByDay(todayStr),
      ]);

      const requestsData = requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value) ? requestsRes.value : [];
      const weekData = weekAppointmentsRes.status === 'fulfilled' && Array.isArray(weekAppointmentsRes.value) ? weekAppointmentsRes.value : [];
      const dayData = dayAppointmentsRes.status === 'fulfilled' && Array.isArray(dayAppointmentsRes.value) ? dayAppointmentsRes.value : [];

      setRequests(requestsData);

      // Gộp các lịch hẹn tuần & ngày của chi nhánh
      const mapById = new Map();
      weekData.forEach((a) => { if (a && a.id) mapById.set(a.id, a); });
      dayData.forEach((a) => { if (a && a.id) mapById.set(a.id, a); });
      const combinedAppointments = Array.from(mapById.values());

      const formatted = combinedAppointments.map(formatAppointment);
      setAppointments(formatted);

      const statsCalculated = computeStats(formatted);
      setStats(statsCalculated);
    } catch (err) {
      console.warn('Lỗi fetch dữ liệu cho Dashboard Lễ Tân:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper tính toán Stats từ danh sách appointments đã formatted
  const computeStats = (formatted) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;

    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

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

    const todayAppointments = formatted.filter((a) => {
      const dVal = a.appointmentDate || a.appointmentTime;
      const dStr = extractYYYYMMDD(dVal);
      return dStr === todayStr;
    });

    const acceptedTodayCount = todayAppointments.filter((a) => {
      const s = a.rawStatus || a.status;
      return s === 'WAITING' || s === 'CALLED' || s === 'IN_PROGRESS' || s === 'COMPLETED' || s === 'waiting' || s === 'called';
    }).length;

    const notArrivedTodayCount = todayAppointments.filter((a) => {
      const s = a.rawStatus || a.status;
      return s === 'CONFIRMED' || s === 'PENDING' || s === 'not-arrived';
    }).length;

    const cancelledAppointmentsCount = formatted.filter((a) => {
      const s = a.rawStatus || a.status;
      return s === 'CANCELLED' || s === 'cancelled' || s === 'REJECTED';
    }).length;

    return {
      appointmentsThisWeek: { value: weekAppointments.length },
      appointmentsToday: { value: todayAppointments.length },
      acceptedToday: { value: acceptedTodayCount },
      notArrivedToday: { value: notArrivedTodayCount },
      cancelledAppointments: { value: cancelledAppointmentsCount },
    };
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Callback cập nhật trực tiếp trên State (không cần gọi lại API refresh)
  const updateAppointmentInState = useCallback((updatedApt) => {
    if (!updatedApt || !updatedApt.id) return;
    const formattedItem = formatAppointment(updatedApt);
    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === formattedItem.id);
      let nextList = [];
      if (exists) {
        nextList = prev.map((item) => (item.id === formattedItem.id ? { ...item, ...formattedItem } : item));
      } else {
        nextList = [formattedItem, ...prev];
      }
      setStats(computeStats(nextList));
      return nextList;
    });
  }, []);

  // Realtime updates via WebSocket for Receptionist Dashboard (Cập nhật trực tiếp State, không gọi lại API)
  const handleRealtimeAppointment = useCallback((updatedApt) => {
    updateAppointmentInState(updatedApt);
  }, [updateAppointmentInState]);

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
    updateAppointmentInState,
  };
}
