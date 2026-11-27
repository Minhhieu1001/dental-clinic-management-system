import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Phone,
  FileText,
  Stethoscope,
  RefreshCw,
  Layers,
  UserSearch,
  ArrowRight,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { ClinicalExamProvider, useClinicalExam } from '../treatment/ClinicalExamContext';
import AiAnalysisTab from '../treatment/components/AiAnalysisTab';
import MultiplePatientsModal from '../../components/common/MultiplePatientsModal';
import PatientSearchBar from '../../components/ui/search/PatientSearchBar';
import XrayAiAnalysisModal from '../treatment/action/XrayAiAnalysisModal';

function XrayAnalysisContent() {
  const navigate = useNavigate();
  const {
    patient,
    medicalRecord,
    examReason,
    treatmentSessions,
    selectedSessionId,
    examinationResultId,
    isHistoricalSession,
    handleSelectTreatmentSession,
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
    loadXrayHistory,
    isLoadingXrayHistory,
    xrayHistory,
  } = useClinicalExam();

  const currentSession = treatmentSessions.find(
    (s) => String(s.id) === String(selectedSessionId) || String(s.examinationResultId) === String(selectedSessionId)
  );
  const hasPatient = Boolean(patient && (patient.fullName || patient.patientCode));
  const hasTreatmentSessions = Boolean(treatmentSessions && treatmentSessions.length > 0);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    const age = new Date().getFullYear() - birthYear;
    return `${age}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="w-full p-1 space-y-3 text-slate-800">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="text-teal-700" size={22} />
            Phân Tích Hình Ảnh X-Quang & Chẩn Đoán AI Nha Khoa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tra cứu bệnh nhân, chọn đợt khám để xem hình ảnh X-quang, kết quả phân tích AI và chạy phân tích lại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPatient && hasTreatmentSessions && (
            <button
              type="button"
              onClick={loadXrayHistory}
              disabled={isLoadingXrayHistory}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isLoadingXrayHistory ? 'animate-spin text-teal-600' : 'text-slate-500'} />
              <span>Làm mới phim ({xrayHistory?.length || 0})</span>
            </button>
          )}

          <button
            type="button"
            disabled={!hasPatient}
            onClick={() =>
              navigate('/dentist/clinical-exam', {
                state: {
                  patient,
                  examinationResultId,
                  medicalRecordId: medicalRecord?.id,
                },
              })
            }
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Stethoscope size={15} />
            <span>Mở Khám Bệnh & Chẩn Đoán &rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Khối Tìm Kiếm Bệnh Nhân & Thông Tin Hồ Sơ Lâm Sàng */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
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
                    {patient.fullName || 'Bệnh nhân'}
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

            {/* Reason & Main Symptoms (7 cols) */}
            <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-5 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-400 block text-[10.5px] uppercase tracking-wide">
                  Lý do khám bệnh
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 min-h-[20px]">
                  {hasTreatmentSessions ? (examReason || '') : ''}
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

      {/* 3. Nội dung chính */}
      {!hasPatient ? (
        <div className="rounded-2xl border-2 border-dashed border-teal-200/80 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/50 p-10 sm:p-14 text-center shadow-xs space-y-4 my-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 shadow-xs border border-teal-200">
            <UserSearch size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
              Chưa có bệnh nhân nào được chọn
            </h3>
            <p className="text-xs text-slate-500">
              Vui lòng chọn bệnh nhân từ danh sách hoặc nhập số điện thoại ở trên để xem phim X-quang theo từng đợt khám và chạy phân tích AI.
            </p>
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
        <AnimatePresence mode="wait">
          {!hasTreatmentSessions ? (
            /* MÀN HÌNH KHI BỆNH NHÂN CHƯA CÓ ĐỢT KHÁM: YÊU CẦU QUAY LẠI MÀN HÌNH KHÁM BỆNH TẠO ĐỢT KHÁM MỚI */
            <motion.div
              key="empty-sessions-redirect"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="rounded-2xl border-2 border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/60 via-white to-slate-50/40 p-8 sm:p-12 text-center shadow-xs space-y-6 my-2"
            >
              <div className="space-y-2.5 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-extrabold text-amber-900 border border-amber-300 shadow-2xs">
                  <Layers size={14} className="text-amber-700" />
                  <span>Chưa có đợt khám / điều trị nào</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Bệnh nhân &quot;{patient.fullName}&quot; chưa có đợt khám nào
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Trang X-quang chỉ dùng để xem và phân tích phim của các đợt khám đã tồn tại. Vui lòng quay lại màn hình <strong>Khám bệnh</strong> để khởi tạo đợt khám mới trước khi tải và phân tích phim X-quang.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    navigate('/dentist/clinical-exam', {
                      state: {
                        patient,
                        phone: patient.phone,
                        patientCode: patient.patientCode,
                      },
                    })
                  }
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-700/25 transition-all cursor-pointer"
                >
                  <Stethoscope size={18} />
                  <span>Quay lại màn hình Khám bệnh để tạo đợt khám mới</span>
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Thẻ hướng dẫn 3 bước */}
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                <div className="rounded-xl border-2 border-teal-500 bg-teal-50/80 p-3.5 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-teal-900 font-extrabold text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white text-[11px] font-bold">
                      1
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-wider bg-teal-200 px-1.5 py-0.5 rounded text-teal-900">
                      Bước 1
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-teal-950 pt-0.5">Màn hình Khám bệnh</div>
                  <p className="text-[11px] text-teal-800/90 leading-tight font-medium">
                    Quay lại mục Khám bệnh và khởi tạo đợt khám mới cho bệnh nhân.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 shadow-2xs space-y-1 opacity-70">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[11px]">
                      2
                    </span>
                    <span>Tải & Phân tích X-quang</span>
                  </div>
                  <div className="font-bold text-xs text-slate-700">Xem & Đọc phim AI</div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Tải phim X-quang theo đợt khám để AI nhận diện và phân tích lại.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 shadow-2xs space-y-1 opacity-70">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[11px]">
                      3
                    </span>
                    <span>Đối soát & Chẩn đoán</span>
                  </div>
                  <div className="font-bold text-xs text-slate-700">Kết luận lâm sàng</div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Đối soát kết quả X-quang với sơ đồ răng và lập phác đồ điều trị.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="xray-sessions-wrapper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-3.5"
            >
              {/* Thanh Chọn Đợt Khám (Chỉ cho phép chọn đợt khám, KHÔNG có nút Tạo đợt điều trị mới) */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Layers className="text-teal-700" size={15} />
                    <span>Chọn đợt khám cần xem X-quang:</span>
                  </div>

                  <div className="relative w-full sm:w-[240px] md:w-[270px]">
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
                      {isHistoricalSession ? 'Đã chẩn đoán' : 'Đang khám'}
                    </span>
                  )}
                </div>

                {/* Thông tin tóm tắt đợt đang chọn thay cho nút Tạo đợt điều trị mới */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {currentSession?.date && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200">
                      <Calendar size={12} className="text-teal-700" />
                      Ngày khám: {currentSession.date}
                    </span>
                  )}

                </div>
              </div>

              {/* Giao diện Xem X-quang & Phân tích AI (y như bên Khám bệnh) */}
              <AiAnalysisTab standaloneMode={true} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modals */}
      <MultiplePatientsModal
        isOpen={multiplePatientsModalOpen}
        onClose={() => setMultiplePatientsModalOpen(false)}
        phoneQuery={phoneSearchQuery}
        patientsList={foundPatientsList}
        onSelectPatient={handleSelectPatient}
      />

      <XrayAiAnalysisModal />
    </div>
  );
}

export default function XrayAnalysis() {
  return (
    <ClinicalExamProvider>
      <XrayAnalysisContent />
    </ClinicalExamProvider>
  );
}
