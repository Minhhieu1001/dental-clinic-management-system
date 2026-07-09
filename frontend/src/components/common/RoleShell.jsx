import { Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import TabBar from './TabBar.jsx'

export default function RoleShell({ config }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:pl-64">
      <TabBar items={config.tabItems} />

      <Header
        roleLabel={config.roleLabel}
        title={config.title}
        subtitle={config.subtitle}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Footer footer={config.footer} />
    </div>
  )
}