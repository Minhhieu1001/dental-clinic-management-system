import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import TabBar from './TabBar.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

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

      <main className="w-full px-1.5 py-1.5 sm:px-2 sm:py-2 lg:px-2.5 lg:py-2">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}

