export const SHIFT_OPTIONS = [
  { key: 'full', label: 'Sáng - Chiều' },
  { key: 'morning', label: 'Sáng' },
  { key: 'afternoon', label: 'Chiều' },
];

export const SPECIALIZATION_OPTIONS = [
  { value: 'Nha khoa tổng quát', label: 'Nha khoa tổng quát' },
  { value: 'Implant', label: 'Nha sĩ Implant' },
  { value: 'Chỉnh nha', label: 'Chỉnh nha' },
  { value: 'Nhổ răng', label: 'Nhổ răng' },
  { value: 'Nha chu', label: 'Nha chu' },
  { value: 'Thẩm mỹ', label: 'Thẩm mỹ nha khoa' },
];

export const DEFAULT_DENTIST_SPECIALIZATION = 'Nha khoa tổng quát';

export const mapStatus = (statusUser) => {
  if (statusUser === 'BLOCK') return 'locked';
  return 'active';
};

export const mapShift = (index = 0) => {
  const shift = SHIFT_OPTIONS[index % SHIFT_OPTIONS.length];
  return { key: shift.key, label: shift.label };
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatExperience = (years) => {
  if (years == null || years === '') return 'Chưa cập nhật';
  return `${years} năm`;
};

export const parseQualifications = (qualification) => {
  if (!qualification?.trim()) return [];
  return qualification
    .split(/\n|;|•/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const getSpecializationName = (specialization) => {
  if (!specialization) return '';
  if (typeof specialization === 'string') return specialization;
  return specialization.name || specialization.specializationName || specialization.value || '';
};

export const normalizeSpecializationValue = (specialization) => {
  const name = getSpecializationName(specialization).trim();
  if (!name) return '';

  const lowerName = name.toLowerCase();
  const match = SPECIALIZATION_OPTIONS.find(
    (item) =>
      item.value.toLowerCase() === lowerName ||
      item.label.toLowerCase() === lowerName
  );

  return match?.value || name;
};

export const getSpecializationLabel = (specialization) => {
  const normalizedValue = normalizeSpecializationValue(specialization);
  const match = SPECIALIZATION_OPTIONS.find(
    (item) => item.value.toLowerCase() === normalizedValue.toLowerCase()
  );
  return match?.label || normalizedValue || 'Chưa cập nhật';
};

export const CERTIFICATE_TYPE_OPTIONS = [
  { value: 'PRACTICE_LICENSE', label: 'Chứng chỉ hành nghề' },
  { value: 'GENERAL_DENTISTRY', label: 'Nha khoa tổng quát' },
  { value: 'IMPLANT_DENTISTRY', label: 'Nha sĩ Implant' },
  { value: 'ORTHODONTICS', label: 'Chỉnh nha' },
  { value: 'TOOTH_EXTRACTION', label: 'Nhổ răng' },
  { value: 'PERIODONTICS', label: 'Nha chu' },
  { value: 'COSMETIC_DENTISTRY', label: 'Thẩm mỹ nha khoa' },
];

export const getCertificateTypeLabel = (type) => {
  if (!type) return 'Khác';
  const match = CERTIFICATE_TYPE_OPTIONS.find(
    (item) => item.value === type
  );
  return match?.label || type;
};

export const mapDentistFromApi = (dentist, index = 0) => {
  const shift = dentist.shiftKey
    ? SHIFT_OPTIONS.find((s) => s.key === dentist.shiftKey) ?? SHIFT_OPTIONS[index % SHIFT_OPTIONS.length]
    : SHIFT_OPTIONS[index % SHIFT_OPTIONS.length];

  // Derive specializations from certificate types (exclude PRACTICE_LICENSE)
  const certs = dentist.certificates || [];
  const specTypes = certs
    .map(c => c.certificateType || c.certificate_type)
    .filter(t => t && t !== 'PRACTICE_LICENSE');
  const displaySpecializations = specTypes.length > 0
    ? specTypes.map(t => getCertificateTypeLabel(t))
    : ['Chưa cập nhật'];

  return {
    ...dentist,
    name: dentist.name || dentist.username,
    displayStatus: mapStatus(dentist.statusUser),
    displaySpecialization: displaySpecializations[0],
    displaySpecializations: displaySpecializations,
    displayExperience: formatExperience(dentist.experienceYears),
    displayCreatedAt: formatDate(dentist.createdAt),
    displayShift: shift.label,
    shiftKey: shift.key,
    qualifications: parseQualifications(dentist.qualification),
    education: dentist.qualification,
    description: dentist.description || '',
    branchId: dentist.branchId || '',
    branchName: dentist.branchName || 'Chưa phân chi nhánh',
    certificates: certs.map((cert, i) => {
      const certType = cert.certificateType || cert.certificate_type || null;
      const isPracticeLicense = certType === 'PRACTICE_LICENSE'
        || (cert.certificateName || cert.certificate_name || '').toLowerCase().includes('hành nghề')
        || (i === 0 && !certType);

      return {
        ...cert,
        certificate_id: cert.id || cert.certificate_id || `cert-${i}-${Math.random().toString(36).substr(2, 9)}`,
        certificate_name: cert.certificateName || cert.certificate_name || '',
        certificate_number: cert.certificateNumber || cert.certificate_number || '',
        issued_by: cert.issuedBy || cert.issued_by || '',
        issue_date: cert.issueDate ? (typeof cert.issueDate === 'string' ? cert.issueDate.split('T')[0] : cert.issueDate) : (cert.issue_date || ''),
        expiry_date: cert.expiryDate ? (typeof cert.expiryDate === 'string' ? cert.expiryDate.split('T')[0] : cert.expiryDate) : (cert.expiry_date || ''),
        certificate_file_url: cert.certificateFileUrl || cert.certificate_file_url || '',
        certificate_type: isPracticeLicense ? 'PRACTICE_LICENSE' : (certType || null),
        type: isPracticeLicense ? 'practice_license' : 'specialization',
      };
    }),
    avatar:
      dentist.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(dentist.name || dentist.username || 'BS')}&background=random`,
  };
};

export const calcPercent = (value, total) => {
  if (!total) return '0% tổng số';
  return `${Math.round((value / total) * 100)}% tổng số`;
};
