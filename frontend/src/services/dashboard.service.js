import api from './axios';

export const dashboardService = {
  getOverview: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/overview', { params: filter });
    return response.data?.data;
  },

  getRevenue: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/revenue', { params: filter });
    return response.data?.data;
  },

  getStaff: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/staff', { params: filter });
    return response.data?.data;
  },

  getMedicines: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/medicines', { params: filter });
    return response.data?.data;
  },

  getServices: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/services', { params: filter });
    return response.data?.data;
  },

  getPromotions: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/promotions', { params: filter });
    return response.data?.data;
  },

  getAppointments: async (filter = {}) => {
    const response = await api.get('/admin/dashboard/appointments', { params: filter });
    return response.data?.data;
  },
};

export default dashboardService;
