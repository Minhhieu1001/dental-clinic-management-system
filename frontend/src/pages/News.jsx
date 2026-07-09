import SectionHeading from '../components/common/SectionHeading.jsx'
import { newsCards } from '../constants/publicSiteContent.js'

export default function News() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Tin tức & sự kiện"
        title="Khung trang tin tức"
        description="Dùng cho bài viết, sự kiện, kiến thức và các cập nhật mới theo kiểu tạp chí."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-72 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-sky-50" />
          <h3 className="mt-6 text-2xl font-semibold text-slate-900">Bài viết nổi bật</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Đây là khung cho một bài viết lớn hoặc tin nổi bật, đi kèm ảnh bìa, mô tả và CTA đọc thêm.
          </p>
        </article>

        <div className="grid gap-4">
          {newsCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-28 rounded-2xl bg-slate-100" />
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}