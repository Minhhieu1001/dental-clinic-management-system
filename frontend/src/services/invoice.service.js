import api from './axios';


// lấy tất cả hóa đơn sắp xếp mới nhất theo ngày 
export const getAllInvoiceDateDesc = async ({ year, month, status, search } = {}) => {
  const params = {};
  if (year && year !== 'ALL') params.year = year;
  if (month && month !== 'ALL') params.month = Number(month);
  if (status && status !== 'ALL') params.status = status;
  if (search && search.trim()) params.search = search.trim();

  const response = await api.get('/invoices', { params });
  const data = response.data?.data || {};
  return {
    invoices: data.invoices || [],
    summary: data.summary || null,
  };
};


export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices', invoiceData);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (error) {
    console.warn('Lỗi tạo hóa đơn mới:', error);
    throw error;
  }
};


export const payInvoice = async (invoiceId, paymentData) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (error) {
    console.warn('Lỗi thanh toán hóa đơn:', error);
    throw error;
  }
};



