import api from './axios';

// data: { patientId, patientPhone, relatedPatientCode, fullName, birthday, phoneRelatedPatient, relationshipType }
export const requestPatientRelationshipOtp = async (data) => {
    const response = await api.post('/patient-relationships/request-otp', data);
    return response.data;
};

// data: { requestId, code }
export const verifyPatientRelationshipOtp = async (requestId, code) => {
    const response = await api.post('/patient-relationships/verify', { requestId, code });
    return response.data;
};

// relationshipId is the relationship's id, not either patient's id.
export const deletePatientRelationship = async (relationshipId) => {
    const response = await api.delete(`/patient-relationships/${encodeURIComponent(relationshipId)}`);
    return response.data;
};
// lay danh sach cac benh nhan duoc lien ket boi chinh benh nhan do
export const getListPatientRelationship = async () => {
    const response = await api.get('/patient-relationships/me');
    return response.data;
};
// lay danh sach cac benh nhan duoc lien ket boi mot benh nhan
export const getListPatientRelationshipByPatientId = async (patientId) => {
    const response = await api.get(`/patient-relationships/patient/${encodeURIComponent(patientId)}`);
    return response.data;
};

// lay danh sach cac benh nhan da duoc lien ket
export const getAllLinkedPatientRelationships = async () => {
    const response = await api.get('/patient-relationships/linked');
    return response.data;
};
