import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import TabBar from './TabBar.jsx'

export default function RoleShell({ config, CustomHeader }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pl-16 lg:pl-64 transition-all duration-300">
      <TabBar items={config.tabItems} />

      {CustomHeader ? (
        <CustomHeader config={config} />
      ) : (
        <Header
          roleLabel={config.roleLabel}
          title={config.title}
          subtitle={config.subtitle}
        />
      )}

      <main className="w-full px-2 py-4 sm:px-3 lg:px-4">
        <Outlet />
      </main>
    </div>
  )
}
