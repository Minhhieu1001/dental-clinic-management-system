

export const isAdviceEmpty = (html) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped.length === 0;
};


export const formatPrescriptionDate = (dateStr) => {
    if (!dateStr) return 'Chưa có';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};


export const mapPrescriptionsWithBranch = async (rawList) => {
    const list = Array.isArray(rawList) ? rawList : (rawList?.data || rawList?.result || []);
    if (!list.length) return [];

    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-emerald-100 text-emerald-600',
        'bg-amber-100 text-amber-600',
        'bg-purple-100 text-purple-600',
    ];

    // 2. Chuyển đổi từng phần tử đơn thuốc
    return list.map((item, idx) => {
        const dateFormatted = formatPrescriptionDate(item.prescriptionDate);

        const details = Array.isArray(item.prescriptionDetails) ? item.prescriptionDetails : [];
        const medicines = details.map((m, mIdx) => ({
            stt: mIdx + 1,
            name: m.medicineName || m.name || `Thuốc ${mIdx + 1}`,
            medicineCode: m.medicineCode || '',
            dosage: m.dosage && m.dosage.trim() ? m.dosage : '-',
            quantity: m.quantity != null ? m.quantity : 1,
            unit: m.unit || 'Viên',
            unitPrice: Number(m.unitPrice || 0),
            totalPrice: Number(m.totalPrice || 0),
        }));

        const rawDoctor = item.prescriber || item.dentistName || item.doctorName || 'Bác sĩ điều trị';
        const displayDoctor = rawDoctor.startsWith('BS.') ? rawDoctor : `BS. ${rawDoctor}`;

        return {
            id: String(item.id || `rx-${idx}`),
            dentistId: item.dentistId || '',
            prescriptionCode: item.prescriptionCode || `DT-${String(idx + 1).padStart(4, '0')}`,
            title: item.prescriptionName || (item.prescriptionCode ? `Đơn thuốc ${item.prescriptionCode}` : `Đơn thuốc #${idx + 1}`),
            doctor: displayDoctor,
            patientName: item.patientName || '',
            patientCode: item.patientCode || '',
            date: dateFormatted,
            iconBg: colors[idx % colors.length],
            totalAmount: Number(item.totalAmount || 0),
            doctorAdvice: item.doctorAdvice || '',
            branchName: item.branchName || '',
            branchAddress: item.branchAddress || '',
            dentalClinicName: item.dentalClinicName || '',
            clinicLogoUrl: item.clinicLogoUrl || '',
            branchImage: item.branchImage || '',
            medicines,
            raw: item,
        };
    });
};
