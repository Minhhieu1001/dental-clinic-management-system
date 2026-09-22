import React from 'react';
import {
  User,
  Phone,
  Calendar,
  MapPin,
  AlertTriangle,
  Stethoscope,
  Activity,
  HeartPulse,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

const formatDOB = (dob) => {
  if (!dob) return '';
  const clean = dob.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dob;
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthYear = new Date(dob).getFullYear();
  if (isNaN(birthYear)) return '';
  const age = new Date().getFullYear() - birthYear;
  return `${age} tuổi`;
};

export default function PatientMedicalInfoCard({
  patient,
  selectedSession,
  activeMedicalRecord,
}) {
  if (!patient) return null;

  const ageStr = calculateAge(patient.dateOfBirth || patient.dob);
  const dobStr = formatDOB(patient.dateOfBirth || patient.dob);

  // Danh sách chẩn đoán từ đợt khám đã chọn
  const diagnoses = selectedSession?.diagnoses || (selectedSession?.diagnosis ? [selectedSession.diagnosis] : []);

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'SEVERE':
      case 'PULP':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">Nặng / Tủy</span>;
      case 'MODERATE':
      case 'NEAR_PULP':
      case 'DENTIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Trung bình / Ngà</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Nhẹ / Men</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Banner: Patient Overview */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-white to-sky-50/50 border-b border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Avatar + Main Info */}
          <div className="lg:col-span-6 flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-teal-700 text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm border-2 border-teal-100">
              {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 leading-tight truncate">
                  {patient.fullName || 'Bệnh nhân'}
                </h3>
                {patient.patientCode && (
                  <span className="text-xs font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-md border border-teal-300">
                    {patient.patientCode}
                  </span>
                )}
                {patient.gender && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nữ' : patient.gender}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                {(patient.phone || patient.phoneNumber) && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Phone size={13} className="text-teal-700" />
                    {patient.phone || patient.phoneNumber}
                  </span>
                )}
                {dobStr && (
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    {dobStr} {ageStr ? `(${ageStr})` : ''}
                  </span>
                )}
                {patient.address && (
                  <span className="flex items-center gap-1 max-w-[240px] truncate" title={patient.address}>
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    {patient.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tiền sử bệnh & Cảnh báo dị ứng thuốc */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/90 rounded-xl p-3 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <HeartPulse size={14} className="text-rose-500" />
                <span>Tiền sử bệnh lý</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">
                {patient.medicalHistory || activeMedicalRecord?.medicalHistory || 'Chưa ghi nhận bệnh lý nền đặc biệt.'}
              </p>
            </div>

            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                <ShieldAlert size={14} className="text-amber-600" />
                <span>Dị ứng thuốc & Lưu ý</span>
              </div>
              <p className="text-xs font-semibold text-amber-900 line-clamp-2">
                {patient.allergies || activeMedicalRecord?.allergies || 'Không ghi nhận dị ứng thuốc.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Selected Examination Diagnosis & Chief Complaint */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-teal-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Chẩn đoán lâm sàng của đợt khám đang chọn
            </h4>
          </div>
          {selectedSession && (
            <span className="text-[11px] font-semibold text-slate-500">
              BS Khám: <strong className="text-slate-800">{selectedSession.dentistName || selectedSession.prescriber || 'Nha sĩ'}</strong>
            </span>
          )}
        </div>

        {selectedSession ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            {/* Lý do khám / Triệu chứng */}
            <div className="md:col-span-4 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lý do khám / Triệu chứng:</span>
              <p className="text-xs font-semibold text-slate-800">
                {selectedSession.chiefComplaint || 'Khám tổng quát / Theo lịch hẹn'}
              </p>
            </div>

            {/* Danh sách các kết luận chẩn đoán */}
            <div className="md:col-span-8 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">Kết luận chẩn đoán bệnh lý (ICD-10):</span>
              {diagnoses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {diagnoses.map((diag, index) => (
                    <div
                      key={diag.id || index}
                      className="flex items-center gap-2 rounded-xl bg-teal-50/60 border border-teal-200/90 px-3 py-1.5 text-xs text-slate-800 shadow-2xs"
                    >
                      <span className="font-extrabold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                        {diag.primaryDiagnosis || diag.code || 'K04'}
                      </span>
                      <span className="font-medium">{diag.label || diag.diagnosticNotes || diag.notes || diag.primaryDiagnosis || 'Bệnh lý răng miệng'}</span>
                      {diag.toothPosition && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                          R: {diag.toothPosition}
                        </span>
                      )}
                      {getSeverityBadge(diag.level || diag.severity)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  Chưa ghi nhận chẩn đoán chi tiết cho phiên khám này. Bác sĩ có thể tự chỉ định đơn thuốc dựa trên tình trạng thực tế.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              Vui lòng chọn một đợt khám / phiên điều trị bên dưới để xem chi tiết chẩn đoán và đồng bộ đơn thuốc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
