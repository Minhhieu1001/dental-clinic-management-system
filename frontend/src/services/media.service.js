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
    return response.data;
};

export const deleteImage = async (publicId) => {
    return api.delete(`/media/${publicId}`);
};