import SectionHeading from '../components/common/SectionHeading.jsx'
import { serviceCards } from '../constants/publicSiteContent.js'

export default function Services() {
  return (
    <div className="space-y-10 pb-16">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#1f4fb2]">
              Dịch vụ
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Giao diện dịch vụ sáng, rõ và nhiều lớp
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Khung dịch vụ được làm theo kiểu brochure cao cấp: card lớn, phần mô tả ngắn, các
              lối tắt rõ ràng và một vùng quy trình ở phía dưới.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Khám tổng quát', 'Niềng răng', 'Răng sứ', 'Implant'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {serviceCards.slice(0, 4).map((card, index) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-sm font-semibold text-[#1f4fb2]">
                    0{index + 1}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Dịch vụ chủ lực"
          title="Khung danh mục dịch vụ"
          description="Mỗi card giống một khối giới thiệu ngắn, phù hợp để thêm ảnh, mô tả và CTA sau này."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="h-44 rounded-2xl bg-gradient-to-br from-slate-100 via-white to-[#edf4ff]" />
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-[#1f4fb2] to-[#5d7fe8] p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">
                Đặt hẹn nhanh
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Khung CTA giúp dẫn người dùng vào quy trình tư vấn
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
                Khi muốn, bạn có thể nối nút này sang form đặt lịch hoặc modal đăng ký sau.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-white/15 px-5 py-3 text-sm font-semibold">
                Hotline 1900 6899
              </div>
              <div className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1f4fb2]">
                Gửi yêu cầu tư vấn
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Quy trình"
          title="Khung quy trình điều trị"
          description="Bố cục này giúp người xem hiểu nhanh các bước từ tư vấn đến theo dõi sau điều trị."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {['Tư vấn', 'Khám & chụp', 'Lập kế hoạch', 'Theo dõi sau điều trị'].map((step, index) => (
            <div key={step} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-[#1f4fb2]">0{index + 1}</div>
              <p className="mt-2 text-sm text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}