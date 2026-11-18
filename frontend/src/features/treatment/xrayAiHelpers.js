// =============================================================================
// Tiện ích nghiệp vụ cho Bước 2: Phân tích X-quang & AI
// - Danh mục nhãn / màu cho trạng thái răng & loại tổn thương AI trả về
// - Thuật toán đối soát (reconciliation) giữa khám lâm sàng (Bước 1) và AI đọc phim
// =============================================================================

// Sơ đồ răng FDI theo đúng hướng nhìn phim Panorama (trái ảnh = phải bệnh nhân)
export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const XRAY_IMAGE_TYPES = [
  { value: 'AUTO', label: 'Tự động nhận diện (AI)' },
  { value: 'PANORAMIC', label: 'Phim Panorama (toàn cảnh)' },
  { value: 'PERIAPICAL', label: 'Phim cận chóp' },
  { value: 'BITEWING', label: 'Phim cánh cắn' },
  { value: 'CEPHALOMETRIC', label: 'Phim sọ nghiêng (Cephalo)' },
  { value: 'OCCLUSAL', label: 'Phim cắn (Occlusal)' },
  { value: 'CBCT_SLICE', label: 'Lát cắt CBCT' },
  { value: 'OTHER', label: 'Loại khác' },
];

export const getImageTypeLabel = (value) =>
  XRAY_IMAGE_TYPES.find((t) => t.value === value)?.label || value || 'Chưa xác định';

// Trạng thái từng răng trên sơ đồ AI
export const TOOTH_STATUS_META = {
  NORMAL: { label: 'Bình thường', color: '#94A3B8', bg: '#F8FAFC', text: '#475569' },
  CARIES: { label: 'Sâu răng', color: '#E11D48', bg: '#FFE4E6', text: '#9F1239' },
  RESTORED: { label: 'Đã trám', color: '#0284C7', bg: '#E0F2FE', text: '#075985' },
  ROOT_CANAL_TREATED: { label: 'Đã điều trị tủy', color: '#7C3AED', bg: '#EDE9FE', text: '#5B21B6' },
  CROWN: { label: 'Mão / Chụp sứ', color: '#0D9488', bg: '#CCFBF1', text: '#115E59' },
  IMPLANT: { label: 'Implant', color: '#475569', bg: '#E2E8F0', text: '#1E293B' },
  MISSING: { label: 'Mất răng', color: '#64748B', bg: '#F1F5F9', text: '#334155', dashed: true },
  IMPACTED: { label: 'Mọc kẹt / Ngầm', color: '#EA580C', bg: '#FFEDD5', text: '#9A3412' },
  PARTIALLY_ERUPTED: { label: 'Mọc chưa hoàn toàn', color: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  UNERUPTED: { label: 'Chưa mọc', color: '#A3A3A3', bg: '#F5F5F5', text: '#525252', dashed: true },
  RESIDUAL_ROOT: { label: 'Chân răng sót', color: '#B91C1C', bg: '#FEE2E2', text: '#7F1D1D' },
  PERIAPICAL_LESION: { label: 'Tổn thương quanh chóp', color: '#C026D3', bg: '#FAE8FF', text: '#86198F' },
  BONE_LOSS: { label: 'Tiêu xương', color: '#CA8A04', bg: '#FEF9C3', text: '#854D0E' },
  FRACTURE: { label: 'Gãy / Nứt', color: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
  OTHER: { label: 'Bất thường khác', color: '#6366F1', bg: '#E0E7FF', text: '#3730A3' },
};

export const getToothStatusMeta = (status) => TOOTH_STATUS_META[status] || TOOTH_STATUS_META.OTHER;

// Loại tổn thương (finding type)
export const FINDING_TYPE_META = {
  CARIES: { label: 'Sâu răng', group: 'CARIES' },
  DEEP_CARIES: { label: 'Sâu răng sâu', group: 'CARIES' },
  SECONDARY_CARIES: { label: 'Sâu tái phát', group: 'CARIES' },
  PERIAPICAL_LESION: { label: 'Tổn thương quanh chóp', group: 'PERIAPICAL' },
  CYST: { label: 'Nang', group: 'PERIAPICAL' },
  IMPACTED: { label: 'Răng mọc kẹt / ngầm', group: 'IMPACTED' },
  MISSING: { label: 'Mất răng', group: 'MISSING' },
  RESTORATION: { label: 'Phục hồi / Miếng trám', group: 'RESTORATION' },
  ROOT_CANAL: { label: 'Đã điều trị tủy', group: 'ROOT_CANAL' },
  CROWN: { label: 'Mão / Chụp', group: 'CROWN' },
  IMPLANT: { label: 'Implant', group: 'IMPLANT' },
  BONE_LOSS: { label: 'Tiêu xương ổ răng', group: 'PERIO' },
  CALCULUS: { label: 'Cao răng', group: 'PERIO' },
  FRACTURE: { label: 'Gãy / Nứt răng', group: 'FRACTURE' },
  RESIDUAL_ROOT: { label: 'Chân răng sót', group: 'RESIDUAL_ROOT' },
  BONE_LESION: { label: 'Tổn thương trong xương hàm', group: 'PERIAPICAL' },
  OVERHANG: { label: 'Miếng trám dư / hở bờ', group: 'RESTORATION_DEFECT' },
  ROOT_RESORPTION: { label: 'Tiêu chân răng', group: 'OTHER' },
  SUPERNUMERARY: { label: 'Răng thừa', group: 'OTHER' },
  SINUS: { label: 'Bất thường xoang hàm', group: 'OTHER' },
  OTHER: { label: 'Bất thường khác', group: 'OTHER' },
};

// Các loại "ghi nhận tình trạng" (không phải bệnh lý cần điều trị ngay)
const NON_PATHOLOGY_GROUPS = ['RESTORATION', 'ROOT_CANAL', 'CROWN', 'IMPLANT', 'MISSING'];
export const isPathologyFinding = (f) => {
  const group = FINDING_TYPE_META[f?.type]?.group || 'OTHER';
  return !NON_PATHOLOGY_GROUPS.includes(group) || f?.type === 'SECONDARY_CARIES';
};

export const SEVERITY_META = {
  Nặng: { badge: 'bg-rose-50 text-rose-700 border-rose-200', stroke: '#F43F5E', fill: 'rgba(244,63,94,0.18)' },
  'Trung bình': { badge: 'bg-amber-50 text-amber-800 border-amber-200', stroke: '#F59E0B', fill: 'rgba(245,158,11,0.16)' },
  Nhẹ: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', stroke: '#10B981', fill: 'rgba(16,185,129,0.15)' },
};
export const getSeverityMeta = (sev) => SEVERITY_META[sev] || SEVERITY_META['Trung bình'];

export const getConfidenceTone = (c) => {
  if (c >= 85) return { text: 'text-emerald-700', bar: 'from-emerald-500 to-teal-600', label: 'Cao' };
  if (c >= 65) return { text: 'text-amber-700', bar: 'from-amber-400 to-orange-500', label: 'Trung bình' };
  return { text: 'text-rose-700', bar: 'from-rose-400 to-rose-600', label: 'Thấp - cần xác minh' };
};

export const getQuadrantLabel = (tooth) => {
  const q = Math.floor(Number(tooth) / 10);
  return (
    {
      1: 'Hàm trên phải', 2: 'Hàm trên trái', 3: 'Hàm dưới trái', 4: 'Hàm dưới phải',
      5: 'Hàm trên phải (sữa)', 6: 'Hàm trên trái (sữa)', 7: 'Hàm dưới trái (sữa)', 8: 'Hàm dưới phải (sữa)',
    }[q] || ''
  );
};

// ---------------------------------------------------------------------------
// ĐỐI SOÁT LÂM SÀNG ↔ X-QUANG
// ---------------------------------------------------------------------------

export const isClinicalAbnormal = (t) => {
  if (!t) return false;
  const status = (t.toothStatus || '').trim();
  return t.cariesStatus === 'YES' || t.hasCaries || (status !== '' && status !== 'Bình thường');
};

// Suy ra nhóm tình trạng từ nhãn tình trạng răng lâm sàng (danh mục động trong CSDL)
const inferClinicalGroups = (t) => {
  const groups = new Set();
  if (t.cariesStatus === 'YES' || t.hasCaries) groups.add('CARIES');
  const s = (t.toothStatus || '').toLowerCase();
  const rules = [
    [/sâu/, 'CARIES'],
    [/mất|nhổ|thiếu/, 'MISSING'],
    [/trám|hàn/, 'RESTORATION'],
    [/tủy|nội nha|chữa tuỷ|tuỷ/, 'ROOT_CANAL'],
    [/sứ|mão|chụp|cầu/, 'CROWN'],
    [/implant|cấy ghép/, 'IMPLANT'],
    [/khôn|kẹt|ngầm|lệch/, 'IMPACTED'],
    [/chân răng|sót/, 'RESIDUAL_ROOT'],
    [/chóp|áp xe|apxe|nang/, 'PERIAPICAL'],
    [/nha chu|tiêu xương|lung lay|cao răng|viêm lợi|viêm nướu/, 'PERIO'],
    [/gãy|nứt|vỡ|mẻ/, 'FRACTURE'],
  ];
  rules.forEach(([re, g]) => {
    if (re.test(s)) groups.add(g);
  });
  if (groups.size === 0 && isClinicalAbnormal(t)) groups.add('OTHER');
  return groups;
};

export const RECONCILE_META = {
  MATCH: {
    label: 'Khớp lâm sàng',
    short: 'Khớp',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    advice: 'Lâm sàng và X-quang thống nhất — đủ căn cứ lập chẩn đoán.',
  },
  PARTIAL: {
    label: 'Khớp vị trí, khác tình trạng',
    short: 'Lệch tình trạng',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    advice: 'Cùng răng nhưng mô tả khác nhau — bác sĩ cần đánh giá lại để thống nhất.',
  },
  XRAY_ONLY: {
    label: 'Chỉ phát hiện trên X-quang',
    short: 'Chỉ X-quang',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    advice: 'Tổn thương ẩn (mặt bên, quanh chóp, trong xương) — cần khám/thử nghiệm lâm sàng bổ sung.',
  },
  CLINICAL_ONLY: {
    label: 'Chỉ phát hiện trên lâm sàng',
    short: 'Chỉ lâm sàng',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    advice: 'AI không ghi nhận trên phim (tổn thương mặt ngoài/trong, mô mềm) — cân nhắc chụp phim cận chóp bổ sung.',
  },
};

/**
 * Đối soát theo từng răng giữa dữ liệu khám lâm sàng và kết quả AI đọc phim.
 * @returns {Array<{toothNumber, status, clinical, aiFindings, aiToothStatus}>}
 */
export const reconcileClinicalWithXray = (examinedTeeth = [], analysis = null) => {
  if (!analysis) return [];
  const findings = (analysis.findings || []).filter((f) => f.toothNumber);
  const teethChart = analysis.teeth || [];

  const aiByTooth = new Map();
  findings.forEach((f) => {
    const list = aiByTooth.get(f.toothNumber) || [];
    list.push(f);
    aiByTooth.set(f.toothNumber, list);
  });
  // Trạng thái bất thường trên sơ đồ nhưng không có finding chi tiết
  teethChart.forEach((t) => {
    if (t.status && t.status !== 'NORMAL' && !aiByTooth.has(t.toothNumber)) {
      aiByTooth.set(t.toothNumber, [
        {
          id: `chart-${t.toothNumber}`,
          toothNumber: t.toothNumber,
          type: t.status === 'ROOT_CANAL_TREATED' ? 'ROOT_CANAL' : t.status === 'RESTORED' ? 'RESTORATION' : t.status,
          label: getToothStatusMeta(t.status).label,
          evidence: t.note,
          fromChart: true,
        },
      ]);
    }
  });

  const clinicalByTooth = new Map();
  examinedTeeth.forEach((t) => clinicalByTooth.set(Number(t.toothNumber), t));

  const allTeeth = new Set([
    ...aiByTooth.keys(),
    ...examinedTeeth.filter(isClinicalAbnormal).map((t) => Number(t.toothNumber)),
  ]);

  const rows = [];
  allTeeth.forEach((toothNumber) => {
    const clinical = clinicalByTooth.get(toothNumber) || null;
    const aiFindings = aiByTooth.get(toothNumber) || [];
    const clinicalAbn = isClinicalAbnormal(clinical);
    const aiToothStatus = teethChart.find((t) => t.toothNumber === toothNumber)?.status || null;

    let status;
    if (clinicalAbn && aiFindings.length > 0) {
      const cGroups = inferClinicalGroups(clinical);
      const aGroups = new Set(aiFindings.map((f) => FINDING_TYPE_META[f.type]?.group || 'OTHER'));
      const overlap = [...cGroups].some((g) => aGroups.has(g)) || cGroups.has('OTHER');
      status = overlap ? 'MATCH' : 'PARTIAL';
    } else if (aiFindings.length > 0) {
      status = 'XRAY_ONLY';
    } else {
      status = 'CLINICAL_ONLY';
    }

    rows.push({ toothNumber, status, clinical, aiFindings, aiToothStatus, clinicalExamined: Boolean(clinical) });
  });

  return rows.sort((a, b) => a.toothNumber - b.toothNumber);
};

export const describeClinical = (t) => {
  if (!t) return 'Chưa khám lâm sàng răng này';
  const parts = [];
  if (t.toothStatus) parts.push(t.toothStatus);
  if (t.cariesStatus === 'YES') {
    parts.push(`Sâu${t.cariesLocation && t.cariesLocation !== 'Bình thường' ? ` · ${t.cariesLocation}` : ''}`);
  }
  if (t.painLevel === 'SPONTANEOUS') parts.push('Đau tự phát');
  else if (t.painLevel === 'STIMULATED') parts.push('Đau khi kích thích');
  if (t.mobility && t.mobility !== 'Bình thường') parts.push(`Lung lay: ${t.mobility}`);
  return parts.length ? Array.from(new Set(parts)).join(' · ') : 'Bình thường';
};

// Tìm chẩn đoán trong danh mục CSDL khớp mã ICD-10 AI gợi ý
export const matchPrimaryDiagnosis = (primaryDiagnoses = [], icd10, fallbackLabel) => {
  if (!primaryDiagnoses.length) return fallbackLabel || '';
  const code = (icd10 || '').toUpperCase().trim();
  if (code) {
    const exact = primaryDiagnoses.find((d) => (d.code || '').toUpperCase() === code);
    if (exact) return exact.label;
    const prefix = code.split('.')[0];
    const byPrefix = primaryDiagnoses.find((d) => (d.code || '').toUpperCase().startsWith(prefix));
    if (byPrefix) return byPrefix.label;
  }
  if (fallbackLabel) {
    const key = fallbackLabel.toLowerCase().split('(')[0].trim();
    const byLabel = primaryDiagnoses.find((d) => d.label?.toLowerCase().includes(key));
    if (byLabel) return byLabel.label;
  }
  return primaryDiagnoses[0]?.label || fallbackLabel || '';
};

// Tạo dữ liệu điền sẵn cho Modal chẩn đoán (Bước 3) từ một phát hiện AI đã được bác sĩ chấp nhận
export const buildDiagnosisPrefillFromFinding = (finding, primaryDiagnoses, clinical) => {
  const sources = ['Phim X-quang', 'Đề xuất AI'];
  if (isClinicalAbnormal(clinical)) sources.unshift('Khám lâm sàng');
  const notes = [
    finding.label,
    finding.surfaces ? `Vị trí: ${finding.surfaces}` : null,
    finding.evidence ? `X-quang: ${finding.evidence}` : null,
    finding.recommendation ? `Khuyến nghị: ${finding.recommendation}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    scope: 'MULTI_TEETH',
    toothNumber: finding.toothNumber,
    selectedTeeth: finding.toothNumber ? [Number(finding.toothNumber)] : [],
    primaryDiagnosis: matchPrimaryDiagnosis(primaryDiagnoses, finding.icd10, finding.label),
    severity: finding.severity || 'Trung bình',
    notes,
    sources,
  };
};

