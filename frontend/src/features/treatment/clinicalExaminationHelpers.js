import {
  Sparkles,
  Stethoscope,
  Shield,
  Smile,
  Anchor,
  Sun,
} from 'lucide-react';

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

// Danh mục chẩn đoán mã ICD-10 chuyên khoa Răng - Hàm - Mặt
// Toàn bộ danh mục chẩn đoán đã được lấy trực tiếp từ CSDL (bảng PrimaryDiagnosis / SystemDictionary)
export const ICD10_DIAGNOSES = [];

/**
 * Helper chuẩn hóa nhãn chẩn đoán chính từ CSDL
 * Lấy trực tiếp từ giá trị đã lưu trong DB (primaryDiagnosis / primaryDiagnosisName / label)
 */
export function getDiagnosisLabel(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.label || item.primaryDiagnosisName || item.primaryDiagnosis || item.code || '';
}

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

/* =========================================================================
 * 🦷 DỮ LIỆU MẶC ĐỊNH & GỢI Ý CHO MODULE ĐIỀU TRỊ (TREATMENT MODULE)
 * Quản lý tập trung toàn bộ preset, options, templates và config để dễ bảo trì,
 * clean code và tái sử dụng qua cơ chế import.
 * ========================================================================= */

// =========================================================================
// PHẦN 1: DỮ LIỆU KẾ HOẠCH ĐIỀU TRỊ (TREATMENT PLANS & PHÁC ĐỒ MẪU)
// -------------------------------------------------------------------------
// Dữ liệu: Danh mục dịch vụ nha khoa chuẩn theo CSDL (Service Entity)
// Modal / Màn hình: Màn hình chính Lập Kế Hoạch Điều Trị & Gợi ý chỉ định
// File sử dụng:
//   - src/features/treatment/TreatmentPlans.jsx
//   - src/features/treatment/action/AddServiceModal.jsx (fallback)
// =========================================================================
export const DEFAULT_SERVICE_CATALOG = [
  { service_id: 'srv-1', service_name: 'Trám răng Composite thẩm mỹ', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 400000, description: 'Trám phục hồi sâu ngà bằng Composite quang trùng hợp' },
  { service_id: 'srv-2', service_name: 'Điều trị tủy răng (Nội nha)', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 1500000, description: 'Lấy sạch tủy viêm, tạo hình và trám bít ống tủy' },
  { service_id: 'srv-3', service_name: 'Bọc răng sứ Zirconia cao cấp', category: 'RANG_SU', unit: 'Răng', price: 3500000, description: 'Mão toàn sứ Zirconia chịu lực cao, bảo tồn cùi răng' },
  { service_id: 'srv-4', service_name: 'Mài cùi & Lấy dấu cùi răng kỹ thuật số', category: 'RANG_SU', unit: 'Răng', price: 500000, description: 'Quét dấu quang học 3D thiết kế mão sứ chính xác' },
  { service_id: 'srv-5', service_name: 'Cạo vôi răng & Đánh bóng toàn hàm', category: 'KHAM_DIEU_TRI', unit: 'Hàm', price: 300000, description: 'Làm sạch cao răng trên và dưới nướu, đánh bóng men răng' },
  { service_id: 'srv-6', service_name: 'Tiểu phẫu nhổ răng khôn mọc lệch (R8)', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 1200000, description: 'Nhổ răng khôn ngầm, kẹt xương bằng máy rung siêu âm Piezotome' },
  { service_id: 'srv-7', service_name: 'Cấy ghép Implant Straumann Thụy Sĩ', category: 'IMPLANT', unit: 'Trụ', price: 18000000, description: 'Cấy trụ Implant phục hồi răng mất vĩnh viễn' },
  { service_id: 'srv-8', service_name: 'Tẩy trắng răng Laser Whitening', category: 'TAY_TRANG', unit: 'Liệu trình', price: 2500000, description: 'Tẩy trắng công nghệ Laser tại ghế không ê buốt' },
  { service_id: 'srv-9', service_name: 'Gắn mắc cài kim loại tự buộc 2 hàm', category: 'NIENG_RANG', unit: 'Gói 2 hàm', price: 25000000, description: 'Chỉnh nha niềng răng mắc cài tự buộc Damon' },
  { service_id: 'srv-10', service_name: 'Trám tái tạo thân răng có chốt sợi', category: 'KHAM_DIEU_TRI', unit: 'Răng', price: 700000, description: 'Gắn chốt sợi thủy tinh tái tạo cùi răng vỡ lớn' },
];

// =========================================================================
// Dữ liệu: 3 Gói Phác Đồ Gợi Ý Điều Trị Mẫu Chuẩn Nha Khoa (Preset Packages)
// Modal / Màn hình:
//   - Modal Tạo Kế Hoạch Điều Trị (CreatePlanModal)
//   - Màn hình Lập Kế Hoạch Điều Trị (TreatmentPlans)
// File sử dụng:
//   - src/features/treatment/TreatmentPlans.jsx
//   - src/features/treatment/action/CreatePlanModal.jsx
// =========================================================================
export const PRESET_PACKAGES = [
  {
    package_id: 'pkg-1',
    package_name: 'Khởi tạo 1 giai đoạn điều trị',
    description: '',
    package_price: 0,
    original_price: 0,
    phases: [
      { phase_name: 'Giai đoạn 1', phase_order: 1, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
    ],
  },
  {
    package_id: 'pkg-2',
    package_name: 'Khởi tạo 2 giai đoạn điều trị',
    description: '',
    package_price: 0,
    original_price: 0,
    phases: [
      { phase_name: 'Giai đoạn 1', phase_order: 1, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
      { phase_name: 'Giai đoạn 2', phase_order: 2, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
    ],
  },
  {
    package_id: 'pkg-3',
    package_name: 'Khởi tạo 3 giai đoạn điều trị',
    description: '',
    package_price: 0,
    original_price: 0,
    phases: [
      { phase_name: 'Giai đoạn 1', phase_order: 1, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
      { phase_name: 'Giai đoạn 2', phase_order: 2, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
      { phase_name: 'Giai đoạn 3', phase_order: 3, treatmentType: '', estimated_duration: '', status: 'PENDING', description: '', treatment_services: [] },
    ],
  },
];

// =========================================================================
// Dữ liệu: Cấu hình Badge hiển thị trạng thái chuẩn StatusPhase (PENDING | IN_PROGRESS | COMPLETED)
// Modal / Màn hình:
//   - Màn hình Lập Kế Hoạch Điều Trị (TreatmentPlans)
//   - Modal Chi Tiết Giai Đoạn Toàn Màn Hình (PhaseDetailModal)
//   - Modal Buổi Điều Trị (TreatmentVisitModal)
// File sử dụng:
//   - src/features/treatment/TreatmentPlans.jsx
//   - src/features/treatment/action/PhaseDetailModal.jsx
// =========================================================================
export const STATUS_PHASE_CONFIG = {
  PENDING: {
    label: 'Chờ thực hiện',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  IN_PROGRESS: {
    label: 'Đang điều trị',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
    badge: 'bg-sky-50 text-sky-800 border-sky-300',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  CANCEL: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
    badge: 'bg-rose-50 text-rose-800 border-rose-300',
  },
};

// =========================================================================
// PHẦN 2: DỮ LIỆU MODAL GIAI ĐOẠN ĐIỀU TRỊ (PHASE MODAL)
// -------------------------------------------------------------------------
// Dữ liệu: Gợi ý tên giai đoạn điều trị nhanh (Quick phase suggestions)
// Modal: Modal Thêm / Sửa Giai Đoạn Điều Trị (PhaseModal)
// File sử dụng:
//   - src/features/treatment/action/PhaseModal.jsx
// =========================================================================
export const QUICK_PHASE_SUGGESTIONS = [
  'Điều trị tủy & Nội nha',
  'Phục hình bọc sứ',
  'Cấy ghép Implant',
  'Chỉnh nha niềng răng',
  'Vệ sinh & Cạo vôi răng',
  'Tiểu phẫu nhổ răng',
  'Tẩy trắng & Thẩm mỹ',
];

// =========================================================================
// Dữ liệu: Danh sách tùy chọn Loại Điều Trị (Treatment Types) cho Selectbox
// Modal: Modal Thêm / Sửa Giai Đoạn Điều Trị (PhaseModal)
// File sử dụng:
//   - src/features/treatment/action/PhaseModal.jsx
// =========================================================================
export const TREATMENT_TYPE_OPTIONS = [
  { value: 'Nội nha & Nha chu', label: 'Nội nha & Nha chu' },
  { value: 'Phục hình sứ', label: 'Phục hình sứ' },
  { value: 'Chỉnh nha', label: 'Chỉnh nha' },
  { value: 'Cấy ghép Implant', label: 'Cấy ghép Implant' },
  { value: 'Tiểu phẫu', label: 'Tiểu phẫu' },
  { value: 'Thẩm mỹ & Tẩy trắng', label: 'Thẩm mỹ & Tẩy trắng' },
  { value: 'Tổng quát', label: 'Tổng quát' },
];

// =========================================================================
// Dữ liệu: Danh sách gợi ý thời gian dự kiến của giai đoạn (Duration presets)
// Modal: Modal Thêm / Sửa Giai Đoạn Điều Trị (PhaseModal)
// File sử dụng:
//   - src/features/treatment/action/PhaseModal.jsx
// =========================================================================
export const DURATION_SUGGESTIONS = [
  '1 buổi',
  '3 - 5 ngày',
  '1 - 2 tuần',
  '3 - 4 tuần',
  '1 - 2 tháng',
  '3 - 6 tháng',
];

// =========================================================================
// Dữ liệu: Cấu hình 3 nút bấm chọn trạng thái giai đoạn (Không dùng Selectbox)
// Modal: Modal Thêm / Sửa Giai Đoạn Điều Trị (PhaseModal)
// File sử dụng:
//   - src/features/treatment/action/PhaseModal.jsx
// =========================================================================
export const PHASE_STATUS_BUTTON_OPTIONS = [
  { value: 'PENDING', label: 'Chờ khám', active: 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20' },
  { value: 'IN_PROGRESS', label: 'Đang làm', active: 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20' },
  { value: 'COMPLETED', label: 'Hoàn tất', active: 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20' },
  { value: 'CANCEL', label: 'Đã hủy', active: 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20' },
];

// =========================================================================
// PHẦN 3: DỮ LIỆU MODAL BUỔI ĐIỀU TRỊ LÂM SÀNG (TREATMENT VISIT MODAL)
// -------------------------------------------------------------------------
// Dữ liệu: Mẫu nội dung ghi chép thủ thuật / diễn biến lâm sàng nhanh (Procedure Templates)
// Modal:
//   - Modal Tạo / Cập Nhật Buổi Điều Trị (TreatmentVisitModal)
//   - Không Gian Điều Trị Lâm Sàng Toàn Màn Hình (PhaseDetailModal)
// File sử dụng:
//   - src/features/treatment/action/TreatmentVisitModal.jsx
//   - src/features/treatment/action/PhaseDetailModal.jsx
// =========================================================================
export const CLINICAL_PROCEDURE_TEMPLATES = [
  'Gây tê tại chỗ Lidocaine 2%, mở tủy buồng, đo chiều dài làm việc các ống tủy, bơm rửa NaOCl 2.5%, đặt Ca(OH)2 trám tạm Cavit.',
  'Tháo chất trám tạm, thử cone Gutta Percha chính, chụp X-quang kiểm tra độ khít sát chóp và trám bít ống tủy vĩnh viễn.',
  'Chuẩn bị ống mang chốt, gắn chốt sợi thủy tinh, mài cùi răng đúng giải phẫu, quét dấu kỹ thuật số 3D gửi Labo CAD/CAM.',
  'Tháo răng tạm, thử mão Zirconia trên miệng: kiểm tra điểm tiếp xúc bên và khớp cắn, dán cố định bằng Cement RelyX U200.',
  'Tháo thun cũ, kiểm tra sự dịch chuyển cung răng, thay dây cung Niti mới, gắn lại mắc cài bong và kích hoạt lực kéo.',
  'Lấy cao răng siêu âm trên và dưới nướu hai hàm, bơm rửa sát khuẩn Chlorhexidine 0.12%, đánh bóng toàn bộ men răng.',
  'Tiểu phẫu chia chân răng bằng máy Piezotome, nạo sạch tổ chức hạt viêm quanh chóp, bơm rửa nước muối sinh lý và khâu kín.',
];

// =========================================================================
// Dữ liệu: Cấu hình 2 nút chọn trạng thái buổi điều trị (Không dùng Selectbox)
// Modal: Modal Tạo / Cập Nhật Buổi Điều Trị (TreatmentVisitModal)
// File sử dụng:
//   - src/features/treatment/action/TreatmentVisitModal.jsx
// =========================================================================
export const VISIT_STATUS_BUTTON_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'Đang thực hiện', active: 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20' },
  { value: 'COMPLETED', label: 'Hoàn tất', active: 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20' },
];

// =========================================================================
// PHẦN 4: DỮ LIỆU MODAL CHỈ ĐỊNH DỊCH VỤ NHA KHOA (ADD SERVICE MODAL)
// -------------------------------------------------------------------------
// Dữ liệu: 5 Loại danh mục dịch vụ chuẩn khớp CSDL Postgres (Service Categories)
// Modal: Modal Chỉ Định Dịch Vụ Nha Khoa Vào Giai Đoạn (AddServiceModal)
// File sử dụng:
//   - src/features/treatment/action/AddServiceModal.jsx
// =========================================================================
export const SERVICE_CATEGORIES = [
  { key: 'ALL', label: 'Tất cả loại dịch vụ', icon: Sparkles, color: 'bg-slate-100 text-slate-800' },
  { key: 'KHAM_DIEU_TRI', label: 'Khám & Điều trị', icon: Stethoscope, color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { key: 'RANG_SU', label: 'Răng sứ thẩm mỹ', icon: Shield, color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { key: 'NIENG_RANG', label: 'Niềng răng - Chỉnh nha', icon: Smile, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { key: 'IMPLANT', label: 'Cấy ghép Implant', icon: Anchor, color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { key: 'TAY_TRANG', label: 'Tẩy trắng răng', icon: Sun, color: 'bg-amber-50 text-amber-800 border-amber-200' },
];

// Helper hiển thị badge loại dịch vụ nha khoa
export function getCategoryBadge(categoryKey) {
  switch (categoryKey?.toUpperCase()) {
    case 'KHAM_DIEU_TRI':
      return { label: 'Khám & Điều trị', cls: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'RANG_SU':
      return { label: 'Răng sứ', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'NIENG_RANG':
      return { label: 'Niềng răng', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'IMPLANT':
      return { label: 'Implant', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'TAY_TRANG':
      return { label: 'Tẩy trắng', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: categoryKey || 'Nha khoa', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// Phân chia 4 cung hàm FDI chuẩn (Dùng cho bộ lọc răng trong AddServiceModal)
export const UPPER_JAW_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11']; // Cung 1
export const UPPER_JAW_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];  // Cung 2
export const LOWER_JAW_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41']; // Cung 4
export const LOWER_JAW_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];  // Cung 3

// =========================================================================
// PHẦN 5: DỮ LIỆU TAB CHẨN ĐOÁN CỦA BÁC SĨ (DOCTOR DIAGNOSIS TAB)
// -------------------------------------------------------------------------
// Dữ liệu: 12 Tag chỉ định điều trị nha khoa phổ biến nhất để bấm chọn nhanh
// Component: Tab Chẩn Đoán Bác Sĩ & ICD-10 (DoctorDiagnosisTab) & Modal Chẩn Đoán Y Khoa (DiagnosisModal)
// File sử dụng:
//   - src/features/treatment/components/DoctorDiagnosisTab.jsx
//   - src/features/treatment/action/DiagnosisModal.jsx
// =========================================================================
export const COMMON_INDICATION_TAGS = [
  'Trám răng Composite',
  'Điều trị tủy (Nội nha)',
  'Bọc răng sứ Zirconia',
  'Cạo vôi răng & Đánh bóng',
  'Tiểu phẫu nhổ răng khôn',
  'Cấy ghép Implant',
  'Niềng răng chỉnh nha',
  'Tẩy trắng răng thẩm mỹ',
  'Chụp X-quang kiểm tra',
  'Kê đơn kháng sinh & giảm đau',
  'Tái khám sau 1 tuần',
  'Theo dõi định kỳ 6 tháng',
];

// =========================================================================
// PHẦN 6: DỮ LIỆU MODAL TẠO ĐỢT ĐIỀU TRỊ MỚI (CREATE TREATMENT SESSION MODAL)
// -------------------------------------------------------------------------
// Dữ liệu: Gợi ý nhanh lý do khám & triệu chứng ban đầu của bệnh nhân
// Modal: Modal Xác Nhận Tạo Đợt Điều Trị Mới (CreateTreatmentSessionModal)
// File sử dụng:
//   - src/features/treatment/action/CreateTreatmentSessionModal.jsx
//   - src/features/treatment/ClinicalExamination.jsx (fallback)
// =========================================================================
export const CHIEF_COMPLAINT_SUGGESTIONS = [
  'Đau buốt răng khi ăn nhai hoặc uống nước lạnh',
  'Viêm nướu, chảy máu chân răng khi đánh răng',
  'Kiểm tra răng định kỳ & Cạo vôi răng',
  'Mất răng muốn phục hồi cấy ghép Implant'
];
