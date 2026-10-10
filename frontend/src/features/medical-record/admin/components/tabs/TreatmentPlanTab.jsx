import React from 'react';
import {
    Layers,
    ClipboardList,
    CalendarCheck,
} from 'lucide-react';
import {
    formatDateDisplay,
    formatVND,
    getPhaseStatusInfo,
    getVisitStatusInfo,
} from '../medicalRecordDictionaries';

export default function TreatmentPlanTab({ detailPlans = [], selectedRecord }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Layers size={16} className="text-teal-700" />
                    Kế hoạch điều trị & Phác đồ phân theo từng giai đoạn
                </h4>
                <span className="text-xs font-medium text-slate-500">
                    Tổng số kế hoạch: <strong>{detailPlans.length}</strong>
                </span>
            </div>

            {detailPlans.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-sm border border-dashed border-slate-300 space-y-2">
                    <Layers size={36} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">Chưa lập kế hoạch điều trị</p>
                    <p className="text-xs text-slate-400">
                        Bệnh nhân này chưa có phác đồ điều trị hoặc chưa được phân kỳ các buổi điều trị.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {detailPlans.map((plan, pIdx) => {
                        const phases = plan.phases || [];

                        return (
                            <div
                                key={plan.id || pIdx}
                                className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-2xs space-y-0"
                            >
                                {/* 1. Header Kế hoạch điều trị */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50 border-b border-slate-200">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-teal-700 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                                                Kế hoạch {pIdx + 1}
                                            </span>
                                            <h5 className="font-bold text-sm text-slate-900">
                                                {plan.planName || 'Kế hoạch điều trị nha khoa'}
                                            </h5>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            Ngày bắt đầu: <strong>{formatDateDisplay(plan.startDate || plan.createdAt)}</strong> • Bác sĩ phụ trách:{' '}
                                            <strong className="text-teal-800">{plan.dentistName || selectedRecord?.dentistName || 'BS. Nha khoa'}</strong>
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[11px] text-slate-400 font-medium block">Tổng chi phí dự kiến</span>
                                        <strong className="text-base font-bold text-teal-800">
                                            {formatVND(plan.estimatedCost || plan.totalCost || 0)}
                                        </strong>
                                    </div>
                                </div>

                                {/* Description nếu có */}
                                {plan.description && (
                                    <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-200 text-xs text-slate-600 italic">
                                        Ghi chú kế hoạch: {plan.description}
                                    </div>
                                )}

                                {/* 2. Danh sách từng giai đoạn (Phase) */}
                                <div className="p-3.5 space-y-4">
                                    {phases.length > 0 ? (
                                        phases.map((phase, phIdx) => {
                                            const visits = phase.treatmentVisits || phase.visits || [];
                                            const services = phase.treatmentServices || phase.services || [];
                                            const phaseStatus = getPhaseStatusInfo(phase.status);

                                            // Tổng tiền giai đoạn
                                            const phaseTotal = services.reduce(
                                                (sum, s) => sum + Number(s.totalAmount || (Number(s.price || s.unitPrice || 0) * Number(s.quantity || 1))),
                                                0
                                            );

                                            return (
                                                <div
                                                    key={phase.id || phIdx}
                                                    className="rounded-sm border border-slate-200 overflow-hidden bg-white shadow-2xs space-y-0"
                                                >
                                                    {/* Header Giai đoạn */}
                                                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-xs flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-5 w-5 rounded-full bg-teal-700 text-white font-bold text-[10px] items-center justify-center">
                                                                {phIdx + 1}
                                                            </span>
                                                            <h6 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                                                                {phase.phaseName || `Giai đoạn ${phIdx + 1}`}
                                                            </h6>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {phase.estimatedDuration && (
                                                                <span className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded-sm border border-slate-200 font-medium">
                                                                    Thời lượng: {phase.estimatedDuration}
                                                                </span>
                                                            )}
                                                            {(phase.expectedStartDate || phase.expectedEndDate) && (
                                                                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200 font-medium">
                                                                    Dự kiến: {formatDateDisplay(phase.expectedStartDate)} ➔ {formatDateDisplay(phase.expectedEndDate)}
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold border ${phaseStatus.badge}`}>
                                                                {phaseStatus.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {phase.description && (
                                                        <div className="px-3.5 py-1.5 bg-slate-50/70 border-b border-slate-200 text-xs text-slate-600 italic">
                                                            Chỉ định giai đoạn: {phase.description}
                                                        </div>
                                                    )}

                                                    <div className="p-3 space-y-3.5">
                                                        {/* BẢNG 1 CỦA GIAI ĐOẠN: BẢNG DỊCH VỤ KỸ THUẬT */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                                                    <ClipboardList size={13} className="text-teal-700" />
                                                                    Bảng danh mục dịch vụ kỹ thuật ({services.length} dịch vụ)
                                                                </span>
                                                            </div>

                                                            <div className="overflow-x-auto rounded-sm border border-slate-200">
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-10 text-center">STT</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200">Tên dịch vụ kỹ thuật</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-24 text-center">Vị trí răng</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-16 text-center">Số lượng</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-28 text-right">Đơn giá</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-32 text-right">Thành tiền</th>
                                                                            <th className="py-1.5 px-2.5 min-w-28">Ghi chú</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {services.length > 0 ? (
                                                                            services.map((srv, sIdx) => {
                                                                                const itemTotal = Number(srv.totalAmount || (Number(srv.price || srv.unitPrice || 0) * Number(srv.quantity || 1)));
                                                                                const toothDisplay = srv.toothNumber ? `Răng ${srv.toothNumber}` : 'Toàn hàm';

                                                                                return (
                                                                                    <tr key={srv.id || sIdx} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-slate-500">
                                                                                            {sIdx + 1}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                                                                                            {srv.serviceName || srv.name || 'Dịch vụ nha khoa'}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium text-teal-900">
                                                                                            {toothDisplay}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-medium">
                                                                                            {srv.quantity || 1}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-right text-slate-700">
                                                                                            {formatVND(srv.price || srv.unitPrice || 0)}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-right font-bold text-slate-900">
                                                                                            {formatVND(itemTotal)}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                                                                                            {srv.notes || '-'}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={7} className="py-2.5 px-2 text-center text-slate-400 italic">
                                                                                    Chưa gán dịch vụ cụ thể cho giai đoạn này.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                    {phaseTotal > 0 && (
                                                                        <tfoot>
                                                                            <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                                                                                <td colSpan={5} className="py-1.5 px-2.5 text-right uppercase text-[11px] text-slate-600">
                                                                                    Tổng cộng giai đoạn:
                                                                                </td>
                                                                                <td className="py-1.5 px-2.5 text-right font-bold text-teal-800">
                                                                                    {formatVND(phaseTotal)}
                                                                                </td>
                                                                                <td className="border-l border-slate-200"></td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    )}
                                                                </table>
                                                            </div>
                                                        </div>

                                                        {/* BẢNG 2 CỦA GIAI ĐOẠN: BẢNG CÁC BUỔI ĐIỀU TRỊ */}
                                                        <div className="space-y-1.5 pt-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                                                    <CalendarCheck size={13} className="text-teal-700" />
                                                                    Bảng các buổi điều trị ({visits.length} buổi)
                                                                </span>
                                                            </div>

                                                            <div className="overflow-x-auto rounded-sm border border-slate-200">
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-28">Buổi điều trị</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-28">Ngày hẹn</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-36">Bác sĩ thực hiện</th>
                                                                            <th className="py-1.5 px-2.5 border-r border-slate-200 w-28 text-center">Trạng thái</th>
                                                                            <th className="py-1.5 px-2.5 min-w-36">Nội dung thủ thuật / Diễn tiến</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {visits.length > 0 ? (
                                                                            visits.map((vis, vIdx) => {
                                                                                const vStatus = getVisitStatusInfo(vis.status);
                                                                                const vDate = vis.startDate || vis.appointmentDate || vis.visitDate;

                                                                                return (
                                                                                    <tr key={vis.id || vis.visitId || vIdx} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">
                                                                                            {vis.visitName || `Buổi ${vIdx + 1}`}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                                                                                            {formatDateDisplay(vDate)}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-900">
                                                                                            {vis.assignedDentist || plan.dentistName || selectedRecord?.dentistName || 'Chưa phân công'}
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                                                                                            <span className={`inline-block px-2 py-0.5 rounded-sm text-[10.5px] border ${vStatus.badge}`}>
                                                                                                {vStatus.label}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                                                                                            {vis.clinicalNotes || vis.description || vis.notes || 'Thực hiện theo chỉ định phác đồ'}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={5} className="py-2.5 px-2 text-center text-slate-400 italic">
                                                                                    Chưa thiết lập lịch buổi điều trị nào cho giai đoạn này.
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
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-4">Chưa chia giai đoạn chi tiết cho kế hoạch này.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
