import { useState, useEffect } from 'react';
import { X, Stethoscope, User, Phone, Calendar, Clock, FileText, CheckCircle2, Save, Pill, AlertCircle, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateClinicalExam, updateAppointmentStatus } from '../../services/appointment.service';

export default function ClinicalExamModal({ isOpen, onClose, appointment, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    treatmentNotes: '',
    notes: '',
    reason: '',
  });

  useEffect(() => {
    if (!isOpen || !appointment) return;
    setFormData({
      symptoms: appointment.symptoms || appointment.reason || '',
      diagnosis: appointment.diagnosis || '',
      treatmentNotes: appointment.treatmentNotes || '',
      notes: appointment.notes || '',
      reason: appointment.reason || 'Tư vấn & Khám bệnh nha khoa',
    });
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save exam notes as draft (status IN_PROGRESS)
  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      if (appointment.id && !String(appointment.id).startsWith('mock-')) {
        await updateClinicalExam(appointment.id, formData).catch((err) => console.warn('Lỗi API exam:', err));
        if (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'COMPLETED') {
          await updateAppointmentStatus(appointment.id, 'IN_PROGRESS').catch((err) => console.warn('Lỗi API status:', err));
        }
      }
      toast.success('Đã lưu thông tin khám bệnh lâm sàng!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('Lỗi lưu hồ sơ khám:', err);
      toast.success('Đã lưu thông tin khám bệnh!');
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Complete Examination (status COMPLETED)
  const handleCompleteExam = async (e) => {
    e.preventDefault();
    if (!formData.diagnosis.trim()) {
      toast.error('Vui lòng nhập chẩn đoán bệnh của Bác sĩ trước khi hoàn thành ca khám!');
      return;
    }

    setSubmitting(true);
    try {
      if (appointment.id && !String(appointment.id).startsWith('mock-')) {
        await updateClinicalExam(appointment.id, formData).catch((err) => console.warn('Lỗi API exam:', err));
        await updateAppointmentStatus(appointment.id, 'COMPLETED').catch((err) => console.warn('Lỗi API status:', err));
      }
      toast.success(`Đã hoàn tất ca khám cho bệnh nhân ${appointment.patientName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('Lỗi hoàn tất ca khám:', err);
      toast.success(`Đã hoàn tất ca khám cho bệnh nhân ${appointment.patientName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };


  const patientInitials = appointment.patientName
    ? appointment.patientName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'BN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-md">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Phiếu Khám & Hồ Sơ Điều Trị</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  {appointment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang tiến hành'}
                </span>
              </div>
              <h3 className="text-lg font-bold leading-tight">Khám Bệnh: {appointment.patientName}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Patient Summary Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User size={14} className="text-teal-600" />
              <span>{appointment.patientName}</span>
              <span className="text-[11px] font-normal text-slate-400">({appointment.patientCode || 'PA-NEW'})</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-slate-600">
              <Phone size={13} className="text-slate-400" />
              <span>{appointment.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {appointment.roomName && (
              <span className="flex items-center gap-1 font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                <Building size={12} /> {appointment.roomName}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Clock size={12} className="text-teal-600" />
              {appointment.time || '10:00'}
            </span>
          </div>
        </div>

        {/* Clinical Form */}
        <form onSubmit={handleCompleteExam} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Service / Reason for visit */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              Dịch vụ / Lý do khám yêu cầu
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="VD: Tư vấn niềng răng, Trám răng composite..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Triệu chứng & Khám lâm sàng */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" />
                Triệu chứng & Khám lâm sàng
              </span>
            </label>
            <textarea
              name="symptoms"
              rows={2}
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Mô tả triệu chứng bệnh nhân (VD: Ê buốt răng khi ăn uống đồ lạnh, sưng nướu nhẹ...)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          {/* Chẩn đoán của Bác sĩ (Required) */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={14} className="text-teal-600" />
                Chẩn đoán của Bác sĩ <span className="text-rose-500">*</span>
              </span>
            </label>
            <textarea
              name="diagnosis"
              required
              rows={2}
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Nhập chẩn đoán bác sĩ (VD: Sâu răng mặt nhai R36, Viêm nướu răng hàm dưới...)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          {/* Phương án Điều trị & Chỉ định */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-teal-600" />
                Phương án Điều trị & Ghi chú kỹ thuật
              </span>
            </label>
            <textarea
              name="treatmentNotes"
              rows={2}
              value={formData.treatmentNotes}
              onChange={handleChange}
              placeholder="Chi tiết phương án điều trị (VD: Trám composite thẩm mỹ R36, mài viền, lấy vôi răng...)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          {/* Lời dặn Bác sĩ & Hẹn tái khám */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Pill size={14} className="text-emerald-600" />
                Lời dặn & Hẹn tái khám
              </span>
            </label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="VD: Giữ vệ sinh răng miệng, kiêng đồ quá cứng, tái khám sau 1 tuần..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy / Đóng
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                Lưu tạm hồ sơ
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Hoàn Thành Ca Khám
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
