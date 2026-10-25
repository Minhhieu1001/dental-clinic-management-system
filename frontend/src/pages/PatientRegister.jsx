import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import bgImage from '../assets/images/dental-light-bg.png';
import { registerPatient, resendPatientRegistrationOtp, verifyPatientRegistrationOtp } from '../services/auth.service';
import { getBranches } from '../services/clinic.service';

// Motion Variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const leftContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const leftItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const stepSlideVariants = {
  hidden: { opacity: 0, x: 25 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: -25,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

export default function PatientRegister() {
  const navigate = useNavigate();

  // Quản lý các bước: 'FORM' (Điền thông tin) -> 'OTP' (Nhập OTP Gmail) -> 'SUCCESS' (Đăng ký thành công)
  const [currentStep, setCurrentStep] = useState('FORM');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    gender: 'MALE', // 'MALE' | 'FEMALE' | 'OTHER'
    phone: '',
    email: '',
    address: '',
    branchId: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [branchLoadAttempt, setBranchLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getBranches().then((data) => {
      if (!cancelled) setBranches(data.filter((branch) => branch.status === 'ACTIVE'));
    }).catch(() => {
      if (!cancelled) setBranchesError('Không tải được danh sách cơ sở. Vui lòng thử lại.');
    }).finally(() => {
      if (!cancelled) setBranchesLoading(false);
    });
    return () => { cancelled = true; };
  }, [branchLoadAttempt]);

  // OTP State (6 ô)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const canResend = countdown === 0;
  const otpInputsRef = useRef([]);
  const requestInFlight = useRef(false);
  const today = new Date().toLocaleDateString('en-CA');

  // Mã bệnh nhân do backend cấp sau khi xác thực OTP.
  const [generatedPatientCode, setGeneratedPatientCode] = useState('');

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    if (!otpExpiresAt) return;
    const timer = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [otpExpiresAt]);

  const startOtpCountdown = (data) => {
    const expiresAt = Date.parse(data.expiresAt);
    setOtpExpiresAt(expiresAt);
    setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    setOtp(['', '', '', '', '', '']);
  };

  const showRequestError = (err) => {
    const message = err.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
    setError(message);
    toast.error(message);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Form Đăng ký
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (requestInFlight.current) return;
    setError('');

    if (!formData.branchId || !branches.some((branch) => branch.branchId === formData.branchId)) {
      setError('Vui lòng chọn cơ sở đăng ký');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập Họ và tên');
      return;
    }
    if (!formData.birthDate) {
      setError('Vui lòng chọn Ngày sinh');
      return;
    }
    if (formData.birthDate > today) {
      setError('Ngày sinh không được ở tương lai');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập Số điện thoại');
      return;
    }
    if (!/^(?:0|\+?84)[0-9]{9}$/.test(formData.phone.trim())) {
      setError('Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0, hoặc dùng đầu số +84');
      return;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập Email để nhận mã OTP');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setError('Định dạng Email không hợp lệ');
      return;
    }
    if (!formData.address.trim()) {
      setError('Vui lòng nhập Địa chỉ hiện tại');
      return;
    }
    if (!formData.password) {
      setError('Vui lòng nhập Mật khẩu');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (new TextEncoder().encode(formData.password).length > 72) {
      setError('Mật khẩu không được vượt quá 72 byte UTF-8');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp');
      return;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const response = await registerPatient({
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.birthDate,
        gender: formData.gender,
        address: formData.address.trim(),
        branchId: formData.branchId,
        email,
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setRegistrationEmail(email);
      startOtpCountdown(response.data);
      setCurrentStep('OTP');
      toast.success(`Đã gửi mã OTP tới: ${email}`);
    } catch (err) {
      showRequestError(err);
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pastedChars = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pastedChars.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedChars.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || requestInFlight.current) return;
    requestInFlight.current = true;
    setIsLoading(true);
    setError('');
    try {
      const response = await resendPatientRegistrationOtp(registrationEmail);
      startOtpCountdown(response.data);
      toast.success(`Mã OTP mới đã gửi đến ${registrationEmail}`);
    } catch (err) {
      showRequestError(err);
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (requestInFlight.current) return;
    setError('');
    if (Date.now() >= otpExpiresAt) {
      setError('OTP đã hết hạn. Vui lòng gửi lại mã mới.');
      return;
    }
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    try {
      const response = await verifyPatientRegistrationOtp(registrationEmail, enteredOtp);
      setGeneratedPatientCode(response.data.patientCode);
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setOtpExpiresAt(0);
      setCurrentStep('SUCCESS');
      toast.success('Xác thực OTP thành công! Chào mừng quý khách.');
    } catch (err) {
      showRequestError(err);
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex flex-col justify-between selection:bg-teal-200 selection:text-teal-900">
      {/* Background with Medical Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bgImage}
          alt="Dental Clinic Background"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-100/50 via-white/80 to-teal-50/90" />
      </div>

      {/* Top Header */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Crown Dental Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <div className="leading-tight">
            <span className="text-slate-900 text-base font-black tracking-tight block">
              Crown Dental
            </span>
            <span className="text-teal-600 text-[10px] font-bold uppercase tracking-wider">
              Cổng Bệnh Nhân
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/patient/login"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white shadow-sm transition-all border border-slate-200/80 hover:shadow"
          >
            Đã có tài khoản? Đăng nhập →
          </Link>
        </div>
      </motion.header>

      {/* Main Container - Chiều ngang rộng, 2 cột (Left Side & Right Form) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-2">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[1240px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[2.2rem] shadow-[0_20px_50px_-15px_rgba(13,148,136,0.14),0_0_25px_rgba(255,255,255,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* ══════════════════════════════════════════════════════════
              CỘT TRÁI (LEFT SIDE): HÌNH ẢNH & THÔNG TIN NỔI BẬT
          ══════════════════════════════════════════════════════════ */}
          <motion.div
            variants={leftContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Pattern Trang trí chìm với hiệu ứng xoay nhẹ */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <motion.div variants={leftItemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-teal-100 text-[11px] font-semibold mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                HỆ THỐNG Y TẾ SỐ CROWN DENTAL
              </motion.div>

              {/* Title */}
              <motion.h2 variants={leftItemVariants} className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight mb-3">
                Chăm sóc nụ cười toàn diện cho cả gia đình bạn
              </motion.h2>
              <motion.p variants={leftItemVariants} className="text-teal-100/90 text-xs sm:text-sm font-normal leading-relaxed mb-6">
                Đăng ký tài khoản để theo dõi lộ trình điều trị, đặt hẹn nhanh và bảo mật hồ sơ nha khoa vĩnh viễn.
              </motion.p>

              {/* Danh sách tiện ích nổi bật với stagger animation */}
              <motion.div variants={leftItemVariants} className="space-y-3.5">
                {[
                  {
                    title: 'Đặt lịch khám nha khoa ưu tiên',
                    desc: 'Chủ động chọn bác sĩ chuyên khoa & không cần xếp hàng chờ',
                    icon: (
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    ),
                  },
                  {
                    title: 'Hồ sơ bệnh án điện tử an toàn',
                    desc: 'Xem phim X-quang, hình ảnh trước sau và phác đồ điều trị 24/7',
                    icon: (
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ),
                  },
                  {
                    title: 'Nhận diện ưu đãi & tích điểm tự động',
                    desc: 'Cập nhật các chương trình trợ giá niềng răng, implant sớm nhất',
                    icon: (
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    className="flex items-start gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/10 transition-colors cursor-default"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                      <p className="text-[11px] text-teal-100/80 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Bottom rating */}
            <motion.div variants={leftItemVariants} className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-300 text-xs mb-0.5">
                  {'★'.repeat(5)}
                  <span className="text-white font-bold ml-1">4.9/5</span>
                </div>
                <p className="text-[11px] text-teal-100/80">Hơn 15.000+ bệnh nhân tin tưởng</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/90 font-bold block">Hotline 24/7</span>
                <span className="text-sm font-black text-emerald-300">1900 8059</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════
              CỘT PHẢI (RIGHT SIDE): FORM THAO TÁC (GỌN GÀNG, KHÔNG DÀI)
          ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-center">

            {/* Stepper Thu Gọn */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === 'FORM' ? 'bg-teal-600 text-white shadow-sm' : 'bg-emerald-500 text-white'
                }`}>
                  {currentStep === 'FORM' ? '1' : '✓'}
                </span>
                <span className={`text-xs font-bold ${currentStep === 'FORM' ? 'text-teal-700' : 'text-slate-500'}`}>
                  Điền thông tin
                </span>
              </div>
              <span className="text-slate-300 text-xs">→</span>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === 'OTP' ? 'bg-teal-600 text-white shadow-sm' : currentStep === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep === 'SUCCESS' ? '✓' : '2'}
                </span>
                <span className={`text-xs font-bold ${currentStep === 'OTP' ? 'text-teal-700' : 'text-slate-500'}`}>
                  Xác thực OTP
                </span>
              </div>
              <span className="text-slate-300 text-xs">→</span>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === 'SUCCESS' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                }`}>
                  3
                </span>
                <span className={`text-xs font-bold ${currentStep === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  Hoàn tất
                </span>
              </div>
            </div>

            {/* AnimatePresence for Smooth Step Switching */}
            <AnimatePresence mode="wait">
              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 1: FORM ĐĂNG KÝ (BỐ TRÍ 2 CỘT GỌN GÀNG)
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'FORM' && (
                <motion.div
                  key="step-form"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      Đăng ký Tài khoản Bệnh nhân
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Điền đầy đủ thông tin bên dưới để khởi tạo hồ sơ y tế
                    </p>
                  </div>

                  {/* Error Banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Inputs dạng Grid 2 Cột thu gọn chiều cao */}
                  <form onSubmit={handleFormSubmit}>
                    <fieldset disabled={isLoading} className="space-y-3">
                      <div>
                        <label htmlFor="registration-branch" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Cơ sở đăng ký <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="registration-branch"
                          name="branchId"
                          value={formData.branchId}
                          onChange={handleChange}
                          required
                          disabled={branchesLoading || branches.length === 0}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                        >
                          <option value="">{branchesLoading ? 'Đang tải cơ sở...' : 'Chọn cơ sở khám'}</option>
                          {branches.map((branch) => (
                            <option key={branch.branchId} value={branch.branchId}>
                              {branch.branchName}{branch.address ? ` — ${branch.address}` : ''}
                            </option>
                          ))}
                        </select>
                        {!branchesLoading && !branchesError && branches.length === 0 && (
                          <p className="mt-1 text-xs text-amber-700">Hiện chưa có cơ sở đang hoạt động để đăng ký.</p>
                        )}
                        {branchesError && (
                          <div role="alert" className="mt-1 text-xs text-red-600">
                            {branchesError}{' '}
                            <button type="button" className="underline font-bold" onClick={() => {
                              setBranchesLoading(true);
                              setBranchesError('');
                              setBranchLoadAttempt((attempt) => attempt + 1);
                            }}>Tải lại</button>
                          </div>
                        )}
                      </div>
                    
                    {/* Hàng 1: Họ tên (cột 1) & Ngày sinh (cột 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          maxLength={255}
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Nguyễn Văn A"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Ngày sinh <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="birthDate"
                          max={today}
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Hàng 2: Giới tính (cột 1) & Số điện thoại (cột 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Giới tính <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, gender: g }))}
                              className={`py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                                formData.gender === g
                                  ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              phone: e.target.value.replace(/[^0-9+]/g, ''),
                            }))
                          }
                          placeholder="0912 345 678"
                          maxLength={12}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Hàng 3: Email nhận OTP (cột 1) & Địa chỉ (cột 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Email nhận mã OTP <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          maxLength={255}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="patient@gmail.com"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Địa chỉ hiện tại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          maxLength={1000}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Số nhà, đường, quận/huyện"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Hàng 4: Mật khẩu (cột 1) & Xác nhận mật khẩu (cột 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 6 ký tự"
                            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Xác nhận mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button với motion feedback */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={isLoading || branchesLoading || branches.length === 0 || !formData.branchId}
                        className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] hover:shadow-[0_8px_22px_rgba(13,148,136,0.35)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang khởi tạo thông tin...
                          </>
                        ) : (
                          <>
                            Đăng ký & Nhận mã OTP qua Gmail
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                    </div>
                    </fieldset>
                  </form>

                  {/* Footer Switch */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-center space-y-1.5">
                    <p className="text-xs text-slate-500">
                      Đã có tài khoản bệnh nhân?{' '}
                      <Link
                        to="/patient/login"
                        className="font-bold text-teal-600 hover:text-teal-700 hover:underline ml-1"
                      >
                        Đăng nhập ngay
                      </Link>
                    </p>
                    <p className="text-xs text-slate-500">
                      Đã có Mã bệnh nhân tại phòng khám?{' '}
                      <Link
                        to="/patient/activate"
                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-1"
                      >
                        Kích hoạt tài khoản có sẵn
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 2: MÀN HÌNH NHẬP MÃ OTP TỪ GMAIL
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'OTP' && (
                <motion.div
                  key="step-otp"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mb-3 border border-teal-100 shadow-sm"
                  >
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Nhập mã OTP từ Gmail
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    Mã xác thực gồm 6 chữ số đã được gửi đến hòm thư:
                  </p>
                  <p className="font-bold text-teal-700 text-xs sm:text-sm mt-1 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                    {registrationEmail}
                  </p>

                  {/* 6 Ô OTP */}
                  <form onSubmit={handleVerifyOtp} className="mt-6">
                    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputsRef.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          aria-label={`Chữ số OTP ${index + 1}`}
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          disabled={isLoading}
                          onPaste={(event) => {
                            event.preventDefault();
                            const digits = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                            if (!digits) return;
                            setOtp(Array.from({ length: 6 }, (_, i) => digits[i] || ''));
                            otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
                          }}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          autoFocus={index === 0}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200 shadow-inner"
                        />
                      ))}
                    </div>

                    <div className="mb-5 text-xs sm:text-sm">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                        >
                          {isLoading ? 'Đang xử lý...' : 'OTP đã hết hạn. Gửi lại mã OTP'}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          OTP còn hiệu lực <span className="font-bold text-teal-600">{countdown}s</span>. Có thể gửi lại khi hết hạn.
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={isLoading || canResend || otp.join('').length < 6}
                      className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang xác thực OTP...
                        </>
                      ) : (
                        <>
                          Xác nhận & Kích hoạt tài khoản
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => { setError(''); setCurrentStep('FORM'); }}
                      className="mt-3.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      ← Chỉnh sửa lại thông tin đăng ký
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 3: MÀN HÌNH ĐĂNG KÝ THÀNH CÔNG
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'SUCCESS' && (
                <motion.div
                  key="step-success"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-md shadow-emerald-600/20 ring-6 ring-emerald-50"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Đăng ký tài khoản thành công!
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    Chào mừng <span className="font-bold text-slate-800">{formData.fullName}</span> đến với Crown Dental.
                  </p>

                  {/* Khung thông tin cấp tài khoản */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/60 text-left space-y-2"
                  >
                    <div className="flex flex-col gap-2 pb-2 border-b border-emerald-200/50">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        MÃ BỆNH NHÂN CỦA BẠN
                      </span>
                      <span className="break-all text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-sm border border-emerald-200">
                        {generatedPatientCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 text-[11px]">Số điện thoại:</p>
                        <p className="font-bold text-slate-700">{formData.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[11px]">Email:</p>
                        <p className="font-bold text-slate-700 truncate">{formData.email}</p>
                      </div>
                    </div>

                    <div className="pt-1.5 text-[11px] text-emerald-800 flex items-start gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        Ghi nhớ <strong className="break-all">Mã bệnh nhân ({generatedPatientCode})</strong>, <strong>Số điện thoại</strong> và <strong>Mật khẩu đã đăng ký</strong> để đăng nhập. Kiểm tra hộp thư email để nhận mã bệnh nhân.
                      </span>
                    </div>
                  </motion.div>

                  <div className="mt-5 space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      onClick={() => navigate('/patient/login')}
                      className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Đăng nhập Cổng Bệnh Nhân ngay
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </motion.button>

                    <Link
                      to="/"
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors inline-block"
                    >
                      ← Về trang chủ Crown Dental
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </main>

      {/* Footer Support */}
      <footer className="relative z-10 py-3 text-center text-xs text-slate-400">
        Hỗ trợ đăng ký Cổng Bệnh nhân: Hotline{' '}
        <a href="tel:19008059" className="font-bold text-teal-600 hover:underline">
          1900 8059
        </a>
      </footer>
    </div>
  );
}
