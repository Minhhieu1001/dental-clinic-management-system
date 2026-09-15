import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  X,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

/**
 * Tính tuổi dựa trên ngày sinh (YYYY-MM-DD hoặc ISO string)
 */
const calculateAge = (dob) => {
  if (!dob) return '';
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} tuổi` : '';
  } catch {
    return '';
  }
};

/**
 * Định dạng ngày sinh theo chuẩn VN (DD/MM/YYYY)
 */
const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString).split('T')[0];
    return d.toLocaleDateString('vi-VN');
  } catch {
    return String(dateString).split('T')[0];
  }
};

/**
 * MultiplePatientsModal
 * Modal chọn hồ sơ bệnh nhân khi 1 số điện thoại có nhiều hồ sơ trùng khớp.
 * Dùng chung cho 3 màn hình chính:
 * 1. Hồ sơ bệnh án (MedicalRecords)
 * 2. Khám lâm sàng & Chẩn đoán (ClinicalExamination)
 * 3. Lập kế hoạch điều trị (TreatmentPlans)
 */
export default function MultiplePatientsModal({
  isOpen,
  onClose,
  phoneQuery = '',
  patientsList = [],
  onSelectPatient,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-900 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/60 border border-teal-500/30 text-teal-200 shrink-0">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">
                  Phát Hiện Nhiều Hồ Sơ Bệnh Nhân
                </h3>
                <p className="text-xs text-teal-200/90 font-medium pt-0.5">
                  Số điện thoại <span className="font-bold text-white">{phoneQuery}</span> có{' '}
                  <span className="font-bold text-white">{patientsList.length}</span> hồ sơ trùng khớp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-teal-200 hover:bg-teal-700 hover:text-white transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body: Danh sách bệnh nhân trùng SĐT */}
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-600">
              Vui lòng chọn đúng bệnh nhân bên dưới để tải dữ liệu vào phiên làm việc:
            </p>

            <div className="space-y-3 pt-1">
              {patientsList.map((p) => {
                const pName = p.fullName || p.patientName || p.user?.fullName || 'Bệnh nhân';
                const pCode = p.patientCode || p.code || 'Chưa có mã';
                const pPhone = p.phone || p.phoneNumber || p.user?.phone || phoneQuery || 'N/A';
                const pDob = p.dateOfBirth || p.dob ? String(p.dateOfBirth || p.dob).split('T')[0] : '';
                const pGender = p.gender === 'FEMALE' ? '♀ Nữ' : '♂ Nam';
                const pAddr = p.address || p.user?.address || 'Chưa cập nhật địa chỉ';
                const ageText = calculateAge(pDob);

                return (
                  <div
                    key={p.id || p.patientId || pCode}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-300 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-lg shrink-0 shadow-xs">
                        {pName.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {pName}
                          </h4>
                          <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-800 border border-teal-200">
                            {pCode}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-teal-700 shrink-0" /> {pPhone}
                          </span>
                          <span>•</span>
                          <span>{pGender}</span>
                          {pDob && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-teal-700 shrink-0" />{' '}
                                {formatDateDisplay(pDob)} {ageText && `(${ageText})`}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5 truncate max-w-md">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{pAddr}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPatient) {
                          onSelectPatient(p);
                        }
                        if (onClose) {
                          onClose();
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-colors shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <CheckCircle2 size={15} />
                      <span>Chọn hồ sơ này &rarr;</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end bg-slate-50 px-6 py-3.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
