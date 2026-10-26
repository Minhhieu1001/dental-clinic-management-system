import { Outlet, useLocation } from 'react-router-dom';
import PatientHeader from './PatientHeader.jsx';
import { roleRoutes } from '../../constants/roleRoutes.js';

export default function PatientLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === '/patient/dashboard' || location.pathname === '/patient';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      <PatientHeader config={roleRoutes.patient} />

      <main className={`flex-1 w-full ${isDashboard ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/60 bg-white py-4 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Crown Dental Clinic. Nền tảng chăm sóc sức khỏe nụ cười trọn đời.</p>
          <p className="text-slate-400">
            Hotline hỗ trợ bệnh nhân: <span className="font-semibold text-emerald-700">1900 1234</span> (24/7)
          </p>
        </div>
      </footer>
    </div>
  );
}
