import { useState, useEffect } from 'react'
import { getServices, getDentists, getReviews, createAppointment } from '../services/api'

// SVG icon components matching the reference design
const IconUuDai = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <rect x="6" y="10" width="36" height="28" rx="4" />
    <path d="M6 18h36" />
    <circle cx="17" cy="30" r="4" />
    <circle cx="31" cy="30" r="4" />
    <path d="M21 26l6 8" />
  </svg>
)

const IconGiaTot = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M24 8v4M24 36v4M14 24H8M40 24h-6" />
    <circle cx="24" cy="24" r="10" />
    <path d="M21 21h4a2 2 0 010 4h-4a2 2 0 000 4h6" />
    <path d="M24 19v2M24 27v2" />
  </svg>
)

const IconDatLich = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <rect x="7" y="10" width="34" height="30" rx="3" />
    <path d="M7 18h34M16 7v6M32 7v6" />
    <circle cx="30" cy="32" r="7" />
    <path d="M30 28v4l2.5 2.5" />
  </svg>
)

const IconNiengRang = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M8 20c0-8 6-14 16-14s16 6 16 14" />
    <path d="M8 28c0 8 6 14 16 14s16-6 16-14" />
    <rect x="10" y="18" width="28" height="12" rx="2" />
    <line x1="16" y1="18" x2="16" y2="30" />
    <line x1="22" y1="18" x2="22" y2="30" />
    <line x1="28" y1="18" x2="28" y2="30" />
    <line x1="34" y1="18" x2="34" y2="30" />
    <path d="M10 24h28" />
  </svg>
)

const IconNguoiNoiTieng = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <circle cx="24" cy="14" r="7" />
    <path d="M10 40c0-8 6-14 14-14s14 6 14 14" />
    <path d="M24 6l2.5 5 5.5.8-4 3.9.9 5.5L24 18.8l-4.9 2.4.9-5.5-4-3.9 5.5-.8z" fill="none" />
  </svg>
)

const IconTimBacSy = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <circle cx="22" cy="14" r="7" />
    <path d="M8 40c0-7 6-13 14-13" />
    <circle cx="34" cy="34" r="8" />
    <path d="M34 30v4h4" />
  </svg>
)

const IconPhongKham = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <rect x="6" y="16" width="36" height="26" rx="2" />
    <path d="M16 42V30h16v12" />
    <path d="M6 22l18-14 18 14" />
    <line x1="22" y1="34" x2="26" y2="34" />
    <line x1="24" y1="32" x2="24" y2="36" />
  </svg>
)

const IconKienThuc = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M14 8h20a2 2 0 012 2v28a2 2 0 01-2 2H14a2 2 0 01-2-2V10a2 2 0 012-2z" />
    <path d="M18 16h12M18 22h12M18 28h8" />
    <path d="M34 32l6 6" />
    <circle cx="34" cy="30" r="4" />
  </svg>
)

const SHORTCUTS = [
  { name: 'Ưu đãi mới nhất', IconComp: IconUuDai, to: '/promotions', hot: true },
  { name: 'Giá tốt cho bạn', IconComp: IconGiaTot, to: '/pricing' },
  { name: 'Đặt lịch hẹn', IconComp: IconDatLich, to: '/contact' },
  { name: 'Niềng răng', IconComp: IconNiengRang, to: '/services' },
  { name: 'Người nổi tiếng', IconComp: IconNguoiNoiTieng, to: '/celebrities' },
  { name: 'Tìm bác sỹ', IconComp: IconTimBacSy, to: '/doctors' },
  { name: 'Phòng khám', IconComp: IconPhongKham, to: '/contact' },
  { name: 'Kiến thức', IconComp: IconKienThuc, to: '/knowledge' },
]

// Mock images mapping for services
const SERVICE_IMAGES = {
  'Niềng răng Invisalign': 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=300',
  'Răng sứ Veneer': 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=300',
  'Trồng răng Implant': 'https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&q=80&w=300',
  'Khám răng tổng quát': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=300',
  'Tẩy trắng răng': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=300',
  'Nhổ răng khôn': 'https://images.unsplash.com/photo-1533228896864-42b243384210?auto=format&fit=crop&q=80&w=300',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300'

// ─────────────────────────────────────────────────
// Hero showcase data
// ─────────────────────────────────────────────────
const HERO_SHOWCASE_CARDS = [
  {
    name: 'Ca sĩ Min',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=420&h=560',
  },
  {
    name: 'MC Khánh Vy',
    img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=420&h=560',
  },
  {
    name: 'Người mẫu Salim',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=420&h=560',
  },
  {
    name: 'Vlogger Trinh Phạm',
    img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=420&h=560',
  },
]

export default function Home() {
  const [services, setServices] = useState([])
  const [dentists, setDentists] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeDentist, setActiveDentist] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    phone: '',
    serviceName: '',
    branchName: 'Hà Nội - 328 Phố Huế',
    date: '',
    time: '',
    message: '',
  })
  const [bookingStatus, setBookingStatus] = useState({ loading: false, success: false, error: null, data: null })

  // Carousel state now follows the hero showcase cards
  const SLIDE_COUNT = HERO_SHOWCASE_CARDS.length

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, dentistsData, reviewsData] = await Promise.all([
          getServices(),
          getDentists(),
          getReviews(),
        ])
        setServices(servicesData)
        setDentists(dentistsData)
        setReviews(reviewsData)
        if (dentistsData.length > 0) {
          setActiveDentist(dentistsData[0])
        }
      } catch (err) {
        console.error('Error fetching dynamic data:', err)
      }
    }
    fetchData()
  }, [])

  // Auto slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDE_COUNT)
    }, 6000)
    return () => clearInterval(interval)
  }, [SLIDE_COUNT])

  // Handle form change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!bookingForm.fullName || !bookingForm.phone) {
      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!')
      return
    }
    setBookingStatus({ loading: true, success: false, error: null, data: null })
    try {
      const result = await createAppointment(bookingForm)
      setBookingStatus({ loading: false, success: true, error: null, data: result })
      // Clear form
      setBookingForm({
        fullName: '',
        phone: '',
        serviceName: services[0]?.serviceName || '',
        branchName: 'Hà Nội - 328 Phố Huế',
        date: '',
        time: '',
        message: '',
      })
    } catch (err) {
      setBookingStatus({
        loading: false,
        success: false,
        error: err.response?.data?.message || 'Đã xảy ra lỗi kết nối hệ thống. Vui lòng thử lại sau!',
        data: null,
      })
    }
  }

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  return (
    <div className="pb-20 bg-[#f8fbff]">
      {/* 1. Hero showcase */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#ebf3ff_45%,#f9fbff_100%)] select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(214,228,255,0.85),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_24px_60px_rgba(31,79,178,0.12)] ring-1 ring-[#dbe5f8]">
            <div className="grid items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="order-2 flex items-center bg-[linear-gradient(135deg,#f5f9ff_0%,#eaf1fd_100%)] px-5 py-7 sm:px-8 sm:py-10 lg:order-1">
                <div className="mx-auto max-w-xl text-center lg:text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#3557a8]">NHA KHOA CROWN DENTAL</p>
                  <h2 className="mt-3 text-[clamp(1.9rem,4vw,3.4rem)] font-black leading-tight text-[#1f4fb2]">
                    Không gian phòng khám chuyên nghiệp, hiện đại
                  </h2>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
                    Trải nghiệm thăm khám thoải mái với môi trường sạch sẽ, sáng sủa và trang thiết bị đồng bộ theo tiêu chuẩn cao.
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                    {['Phòng chờ sáng', 'Thiết bị hiện đại', 'Quy trình chuyên nghiệp'].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-[#3557a8] ring-1 ring-[#dbe5f8] shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-1 relative min-h-[300px] overflow-hidden lg:order-2 lg:min-h-[420px]">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600"
                  alt="Phòng khám nha khoa chuyên nghiệp"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_42%,rgba(19,35,97,0.12)_100%)]" />

                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#3557a8] shadow-sm ring-1 ring-[#dbe5f8]">
                  CROWN Dental Clinic
                </div>

                <div className="absolute bottom-4 left-4 right-4 max-w-[360px] rounded-[22px] bg-white/94 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a859]">Phòng khám tiêu chuẩn</p>
                  <p className="mt-1 text-lg font-black text-[#1f4fb2]">Sáng, sạch và chuyên nghiệp ngay từ cái nhìn đầu tiên</p>
                  <p className="text-sm text-slate-600">Hình ảnh phòng khám thực tế với không gian hiện đại và thân thiện hơn cho khách hàng.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shortcut icons row */}
      <section className="border-y border-[#eef2fa] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {SHORTCUTS.map((item, index) => {
              const { IconComp } = item
              return (
                <a
                  key={index}
                  href={item.to}
                  className="group flex flex-col items-center rounded-2xl px-2 py-2 text-center transition hover:-translate-y-0.5"
                >
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f6fd] ring-1 ring-[#e3e8f3] transition group-hover:bg-[#e8effd]">
                      <IconComp />
                    </div>
                    {item.hot && (
                      <span
                        className="absolute -top-1.5 -left-1.5 rounded bg-red-500 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-white"
                        style={{ lineHeight: 1 }}
                      >
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] font-semibold leading-snug text-slate-700 transition group-hover:text-[#2d6eea]">
                    {item.name}
                  </p>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Comprehensive dental care */}
      <section id="care-services-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center space-y-3 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00a859]">TIÊU CHUẨN ĐIỀU TRỊ CHẤT LƯỢNG</p>
          <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">
            Chăm Sóc Răng Miệng Toàn Diện
          </h3>
          <p className="max-w-2xl mx-auto text-sm text-slate-500">
            Hệ thống nha khoa uy tín cung cấp đầy đủ giải pháp từ nha khoa tổng quát, phục hình thẩm mỹ đến nắn chỉnh răng chuyên sâu.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {services.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition text-center"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-100 shadow-inner">
                <img
                  src={SERVICE_IMAGES[item.serviceName] || DEFAULT_IMAGE}
                  alt={item.serviceName}
                  className="h-full w-full object-cover transition transform hover:scale-110"
                />
              </div>
              <h4 className="mt-3 text-xs font-bold text-slate-800 line-clamp-2 h-8 flex items-center justify-center">
                {item.serviceName}
              </h4>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Spotlight services & install banner */}
      <section className="bg-gradient-to-b from-[#edf2fc] to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#1f4fb2]">ƯU THẾ VƯỢT TRỘI</p>
            <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">Dịch Vụ Đáng Chú Ý</h3>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {services.filter(s => ['Niềng răng Invisalign', 'Răng sứ Veneer', 'Trồng răng Implant'].includes(s.serviceName)).map((card) => (
              <article
                key={card.id}
                className="flex flex-col bg-white rounded-3xl border border-blue-50/50 overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={SERVICE_IMAGES[card.serviceName] || DEFAULT_IMAGE}
                    alt={card.serviceName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-[#00a859] text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Nổi bật
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-extrabold text-[#1f4fb2]">{card.serviceName}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {card.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Chi phí dự kiến</p>
                      <p className="text-base font-black text-[#00a859]">{formatPrice(card.price)}</p>
                    </div>
                    <a
                      href="#booking-form-section"
                      onClick={() => setBookingForm(prev => ({ ...prev, serviceName: card.serviceName }))}
                      className="rounded-full bg-blue-50 hover:bg-[#1f4fb2] hover:text-white px-4 py-2 text-xs font-bold text-[#1f4fb2] transition"
                    >
                      Đăng ký ngay
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Installment ribbon banner */}
          <div className="mt-12 bg-gradient-to-r from-[#1f4fb2] to-[#00a859] rounded-3xl p-6 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_top_right,_transparent_30%,_rgba(255,255,255,0.15))]" />
            <div className="relative z-10 space-y-2 text-center md:text-left">
              <span className="bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-white/25">
                CHIẾN DỊCH HỖ TRỢ NỤ CƯỜI
              </span>
              <h4 className="text-lg sm:text-xl font-extrabold">
                Chương Trình Trả Góp 0% Lãi Suất tại Crown Dental
              </h4>
              <p className="text-slate-100 text-xs sm:text-sm">
                * Chỉ từ <span className="font-extrabold text-yellow-300">1.000.000đ/tháng</span> khi niềng khay Invisalign. Áp dụng cho mọi chủ thẻ tín dụng.
              </p>
            </div>
            <a
              href="#booking-form-section"
              className="relative z-10 shrink-0 rounded-full bg-white px-6 py-3 text-xs font-bold text-[#1f4fb2] shadow hover:bg-slate-50 transition transform active:scale-95"
            >
              Đăng Ký Tư Vấn Trả Góp
            </a>
          </div>
        </div>
      </section>

      {/* 5. Dentist Team Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00a859]">CHUYÊN GIA HÀNG ĐẦU</p>
          <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">
            Đội Ngũ Bác Sĩ Răng Hàm Mặt Giàu Kinh Nghiệm
          </h3>
          <p className="max-w-2xl mx-auto text-sm text-slate-500">
            Các bác sĩ tốt nghiệp tại các trường đại học y danh tiếng, sở hữu chứng chỉ chuyên sâu và luôn tận tâm vì sức khỏe nụ cười của bạn.
          </p>
        </div>

        {dentists.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-md">
            {/* Active Dentist Spotlight Detail */}
            {activeDentist && (
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <img
                  src={activeDentist.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2'}
                  alt={activeDentist.fullName}
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover border-4 border-slate-50 shadow-md shrink-0"
                />
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#00a859] uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                      Chuyên khoa: {activeDentist.specialization}
                    </span>
                    <h4 className="text-2xl font-black text-[#1f4fb2] mt-1">{activeDentist.fullName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Số CCHN: {activeDentist.licenseNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      🎓 <span className="text-slate-600">{activeDentist.qualification}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      ⭐ <span className="text-slate-600">{activeDentist.experienceYears} năm kinh nghiệm làm việc thực tế</span>
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="#booking-form-section"
                      className="inline-block rounded-full bg-[#1f4fb2] hover:bg-[#183f8d] text-white text-xs font-bold px-5 py-2.5 shadow transition"
                    >
                      Đặt lịch với Bác sĩ
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* List of other dentists on right to pick */}
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 space-y-4 flex flex-col justify-start">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Xem danh sách bác sĩ</h5>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                {dentists.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setActiveDentist(d)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      activeDentist?.id === d.id
                        ? 'border-[#1f4fb2] bg-blue-50/55'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <img
                      src={d.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2'}
                      alt={d.fullName}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-grow">
                      <p className="text-xs font-extrabold text-slate-800">{d.fullName}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{d.specialization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-400">Đang tải danh sách bác sĩ...</p>
        )}
      </section>

      {/* 6. Clinic banner */}
      <section className="bg-slate-50 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] bg-white shadow-[0_22px_55px_rgba(31,79,178,0.10)] ring-1 ring-[#dbe5f8]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(243,248,255,0.92)_0%,rgba(230,238,253,0.82)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(53,87,168,0.08),transparent_20%),radial-gradient(circle_at_90%_10%,rgba(0,168,89,0.08),transparent_18%)]" />

            <div className="relative grid items-center gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-8">
              <div className="order-2 lg:order-1">
                <div className="mx-auto max-w-md text-center lg:text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#3557a8]">
                    KHÔNG GIAN PHÒNG KHÁM
                  </p>
                  <h3 className="mt-3 text-[clamp(1.7rem,3vw,2.6rem)] font-black leading-tight text-[#1f4fb2]">
                    Không gian hiện đại, sạch sẽ và chuyên nghiệp
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                    CROWN Dental mang đến trải nghiệm thăm khám thoải mái với phòng khám sáng, thiết bị đồng bộ và phong cách phục vụ chuẩn mực.
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                    {['Phòng khám vô trùng', 'Thiết bị hiện đại', 'Tiếp đón chuyên nghiệp'].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-[#3557a8] ring-1 ring-[#dbe5f8] shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative order-1 min-h-[280px] lg:order-2 lg:min-h-[340px]">
                <div className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3557a8] shadow-sm lg:flex">
                  ‹
                </div>
                <div className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3557a8] shadow-sm lg:flex">
                  ›
                </div>

                <div className="relative mx-auto flex h-full max-w-[600px] items-end justify-center">
                  <div className="absolute inset-x-0 bottom-0 h-[76%] rounded-[34px] bg-[#dfe8fb] blur-2xl" />
                  <div className="relative h-[290px] w-full overflow-hidden rounded-[34px] bg-slate-100 shadow-[0_22px_50px_rgba(0,0,0,0.14)] ring-1 ring-white/80 sm:h-[320px] lg:h-[340px]">
                    <img
                      src="https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=1200"
                      alt="Phòng khám nha khoa hiện đại"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_58%,rgba(15,23,42,0.18)_100%)]" />

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#3557a8] shadow-sm ring-1 ring-[#dbe5f8]">
                      CROWN Dental Clinic
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 rounded-[22px] bg-white/94 px-4 py-3 shadow-sm backdrop-blur sm:max-w-[340px]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00a859]">Phòng khám tiêu chuẩn</p>
                      <p className="mt-1 text-xl font-black text-[#1f4fb2]">Không gian thăm khám chuyên nghiệp</p>
                      <p className="text-sm text-slate-600">Sáng, sạch, hiện đại và tạo cảm giác tin cậy ngay từ khi bước vào.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Before & After Treatment */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00a859]">HIỆU QUẢ THỰC TẾ</p>
          <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">
            Hiệu Quả Trước & Sau Điều Trị Tại Crown
          </h3>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Case 1 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-blue-50 text-[#1f4fb2] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                Khách hàng: Nguyễn Anh Thư
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-1">Điều trị khấp khểnh & Khớp cắn chéo (22 tháng)</h4>
              <p className="text-xs text-slate-500">
                Lộ trình chỉnh nha Invisalign giúp làm đều cung răng, chỉnh khớp cắn chuẩn xác mà không cần nhổ răng khỏe.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden shadow">
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=300"
                  alt="Trước"
                  className="h-32 w-full object-cover grayscale"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  Trước điều trị
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow border-2 border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=300"
                  alt="Sau"
                  className="h-32 w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#00a859] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  Sau điều trị
                </div>
              </div>
            </div>
          </div>

          {/* Case 2 */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div className="space-y-2">
              <span className="bg-blue-50 text-[#1f4fb2] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                Khách hàng: Trần Quốc Bảo
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-1">Khắc phục răng thưa & Phục hình Veneer sứ</h4>
              <p className="text-xs text-slate-500">
                Dán 8 mặt sứ Veneer Emax siêu mỏng để đóng kín khe thưa, điều chỉnh hình thể răng thẩm mỹ và màu sắc hài hòa.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden shadow">
                <img
                  src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=300"
                  alt="Trước"
                  className="h-32 w-full object-cover grayscale"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  Trước điều trị
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow border-2 border-green-500">
                <img
                  src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=300"
                  alt="Sau"
                  className="h-32 w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-[#00a859] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  Sau điều trị
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-t from-[#edf2fc] to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#1f4fb2]">ĐÁNH GIÁ THỰC TẾ</p>
            <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">Khách Hàng Nói Về Chúng Tôi</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((r) => (
              <figure
                key={r.id}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center text-yellow-400 text-lg">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <blockquote className="text-xs text-slate-600 leading-relaxed italic">
                    “{r.comment}”
                  </blockquote>
                </div>
                <figcaption className="border-t border-slate-50 pt-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#1f4fb2]/10 flex items-center justify-center text-xs font-bold text-[#1f4fb2]">
                    {r.authorName[0]}
                  </div>
                  <p className="text-xs font-bold text-slate-800">{r.authorName}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Find Parkway Nearest */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00a859]">HỆ THỐNG PHÒNG KHÁM</p>
          <h3 className="text-2xl font-black text-[#1f4fb2] sm:text-3xl">Tìm Crown Gần Nhất</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow bg-white">
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"
              alt="Cơ sở Hà Nội"
              className="h-44 w-full object-cover"
            />
            <div className="p-4 space-y-2">
              <h4 className="font-extrabold text-[#1f4fb2] text-sm">Crown Phố Huế</h4>
              <p className="text-xs text-slate-600">328 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
              <p className="text-[10px] text-slate-400">Hotline: 1900 6899 (Nhánh 1)</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow bg-white">
            <img
              src="https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=400"
              alt="Cơ sở Sài Gòn"
              className="h-44 w-full object-cover"
            />
            <div className="p-4 space-y-2">
              <h4 className="font-extrabold text-[#1f4fb2] text-sm">Crown Nam Kỳ Khởi Nghĩa</h4>
              <p className="text-xs text-slate-600">215 Nam Kỳ Khởi Nghĩa, Quận 3, TP. Hồ Chí Minh</p>
              <p className="text-[10px] text-slate-400">Hotline: 1900 6899 (Nhánh 2)</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow bg-white">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=400"
              alt="Cơ sở Bình Dương"
              className="h-44 w-full object-cover"
            />
            <div className="p-4 space-y-2">
              <h4 className="font-extrabold text-[#1f4fb2] text-sm">Crown Thủ Dầu Một</h4>
              <p className="text-xs text-slate-600">564 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương</p>
              <p className="text-[10px] text-slate-400">Hotline: 1900 6899 (Nhánh 3)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Booking Form Section */}
      <section id="booking-form-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-2 items-center bg-[#f0f4ff] rounded-[2rem] p-8 sm:p-12 border border-blue-100 shadow-md">
          {/* Form wrapper */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-100 space-y-6">
            <div className="text-center lg:text-left space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-[#1f4fb2]">Đặt Lịch Hẹn Khám</h3>
              <p className="text-xs text-slate-500">Khám tư vấn răng miệng miễn phí. Đăng ký thông tin bên dưới.</p>
            </div>

            {bookingStatus.success ? (
              <div className="rounded-2xl bg-green-50 p-6 border border-green-200 text-center space-y-4">
                <div className="text-4xl">✅</div>
                <h4 className="text-lg font-bold text-green-800">Đặt Lịch Thành Công!</h4>
                <p className="text-xs text-green-700">
                  Cảm ơn bạn đã lựa chọn Crown. Mã số bệnh nhân của bạn là:{' '}
                  <span className="font-extrabold uppercase">{bookingStatus.data?.patientCode}</span>.
                </p>
                <p className="text-xs text-green-600 leading-relaxed">
                  Nhân viên Crown sẽ liên hệ qua điện thoại để xác nhận giờ hẹn cụ thể với bạn trong 15 phút tới.
                </p>
                <button
                  onClick={() => setBookingStatus({ loading: false, success: false, error: null, data: null })}
                  className="rounded-full bg-[#00a859] hover:bg-green-700 text-white font-bold text-xs px-6 py-2.5 shadow"
                >
                  Đăng ký lịch mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Họ và tên *</label>
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={bookingForm.fullName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Số điện thoại *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={bookingForm.phone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Dịch vụ quan tâm</label>
                    <select
                      name="serviceName"
                      value={bookingForm.serviceName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.serviceName}>
                          {s.serviceName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Chi nhánh gần nhất</label>
                    <select
                      name="branchName"
                      value={bookingForm.branchName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    >
                      <option value="Hà Nội - 328 Phố Huế">Hà Nội - 328 Phố Huế</option>
                      <option value="TP. HCM - 215 Nam Kỳ Khởi Nghĩa">TP. HCM - 215 Nam Kỳ Khởi Nghĩa</option>
                      <option value="Bình Dương - 564 Đại Lộ Bình Dương">Bình Dương - 564 Đại Lộ Bình Dương</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Ngày mong muốn</label>
                    <input
                      type="date"
                      name="date"
                      value={bookingForm.date}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Giờ mong muốn</label>
                    <input
                      type="time"
                      name="time"
                      value={bookingForm.time}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1f4fb2] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Ghi chú thêm</label>
                  <textarea
                    name="message"
                    value={bookingForm.message}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Mô tả tình trạng răng hoặc yêu cầu khác..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#1f4fb2] focus:outline-none"
                  />
                </div>

                {bookingStatus.error && (
                  <div className="text-xs text-red-500 font-bold bg-red-50 border border-red-200 p-3 rounded-xl">
                    ⚠️ {bookingStatus.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingStatus.loading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] py-3 text-sm font-bold text-white shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {bookingStatus.loading ? 'Đang gửi thông tin...' : 'GỬI ĐĂNG KÝ HẸN KHÁM'}
                </button>
              </form>
            )}
          </div>

          {/* Info panel */}
          <div className="space-y-6 text-slate-800">
            <span className="bg-[#1f4fb2] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full inline-block">
              VÌ SAO CHỌN NHA KHOA CROWN
            </span>
            <h4 className="text-2xl sm:text-3xl font-black text-[#1f4fb2] leading-tight">
              Hệ Thống Nha Khoa Chuyên Sâu Theo Tiêu Chuẩn Quốc Tế
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nha Khoa Crown tự hào mang đến chất lượng dịch vụ chuẩn mực, công nghệ hiện đại đồng bộ trên toàn bộ hệ thống cơ sở.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-xl leading-none">🦷</span>
                <div>
                  <h5 className="font-extrabold text-sm text-[#1f4fb2]">Đứng đầu về Niềng khay Invisalign</h5>
                  <p className="text-xs text-slate-500">Sở hữu chứng chỉ Invisalign hạng cao và số lượng ca niềng thành công dẫn đầu.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl leading-none">👨‍⚕️</span>
                <div>
                  <h5 className="font-extrabold text-sm text-[#1f4fb2]">Đội ngũ bác sĩ Đại học Y danh tiếng</h5>
                  <p className="text-xs text-slate-500">100% bác sĩ có đầy đủ chứng chỉ hành nghề, thường xuyên tập huấn quốc tế.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl leading-none">💰</span>
                <div>
                  <h5 className="font-extrabold text-sm text-[#1f4fb2]">Bảng giá minh bạch, Hỗ trợ trả góp</h5>
                  <p className="text-xs text-slate-500">Chi phí điều trị được công bố rõ ràng, hỗ trợ trả góp lãi suất 0% nhanh chóng.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}