import {
  ChevronLeft,
  Stethoscope,
  Printer,
  Save,
  RefreshCw,
  Building2,
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
  setMedicalRecordData,
  isEditing,
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
  const clinicName = medicalRecordData?.dentalClinicName || 'Nha Khoa Quốc Tế Crown Dental';
  const clinicAddress =
    medicalRecordData?.address || '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh';

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Top Clinic Info & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 bg-gradient-to-r from-teal-50/60 via-white to-teal-50/30 border-b border-slate-200/80">
        {/* Left: Back button & Clinic Details */}
        <div className="flex items-start sm:items-center gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                <Building2 size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-teal-900">
                {clinicName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-1 pl-0.5">
              <MapPin size={13} className="text-rose-500 shrink-0" />
              <span>{clinicAddress}</span>
            </p>
          </div>
        </div>

        {/* Right: Action Buttons (In, Lưu, Khám & Điều trị) */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
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
            disabled={saving || !hasPatientData}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
          </button>

          {onNavigateTreatment && (
            <button
              type="button"
              disabled={!hasPatientData || navigatingExam}
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

      {/* Editable Clinic Details Bar when in Edit Mode */}
      {isEditing && (
        <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>CHỈNH SỬA THÔNG TIN NHA KHOA & HỒ SƠ BỆNH ÁN</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 size={12} className="text-teal-700" /> Tên nha khoa (dentalClinicName)
              </label>
              <input
                type="text"
                value={medicalRecordData?.dentalClinicName || ''}
                onChange={(e) =>
                  setMedicalRecordData &&
                  setMedicalRecordData({ ...medicalRecordData, dentalClinicName: e.target.value })
                }
                placeholder="Nhập tên nha khoa..."
                className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-rose-600" /> Địa chỉ cơ sở nha khoa (address)
              </label>
              <input
                type="text"
                value={medicalRecordData?.address || ''}
                onChange={(e) =>
                  setMedicalRecordData &&
                  setMedicalRecordData({ ...medicalRecordData, address: e.target.value })
                }
                placeholder="Nhập địa chỉ phòng khám..."
                className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText size={12} className="text-teal-700" /> Tên file hồ sơ bệnh án (fileName)
              </label>
              <input
                type="text"
                value={medicalRecordData?.fileName || ''}
                onChange={(e) =>
                  setMedicalRecordData &&
                  setMedicalRecordData({ ...medicalRecordData, fileName: e.target.value })
                }
                placeholder="Nhập tên file hồ sơ bệnh án..."
                className="w-full rounded bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

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
