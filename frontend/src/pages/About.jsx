import SectionHeading from '../components/common/SectionHeading.jsx'
import { achievementCards } from '../constants/publicSiteContent.js'

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Về Nha Khoa Kim"
        title="Khung trang giới thiệu"
        description="Trang này đóng vai trò giới thiệu hệ thống, triết lý vận hành và các dấu mốc phát triển."
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-72 rounded-3xl bg-gradient-to-br from-sky-100 via-white to-blue-50" />
          <h3 className="mt-6 text-xl font-semibold text-slate-900">Câu chuyện thương hiệu</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Khung này dùng để kể về đội ngũ, định hướng phục vụ và cách phòng khám xây dựng
            trải nghiệm khách hàng theo chuẩn vận hành nhất quán.
          </p>
        </div>

        <div className="grid gap-4">
          {achievementCards.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}