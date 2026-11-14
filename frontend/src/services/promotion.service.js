import api from './axios';

// Lấy danh sách toàn bộ khuyến mãi đang hoạt động (công khai)
export const getPromotions = async () => {
    const response = await api.get('/promotions');
    return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết khuyến mãi theo ID
export const getPromotion = async (id) => {
    const response = await api.get(`/promotions/${id}`);
    return response.data?.data ?? response.data?.result ?? response.data;
};

// Lấy danh sách khuyến mãi hôm nay
export const getTodayPromotions = async () => {
    const response = await api.get('/promotions/today');
    return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy danh sách voucher hợp lệ
export const getAvailableVouchers = async () => {
    const response = await api.get('/promotions/vouchers');
    return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Lấy chi tiết voucher theo mã coupon
export const getAvailableVoucherByCouponCode = async (couponCode) => {
    const response = await api.get(`/promotions/vouchers/${couponCode}`);
    return response.data?.data ?? response.data?.result ?? response.data;
};
