import api from './axios';


export const getAvailableVouchers = async () => {
    const response = await api.get('/promotions/vouchers')
    return response.data
}

export const getAvailableVoucherByCouponCode = async (couponCode) => {
    const response = await api.get(`/promotions/vouchers/${couponCode}`)
    return response.data
}