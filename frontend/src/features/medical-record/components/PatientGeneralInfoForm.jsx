import {
  Phone,
  Mail,
  Calendar,
  HeartPulse,
  Activity,
  AlertTriangle,
  Pill,
  Stethoscope,
  Info,
  Edit2,
} from 'lucide-react';

const COMMON_SYSTEMIC_DISEASES = [
  'Huyết áp cao',
  'Tiểu đường',
  'Bệnh tim mạch',
  'Máu khó đông',
  'Bệnh hen suyễn',
  'Bệnh gan / Thận',
  'Bệnh dạ dày',
  'Khác',
];

export default function PatientGeneralInfoForm({
  patientData,
  setPatientData,
  systemicDiseases,
  handleToggleDisease,
  isEditing,
  onToggleEdit,
}) {
  const calculateAge = (dob) => {
    if (!dob) return '--';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '--';
    return new Date().getFullYear() - birthYear;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="p-5 space-y-4">
      {/* Visual Banner when in Edit Mode */}
      {isEditing && (
        <div className="flex items-center justify-between rounded bg-amber-50 border border-amber-300 px-3.5 py-2 text-xs text-amber-900 font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>ĐANG Ở CHẾ ĐỘ CHỈNH SỬA TỔNG THỂ</span>
          </div>
          <span className="text-[11px] font-medium text-amber-700">
            Vui lòng thay đổi thông tin và chọn "Lưu thay đổi" ở góc trên
          </span>
        </div>
      )}

      {/* Profile summary banner header (Avatar + Name + Overview + Edit button) */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {patientData.avatar ? (
            <img
              src={patientData.avatar}
              alt={patientData.fullName}
              className="h-20 w-20 rounded-full object-cover border-2 border-teal-100 shadow-xs shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`${
              patientData.avatar ? 'hidden' : 'flex'
            } h-20 w-20 rounded-full bg-teal-700 text-white font-extrabold text-2xl items-center justify-center border-2 border-teal-100 shadow-xs shrink-0`}
          >
            {patientData.fullName?.charAt(0) || 'P'}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900">{patientData.fullName || 'Chưa có tên'}</h3>

            <p className="text-xs text-slate-600 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
              <span>{patientData.gender === 'FEMALE' ? '♀ Nữ' : patientData.gender === 'MALE' ? '♂ Nam' : 'Khác'}</span>
              <span>•</span>
              <span>
                {calculateAge(patientData.dateOfBirth)} tuổi ({formatDateDisplay(patientData.dateOfBirth)})
              </span>
            </p>

            {patientData.phone && (
              <p className="text-xs text-slate-700 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <Phone size={13} className="text-slate-400" />
                <span className="font-semibold">{patientData.phone}</span>
              </p>
            )}

            {patientData.email && (
              <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={13} className="text-slate-400" />
                <span>{patientData.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Chỉnh sửa button on the right side across from profile summary */}
        {onToggleEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer ${
              isEditing
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
            }`}
          >
            <Edit2 size={14} />
            <span>{isEditing ? 'Đang sửa (Hủy)' : 'Chỉnh sửa'}</span>
          </button>
        )}
      </div>

      {/* Patient Fields Form Grid */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        {/* Row 1: Họ tên (fullName), Ngày sinh (dateOfBirth), Giới tính (gender) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên <span className="text-[11px] font-normal text-slate-400">(fullName)</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={patientData.fullName}
              onChange={(e) => setPatientData({ ...patientData, fullName: e.target.value })}
              className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                isEditing
                  ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                  : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày sinh <span className="text-[11px] font-normal text-slate-400">(dateOfBirth)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                disabled={!isEditing}
                value={patientData.dateOfBirth}
                onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                  isEditing
                    ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                    : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
                }`}
              />
              <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giới tính <span className="text-[11px] font-normal text-slate-400">(gender)</span>
            </label>
            <select
              disabled={!isEditing}
              value={patientData.gender}
              onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
              className={`w-full rounded px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                  : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
              }`}
            >
              <option value="FEMALE">Nữ (FEMALE)</option>
              <option value="MALE">Nam (MALE)</option>
              <option value="OTHER">Khác (OTHER)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Số điện thoại (phone), Quốc tịch (nationality) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số điện thoại <span className="text-[11px] font-normal text-slate-400">(phone)</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={patientData.phone}
              onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
              className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                isEditing
                  ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                  : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quốc tịch <span className="text-[11px] font-normal text-slate-400">(nationality)</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={patientData.nationality}
              onChange={(e) => setPatientData({ ...patientData, nationality: e.target.value })}
              className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                isEditing
                  ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                  : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
              }`}
            />
          </div>
        </div>

        {/* Row 3: Địa chỉ (address) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Địa chỉ liên hệ <span className="text-[11px] font-normal text-slate-400">(address)</span>
          </label>
          <input
            type="text"
            disabled={!isEditing}
            value={patientData.address}
            onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
            className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
              isEditing
                ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
            }`}
          />
        </div>

        {/* Section Title: Tiền sử Y tế & Bệnh lý toàn thân Checkbox Checklist */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5 uppercase tracking-wide">
            <HeartPulse size={15} className="text-rose-600" />
            Tiền Sử Y Tế & Thông Tin Lâm Sàng
          </h4>

          {/* Bệnh lý toàn thân Checkbox List (systemicDisease) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Activity size={13} className="text-rose-600" />
              Bệnh lý toàn thân <span className="text-[11px] font-normal text-slate-400">(systemicDisease)</span>
            </label>

            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded border transition-all ${
                isEditing
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              {COMMON_SYSTEMIC_DISEASES.map((dis) => {
                const isChecked = systemicDiseases.includes(dis);

                return (
                  <label
                    key={dis}
                    className={`flex items-center gap-2 text-xs p-1.5 rounded border transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={isChecked}
                      onChange={() => handleToggleDisease(dis)}
                      className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="truncate">{dis}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6.5 pt-4">
            {/* Dị ứng (allergies) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle size={13} className="text-amber-600" /> Dị ứng thuốc / thực phẩm{' '}
                <span className="text-[11px] font-normal text-slate-400">(allergies)</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder={isEditing ? 'Nhập thông tin dị ứng (nếu có)...' : ''}
                value={patientData.allergies}
                onChange={(e) => setPatientData({ ...patientData, allergies: e.target.value })}
                className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                  isEditing
                    ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                    : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
                }`}
              />
            </div>

            {/* Thuốc đang dùng (currentMedications) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Pill size={13} className="text-purple-600" /> Thuốc đang dùng{' '}
                <span className="text-[11px] font-normal text-slate-400">(currentMedications)</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder={isEditing ? 'Nhập danh sách thuốc đang dùng...' : ''}
                value={patientData.currentMedications}
                onChange={(e) => setPatientData({ ...patientData, currentMedications: e.target.value })}
                className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                  isEditing
                    ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                    : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
                }`}
              />
            </div>

            {/* Tiền sử phẫu thuật (surgicalHistory) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope size={13} className="text-teal-700" /> Tiền sử phẫu thuật{' '}
                <span className="text-[11px] font-normal text-slate-400">(surgicalHistory)</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder={isEditing ? 'Nhập tiền sử phẫu thuật...' : ''}
                value={patientData.surgicalHistory}
                onChange={(e) => setPatientData({ ...patientData, surgicalHistory: e.target.value })}
                className={`w-full rounded px-3 py-2 text-xs font-bold transition-all ${
                  isEditing
                    ? 'bg-white border-2 border-teal-500 text-slate-900 shadow-2xs focus:outline-none'
                    : 'bg-slate-100/80 border border-slate-200 text-slate-800 font-semibold disabled:opacity-100'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Bottom Info Banner */}
        <div className="rounded bg-blue-50/80 border border-blue-200 px-3.5 py-2 text-xs text-blue-800 flex items-center gap-2 font-medium mt-2">
          <Info size={16} className="text-blue-600 shrink-0" />
          <span>Thông tin này sẽ được sử dụng trong quá trình khám và điều trị</span>
        </div>
      </div>
    </div>
  );
}
