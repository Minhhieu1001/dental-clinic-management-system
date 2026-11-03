import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, FileText, Send, CheckCircle2, AlertCircle, Mail, MessageSquare, Sparkles, UserCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../hooks/useAuth';
import { getDentistsList } from '../../../../services/dentist.service';
import { getBranches } from '../../../../services/clinic.service';

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
  const { user } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(false);

  // Form states
  const [examinationResultId, setExaminationResultId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(true);

  // Notification Options: Send Email, Send SMS, or both
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Determine logged-in doctor name
  const loggedInDoctorName = useMemo(() => {
    if (type === 'edit' && followUpData?.dentistName) {
      return followUpData.dentistName;
    }
    return (
      currentDoctorName ||
      user?.fullName ||
      user?.name ||
      (user?.username ? `BS. ${user.username}` : 'ThS. BS. Nguyễn Thị Phương')
    );
  }, [type, followUpData, currentDoctorName, user]);

  // Fetch dentists list
  useEffect(() => {
    if (isOpen) {
      loadDentists();
      loadBranches();
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

  const loadBranches = async () => {
    try {
      const list = await getBranches();
      setBranches(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Cannot load branches:', err);
      toast.error('Không thể tải danh sách chi nhánh');
    }
  };

  // Auto-match logged-in doctor ID from dentists list
  useEffect(() => {
    if (!isOpen) return;
    if (user?.id || loggedInDoctorName) {
      const found = dentists.find(
        (d) =>
          d.id === user?.id ||
          d.userId === user?.id ||
          d.user?.id === user?.id ||
          d.fullName === loggedInDoctorName ||
          (d.user && d.user.fullName === loggedInDoctorName)
      );
      if (found) {
        setDentistId(found.id);
      } else if (user?.dentistId) {
        setDentistId(user.dentistId);
      }
    }
  }, [isOpen, dentists, user, loggedInDoctorName]);

  // Populate form data on open / edit
  useEffect(() => {
    if (!isOpen) return;

    if (type === 'edit' && followUpData) {
      setExaminationResultId(followUpData.examinationResultId || '');
      setDentistId(followUpData.dentistId || '');
      setBranchId(followUpData.branchId || patient?.branchId || '');

      if (followUpData.followUpDate) {
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
      setSendEmail(false);
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
      setBranchId(patient?.branchId || '');

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
  }, [isOpen, type, followUpData, selectedSessionId, treatmentSessions, presetDate, patient]);

  if (!isOpen) return null;

  // Helper to set quick add days
  const handleQuickAddDays = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    target.setHours(9, 0, 0, 0);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const dateStr = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setFollowUpDate(dateStr);
  };

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
        branchId: branchId || null,
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
      <div className="relative w-full max-w-2xl rounded-sm bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-teal-800 px-5 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="text-teal-200" size={18} />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">
                {type === 'edit' ? 'Cập Nhật Lịch Tái Khám Bệnh Nhân' : 'Lên Lịch Tái Khám Mới'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-teal-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Patient Header Summary */}
        {patient && (
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center">
                {patient.fullName?.charAt(0) || 'BN'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 mr-2">{patient.fullName}</span>
                {patient.patientCode && (
                  <span className="rounded-sm bg-teal-100 border border-teal-300 text-teal-950 text-[10px] font-extrabold px-1.5 py-0.5 font-mono">
                    {patient.patientCode}
                  </span>
                )}
                <span className="text-slate-600 text-[11px] ml-2 font-medium">
                  ({patient.gender === 'FEMALE' ? 'Nữ' : patient.gender === 'MALE' ? 'Nam' : patient.gender || ''})
                </span>
              </div>
            </div>
            <div className="text-slate-700 font-bold text-[11px]">
              SĐT: <span className="text-teal-900">{patient.phone || patient.phoneNumber || '—'}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Chọn Đợt khám & Bác sĩ phụ trách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Chọn đợt khám (Treatment Session):
              </label>
              <select
                value={examinationResultId}
                onChange={(e) => setExaminationResultId(e.target.value)}
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden cursor-pointer shadow-2xs font-semibold"
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
              <label className="block text-slate-800 font-bold mb-1">
                Bác sĩ phụ trách tái khám:
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={loggedInDoctorName}
                  className="w-full rounded-sm border border-slate-300 bg-slate-100/90 px-3 py-1.5 text-xs text-slate-800 font-extrabold shadow-2xs cursor-not-allowed select-none focus:outline-hidden"
                />
                <UserCheck size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none" />
              </div>
            </div>

          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Chi nhánh tái khám:
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden cursor-pointer shadow-2xs font-semibold"
            >
              <option value="">-- Chọn chi nhánh --</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}{branch.branchCode ? ` (${branch.branchCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Ngày & Giờ tái khám + Fast Date Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-800 font-bold flex items-center gap-1">
                  <Clock size={14} className="text-teal-700" />
                  <span>Thời gian hẹn tái khám <span className="text-rose-500">*</span></span>
                </label>
              </div>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden cursor-pointer shadow-2xs"
              />
              {/* Fast Presets */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Hẹn nhanh:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(3)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-teal-800 bg-slate-100 hover:bg-teal-100 rounded-sm border border-slate-300 cursor-pointer transition-colors"
                >
                  +3 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(7)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-teal-800 bg-slate-100 hover:bg-teal-100 rounded-sm border border-slate-300 cursor-pointer transition-colors"
                >
                  +1 tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(14)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-teal-800 bg-slate-100 hover:bg-teal-100 rounded-sm border border-slate-300 cursor-pointer transition-colors"
                >
                  +2 tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(30)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-teal-800 bg-slate-100 hover:bg-teal-100 rounded-sm border border-slate-300 cursor-pointer transition-colors"
                >
                  +1 tháng
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Trạng thái lịch tái khám:
              </label>
              <select
                value={status ? 'true' : 'false'}
                onChange={(e) => setStatus(e.target.value === 'true')}
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="true" className="text-emerald-700 font-bold">✓ Xác nhận / Đang chờ tái khám</option>
                <option value="false" className="text-rose-700 font-bold">✕ Đã hủy / Ngưng tái khám</option>
              </select>
              <p className="text-[10px] text-slate-500 italic pt-1.5">
                Trạng thái "Xác nhận" sẽ tự động kích hoạt tiến trình gửi tin nhắn nhắc lịch.
              </p>
            </div>
          </div>

          {/* 3. Lý do tái khám + Gợi ý chọn nhanh */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 flex items-center justify-between">
              <span>Lý do / Nội dung tái khám:</span>
              <span className="text-[10px] text-slate-500 font-medium">Nhấp gợi ý để chọn nhanh</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Tái khám tháo chỉ, kiểm tra khớp cắn, siết niềng răng..."
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden shadow-2xs mb-2"
            />
            {/* Tag gợi ý nhanh */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-sm border transition-all cursor-pointer ${
                    reason === r
                      ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                      : 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border-teal-200'
                  }`}
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Ghi chú & Lời dặn nha sĩ */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Ghi chú & Lời dặn của nha sĩ cho bệnh nhân:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc dặn dò cho bệnh nhân (VD: Ăn nhẹ trước khi đến, mang theo phim X-quang...)"
              className="w-full rounded-sm border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden resize-none shadow-2xs"
            />
          </div>

          {/* 5. Bộ lựa chọn kênh gửi thông báo (Email / SMS / Cả hai) */}
          <div className="rounded-sm border border-teal-300 bg-teal-50/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-teal-950 text-xs">
                <Send size={14} className="text-teal-700" />
                <span>Gửi thông báo lịch tái khám cho bệnh nhân:</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className={`flex items-center gap-2 p-2.5 rounded-sm border transition-all cursor-pointer select-none ${sendEmail ? 'bg-white border-teal-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded-sm text-teal-700 focus:ring-teal-600 h-4 w-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <Mail size={15} className={sendEmail ? 'text-teal-700' : 'text-slate-400'} />
                  <span>Email</span>
                </div>
                {patient?.email && (
                  <span className="text-[10px] text-slate-500 truncate ml-auto font-medium" title={patient.email}>
                    ({patient.email})
                  </span>
                )}
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-sm border transition-all cursor-pointer select-none ${sendSms ? 'bg-white border-teal-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded-sm text-teal-700 focus:ring-teal-600 h-4 w-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <MessageSquare size={15} className={sendSms ? 'text-emerald-700' : 'text-slate-400'} />
                  <span>SMS</span>
                </div>
                {(patient?.phone || patient?.phoneNumber) && (
                  <span className="text-[10px] text-slate-500 truncate ml-auto font-medium">
                    ({patient.phone || patient.phoneNumber})
                  </span>
                )}
              </label>
            </div>

            <p className="text-[11px] text-teal-900 italic font-medium">
              * Hệ thống Nha khoa Crown Dental sẽ tự động lên lịch nhắc lịch trước 1 ngày & trước 1 giờ qua các kênh đã chọn.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 rounded-sm transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Đang lưu...' : type === 'edit' ? 'Cập nhật lịch tái khám' : 'Lưu & Gửi lịch tái khám'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
