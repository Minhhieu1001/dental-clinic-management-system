import { motion } from 'framer-motion';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-emerald-500">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="9 12 11 14 15 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'An toàn & Bảo mật',
    desc: 'Dữ liệu được mã hóa và bảo vệ tuyệt đối',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-600">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Ứng dụng AI',
    desc: 'Hỗ trợ chẩn đoán và đề xuất điều trị',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-sky-500">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Lưu trữ đám mây',
    desc: 'Truy cập mọi lúc, mọi nơi',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-indigo-500">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
      </svg>
    ),
    title: 'Đồng bộ đa thiết bị',
    desc: 'Sử dụng linh hoạt trên mọi nền tảng',
  },
];

const stats = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-blue-600">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    value: '2,500+',
    label: 'Khách hàng tin tưởng',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-blue-600">
        <path d="M12 2C9.5 2 7 4 7 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1.5.5 3 1.5 3s1.5-1 1.5-2.5V16c0-.5.5-1 1-1s1 .5 1 1v1.5c0 1.5.5 2.5 1.5 2.5s1.5-1.5 1.5-3c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-5-5z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    value: '15,000+',
    label: 'Ca điều trị thành công',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-emerald-500">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    value: '98%',
    label: 'Lịch hẹn đúng giờ',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-amber-400">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    value: '4.9/5',
    label: 'Đánh giá hài lòng',
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function ScrollSection() {
  return (
    <motion.div
      className="relative z-20 w-full max-w-7xl mx-auto px-6 pb-12 mt-4 lg:mt-0"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-blue-900/5 border border-white">
        
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Chúng tôi mang đến trải nghiệm nha khoa hiện đại
          </h2>
          <div className="w-16 h-1 bg-teal-500 mx-auto mt-4 rounded-full" />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-slate-800 font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-100">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center justify-center gap-4"
            >
              <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                {stat.icon}
              </div>
              <div className="text-left">
                <div className="text-xl md:text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
