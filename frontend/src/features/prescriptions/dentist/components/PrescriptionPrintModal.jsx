import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Stethoscope, HeartPulse, Sparkles } from 'lucide-react';

const formatDateTime = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('vi-VN');
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function PrescriptionPrintModal({
  isOpen,
  onClose,
  prescription,
  patient,
  selectedSession,
}) {
  // Lock body scroll and handle Escape key
  React.useEffect(() => {
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

  const handlePrint = async () => {
    const images = document.querySelectorAll('.prescription-print-paper img');
    await Promise.all(Array.from(images, (image) => image.decode().catch(() => {})));
    window.print();
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    return `${new Date().getFullYear() - birthYear}`;
  };

  const diagnosesList = selectedSession?.diagnoses || (selectedSession?.diagnosis ? [selectedSession.diagnosis] : []);
  const diagnosisLabels = Array.from(
    new Set(
      diagnosesList.map((d) => `${d.primaryDiagnosis || d.code || ''} - ${d.label || d.notes || 'Bệnh lý nha khoa'}`.trim())
    )
  ).filter((s) => s !== '-');

  const diagnosisText = diagnosisLabels.length > 0
    ? diagnosisLabels.join('; ')
    : selectedSession?.chiefComplaint || 'Viêm quanh cuống răng / Điều trị nội nha';

  return createPortal(
    <AnimatePresence>
      {isOpen && prescription && (
        <motion.div
          key="prescription-print-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto prescription-print-portal"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs print:hidden"
          />

          {/* Dialog Container - ERP Sharp Corners & Clean Style */}
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
            className="relative w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden z-10 prescription-print-dialog"
          >
            {/* Header Actions - hidden during print */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-teal-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Xem trước và In Đơn Thuốc Y Khoa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm shadow-xs transition-colors cursor-pointer"
                >
                  <Printer size={13} /> In Đơn Thuốc
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-7 w-7 rounded-sm bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Printable Prescription Body - Pure White Paper & Black Ink Medical Style */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-black font-sans text-xs leading-relaxed prescription-print-paper">
              {/* Clinic Header */}
              <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
                <div className="flex items-center gap-3.5">
                  {prescription.clinicLogoUrl && (
                    <img
                      src={prescription.clinicLogoUrl}
                      alt={`Logo ${prescription.dentalClinicName || 'nha khoa'}`}
                      className="h-14 w-14 object-contain shrink-0"
                    />
                  )}
                  <div>
                    <h2 className="text-base font-black text-black uppercase tracking-wider">
                      {prescription.dentalClinicName || 'NHA KHOA'}
                    </h2>
                    {prescription.branchName && (
                      <p className="text-[11px] text-slate-800 font-semibold">
                        Chi nhánh: {prescription.branchName}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-800 font-normal">
                      Địa chỉ: {prescription.branchAddress || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-700 font-bold uppercase block">Mã đơn thuốc:</span>
                  <span className="text-xs font-mono font-black text-black block">
                    {prescription.prescriptionCode || prescription.code || (prescription.id ? String(prescription.id).slice(0, 8).toUpperCase() : 'RX-NEW')}
                  </span>
                  <span className="text-[10px] text-slate-700 block">
                    Ngày kê: {formatDateTime(prescription.prescriptionDate)}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-3">
                <h1 className="text-lg font-black text-black uppercase tracking-widest">
                  ĐƠN THUỐC
                </h1>
                <p className="text-[11px] text-slate-700 italic">
                  {prescription.prescriptionName || 'Đơn thuốc điều trị nha khoa'}
                </p>
              </div>

              {/* Patient Info - Clean layout without bounding box */}
              <div className="mb-5 space-y-1.5 text-xs text-black">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    Họ và tên: <strong className="text-sm font-bold text-black">{patient?.fullName || 'Bệnh nhân'}</strong>
                  </div>
                  <div className="col-span-3">
                    Tuổi: <strong className="font-bold text-black">{calculateAge(patient?.dateOfBirth || patient?.dob) || 'N/A'}</strong>
                  </div>
                  <div className="col-span-2 text-right">
                    Giới tính: <strong className="font-bold text-black">{patient?.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6 truncate">
                    Mã bệnh nhân: <strong className="font-mono font-bold text-black">{patient?.patientCode || 'N/A'}</strong>
                  </div>
                  <div className="col-span-6 text-right">
                    Điện thoại: <strong className="font-bold text-black">{patient?.phone || patient?.phoneNumber || 'N/A'}</strong>
                  </div>
                </div>

                <div className="truncate">
                  Địa chỉ: <span className="text-slate-800">{patient?.address || 'TP. Hồ Chí Minh'}</span>
                </div>

                <div className="pt-0.5">
                  Chẩn đoán: <strong className="text-black">{diagnosisText}</strong>
                </div>
              </div>

              {/* Prescribed Medicines List */}
              <div className="mb-5">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide mb-2">
                  Chỉ định dùng thuốc:
                </h3>

                <div className="space-y-3">
                  {(prescription.prescriptionDetails || []).map((item, index) => (
                    <div key={item.id || index} className="flex items-start gap-2 border-b border-slate-200 pb-2">
                      <span className="font-black text-black w-5 shrink-0 text-sm">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-black text-xs">
                          <span>{item.medicineName}</span>
                          <span className="font-bold text-black">
                            {item.quantity} {item.unit || 'Viên'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-800 italic">
                          Cách dùng: {item.dosage || 'Theo chỉ dẫn của bác sĩ'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor's Advice - Clean layout without bounding box */}
              <div className="mb-6 text-xs text-black">
                <span className="font-bold block mb-1 uppercase tracking-wide text-xs text-black">
                  Lời dặn của Bác sĩ điều trị:
                </span>
                {prescription.doctorAdvice && prescription.doctorAdvice.includes('<') ? (
                  <div
                    className="font-normal text-xs leading-relaxed text-black [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_u]:underline"
                    dangerouslySetInnerHTML={{ __html: prescription.doctorAdvice }}
                  />
                ) : (
                  <p className="font-normal text-black whitespace-pre-wrap">
                    {prescription.doctorAdvice || 'Uống thuốc đúng liều, kiêng thức ăn quá nóng/cay hoặc đồ có cồn. Tái khám theo lịch hẹn hoặc ngay khi có dấu hiệu bất thường.'}
                  </p>
                )}
              </div>

              {/* Footer & Signature */}
              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs text-black">
                <div>
                  <p className="text-[11px] text-slate-700 italic">Ngày tái khám:</p>
                  <p className="font-bold text-black mt-1">Theo lịch hẹn của phòng khám</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-700 italic">
                    TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                  <p className="font-bold text-black mt-1 uppercase">Bác sĩ điều trị</p>
                  <div className="h-16 flex items-center justify-center text-slate-400 italic">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <p className="font-black text-black text-xs">
                    {prescription.prescriber || 'BS. Crown Dental'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
