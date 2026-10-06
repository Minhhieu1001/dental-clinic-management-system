import api from './axios';

export const getPaymentTransactionByInvoiceId = async (invoiceId) => {
    try {
        const response = await api.get(`/payment-transactions/invoice/${invoiceId}`);
        return response.data?.data ?? response.data?.result ?? response.data ?? [];
    } catch (error) {
        console.warn(`Lỗi lấy lịch sử thanh toán hóa đơn ${invoiceId}:`, error);
        throw error;
    }
};
