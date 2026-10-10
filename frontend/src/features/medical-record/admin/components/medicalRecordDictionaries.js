// Dictionaries và constants hỗ trợ hồ sơ bệnh án & tra cứu lâm sàng

export const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

export const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 0 ? age : 'N/A';
    } catch {
        return 'N/A';
    }
};

// Bảng tra cứu tên bệnh theo mã ICD-10 nha khoa
export const ICD10_LABELS = {
    'K02': 'Sâu răng',
    'K02.0': 'Sâu men răng',
    'K02.1': 'Sâu ngà răng',
    'K02.2': 'Sâu xê-măng răng',
    'K02.9': 'Sâu răng không xác định',
    'K03': 'Các bệnh khác của mô cứng răng',
    'K03.0': 'Mòn răng do ma sát',
    'K03.1': 'Mòn răng do chải răng',
    'K03.2': 'Xói mòn răng do axit',
    'K04': 'Bệnh tủy và mô quanh chóp',
    'K04.0': 'Viêm tủy răng',
    'K04.1': 'Hoại tử tủy răng',
    'K04.2': 'Thoái hóa tủy',
    'K04.4': 'Viêm quanh chóp răng cấp',
    'K04.5': 'Viêm quanh chóp răng mãn tính',
    'K04.6': 'Áp-xe quanh chóp có lỗ rò',
    'K04.7': 'Áp-xe quanh chóp không có lỗ rò',
    'K05': 'Viêm nướu và bệnh nha chu',
    'K05.0': 'Viêm nướu cấp tính',
    'K05.1': 'Viêm nướu mãn tính',
    'K05.2': 'Viêm nha chu cấp tính',
    'K05.3': 'Viêm nha chu mãn tính',
    'K07': 'Sai lệch vị trí răng & khớp cắn',
    'K07.1': 'Bất thường tương quan xương hàm',
    'K07.2': 'Sai khớp cắn',
    'K07.3': 'Bất thường vị trí răng (lệch, mọc ngầm)',
    'K08.1': 'Mất răng do tai nạn, nhổ răng',
    'K08.2': 'Teo sống hàm không răng',
};

// Map trạng thái răng
export const TOOTH_STATUS_MAP = {
    HEALTHY: { label: 'Bình thường', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    ATTENTION_REQUIRE: { label: 'Cần theo dõi', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
    WARNING: { label: 'Cần theo dõi', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
    FILLED: { label: 'Đã trám', badge: 'bg-teal-50 text-teal-800 border-teal-300' },
    CARIES: { label: 'Sâu răng', badge: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' },
    DECAY: { label: 'Sâu răng', badge: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' },
    MISSING: { label: 'Mất răng', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
    GINGIVITIS: { label: 'Viêm nướu', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
    ROOT_CANAL: { label: 'Đã chữa tủy', badge: 'bg-purple-50 text-purple-800 border-purple-300' },
    MARROW: { label: 'Tổn thương tủy', badge: 'bg-rose-50 text-rose-800 border-rose-300' },
    CROWN: { label: 'Bọc răng sứ', badge: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
    IMPLANT: { label: 'Trồng Implant', badge: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
    IMPACTED: { label: 'Mọc ngầm / Lệch', badge: 'bg-red-50 text-red-800 border-red-300' },
    FRACTURED: { label: 'Mẻ / Gãy vỡ', badge: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
};

// Map độ sâu tổn thương răng
export const CARIES_DEPTH_MAP = {
    ENAMEL: 'Men răng',
    DENTIN: 'Ngà răng',
    NEAR_PULP: 'Sát tủy răng',
    PULP: 'Tủy răng',
    SUPERFICIAL: 'Nông',
    DEEP: 'Sâu',
    NONE: 'Không sâu',
};

// Map vị trí mặt răng
export const CARIES_LOCATION_MAP = {
    OCCLUSAL: 'Mặt nhai (O)',
    MESIAL: 'Mặt gần (M)',
    DISTAL: 'Mặt xa (D)',
    BUCCAL: 'Mặt ngoài / Má (B)',
    LINGUAL: 'Mặt trong / Lưỡi (L)',
    PALATAL: 'Mặt khẩu cái (P)',
    CERVICAL: 'Cổ răng (C)',
    WHOLE_CROWN: 'Toàn thân răng',
};

// Map mức độ chẩn đoán
export const DIAGNOSIS_LEVEL_MAP = {
    MILD: { label: 'Nhẹ', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    MODERATE: { label: 'Trung bình', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
    SEVERE: { label: 'Nghiêm trọng', badge: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' },
    ENAMEL: { label: 'Men răng', badge: 'bg-sky-50 text-sky-800 border-sky-300' },
    DENTIN: { label: 'Ngà răng', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
    NEAR_PULP: { label: 'Cận tủy', badge: 'bg-orange-50 text-orange-800 border-orange-300' },
    PULP: { label: 'Tủy răng', badge: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' },
};

export const getToothStatusInfo = (status) => {
    if (!status) return { label: 'Bình thường', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    const key = String(status).toUpperCase().trim();
    return TOOTH_STATUS_MAP[key] || { label: status, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
};

export const getDiagnosisLevelInfo = (level) => {
    if (!level) return null;
    const key = String(level).toUpperCase().trim();
    return DIAGNOSIS_LEVEL_MAP[key] || { label: level, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
};

export const getPhaseStatusInfo = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'COMPLETED':
            return { label: 'Hoàn thành', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
        case 'IN_PROGRESS':
            return { label: 'Đang thực hiện', badge: 'bg-sky-50 text-sky-700 border-sky-300' };
        case 'CANCELLED':
            return { label: 'Đã hủy', badge: 'bg-rose-50 text-rose-700 border-rose-300' };
        case 'PENDING':
        default:
            return { label: 'Chờ thực hiện', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
};

export const getVisitStatusInfo = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'COMPLETED':
            return { label: 'Hoàn tất', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium' };
        case 'IN_PROGRESS':
            return { label: 'Đang điều trị', badge: 'bg-sky-50 text-sky-700 border-sky-300 font-medium' };
        case 'CONFIRMED':
            return { label: 'Đã xác nhận', badge: 'bg-blue-50 text-blue-700 border-blue-300' };
        case 'WAITING':
            return { label: 'Chờ vào phòng', badge: 'bg-amber-50 text-amber-700 border-amber-300' };
        case 'CANCELLED':
            return { label: 'Đã hủy', badge: 'bg-rose-50 text-rose-700 border-rose-300' };
        case 'PENDING':
        default:
            return { label: 'Chờ khám', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
};

export const formatDiagnosis = (diagnosis) => {
    if (typeof diagnosis === 'string') return diagnosis;
    if (!diagnosis || typeof diagnosis !== 'object') return '';

    return diagnosis.primaryDiagnosis
        || diagnosis.label
        || diagnosis.name
        || diagnosis.diagnosis
        || diagnosis.diagnosticNotes
        || '';
};
