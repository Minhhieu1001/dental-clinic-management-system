import { useState, useEffect } from 'react'
import { getServices, getDentists, getReviews, createAppointment } from '../services/api'
import { getDentistsList } from '../services/dentist.service'
import AppointmentRequestModal from '../components/ui/AppointmentRequestModal'
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

// ─────────────────────// Hero showcase slides data
const HERO_SLIDES = [
  {
    eyebrow: 'NHA KHOA CROWN DENTAL',
    title: 'Không gian phòng khám chuyên nghiệp, hiện đại',
    description: 'Trải nghiệm thăm khám thoải mái với môi trường sạch sẽ, sáng sủa và trang thiết bị đồng bộ theo tiêu chuẩn cao.',
    tags: ['Phòng chờ sáng', 'Thiết bị hiện đại', 'Quy trình chuyên nghiệp'],
    img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600',
    badgeText: 'CROWN Dental Clinic',
    cardEyebrow: 'Phòng khám tiêu chuẩn',
    cardTitle: 'Không gian thăm khám chuyên nghiệp',
    cardDesc: 'Sáng, sạch, hiện đại và tạo cảm giác tin cậy ngay từ khi bước vào.'
  },
  {
    eyebrow: 'ĐỘI NGŨ CHUYÊN GIA',
    title: 'Đội ngũ bác sĩ tu nghiệp nước ngoài uy tín',
    description: '100% các bác sĩ chuyên khoa tốt nghiệp Đại học Y Dược danh tiếng, hoàn thành nhiều khóa tu nghiệp chuyên sâu tại Singapore, Mỹ, và châu Âu.',
    tags: ['Bác sĩ chuyên khoa', 'Tu nghiệp Hoa Kỳ', '10+ năm kinh nghiệm'],
    img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1000',
    badgeText: 'CROWN Dental Experts',
    cardEyebrow: 'Đội ngũ chuyên môn',
    cardTitle: 'Tận tâm & Chuyên nghiệp',
    cardDesc: 'Mang lại kết quả điều trị tối ưu và sự an tâm tuyệt đối cho khách hàng.'
  },
  {
    eyebrow: 'CÔNG NGHỆ TIÊN TIẾN',
    title: 'Trang thiết bị chuẩn quốc tế hàng đầu',
    description: 'Sở hữu máy quét dấu răng iTero Element 5D, hệ thống chụp phim CT Cone Beam hiện đại và phòng phẫu thuật vô trùng khép kín theo tiêu chuẩn Bộ Y tế.',
    tags: ['iTero Element 5D', 'CT Cone Beam', 'Vô trùng tuyệt đối'],
    img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000',
    badgeText: 'CROWN Dental Technology',
    cardEyebrow: 'Công nghệ nha khoa',
    cardTitle: 'Trang thiết bị tối tân',
    cardDesc: 'Hỗ trợ chẩn đoán chính xác tuyệt đối và điều trị nhẹ nhàng, nhanh chóng.'
  },
  {
    eyebrow: 'DỊCH VỤ TẬN TÂM',
    title: 'Chế độ bảo hành dài hạn & trả góp 0%',
    description: 'Cam kết chất lượng điều trị bằng văn bản, chế độ bảo hành rõ ràng, minh bạch cùng chính sách hỗ trợ trả góp lãi suất 0% liên kết với nhiều ngân hàng.',
    tags: ['Bảo hành dài hạn', 'Trả góp 0%', 'Hỗ trợ 24/7'],
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000',
    badgeText: 'CROWN Care & Warranty',
    cardEyebrow: 'Chế độ hậu mãi',
    cardTitle: 'Cam kết chất lượng',
    cardDesc: 'Đồng hành cùng nụ cười của bạn trên hành trình chăm sóc răng miệng.'
  },
  {
    eyebrow: 'HỆ THỐNG PHÒNG KHÁM',
    title: 'Không gian sang trọng chuẩn Singapore',
    description: 'Hệ thống phòng khám sở hữu không gian thiết kế sang trọng, hiện đại, mang lại cảm giác thư giãn thoải mái như đi spa cho mọi khách hàng.',
    tags: ['Chuẩn Singapore', 'Phòng khám VIP', 'Thư giãn thoải mái'],
    img: 'https://images.unsplash.com/photo-1504813184591-015578c77e5f?auto=format&fit=crop&q=80&w=1000',
    badgeText: 'CROWN Singapore Standard',
    cardEyebrow: 'Không gian VIP',
    cardTitle: 'Trải nghiệm thư thái',
    cardDesc: 'Xóa bỏ hoàn toàn nỗi sợ nha khoa với không gian thư giãn lý tưởng.'
  }
]

export default function Home() {
  const [services, setServices] = useState([])
  const [dentists, setDentists] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeDentist, setActiveDentist] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

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
  const SLIDE_COUNT = HERO_SLIDES.length


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, dentistsData, reviewsData] = await Promise.all([
          getServices(),
          getDentistsList(),
          getReviews(),
        ])
        setServices(servicesData)
        // Only show dentists that have complete data (name + avatar)
        const validDentists = dentistsData.filter(
          (d) => (d.fullName || d.username) && d.avatarUrl
        )
        setDentists(validDentists)
        setReviews(reviewsData)
        if (validDentists.length > 0) {
          setActiveDentist(validDentists[0])
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
                  <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#3557a8]">{HERO_SLIDES[activeSlide]?.eyebrow}</p>
                  <h2 className="mt-3 text-[clamp(1.9rem,4vw,3.4rem)] font-black leading-tight text-[#1f4fb2] min-h-[3.6em] flex items-center justify-center lg:justify-start">
                    {HERO_SLIDES[activeSlide]?.title}
                  </h2>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 min-h-[4.5em]">
                    {HERO_SLIDES[activeSlide]?.description}
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start min-h-[2.5em] items-center">
                    {HERO_SLIDES[activeSlide]?.tags.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-[#3557a8] ring-1 ring-[#dbe5f8] shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Slide Indicators */}
                  <div className="mt-6 flex justify-center lg:justify-start gap-1.5">
                    {HERO_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-6 bg-[#1f4fb2]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-1 relative min-h-[300px] overflow-hidden lg:order-2 lg:min-h-[420px]">
                <img
                  src={HERO_SLIDES[activeSlide]?.img}
                  alt={HERO_SLIDES[activeSlide]?.title}
                  className="h-full w-full object-cover object-center transition-all duration-500 ease-in-out"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_42%,rgba(19,35,97,0.12)_100%)]" />

                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#3557a8] shadow-sm ring-1 ring-[#dbe5f8]">
                  {HERO_SLIDES[activeSlide]?.badgeText}
                </div>

                <div className="absolute bottom-4 left-4 right-4 max-w-[360px] rounded-[22px] bg-white/94 px-4 py-3 shadow-sm backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00a859]">{HERO_SLIDES[activeSlide]?.cardEyebrow}</p>
                  <p className="mt-1 text-lg font-black text-[#1f4fb2]">{HERO_SLIDES[activeSlide]?.cardTitle}</p>
                  <p className="text-sm text-slate-600">{HERO_SLIDES[activeSlide]?.cardDesc}</p>
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
                  onClick={(e) => {
                    if (item.name === 'Đặt lịch hẹn') {
                      e.preventDefault()
                      setIsRequestModalOpen(true)
                    }
                  }}
                  className="group flex flex-col items-center rounded-2xl px-2 py-2 text-center transition hover:-translate-y-0.5 cursor-pointer"
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

      {/* 3. Why Choose Crown Dental — Modern stats + feature cards */}
      <section id="why-us-section" className="relative overflow-hidden py-20 mt-4 bg-gradient-to-b from-white via-[#f4f7fe] to-white border-y border-[#eef2fa]">
        {/* Soft decorative background gradients (z-0 to sit behind content) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,79,178,0.03),transparent_50%)] z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,168,89,0.03),transparent_50%)] z-0 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block bg-[#eef3ff] border border-[#d2e0ff] text-[#1f4fb2] text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-4 shadow-sm">
              TẠI SAO CHỌN CROWN DENTAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Tiêu Chuẩn Nha Khoa<br />
              <span className="bg-gradient-to-r from-[#1f4fb2] to-[#00a859] bg-clip-text text-transparent">Đẳng Cấp Quốc Tế</span>
            </h2>
            <p className="mt-4 text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              Chúng tôi không chỉ điều trị — chúng tôi kiến tạo nụ cười hoàn hảo cùng công nghệ hiện đại nhất và đội ngũ chuyên gia hàng đầu.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { value: '15+', label: 'Năm kinh nghiệm', icon: '🏆' },
              { value: '50K+', label: 'Bệnh nhân tin tưởng', icon: '😁' },
              { value: '1,000+', label: 'Ca Invisalign/năm', icon: '🦷' },
              { value: '98%', label: 'Khách hàng hài lòng', icon: '⭐' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative group rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <p className="text-3xl sm:text-4xl font-black text-[#1f4fb2] tracking-tight">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2 font-semibold tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                ),
                accent: 'from-violet-500 to-indigo-500',
                title: 'Công Nghệ AI & 3D',
                desc: 'Ứng dụng AI chẩn đoán hình ảnh, lập kế hoạch 3D và mô phỏng kết quả nụ cười trước khi điều trị — giúp bạn thấy kết quả ngay từ đầu.',
                tags: ['Scan 3D', 'AI Diagnosis', 'iTero Scanner'],
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ),
                accent: 'from-amber-400 to-orange-500',
                title: 'Chuyên Gia Đầu Ngành',
                desc: 'Đội ngũ bác sĩ được đào tạo tại Singapore, Mỹ và châu Âu — sở hữu các chứng chỉ quốc tế uy tín và hơn 10 năm kinh nghiệm thực tiễn.',
                tags: ['Invisalign Platinum', 'Implant Expert', 'Aesthetic Master'],
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                accent: 'from-emerald-400 to-teal-500',
                title: 'Cam Kết & Bảo Hành',
                desc: 'Bảo hành dài hạn cho mọi công trình nha khoa. Chúng tôi đồng hành cùng bạn sau điều trị — bởi nụ cười đẹp là hành trình, không phải đích đến.',
                tags: ['Bảo hành 5 năm', 'Hỗ trợ 24/7', 'Tái khám miễn phí'],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative rounded-3xl border border-slate-100 bg-white p-7 hover:shadow-[0_15px_45px_rgba(31,79,178,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Card glow */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${card.accent} opacity-5 group-hover:opacity-10 blur-2xl transition-opacity`} />
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accent} text-white mb-5 shadow-lg`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-3">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">{card.desc}</p>
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {card.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA bottom */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00a859] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-green-500/20 transition-all duration-300 text-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Đặt Lịch Tư Vấn Miễn Phí
            </button>
            <p className="mt-3 text-xs text-slate-400">Phản hồi trong 30 phút • Không cần đặt cọc</p>
          </div>
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
      <section className="py-20 bg-gradient-to-b from-white to-[#f4f7fe]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-[#eef3ff] border border-[#d2e0ff] text-[#1f4fb2] text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-4 shadow-sm">
              CHUYÊN GIA HÀNG ĐẦU
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Đội Ngũ Bác Sĩ<br />
              <span className="bg-gradient-to-r from-[#1f4fb2] to-[#00a859] bg-clip-text text-transparent">Răng Hàm Mặt Chuyên Sâu</span>
            </h3>
            <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-500 leading-relaxed">
              100% bác sĩ tốt nghiệp các trường đại học y danh tiếng, sở hữu chứng chỉ quốc tế uy tín và luôn tận tâm vì nụ cười của bạn.
            </p>
          </div>

          {dentists.length > 0 ? (
            <div>
              {/* Active Doctor Spotlight */}
              {activeDentist && (
                <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f4fb2] to-[#0d3a8a] shadow-2xl">
                  {/* Background decorations */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#00a859]/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-2xl translate-y-10 -translate-x-10 pointer-events-none" />

                  <div className="relative flex flex-col lg:flex-row gap-0 lg:gap-0">
                    {/* Doctor Photo */}
                    <div className="relative lg:w-72 shrink-0">
                      <div className="h-64 lg:h-full min-h-[280px] overflow-hidden">
                        <img
                          src={activeDentist.avatarUrl || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=600'}
                          alt={activeDentist.fullName || activeDentist.username}
                          className="h-full w-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1f4fb2]/30 lg:bg-gradient-to-t lg:from-[#1f4fb2]/40 lg:to-transparent" />
                      </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 backdrop-blur-sm text-[#4ade80] text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1.5 rounded-full mb-4 w-fit">
                        <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                        Chuyên khoa: {activeDentist.specialization}
                      </div>

                      <h4 className="text-3xl font-black text-white leading-tight mb-1">
                        {activeDentist.fullName || activeDentist.username}
                      </h4>
                      <p className="text-white/50 text-xs font-medium mb-6">
                        Số CCHN: {activeDentist.licenseNumber}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 shadow">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wide mb-0.5">Học vị</p>
                            <p className="text-sm text-white font-semibold leading-snug">{activeDentist.qualification}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wide mb-0.5">Kinh nghiệm</p>
                            <p className="text-sm text-white font-semibold">{activeDentist.experienceYears}+ năm thực tiễn</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href="#booking-form-section"
                          className="inline-flex items-center gap-2 rounded-full bg-white text-[#1f4fb2] text-xs font-black px-6 py-3 shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                          Đặt Lịch Với Bác Sĩ
                        </a>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-5 py-3 hover:bg-white/20 transition-all duration-200">
                          Xem Hồ Sơ Đầy Đủ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dentist Card Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {dentists.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setActiveDentist(d)}
                    className={`group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${activeDentist?.id === d.id
                      ? 'border-[#1f4fb2] shadow-[0_12px_35px_rgba(31,79,178,0.2)]'
                      : 'border-slate-100 bg-white shadow-sm hover:shadow-[0_12px_35px_rgba(31,79,178,0.08)]'
                      }`}
                  >
                    {/* Active indicator */}
                    {activeDentist?.id === d.id && (
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#1f4fb2] to-[#00a859]" />
                    )}

                    {/* Doctor image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={d.avatarUrl || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400'}
                        alt={d.fullName || d.username}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Specialization badge on photo */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="inline-block bg-white/90 backdrop-blur-sm text-[#1f4fb2] text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full">
                          {d.specialization}
                        </span>
                      </div>
                    </div>

                    {/* Doctor info */}
                    <div className={`p-4 ${activeDentist?.id === d.id ? 'bg-[#f0f5ff]' : 'bg-white'}`}>
                      <p className="text-sm font-black text-slate-800 leading-snug mb-1">
                        {d.fullName || d.username}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {d.experienceYears}+ năm kinh nghiệm
                      </p>

                      {activeDentist?.id === d.id && (
                        <div className="mt-2 flex items-center gap-1 text-[#1f4fb2]">
                          <span className="w-1.5 h-1.5 bg-[#1f4fb2] rounded-full" />
                          <span className="text-[10px] font-bold">Đang xem</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Đang tải danh sách bác sĩ...</p>
            </div>
          )}
        </div>
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

      {/* Floating Appointment Request Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#1f4fb2] to-[#00a859] px-5 py-3.5 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            📅
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">Tạo Yêu Cầu Lịch Hẹn</span>
        </button>
      </div>

      {/* Appointment Request Modal */}
      <AppointmentRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  )
}
