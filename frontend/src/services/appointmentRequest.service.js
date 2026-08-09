import api from './axios';

export const getTodayPendingAppointmentRequests = async () => {
    const response = await api.get('/appointmentrequest/today/pending');
    return response.data;
};

export const getAppointmentRequestToday = async () => {
    const response = await api.get('/appointmentrequest/today');
    return response.data;
};

export const createAppointmentRequest = async (data) => {
    const response = await api.post('/appointmentrequest', data);
    return response.data;
};

export const processAppointmentRequest = async (id) => {
    const response = await api.patch(`/appointmentrequest/${id}/process`);
    return response.data;
};

export const updateAppointmentRequest = async (id, status = 'CANCELLED') => {
    const response = await api.patch(`/appointmentrequest/${id}/status`, null, {
        params: { status },
    });
    return response.data;
};

export const updateAppointmentRequestStatus = updateAppointmentRequest;
