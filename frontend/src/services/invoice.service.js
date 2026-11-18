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


// Lấy danh sách hóa đơn theo bệnh nhân
export const getInvoicesByPatientId = async (patientId) => {
  const response = await api.get(`/invoices/patient/${patientId}`);
  const data = response.data?.data ?? response.data?.result ?? response.data;
  if (!Array.isArray(data)) throw new Error('Dữ liệu hóa đơn không hợp lệ.');
  return data;
};

// Lấy chi tiết hóa đơn theo ID (dùng để Polling kiểm tra trạng thái thanh toán)
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (error) {
    console.warn('Lỗi lấy thông tin chi tiết hóa đơn:', error);
    throw error;
  }
};

// Khởi tạo mã VietQR động từ Backend (lưu RAM Cache)
export const initiateQrPayment = async (payload) => {
  try {
    const response = await api.post('/payments/initiate-qr', payload);
    return response.data?.data ?? response.data?.result ?? response.data;
  } catch (error) {
    console.warn('Lỗi khởi tạo VietQR:', error);
    throw error;
  }
};

// Hủy bản nháp thanh toán trong RAM Cache
export const cancelQrDraft = async (invoiceId) => {
  try {
    const response = await api.delete(`/payments/qr-draft/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.warn('Lỗi hủy bản nháp thanh toán:', error);
  }
};

