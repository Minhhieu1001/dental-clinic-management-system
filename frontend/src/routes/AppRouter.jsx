import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminLayout from '../layouts/AdminLayouts.jsx'
import DentistLayout from '../layouts/DentistLayout.jsx'
import EmployeeLayout from '../layouts/EmployeeLayout.jsx'
import PatientLayout from '../layouts/PatientLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import Home from '../pages/Home.jsx'
import About from '../pages/About.jsx'
import ServicesPublic from '../pages/Services.jsx'
import Pricing from '../pages/Pricing.jsx'
import News from '../pages/News.jsx'
import Contact from '../pages/Contact.jsx'
import PromotionsPublic from '../pages/Promotions.jsx'
import PromotionDetail from '../pages/PromotionDetail.jsx'
import PublicInfo from '../pages/PublicInfo.jsx'
import Celebrities from '../pages/Celebrities.jsx'
import Knowledge from '../pages/Knowledge.jsx'
import KnowledgeDetail from '../pages/KnowledgeDetail.jsx'
import Login from '../pages/Login.jsx'

// Feature Components - Admin
import AdminDashboard from '../features/dashboard/AdminDashboard.jsx'
import AdminAppointments from '../features/appointment/AdminAppointments.jsx'
import AdminPatients from '../features/patient/AdminPatients.jsx'
import AdminDentists from '../features/user/AdminDentists.jsx'
import EmployeeManagement from '../features/employee/EmployeeManagement.jsx'
import AdminBilling from '../features/billing/admin/AdminBilling.jsx'
import MedicationManagement from '../features/prescriptions/admin/MedicationManagement.jsx'
import Promotions from '../features/promotion/Promotions.jsx'
import AdminNotifications from '../features/notification/AdminNotifications.jsx'
import AdminSettings from '../features/user/AdminSettings.jsx'
import ServicesAdmin from '../features/treatment/Services.jsx'

// Feature Components - Dentist
import DentistDashboard from '../features/dashboard/DentistDashboard.jsx'
import DentistAppointments from '../features/appointment/DentistAppointments.jsx'
import FollowUpAppointment from '../features/appointment/dentist/FollowUpAppointment.jsx'
import TreatmentPlans from '../features/treatment/TreatmentPlans.jsx'
import ClinicalExamination from '../features/treatment/ClinicalExamination.jsx'
import MedicalRecords from '../features/medical-record/dentist/MedicalRecords.jsx'
import Prescriptions from '../features/prescriptions/dentist/Prescriptions.jsx'
import XrayAnalysis from '../features/ai-xray/XrayAnalysis.jsx'
import DentistPatients from '../features/patient/DentistPatients.jsx'
import DentistNotifications from '../features/notification/DentistNotifications.jsx'

// Feature Components - Employee
import EmployeeDashboard from '../features/dashboard/EmployeeDashboard.jsx'
import EmployeeAppointments from '../features/appointment/EmployeeAppointments.jsx'
import EmployeePatients from '../features/patient/EmployeePatients.jsx'
import EmployeeBilling from '../features/billing/employee/EmployeeBilling.jsx'
import InvoiceLookup from '../features/billing/employee/InvoiceLookup.jsx'
import CustomerCare from '../features/customer-care/CustomerCare.jsx'
import EmployeeInventory from '../features/prescriptions/EmployeeInventory.jsx'
import ImportExport from '../features/prescriptions/ImportExport.jsx'
import EmployeeReport from '../features/report/EmployeeReport.jsx'
import EmployeeNotifications from '../features/notification/EmployeeNotifications.jsx'

// Feature Components - Patient
import PatientDashboard from '../features/dashboard/PatientDashboard.jsx'
import PatientAppointments from '../features/appointment/PatientAppointments.jsx'
import PatientMedicalRecords from '../features/medical-record/PatientMedicalRecords.jsx'
import PatientPrescriptions from '../features/prescriptions/dentist/PatientPrescriptions.jsx'
import PatientInvoices from '../features/billing/PatientInvoices.jsx'
import PatientReviews from '../features/review/PatientReviews.jsx'
import PatientNotifications from '../features/notification/PatientNotifications.jsx'
import PatientProfile from '../features/user/PatientProfile.jsx'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="services" element={<ServicesPublic />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="news" element={<News />} />
          <Route path="contact" element={<Contact />} />
          <Route path="promotions" element={<PromotionsPublic />} />
          <Route path="promotions/:id" element={<PromotionDetail />} />
          <Route path="celebrities" element={<Celebrities />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="knowledge/:id" element={<KnowledgeDetail />} />
          <Route path="careers" element={<PublicInfo />} />
          <Route path="doctors" element={<PublicInfo />} />
        </Route>

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes - Admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="dentists" element={<AdminDentists />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="medicines" element={<MedicationManagement />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="services" element={<ServicesAdmin />} />
          </Route>
        </Route>

        {/* Protected routes - Dentist */}
        <Route element={<ProtectedRoute allowedRoles={['DENTIST']} />}>
          <Route path="/dentist" element={<DentistLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DentistDashboard />} />
            <Route path="appointments" element={<DentistAppointments />} />
            <Route path="follow-up" element={<FollowUpAppointment />} />
            <Route path="treatment-plans" element={<TreatmentPlans />} />
            <Route path="clinical-exam" element={<ClinicalExamination />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="xray-analysis" element={<XrayAnalysis />} />
            <Route path="patients" element={<DentistPatients />} />
            <Route path="notifications" element={<DentistNotifications />} />
          </Route>
        </Route>

        {/* Protected routes - Employee */}
        <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="appointments" element={<EmployeeAppointments />} />
            <Route path="follow-up" element={<FollowUpAppointment />} />
            <Route path="patients" element={<EmployeePatients />} />
            <Route path="invoice" element={<EmployeeBilling />} />
            <Route path="invoice-lookup" element={<InvoiceLookup />} />
            <Route path="customer-care" element={<CustomerCare />} />
            <Route path="inventory" element={<EmployeeInventory />} />
            <Route path="import-export" element={<ImportExport />} />
            <Route path="report" element={<EmployeeReport />} />
            <Route path="notifications" element={<EmployeeNotifications />} />
          </Route>
        </Route>

        {/* Protected routes - Patient */}
        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="medical-records" element={<PatientMedicalRecords />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="invoices" element={<PatientInvoices />} />
            <Route path="reviews" element={<PatientReviews />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="profile" element={<PatientProfile />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
