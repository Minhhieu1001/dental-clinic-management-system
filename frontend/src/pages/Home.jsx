import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'

const quickLinks = [
  { label: 'Đặt lịch khám', to: '/services' },
  { label: 'Xem bảng giá', to: '/pricing' },
  { label: 'Tin tức nha khoa', to: '/news' },
]

export default function Home() {
  return (
    <div className="space-y-8 pb-16">
      <section className="border-b border-slate-200 bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Nha khoa kim
            </span>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Trang điều hướng chính cho phòng khám nha khoa
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Đây là home page công khai theo mẫu tham chiếu, dùng để dẫn đến các khu vực
              chức năng của hệ thống và các trang thông tin cần thiết.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-sky-200/40 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <img
                src={heroImg}
                alt="Dental clinic hero"
                className="h-[420px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Welcome</p>
                <p className="mt-2 max-w-md text-2xl font-semibold">
                  Hệ thống quản lý phòng khám nha khoa đa vai trò
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}