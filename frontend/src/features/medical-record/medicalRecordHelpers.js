
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

// Danh sách các lý do khám bệnh / triệu chứng phổ biến trong nha khoa
export const COMMON_SYMPTOMS_OPTIONS = [
  'Đau nhức răng khi ăn nhai',
  'Ê buốt khi uống nước đá lạnh hoặc đồ ngọt',
  'Sâu răng, bể mẻ răng',
  'Chảy máu chân răng / Sưng viêm nướu',
  'Mất răng / Nhu cầu cấy ghép Implant',
  'Răng khôn mọc lệch gây sưng đau',
  'Muốn chỉnh nha / Niềng răng thẩm mỹ',
  'Khám răng định kỳ & Lấy cao răng',
];


export const createDefaultMedicalRecord = (patient = {}) => {
  const fullName = patient.fullName || patient.patientName || '';
  const patientCode = patient.patientCode || '';

  return {
    fileName: generateRecordFileName(fullName, patientCode),
    dentalClinicName: DEFAULT_DENTAL_CLINIC_NAME,
    address: DEFAULT_DENTAL_CLINIC_ADDRESS,
    symptoms: patient.symptoms || patient.chiefComplaint || 'Đau nhức răng hàm dưới bên phải, ê buốt khi ăn nhai',
    diagnosis: patient.diagnosis || '',
    treatmentNotes: patient.treatmentNotes || '',
    recordDate: new Date().toISOString(),
  };
};
