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

  const certs = dentist.certificates || [];

  // Identify the practice license:
  // 1. Look for first cert that has certificateType === 'PRACTICE_LICENSE'
  // 2. If none, look for first cert whose name includes 'hành nghề'
  // 3. If none and certs.length > 0, default to index 0
  let practiceIndex = certs.findIndex(c => (c.certificateType || c.certificate_type) === 'PRACTICE_LICENSE');
  if (practiceIndex === -1) {
    practiceIndex = certs.findIndex(c => (c.certificateName || c.certificate_name || '').toLowerCase().includes('hành nghề'));
  }
  if (practiceIndex === -1 && certs.length > 0) {
    practiceIndex = 0;
  }

  const mappedCertificates = certs.map((cert, i) => {
    const rawType = cert.certificateType || cert.certificate_type || null;
    const isPracticeLicense = i === practiceIndex;
    const certType = isPracticeLicense
      ? 'PRACTICE_LICENSE'
      : (rawType && rawType !== 'PRACTICE_LICENSE' ? rawType : 'GENERAL_DENTISTRY');

    return {
      ...cert,
      certificate_id: cert.id || cert.certificate_id || `cert-${i}-${Math.random().toString(36).substr(2, 9)}`,
      certificate_name: cert.certificateName || cert.certificate_name || (isPracticeLicense ? 'Chứng chỉ hành nghề bác sĩ' : 'Chứng chỉ chuyên môn'),
      certificate_number: cert.certificateNumber || cert.certificate_number || '',
      issued_by: cert.issuedBy || cert.issued_by || '',
      issue_date: cert.issueDate ? (typeof cert.issueDate === 'string' ? cert.issueDate.split('T')[0] : cert.issueDate) : (cert.issue_date || ''),
      expiry_date: cert.expiryDate ? (typeof cert.expiryDate === 'string' ? cert.expiryDate.split('T')[0] : cert.expiryDate) : (cert.expiry_date || ''),
      certificate_file_url: cert.certificateFileUrl || cert.certificate_file_url || '',
      certificate_type: certType,
      type: isPracticeLicense ? 'practice_license' : 'specialization',
      scope_of_practice: cert.scopeOfPractice || cert.scope_of_practice || '',
      identity_card_number: cert.identityCardNumber || cert.identity_card_number || '',
      practicing_doctor_name: cert.practicingDoctorName || cert.practicing_doctor_name || '',
      qualification: cert.qualification || '',
      is_lifetime: cert.isLifetime !== undefined ? cert.isLifetime : (cert.is_lifetime || false),
    };
  });

  // Derive specializations from certificate types (exclude PRACTICE_LICENSE)
  const specTypes = mappedCertificates
    .filter(c => c.type !== 'practice_license')
    .map(c => c.certificate_type)
    .filter(Boolean);
  const displaySpecializations = specTypes.length > 0
    ? [...new Set(specTypes.map(t => getCertificateTypeLabel(t)))]
    : ['Nha khoa tổng quát'];

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
    certificates: mappedCertificates,
    avatar:
      dentist.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(dentist.name || dentist.username || 'BS')}&background=random`,
  };
};

export const calcPercent = (value, total) => {
  if (!total) return '0% tổng số';
  return `${Math.round((value / total) * 100)}% tổng số`;
};
