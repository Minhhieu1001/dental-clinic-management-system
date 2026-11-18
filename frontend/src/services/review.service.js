import api from './axios';

// Lấy danh sách đánh giá của bệnh nhân
export const getReviews = async () => {
    const response = await api.get('/reviews');
    return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

