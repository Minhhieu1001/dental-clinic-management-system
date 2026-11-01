export const normalizeDateOfBirth = (value) => {
  if (!value) return null;

  const datePart = String(value).split('T')[0];
  const match = datePart.match(/^(\d+)-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = match[1].slice(-4);
  return `${year}-${match[2]}-${match[3]}T00:00:00`;
};

export const toPatientPayload = (formData, doctorId = null) => ({
  fullName: formData.fullName,
  phone: formData.phone,
  cccd: formData.cccd,
  email: formData.email,
  gender: formData.gender,
  dateOfBirth: normalizeDateOfBirth(formData.dateOfBirth),
  address: formData.address,
  nationality: formData.nationality,
  hometown: formData.hometown,
  job: formData.job,
  systemicDisease: Array.isArray(formData.systemicDisease)
    ? formData.systemicDisease.join(', ')
    : formData.systemicDisease,
  allergies: formData.allergies,
  currentMedications: formData.currentMedications,
  surgicalHistory: formData.surgicalHistory,
  notes: formData.notes,
  doctorId,
  ...(formData.branchId ? { branchId: formData.branchId } : {}),
});
