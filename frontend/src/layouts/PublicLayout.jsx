import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Dịch vụ', to: '/services' },
  { label: 'Bảng giá', to: '/pricing' },
  { label: 'Tin tức', to: '/news' },
  { label: 'Liên hệ', to: '/contact' },
]

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f9ff_0%,#eef3fb_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <NavLink to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f4fb2] text-xs font-bold text-white shadow-sm">
                  DK
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#1f4fb2]">
                    Dental Clinic
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                    Management System
                  </h1>
                </div>
              </NavLink>

              <div className="hidden flex-1 px-8 lg:block">
                <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                    <span className="text-lg">⌕</span>
                  </div>
                  <div className="flex-1 text-sm text-slate-400">
                    Tìm dịch vụ, kiến thức nha khoa hoặc chi nhánh...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1f4fb2] sm:flex">
                  <span className="text-base">☎</span>
                  1900 6899
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#1f4fb2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#183f8d]"
                >
                  Đặt lịch hẹn
                </button>
              </div>
            </div>

            <nav className="hidden items-center gap-6 overflow-x-auto pb-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'relative pb-3 text-base font-semibold transition',
                      isActive
                        ? 'text-[#1f4fb2] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-full after:bg-[#1f4fb2]'
                        : 'text-slate-700 hover:text-[#1f4fb2] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:origin-left after:scale-x-0 after:rounded-full after:bg-[#1f4fb2] after:transition-transform hover:after:scale-x-100',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/95">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
          Dental Clinic Management System
        </div>
      </footer>
    </div>
  )
}