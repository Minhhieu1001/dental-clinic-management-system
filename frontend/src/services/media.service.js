import api from './axios';

export const uploadImage = async (file) => {
    const formData = new FormData();

    formData.append('file', file);
    const response = await api.post('/media/upload', formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    const data = response.data;
    if (typeof data === 'string') return data;
    return data?.data ?? data?.url ?? data?.result ?? data;
};

export const deleteImage = async (publicId) => {
    return api.delete(`/media/${publicId}`);
};