import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCareContent, getCareObjects } from '../src/features/customer-care/employee/action/components/careTemplates.js';

const patient = { fullName: 'Nguyễn An', patientCode: 'BN001', phone: '0901234567' };
const data = {
    invoices: [
        { id: 'first', invoiceCode: 'HD001', paymentStatus: 'PARTIALLY_PAID', finalAmount: 10000000, paidAmount: 4000000, remainingAmount: 6000000, nextPaymentDate: '2026-12-01' },
        { id: 'second', invoiceCode: 'HD002', paymentStatus: 'UNPAID', finalAmount: 2000000, paidAmount: 0, remainingAmount: 2000000, nextPaymentDate: null },
        { id: 'paid', paymentStatus: 'PAID', remainingAmount: 0 },
        { id: 'cancelled', paymentStatus: 'CANCELLED', remainingAmount: 10 },
    ],
    treatmentPlans: [
        { id: 'active', status: 'IN_PROGRESS', planName: 'Điều trị A', phases: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS' }] },
        { id: 'done', status: 'COMPLETED' },
        { id: 'cancel', status: 'CANCEL' },
    ],
    followUps: [{ id: 'enabled', status: true }, { id: 'disabled', status: false }],
    promotions: [{ id: 'valid', isValid: true }, { id: 'expired', isValid: false }],
};

test('identity is included in all requested email templates', () => {
    for (const category of ['THANK_YOU', 'DEBT', 'TREATMENT_PROGRESS', 'FOLLOW_UP']) {
        const body = buildCareContent(category, patient, undefined);
        assert.match(body, /Mã bệnh nhân: BN001/);
        assert.match(body, /Số điện thoại: 0901234567/);
        assert.doesNotMatch(body, /liên hệ.*0901234567/);
    }
});

test('thank-you explains account registration without requiring an invoice', () => {
    assert.deepEqual(getCareObjects('THANK_YOU', data), []);
    const body = buildCareContent('THANK_YOU', patient, data.invoices[0]);
    assert.match(body, /mã bệnh nhân BN001 khi đăng ký tài khoản/);
    assert.doesNotMatch(body, /HD001|Hóa đơn:|Ngày lập:/);
});

test('debt email uses only the selected invoice and preserves zero paid amount', () => {
    const first = buildCareContent('DEBT', patient, data.invoices[0]);
    assert.match(first, /Tổng tiền cần thanh toán: 10\.000\.000 đ/);
    assert.match(first, /Đã thanh toán: 4\.000\.000 đ/);
    assert.match(first, /Còn nợ: 6\.000\.000 đ/);
    assert.match(first, /Ngày cần thanh toán: 01\/12\/2026/);
    const second = buildCareContent('DEBT', patient, data.invoices[1]);
    assert.match(second, /Mã hóa đơn: HD002/);
    assert.match(second, /Đã thanh toán: 0 đ/);
    assert.doesNotMatch(second, /HD001|6\.000\.000|01\/12\/2026/);
});

test('only eligible objects appear per category', () => {
    assert.deepEqual(getCareObjects('DEBT', data).map((item) => item.id), ['first', 'second']);
    assert.deepEqual(getCareObjects('TREATMENT_PROGRESS', data).map((item) => item.id), ['active']);
    assert.deepEqual(getCareObjects('FOLLOW_UP', data).map((item) => item.id), ['enabled']);
    assert.deepEqual(getCareObjects('PROMOTION', data).map((item) => item.id), ['valid']);
});

test('missing values stay blank without mock data', () => {
    const body = buildCareContent('DEBT', {}, undefined);
    assert.match(body, /Mã bệnh nhân: \nSố điện thoại: /);
    assert.match(body, /Còn nợ: \nNgày cần thanh toán: /);
    assert.doesNotMatch(body, /undefined|null|NaN|15\.000\.000/);
    assert.doesNotMatch(buildCareContent('BIRTHDAY', patient, undefined), /200\.000|Voucher/);
});

test('treatment progress and follow-up content come from selected objects', () => {
    const treatment = buildCareContent('TREATMENT_PROGRESS', patient, data.treatmentPlans[0]);
    assert.match(treatment, /Kế hoạch: Điều trị A/);
    assert.match(treatment, /Giai đoạn đã hoàn thành: 1\/2/);
    const followUp = buildCareContent('FOLLOW_UP', patient, {
        followUpDate: '2026-12-02T09:30:00', reason: 'Kiểm tra răng', dentistName: 'Bác sĩ A',
    });
    assert.match(followUp, /02\/12\/2026 09:30/);
    assert.match(followUp, /Nội dung: Kiểm tra răng/);
});

test('promotion content uses selected terms', () => {
    const body = buildCareContent('PROMOTION', patient, {
        title: 'Ưu đãi A', couponCode: 'TEST', discountPercent: 10, minOrderAmount: 500000,
        startDate: '2026-11-01', endDate: '2026-11-30',
    });
    assert.match(body, /Chương trình: Ưu đãi A/);
    assert.match(body, /Mức giảm: 10%/);
    assert.match(body, /tối thiểu: 500\.000 đ/);
    assert.match(body, /01\/11\/2026 - 30\/11\/2026/);
});

test('treatment email groups actual phase statuses and sorts by numeric order without mutating data', () => {
    const phases = [
        { phaseOrder: '10', phaseName: 'Duy trì', status: 'PENDING' },
        { phaseOrder: '3', phaseName: 'Điều chỉnh', status: 'IN_PROGRESS', description: 'Theo dõi tiến độ', expectedStartDate: '2026-11-17' },
        { phaseOrder: '1', phaseName: 'Khám ban đầu', status: 'COMPLETED' },
        { phaseOrder: '4', phaseName: 'Phương án cũ', status: 'CANCEL' },
        { phaseOrder: '2', phaseName: 'Chuẩn bị', status: 'PENDING' },
        { phaseOrder: '5', phaseName: 'Theo dõi song song', status: 'IN_PROGRESS' },
    ];
    const original = structuredClone(phases);
    const body = buildCareContent('TREATMENT_PROGRESS', patient, { phases });
    const active = body.split('Lộ trình đang thực hiện:')[1].split('Lộ trình đã hoàn thành:')[0];
    assert.match(active, /Lộ trình 3: Điều chỉnh/);
    assert.match(active, /Lộ trình 5: Theo dõi song song/);
    assert.match(active, /Nội dung: Theo dõi tiến độ/);
    assert.match(active, /Thời gian dự kiến: 17\/11\/2026 - /);
    const completed = body.split('Lộ trình đã hoàn thành:')[1].split('Lộ trình chưa hoàn thành')[0];
    assert.match(completed, /Lộ trình 1: Khám ban đầu/);
    const pending = body.split('Lộ trình chưa hoàn thành (chờ thực hiện):')[1].split('Lộ trình đã hủy:')[0];
    assert.ok(pending.indexOf('Lộ trình 2:') < pending.indexOf('Lộ trình 10:'));
    assert.doesNotMatch(pending, /Phương án cũ|Điều chỉnh|Khám ban đầu/);
    assert.match(body, /Lộ trình đã hủy:\n• Lộ trình 4: Phương án cũ/);
    assert.deepEqual(phases, original);
});

test('missing phase status is not guessed from phase order or dates', () => {
    const body = buildCareContent('TREATMENT_PROGRESS', patient, {
        phases: [{ phaseOrder: '1', phaseName: 'Chưa xác định', expectedStartDate: '2020-01-01' }],
    });
    assert.doesNotMatch(body, /Lộ trình 1: Chưa xác định/);
    assert.doesNotMatch(buildCareContent('TREATMENT_PROGRESS', patient, {}), /undefined|null|NaN/);
});
