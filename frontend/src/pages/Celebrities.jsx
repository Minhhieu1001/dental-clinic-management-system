import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Star, Award, CheckCircle2, Quote, ArrowRight, ShieldCheck, Camera, Heart, Play, Calendar } from 'lucide-react'
import AppointmentRequestModal from '../components/ui/AppointmentRequestModal'

// Celebrity data showcase
const CELEBRITY_CATEGORIES = [
  { id: 'all', name: 'Tất Cả Nụ Cười Sao' },
  { id: 'actor', name: 'Diễn Viên & MC' },
  { id: 'beauty', name: 'Hoa Hậu & Người Mẫu' },
  { id: 'singer', name: 'Ca Sĩ & Âm Nhạc' },
  { id: 'business', name: 'Doanh Nhân & KOLs' },
]

const CELEBRITY_LIST = [
  {
    id: 'c1',
    category: 'beauty',
    name: 'Hoa Hậu H\'Hen Niê',
    role: 'Hoa Hậu Hoàn Vũ Việt Nam',
    service: 'Dán Sứ Veneer Emax Ultra-Thin',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    quote: 'Nụ cười tự nhiên là chìa khóa giúp Hen luôn năng lượng và tỏa sáng trên các sàn diễn quốc tế. Cảm ơn đội ngũ bác sĩ Crown Dental đã chăm sóc nụ cười của Hen vô cùng tận tâm!',
    stats: '10 Mặt Sứ Emax • Trắng Sáng Tự Nhiên',
    rating: 5,
  },
  {
    id: 'c2',
    category: 'actor',
    name: 'Diễn Viên Quốc Trường',
    role: 'Diễn Viên Điện Ảnh',
    service: 'Niềng Răng Invisalign & Tẩy Trắng',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    quote: 'Lịch quay phim bận rộn nhưng niềng răng trong suốt Invisalign tại Crown hoàn toàn không ảnh hưởng đến phát âm hay hình ảnh của Trường. Rất hài lòng với dịch vụ chuẩn 5 sao!',
    stats: 'Khay Invisalign #01 • 18 Tháng Điều Trị',
    rating: 5,
  },
  {
    id: 'c3',
    category: 'singer',
    name: 'Ca Sĩ Đông Nhi',
    role: 'Ca Sĩ Chuyên Nghiệp',
    service: 'Phục Hình Thẩm Mỹ Smile Design 3D',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
    quote: 'Mỗi lần biểu diễn trước hàng ngàn khán giả, nụ cười rạng rỡ giúp Nhi cảm thấy vô cùng tự tin. Đội ngũ bác sĩ Crown thiết kế nụ cười riêng biệt rất tinh tế và tự nhiên.',
    stats: 'Thiết Kế Smile Design 3D • Bảo Hành 15 Năm',
    rating: 5,
  },
  {
    id: 'c4',
    category: 'beauty',
    name: 'Hoa Hậu Thùy Tiên',
    role: 'Miss Grand International',
    service: 'Bọc Răng Sứ Thẩm Mỹ Lava Ultimate',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800',
    quote: 'Tiên luôn ưu tiên sự an toàn và chất lượng y khoa hàng đầu. Crown Dental đáp ứng mọi tiêu chuẩn khắt khe nhất với công nghệ vô trùng tuyệt đối.',
    stats: 'Sứ Lava Đức • Chuẩn Y Khoa Quốc Tế',
    rating: 5,
  },
  {
    id: 'c5',
    category: 'actor',
    name: 'Ninh Dương Lan Ngọc',
    role: 'Diễn Viên Điện Ảnh',
    service: 'Dán Sứ Veneer Không Mài Răng',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
    quote: 'Ngọc rất sợ đau và sợ mài răng thật, nhưng công nghệ dán sứ Veneer Emax tại Crown nhẹ nhàng đến không ngờ. Răng thật được bảo tồn trọn vẹn 100%!',
    stats: 'Bảo Tồn Răng Thật • Bảo Hành Trọn Đời',
    rating: 5,
  },
  {
    id: 'c6',
    category: 'business',
    name: 'Doanh Nhân Shark Lê Hùng',
    role: 'CEO & Nhà Đầu Tư',
    service: 'Cấy Ghép Implant Straumann Thụy Sĩ',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
    quote: 'Sự chuyên nghiệp, đúng giờ và công nghệ cấy ghép Implant không đau tại Crown khiến một người bận rộn như tôi hoàn toàn yên tâm và tin tưởng tuyệt đối.',
    stats: 'Implant Thụy Sĩ • Phục Hồi Tức Thì 24h',
    rating: 5,
  },
]

const STATS_DATA = [
  { number: '500+', label: 'Nghệ Sĩ & Người Nổi Tiếng' },
  { number: '50,000+', label: 'Ca Kiến Tạo Nụ Cười' },
  { number: '100%', label: 'Sứ & Khay Niềng Chính Hãng' },
  { number: '99.8%', label: 'Tỷ Lệ Hài Lòng Tuyệt Đối' },
]

export default function Celebrities() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredCelebrities = activeCategory === 'all'
    ? CELEBRITY_LIST
    : CELEBRITY_LIST.filter((c) => c.category === activeCategory)

  return (
    <div className="bg-[#f8fafc] pb-24">
      {/* 1. Ultra Premium Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2b66] via-[#1f4fb2] to-[#00a859] py-20 lg:py-28 text-white">
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00a859]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-[#4ade80] backdrop-blur-md mb-6">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
            <span>CROWN DENTAL CELEBRITY SMILES</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Nụ Cười Tỏa Sáng Của <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-blue-100 to-[#4ade80] bg-clip-text text-transparent">
              Các Ngôi Sao & Người Nổi Tiếng
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-blue-100/90 font-medium max-w-3xl mx-auto leading-relaxed mb-10">
            Hàng trăm nghệ sĩ, hoa hậu, diễn viên và người ảnh hưởng hàng đầu Việt Nam đã tin tưởng chọn Crown Dental làm người bạn đồng hành kiến tạo nụ cười hoàn hảo.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#00a859] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-8 py-4 shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <Calendar size={16} />
              <span>Đăng Ký Tư Vấn Nụ Cười Ngôi Sao</span>
            </button>
            <a
              href="#celebrity-gallery"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-7 py-4 backdrop-blur-md transition-all duration-300"
            >
              <span>Khám Phá Câu Chuyện Khách Hàng</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8">
            {STATS_DATA.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">{stat.number}</p>
                <p className="text-[11px] sm:text-xs text-blue-100/80 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Category Filter & Gallery Section */}
      <section id="celebrity-gallery" className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Section Title */}
        <div className="text-center mb-12">
          <span className="inline-block bg-[#1f4fb2]/10 border border-[#1f4fb2]/20 text-[#1f4fb2] text-xs font-extrabold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full mb-3">
            GƯƠNG MẶT ĐẠI DIỆN TIN TƯỞNG
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Hành Trình Kiến Tạo Nụ Cười Ngôi Sao
          </h2>
          <p className="mt-3 text-sm text-slate-600 font-medium max-w-2xl mx-auto">
            Lắng nghe trải nghiệm thực tế và cảm nhận trực tiếp từ các nghệ sĩ khi chăm sóc răng miệng tại Crown Dental.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-14">
          {CELEBRITY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-5 py-2.5 text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#1f4fb2] to-[#2563eb] text-white shadow-md shadow-blue-500/20 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1f4fb2]/40 hover:text-[#1f4fb2]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Celebrities Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCelebrities.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(31,79,178,0.14)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Photo Wrapper */}
              <div className="relative h-72 overflow-hidden bg-slate-100">
                <img
                  src={c.image}
                  alt={c.name}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                {/* Service Tag on Image */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-[#1f4fb2] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    <Sparkles size={12} className="text-[#00a859]" />
                    {c.service}
                  </span>
                </div>

                {/* Name & Role overlay on Image bottom */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-black leading-snug">{c.name}</h3>
                  <p className="text-xs text-blue-200 font-medium">{c.role}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {/* Quote Icon & Text */}
                <div>
                  <Quote size={24} className="text-[#1f4fb2]/20 mb-2" />
                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                    "{c.quote}"
                  </p>
                </div>

                {/* Highlight Stats & Rating */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#00a859] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full truncate max-w-[200px]">
                    {c.stats}
                  </div>
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 3D Smile Design Technology Showcase */}
      <section className="py-16 bg-white border-y border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="inline-block bg-[#00a859]/10 border border-[#00a859]/20 text-[#00a859] text-xs font-extrabold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full">
                CÔNG NGHỆ ĐẮC LỰC
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                Thiết Kế Nụ Cười 3D Smile Design Theo Tỉ Lệ Vàng
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Tại Crown Dental, mỗi nụ cười được cá nhân hóa hoàn toàn dựa trên đường nét khuôn mặt, màu da và tính cách riêng của từng khách hàng.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1f4fb2] flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Xem trước kết quả nụ cười trước khi điều trị</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Mô phỏng hình thể và màu sắc răng 3D chính xác 99.9% trên phần mềm chuyên dụng.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a859] flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Quét dấu răng kỹ thuật số iTero Element 5D</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Không cần lấy dấu cao su gây khó chịu, hoàn thành quét toàn bộ 2 hàm trong 60 giây.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1f4fb2] flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Sứ Emax chính hãng bảo tốn 100% răng thật</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Mặt dán sứ siêu mỏng 0.2mm, không mài nhỏ răng, không hôi miệng, không ê buốt.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Media Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group">
              <img
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1000"
                alt="3D Smile Design"
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-8">
                <div className="text-white">
                  <span className="inline-flex items-center gap-2 bg-[#00a859] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                    <ShieldCheck size={14} /> Tiêu chuẩn Thụy Sĩ
                  </span>
                  <h3 className="text-2xl font-black">Phòng Thăm Khám VIP</h3>
                  <p className="text-xs text-slate-200 mt-1">Không gian riêng tư, vô trùng tuyệt đối theo quy chuẩn Bộ Y Tế.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section */}
      <section className="mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full">
              ƯU ĐÃI NỤ CƯỜI NGÔI SAO
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Sở Hữu Nụ Cười Đẹp Rạng Rỡ Ngay Hôm Nay
            </h2>
            <p className="text-sm text-blue-100 font-medium leading-relaxed">
              Đăng ký thăm khám & phân tích nụ cười 3D miễn phí cùng Hội đồng Bác sĩ Chuyên khoa Crown Dental.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white text-[#1f4fb2] hover:bg-blue-50 text-xs font-black uppercase tracking-wider px-7 py-3.5 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <Calendar size={16} />
                <span>Đặt Lịch Tư Vấn Miễn Phí</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Modal */}
      <AppointmentRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
