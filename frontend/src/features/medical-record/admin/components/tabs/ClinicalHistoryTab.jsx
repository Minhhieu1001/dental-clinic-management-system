import React, { useEffect, useState } from 'react';
import {
    Activity,
    Stethoscope,
    ShieldCheck,
    FileText,
    Building2,
    MapPin,
} from 'lucide-react';
import {
    formatDateDisplay,
    CARIES_DEPTH_MAP,
    CARIES_LOCATION_MAP,
    getDiagnosisLevelInfo,
} from '../medicalRecordDictionaries';
import { getToothStatuses } from '../../../../../services/systemDictionary.service';

export default function ClinicalHistoryTab({ detailExams = [], selectedRecord }) {
    const [toothStatuses, setToothStatuses] = useState([]);

    useEffect(() => {
        let isMounted = true;
        getToothStatuses()
            .then((response) => {
                if (isMounted) setToothStatuses(Array.isArray(response?.data) ? response.data : []);
            })
            .catch((error) => console.warn('Không thể tải màu tình trạng răng:', error));

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Activity size={16} className="text-teal-700" />
                    Lịch sử các đợt khám lâm sàng & Ghi nhận triệu chứng răng
                </h4>
                <span className="text-xs font-medium text-slate-500">
                    Tổng cộng: <strong>{detailExams.length}</strong> đợt khám
                </span>
            </div>

            {detailExams.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-sm border border-dashed border-slate-300 space-y-2">
                    <Stethoscope size={36} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">Chưa có dữ liệu đợt khám lâm sàng</p>
                    <p className="text-xs text-slate-400">
                        Bệnh nhân này chưa được lưu kết quả khám lâm sàng hoặc ghi nhận tình trạng răng nào.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {detailExams.map((exam, idx) => {
                        const toothRecords = exam.toothRecords || [];
                        const rawDiagnoses = Array.isArray(exam.diagnoses)
                            ? exam.diagnoses
                            : exam.diagnosis
                                ? [exam.diagnosis]
                                : [];

                        return (
                            <div
                                key={exam.id || idx}
                                className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-2xs space-y-0"
                            >
                                {/* 1. Header đợt khám */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-slate-50 border-b border-slate-200">
                                    <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-6">
                                        <div className="flex shrink-0 items-center gap-2.5">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-teal-700 text-white font-bold text-xs shadow-2xs">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-900">
                                                    Đợt khám: {formatDateDisplay(exam.examinationDate || exam.createdAt)}
                                                </h5>
                                                <p className="text-[11px] font-medium text-slate-500">
                                                    Bác sĩ khám: <strong className="text-teal-800">{exam.dentistName || selectedRecord?.dentistName || 'BS. Nha khoa'}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="min-w-0 space-y-1 border-t border-teal-100 pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                                            <p className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-700">
                                                <Building2 size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                                                <span>Tên cơ sở: <strong className="text-teal-800">{exam.branchName || 'Chưa có thông tin cơ sở'}</strong></span>
                                            </p>
                                            <p className="flex items-start gap-1.5 text-xs text-slate-600">
                                                <MapPin size={14} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                                                <span className="break-words">Địa chỉ: {exam.addressBranch || 'Chưa có thông tin địa chỉ'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <span className="inline-block shrink-0 px-2.5 py-0.5 rounded-sm text-[11px] sm:text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 self-start sm:self-auto">
                                        {exam.status || 'Đã hoàn tất khám'}
                                    </span>
                                </div>

                                <div className="p-3 sm:p-3.5 space-y-3.5">
                                    {/* 2. Ghi tên triệu chứng & Lý do đến khám */}
                                    <div className="p-3 bg-amber-50/60 rounded-sm border border-amber-200/80 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                                            <Activity size={14} className="text-amber-700" />
                                            <span>Triệu chứng & Lý do đến khám của bệnh nhân:</span>
                                        </div>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 pl-4 sm:pl-5">
                                            {exam.chiefComplaint || 'Khám kiểm tra sức khỏe răng miệng định kỳ'}
                                        </p>
                                        {exam.notes && (
                                            <p className="text-xs text-slate-600 pl-4 sm:pl-5 pt-1 border-t border-amber-200/60">
                                                <span className="font-semibold text-slate-700">Lời dặn / Ghi chú lâm sàng: </span>
                                                {exam.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* 3. BẢNG 1: Map hết tất cả thuộc tính của toothRecords */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                                                <ShieldCheck size={14} className="text-teal-700" />
                                                Bảng ghi nhận tình trạng từng răng ({toothRecords.length} vị trí răng)
                                            </span>
                                            <span className="text-[10px] text-slate-400 italic block sm:hidden">
                                                (Cuộn ngang để xem đầy đủ)
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white no-scrollbar sm:custom-scrollbar">
                                            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">STT</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-24 text-center">Răng</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-28">Tình trạng</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-24">Sâu răng</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-28">Vị trí sâu</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-24">Mức độ sâu</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-24">Lung lay</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-32">Nướu quanh răng</th>
                                                        <th className="py-2 px-2.5 min-w-32">Triệu chứng đau</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {toothRecords.length > 0 ? (
                                                        toothRecords.map((t, tIdx) => {
                                                            const toothStatus = t.toothStatus || t.status || t.condition || t.diagnosis || t.symptom || '-';
                                                            const apiStatus = toothStatuses.find((item) => item.label === toothStatus);
                                                            const statusStyle = apiStatus?.color
                                                                ? {
                                                                    backgroundColor: `${apiStatus.color}20`,
                                                                    borderColor: apiStatus.color,
                                                                    color: apiStatus.color,
                                                                }
                                                                : undefined;
                                                            const depthLabel = CARIES_DEPTH_MAP[String(t.cariesDepth || '').toUpperCase()] || t.cariesDepth;
                                                            const locLabel = CARIES_LOCATION_MAP[String(t.cariesLocation || t.surface || '').toUpperCase()] || t.cariesLocation || t.surface;
                                                            const mobilityLabel = t.shake || t.mobility || t.mobilityLevel || '-';
                                                            const cariesLabel = t.hasCaries === true || t.hasCaries === 'true' ? '✓ Có' : 'Không';
                                                            const painLabel = {
                                                                NONE: 'Không',
                                                                STIMULATED: 'Có khi kích thích',
                                                                SPONTANEOUS: 'Đau tự phát',
                                                            }[String(t.painType || '').toUpperCase()] || t.painType || 'Không';
                                                            const toothDisplay = t.toothNumber || t.toothCode ? `Răng ${t.toothNumber || t.toothCode}` : '-';

                                                            return (
                                                                <tr key={t.id || tIdx} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-slate-500">
                                                                        {tIdx + 1}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold text-teal-900 bg-teal-50/30">
                                                                        {toothDisplay}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200">
                                                                        <span
                                                                            className="inline-block px-2 py-0.5 rounded-sm text-[11px] border bg-slate-100 text-slate-700 border-slate-200"
                                                                            style={statusStyle}
                                                                        >
                                                                            {toothStatus}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-700">
                                                                        <span className={cariesLabel === '✓ Có' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                                                                            {cariesLabel}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                                                                        {locLabel || '-'}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-700">
                                                                        {depthLabel || '-'}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                                                                        {mobilityLabel}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                                                                        {t.gingivalCondition || '-'}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                                                                        <span className={painLabel !== 'Không' ? 'text-orange-700 font-semibold' : 'text-slate-600'}>
                                                                            {painLabel}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={9} className="py-3 px-2 text-center text-slate-400 italic">
                                                                Chưa có dữ liệu ghi nhận tình trạng chi tiết từng răng cho đợt khám này.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 4. BẢNG 2: Map bảng chẩn đoán */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                                                <FileText size={14} className="text-indigo-700" />
                                                Bảng chẩn đoán của bác sĩ ({rawDiagnoses.length} chẩn đoán)
                                            </span>
                                            <span className="text-[10px] text-slate-400 italic block sm:hidden">
                                                (Cuộn ngang để xem đầy đủ)
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white no-scrollbar sm:custom-scrollbar">
                                            <table className="w-full min-w-[580px] text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">STT</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200">Tên chẩn đoán</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-28 text-center">Vị trí răng</th>
                                                        <th className="py-2 px-2.5 border-r border-slate-200 w-28 text-center">Mức độ</th>
                                                        <th className="py-2 px-2.5 min-w-36">Ghi chú chẩn đoán</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {rawDiagnoses.length > 0 ? (
                                                        rawDiagnoses.map((diag, dIdx) => {
                                                            const diagObj = typeof diag === 'string' ? { primaryDiagnosis: diag } : diag;
                                                            const code = diagObj.diagnosisCode || diagObj.code || '';
                                                            const diagnosisName = diagObj.primaryDiagnosis || diagObj.name || diagObj.label || diagObj.diagnosis || 'Chẩn đoán nha khoa';
                                                            const levelInfo = getDiagnosisLevelInfo(diagObj.level);
                                                            const tooth = diagObj.toothPosition || diagObj.toothNumber ? `Răng ${diagObj.toothPosition || diagObj.toothNumber}` : 'Toàn hàm';

                                                            return (
                                                                <tr key={diagObj.id || dIdx} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-slate-500">
                                                                        {dIdx + 1}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                                                                        <span className="whitespace-nowrap">{diagnosisName}</span>
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-slate-800">
                                                                        {tooth}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                                                                        {levelInfo ? (
                                                                            <span className={`inline-block px-2 py-0.5 rounded-sm text-[10.5px] font-bold border ${levelInfo.badge}`}>
                                                                                {levelInfo.label}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                                                                        <span className="whitespace-nowrap">{diagObj.diagnosticNotes || diagObj.notes || '-'}</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="py-3 px-2 text-center text-slate-400 italic">
                                                                Chưa ghi nhận mã chẩn đoán lâm sàng cho đợt khám này.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
