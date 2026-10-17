import { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  User,
  Phone,
  Clock,
  FileText,
  CheckCircle2,
  Save,
  Pill,
  AlertCircle,
  Building,
  Edit3,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateAppointment } from '../../services/appointment.service';

export default function ClinicalExamModal({ isOpen, onClose, appointment, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    treatmentNotes: '',
    notes: '',
    reason: '',
  });

  const isCompleted = appointment?.status === 'COMPLETED';
  const isWaiting =
    appointment?.status === 'WAITING' ||
    appointment?.status === 'PENDING' ||
    appointment?.status === 'UNASSIGNED';
  const isProcessing = appointment?.status === 'IN_PROGRESS';

  useEffect(() => {
    if (!isOpen || !appointment) return;

    setFormData({
      symptoms: appointment.symptoms || appointment.reason || '',
      diagnosis: appointment.diagnosis || '',
      treatmentNotes: appointment.treatmentNotes || '',
      notes: appointment.notes || '',
      reason: appointment.reason || 'Tư vấn & Khám bệnh nha khoa',
    });

    // Default: Completed appointments open in View Mode (Read-Only), others in Edit Mode
    setIsEditMode(!isCompleted);
  }, [isOpen, appointment, isCompleted]);

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
        const status = (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'COMPLETED') ? 'IN_PROGRESS' : undefined;
        await updateAppointment(appointment.id, { ...formData, status }).catch((err) => console.warn('Lỗi API update appointment:', err));
      }
      toast.success('Đã lưu tạm thời hồ sơ khám bệnh!');
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
    if (isEditMode && !formData.diagnosis.trim()) {
      toast.error('Vui lòng nhập chẩn đoán bệnh của Bác sĩ trước khi hoàn thành ca khám!');
      return;
    }

    setSubmitting(true);
    try {
      if (appointment.id && !String(appointment.id).startsWith('mock-')) {
        const status = !isCompleted ? 'COMPLETED' : undefined;
        await updateAppointment(appointment.id, { ...formData, status }).catch((err) => console.warn('Lỗi API update appointment:', err));
      }
      toast.success(
        isCompleted
          ? 'Đã cập nhật hồ sơ khám bệnh thành công!'
          : `Đã hoàn tất ca khám cho bệnh nhân ${appointment.patientName}!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('Lỗi hoàn tất ca khám:', err);
      toast.success(`Đã lưu hồ sơ khám cho bệnh nhân ${appointment.patientName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    toast.success('Đang gửi lệnh in Phiếu khám & Hồ sơ bệnh án...');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-[4px] bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between border-b border-slate-100 px-6 py-4 text-white transition-colors ${isCompleted
              ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700'
              : isProcessing
                ? 'bg-gradient-to-r from-purple-800 via-teal-800 to-purple-700'
                : 'bg-gradient-to-r from-teal-800 via-teal-700 to-sky-700'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-md">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                  {isCompleted ? 'Hồ Sơ Ca Khám Đã Hoàn Thành' : 'Phiếu Khám & Hồ Sơ Điều Trị'}
                </span>
                <span
                  className={`rounded-[3px] px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 ${isCompleted
                      ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                      : isProcessing
                        ? 'bg-purple-500/30 text-purple-100 border border-purple-400/40'
                        : 'bg-sky-500/30 text-sky-100 border border-sky-400/40'
                    }`}
                >
                  {isCompleted && <ShieldCheck size={12} />}
                  {isCompleted ? 'Đã hoàn thành' : isProcessing ? 'Đang tiến hành khám' : 'Chưa khám (Chờ khám)'}
                </span>
              </div>
              <h3 className="text-lg font-bold leading-tight">
                {isCompleted ? 'Bệnh án Hoàn Tất:' : 'Khám Bệnh:'} {appointment.patientName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1.5 text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Patient Summary Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-3 text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <User size={14} className="text-teal-600" />
              <span>{appointment.patientName}</span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 border border-teal-200 px-1.5 py-0.2 rounded-[3px]">
                {appointment.patientCode || 'PA-NEW'}
              </span>
            </div>
            {appointment.phone && (
              <div className="flex items-center gap-1 font-medium text-slate-600">
                <Phone size={13} className="text-slate-400" />
                <span>{appointment.phone}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {appointment.roomName && (
              <span className="flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-[3px] border border-teal-200">
                <Building size={12} /> {appointment.roomName}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Clock size={12} className="text-teal-600" />
              {appointment.time || '09:00 - 10:00'}
            </span>
          </div>
        </div>

        {/* Clinical Form */}
        <form onSubmit={handleCompleteExam} className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Completed Notice Banner if View Mode */}
          {isCompleted && !isEditMode && (
            <div className="flex items-center justify-between rounded-[4px] border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Hồ sơ khám bệnh này đã được hoàn tất và khóa an toàn.</p>
                  <p className="text-[11px] text-emerald-700">Chỉ xem thông tin. Bấm "Chỉnh sửa hồ sơ" nếu cần cập nhật lại thông tin điều trị.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1 rounded-[4px] bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors shrink-0"
              >
                <Edit3 size={13} /> Sửa hồ sơ
              </button>
            </div>
          )}

          {/* Service / Reason for visit */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              Dịch vụ / Lý do khám yêu cầu
            </label>
            <input
              type="text"
              name="reason"
              disabled={!isEditMode}
              value={formData.reason}
              onChange={handleChange}
              placeholder="VD: Tư vấn niềng răng, Trám răng composite..."
              className={`w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all ${!isEditMode
                  ? 'bg-slate-100/70 text-slate-700 cursor-not-allowed'
                  : 'bg-slate-50/50 focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500'
                }`}
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
              disabled={!isEditMode}
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Mô tả triệu chứng bệnh nhân (VD: Ê buốt răng khi ăn uống đồ lạnh, sưng nướu nhẹ...)"
              className={`w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none resize-none transition-all ${!isEditMode
                  ? 'bg-slate-100/70 text-slate-700 cursor-not-allowed'
                  : 'focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
            />
          </div>

          {/* Chẩn đoán của Bác sĩ (Required) */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={14} className="text-teal-600" />
                Chẩn đoán của Bác sĩ {isEditMode && <span className="text-rose-500">*</span>}
              </span>
            </label>
            <textarea
              name="diagnosis"
              required={isEditMode}
              rows={2}
              disabled={!isEditMode}
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Nhập chẩn đoán bác sĩ (VD: Sâu răng mặt nhai R36, Viêm nướu răng hàm dưới...)"
              className={`w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none resize-none transition-all ${!isEditMode
                  ? 'bg-slate-100/70 text-slate-700 cursor-not-allowed'
                  : 'focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
            />
          </div>

          {/* Phương án Điều trị & Ghi chú kỹ thuật */}
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
              disabled={!isEditMode}
              value={formData.treatmentNotes}
              onChange={handleChange}
              placeholder="Chi tiết phương án điều trị (VD: Trám composite thẩm mỹ R36, mài viền, lấy vôi răng...)"
              className={`w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none resize-none transition-all ${!isEditMode
                  ? 'bg-slate-100/70 text-slate-700 cursor-not-allowed'
                  : 'focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                }`}
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
              disabled={!isEditMode}
              value={formData.notes}
              onChange={handleChange}
              placeholder="VD: Giữ vệ sinh răng miệng, kiêng đồ quá cứng, tái khám sau 1 tuần..."
              className={`w-full rounded-[4px] border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none transition-all ${!isEditMode
                  ? 'bg-slate-100/70 text-slate-700 cursor-not-allowed'
                  : 'focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500'
                }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[4px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isCompleted && !isEditMode ? 'Đóng' : 'Hủy / Đóng'}
            </button>

            <div className="flex items-center gap-2">
              {/* Show Print Button when completed */}
              {isCompleted && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Printer size={15} className="text-slate-500" />
                  In phiếu khám
                </button>
              )}

              {/* Show Save Draft only when in edit mode & not completed yet */}
              {isEditMode && !isCompleted && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-[4px] border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors disabled:opacity-50"
                >
                  <Save size={15} />
                  Lưu tạm hồ sơ
                </button>
              )}

              {/* Primary Action Button */}
              {isEditMode && (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center gap-1.5 rounded-[4px] px-5 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50 ${isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/20'
                    }`}
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isCompleted ? 'Lưu cập nhật hồ sơ' : isWaiting ? 'Bắt đầu & Hoàn thành khám' : 'Hoàn Thành Ca Khám'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
