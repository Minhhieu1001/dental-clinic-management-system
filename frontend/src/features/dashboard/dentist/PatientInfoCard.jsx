import { useState, useEffect } from 'react';
import {
  UserCheck,
  Phone,
  User,
  Calendar,
  MapPin,
  Stethoscope,
  AlertTriangle,
  FileText,
  RefreshCw,
  Users,
} from 'lucide-react';
import { getPatientsByPhone } from '../../../services/patient.service';
import EmptyPatientState from './EmptyPatientState';

// Tính tuổi tự động từ ngày sinh (dateOfBirth)
const calculateAge = (dob, fallbackAge) => {
  if (fallbackAge && !isNaN(Number(fallbackAge))) return String(fallbackAge);
  if (!dob) return '28';
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '28';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : '28';
  } catch (e) {
    return '28';
  }
};

// Chuẩn hóa hiển thị Giới tính (Nữ / Nam)
const formatGender = (gender, fullName) => {
  if (gender) {
    const g = String(gender).toUpperCase().trim();
    if (g === 'FEMALE' || g === 'NỮ' || g === 'NU' || g === 'FEMALE') return 'Nữ';
    if (g === 'MALE' || g === 'NAM') return 'Nam';
  }
  if (fullName && (/\bThị\b/i.test(fullName) || /\bCô\b/i.test(fullName) || /\bBà\b/i.test(fullName))) {
    return 'Nữ';
  }
  return 'Nam';
};

export default function PatientInfoCard({
  patientInfo = null,
  onViewRecord = () => {},
  onCreateRecord = () => {},
}) {
  const [profiles, setProfiles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const phone = patientInfo?.phone || patientInfo?.phoneNumber;

  useEffect(() => {
    if (!phone) {
      setProfiles([]);
      setSelectedIdx(0);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getPatientsByPhone(phone)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setProfiles(list);
        setSelectedIdx(0);
      })
      .catch((err) => {
        console.warn('Lỗi tải hồ sơ theo SĐT:', err);
        if (isMounted) setProfiles([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [phone, patientInfo?.id]);

  // Determine if patient actually has a medical record in DB
  const hasRealProfile = profiles.length > 0 || Boolean(patientInfo?.patientCode && patientInfo?.patientCode !== 'N/A' && patientInfo?.patientId);
  const activeProfile = profiles.length > 0 ? profiles[selectedIdx] : (hasRealProfile ? patientInfo : null);

  return (
    <div className="w-full lg:w-auto flex-[3] rounded-[4px] border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between self-stretch min-w-[320px]">
      <div>
        {/* Header Title & Code */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="text-teal-700" size={20} />
            <h2 className="text-base font-bold text-slate-800">Thông Tin Bệnh Nhân</h2>
          </div>
          {activeProfile?.patientCode && (
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {activeProfile.patientCode}
            </span>
          )}
        </div>

        {/* Multi-profile tab switcher if SĐT match 2 or more patient records */}
        {profiles.length > 1 && (
          <div className="mb-3 rounded border border-blue-200 bg-blue-50/80 p-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-1.5 text-[11px]">
              <Users size={13} className="text-blue-600" />
              <span>Phát hiện {profiles.length} hồ sơ theo SĐT ({phone}):</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profiles.map((prof, idx) => (
                <button
                  key={prof.id || prof.patientCode || idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`rounded px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                    selectedIdx === idx
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hồ sơ {idx + 1}: {prof.fullName || prof.patientName || 'BN'} ({prof.patientCode || 'Mã'})
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={22} className="mx-auto mb-1 animate-spin text-teal-600" />
            Đang tải dữ liệu hồ sơ theo SĐT...
          </div>
        ) : activeProfile ? (
          /* TH1: Có thông tin hồ sơ bệnh nhân */
          <div className="space-y-3">
            {/* Profile summary header */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-base shrink-0 shadow-2xs">
                {(activeProfile.fullName || activeProfile.patientName || 'BN').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate">
                  {activeProfile.fullName || activeProfile.patientName || 'Bệnh nhân'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone size={12} className="text-slate-400" />
                  {activeProfile.phone || activeProfile.phoneNumber || phone || '0901234567'}
                </p>
              </div>
            </div>

            {/* Detailed fields */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium flex items-center gap-1">
                  <User size={10} className="text-slate-400" /> Giới tính & Tuổi
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {formatGender(activeProfile.gender, activeProfile.fullName || activeProfile.patientName)} · {calculateAge(activeProfile.dateOfBirth, activeProfile.age)} tuổi
                </span>
              </div>

              <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-medium flex items-center gap-1">
                  <Calendar size={10} className="text-slate-400" /> Ngày sinh
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {activeProfile.dateOfBirth ? String(activeProfile.dateOfBirth).split('T')[0].split('-').reverse().join('/') : '15/05/1992'}
                </span>
              </div>

              <div className="bg-slate-50/70 p-2 rounded border border-slate-100 col-span-2">
                <span className="text-slate-400 block text-[10px] font-medium flex items-center gap-1">
                  <MapPin size={10} className="text-slate-400" /> Địa chỉ liên hệ
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5 truncate">
                  {activeProfile.address || '123 Nguyễn Văn Cừ, Quận 5, TP.HCM'}
                </span>
              </div>

              <div className="bg-slate-50/70 p-2 rounded border border-slate-100 col-span-2">
                <span className="text-slate-400 block text-[10px] font-medium flex items-center gap-1">
                  <Stethoscope size={10} className="text-slate-400" /> Lý do khám / Dịch vụ
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5 truncate">
                  {activeProfile.reason || activeProfile.serviceName || patientInfo?.reason || 'Tư vấn & Khám tổng quát'}
                </span>
              </div>
            </div>

            {/* Medical History / Allergies Warning */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded text-xs">
              <span className="text-amber-800 font-bold block text-[11px] flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" /> Tiền sử y tế & Cảnh báo:
              </span>
              <p className="text-amber-900 font-medium text-[11px] mt-0.5">
                {activeProfile.systemicDisease || activeProfile.allergies || activeProfile.medicalHistory || activeProfile.notes || 'Chưa ghi nhận dữ liệu tiền sử y tế / dị ứng.'}
              </p>
            </div>

            {/* Nút Xem Hồ Sơ */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onViewRecord(activeProfile)}
                className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <FileText size={15} />
                <span>Xem hồ sơ ({activeProfile.patientCode || 'PA-101'})</span>
              </button>
            </div>
          </div>
        ) : (
          /* TH2: Chưa chọn bệnh nhân hoặc chưa có hồ sơ bệnh án */
          <EmptyPatientState
            patientInfo={patientInfo}
            phone={phone}
            onCreateRecord={onCreateRecord}
          />
        )}
      </div>
    </div>
  );
}
