import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  User,
  Sparkles,
  X,
  Layers,
  CheckCircle2,
  Package,
  Loader2,
} from 'lucide-react';

export const CreatePlanModal = ({
  isOpen,
  onClose,
  session,
  patient,
  dentistName = 'BS. Nguyễn Văn Tâm',
  suggestedPackages = [],
  onSubmit,
}) => {
  const [formPlanName, setFormPlanName] = useState('');
  const [formDentistName, setFormDentistName] = useState(dentistName);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('EMPTY'); // 'EMPTY' | package_id
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const next30 = new Date();
      next30.setDate(next30.getDate() + 30);
      const next30Str = next30.toISOString().split('T')[0];

      const sLabel = session?.label || 'Đợt khám hiện tại';
      const defaultName = `Kế hoạch điều trị - ${sLabel}`;
      const defaultDesc = `Kế hoạch điều trị theo kết quả chẩn đoán ${sLabel}. Triệu chứng/Lý do khám: ${
        session?.chiefComplaint || 'Khám răng hàm mặt'
      }`;

      setFormPlanName(defaultName);
      setFormDentistName(dentistName);
      setFormStartDate(session?.recordDate ? String(session.recordDate).slice(0, 10) : today);
      setFormEndDate(next30Str);
      setFormDescription(defaultDesc);
      setSelectedPackageId('EMPTY');
      setIsSubmitting(false);
    }
  }, [isOpen, session, dentistName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formPlanName.trim()) {
      alert('Vui lòng nhập tên kế hoạch điều trị');
      return;
    }
    if (isSubmitting) return;

    let initialPhases = [];
    if (selectedPackageId !== 'EMPTY') {
      const foundPkg = suggestedPackages.find((p) => p.package_id === selectedPackageId);
      if (foundPkg && foundPkg.phases) {
        initialPhases = foundPkg.phases.map((ph, idx) => ({
          phase_id: `ph-${Date.now()}-${idx}`,
          phase_order: idx + 1,
          phase_name: ph.phase_name,
          treatmentType: ph.treatmentType || 'Tổng quát',
          estimated_duration: ph.estimated_duration || '1 tuần',
          status: ph.status || 'PENDING',
          description: ph.description || '',
          treatment_services: (ph.treatment_services || []).map((s, sIdx) => ({
            treatmentServicesId: `ts-${Date.now()}-${idx}-${sIdx}`,
            service_id: s.service_id && !String(s.service_id).startsWith('srv-') ? s.service_id : null,
            service_name: s.service_name,
            toothNumber: s.toothNumber || '',
            quantity: s.quantity || 1,
            price: s.price || 0,
          })),
          treatment_visits: (ph.treatment_visits || []).map((v, vIdx) => ({
            visitId: `vis-${Date.now()}-${idx}-${vIdx}`,
            visitName: v.visitName,
            visitOrder: v.visitOrder || vIdx + 1,
            start_date: v.start_date || formStartDate,
            status: v.status || 'PENDING',
            clinical_notes: v.clinical_notes || '',
          })),
        }));
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        planName: formPlanName.trim(),
        dentistName: formDentistName.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        description: formDescription.trim(),
        phases: initialPhases,
        examinationResultId: session?.id || session?.examinationResultId,
      });
      onClose();
    } catch (err) {
      console.error('Lỗi tạo kế hoạch điều trị:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-teal-100 bg-linear-to-r from-teal-700 to-teal-800 px-6 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Lên Kế Hoạch Điều Trị Mới</h3>
                <p className="text-xs text-teal-100 font-normal">
                  Khởi tạo phác đồ điều trị gắn liền với {session?.label || 'đợt khám hiện tại'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Tóm tắt đợt khám & bệnh nhân */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Bệnh nhân:</span>
                <span className="text-teal-900 font-semibold">{patient?.fullName}</span>
                <span className="rounded bg-teal-200/70 text-teal-900 font-bold px-1.5 py-0.5 text-[10px]">
                  {patient?.patientCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Đợt khám:</span>
                <span className="rounded bg-teal-700 text-white font-bold px-2 py-0.5 text-[11px]">
                  {session?.label || 'Đợt hiện tại'}
                </span>
                <span className="text-slate-500 font-medium">
                  ({session?.diagnoses?.length || 0} chẩn đoán)
                </span>
              </div>
            </div>

            {/* Tên kế hoạch */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Tên kế hoạch điều trị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formPlanName}
                onChange={(e) => setFormPlanName(e.target.value)}
                placeholder="VD: Kế hoạch điều trị sâu răng & Chăm sóc phục hình"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Bác sĩ & Thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Bác sĩ phụ trách</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={formDentistName}
                    onChange={(e) => setFormDentistName(e.target.value)}
                    placeholder="Tên bác sĩ"
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Ngày bắt đầu</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Ngày dự kiến hoàn thành</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Ghi chú / Mục tiêu */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Mục tiêu & Ghi chú phác đồ</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ghi chú về tiền sử, mục tiêu điều trị, yêu cầu ăn nhai & thẩm mỹ..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
              />
            </div>

            {/* Lựa chọn mẫu phác đồ khởi đầu */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block font-bold text-slate-700">
                Khởi tạo các giai đoạn điều trị ban đầu:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => setSelectedPackageId('EMPTY')}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedPackageId === 'EMPTY'
                      ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selectedPackageId === 'EMPTY'
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedPackageId === 'EMPTY' && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Tự thiết lập từ đầu (0 giai đoạn)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Tự tạo các giai đoạn và thêm dịch vụ cụ thể sau khi mở kế hoạch.
                    </span>
                  </div>
                </div>

                {suggestedPackages.slice(0, 3).map((pkg) => (
                  <div
                    key={pkg.package_id}
                    onClick={() => setSelectedPackageId(pkg.package_id)}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                      selectedPackageId === pkg.package_id
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selectedPackageId === pkg.package_id
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedPackageId === pkg.package_id && <CheckCircle2 size={12} />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs truncate" title={pkg.package_name}>
                        {pkg.package_name}
                      </span>
                      <span className="text-[11px] text-teal-700 font-semibold block">
                        {pkg.phases?.length || 1} giai đoạn • {Number(pkg.package_price || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang tạo bản ghi kế hoạch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Xác nhận tạo kế hoạch điều trị</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
