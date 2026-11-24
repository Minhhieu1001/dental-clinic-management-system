import api from './api';

export const appointmentService = {
  getByPatientId: async (patientId: string) => {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data?.data ?? response.data ?? [];
  },

  getFollowUpsByPatientId: async (patientId: string) => {
    const response = await api.get('/follow-up-appointments', { params: { patientId } });
    return response.data?.data ?? response.data ?? [];
  },
};
