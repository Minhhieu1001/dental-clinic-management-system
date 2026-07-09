import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PagePlaceholder from '../components/common/PagePlaceholder.jsx'
import { roleRoutes } from '../constants/roleRoutes.js'
import AdminLayout from '../layouts/AdminLayouts.jsx'
import DentistLayout from '../layouts/DentistLayout.jsx'
import EmployeeLayout from '../layouts/EmployeeLayout.jsx'
import PatientLayout from '../layouts/PatientLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import Home from '../pages/Home.jsx'
import About from '../pages/About.jsx'
import Services from '../pages/Services.jsx'
import Pricing from '../pages/Pricing.jsx'
import News from '../pages/News.jsx'
import Contact from '../pages/Contact.jsx'

function renderRoleRoutes(roleKey) {
  const config = roleRoutes[roleKey]

  return config.pages.map((page) => (
    <Route
      key={page.path}
      path={page.path}
      element={<PagePlaceholder role={config.roleLabel} title={page.title} />}
    />
  ))
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="news" element={<News />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {renderRoleRoutes('admin')}
        </Route>

        <Route path="/dentist" element={<DentistLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {renderRoleRoutes('dentist')}
        </Route>

        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {renderRoleRoutes('employee')}
        </Route>

        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {renderRoleRoutes('patient')}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}