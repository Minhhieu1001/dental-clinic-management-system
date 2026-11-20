import React, { useState } from 'react';
import {
    Activity,
    Layers,
    Pill,
    Image,
    Maximize2,
    Minimize2,
    Printer,
    X,
} from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';

import Loading from '../../../../components/ui/Loading';
import PatientInfoSidebar from './tabs/PatientInfoSidebar';
import ClinicalHistoryTab from './tabs/ClinicalHistoryTab';
import TreatmentPlanTab from './tabs/TreatmentPlanTab';
import PrescriptionTab from './tabs/PrescriptionTab';
import DentalImagesTab from './tabs/DentalImagesTab';
import PrintMedicalRecordModal from './PrintMedicalRecordModal';
import { formatDateDisplay } from './medicalRecordDictionaries';

export default function MedicalRecordDetailModal({
    open,
    onClose,
    selectedRecord,
    detailExams = [],
    detailPlans = [],
    detailPrescriptions = [],
    loadingDetail = false,
}) {
    const [activeTab, setActiveTab] = useState('clinical_history'); // 'clinical_history' | 'treatment_plan' | 'prescriptions' | 'images'
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [showPrintModal, setShowPrintModal] = useState(false);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isFullscreen}
            maxWidth="xl"
            fullWidth
            scroll="paper"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isFullscreen ? 0 : '4px',
                        maxHeight: isFullscreen ? '100vh' : '92vh',
                        height: isFullscreen ? '100vh' : '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                },
            }}
        >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white border-b border-teal-900 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner">
                        {selectedRecord?.patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-black tracking-tight">{selectedRecord?.patientName}</h2>
                            <span className="bg-teal-900/80 text-teal-200 border border-teal-600/50 text-[11px] font-bold px-2 py-0.5 rounded-sm">
                                Mã BN: {selectedRecord?.patientCode}
                            </span>
                            <span className="bg-white/15 text-white border border-white/30 text-[11px] font-bold px-2 py-0.5 rounded-sm">
                                Hồ sơ: {selectedRecord?.recordCode}
                            </span>
                        </div>
                        <p className="text-xs text-teal-100/80 font-medium mt-0.5 flex items-center gap-2">
                            <span>BS phụ trách: <strong>{selectedRecord?.dentistName}</strong></span>
                            <span>•</span>
                            <span>Ngày tạo: {formatDateDisplay(selectedRecord?.createdAt)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-sm bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button
                        onClick={() => setShowPrintModal(true)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                        title="In hồ sơ bệnh án"
                    >
                        <Printer size={14} />
                        <span>In hồ sơ</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-sm bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-1"
                        title="Đóng cửa sổ"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Modal Main Body (2 Columns Split Layout) */}
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 h-full overflow-hidden bg-slate-50">
                    {/* ================= COLUMN LEFT: THÔNG TIN CHI TIẾT HỒ SƠ BỆNH ÁN (35%) ================= */}
                    <PatientInfoSidebar selectedRecord={selectedRecord} />

                    {/* ================= COLUMN RIGHT: 4 TABS (65%) ================= */}
                    <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full overflow-hidden bg-white">
                        {/* Tab Navigation Bar */}
                        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 bg-slate-100/70 shrink-0 overflow-x-auto">
                            {/* TAB 1: Lịch sử khám & Chẩn đoán */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('clinical_history')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === 'clinical_history'
                                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-sm'
                                    : 'border-transparent text-slate-600 hover:text-teal-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Activity size={15} />
                                <span>1. Lịch sử khám & Triệu chứng răng</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] bg-slate-200 text-slate-700 font-semibold">
                                    {detailExams.length}
                                </span>
                            </button>

                            {/* TAB 2: Kế hoạch điều trị */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('treatment_plan')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === 'treatment_plan'
                                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-sm'
                                    : 'border-transparent text-slate-600 hover:text-teal-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Layers size={15} />
                                <span>2. Kế hoạch điều trị (Đợt & Buổi)</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] bg-slate-200 text-slate-700 font-semibold">
                                    {detailPlans.length}
                                </span>
                            </button>

                            {/* TAB 3: Đơn thuốc */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('prescriptions')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === 'prescriptions'
                                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-sm'
                                    : 'border-transparent text-slate-600 hover:text-teal-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Pill size={15} />
                                <span>3. Đơn thuốc</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] bg-slate-200 text-slate-700 font-semibold">
                                    {detailPrescriptions.length}
                                </span>
                            </button>

                            {/* TAB 4: Danh mục hình ảnh */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('images')}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === 'images'
                                    ? 'border-teal-700 text-teal-800 bg-white shadow-2xs rounded-t-sm'
                                    : 'border-transparent text-slate-600 hover:text-teal-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Image size={15} />
                                <span>4. Danh mục hình ảnh (X-Quang)</span>
                            </button>
                        </div>

                        {/* Tab Content Body */}
                        <div className="flex-1 p-4 overflow-y-auto relative bg-slate-50/50">
                            {loadingDetail ? (
                                <Loading
                                    overlay={true}
                                    title="Đang tải dữ liệu chi tiết hồ sơ..."
                                    subtitle="Truy xuất lịch sử khám, phác đồ điều trị và đơn thuốc"
                                    size="md"
                                />
                            ) : null}

                            {/* TAB 1 */}
                            {activeTab === 'clinical_history' && (
                                <ClinicalHistoryTab detailExams={detailExams} selectedRecord={selectedRecord} />
                            )}

                            {/* TAB 2 */}
                            {activeTab === 'treatment_plan' && (
                                <TreatmentPlanTab detailPlans={detailPlans} selectedRecord={selectedRecord} />
                            )}

                            {/* TAB 3 */}
                            {activeTab === 'prescriptions' && (
                                <PrescriptionTab detailPrescriptions={detailPrescriptions} selectedRecord={selectedRecord} />
                            )}

                            {/* TAB 4 */}
                            {activeTab === 'images' && (
                                <DentalImagesTab />
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

            {/* Print Medical Record Booklet Modal */}
            <PrintMedicalRecordModal
                open={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                selectedRecord={selectedRecord}
                detailExams={detailExams}
                detailPlans={detailPlans}
                detailPrescriptions={detailPrescriptions}
            />
        </Dialog>
    );
}
