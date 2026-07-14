import { NavLink, Outlet, Link } from 'react-router-dom'

const topLinks = [
  { label: 'Ưu đãi', to: '/promotions' },
  { label: 'Niềng răng', to: '/services' },
  { label: 'Kiến thức nha khoa', to: '/knowledge' },
  { label: 'Tin tức sự kiện', to: '/news' },
]

const navItems = [
  { label: 'Trang Chủ', to: '/' },
  { label: 'Giới Thiệu', to: '/about' },
  { label: 'Ưu Đãi', to: '/promotions' },
  { label: 'Bảng Giá', to: '/pricing' },
  { label: 'Dịch Vụ', to: '/services', hasDropdown: true },
  { label: 'Người Nổi Tiếng', to: '/celebrities' },
  { label: 'Kiến Thức Nha Khoa', to: '/knowledge' },
  { label: 'Tuyển Dụng', to: '/careers' },
  { label: 'Tìm Phòng Khám', to: '/contact' },
]

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Main header row - items-center toàn diện ép tất cả đồng tâm */}
          <div className="flex items-center justify-between gap-4 pt-5 pb-4">

            {/* Logo CROWN Dental */}
            <NavLink to="/" className="flex items-center gap-3 flex-shrink-0 select-none">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-white border-2 border-[#1f4fb2] rounded-xl">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-[#1f4fb2]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                  <div className="w-2.5 h-2.5 bg-[#00a859]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                </div>
              </div>
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
              {/* Ô tìm kiếm bo viên thuốc */}
              <div className="w-full flex items-center gap-3 rounded-full bg-[#f4f6fa]/80 border border-transparent px-5 py-3 focus-within:border-slate-200 transition">
                <svg className="h-5 w-5 text-slate-400 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Nhóm link phụ - Đã fix pl-12 giúp lùi chữ vào thẳng hàng với ô input tìm kiếm phía trên */}
              <div className="flex items-center gap-5 mt-2 pl-12">
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

            {/* Bên phải: Cặp nút bấm hành động - Đảm bảo đồng bộ chiều cao lý tưởng */}
            <div className="flex items-center gap-3 flex-shrink-0 h-full self-center">
              
              {/* Nút Hotline */}
              <a
                href="tel:19008059"
                className="flex items-center justify-center gap-2.5 rounded-full bg-[#edf3ff] px-6 h-[46px] text-sm font-bold text-[#1f64f2] hover:bg-[#e1ecff] transition"
              >
                <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                1900 8059
              </a>
              
              {/* Nút Đặt lịch hẹn - Chữ Trắng tinh tế trên nền Gradient Xanh Đậm trùng khớp mẫu */}
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2c4b8b] to-[#1c3266] px-6 h-[46px] text-sm font-semibold text-white hover:opacity-95 shadow-md shadow-blue-900/5 transition"
              >
                <svg className="h-4 w-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Đặt lịch hẹn
              </Link>
            </div>
          </div>

          {/* Primary Navigation */}
          <div className="flex justify-center border-t border-slate-100">
            <nav className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
              {navItems.map((item) => (
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
                  {item.hasDropdown && (
                    <svg className="h-3.5 w-3.5 mt-0.5 text-slate-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

        </div>
      </header>

      {/* Main Content Component */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#132c6b] text-white border-t-4 border-[#00a859] pt-12 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center justify-center w-10 h-10 bg-white border-2 border-[#1f4fb2] rounded-md">
                  <div className="flex items-center gap-0.5">
                    <div className="w-2 h-2 bg-[#1f4fb2]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                    <div className="w-2 h-2 bg-[#00a859]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                  </div>
                </div>
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
    </div>
  )
}