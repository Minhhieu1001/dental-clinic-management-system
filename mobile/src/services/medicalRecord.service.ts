import api from './api';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

export const medicalRecordService = {
  getRecordsByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/medical-records/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getRecordById: async (recordId: string) => {
    const res = await api.get(`/medical-records/${recordId}`);
    return unwrap(res);
  },

  getXrayHistoryByRecordId: async (medicalRecordId: string): Promise<any[]> => {
    const res = await api.get('/ai/xray/patient-history', { params: { medicalRecordId } });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getExamsByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/examination-results/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getExamsByRecordId: async (recordId: string): Promise<any[]> => {
    const res = await api.get(`/examination-results/medical-record/${recordId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getInProgressPlansByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/treatment-plans/patient/${patientId}/in-progress`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getTreatmentPlansByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/treatment-plans/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getPrescriptionsByPatientId: async (patientId: string): Promise<any[]> => {
    try {
      const res = await api.get(`/prescriptions/patient/${patientId}`);
      const data = unwrap(res);
      return Array.isArray(data) ? data : [];
    } catch {
      const res = await api.get('/prescriptions', { params: { patientId } });
      const data = unwrap(res);
      return Array.isArray(data) ? data : [];
    }
  },

  getPrescriptionById: async (id: string) => {
    const res = await api.get(`/prescriptions/${id}`);
    return unwrap(res);
  },
};
