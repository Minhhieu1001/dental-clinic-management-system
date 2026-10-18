
export const DEFAULT_DENTAL_CLINIC_NAME = 'Nha Khoa Quốc Tế Crown Dental';

export const DEFAULT_DENTAL_CLINIC_ADDRESS =
  '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh';

export const DEFAULT_RECORD_FILE_NAME = 'Hồ sơ điện tử răng hàm mặt';

export const PHONE_NUMBER_CLINIC = '0945366872';


export const generateRecordFileName = (patientName, patientCode) => {
  if (!patientName && !patientCode) return DEFAULT_RECORD_FILE_NAME;

  const codePart = patientCode ? `_${patientCode}` : '';
  const cleanName = (patientName || 'BenhNhan')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  return `HSBA_${cleanName}${codePart}`;
};

export const createDefaultMedicalRecord = () => ({
  id: null,
  medicalRecordCode: '',
  branchId: null,
  branchName: '',
  branchAddress: '',
  clinicId: null,
  dentalClinicName: '',
  treatmentNotes: '',
  recordDate: null,
});