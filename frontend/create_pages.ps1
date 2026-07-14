$pages = @(
    "dashboard\AdminDashboard.jsx",
    "appointment\AdminAppointments.jsx",
    "patient\AdminPatients.jsx",
    "user\AdminDentists.jsx",
    "employee\EmployeeManagement.jsx",
    "billing\AdminBilling.jsx",
    "inventory\AdminInventory.jsx",
    "promotion\Promotions.jsx",
    "notification\AdminNotifications.jsx",
    "user\AdminSettings.jsx",
    "treatment\Services.jsx",

    "dashboard\DentistDashboard.jsx",
    "appointment\DentistAppointments.jsx",
    "treatment\TreatmentPlans.jsx",
    "medical-record\MedicalRecords.jsx",
    "prescription\Prescriptions.jsx",
    "ai-xray\XrayAnalysis.jsx",
    "patient\DentistPatients.jsx",
    "notification\DentistNotifications.jsx",

    "dashboard\EmployeeDashboard.jsx",
    "appointment\EmployeeAppointments.jsx",
    "patient\EmployeePatients.jsx",
    "billing\EmployeeBilling.jsx",
    "inventory\EmployeeInventory.jsx",
    "inventory\ImportExport.jsx",
    "report\EmployeeReport.jsx",
    "notification\EmployeeNotifications.jsx",
    "patient\PatientsWaiting.jsx",

    "dashboard\PatientDashboard.jsx",
    "appointment\PatientAppointments.jsx",
    "medical-record\PatientMedicalRecords.jsx",
    "prescription\PatientPrescriptions.jsx",
    "billing\PatientInvoices.jsx",
    "review\PatientReviews.jsx",
    "notification\PatientNotifications.jsx",
    "user\PatientProfile.jsx"
)

foreach ($p in $pages) {
    $dir = Split-Path "src\features\$p" -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $filename = Split-Path $p -Leaf
    $name = $filename.Replace(".jsx", "")
    $content = "export default function $name() {`n  return (`n    <div className=`"rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100`">`n      <h2 className=`"text-xl font-bold text-slate-800`">$name</h2>`n      <p className=`"mt-2 text-slate-500`">Giao diện của tính năng $name sẽ nằm ở đây.</p>`n    </div>`n  );`n}"
    Set-Content -Path "src\features\$p" -Value $content -Encoding UTF8
}
