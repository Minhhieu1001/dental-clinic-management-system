import api from './api';

const unwrap = (res: any) => res?.data?.data ?? res?.data?.result ?? res?.data;

export interface VietQrInitResponse {
  qrUrl: string;
  transactionCode: string;
  accountNo: string;
  accountName: string;
  bankName?: string;
  amount: number;
}

export const invoiceService = {
  getByPatientId: async (patientId: string): Promise<any[]> => {
    const res = await api.get(`/invoices/patient/${patientId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  getById: async (invoiceId: string) => {
    const res = await api.get(`/invoices/${invoiceId}`);
    return unwrap(res);
  },

  initiateQrPayment: async (payload: {
    invoiceId: string;
    branchId?: string | null;
    amount: number;
    serviceAmount: number;
    medicineAmount?: number;
    paymentMethod?: string;
    note?: string;
  }): Promise<VietQrInitResponse> => {
    const res = await api.post('/payments/initiate-qr', {
      paymentMethod: 'BANK_TRANSFER',
      medicineAmount: 0,
      ...payload,
    });
    return unwrap(res);
  },

  cancelQrDraft: async (invoiceId: string) => {
    try {
      await api.delete(`/payments/qr-draft/${invoiceId}`);
    } catch {
      // ignore draft cleanup error
    }
  },
};
