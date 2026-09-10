import api from './axios';

// Get list of all services with search & filter params
export const getAdminServices = async (params = {}) => {
  const response = await api.get('/services', { params });
  return response.data?.data ?? response.data?.result ?? response.data ?? [];
};

// Get single service by ID
export const getServiceById = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Create new service
export const createService = async (serviceData) => {
  const response = await api.post('/services', serviceData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Update service
export const updateService = async (id, serviceData) => {
  const response = await api.put(`/services/${id}`, serviceData);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Delete service
export const deleteService = async (id) => {
  const response = await api.delete(`/services/${id}`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Fast toggle active status
export const toggleActiveStatus = async (id) => {
  const response = await api.patch(`/services/${id}/toggle-active`);
  return response.data?.data ?? response.data?.result ?? response.data;
};

// Fast toggle featured status
export const toggleFeaturedStatus = async (id) => {
  const response = await api.patch(`/services/${id}/toggle-featured`);
  return response.data?.data ?? response.data?.result ?? response.data;
};
