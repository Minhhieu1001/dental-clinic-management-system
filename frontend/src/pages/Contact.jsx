import SectionHeading from '../components/common/SectionHeading.jsx'
import { contactMethods } from '../constants/publicSiteContent.js'

export default function Contact() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Liên hệ"
        title="Khung trang liên hệ"
        description="Trang này dành cho hotline, chi nhánh, form đăng ký và các CTA đặt hẹn nhanh."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Thông tin nhanh</h3>
          <div className="mt-5 grid gap-4">
            {contactMethods.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Form đăng ký khung</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100 sm:col-span-2" />
            <div className="h-32 rounded-2xl bg-slate-100 sm:col-span-2" />
            <div className="inline-flex w-fit rounded-full bg-[#2d6cdf] px-5 py-3 text-sm font-semibold text-white">
              Gửi yêu cầu
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}