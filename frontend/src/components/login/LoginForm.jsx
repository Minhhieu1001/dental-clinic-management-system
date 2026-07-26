import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Animation variants ─── */
const formVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/* ─── Input Component ─── */
function LightInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  disabled,
  autoComplete,
  rightElement,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      <div
        className={`relative flex items-center bg-white border rounded-xl transition-all duration-300 ${isFocused ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' : 'border-slate-200 hover:border-slate-300'
          }`}
      >
        {/* Left Icon */}
        <span
          className={`absolute left-4 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-slate-400'
            }`}
        >
          {icon}
        </span>

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full py-3.5 pl-12 pr-12 bg-transparent text-slate-800 text-[15px] outline-none placeholder-slate-400 font-[Inter,sans-serif] disabled:opacity-50"
          placeholder={placeholder}
        />

        {/* Right element (e.g. show/hide password) */}
        {rightElement && (
          <div className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  isLoading,
  onSubmit,
  showPassword,
  setShowPassword,
}) {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 relative z-10 h-full">
      <motion.div
        className="w-full max-w-[440px]"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),0_0_20px_rgba(255,255,255,0.5)]">

          {/* Logo (Visible mainly on mobile where hero is hidden) */}
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center mb-6 lg:hidden">
            <img
              src="/logo.png"
              alt="Crown Dental Logo"
              className="w-14 h-14 object-contain rounded-xl mb-2"
            />
            <div className="text-center">
              <span className="text-slate-800 text-lg font-bold tracking-tight block leading-none">Crown Dental</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng trở lại!</h2>
            <p className="text-slate-500 text-sm">Đăng nhập để tiếp tục sử dụng hệ thống</p>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <motion.div variants={itemVariants}>
              <LightInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                disabled={isLoading}
                autoComplete="email"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                }
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LightInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                disabled={isLoading}
                autoComplete="current-password"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
                rightElement={
                  <div onClick={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </div>
                }
              />
            </motion.div>

            {/* Remember & Forgot */}
            <motion.div variants={itemVariants} className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-colors"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium">
                Quên mật khẩu?
              </a>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-medium">hoặc</span>
            <div className="h-px bg-slate-200 flex-1" />
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Chưa có tài khoản? <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">Liên hệ quản trị hệ thống</a>
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
