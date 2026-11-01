export const RELATIONSHIP_LABELS = {
  CHILD: 'Con cái',
  SPOUSE: 'Vợ / Chồng',
  PARENT: 'Bố / Mẹ',
  GUARDIAN: 'Người giám hộ'
};

export const relationshipError = (error, fallback) => error.response?.data?.message || fallback;

export const normalizePhone = (value) => value.trim().replace(/[\s().-]/g, '');

export const isValidPhone = (value) => /^(?:0|\+?84)[0-9]{9}$/.test(normalizePhone(value));

export const birthdayToIso = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return '';
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);
  if (Number(year) < 1 || Number.isNaN(date.getTime()) || date > new Date()
    || date.getFullYear() !== Number(year) || date.getMonth() + 1 !== Number(month)
    || date.getDate() !== Number(day)) return '';
  return iso;
};
