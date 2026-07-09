import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import SectionHeading from '../components/common/SectionHeading.jsx'
import {

  heroHighlights,
  newsCards,
  shortcutItems,
  spotlightCards,
  serviceCards,
  testimonialCards,
} from '../constants/publicSiteContent.js'

const quickLinks = [
  { label: 'Đặt lịch khám', to: '/services' },
  { label: 'Xem bảng giá', to: '/pricing' },
  { label: 'Tin tức nha khoa', to: '/news' },
]

export default function Home() {
  return (
    <div className="space-y-12 pb-16">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f4fb2] text-xs font-bold text-white shadow-sm">
                  DK
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#1f4fb2]">
                    Nha khoa kim style
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Hệ thống quản lý nha khoa đa vai trò
                  </h2>
                </div>
              </div>

              <p className="max-w-xl text-base leading-7 text-slate-600">
                Giao diện được làm lại theo tinh thần trang nha khoa cao cấp: sạch, sáng, nhiều
                lớp thông tin và các khối điều hướng rõ ràng cho dịch vụ, tin tức, kiến thức và
                đặt hẹn.
              </p>

              <div className="flex flex-wrap gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-full border border-slate-200 bg-[#f8faff] px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1f4fb2] hover:text-[#1f4fb2]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-[#dfeaff] blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <img
                  src={heroImg}
                  alt="Dental clinic hero"
                  className="h-[440px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Sự lựa chọn của nhiều người</p>
                  <p className="mt-2 max-w-md text-2xl font-semibold">
                    Một khung hero sáng, lớn và rõ ràng cho trang chủ phòng khám
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcutItems.map((item, index) => (
            <div
              key={item}
              className="flex flex-col items-center rounded-[1.5rem] border border-slate-200 bg-white px-4 py-5 text-center shadow-sm"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-lg font-semibold text-[#1f4fb2]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {heroHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-3xl font-semibold tracking-tight text-[#2d6cdf]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Thành tựu khẳng định vị thế"
          title="Khung nội dung nổi bật"
          description="Các khung lớn giúp trang chủ có nhịp thị giác giống website tham chiếu hơn, với ảnh lớn và card đều nhau."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <article className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:row-span-2">
            <div className="h-full min-h-[420px] bg-gradient-to-br from-[#edf4ff] via-white to-slate-50 p-6">
              <div className="max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1f4fb2]">
                  Parkway style
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Sự lựa chọn của nhiều người nổi tiếng
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Khung nội dung lớn ở bên trái để tạo cảm giác như banner chiến dịch hoặc hero
                  nổi bật trên trang chủ nha khoa.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
                {['Ca sĩ', 'MC', 'Người mẫu', 'Vlogger'].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-white/80 bg-white/90 p-3 text-center shadow-sm"
                  >
                    <div className="h-24 rounded-[1rem] bg-slate-100" />
                    <p className="mt-3 text-xs font-semibold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {spotlightCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-36 rounded-[1.5rem] bg-gradient-to-br from-slate-100 via-white to-[#eef5ff]" />
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Thành tựu khẳng định vị thế"
          title="Khung dịch vụ nổi bật"
          description="Bố cục này mô phỏng nhóm dịch vụ chủ lực như khám tổng quát, niềng răng, răng sứ và implant theo dạng card sáng, đều và thoáng."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-sm font-semibold text-[#1f4fb2]">
                •
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-5 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 w-2/3 rounded-full bg-[#1f4fb2]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Cảm nhận của khách hàng"
          title="Khung testimonial và video"
          description="Thay vì nhúng video thật, khung này để sẵn các thẻ phản hồi hoặc nội dung media sau này."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {testimonialCards.map((item) => (
            <figure
              key={item.author}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-100 via-white to-[#edf4ff]" />
              <blockquote className="mt-5 text-sm leading-7 text-slate-600">“{item.quote}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-slate-900">{item.author}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tin tức & sự kiện"
          title="Khung tin tức và kiến thức"
          description="Các khung này giúp trang home có cảm giác giống website thật hơn với các mục bài viết nổi bật."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {newsCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-100 via-white to-[#edf4ff]" />
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Xem thêm
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}