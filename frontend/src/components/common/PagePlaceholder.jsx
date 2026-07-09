export default function PagePlaceholder({ role, title }) {
  return (
    <section className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white/85 px-6 py-16 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
        {role}
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm text-slate-500">
        
      </p>
    </section>
  )
}