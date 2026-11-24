export function formatMoney(value: number | string | null | undefined): string {
  if (value == null || value === '') return '0 đ';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0 đ';
  return `${num.toLocaleString('vi-VN')} đ`;
}

export function formatDate(date: string | Date | number[] | null | undefined, fallback = '-'): string {
  if (!date) return fallback;
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (typeof date === 'string') {
    const clean = date.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return fallback;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
