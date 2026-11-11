import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { Bot, CalendarCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AppointmentRequestModal from '../components/ui/AppointmentRequestModal'
import Chatbot from '../features/ai/Chatbot'

const topLinks = [
  { label: 'Ưu đãi', to: '/promotions' },
  { label: 'Niềng răng', to: '/services' },
  { label: 'Kiến thức nha khoa', to: '/knowledge' },
  { label: 'Tin tức sự kiện', to: '/news' },
]

const navItems = [
  { label: 'Trang Chủ', to: '/' },
  { label: 'Giới Thiệu', to: '/about' },
  { label: 'Ưu Đãi', to: '/promotions', hasDropdown: true },
  { label: 'Bảng Giá', to: '/pricing' },
  { label: 'Dịch Vụ', to: '/services', hasDropdown: true },
  { label: 'Người Nổi Tiếng', to: '/celebrities' },
  { label: 'Kiến Thức Nha Khoa', to: '/knowledge' },
  { label: 'Tìm Phòng Khám', to: '/contact' },
]

export default function PublicLayout() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main header row - items-center toàn diện ép tất cả đồng tâm */}
          <div className="flex items-center justify-between gap-4 pt-5 pb-4">

            {/* Logo CROWN Dental */}
            <NavLink to="/" className="flex items-center gap-3 flex-shrink-0 select-none">
              <img
                src="/logo.png"
                alt="Crown Dental Logo"
                className="h-14 w-14 object-contain rounded-xl"
              />
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NHA KHOA</p>
                <h1 className="text-2xl font-black tracking-tight text-[#1f4fb2] leading-none my-0.5">
                  CROWN Dental
                </h1>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">NGƯỜI BẠN TRỌN ĐỜI</p>
              </div>
            </NavLink>

            {/* Khu vực ở giữa: Thanh tìm kiếm + Nhóm link phụ */}
            <div className="hidden lg:flex flex-col flex-1 max-w-xl px-4 justify-center">
              {/* Ô tìm kiếm bo nhẹ nhàng */}
              <div className="w-full flex items-center gap-3 rounded-xl bg-[#f4f6fa]/80 border border-transparent px-4 py-2.5 focus-within:border-slate-200 transition">
                <svg className="h-5 w-5 text-slate-400 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Nhóm link phụ */}
              <div className="flex items-center gap-5 mt-2 pl-4">
                {topLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="text-[12px] font-medium text-slate-600 hover:text-[#1f4fb2] transition-colors"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Bên phải: Cặp nút bấm hành động */}
            <div className="flex items-center gap-3 flex-shrink-0 h-full self-center">
              
              {/* Nút Hotline */}
              <a
                href="tel:19008059"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#ebf3ff] px-5 h-[42px] text-[14px] font-black text-[#1f64f2] hover:bg-[#dfeaff] transition duration-200"
              >
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a1 1 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1C9.17 6.36 8.97 5.17 8.97 3.94c0-.55-.45-1-1-1H4.42c-.55 0-1 .45-1 1C3.42 14.17 10.33 21 19.42 21c.55 0 1-.45 1-1v-3.62c0-.55-.45-1-1-1z" />
                </svg>
                1900 8059
              </a>
              
              {/* Nút Đặt lịch hẹn - Mở modal trực tiếp */}
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="flex items-center justify-center gap-2.5 rounded-xl px-5.5 h-[42px] text-[14px] font-bold text-white transition duration-200 shadow-sm hover:opacity-95 cursor-pointer active:scale-95"
                style={{ background: 'linear-gradient(90deg, #1f4fb2 0%, #00a859 100%)' }}
              >
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5H7v2h5v-2zm4 0h-3v2h3v-2zm-4 4H7v2h5v-2zm4 0h-3v2h3v-2z" />
                </svg>
                Đặt lịch hẹn
              </button>
            </div>
          </div>

          {/* Primary Navigation */}
          <div className="flex justify-center border-t border-slate-100">
            <nav className="flex items-center gap-1 overflow-visible py-1 no-scrollbar">
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <div key={item.to} className="relative group">
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            'relative whitespace-nowrap px-4 py-3 text-[14.5px] font-bold transition-colors flex items-center gap-1',
                            isActive
                              ? 'text-[#1f4fb2] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[3px] after:bg-[#1f4fb2] after:rounded-full'
                              : 'text-[#132c6b] hover:text-[#1f4fb2]',
                          ].join(' ')
                        }
                      >
                        {item.label}
                        <svg className="h-3.5 w-3.5 mt-0.5 text-slate-400 stroke-[2.5] transition-transform group-hover:rotate-180 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </NavLink>
                      {/* Dropdown Menu */}
                      <div className="absolute left-0 top-full pt-1 w-64 rounded-2xl bg-white border border-slate-100 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-3">
                        {item.to === '/promotions' ? (
                          <>
                            <Link
                              to="/promotions?category=implant"
                              className="block px-6 py-3 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Trồng Răng Implant
                            </Link>
                            <Link
                              to="/promotions?category=nieng_rang"
                              className="block px-6 py-3 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Niềng Răng
                            </Link>
                            <Link
                              to="/promotions?category=tong_quat"
                              className="block px-6 py-3 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Tổng Quát
                            </Link>
                            <Link
                              to="/promotions?category=tham_my"
                              className="block px-6 py-3 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Thẩm Mỹ
                            </Link>
                            <Link
                              to="/promotions?category=tre_em"
                              className="block px-6 py-3 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Trẻ Em
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/services?tab=IMPLANT"
                              className="block px-6 py-3.5 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Trồng Răng Implant
                            </Link>
                            <Link
                              to="/services?tab=NIENG_RANG"
                              className="block px-6 py-3.5 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Niềng Răng
                            </Link>
                            <Link
                              to="/services?tab=KHAM_DIEU_TRI"
                              className="block px-6 py-3.5 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Tổng Quát
                            </Link>
                            <Link
                              to="/services?tab=RANG_SU"
                              className="block px-6 py-3.5 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Thẩm Mỹ
                            </Link>
                            <Link
                              to="/services?tab=NIENG_RANG&filter=KIDS"
                              className="block px-6 py-3.5 text-[15px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] hover:bg-slate-50 transition-colors"
                            >
                              Nha Khoa Trẻ Em
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      [
                        'relative whitespace-nowrap px-4 py-3 text-[14.5px] font-bold transition-colors flex items-center gap-1',
                        isActive
                          ? 'text-[#1f4fb2] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[3px] after:bg-[#1f4fb2] after:rounded-full'
                          : 'text-[#132c6b] hover:text-[#1f4fb2]',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

        </div>
      </header>

      {/* Main Content Component */}
      <main className="flex-grow">
        <Outlet
          context={{
            openAppointmentModal: () => setIsRequestModalOpen(true),
            openRequestModal: () => setIsRequestModalOpen(true),
            openChat: () => setIsChatOpen(true),
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#132c6b] text-white border-t-4 border-[#00a859] pt-12 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="Crown Dental Logo"
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <p className="text-[8px] text-slate-300 uppercase tracking-widest">NHA KHOA</p>
                  <h3 className="text-base font-black tracking-tight text-white leading-none">CROWN Dental</h3>
                  <p className="text-[7px] text-slate-400 uppercase tracking-wider">NGƯỜI BẠN TRỌN ĐỜI</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Hệ thống Nha khoa Crown theo tiêu chuẩn Singapore, chuyên sâu niềng răng Invisalign, răng sứ thẩm mỹ và cấy ghép Implant.
              </p>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-4 border-l-4 border-[#00a859] pl-3">Dịch Vụ Chính</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="hover:text-white transition"><Link to="/services">Niềng răng Invisalign</Link></li>
                <li className="hover:text-white transition"><Link to="/services">Răng sứ thẩm mỹ Veneer</Link></li>
                <li className="hover:text-white transition"><Link to="/services">Cấy ghép Implant phục hồi</Link></li>
                <li className="hover:text-white transition"><Link to="/services">Khám răng tổng quát</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-4 border-l-4 border-[#00a859] pl-3">Liên Hệ & Hỗ Trợ</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Hotline đặt lịch: <span className="font-bold text-[#00a859]">1900 8059</span></li>
                <li>Email: info@crown.vn</li>
                <li>Giờ làm việc: 8:30 - 19:30 (Cả tuần)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-4 border-l-4 border-[#00a859] pl-3">Cơ Sở Crown</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><span className="font-semibold text-slate-100">Hà Nội:</span> 328 Phố Huế, Q. Hai Bà Trưng</li>
                <li><span className="font-semibold text-slate-100">TP. HCM:</span> 215 Nam Kỳ Khởi Nghĩa, Q.3</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-700/60 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Nha Khoa Crown. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </footer>

      {/* Global Appointment Request Modal */}
      <AppointmentRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* AI Chatbot Assistant */}
      <Chatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Floating Circular Action Buttons (Hiện ở mọi trang công khai khi chưa đăng nhập, tự ẩn khi mở modal/chat) */}
      <AnimatePresence>
        {!isChatOpen && !isRequestModalOpen && (
          <motion.div
            key="public-floating-actions"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.6, 
              y: 20, 
              transition: { duration: 0.18, ease: 'easeOut' } 
            }}
            transition={{ 
              type: 'spring', 
              damping: 20, 
              stiffness: 300 
            }}
            className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3"
          >
            {/* Nút 1: Trợ lý AI (Nút tròn) */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                title="Trợ lý ảo AI tư vấn"
              >
                <Bot className="w-7 h-7" />
                {/* Chấm xanh trạng thái trực tuyến */}
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
                </span>
              </button>

              {/* Tooltip khi hover */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                <div className="rounded-lg bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Trợ lý AI tư vấn 24/7</span>
                </div>
              </div>
            </div>

            {/* Nút 2: Tạo yêu cầu lịch hẹn (Nút tròn) */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                title="Tạo yêu cầu lịch hẹn"
              >
                <CalendarCheck className="w-7 h-7" />
              </button>

              {/* Tooltip khi hover */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                <div className="rounded-lg bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tạo yêu cầu lịch hẹn</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}