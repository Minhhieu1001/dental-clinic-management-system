import api from './api';

export const invoiceService = {
  getByPatientId: async (patientId: string) => {
    const response = await api.get(`/invoices/patient/${patientId}`);
    return response.data?.data ?? response.data ?? [];
  },
};
