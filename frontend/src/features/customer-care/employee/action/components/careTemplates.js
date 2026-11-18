import { formatDate, formatDateTime } from '../../../../../utils/dateUtils.js';

const text = (value) => value == null ? '' : String(value);
const money = (value) => value == null ? '' : `${Number(value).toLocaleString('vi-VN')} đ`;

export const CARE_OBJECT_LABELS = {
    DEBT: 'Hóa đơn cần nhắc thanh toán',
    TREATMENT_PROGRESS: 'Kế hoạch đang điều trị',
    FOLLOW_UP: 'Lịch tái khám',
    BIRTHDAY: 'Khuyến mãi sinh nhật (không bắt buộc)',
    PROMOTION: 'Chương trình khuyến mãi',
};

// Each category reads one canonical API DTO collection supplied by the detail page.
export function getCareObjects(category, { invoices = [], treatmentPlans = [], followUps = [], promotions = [] } = {}) {
    switch (category) {
        case 'THANK_YOU': return [];
        case 'DEBT': return (invoices || []).filter((item) => {
            const rem = Number(item.remainingAmount ?? item.remaining ?? (Number(item.finalAmount || 0) - Number(item.paidAmount || 0)));
            return item.paymentStatus !== 'CANCELLED' && (rem > 0 || item.paymentStatus === 'PARTIALLY_PAID' || item.paymentStatus === 'UNPAID');
        });
        case 'TREATMENT_PROGRESS': return (treatmentPlans || []).filter((item) => item.status === 'IN_PROGRESS' || item.status == null);
        case 'FOLLOW_UP': return (followUps || []).filter((item) => item.status === true || item.status === 'SCHEDULED' || item.status == null);
        case 'BIRTHDAY':
        case 'PROMOTION': return (promotions || []).filter((item) => item.isValid === true || item.isValid == null);
        default: return [];
    }
}

export function getCareObjectLabel(category, item) {
    if (!item) return '';
    switch (category) {
        case 'DEBT': {
            const rem = item.remainingAmount ?? (Number(item.finalAmount || 0) - Number(item.paidAmount || 0));
            return `${text(item.invoiceCode || item.code || 'HĐ')} — ${formatDate(item.invoiceDate || item.createdAt, '')} — Còn nợ: ${money(rem)}`;
        }
        case 'TREATMENT_PROGRESS': return text(item.planName || item.title || 'Kế hoạch điều trị');
        case 'FOLLOW_UP': return `${formatDateTime(item.followUpDate || item.appointmentDate, '')} — ${text(item.reason || item.notes || 'Tái khám')}`;
        case 'BIRTHDAY':
        case 'PROMOTION': return `${text(item.title || item.name || 'Ưu đãi')} — ${text(item.couponCode || item.code || '')}`;
        default: return '';
    }
}

function promotionContent(promotion) {
    if (!promotion) return '';
    const discount = promotion.discountPercent != null
        ? `${promotion.discountPercent}%` : money(promotion.discountAmount);
    return `Chương trình: ${text(promotion.title)}\nMã ưu đãi: ${text(promotion.couponCode)}\nNội dung: ${text(promotion.description)}\nMức giảm: ${discount}\nGiảm tối đa: ${money(promotion.maxDiscountAmount)}\nGiá trị hóa đơn tối thiểu: ${money(promotion.minOrderAmount)}\nThời gian áp dụng: ${formatDate(promotion.startDate, '')} - ${formatDate(promotion.endDate, '')}`;
}

function treatmentPhaseContent(phases) {
    if (!Array.isArray(phases)) return '';
    const phaseOrder = (phase) => {
        if (phase.phaseOrder == null || String(phase.phaseOrder).trim() === '') return Infinity;
        const order = Number(phase.phaseOrder);
        return Number.isFinite(order) ? order : Infinity;
    };
    const sortedPhases = [...phases].sort((a, b) => {
        const first = phaseOrder(a);
        const second = phaseOrder(b);
        return first === second ? 0 : first - second;
    });
    const groups = [
        { status: 'IN_PROGRESS', title: 'Lộ trình đang thực hiện' },
        { status: 'COMPLETED', title: 'Lộ trình đã hoàn thành' },
        { status: 'PENDING', title: 'Lộ trình chưa hoàn thành (chờ thực hiện)' },
        { status: 'CANCEL', title: 'Lộ trình đã hủy' },
    ];
    return groups.map(({ status, title }) => {
        const items = sortedPhases.filter((phase) => phase.status === status);
        if (status === 'CANCEL' && items.length === 0) return '';
        const lines = items.map((phase) => {
            const details = [`• Lộ trình ${text(phase.phaseOrder)}: ${text(phase.phaseName)}`];
            if (phase.description) details.push(`  Nội dung: ${phase.description}`);
            if (phase.expectedStartDate != null || phase.expectedEndDate != null) {
                details.push(`  Thời gian dự kiến: ${formatDate(phase.expectedStartDate, '')} - ${formatDate(phase.expectedEndDate, '')}`);
            }
            return details.join('\n');
        });
        return `${title}:\n${lines.join('\n')}`;
    }).filter(Boolean).join('\n\n');
}

export function buildCareContent(category, patient, selectedObject) {
    const includePatientDetails = category !== 'PROMOTION' && category !== 'BIRTHDAY';
    const greeting = `Kính gửi Anh/Chị ${text(patient.fullName)},`
        + (includePatientDetails ? `\n\nMã bệnh nhân: ${text(patient.patientCode)}\nSố điện thoại: ${text(patient.phone)}` : '');
    const closing = '\n\nAnh/Chị vui lòng phản hồi email này nếu cần hỗ trợ.\n\nTrân trọng,\nĐội ngũ Crown Dental';
    const item = selectedObject;
    let body = '';
    switch (category) {
        case 'THANK_YOU':
            body = `Crown Dental chân thành cảm ơn Anh/Chị đã tin tưởng lựa chọn phòng khám để chăm sóc sức khỏe răng miệng. Chúng tôi rất trân trọng cơ hội được đồng hành cùng Anh/Chị trên hành trình giữ gìn nụ cười khỏe đẹp.\n\nĐể thuận tiện theo dõi và sử dụng các tiện ích trên hệ thống, Anh/Chị vui lòng sử dụng mã bệnh nhân ${text(patient.patientCode)} khi đăng ký tài khoản. Mã này giúp liên kết tài khoản với hồ sơ bệnh nhân của Anh/Chị tại phòng khám.\n\nAnh/Chị vui lòng giữ lại email này để tra cứu mã bệnh nhân khi cần. Nếu gặp khó khăn trong quá trình đăng ký, đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ.\n\nKính chúc Anh/Chị nhiều sức khỏe và luôn tự tin với nụ cười của mình!`;
            break;
        case 'DEBT': {
            const invoiceCode = item?.invoiceCode || item?.code || '';
            const finalAmount = item?.finalAmount ?? item?.totalAmount;
            const paidAmount = item?.paidAmount ?? 0;
            const remainingAmount = item?.remainingAmount ?? (finalAmount != null ? Number(finalAmount) - Number(paidAmount) : '');
            const nextPayment = item?.nextPaymentDate || item?.dueDate || '';
            body = `Crown Dental xin nhắc khoản thanh toán của Anh/Chị:\nMã hóa đơn: ${text(invoiceCode)}\nTổng tiền cần thanh toán: ${money(finalAmount)}\nĐã thanh toán: ${money(paidAmount)}\nCòn nợ: ${money(remainingAmount)}\nNgày cần thanh toán: ${formatDate(nextPayment, '')}`;
            break;
        }
        case 'TREATMENT_PROGRESS': {
            const phases = item?.phases;
            const progress = Array.isArray(phases)
                ? `${phases.filter((phase) => phase.status === 'COMPLETED').length}/${phases.length}` : '';
            body = `Crown Dental xin nhắc tiến trình điều trị:\nKế hoạch: ${text(item?.planName)}\nNội dung: ${text(item?.description)}\nGiai đoạn đã hoàn thành: ${progress}\nThời gian điều trị: ${formatDate(item?.startDate, '')} - ${formatDate(item?.endDate, '')}\nBác sĩ phụ trách: ${text(item?.dentistName)}`;
            const phaseDetails = treatmentPhaseContent(phases);
            if (phaseDetails) body += `\n\n${phaseDetails}`;
            break;
        }
        case 'FOLLOW_UP':
            body = `Crown Dental xin nhắc lịch tái khám:\nThời gian: ${formatDateTime(item?.followUpDate, '')}\nNội dung: ${text(item?.reason)}\nBác sĩ phụ trách: ${text(item?.dentistName)}\nChi nhánh: ${text(item?.branchName)}\nĐịa chỉ: ${text(item?.branchAddress)}\nGhi chú: ${text(item?.note)}`;
            break;
        case 'BIRTHDAY':
            body = `Crown Dental chúc Anh/Chị sinh nhật vui vẻ, nhiều sức khỏe và luôn rạng rỡ với nụ cười tươi sáng!\n\n${promotionContent(item)}`;
            break;
        case 'PROMOTION':
            body = `Crown Dental trân trọng giới thiệu chương trình ưu đãi:\n${promotionContent(item)}`;
            break;
    }
    return `${greeting}\n\n${body}${closing}`;
}
