import api from "./axios";

export const updateStatusUser = async (id, data) => {
    const response = await api.put(`/users/${id}/status`, data);
    return response.data;
};

export const lockUser = (id) =>
    updateStatusUser(id, {
        status: "BLOCK"
    });

export const unlockUser = (id) =>
    updateStatusUser(id, {
        status: "ACTIVE"
    });