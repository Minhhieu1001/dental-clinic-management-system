import api from './axios';

export const customerCareService = {
    createBulkPromotion: async (payload) => {
        const response = await api.post('/customer-care/bulk-promotions', payload);
        return response.data.data;
    },
    getById: async (id) => {
        const response = await api.get(`/customer-care/${id}`);
        return response.data.data;
    },

    update: async (id, payload) => {
        const response = await api.put(`/customer-care/${id}`, payload);
        return response.data.data;
    },

    delete: async (id) => {
        await api.delete(`/customer-care/${id}`);
    },

    create: async (payload) => {
        const response = await api.post('/customer-care', payload);
        return response.data.data;
    },

    getSuggestions: async (params = {}) => {
        const response = await api.get('/customer-care/suggestions', { params });
        return response.data?.data;
    },

    getAll: async () => {
        const response = await api.get('/customer-care');
        return response.data?.data;
    },

    getSummary: async () => {
        const response = await api.get('/customer-care/summary');
        return response.data?.data;
    },

    getPatientsWithInvoices: async () => {
        const response = await api.get('/customer-care/patients');
        return response.data?.data;
    },
};

export default customerCareService;
