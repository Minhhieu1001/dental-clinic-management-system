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
