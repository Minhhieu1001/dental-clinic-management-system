import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Calendar,
  User,
  FileText,
  Stethoscope,
  CheckCircle2,
  Phone,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { CHIEF_COMPLAINT_SUGGESTIONS } from '../clinicalExaminationHelpers';

/**
 * Modal form xác nhận tạo đợt điều trị mới
 * Giúp bác sĩ kiểm tra thông tin kỹ càng trước khi khởi tạo,
 * tránh tạo quá nhiều đợt điều trị trùng lặp ngoài ý muốn.
 */
export default function CreateTreatmentSessionModal({
  isOpen,
  onClose,
  onConfirm,
  patient,
  currentDoctor = 'BS. Nha khoa Crown',
  initialReason = '',
  existingSessionsCount = 0,
}) {
  const [examinationDate, setExaminationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [doctorName, setDoctorName] = useState(currentDoctor);
  const [chiefComplaint, setChiefComplaint] = useState(initialReason || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đồng bộ lại khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      setExaminationDate(new Date().toISOString().split('T')[0]);
      setDoctorName(currentDoctor || 'BS. Nha khoa Crown');
      setChiefComplaint(initialReason || patient?.symptoms || 'Khám răng hàm mặt');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentDoctor, initialReason, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        examinationDate,
        doctorName: doctorName.trim(),
        chiefComplaint: chiefComplaint.trim() || 'Khám răng hàm mặt',
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Lỗi khi xác nhận tạo đợt điều trị:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthYear = new Date(dob).getFullYear();
    if (isNaN(birthYear)) return '';
    return `${new Date().getFullYear() - birthYear} tuổi`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop mờ mượt mà */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Hộp thoại Modal với hiệu ứng spring nảy nhẹ mượt mà */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto z-10"
          >
            {/* 1. Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Xác Nhận Khởi Tạo Đợt Điều Trị Mới
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Thiết lập phiên khám lâm sàng và phác đồ điều trị riêng biệt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          {/* Cảnh báo tránh tạo trùng lặp */}

          {/* Thẻ tóm tắt thông tin bệnh nhân */}
          {patient && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white font-extrabold text-base shadow-xs shrink-0">
                  {patient.fullName?.charAt(0) || 'P'}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {patient.fullName || 'Bệnh nhân'}
                    </span>
                    {patient.patientCode && (
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                        {patient.patientCode}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
                    <span>
                      {patient.gender === 'FEMALE' ? 'Nữ' : patient.gender === 'MALE' ? 'Nam' : 'Khác'}
                    </span>
                    {patient.dateOfBirth && (
                      <>
                        <span>·</span>
                        <span>{calculateAge(patient.dateOfBirth)}</span>
                      </>
                    )}
                    {patient.phone && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-slate-600 font-semibold">
                          <Phone size={10} className="text-teal-700" />
                          {patient.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-full bg-teal-100 text-teal-800 text-[10.5px] font-bold px-2.5 py-0.5 border border-teal-200">
                  Đợt khám #{existingSessionsCount + 1}
                </span>
              </div>
            </div>
          )}

          {/* Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Ngày khám */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-700" />
                <span>Ngày bắt đầu khám / đợt điều trị:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={examinationDate}
                onChange={(e) => setExaminationDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs"
              />
            </div>

            {/* Bác sĩ phụ trách */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <User size={13} className="text-teal-700" />
                <span>Nha sĩ phụ trách khám:</span>
              </label>
              <input
                type="text"
                readOnly
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Nhập tên nha sĩ phụ trách..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Lý do khám / Triệu chứng chính */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope size={13} className="text-teal-700" />
              <span>Lý do khám / Triệu chứng ban đầu của đợt này:</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Ví dụ: Đau nhức răng hàm 46, viêm nướu, khám định kỳ..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs"
            />
            {/* Quick chips gợi ý lý do khám */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">

              {CHIEF_COMPLAINT_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChiefComplaint(item)}
                  className="text-[10.5px] font-medium text-slate-600 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú ban đầu */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={13} className="text-teal-700" />
              <span>Ghi chú đợt điều trị (Tùy chọn):</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập các dặn dò, lưu ý bệnh sử hoặc chỉ định ban đầu..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs resize-none"
            />
          </div>

          {/* 3. Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
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
              disabled={isSubmitting || !chiefComplaint.trim()}
              className="flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow hover:shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang khởi tạo đợt điều trị...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Xác nhận tạo đợt điều trị</span>
                </>
              )}
            </button>
          </div>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
}
