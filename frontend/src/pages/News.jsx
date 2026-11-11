import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, Sparkles, ChevronRight } from 'lucide-react'

const NEWS_CATEGORIES = [
  'Tất cả',
  'Tin tức & Sự kiện',
  'Hoạt động nha khoa',
  'Báo chí đưa tin',
  'Khuyến mãi & Ưu đãi',
  'Chia sẻ chuyên môn',
]

const FEATURED_NEWS = {
  id: 1,
  title: 'Crown Dental khai trương trung tâm cấy ghép Implant & Chỉnh nha kỹ thuật số tiêu chuẩn Châu Âu',
  excerpt: 'Đánh dấu cột mốc phát triển mới, Crown Dental chính thức đưa vào vận hành hệ thống máy scan iTero Element 5D và CT Cone Beam 3D thế hệ mới nhất, nâng tầm trải nghiệm điều trị không đau cho hơn 50.000 bệnh nhân.',
  date: '28/05/2026',
  author: 'Ban Truyền Thông Crown',
  category: 'Tin tức & Sự kiện',
  readTime: '5 phút đọc',
  image: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=1200',
  tags: ['Khai trương', 'Công nghệ số', 'Cơ sở mới'],
}

const NEWS_LIST = [
  {
    id: 2,
    title: 'Hội thảo khoa học: Ứng dụng AI và mô phỏng 3D trong lập phác đồ niềng răng trong suốt',
    excerpt: 'Hội đồng chuyên môn Crown Dental chia sẻ kinh nghiệm điều trị hơn 1.000 ca Invisalign phức tạp cùng các chuyên gia nha khoa quốc tế.',
    date: '20/05/2026',
    author: 'ThS. BS. Nguyễn Minh Tuấn',
    category: 'Chia sẻ chuyên môn',
    readTime: '4 phút',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    title: 'Chương trình "Nụ Cười Cho Em": Khám & điều trị răng miệng miễn phí cho 300 trẻ em khó khăn',
    excerpt: 'Chiến dịch vì cộng đồng thường niên của hệ thống nha khoa Crown tiếp tục lan tỏa nụ cười ấm áp tới các em nhỏ tại các điểm trường vùng cao.',
    date: '15/05/2026',
    author: 'Crown CSR Team',
    category: 'Hoạt động nha khoa',
    readTime: '3 phút',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 4,
    title: 'Crown Dental nhận giải thưởng "Top 10 Hệ thống Nha khoa Tiêu biểu Châu Á - Thái Bình Dương"',
    excerpt: 'Vinh danh chất lượng chuyên môn xuất sắc, dịch vụ chuẩn mực và chính sách bảo hành minh bạch phục vụ người bệnh suốt hơn một thập kỷ.',
    date: '10/05/2026',
    author: 'VTV & Báo chí',
    category: 'Báo chí đưa tin',
    readTime: '4 phút',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 5,
    title: 'Ký kết hợp tác chuyển giao công nghệ dán sứ Veneer Emax thế hệ mới từ Ivoclar Vivadent',
    excerpt: 'Đảm bảo 100% phôi sứ chính hãng nhập khẩu trực tiếp từ Thụy Sĩ và Đức, bảo tồn tối đa răng gốc và bảo hành chính hãng trọn đời.',
    date: '02/05/2026',
    author: 'Crown Dental',
    category: 'Tin tức & Sự kiện',
    readTime: '3 phút',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 6,
    title: 'Mừng ngày Quốc Tế Phụ Nữ: Tuần lễ tri ân sắc đẹp nụ cười với hàng trăm suất quà tài trợ',
    excerpt: 'Nhiều chương trình đặc quyền hỗ trợ chi phí tẩy trắng răng, tầm soát răng miệng tổng quát và trả góp 0% lãi suất cho phái đẹp.',
    date: '25/04/2026',
    author: 'Crown Marketing',
    category: 'Khuyến mãi & Ưu đãi',
    readTime: '2 phút',
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=800',
  },
]

export default function News() {
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const filteredNews = activeCategory === 'Tất cả'
    ? NEWS_LIST
    : NEWS_LIST.filter(item => item.category === activeCategory)

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      {/* 1. Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#1f4fb2] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-[#1f4fb2] font-semibold">Tin Tức & Sự Kiện</span>
        </div>
      </div>

      {/* 2. Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2b66] via-[#1f4fb2] to-[#00a859] py-16 lg:py-20 text-white">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#00a859]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#4ade80] backdrop-blur-md mb-4">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
            <span>CROWN DENTAL NEWSROOM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
            Tin Tức, Sự Kiện & Hoạt Động Y Khoa
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
            Cập nhật những chuyển động mới nhất về công nghệ nha khoa, sự kiện học thuật, hoạt động cộng đồng và các thành tựu nổi bật của Crown Dental.
          </p>
        </div>
      </section>

      {/* 3. Main Content Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Category Pills Navigation */}
        <div className="flex flex-wrap gap-2 pb-8 border-b border-slate-200/80">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#1f4fb2] to-[#2563eb] text-white shadow-sm scale-102'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1f4fb2]/40 hover:text-[#1f4fb2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Highlight Article */}
        <div className="mt-8">
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] items-stretch">
              <div className="relative h-72 lg:h-auto min-h-[300px] overflow-hidden bg-slate-100">
                <img
                  src={FEATURED_NEWS.image}
                  alt={FEATURED_NEWS.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm">
                  Tin Tiêu Điểm
                </div>
              </div>
              <div className="p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-medium">
                    <span className="text-[#1f4fb2] font-bold bg-blue-50 px-2.5 py-1 rounded-md">
                      {FEATURED_NEWS.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {FEATURED_NEWS.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {FEATURED_NEWS.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors leading-snug mb-3">
                    {FEATURED_NEWS.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                    {FEATURED_NEWS.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1f4fb2] flex items-center justify-center font-bold text-xs">
                      CD
                    </div>
                    <span className="text-xs font-bold text-slate-700">{FEATURED_NEWS.author}</span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#1f4fb2] group-hover:translate-x-1 transition-transform">
                    Đọc toàn bộ bài viết <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Articles Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#00a859] rounded-full inline-block" />
              Các Bản Tin Cập Nhật
            </h3>
            <span className="text-xs font-bold text-slate-400">Hiển thị {filteredNews.length} bài viết</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=800'
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[#1f4fb2] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {item.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.date}
                      </span>
                      <span>•</span>
                      <span>{item.readTime}</span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">{item.author}</span>
                    <span className="font-extrabold text-[#1f4fb2] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Chi tiết <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Newsletter Signup Banner */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-black">Đăng Ký Nhận Bản Tin Nha Khoa Hàng Tuần</h4>
            <p className="text-xs text-blue-100 font-medium">Nhận thông tin ưu đãi mới nhất và kiến thức chăm sóc răng miệng khoa học từ bác sĩ.</p>
          </div>
          <div className="flex w-full md:w-auto max-w-md gap-2">
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="w-full rounded-xl bg-white px-4 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white"
            />
            <button
              type="button"
              className="shrink-0 rounded-xl bg-[#0f2b66] hover:bg-[#0a1e4a] text-white px-5 py-2.5 text-xs font-bold transition duration-200 cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
