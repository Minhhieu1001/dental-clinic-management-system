import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, FileText, Calendar, MapPin, Phone, User } from 'lucide-react';
import { useEffect } from 'react';
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthYear = new Date(dob).getFullYear();
  if (isNaN(birthYear)) return '';
  return `${new Date().getFullYear() - birthYear}`;
};

export default function PrescriptionDetailModal({
  isOpen,
  onClose,
  prescription,
  patient,
  onPrint,
}) {
  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  const details = prescription?.prescriptionDetails || [];
  const dobStr = formatDateDisplay(patient?.dateOfBirth || patient?.dob);
  const ageStr = calculateAge(patient?.dateOfBirth || patient?.dob);

  return createPortal(
    <AnimatePresence>
      {isOpen && prescription && (
        <motion.div
          key="prescription-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 380,
              mass: 0.8,
            }}
            className="relative w-full max-w-6xl bg-white border border-slate-300 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-xs rounded-sm z-10"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600 inline-block"></span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  CHI TIẾT ĐƠN THUỐC: {prescription.prescriptionName || 'Đơn thuốc nha khoa'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Prescription Overview Info with separate rows for DOB & Address */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cột 1: Bệnh nhân */}
                <div>
                  <span className="text-slate-500 block text-[11px]">Bệnh nhân:</span>
                  <strong className="text-slate-900 font-bold text-sm block">
                    {patient?.fullName || prescription.patientName || 'Bệnh nhân'}
                  </strong>
                  {patient?.patientCode && (
                    <span className="text-teal-700 font-bold text-[11px] block mt-0.5">
                      Mã BN: {patient.patientCode}
                    </span>
                  )}
                </div>

                {/* Cột 2: Bác sĩ kê đơn */}
                <div>
                  <span className="text-slate-500 block text-[11px]">Bác sĩ kê đơn:</span>
                  <strong className="text-slate-800 font-semibold text-xs block">
                    {prescription.prescriber || 'Nha sĩ'}
                  </strong>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Khoa Răng Hàm Mặt
                  </span>
                </div>

                {/* Cột 3: Ngày giờ kê đơn */}
                <div>
                  <span className="text-slate-500 block text-[11px]">Ngày giờ kê đơn:</span>
                  <span className="text-slate-800 font-semibold block">
                    {formatDateTime(prescription.prescriptionDate || prescription.createdAt)}
                  </span>
                </div>
              </div>

              {/* Dòng 2 xuống dòng: Ngày sinh & Địa chỉ theo yêu cầu người dùng */}
              <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={13} className="text-teal-700 shrink-0" />
                  <span>
                    Ngày sinh:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {dobStr || 'Chưa cập nhật'}
                    </strong>
                    {ageStr && <span className="text-slate-500"> ({ageStr} tuổi)</span>}
                    {patient?.gender && (
                      <span className="text-slate-500"> · Giới tính: {patient.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin size={13} className="text-teal-700 shrink-0" />
                  <span className="truncate" title={patient?.address}>
                    Địa chỉ:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {patient?.address || 'Chưa cập nhật địa chỉ'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Medicines Table with fixed height (~6 rows) and scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="border border-slate-300 overflow-x-auto h-[260px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-300 text-slate-700 font-bold text-[11px] border-b border-slate-300 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="w-12 py-2 px-3 text-center border-r border-slate-300">STT</th>
                      <th className="w-36 min-w-[130px] py-2 px-3 border-r border-slate-300 whitespace-nowrap">Mã thuốc</th>
                      <th className="min-w-[220px] py-2 px-3 border-r border-slate-300">Tên thuốc</th>
                      <th className="w-36 min-w-[130px] py-2 px-3 border-r border-slate-300 whitespace-nowrap">Đơn vị tính</th>
                      <th className="w-24 py-2 px-3 border-r border-slate-300 text-center whitespace-nowrap">Số lượng</th>
                      <th className="min-w-[280px] py-2 px-3">Cách dùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {details.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Không có chi tiết thuốc trong đơn này.
                        </td>
                      </tr>
                    ) : (
                      details.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium border-r border-slate-200 text-slate-700 whitespace-nowrap">
                            {item.medicineCode || item.code || ''}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            {item.medicineName || item.name}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                            <span className="inline-block px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {item.unit || 'Viên'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-900 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {item.dosage || item.usageInstruction || 'Theo chỉ dẫn'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Lời dặn của bác sĩ */}
              {prescription.doctorAdvice && (
                <div className="border border-slate-200 rounded-sm p-3 bg-amber-50/50">
                  <span className="font-bold text-[11px] text-amber-900 block mb-1 uppercase tracking-wide">
                    Lời dặn của Bác sĩ điều trị:
                  </span>
                  {prescription.doctorAdvice.includes('<') ? (
                    <div
                      className="text-xs text-slate-800 leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_u]:underline"
                      dangerouslySetInnerHTML={{ __html: prescription.doctorAdvice }}
                    />
                  ) : (
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {prescription.doctorAdvice}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-500">
                Tổng cộng: <strong className="text-slate-800 font-bold">{details.length}</strong> loại thuốc
              </span>
              <div className="flex items-center gap-2">
                {onPrint && (
                  <button
                    type="button"
                    onClick={() => onPrint(prescription)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer size={13} />
                    <span>In đơn thuốc</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                >
                  <X size={14} />
                  <span>Đóng</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
