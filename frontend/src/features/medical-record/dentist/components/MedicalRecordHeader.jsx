import {
  ChevronLeft,
  Stethoscope,
  Printer,
  Save,
  RefreshCw,
  Building2,
  GitBranch,
  MapPin,
  Phone,
  Search,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PatientSearchBar from '../../../../components/ui/search/PatientSearchBar';

export default function MedicalRecordHeader({
  patientName,
  patientCode,
  medicalRecordData,
  loadingMedicalRecord = false,

  saving,
  onSave,
  onBack,
  onNavigateTreatment,
  navigatingExam = false,
  phoneSearchQuery = '',
  setPhoneSearchQuery,
  onSearchPhone,
  searchingPhone = false,
  hasPatientData = true,
  patientOptions = [],
  loadingPatientOptions = false,
  selectedPatientId = '',
  onSelectPatient,
  onClearPatient,
}) {
  const clinicName = medicalRecordData?.dentalClinicName || (loadingMedicalRecord ? 'Đang tải nha khoa...' : 'Chưa có thông tin nha khoa');
  const clinicAddress =
    medicalRecordData?.branchAddress || 'Chưa có địa chỉ chi nhánh';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Top Clinic Info & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-gradient-to-r from-teal-50/60 via-white to-teal-50/30 border-b border-slate-200/80">
        {/* Clinic details share a fixed icon column and aligned text column. */}
        <div className="grid min-w-0 flex-1 grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-200 bg-teal-100 text-teal-800">
            <Building2 size={16} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <h2 className="min-w-0 self-center break-words text-base font-extrabold uppercase leading-snug tracking-wide text-teal-900 sm:text-lg">
            {clinicName}
          </h2>

          {medicalRecordData?.branchName && (
            <>
              <span className="flex h-5 w-7 items-center justify-center text-teal-600">
                <GitBranch size={14} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <p className="min-w-0 break-words text-xs font-semibold leading-5 text-teal-800">
                {medicalRecordData.branchName}
              </p>
            </>
          )}

          <span className="flex h-5 w-7 items-center justify-center text-rose-500">
            <MapPin size={14} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <p className="min-w-0 break-words text-xs font-medium leading-5 text-slate-500">
            {clinicAddress}
          </p>
        </div>
        {/* Right: Action Buttons (In, Lưu, Khám & Điều trị) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 lg:shrink-0">
          <button
            type="button"
            disabled={!hasPatientData}
            onClick={() => toast.success('Đã gửi yêu cầu in hồ sơ bệnh án!')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
          >
            <Printer size={15} className="text-slate-500" />
            <span>In hồ sơ</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || loadingMedicalRecord || !hasPatientData}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
          </button>

          {onNavigateTreatment && (
            <button
              type="button"
              disabled={!hasPatientData || loadingMedicalRecord || navigatingExam}
              onClick={onNavigateTreatment}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Chuyển sang khám bệnh và chẩn đoán điều trị"
            >
              {navigatingExam ? <RefreshCw size={15} className="animate-spin" /> : <Stethoscope size={15} />}
              <span>{navigatingExam ? 'Đang vào khám...' : 'Khám & Điều trị →'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Bar: Patient Selectbox + Phone Search (Left) + Patient & Record Info (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-t border-slate-200/60 text-xs">
        {/* Left: Quick Selectbox & Phone Search Bar dùng chung component PatientSearchBar */}
        <PatientSearchBar
          patientOptions={patientOptions}
          loadingPatientOptions={loadingPatientOptions}
          selectedPatientId={selectedPatientId}
          onSelectPatient={onSelectPatient}
          onClearPatient={onClearPatient}
          phoneSearchQuery={phoneSearchQuery}
          setPhoneSearchQuery={setPhoneSearchQuery}
          onSearchPhone={onSearchPhone}
          searchingPhone={searchingPhone}
          hasPatient={hasPatientData}
          showBorder={false}
          hideLabels={true}
          className="p-0 bg-transparent w-full xl:w-auto"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Mã hồ sơ:</span>
            <span className="font-extrabold text-teal-800">
              {medicalRecordData?.medicalRecordCode || 'Chưa cấp mã'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Bệnh nhân:</span>
            {hasPatientData && patientName ? (
              <span className="font-extrabold text-slate-900">{patientName}</span>
            ) : (
              <span className="font-medium text-slate-400 italic">Chưa chọn hồ sơ</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Mã BN:</span>
            {hasPatientData && patientCode ? (
              <span className="font-extrabold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                {patientCode}
              </span>
            ) : (
              <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ---
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
