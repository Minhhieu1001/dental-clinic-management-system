import api from './api';
import { AuthUser } from './auth.service';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

export interface PatientStatistics {
  totalAppointmentsLast30Days?: number;
  totalPrescriptions?: number;
  totalTreatmentPlans?: number;
  inProgressTreatmentPlans?: number;
  totalOutstandingDebt?: number;
  totalInvoices?: number;
}

export interface LinkedProfile {
  relationshipId?: string;
  patientId: string;
  patientCode?: string;
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  isPrimary?: boolean;
  relationshipType?: string;
  relationshipLabel?: string;
  relationship?: string;
  phone?: string;
  phoneMasked?: string;
  cccd?: string;
  cccdMasked?: string;
}

export interface RequestLinkOtpPayload {
  patientId: string;
  patientPhone: string;
  relatedPatientCode: string;
  fullName: string;
  birthday: string; // YYYY-MM-DD
  phoneRelatedPatient: string;
  relationshipType: 'CHILD' | 'SPOUSE' | 'PARENT' | 'GUARDIAN';
}

export const patientService = {
  getById: async (id: string) => {
    const res = await api.get(`/patients/${id}`);
    return unwrap(res);
  },

  getByCode: async (code: string) => {
    const res = await api.get(`/patients/patientCode/${encodeURIComponent(code)}`);
    return unwrap(res);
  },

  getByPhone: async (phone: string) => {
    const res = await api.get(`/patients/phone/${encodeURIComponent(phone)}`);
    return unwrap(res) ?? [];
  },

  resolvePatientId: async (user: AuthUser | null): Promise<string | null> => {
    if (!user) return null;
    if (user.patientId) return user.patientId;
    try {
      if (user.phone) {
        const list = await patientService.getByPhone(user.phone);
        if (Array.isArray(list) && list[0]?.id) return list[0].id;
      }
    } catch {
      // ignore fallback error
    }
    try {
      const byUser = await patientService.getById(user.id);
      if (byUser?.id) return byUser.id;
    } catch {
      // ignore fallback error
    }
    return null;
  },

  getStatistics: async (patientId: string): Promise<PatientStatistics> => {
    const res = await api.get(`/patients/${patientId}/statistics`);
    return unwrap(res) ?? {};
  },

  updateProfile: async (patientId: string, payload: Record<string, any>) => {
    const res = await api.put(`/patients/${patientId}`, payload);
    return unwrap(res);
  },

  updateUser: async (userId: string, payload: { avatarUrl?: string | null }) => {
    const res = await api.put(`/users/${encodeURIComponent(userId)}`, payload);
    return unwrap(res);
  },

  changeMyPassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const res = await api.put('/users/me/password', payload);
    return unwrap(res);
  },

  getMyRelationships: async (): Promise<LinkedProfile[]> => {
    const res = await api.get('/patient-relationships/me');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  requestRelationshipOtp: async (
    payload: RequestLinkOtpPayload
  ): Promise<{ requestId: string; expiresAt: string; resendAfterSeconds?: number }> => {
    const res = await api.post('/patient-relationships/request-otp', payload);
    return unwrap(res);
  },

  verifyRelationshipOtp: async (requestId: string, code: string) => {
    const res = await api.post('/patient-relationships/verify', { requestId, code });
    return unwrap(res);
  },

  deleteRelationship: async (relationshipId: string) => {
    const res = await api.delete(`/patient-relationships/${encodeURIComponent(relationshipId)}`);
    return unwrap(res);
  },
};
