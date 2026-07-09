export default function Footer({ footer }) {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80">
      <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
        {footer}
      </div>
    </footer>
  )
}