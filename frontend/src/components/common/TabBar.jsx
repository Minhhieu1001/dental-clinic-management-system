import { NavLink } from 'react-router-dom'

export default function TabBar({ items }) {
  return (
    <nav className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur">
      <div className="px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Navigation
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'rounded-2xl px-4 py-3 text-left text-sm font-medium transition',
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}