import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, Send, CheckCircle2, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDentistsList } from '../../../../services/dentist.service';

const QUICK_REASONS = [
  'Tái khám kiểm tra định kỳ',
  'Kiểm tra vết mổ / Tháo chỉ',
  'Điều trị tủy đợt 2',
  'Gắn mão sứ / Thử răng',
  'Theo dõi niềng răng / Siết mắc cài',
  'Kiểm tra khớp cắn & Nhai',
];

export default function CreateFollowUpModal({
  isOpen,
  onClose,
  onSaveFollowUp,
  currentDoctorName,
  patient,
  treatmentSessions = [],
  selectedSessionId,
  type = 'create', // 'create' | 'edit'
  followUpData = null,
  presetDate = null,
}) {
  const [dentists, setDentists] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(false);

  // Form states
  const [examinationResultId, setExaminationResultId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(true);

  // Notification Options: Send Email, Send SMS, or both
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Fetch dentists list
  useEffect(() => {
    if (isOpen) {
      loadDentists();
    }
  }, [isOpen]);

  const loadDentists = async () => {
    setLoadingDentists(true);
    try {
      const res = await getDentistsList();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setDentists(list);
    } catch (err) {
      console.warn('Cannot load dentists:', err);
    } finally {
      setLoadingDentists(false);
    }
  };

  // Populate form data on open / edit
  useEffect(() => {
    if (!isOpen) return;

    if (type === 'edit' && followUpData) {
      setExaminationResultId(followUpData.examinationResultId || '');
      setDentistId(followUpData.dentistId || '');
      
      if (followUpData.followUpDate) {
        // Format ISO string to datetime-local format: YYYY-MM-DDTHH:mm
        const d = new Date(followUpData.followUpDate);
        if (!isNaN(d.getTime())) {
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setFollowUpDate(localISOTime);
        } else {
          setFollowUpDate(followUpData.followUpDate.slice(0, 16));
        }
      } else {
        setFollowUpDate('');
      }

      setReason(followUpData.reason || '');
      setNote(followUpData.note || '');
      setStatus(followUpData.status !== undefined ? followUpData.status : true);
      setSendEmail(false); // Don't re-send by default on edit unless checked
      setSendSms(false);
    } else {
      // Default Create mode
      if (selectedSessionId && selectedSessionId !== 'ALL') {
        setExaminationResultId(selectedSessionId);
      } else if (treatmentSessions.length > 0) {
        setExaminationResultId(treatmentSessions[0].id);
      } else {
        setExaminationResultId('');
      }

      setDentistId('');
      
      // Default follow-up date: presetDate or 7 days from now at 09:00 AM
      const targetDate = presetDate ? new Date(presetDate) : new Date();
      if (!presetDate) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      if (targetDate.getHours() === 0 && targetDate.getMinutes() === 0) {
        targetDate.setHours(9, 0, 0, 0);
      }
      const tzOffset = targetDate.getTimezoneOffset() * 60000;
      const defaultTimeStr = new Date(targetDate.getTime() - tzOffset).toISOString().slice(0, 16);
      setFollowUpDate(defaultTimeStr);

      setReason('Tái khám kiểm tra định kỳ');
      setNote('');
      setStatus(true);
      setSendEmail(true);
      setSendSms(true);
    }
  }, [isOpen, type, followUpData, selectedSessionId, treatmentSessions, presetDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!followUpDate) {
      toast.error('Vui lòng chọn thời gian tái khám');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        examinationResultId: examinationResultId || null,
        patientId: patient?.id,
        patientCode: patient?.patientCode,
        dentistId: dentistId || null,
        followUpDate: new Date(followUpDate).toISOString(),
        reason: reason.trim(),
        note: note.trim(),
        status,
        sendEmail,
        sendSms,
      };

      await onSaveFollowUp(payload, type === 'edit' ? followUpData?.id : null);
      onClose();
    } catch (err) {
      console.error('Submit follow-up error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-700 to-emerald-800 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="text-teal-200" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {type === 'edit' ? 'Cập Nhật Lịch Tái Khám Bệnh Nhân' : 'Lên Lịch Tái Khám Mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-teal-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Patient Header Summary */}
        {patient && (
          <div className="bg-teal-50/70 border-b border-teal-100 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{patient.fullName}</span>
              {patient.patientCode && (
                <span className="rounded bg-teal-100 border border-teal-200 text-teal-900 text-[10px] font-extrabold px-1.5 py-0.5">
                  {patient.patientCode}
                </span>
              )}
              <span className="text-slate-500">
                ({patient.gender === 'FEMALE' ? 'Nữ' : patient.gender === 'MALE' ? 'Nam' : patient.gender || ''})
              </span>
            </div>
            <div className="text-slate-600 font-medium">
              SĐT: <strong className="text-slate-800">{patient.phone || patient.phoneNumber || '—'}</strong>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Chọn Đợt khám & Bác sĩ phụ trách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Chọn đợt khám (Treatment Session):
              </label>
              <select
                value={examinationResultId}
                onChange={(e) => setExaminationResultId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 outline-hidden cursor-pointer"
              >
                <option value="">-- Không liên kết đợt khám cụ thể --</option>
                {treatmentSessions.map((s, idx) => (
                  <option key={s.id || idx} value={s.id}>
                    Đợt {treatmentSessions.length - idx} — {s.examinationDate ? s.examinationDate.split('T')[0] : 'Chưa rõ ngày'} {s.chiefComplaint ? `(${s.chiefComplaint})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Bác sĩ phụ trách tái khám:
              </label>
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 outline-hidden cursor-pointer"
              >
                <option value="">-- Chọn bác sĩ ({currentDoctorName ? `Mặc định: ${currentDoctorName}` : 'Hệ thống'}) --</option>
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.user?.fullName || `BS. ${d.specialization || ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Ngày & Giờ tái khám */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Clock size={13} className="text-teal-700" />
                <span>Thời gian hẹn tái khám <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-600 outline-hidden cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Trạng thái lịch tái khám:
              </label>
              <select
                value={status ? 'true' : 'false'}
                onChange={(e) => setStatus(e.target.value === 'true')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-teal-600 outline-hidden cursor-pointer"
              >
                <option value="true" className="text-emerald-700 font-bold">✓ Xác nhận / Đang chờ tái khám</option>
                <option value="false" className="text-rose-700 font-bold">✕ Đã hủy / Ngưng tái khám</option>
              </select>
            </div>
          </div>

          {/* 3. Lý do tái khám + Gợi ý chọn nhanh */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
              <span>Lý do / Nội dung tái khám:</span>
              <span className="text-[10px] text-slate-400 font-normal">Nhấp gợi ý để chọn nhanh</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Tái khám tháo chỉ, kiểm tra khớp cắn, siết niềng răng..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 outline-hidden mb-1.5"
            />
            {/* Tag gợi ý nhanh */}
            <div className="flex flex-wrap gap-1">
              {QUICK_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="px-2 py-0.5 text-[10px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full transition-colors cursor-pointer"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Ghi chú & Lời dặn nha sĩ */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Ghi chú & Lời dặn của nha sĩ cho bệnh nhân:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc dặn dò cho bệnh nhân (VD: Ăn nhẹ trước khi đến, mang theo phim X-quang...)"
              className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-teal-600 outline-hidden resize-none"
            />
          </div>

          {/* 5. Bộ lựa chọn kênh gửi thông báo (Email / SMS / Cả hai) */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-teal-100 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-teal-900 text-xs">
                <Send size={14} className="text-teal-700" />
                <span>Kênh tự động gửi thông báo lịch tái khám cho bệnh nhân:</span>
              </div>
              <span className="text-[10px] text-teal-700 font-semibold bg-white px-2 py-0.5 rounded border border-teal-200">
                Gửi ngay khi Lưu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className={`flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer select-none ${sendEmail ? 'bg-white border-teal-500 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Mail size={14} className={sendEmail ? 'text-teal-700' : 'text-slate-400'} />
                  <span>Gửi Email thông báo</span>
                </div>
                {patient?.email && (
                  <span className="text-[10px] text-slate-500 truncate ml-auto" title={patient.email}>
                    ({patient.email})
                  </span>
                )}
              </label>

              <label className={`flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer select-none ${sendSms ? 'bg-white border-teal-500 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <MessageSquare size={14} className={sendSms ? 'text-emerald-700' : 'text-slate-400'} />
                  <span>Gửi SMS Brandname</span>
                </div>
                {(patient?.phone || patient?.phoneNumber) && (
                  <span className="text-[10px] text-slate-500 truncate ml-auto">
                    ({patient.phone || patient.phoneNumber})
                  </span>
                )}
              </label>
            </div>

            <p className="text-[11px] text-teal-800 italic">
              * Hệ thống Nha khoa Crown Dental sẽ tự động gửi thông tin lịch tái khám đầy đủ qua các kênh đã tích chọn ở trên.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{submitting ? 'Đang lưu...' : type === 'edit' ? 'Cập nhật lịch tái khám' : 'Lưu & Gửi lịch tái khám'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
