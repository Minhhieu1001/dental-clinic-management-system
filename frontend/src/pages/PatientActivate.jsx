import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import bgImage from '../assets/images/dental-light-bg.png';

// Motion Variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
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

export default function PatientActivate() {
  const navigate = useNavigate();

  // Quản lý các bước: 'LOOKUP' -> 'OTP' -> 'SET_PASSWORD' -> 'SUCCESS'
  const [currentStep, setCurrentStep] = useState('LOOKUP');

  // Dữ liệu nhập bước 1: Tra cứu hồ sơ
  const [lookupData, setLookupData] = useState({
    patientCode: '',
    phone: '',
    email: '',
  });

  // Tên bệnh nhân tìm thấy từ hệ thống sau khi tra cứu/xác thực
  const [matchedPatientName, setMatchedPatientName] = useState('');

  // Dữ liệu nhập bước 3: Tạo mật khẩu
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP State (6 ô)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef([]);

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    let timer;
    if (currentStep === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [currentStep, countdown]);

  const handleLookupChange = (e) => {
    const { name, value } = e.target;
    setLookupData((prev) => ({
      ...prev,
      [name]: name === 'patientCode' ? value.toUpperCase() : value,
    }));
  };

  // BƯỚC 1: Submit Form Tra cứu hồ sơ có sẵn -> Gửi OTP
  const handleLookupSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!lookupData.patientCode.trim()) {
      setError('Vui lòng nhập Mã bệnh nhân đã được phòng khám cấp');
      return;
    }
    if (!lookupData.phone.trim()) {
      setError('Vui lòng nhập Số điện thoại trong hồ sơ khám');
      return;
    }
    if (!lookupData.email.trim()) {
      setError('Vui lòng nhập Email để nhận mã OTP xác thực');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(lookupData.email.trim())) {
      setError('Định dạng Email không hợp lệ');
      return;
    }

    setIsLoading(true);

    // Giả lập tra cứu hồ sơ và gửi OTP
    setTimeout(() => {
      setIsLoading(false);
      // Giả lập tên bệnh nhân khớp trong hệ thống
      setMatchedPatientName('Nguyễn Văn An');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setCurrentStep('OTP');
      toast.success(`Hồ sơ hợp lệ! Đã gửi mã xác thực tới ${lookupData.email}`);
    }, 800);
  };

  // BƯỚC 2: Xử lý OTP
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

  const handleResendOtp = () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    toast.success(`Mã OTP mới đã gửi đến ${lookupData.email}`);
    otpInputsRef.current[0]?.focus();
  };

  // Xác thực OTP -> Chuyển sang bước 3 (Hiển thị tên & Đặt mật khẩu)
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('SET_PASSWORD');
      toast.success('Xác thực OTP thành công! Vui lòng thiết lập mật khẩu.');
    }, 800);
  };

  // BƯỚC 3: Thiết lập mật khẩu và hoàn tất tạo tài khoản
  const handleSetPasswordSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!passwordData.password) {
      setError('Vui lòng nhập Mật khẩu mới');
      return;
    }
    if (passwordData.password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('SUCCESS');
      toast.success('Kích hoạt tài khoản thành công!');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex flex-col justify-between selection:bg-teal-200 selection:text-teal-900">
      {/* Background Image with Medical Overlay */}
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
              Kích Hoạt Tài Khoản Hồ Sơ
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/patient/login"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white shadow-sm transition-all border border-slate-200/80 hover:shadow"
          >
            Đăng nhập Cổng Bệnh Nhân →
          </Link>
        </div>
      </motion.header>

      {/* Main Container - Chiều ngang rộng 2 cột (Left: Perks, Right: Step Forms) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-2">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[1240px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[2.2rem] shadow-[0_20px_50px_-15px_rgba(13,148,136,0.14),0_0_25px_rgba(255,255,255,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* CỘT TRÁI (LEFT SIDE): HƯỚNG DẪN & LỢI ÍCH */}
          <motion.div
            variants={leftContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <motion.div variants={leftItemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-teal-100 text-[11px] font-semibold mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                DÀNH CHO BỆNH NHÂN ĐÃ CÓ MÃ HỒ SƠ
              </motion.div>

              <motion.h2 variants={leftItemVariants} className="text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight mb-3">
                Liên kết & Kích hoạt hồ sơ nha khoa trực tuyến
              </motion.h2>
              <motion.p variants={leftItemVariants} className="text-teal-100/90 text-xs sm:text-sm font-normal leading-relaxed mb-6">
                Nếu quý khách đã từng khám tại Crown Dental và có Mã bệnh nhân trên hóa đơn/phiếu khám, hãy kích hoạt tài khoản để theo dõi lịch sử điều trị trực tuyến.
              </motion.p>

              {/* 3 Lợi ích khi kích hoạt */}
              <motion.div variants={leftItemVariants} className="space-y-3.5">
                {[
                  {
                    title: 'Đồng bộ toàn bộ lịch sử khám cũ',
                    desc: 'Xem lại hồ sơ bệnh án, hình ảnh chụp X-quang và đơn thuốc trước đây',
                    icon: (
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ),
                  },
                  {
                    title: 'Xác thực bảo mật qua Gmail',
                    desc: 'Đảm bảo chỉ chính chủ hồ sơ mới có quyền kích hoạt và đặt mật khẩu',
                    icon: (
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ),
                  },
                  {
                    title: 'Tự chọn mật khẩu đăng nhập dễ nhớ',
                    desc: 'Sau khi kích hoạt, bạn có thể đăng nhập bất kỳ lúc nào bằng SĐT & Mật khẩu',
                    icon: (
                      <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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

            <motion.div variants={leftItemVariants} className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/90 font-bold">Không tìm thấy Mã bệnh nhân?</p>
                <p className="text-[11px] text-teal-100/80">Vui lòng gọi hotline để hỗ trợ tra cứu</p>
              </div>
              <span className="text-sm font-black text-emerald-300">1900 8059</span>
            </motion.div>
          </motion.div>

          {/* CỘT PHẢI (RIGHT SIDE): CÁC BƯỚC THAO TÁC */}
          <div className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-center">

            {/* Stepper Thu Gọn (4 bước: Tra cứu -> OTP -> Đặt mật khẩu -> Hoàn tất) */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'LOOKUP' ? 'bg-teal-600 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                  {currentStep === 'LOOKUP' ? '1' : '✓'}
                </span>
                <span className={currentStep === 'LOOKUP' ? 'text-teal-700' : 'text-slate-500'}>
                  Tra cứu hồ sơ
                </span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'OTP' ? 'bg-teal-600 text-white' : ['SET_PASSWORD', 'SUCCESS'].includes(currentStep) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {['SET_PASSWORD', 'SUCCESS'].includes(currentStep) ? '✓' : '2'}
                </span>
                <span className={currentStep === 'OTP' ? 'text-teal-700' : 'text-slate-500'}>
                  Mã OTP
                </span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'SET_PASSWORD' ? 'bg-teal-600 text-white' : currentStep === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {currentStep === 'SUCCESS' ? '✓' : '3'}
                </span>
                <span className={currentStep === 'SET_PASSWORD' ? 'text-teal-700' : 'text-slate-500'}>
                  Mật khẩu
                </span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  4
                </span>
                <span className={currentStep === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-500'}>
                  Xong
                </span>
              </div>
            </div>

            {/* Content Transitions */}
            <AnimatePresence mode="wait">

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 1: TRA CỨU HỒ SƠ (MÃ BỆNH NHÂN, SĐT, EMAIL)
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'LOOKUP' && (
                <motion.div
                  key="step-lookup"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 mb-1.5">
                      BƯỚC 1 / 3
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      Kích hoạt Tài khoản từ Hồ sơ có sẵn
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Nhập thông tin hồ sơ đã đăng ký tại phòng khám để nhận mã xác thực OTP
                    </p>
                  </div>

                  {/* Error Banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
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

                  <form onSubmit={handleLookupSubmit} className="space-y-3.5">

                    {/* 1. Mã bệnh nhân */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mã bệnh nhân <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="16" rx="3" />
                            <line x1="7" y1="8" x2="17" y2="8" />
                            <line x1="7" y1="12" x2="13" y2="12" />
                            <circle cx="16" cy="14" r="1.5" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="patientCode"
                          value={lookupData.patientCode}
                          onChange={handleLookupChange}
                          placeholder="VD: BN001248"
                          disabled={isLoading}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all uppercase duration-200"
                        />
                      </div>
                    </div>

                    {/* 2. Số điện thoại */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Số điện thoại đã lưu trong hồ sơ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={lookupData.phone}
                          onChange={(e) =>
                            setLookupData((prev) => ({
                              ...prev,
                              phone: e.target.value.replace(/[^0-9]/g, ''),
                            }))
                          }
                          placeholder="0912 345 678"
                          maxLength={11}
                          disabled={isLoading}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* 3. Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email nhận mã xác thực OTP <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={lookupData.email}
                          onChange={handleLookupChange}
                          placeholder="patient@gmail.com"
                          disabled={isLoading}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Nút bấm Gửi OTP */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang đối soát hồ sơ...
                          </>
                        ) : (
                          <>
                            Xác thực hồ sơ & Nhận mã OTP qua Email
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      to="/patient/register"
                      className="text-slate-500 hover:text-teal-700 font-medium"
                    >
                      ← Chưa từng khám? Đăng ký mới
                    </Link>
                    <Link
                      to="/patient/login"
                      className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                    >
                      Đã có tài khoản? Đăng nhập
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 2: NHẬP MÃ OTP TỪ GMAIL
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'OTP' && (
                <motion.div
                  key="step-otp"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center py-3"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mb-2.5 border border-teal-100 shadow-sm"
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
                    Mã xác thực hồ sơ <strong>{lookupData.patientCode}</strong> đã được gửi tới:
                  </p>
                  <p className="font-bold text-teal-700 text-xs sm:text-sm mt-1 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                    {lookupData.email}
                  </p>

                  {/* 6 Ô OTP */}
                  <form onSubmit={handleVerifyOtp} className="mt-5">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputsRef.current[index] = el)}
                          type="text"
                          inputMode="numeric"
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
                          className="font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                        >
                          Chưa nhận được mã? Gửi lại mã OTP
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          Gửi lại mã sau <span className="font-bold text-teal-600">{countdown}s</span>
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={isLoading || otp.join('').length < 6}
                      className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang xác thực OTP...
                        </>
                      ) : (
                        <>
                          Xác nhận mã OTP
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep('LOOKUP')}
                      className="mt-3.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      ← Nhập lại Mã bệnh nhân / Số điện thoại
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 3: HIỂN THỊ TÊN BỆNH NHÂN & CHO PHÉP NHẬP MẬT KHẨU TẠO TK
              ══════════════════════════════════════════════════════════ */}
              {currentStep === 'SET_PASSWORD' && (
                <motion.div
                  key="step-password"
                  variants={stepSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                      XÁC MINH DANH TÍNH THÀNH CÔNG
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                      Thiết lập Mật khẩu Tài khoản
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Hồ sơ của bạn đã được tìm thấy. Vui lòng đặt mật khẩu mới để hoàn tất kích hoạt.
                    </p>
                  </div>

                  {/* THẺ HIỂN THỊ HỒ SƠ TÌM THẤY */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-sky-50 border border-teal-200/70 mb-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                        {matchedPatientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {matchedPatientName}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Đã xác thực
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mã hồ sơ: <span className="font-bold text-teal-700">{lookupData.patientCode}</span> • SĐT: <span className="font-medium text-slate-700">{lookupData.phone}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Error Banner */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        className="mb-3.5 overflow-hidden"
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

                  {/* Form Thiết lập Mật khẩu */}
                  <form onSubmit={handleSetPasswordSubmit} className="space-y-3.5">

                    {/* Mật khẩu mới */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.password}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, password: e.target.value }))
                          }
                          placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                          disabled={isLoading}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          placeholder="Nhập lại mật khẩu"
                          disabled={isLoading}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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

                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-[0_6px_18px_rgba(13,148,136,0.3)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lưu tài khoản...
                          </>
                        ) : (
                          <>
                            Hoàn tất tạo tài khoản & Kích hoạt
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  BƯỚC 4: HOÀN TẤT KÍCH HOẠT THÀNH CÔNG
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
                    Kích hoạt tài khoản thành công!
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    Chúc mừng <span className="font-bold text-slate-800">{matchedPatientName}</span>. Hồ sơ nha khoa của bạn đã được kết nối trực tuyến an toàn.
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200/60 text-left space-y-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        MÃ BỆNH NHÂN ĐÃ LIÊN KẾT
                      </span>
                      <span className="text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-sm border border-emerald-200">
                        {lookupData.patientCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 text-[11px]">Bệnh nhân:</p>
                        <p className="font-bold text-slate-700">{matchedPatientName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[11px]">Số điện thoại đăng nhập:</p>
                        <p className="font-bold text-slate-700">{lookupData.phone}</p>
                      </div>
                    </div>

                    <div className="pt-1.5 text-[11px] text-emerald-800 flex items-start gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        Bây giờ quý khách có thể đăng nhập ngay bằng <strong>Mã bệnh nhân ({lookupData.patientCode})</strong>, <strong>Số điện thoại</strong> và <strong>Mật khẩu vừa tạo</strong>.
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
        Hỗ trợ kích hoạt tài khoản hồ sơ bệnh nhân: Hotline{' '}
        <a href="tel:19008059" className="font-bold text-teal-600 hover:underline">
          1900 8059
        </a>
      </footer>
    </div>
  );
}
