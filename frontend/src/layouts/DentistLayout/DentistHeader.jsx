import { Link } from 'react-router-dom'

export default function DentistHeader({ config }) {
  const { roleLabel, title, subtitle } = config;
  
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/login" className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
            Dental Clinic
          </span>
          <span className="text-lg font-semibold text-slate-900">
            Dentist Portal
          </span>
        </Link>

        <div className="text-right">
          <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {roleLabel}
          </div>
          <h1 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
            {title}
          </h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </header>
  )
}
