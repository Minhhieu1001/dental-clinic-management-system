
// map dữ liệu từ CreateInvoiceModal sang InvoiceDetailModal
export const convertTreatmentPlanToInvoice = (patientInfo, treatmentPlan) => {
    if (!patientInfo || !treatmentPlan) {
        return null;
    }

    const rawServices = Array.isArray(treatmentPlan.invoiceServices)
        ? treatmentPlan.invoiceServices
        : Array.isArray(treatmentPlan.services)
            ? treatmentPlan.services
            : Array.isArray(treatmentPlan.phases)
                ? treatmentPlan.phases.flatMap((p) => p.services || [])
                : [];

    const services = rawServices.map((service, index) => {
        const uPrice = Number(service.unitPrice ?? service.price ?? 0);
        const qty = Number(service.quantity ?? 1);
        const tot = Number(service.totalAmount ?? service.total ?? (uPrice * qty));

        return {
            stt: service.stt ?? index + 1,
            treatmentServiceId: service.treatmentServiceId ?? null,
            serviceId: service.serviceId ?? service.id ?? null,
            name: service.serviceName ?? service.name ?? '',
            price: uPrice,
            quantity: qty,
            total: tot,
            toothNumber: service.toothNumber ?? '',
            phaseId: service.phaseId ?? null,
            phaseName: service.phaseName ?? '',
            phaseOrder: service.phaseOrder ?? '',
        };
    });

    const cost = Number(treatmentPlan.estimatedCost ?? treatmentPlan.totalAmount ?? 0);

    return {
        id: `DRAFT-${Date.now()}`,
        rawId: null,

        patientId: patientInfo.id ?? patientInfo.patientId ?? null,
        patientCode: patientInfo.patientCode ?? '',
        patientName: patientInfo.fullName ?? patientInfo.patientName ?? patientInfo.name ?? '',
        patientPhone: patientInfo.phone ?? patientInfo.phoneNumber ?? '',
        patientAddress: patientInfo.address ?? patientInfo.residenceAddress ?? '',

        employeeId: null,
        employeeName: "Chưa tạo",
        treatmentPlanId: treatmentPlan.treatmentPlanId ?? treatmentPlan.id ?? null,
        treatmentPlanName: treatmentPlan.planName ?? null,

        date: "Chưa lập hóa đơn",
        rawDate: "Chưa lập hóa đơn",

        totalAmount: cost,
        discountAmount: 0,
        paidAmount: 0,
        debtAmount: cost,

        status: "Chưa thanh toán",

        services,
        paymentHistory: [],

        isDraft: true,
        isSave: false,
    };
};


// map dữ liệu từ employeeBill sang InvoiceDetailModal
export const mapBackendInvoiceToUi = (inv) => {
    if (!inv) return null;

    const invoiceDateObj = inv.invoiceDate ? new Date(inv.invoiceDate) : (inv.createdAt ? new Date(inv.createdAt) : null);
    const formattedDate = invoiceDateObj && !isNaN(invoiceDateObj.getTime())
        ? `${String(invoiceDateObj.getDate()).padStart(2, '0')}/${String(invoiceDateObj.getMonth() + 1).padStart(2, '0')}/${invoiceDateObj.getFullYear()}`
        : (inv.date || '');

    let uiStatus = 'Chưa thanh toán';
    if (inv.paymentStatus === 'PAID' || inv.status === 'PAID' || inv.status === 'Đã thanh toán') {
        uiStatus = 'Đã thanh toán';
    } else if (inv.paymentStatus === 'PARTIALLY_PAID' || inv.paymentStatus === 'PARTIAL' || inv.status === 'PARTIAL' || inv.status === 'Thanh toán một phần') {
        uiStatus = 'Thanh toán một phần';
    }

    const services = Array.isArray(inv.invoiceDetails)
        ? inv.invoiceDetails.map((d, idx) => ({
            stt: idx + 1,
            treatmentServiceId: d.treatmentServiceId || null,
            name: d.itemName || d.serviceName || 'Dịch vụ nha khoa',
            price: Number(d.unitPrice || 0),
            quantity: d.quantity || 1,
            total: Number(d.subtotal || (d.unitPrice * d.quantity) || 0),
            phaseId: d.phaseId || null,
            phaseName: d.phaseName || '',
            phaseOrder: d.phaseOrder || '',
        }))
        : (inv.services || []);

    const servicesSum = services.reduce((sum, item) => sum + item.total, 0);
    const grossTotal = Number(inv.totalAmount ?? (servicesSum > 0 ? servicesSum : inv.finalAmount ?? 0));
    const discount = Number(inv.discountAmount || 0);
    const finalTotal = Number(inv.finalAmount ?? Math.max(0, grossTotal - discount));
    const paid = Number(inv.paidAmount || 0);
    const debt = Number(inv.remainingAmount ?? Math.max(0, finalTotal - paid));

    return {
        id: inv.invoiceCode || inv.id || `HD-${Date.now()}`,
        rawId: inv.id,
        date: formattedDate,
        rawDate: inv.invoiceDate || inv.createdAt || inv.date,
        patientId: inv.patientId || '',
        patientCode: inv.patientCode || inv.patientProfileCode || inv.patientId || '',
        patientName: inv.patientName || 'Khách hàng',
        isSave: Boolean(inv.isSave),
        employeeName: inv.employeeName,
        employeeId: inv.employeeId,
        patientPhone: inv.patientPhone || '',
        patientCccd: inv.patientCccd || '',
        totalAmount: grossTotal,
        finalAmount: finalTotal,
        paidAmount: paid,
        debtAmount: Math.max(0, debt),
        status: uiStatus,
        promotionId: inv.promotionId || null,
        couponCode: inv.couponCode || '',
        promotionTitle: inv.promotionTitle || '',
        appliedVoucher: inv.couponCode || '',
        discountAmount: discount,
        services,
    };
};
