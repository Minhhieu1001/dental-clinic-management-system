import { motion } from 'framer-motion';

/* ─── Feature items based on mockup ─── */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <circle cx="9" cy="16" r="1.5" fill="currentColor"></circle>
        <circle cx="15" cy="16" r="1.5" fill="currentColor"></circle>
      </svg>
    ),
    title: 'Quản lý lịch hẹn thông minh',
    desc: 'Tối ưu lịch khám, giảm thời gian chờ',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2C9.5 2 7 4 7 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1.5.5 3 1.5 3s1.5-1 1.5-2.5V16c0-.5.5-1 1-1s1 .5 1 1v1.5c0 1.5.5 2.5 1.5 2.5s1.5-1.5 1.5-3c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-5-5z"></path>
      </svg>
    ),
    title: 'Hồ sơ bệnh án điện tử',
    desc: 'Lưu trữ an toàn, truy xuất nhanh chóng',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
      </svg>
    ),
    title: 'Báo cáo & phân tích',
    desc: 'Dữ liệu trực quan, hỗ trợ ra quyết định',
  },
];

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function HeroSection() {
  return (
    <motion.div
      className="hidden lg:flex flex-col justify-center items-start px-12 xl:px-24 py-16 relative z-10 h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Logo */}
      <motion.div variants={itemVariants} className="absolute top-10 left-12 xl:left-24 flex items-center gap-2">
        <div className="text-blue-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path d="M12 2C9.5 2 7 4 7 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1.5.5 3 1.5 3s1.5-1 1.5-2.5V16c0-.5.5-1 1-1s1 .5 1 1v1.5c0 1.5.5 2.5 1.5 2.5s1.5-1.5 1.5-3c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-5-5z"></path>
          </svg>
        </div>
        <div>
          <span className="text-slate-800 text-xl font-bold tracking-tight block leading-none">
            DentalCare
          </span>
          <span className="text-slate-500 text-xs font-medium">Smart Clinic System</span>
        </div>
      </motion.div>

      <div className="max-w-xl w-full mt-12">
        {/* Title */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-5xl xl:text-[3.5rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
            Dental Smart <br />
            Clinic Management <br />
            <span className="text-teal-700">System</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg text-slate-700 leading-relaxed mb-10 max-w-sm font-medium"
        >
          Chuyển đổi số toàn diện <br />
          cho phòng khám nha khoa
        </motion.p>

        {/* Feature List */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          {FEATURES.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-3 pr-8 w-max bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                {feature.icon}
              </div>
              <div className="flex flex-col justify-center h-12">
                <h3 className="text-slate-900 font-semibold text-[15px] leading-tight mb-1">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-tight">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
