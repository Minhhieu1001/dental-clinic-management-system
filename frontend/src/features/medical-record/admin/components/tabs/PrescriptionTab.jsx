import React from 'react';
import { Pill } from 'lucide-react';
import { formatDateDisplay } from '../medicalRecordDictionaries';

export default function PrescriptionTab({ detailPrescriptions = [], selectedRecord }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Pill size={16} className="text-teal-700" />
                    Danh sách các đơn thuốc đã kê
                </h4>
                <span className="text-xs font-medium text-slate-500">
                    Tổng cộng: <strong>{detailPrescriptions.length}</strong> đơn thuốc
                </span>
            </div>

            {detailPrescriptions.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-sm border border-dashed border-slate-300 space-y-2">
                    <Pill size={36} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">Chưa có đơn thuốc nào</p>
                    <p className="text-xs text-slate-400">
                        Bệnh nhân này chưa được kê đơn thuốc nào trong các đợt khám và điều trị.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {detailPrescriptions.map((pres, prIdx) => {
                        const items = pres.items || pres.medications || pres.prescriptionDetails || [];

                        // Lấy tên đơn thuốc hiển thị thay vì hiện ID
                        const prescriptionName =
                            pres.prescriptionName ||
                            pres.name ||
                            pres.title ||
                            (pres.diagnosis ? `Đơn thuốc điều trị: ${pres.diagnosis}` : `Đơn thuốc ngày ${formatDateDisplay(pres.prescriptionDate || pres.createdAt)}`);

                        return (
                            <div
                                key={pres.id || prIdx}
                                className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs space-y-3"
                            >
                                {/* Prescription Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-purple-100 text-purple-800 font-bold text-xs shrink-0">
                                            Rx
                                        </span>
                                        <div className="min-w-0">
                                            <h5 className="font-bold text-sm text-slate-900 truncate">
                                                {prescriptionName}
                                            </h5>
                                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                Bác sĩ: <strong className="text-purple-800">{pres.dentistName || selectedRecord?.dentistName || 'BS. Nha khoa'}</strong> • Ngày kê: {formatDateDisplay(pres.prescriptionDate || pres.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="inline-block px-2.5 py-0.5 rounded-sm text-[11px] sm:text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 self-start sm:self-auto shrink-0">
                                        {pres.prescriptionCode}
                                    </span>
                                </div>

                                {/* Diagnosis of prescription if available */}
                                {pres.diagnosis && !pres.prescriptionName && (
                                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-sm border border-slate-200">
                                        <strong>Chẩn đoán bệnh:</strong> {pres.diagnosis}
                                    </p>
                                )}

                                {/* Medicine List Table */}
                                <div className="overflow-x-auto rounded-sm border border-slate-200 no-scrollbar sm:custom-scrollbar">
                                    <table className="w-full min-w-[540px] text-xs text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                            <tr>
                                                <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">STT</th>
                                                <th className="py-2 px-2.5 border-r border-slate-200">Tên thuốc / Biệt dược</th>
                                                <th className="py-2 px-2.5 border-r border-slate-200 w-20 text-center">Số lượng</th>
                                                <th className="py-2 px-2.5 border-r border-slate-200 w-20 text-center">Đơn vị</th>
                                                <th className="py-2 px-2.5">Liều lượng & Cách dùng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-3 text-center text-slate-400 italic">
                                                        Không có chi tiết danh mục thuốc.
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map((med, mIdx) => (
                                                    <tr key={mIdx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-slate-500">{mIdx + 1}</td>
                                                        <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                                                            {med.medicineName || med.name || med.medicine?.name}
                                                        </td>
                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold text-teal-800">{med.quantity}</td>
                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-700">
                                                            {med.unit || med.medicine?.unit || 'Viên'}
                                                        </td>
                                                        <td className="py-2 px-2.5 text-slate-700">
                                                            {med.dosage || med.usage || med.instructions || 'Uống theo chỉ định của bác sĩ'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Advice notes */}
                                {pres.advice && (
                                    <div className="p-2.5 rounded-sm bg-amber-50/50 border border-amber-200 text-xs text-amber-900">
                                        <strong>Lời dặn của bác sĩ:</strong> {pres.advice}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
