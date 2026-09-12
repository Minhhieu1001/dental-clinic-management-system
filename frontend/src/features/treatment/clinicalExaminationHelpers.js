/**
 * File Helper quản lý danh mục và giá trị tùy chọn (options) cho màn hình Khám lâm sàng & Điều trị
 * Giúp dễ bảo trì, mở rộng và map động các thành phần UI thay vì hardcode từng element.
 */

// Bố cục sơ đồ 32 răng chuẩn Nha khoa quốc tế (FDI)
export const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Loại răng (Bộ răng)
export const TOOTH_TYPE_OPTIONS = [
  { value: 'PERMANENT', label: 'Răng vĩnh viễn' },
  { value: 'DECIDUOUS', label: 'Răng sữa' },
];

// Danh mục tình trạng răng (Tô màu sơ đồ Odontogram & Đổi tình trạng nhanh)
export const TOOTH_CONDITIONS = [
  { key: 'NORMAL', label: 'Bình thường', fill: '#F8FAFC', stroke: '#94A3B8', text: '#475569', badgeClass: 'bg-slate-100 text-slate-600' },
  { key: 'CARIES', label: 'Sâu răng', fill: '#2563EB', stroke: '#1D4ED8', text: '#FFFFFF', badgeClass: 'bg-blue-600 text-white' },
  { key: 'FILLING', label: 'Trám', fill: '#38BDF8', stroke: '#0284C7', text: '#FFFFFF', badgeClass: 'bg-sky-400 text-white' },
  { key: 'MISSING', label: 'Mất răng', fill: '#CBD5E1', stroke: '#64748B', text: '#475569', badgeClass: 'bg-slate-300 text-slate-700' },
  { key: 'GINGIVITIS', label: 'Viêm lợi', fill: '#F43F5E', stroke: '#E11D48', text: '#FFFFFF', badgeClass: 'bg-rose-500 text-white' },
  { key: 'WARNING', label: 'Răng cần chú ý', fill: '#F59E0B', stroke: '#D97706', text: '#FFFFFF', badgeClass: 'bg-amber-500 text-white' },
  { key: 'ROOT_CANAL', label: 'Lấy tủy', fill: '#8B5CF6', stroke: '#7C3AED', text: '#FFFFFF', badgeClass: 'bg-violet-500 text-white' },
];

// Trạng thái sâu răng (Toggle Buttons)
export const CARIES_STATUS_OPTIONS = [
  { value: 'NO', label: 'Không' },
  { value: 'YES', label: '✓ Có' },
];

// Mức độ lung lay của răng (Dropdown)
export const MOBILITY_OPTIONS = [
  'Bình thường',
  'Không lung lay',
  'Độ 1',
  'Độ 2',
  'Độ 3',
];

// Vị trí sâu trên bề mặt răng (Dropdown)
export const CARIES_LOCATION_OPTIONS = [
  'Bình thường',
  'Mặt nhai + Mặt gần',
  'Mặt nhai',
  'Mặt gần',
  'Mặt xa',
  'Mặt ngoài',
  'Mặt trong',
  'Cổ răng',
  'Toàn bộ thân răng',
];

// Tình trạng nướu quanh răng (Dropdown)
export const GINGIVA_STATUS_OPTIONS = [
  'Bình thường',
  'Viêm nhẹ',
  'Viêm trung bình',
  'Viêm nặng',
  'Tụt lợi',
  'Chảy máu khi thăm khám',
];

// Mức độ sâu răng (Dropdown) - Chuẩn hóa Key/Value đồng bộ với Enum Level Backend (ENAMEL, DENTIN, NEAR_PULP, PULP)
export const CARIES_DEPTH_OPTIONS = [
  { key: 'NORMAL', value: 'NORMAL', label: 'Bình thường' },
  { key: 'ENAMEL', value: 'ENAMEL', label: 'Sâu men' },
  { key: 'DENTIN', value: 'DENTIN', label: 'Sâu ngà' },
  { key: 'NEAR_PULP', value: 'NEAR_PULP', label: 'Sâu sát tủy' },
  { key: 'PULP', value: 'PULP', label: 'Sâu tủy' },
];

/**
 * Helper lấy nhãn hiển thị Tiếng Việt cho mức độ sâu răng từ mã Enum Backend
 * @param {string} val Mã Enum hoặc nhãn (ví dụ 'DENTIN' hoặc 'Sâu ngà')
 * @returns {string} Nhãn hiển thị tiếng Việt (ví dụ 'Sâu ngà')
 */
export function getCariesDepthLabel(val) {
  const found = CARIES_DEPTH_OPTIONS.find(
    (opt) => opt.key === val || opt.value === val || opt.label === val
  );
  return found ? found.label : (val || '—');
}

// Mức độ đau (Toggle Buttons)
export const PAIN_LEVEL_OPTIONS = [
  { value: 'NONE', label: 'Không' },
  { value: 'STIMULATED', label: 'Có khi kích thích' },
  { value: 'SPONTANEOUS', label: 'Đau tự phát' },
];

// Cấu hình các trường Dropdown trong thẻ "Khám lâm sàng — Răng [xx]"
// Giúp map tự động toàn bộ dropdown của form khám chi tiết
export const CLINICAL_EXAM_DROPDOWNS_CONFIG = [
  {
    fieldKey: 'mobility',
    label: 'Lung lay',
    options: MOBILITY_OPTIONS,
  },
  {
    fieldKey: 'cariesLocation',
    label: 'Vị trí sâu',
    options: CARIES_LOCATION_OPTIONS,
  },
  {
    fieldKey: 'gingivaStatus',
    label: 'Nướu quanh răng',
    options: GINGIVA_STATUS_OPTIONS,
  },
  {
    fieldKey: 'cariesDepth',
    label: 'Mức độ sâu',
    options: CARIES_DEPTH_OPTIONS,
  },
];

// Danh mục chẩn đoán mã ICD-10 chuyên khoa Răng - Hàm - Mặt phong phú (Sâu răng, Chỉnh nha, Nha chu, Tiểu phẫu...)
export const ICD10_DIAGNOSES = [
  // Chỉnh nha - Niềng răng - Khớp cắn (Toàn hàm)
  { code: 'K07.2', label: 'Sai khớp cắn Angle II/III — Chỉnh nha (K07.2)', defaultScope: 'FULL_MOUTH', indication: 'Niềng răng mắc cài / Khay trong suốt' },
  { code: 'K07.3', label: 'Răng chen chúc, khấp khểnh — Niềng răng (K07.3)', defaultScope: 'FULL_MOUTH', indication: 'Niềng răng chỉnh nha' },
  { code: 'K07.4', label: 'Khớp cắn hở / Khớp cắn sâu (K07.4)', defaultScope: 'FULL_MOUTH', indication: 'Chỉnh nha kết hợp phục hình' },
  
  // Bệnh lý răng đơn lẻ / Nhiều răng (Sâu răng, tủy, tiểu phẫu)
  { code: 'K02.1', label: 'Sâu ngà răng (K02.1)', defaultScope: 'SINGLE_TOOTH', indication: 'Trám răng Composite' },
  { code: 'K02.0', label: 'Sâu men răng (K02.0)', defaultScope: 'SINGLE_TOOTH', indication: 'Trám răng / Bôi Fluor' },
  { code: 'K02.2', label: 'Sâu ngà chân răng / Men xi măng (K02.2)', defaultScope: 'SINGLE_TOOTH', indication: 'Trám răng cổ chân răng' },
  { code: 'K04.0', label: 'Viêm tủy cấp (K04.0)', defaultScope: 'SINGLE_TOOTH', indication: 'Điều trị tủy răng (Nội nha)' },
  { code: 'K04.1', label: 'Hoại tử tủy (K04.1)', defaultScope: 'SINGLE_TOOTH', indication: 'Điều trị tủy & Bọc sứ' },
  { code: 'K04.5', label: 'Viêm quanh chóp mạn tính (K04.5)', defaultScope: 'SINGLE_TOOTH', indication: 'Điều trị nội nha lại / Cắt cuống' },
  { code: 'K01.1', label: 'Răng khôn mọc lệch / Mọc kẹt (K01.1)', defaultScope: 'MULTI_TEETH', indication: 'Tiểu phẫu nhổ răng khôn' },
  { code: 'K08.1', label: 'Mất răng bán phần / Toàn phần (K08.1)', defaultScope: 'SINGLE_TOOTH', indication: 'Cấy ghép Implant / Cầu sứ' },

  // Bệnh lý Nha chu & Thẩm mỹ
  { code: 'K05.1', label: 'Viêm nướu mãn tính toàn thể (K05.1)', defaultScope: 'FULL_MOUTH', indication: 'Cạo vôi răng & Đánh bóng toàn hàm' },
  { code: 'K05.3', label: 'Viêm nha chu mãn tính (K05.3)', defaultScope: 'FULL_MOUTH', indication: 'Nạo túi nha chu & Vệ sinh chuyên sâu' },
  { code: 'K03.6', label: 'Nhiễm màu răng / Vôi răng (K03.6)', defaultScope: 'FULL_MOUTH', indication: 'Tẩy trắng Laser / Vệ sinh răng' },
  { code: 'K03.0', label: 'Mòn men răng / Mòn ngót cổ răng (K03.0)', defaultScope: 'MULTI_TEETH', indication: 'Trám mòn cổ răng' },
];

// Danh mục phạm vi chẩn đoán (Scope)
export const DIAGNOSIS_SCOPE_OPTIONS = [
  { key: 'FULL_MOUTH', label: 'Toàn hàm', subLabel: 'Niềng răng / Chỉnh nha / Thẩm mỹ', badge: 'Chỉnh nha / Toàn hàm' },
  { key: 'MULTI_TEETH', label: 'Nhiều răng', subLabel: 'Chọn các răng trên sơ đồ', badge: 'Sơ đồ răng' },
  { key: 'UPPER_JAW', label: 'Hàm trên', subLabel: 'Cung hàm trên (Q1 + Q2)', badge: 'Cung trên' },
  { key: 'LOWER_JAW', label: 'Hàm dưới', subLabel: 'Cung hàm dưới (Q3 + Q4)', badge: 'Cung dưới' },
];

// Mức độ nghiêm trọng của bệnh lý
export const SEVERITY_OPTIONS = ['Nhẹ', 'Trung bình', 'Nặng'];

/**
 * Mapping mức độ hiển thị sang Enum Backend Level (MILD, MODERATE, SEVERE)
 */
export function mapSeverityToLevelEnum(sev) {
  switch (sev) {
    case 'Nhẹ': return 'MILD';
    case 'Trung bình': return 'MODERATE';
    case 'Nặng': return 'SEVERE';
    default: return 'MODERATE';
  }
}

/**
 * Helper xác định cung hàm / vị trí giải phẫu theo số hiệu răng (Hệ thống FDI)
 * @param {number|string} toothNumber Số hiệu răng (11-48)
 * @returns {string} Tên phân vùng cung hàm (ví dụ: 'Răng hàm dưới bên phải')
 */
export function getToothQuadrantLabel(toothNumber) {
  const t = Number(toothNumber);
  if (t >= 11 && t <= 18) return 'Răng hàm trên bên phải (Q1)';
  if (t >= 21 && t <= 28) return 'Răng hàm trên bên trái (Q2)';
  if (t >= 31 && t <= 38) return 'Răng hàm dưới bên trái (Q3)';
  if (t >= 41 && t <= 48) return 'Răng hàm dưới bên phải (Q4)';
  return 'Răng giải phẫu';
}

/**
 * Mapping tình trạng răng từ Frontend key sang Backend Enum (ToothStatus)
 */
export function mapFrontendToBackendToothStatus(status) {
  switch (status) {
    case 'CARIES': return 'CARIES';
    case 'FILLING': return 'FILLED';
    case 'MISSING': return 'MISSING';
    case 'GINGIVITIS': return 'GINGIVITIS';
    case 'WARNING': return 'ATTENTION_REQUIRE';
    case 'ROOT_CANAL': return 'ROOT_CANAL';
    case 'NORMAL':
    default: return 'HEALTHY';
  }
}

/**
 * Mapping tình trạng răng từ Backend Enum (ToothStatus) sang Frontend key
 */
export function mapBackendToFrontendToothStatus(status) {
  switch (status) {
    case 'CARIES': return 'CARIES';
    case 'FILLED': return 'FILLING';
    case 'MISSING': return 'MISSING';
    case 'GINGIVITIS': return 'GINGIVITIS';
    case 'ATTENTION_REQUIRE': return 'WARNING';
    case 'ROOT_CANAL': return 'ROOT_CANAL';
    case 'HEALTHY':
    default: return 'NORMAL';
  }
}

/**
 * Mapping mức độ sâu sang Enum Level Backend (ENAMEL, DENTIN, NEAR_PULP, PULP)
 */
export function mapCariesDepthToLevel(depth) {
  switch (depth) {
    case 'ENAMEL': return 'ENAMEL';
    case 'DENTIN': return 'DENTIN';
    case 'NEAR_PULP': return 'NEAR_PULP';
    case 'PULP': return 'PULP';
    default: return null;
  }
}

/**
 * Mapping vị trí sâu text sang Backend Enum CariesLocation
 */
export function mapLocationToBackendEnum(loc) {
  if (!loc || loc === 'Bình thường') return 'OCCLUSAL';
  const l = loc.toLowerCase();
  if (l.includes('toàn bộ')) return 'WHOLE_CROWN';
  if (l.includes('cổ răng')) return 'CERVICAL';
  if (l.includes('ngoài')) return 'BUCCAL';
  if (l.includes('trong')) return 'LINGUAL';
  if (l.includes('xa')) return 'DISTAL';
  if (l.includes('gần') && !l.includes('nhai')) return 'MESIAL';
  return 'OCCLUSAL';
}

/**
 * Mapping Backend Enum CariesLocation sang text hiển thị Tiếng Việt
 */
export function mapBackendEnumToLocation(locEnum) {
  switch (locEnum) {
    case 'OCCLUSAL': return 'Mặt nhai';
    case 'MESIAL': return 'Mặt gần';
    case 'DISTAL': return 'Mặt xa';
    case 'BUCCAL': return 'Mặt ngoài';
    case 'LINGUAL': return 'Mặt trong';
    case 'PALATAL': return 'Mặt vòm miệng';
    case 'CERVICAL': return 'Cổ răng';
    case 'WHOLE_CROWN': return 'Toàn bộ thân răng';
    default: return locEnum || '—';
  }
}

/**
 * Mapping mức độ nghiêm trọng bệnh lý chẩn đoán sang Enum Level Backend
 */
export function mapSeverityToBackendLevel(sev) {
  switch (sev) {
    case 'Nhẹ': return 'MILD';
    case 'Nặng': return 'SEVERE';
    case 'Trung bình':
    default: return 'MODERATE';
  }
}

export function mapBackendLevelToSeverity(level) {
  switch (level) {
    case 'MILD': return 'Nhẹ';
    case 'SEVERE': return 'Nặng';
    case 'MODERATE': return 'Trung bình';
    default: return level || 'Trung bình';
  }
}

