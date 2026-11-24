import api from './api';

export const medicalRecordService = {
  getTreatmentPlansByPatientId: async (patientId: string) => {
    const response = await api.get(`/treatment-plans/patient/${patientId}`);
    return response.data?.data ?? response.data ?? [];
  },
};
