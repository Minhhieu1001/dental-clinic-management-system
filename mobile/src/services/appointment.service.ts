import { BOOKABLE_SLOT_TIMES } from '../constants/appointmentReasons';
import api from './api';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

export interface DentistItem {
  id: string;
  fullName: string;
  specialization?: string;
  avatar?: string;
  branchId?: string;
  branchName?: string;
  experienceYears?: number;
  dentistCode?: string;
}

/** Backend `/dentists/list` trả về `name` (DentistListResponse), không phải `fullName` */
function normalizeDentist(d: any): DentistItem {
  const raw: string =
    d?.fullName || d?.name || d?.user?.fullName || d?.user?.username || 'Bác sĩ chuyên khoa';
  const cleanName = raw.replace(/^(BS\.?|Bác sĩ)\s*/i, '').trim() || raw;
  const specialization =
    d?.specialization ||
    d?.qualification ||
    (Array.isArray(d?.specializations) && d.specializations.length
      ? d.specializations.map((s: any) => s?.name || s).join(', ')
      : '') ||
    'Nha khoa tổng quát';
  return {
    id: d?.id ? String(d.id) : '',
    fullName: cleanName,
    specialization,
    avatar: d?.avatar || d?.user?.avatar || undefined,
    branchId: d?.branchId || d?.branch?.branchId || d?.branch?.id || undefined,
    branchName: d?.branchName || d?.branch?.branchName || undefined,
    experienceYears: typeof d?.experienceYears === 'number' ? d.experienceYears : undefined,
    dentistCode: d?.dentistCode || undefined,
  };
}

export interface CreateAppointmentPayload {
  requestId: null;
  patientId: string | null;
  branchId: string | null;
  branchName: string | null;
  fullName: string;
  phone: string;
  email: string;
  dentistId: string | null;
  roomId: null;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  reason: string;
  notes: string;
  status: string;
}

export const appointmentService = {
  getByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/appointments/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getFollowUps: async (params: { patientId?: string; patientCode?: string }): Promise<any[]> => {
    const res = await api.get('/follow-up-appointments', { params });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getCurrentMonthFollowUps: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/follow-up-appointments/patient/${patientId}/current-month`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getDentistsList: async (): Promise<DentistItem[]> => {
    let data: any;
    try {
      data = unwrap(await api.get('/dentists/list'));
    } catch {
      data = unwrap(await api.get('/dentists'));
    }
    return Array.isArray(data) ? data.map(normalizeDentist).filter((d) => d.id) : [];
  },

  checkDentistSlot: async (dentistId: string, date: string, time: string): Promise<any[]> => {
    const res = await api.get(`/appointments/dentist/${dentistId}/check`, {
      params: {
        appointdate_date: date,
        appointtime: time,
      },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getDentistBookedTimesByDate: async (
    dentistId: string,
    date: string,
    excludeId?: string
  ): Promise<string[]> => {
    const checks = await Promise.all(
      BOOKABLE_SLOT_TIMES.map(async (time) => {
        try {
          const list = await appointmentService.checkDentistSlot(dentistId, date, time);
          return [time, list] as const;
        } catch {
          return [time, []] as const;
        }
      })
    );
    return checks
      .filter(([, list]) => list.some((a: any) => !excludeId || String(a.id) !== String(excludeId)))
      .map(([time]) => time);
  },

  createAppointment: async (payload: CreateAppointmentPayload) => {
    const res = await api.post('/appointments', payload);
    return unwrap(res);
  },

  updateAppointment: async (id: string, payload: Record<string, any>) => {
    const res = await api.put(`/appointments/${id}`, payload);
    return unwrap(res);
  },

  cancelAppointment: async (id: string, reasonText?: string) => {
    const notes = reasonText?.trim()
      ? `Bệnh nhân hủy hẹn: ${reasonText.trim()}`
      : 'Bệnh nhân tự hủy lịch hẹn qua ứng dụng di động';
    const res = await api.put(`/appointments/${id}`, {
      status: 'CANCELLED',
      notes,
    });
    return unwrap(res);
  },

  checkIn: async (payload: {
    appointmentCode: string;
    fullName: string;
    phone: string;
    branchId: string;
  }) => {
    const res = await api.post('/appointments/check-in', payload);
    return unwrap(res);
  },
};
