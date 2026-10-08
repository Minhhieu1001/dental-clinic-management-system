import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  ChevronLeft,
  Phone,
  FileText,
  Sparkles,
  Activity,
  Save,
  RefreshCw,
  Layers,
  Search,
  UserSearch,
  RotateCcw,
  X,
  Users,
  Lock,
} from 'lucide-react';
import { ClinicalExamProvider, useClinicalExam } from './ClinicalExamContext';
import ClinicalExamTab from './components/ClinicalExamTab';
import AiAnalysisTab from './components/AiAnalysisTab';
import DoctorDiagnosisTab from './components/DoctorDiagnosisTab';
import NoTreatmentSessionsEmptyState from './components/NoTreatmentSessionsEmptyState';
import CreateTreatmentSessionModal from './action/CreateTreatmentSessionModal';
import MultiplePatientsModal from '../../components/common/MultiplePatientsModal';
import { ConfirmSaveDiagnosisModal } from './action/ConfirmSaveDiagnosisModal';
import PatientSearchBar from '../../components/ui/search/PatientSearchBar';

function ClinicalExaminationContent() {
  const navigate = useNavigate();
  const {
    patient,
    medicalRecord,
    examReason,
    loadingPatient,
    activeTab,
    setActiveTab,
    examinedTeeth,
    selectedTooth,
    mainDiagnosis,
    treatmentSessions,
    selectedSessionId,
    treatingDoctor,
    isHistoricalSession,
    handleSelectTreatmentSession,
    handleCreateNewTreatmentSession,
    createSessionModalOpen,
    openCreateSessionModal,
    closeCreateSessionModal,
    handleConfirmDiagnosis,
    handleCreateTreatmentPlan,
    confirmSaveModalOpen,
    closeConfirmSaveModal,
    executeSaveDiagnosisAndLock,
    diagnosisList,
    isSavingDiagnosis,
    phoneSearchQuery,
    setPhoneSearchQuery,
    searchingPhone,
    patientOptions,
    loadingPatientOptions,
    foundPatientsList,
    multiplePatientsModalOpen,
    setMultiplePatientsModalOpen,
    handleSearchPatientByPhone,
    handleSelectPatient,
    handleClearPatient,
  } = useClinicalExam();

  const currentSession = treatmentSessions.find(
    (s) => String(s.id) === String(selectedSessionId) || String(s.examinationResultId) === String(selectedSessionId)
  );
  const hasPatient = Boolean(patient && (patient.fullName || patient.patientCode));
  const hasTreatmentSessions = Boolean(treatmentSessions && treatmentSessions.length > 0);

  // Helper date & age calculations
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `${age}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // 3 Tabs Configuration
  const tabs = [
    {
      id: 'clinical',
      label: 'Khám lâm sàng & Sơ đồ răng',
      icon: Activity,
      badge: `${examinedTeeth.length} răng`,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'ai',
      label: 'Phân tích X-quang & AI',
      icon: Sparkles,
      badge: `Răng ${selectedTooth || 46}`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'diagnosis',
      label: 'Chẩn đoán của bác sĩ',
      icon: Stethoscope,
      badge: mainDiagnosis || 'ICD-10',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  ];

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-4 space-y-3 py-2 text-slate-800">
      {/* 1. Header Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Quay lại Hồ sơ Bệnh nhân"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="text-teal-700" size={22} />
              Module Khám Lâm Sàng & Chẩn Đoán AI Nha Khoa
            </h1>
          </div>
        </div>

        {/* Action Buttons: Save & Create Treatment Plan */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPatient || !hasTreatmentSessions || isHistoricalSession}
            onClick={handleConfirmDiagnosis}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${isHistoricalSession
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
              }`}
            title={
              !hasTreatmentSessions
                ? 'Cần khởi tạo đợt điều trị trước khi lưu chẩn đoán'
                : isHistoricalSession
                  ? 'Đợt khám đã hoàn tất và khóa kết quả chẩn đoán vĩnh viễn'
                  : 'Lưu kết luận chẩn đoán và khóa hồ sơ đợt khám'
            }
          >
            {isHistoricalSession ? <Lock size={14} className="text-slate-400" /> : <Save size={14} />}
            <span>{isHistoricalSession ? 'Đã khóa đợt khám' : 'Lưu chẩn đoán'}</span>
          </button>

          <button
            type="button"
            disabled={!hasPatient || !hasTreatmentSessions}
            onClick={handleCreateTreatmentPlan}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={!hasTreatmentSessions ? 'Cần khởi tạo đợt điều trị trước khi tạo kế hoạch' : 'Tạo kế hoạch điều trị'}
          >
            <FileText size={15} />
            <span>Tạo Kế Hoạch Điều Trị &rarr;</span>
          </button>
        </div>
      </div>

      {/* KHỐI TỔNG HỢP: TÌM KIẾM BỆNH NHÂN & THÔNG TIN HỒ SƠ LÂM SÀNG (GỘP CHUNG 1 KHỐI) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Hàng 1: Thanh Tìm Kiếm & Selectbox Theo Số Điện Thoại */}
        <PatientSearchBar
          patientOptions={patientOptions}
          loadingPatientOptions={loadingPatientOptions}
          selectedPatient={patient}
          onSelectPatient={handleSelectPatient}
          onClearPatient={handleClearPatient}
          phoneSearchQuery={phoneSearchQuery}
          setPhoneSearchQuery={setPhoneSearchQuery}
          onSearchPhone={handleSearchPatientByPhone}
          searchingPhone={searchingPhone}
          hasPatient={hasPatient}
          selectLabel="Chọn bệnh nhân:"
          inputLabel="Nhập SĐT"
        />

        {/* Hàng 2: Chi tiết thông tin Bệnh Nhân & Lý do khám (Gộp chung trong cùng 1 khối card) */}
        {hasPatient && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Patient Profile Card (5 cols) */}
            <div className="lg:col-span-5 flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white font-black text-xl shadow-xs shrink-0 border-2 border-teal-100">
                {patient.fullName?.charAt(0) || 'P'}
              </div>
              <div className="space-y-1 text-xs flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                    {patient.fullName || 'Bệnh nhân mới'}
                  </h2>
                  {patient.patientCode && (
                    <span className="text-[11px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                      {patient.patientCode}
                    </span>
                  )}
                </div>

                <p className="text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap">
                  <span>
                    {patient.gender === 'FEMALE' ? '♀ Nữ' : patient.gender === 'MALE' ? '♂ Nam' : 'Khác'}
                  </span>
                  {patient.dateOfBirth && (
                    <>
                      <span>·</span>
                      <span>
                        {calculateAge(patient.dateOfBirth)} tuổi ({formatDateDisplay(patient.dateOfBirth)})
                      </span>
                    </>
                  )}
                </p>

                <p className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Phone size={13} className="text-teal-700 shrink-0" />
                  <span>{patient.phone || 'Chưa cập nhật SĐT'}</span>
                </p>
              </div>
            </div>

            {/* Reason & Main Symptoms (7 cols - ngăn cách bởi border-l) */}
            <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-5 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-400 block text-[10.5px] uppercase tracking-wide">
                  Lý do khám bệnh
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {examReason || 'Khám răng hàm mặt định kỳ'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block text-[10.5px] uppercase tracking-wide">
                  Triệu chứng chính / Tiền sử bệnh lý
                </span>
                <p className="text-slate-700 font-medium mt-0.5">
                  {patient.systemicDisease || patient.allergies
                    ? [
                      patient.systemicDisease ? `Bệnh lý: ${patient.systemicDisease}` : null,
                      patient.allergies ? `Dị ứng: ${patient.allergies}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                    : medicalRecord?.treatmentNotes || 'Chưa ghi nhận triệu chứng bất thường'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Content Area: Empty State nếu chưa chọn bệnh nhân */}
      {!hasPatient ? (
        <div className="rounded-2xl border-2 border-dashed border-teal-200/80 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/50 p-10 sm:p-14 text-center shadow-xs space-y-4 my-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-xs border border-teal-200">
            <UserSearch size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
              Chưa có bệnh nhân nào được chọn
            </h3>

          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dentist/medical-records')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-white px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileText size={14} />
              <span>Xem danh sách Hồ sơ bệnh án &rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <>

          {/* 2.5. Empty state khi chưa có đợt điều trị HOẶC Giao diện khám bệnh đầy đủ */}
          <AnimatePresence mode="wait">
            {!hasTreatmentSessions ? (
              <motion.div
                key="empty-sessions"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <NoTreatmentSessionsEmptyState
                  patient={patient}
                  onOpenCreateSessionModal={openCreateSessionModal}
                  onNavigateToTreatmentPlans={() =>
                    navigate('/dentist/treatment-plans', {
                      state: { patient, phone: patient.phone, patientCode: patient.patientCode },
                    })
                  }
                  onNavigateToMedicalRecords={() =>
                    navigate('/dentist/medical-records', {
                      state: { patient, phone: patient.phone, patientCode: patient.patientCode },
                    })
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="sessions-wrapper"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-3.5"
              >
                {/* 2.5. Thanh Chọn Đợt Điều Trị (Treatment Session Selector) */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-2xs text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Layers className="text-teal-700" size={15} />
                      <span>Chọn đợt điều trị / Lần khám:</span>
                    </div>

                    {/* Dropdown Đợt điều trị (Chỉ hiện đợt và ngày) */}
                    <div className="relative w-full sm:w-[220px] md:w-[250px]">
                      <select
                        value={selectedSessionId || ''}
                        onChange={(e) => handleSelectTreatmentSession(e.target.value)}
                        className="w-full rounded-lg border border-teal-300 bg-teal-50/40 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 cursor-pointer transition-colors truncate"
                      >
                        {treatmentSessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {s.date}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Badge trạng thái đợt */}
                    {currentSession && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isHistoricalSession
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${isHistoricalSession ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                            }`}
                        />
                        {isHistoricalSession
                          ? "Đã chuẩn đoán"
                          : "Chưa chuẩn đoán"}
                      </span>
                    )}
                  </div>

                  {/* Nút Tạo đợt điều trị mới (Mở Modal Form xác nhận) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openCreateSessionModal}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs"
                      title="Khởi tạo một đợt khám / điều trị mới cho bệnh nhân này"
                    >
                      <span>+ Tạo đợt điều trị mới</span>
                    </button>
                  </div>
                </div>

                {/* 3. Modern Compact 3-Tab Examination Navigation Bar (Thu nhỏ chiều cao tab) */}
                <div className="rounded-lg border border-slate-200/90 bg-white p-1 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {tabs.map((tab, idx) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer select-none ${isActive
                            ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                }`}
                            >
                              <Icon size={14} />
                            </span>
                            <span className="truncate text-xs font-bold">
                              <span className="opacity-75 font-medium mr-1">Bước {idx + 1}:</span>
                              {tab.label}
                            </span>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold border transition-colors ${isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : tab.badgeColor
                              }`}
                          >
                            {tab.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Active Tab Content Render với hiệu ứng chuyển đợt và chuyển tab mượt mà */}
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedSessionId}-${activeTab}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      {activeTab === 'clinical' && <ClinicalExamTab />}
                      {activeTab === 'ai' && <AiAnalysisTab />}
                      {activeTab === 'diagnosis' && <DoctorDiagnosisTab />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Modal chọn bệnh nhân khi có nhiều hồ sơ cùng số điện thoại (COMMON COMPONENT) */}
      <MultiplePatientsModal
        isOpen={multiplePatientsModalOpen}
        onClose={() => setMultiplePatientsModalOpen(false)}
        phoneQuery={phoneSearchQuery}
        patientsList={foundPatientsList}
        onSelectPatient={handleSelectPatient}
      />

      {/* Modal xác nhận tạo đợt điều trị mới để tránh tạo trùng lặp */}
      <CreateTreatmentSessionModal
        isOpen={createSessionModalOpen}
        onClose={closeCreateSessionModal}
        onConfirm={handleCreateNewTreatmentSession}
        patient={patient}
        currentDoctor={treatingDoctor}
        initialReason={examReason || patient?.symptoms}
        existingSessionsCount={treatmentSessions?.length || 0}
      />

      {/* Modal xác nhận lưu chẩn đoán & khóa đợt khám hoặc cảnh báo chưa có chẩn đoán */}
      <ConfirmSaveDiagnosisModal
        isOpen={confirmSaveModalOpen}
        onClose={closeConfirmSaveModal}
        onConfirmSave={executeSaveDiagnosisAndLock}
        onNavigateToDiagnosis={() => {
          closeConfirmSaveModal();
          setActiveTab('diagnosis');
        }}
        diagnosisList={diagnosisList}
        isSaving={isSavingDiagnosis}
      />
    </div>
  );
}

export default function ClinicalExamination() {
  return (
    <ClinicalExamProvider>
      <ClinicalExaminationContent />
    </ClinicalExamProvider>
  );
}
