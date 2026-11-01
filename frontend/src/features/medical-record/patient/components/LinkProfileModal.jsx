import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, ArrowLeft, ShieldCheck, Link2, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestPatientRelationshipOtp, verifyPatientRelationshipOtp } from '../../../../services/patientRelationship.service';
import { RELATIONSHIP_LABELS, relationshipError, normalizePhone, isValidPhone } from '../../../../utils/relationshipUtils';

const emptyForm = { relatedPatientCode: '', fullName: '', birthday: '', phoneRelatedPatient: '', relationshipType: '' };

export default function LinkProfileModal({ isOpen, onClose, primaryPatient, onLinkSuccess }) {
  const reduceMotion = useReducedMotion();
  const [completed, setCompleted] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [session, setSession] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const otpRefs = useRef([]);
  const busyRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const patientId = primaryPatient?.id || primaryPatient?.patientId;
  const owner = primaryPatient;

  useEffect(() => {
    if (!isOpen || !cooldownUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen, cooldownUntil]);

  const close = () => { if (!busyRef.current) { onClose(); } };

  // Clear the whole form once the closing animation finishes.
  const afterClose = () => {
    setForm(emptyForm);
    setSession(null);
    setCode('');
    setError('');
    setCooldownUntil(0);
    setCompleted(false);
    otpRefs.current = [];
  };
  const change = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const sendOtp = async (event) => {
    event?.preventDefault();
    if (busyRef.current || Date.now() < cooldownUntil) return;
    if (!patientId) { setError('Chưa xác định được hồ sơ chính chủ. Vui lòng tải lại trang.'); return; }
    if (!owner?.phone || !isValidPhone(owner.phone)) {
      setError('Hồ sơ chính chủ chưa có số điện thoại hợp lệ. Vui lòng cập nhật tại phòng khám.'); return;
    }
    if (!owner.email?.trim()) {
      setError('Hồ sơ chính chủ chưa có email nhận OTP. Vui lòng cập nhật tại phòng khám.'); return;
    }
    const payload = session?.payload || {
      ...form, patientId,
      birthday: form.birthday,
      patientPhone: normalizePhone(owner.phone),
      phoneRelatedPatient: normalizePhone(form.phoneRelatedPatient),
      relatedPatientCode: form.relatedPatientCode.trim(), fullName: form.fullName.trim()
    };
    if (!isValidPhone(payload.patientPhone) || !isValidPhone(payload.phoneRelatedPatient)) {
      setError('Số điện thoại phải bắt đầu bằng 0, 84 hoặc +84 và có 9 chữ số phía sau.'); return;
    }
    const birth = new Date(payload.birthday);
    if (!payload.relatedPatientCode || !payload.fullName || !payload.birthday || Number.isNaN(birth.getTime()) || birth > new Date()) {
      setError('Nhập đủ mã bệnh nhân, họ tên và ngày sinh hợp lệ.'); return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await requestPatientRelationshipOtp(payload);
      const data = response.data;
      if (!data?.requestId) throw new Error('Missing OTP request');
      const deadline = Date.parse(data.expiresAt);
      setSession({ requestId: data.requestId, payload, recipientEmail: owner.email });
      setCooldownUntil(Number.isFinite(deadline) ? deadline : Date.now() + (data.resendAfterSeconds || 120) * 1000);
      setNow(Date.now());
      setCode('');
      toast.success('Đã gửi mã OTP đến email hồ sơ chính chủ');
    } catch (failure) {
      setError(relationshipError(failure, 'Không thể gửi OTP. Vui lòng thử lại.'));
    } finally { busyRef.current = false; setBusy(false); }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (busyRef.current || !session) return;
    if (!/^\d{6}$/.test(code)) { setError('Vui lòng nhập đủ 6 chữ số OTP.'); return; }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await verifyPatientRelationshipOtp(session.requestId, code);
      setSession(null);
      setCooldownUntil(0);
      setForm(emptyForm);
      setCode('');
      toast.success('Liên kết hồ sơ thành công');
      setCompleted(true);
      await onLinkSuccess(response.data);
    } catch (failure) {
      setError(relationshipError(failure, 'Không thể xác nhận liên kết. Vui lòng thử lại.'));
    } finally { busyRef.current = false; setBusy(false); }
  };

  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100';
  return (
    <AnimatePresence onExitComplete={afterClose}>
      {isOpen && <motion.div key="link-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        <motion.section role="dialog" aria-modal="true" aria-labelledby="link-profile-title"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 10, scale: reduceMotion ? 1 : 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-white shadow-xl border border-slate-100">
          <header className="flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50 via-emerald-50/40 to-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-200 flex items-center justify-center"><Link2 className="text-teal-600" size={18} /></div>
              <div><h2 id="link-profile-title" className="font-black text-slate-900">Liên kết hồ sơ người thân</h2>
                <p className="mt-1 text-xs text-slate-500">Xác thực thông tin để quản lý và theo dõi bệnh án của người thân</p></div>
            </div>
            <button type="button" aria-label="Đóng" disabled={busy} onClick={close} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </header>
          <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-3 bg-teal-50/40 border-b border-teal-100 text-xs font-bold">
            <span className={!session && !completed ? 'text-teal-700' : 'text-slate-400'}>1. Thông tin</span>
            <span className="h-0.5 flex-1 bg-teal-200" />
            <span className={session ? 'text-teal-700' : 'text-slate-400'}>2. Xác thực OTP</span>
            <span className="h-0.5 flex-1 bg-slate-200" />
            <span className={'flex items-center gap-1 ' + (completed ? 'text-teal-700' : 'text-slate-400')}><CheckCircle2 size={14} />Hoàn tất</span>
          </div>
          <div className="p-5 sm:p-7 space-y-5">
            <p className="flex gap-2 text-xs text-teal-800 bg-teal-50 rounded-2xl border border-teal-100 p-3.5"><ShieldCheck className="shrink-0" size={18} />
              <span>Thông tin phải khớp hồ sơ đã đăng ký tại phòng khám. OTP được gửi đến email hồ sơ chính chủ{owner?.email ? ': ' + owner.email : '.'}</span></p>
            {!owner && <p role="status" className="text-xs text-slate-500">Đang chuẩn bị thông tin hồ sơ chính chủ...</p>}
            {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl">{error}</p>}
            {completed ? (
              <div role="status" className="py-8 text-center space-y-3">
                <CheckCircle2 size={48} className="mx-auto text-teal-600" />
                <h3 className="font-bold text-lg text-slate-900">Liên kết hồ sơ thành công</h3>
                <p className="text-sm text-slate-500">Nhấn dấu X để đóng. Bạn có thể chọn hồ sơ vừa liên kết trong mục Quản lý.</p>
              </div>
            ) : !session ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-bold text-slate-700">
                  <label>1. Mã bệnh nhân <span className="text-rose-500">*</span>
                    <input className={inputClass} name="relatedPatientCode" maxLength={255} required value={form.relatedPatientCode} onChange={change} placeholder="PA-..." />
                  </label>
                  <label>2. Họ và tên người thân <span className="text-rose-500">*</span>
                    <input className={inputClass} name="fullName" maxLength={255} required value={form.fullName} onChange={change} />
                  </label>
                  <label>3. Ngày sinh <span className="text-rose-500">*</span>
                    <input className={inputClass} name="birthday" type="date" required value={form.birthday} onChange={change} />
                  </label>
                  <label>4. Số điện thoại trên hồ sơ người thân <span className="text-rose-500">*</span>
                    <input className={inputClass} name="phoneRelatedPatient" type="tel" required value={form.phoneRelatedPatient} onChange={change} />
                  </label>
                  <label className="sm:col-span-2">5. Mối quan hệ với bạn
                    <select className={inputClass} name="relationshipType" required value={form.relationshipType} onChange={change}>
                      <option value="" disabled>Chọn mối quan hệ</option>
                      {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </fieldset>
                <button disabled={busy || !owner || remaining > 0} className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {busy ? 'Đang gửi OTP...' : remaining > 0 ? 'Gửi lại sau ' + remaining + ' giây' : 'Tiếp tục xác thực'}<ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={verify} className="space-y-5 text-sm">
                <p className="text-center text-slate-600">Mã xác nhận đã gửi đến <strong className="text-teal-700">{session.recipientEmail}</strong> của hồ sơ chính chủ để liên kết <strong>{session.payload.fullName}</strong>.</p>
                <fieldset className="flex justify-center gap-2 sm:gap-3" disabled={busy}>
                  <legend className="w-full text-center mb-3 font-bold text-slate-700">Nhập mã OTP gồm 6 chữ số</legend>
                  {Array.from({ length: 6 }, (_, index) => (
                    <input key={index} ref={(element) => { otpRefs.current[index] = element; }}
                      autoFocus={index === 0} autoComplete={index === 0 ? 'one-time-code' : 'off'} inputMode="numeric"
                      aria-label={'Chữ số OTP ' + (index + 1)} maxLength={6}
                      className="w-10 sm:w-12 h-12 sm:h-14 rounded-xl border border-slate-200 text-center text-xl font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      value={code[index] === ' ' ? '' : code[index] || ''}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '');
                        if (digits.length === 6) { setCode(digits); otpRefs.current[5]?.focus(); return; }
                        const values = code.padEnd(6, ' ').split('');
                        values[index] = digits.slice(-1) || ' ';
                        setCode(values.join(''));
                        if (digits && index < 5) otpRefs.current[index + 1]?.focus();
                      }}
                      onKeyDown={(event) => { if (event.key === 'Backspace' && (!code[index] || code[index] === ' ') && index > 0) otpRefs.current[index - 1]?.focus(); }}
                      onPaste={(event) => {
                        event.preventDefault();
                        const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (digits.length === 6) { setCode(digits); otpRefs.current[5]?.focus(); }
                      }} />
                  ))}
                </fieldset>
                <p className="text-slate-500">{remaining > 0 ? 'Mã có hiệu lực trong ' + remaining + ' giây.' : 'Mã đã hết hạn. Vui lòng gửi lại OTP.'}</p>
                <button disabled={busy || remaining === 0 || !/^\d{6}$/.test(code)} className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white disabled:opacity-50">
                  {busy ? 'Đang xử lý...' : 'Xác nhận liên kết'}
                </button>
                <div className="flex items-center justify-between">
                  <button type="button" disabled={busy} onClick={() => { setSession(null); setError(''); }} className="flex items-center gap-1 text-slate-600"><ArrowLeft size={16} />Sửa thông tin</button>
                  <button type="button" disabled={busy || remaining > 0} onClick={sendOtp} className="font-bold text-teal-700 disabled:opacity-40">Gửi lại OTP</button>
                </div>
              </form>
            )}
          </div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  );
}
