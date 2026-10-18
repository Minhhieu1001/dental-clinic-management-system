import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  Calendar,
  Stethoscope,
  Save,
  User,
  X,
  Clock,
  Building2,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import {
  CLINICAL_PROCEDURE_TEMPLATES,
  VISIT_STATUS_BUTTON_OPTIONS,
} from '../clinicalExaminationHelpers';
import {
  createTreatmentVisit,
  updateTreatmentVisit,
} from '../../../services/treatmentVisits.Service';
import { getDentistAddressById } from '../../../services/dentist.service';

export function TreatmentVisitModal({
  isOpen,
  onClose,
  mode = 'ADD', // 'ADD' | 'EDIT'
  targetPhaseId,
  phaseName,
  phaseOrder,
  currentPhase = null,
  initialData = null,
  loggedInDoctorName = '',
  onSaveVisit,
}) {
  const { user } = useAuth();
  const [visitFormName, setVisitFormName] = useState('');
  const [visitFormOrder, setVisitFormOrder] = useState(1);
  const [visitFormDate, setVisitFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitFormStatus, setVisitFormStatus] = useState('IN_PROGRESS');
  const [visitFormNotes, setVisitFormNotes] = useState('');
  const [visitFormDoctor, setVisitFormDoctor] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [isLoadingBranch, setIsLoadingBranch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tên và số thứ tự giai đoạn
  const resolvedPhaseId = currentPhase?.phase_id || targetPhaseId || '';
  const resolvedPhaseName = currentPhase?.phase_name || phaseName || 'Giai đoạn điều trị';
  const resolvedPhaseOrder = currentPhase?.phase_order || phaseOrder || 1;

  // Lấy chi nhánh của bác sĩ trực tiếp từ user.id
  const fetchDoctorBranch = async () => {
    if (!user?.dentistId) return;
    setIsLoadingBranch(true);
    try {
      console.log("user ", user)
      const res = await getDentistAddressById(user.dentistId);
      setBranchName(res.branchName || '');
      setBranchAddress(res.branchAddress || '');
    } catch (err) {
      console.warn('Không thể lấy địa chỉ cơ sở của bác sĩ:', err);
    } finally {
      setIsLoadingBranch(false);
    }
  };

  // Đồng bộ form theo dữ liệu truyền vào khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'EDIT' && initialData) {
        setVisitFormName(initialData.visitName || '');
        setVisitFormOrder(Number(initialData.visitOrder) || 1);
        setVisitFormDate(initialData.start_date || new Date().toISOString().split('T')[0]);
        setVisitFormStatus(initialData.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS');
        setVisitFormNotes(initialData.clinical_notes || '');
        setVisitFormDoctor(initialData.assigned_dentist || loggedInDoctorName || '');

        setBranchName(initialData.branchName || '');
        setBranchAddress(initialData.branchAddress || '');
      } else {
        const nextOrder = Number(initialData?.visitOrder) || 1;
        setVisitFormName(initialData?.visitName || `Buổi ${nextOrder}: `);
        setVisitFormOrder(nextOrder);
        setVisitFormDate(new Date().toISOString().split('T')[0]);
        setVisitFormStatus('IN_PROGRESS');
        setVisitFormNotes('');

        let doctorName = loggedInDoctorName || initialData?.assigned_dentist || '';
        if (!doctorName && user?.username) {
          doctorName = 'BS. ' + user.username;
        }
        setVisitFormDoctor(doctorName);

        fetchDoctorBranch();
      }
      setIsSubmitting(false);
    }
  }, [isOpen, mode, initialData, loggedInDoctorName, user]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!visitFormName.trim()) {
      toast.error('Vui lòng nhập tên buổi điều trị!');
      return;
    }

    const visitPayload = {
      visitName: visitFormName.trim(),
      visitOrder: Number(visitFormOrder) || 1,
      startDate: visitFormDate || new Date().toISOString().split('T')[0],
      status: visitFormStatus || 'IN_PROGRESS',
      clinicalNotes: visitFormNotes.trim(),
      assignedDentist: visitFormDoctor.trim(),
      branchName: branchName,
      branchAddress: branchAddress,
      facilityName: branchName,
      facilityAddress: branchAddress,
    };

    setIsSubmitting(true);
    const actionText = mode === 'ADD' ? 'Tạo buổi điều trị' : 'Cập nhật buổi điều trị';
    const toastId = toast.loading(`Đang ${actionText.toLowerCase()}...`);

    try {
      let savedVisit;
      if (mode === 'ADD') {
        if (!resolvedPhaseId || String(resolvedPhaseId).startsWith('ph-')) {
          throw new Error('Giai đoạn điều trị chưa tồn tại trong cơ sở dữ liệu. Vui lòng lưu phác đồ trước khi thêm buổi khám.');
        }
        const res = await createTreatmentVisit(resolvedPhaseId, visitPayload);
        savedVisit = {
          visitId: res?.id || res?.visitId || `vis-${Date.now()}`,
          visitName: res?.visitName || visitPayload.visitName,
          visitOrder: res?.visitOrder || visitPayload.visitOrder,
          start_date: res?.startDate || visitPayload.startDate,
          status: res?.status || visitPayload.status,
          clinical_notes: res?.clinicalNotes ?? visitPayload.clinicalNotes,
          assigned_dentist: res?.assignedDentist || visitPayload.assignedDentist,
          branchName: branchName,
          branchAddress: branchAddress,
        };
      } else {
        const visitId = initialData?.visitId || initialData?.id;
        if (!visitId || String(visitId).startsWith('vis-')) {
          throw new Error('Không tìm thấy mã định danh buổi khám trong cơ sở dữ liệu.');
        }
        const res = await updateTreatmentVisit(visitId, visitPayload);
        savedVisit = {
          visitId: res?.id || res?.visitId || visitId,
          visitName: res?.visitName || visitPayload.visitName,
          visitOrder: res?.visitOrder || visitPayload.visitOrder,
          start_date: res?.startDate || visitPayload.startDate,
          status: res?.status || visitPayload.status,
          clinical_notes: res?.clinicalNotes ?? visitPayload.clinicalNotes,
          assigned_dentist: res?.assignedDentist || visitPayload.assignedDentist,
          branchName: branchName,
          branchAddress: branchAddress,
        };
      }

      toast.success(
        mode === 'ADD'
          ? `Đã tạo "${savedVisit.visitName}" thành công!`
          : `Đã cập nhật kết quả lâm sàng cho "${savedVisit.visitName}"!`,
        { id: toastId }
      );

      // Chỉ khi API thành công mới truyền dữ liệu lên parent để cập nhật state
      if (onSaveVisit) {
        onSaveVisit(resolvedPhaseId, savedVisit, mode);
      }

      // Chỉ đóng modal khi API thành công
      onClose();
    } catch (err) {
      console.error(`Lỗi khi ${actionText.toLowerCase()}:`, err);
      toast.error(`Lỗi: ${err?.response?.data?.message || err.message}`, { id: toastId });
      // Giữ nguyên modal mở, không cập nhật state của cha
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop mờ êm ái */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Modal Container chuẩn ERP - Bo góc và đổ bóng cao cấp */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200"
          >
            {/* Header Modal */}
            <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-950 px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-inner">
                  {mode === 'ADD' ? <CalendarCheck size={20} /> : <Stethoscope size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    {mode === 'ADD' ? 'Tạo Buổi Điều Trị Mới' : 'Cập Nhật Kết Quả Buổi Khám'}
                  </h3>
                  <p className="text-xs text-indigo-200 font-normal">
                    {resolvedPhaseName} · Giai đoạn #{resolvedPhaseOrder}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X size={17} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Hàng 1: Thứ tự buổi (Tự động, khóa không cho sửa) & Tên buổi điều trị */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <span>Thứ tự buổi</span>
                    <span className="text-[10px] text-indigo-600 font-medium normal-case">(Tự động)</span>
                  </label>
                  <div
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-100 px-3 flex items-center justify-between font-bold text-slate-800 text-xs cursor-not-allowed select-none shadow-inner"
                    title="Thứ tự buổi tự động tăng/giảm theo số buổi, không được sửa"
                  >
                    <span>{visitFormOrder}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Khóa tự động</span>
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide">
                    Tên buổi điều trị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={visitFormName}
                    onChange={(e) => setVisitFormName(e.target.value)}
                    placeholder="VD: Buổi 1: Mở tủy, bơm rửa sát khuẩn..."
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Hàng 2: Ngày hẹn, Bác sĩ phụ trách, Trạng thái (Không dùng select box) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Calendar size={13} className="text-slate-500" />
                    <span>Ngày thực hiện</span>
                  </label>
                  <input
                    type="date"
                    value={visitFormDate}
                    onChange={(e) => setVisitFormDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 bg-white shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <User size={13} className="text-slate-500" />
                    <span>Bác sĩ thực hiện</span>
                  </label>
                  <input
                    type="text"
                    value={visitFormDoctor}
                    onChange={(e) => setVisitFormDoctor(e.target.value)}
                    placeholder="Họ tên bác sĩ"
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 bg-white shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Clock size={13} className="text-slate-500" />
                    <span>Trạng thái buổi</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 h-9 items-center">
                    {VISIT_STATUS_BUTTON_OPTIONS.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setVisitFormStatus(st.value)}
                        className={`h-full text-xs rounded-lg border transition-all cursor-pointer text-center font-semibold px-1 whitespace-nowrap flex items-center justify-center ${visitFormStatus === st.value
                          ? st.active
                          : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hàng: Thông tin cơ sở khám (Tự động từ bác sĩ - Chỉ đọc) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Building2 size={13} className="text-teal-600" />
                    <span>Cơ sở thực hiện</span>
                    <span className="text-[10px] text-slate-400 font-medium normal-case">(Chỉ đọc)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={branchName}
                    placeholder={isLoadingBranch ? 'Đang tải thông tin cơ sở...' : 'Chưa có thông tin cơ sở'}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-800 outline-none cursor-not-allowed select-none shadow-inner"
                    title="Cơ sở làm việc của bác sĩ (Khóa tự động)"
                  />
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <MapPin size={13} className="text-rose-500" />
                    <span>Địa chỉ cơ sở</span>
                    <span className="text-[10px] text-slate-400 font-medium normal-case">(Chỉ đọc)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={branchAddress}
                    placeholder={isLoadingBranch ? 'Đang tải địa chỉ...' : 'Chưa có địa chỉ cơ sở'}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-700 outline-none cursor-not-allowed select-none shadow-inner truncate"
                    title={branchAddress || 'Địa chỉ cơ sở (Khóa tự động)'}
                  />
                </div>
              </div>

              {/* Hàng 3: Ghi chép lâm sàng & Diễn biến thủ thuật */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-indigo-600" />
                    <span>{mode === 'ADD' ? 'Kế hoạch thao tác kỹ thuật:' : 'Kết quả thao tác & Diễn biến lâm sàng:'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Ghi chú diễn biến, thuốc, vật liệu và dặn dò</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={visitFormNotes}
                  onChange={(e) => setVisitFormNotes(e.target.value)}
                  placeholder="Ghi nhận chi tiết kết quả thực hiện, tình trạng răng bệnh nhân và dặn dò chăm sóc sau can thiệp..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 leading-relaxed font-normal bg-white resize-y shadow-2xs"
                />

                {/* Gợi ý mẫu nhanh */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Gợi ý mẫu:</span>
                  {CLINICAL_PROCEDURE_TEMPLATES.map((tmpl, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => setVisitFormNotes(tmpl)}
                      className="text-[11px] text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      {tmpl.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{mode === 'ADD' ? 'Lưu buổi điều trị' : 'Lưu kết quả lâm sàng'}</span>
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

export default TreatmentVisitModal;
