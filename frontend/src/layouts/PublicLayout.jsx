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
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
           
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2d6cdf]">
                Dental Clinic
              </p>
              <h1 className="text-lg font-semibold text-slate-900">Management System</h1>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-[#2d6cdf] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="rounded-full bg-[#2d6cdf] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2458b8]"
          >
            Đăng nhập
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
          Dental Clinic Management System
        </div>
      </footer>
    </div>
  )
}