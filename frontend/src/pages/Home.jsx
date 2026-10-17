import { useState, useEffect } from 'react'
import { Award, Users, Sparkles, Star, Cpu, Stethoscope, ShieldCheck, CheckCircle2, ArrowRight, Shield, Zap, Check, Clock, Calendar, ChevronRight, GraduationCap, User, Phone, FileText, CalendarCheck, Tag } from 'lucide-react'
import { getServices, getDentists, getReviews, createAppointment } from '../services/api'
import { getDentistsList } from '../services/dentist.service'
import { createAppointmentRequest } from '../services/appointmentRequest.service'
import { getBranches } from '../services/clinic.service'
import toast from 'react-hot-toast'
import AppointmentRequestModal from '../components/ui/AppointmentRequestModal'

const QUICK_TAGS = [
  'Khám răng tổng quát',
  'Tư vấn niềng răng',
  'Trồng răng Implant',
  'Răng sứ thẩm mỹ',
  'Tẩy trắng răng',
  'Nhổ răng khôn',
]
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

// Default Doctors fallback list when backend database has no doctors yet
const DEFAULT_DENTISTS = [
  {
    id: 'd1',
    name: 'ThS. BS. Nguyễn Minh Tuấn',
    fullName: 'ThS. BS. Nguyễn Minh Tuấn',
    specialization: 'Chuyên gia Niềng răng & Chỉnh nha Invisalign',
    qualification: 'Thạc sĩ Nha khoa - ĐH Y Dược TP.HCM',
    licenseNumber: 'CCHN-001892/SYT',
    experienceYears: 15,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'd2',
    name: 'BS. CKII Hoàng Thanh Hà',
    fullName: 'BS. CKII Hoàng Thanh Hà',
    specialization: 'Chuyên gia Trồng răng Implant & Phục hình',
    qualification: 'Bác sĩ CKII - Tu nghiệp CHFG Đức',
    licenseNumber: 'CCHN-002410/SYT',
    experienceYears: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813572-c0e86b453e97?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'd3',
    name: 'ThS. BS. Trần Đức Anh',
    fullName: 'ThS. BS. Trần Đức Anh',
    specialization: 'Chuyên gia Răng sứ thẩm mỹ & Smile Design',
    qualification: 'Thạc sĩ Nha khoa - Tu nghiệp Singapore',
    licenseNumber: 'CCHN-003819/SYT',
    experienceYears: 10,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'd4',
    name: 'BS. CKI Lê Thị Mai Anh',
    fullName: 'BS. CKI Lê Thị Mai Anh',
    specialization: 'Chuyên gia Nha khoa Tổng quát & Trẻ em',
    qualification: 'Bác sĩ CKI - ĐH Y Hà Nội',
    licenseNumber: 'CCHN-004128/SYT',
    experienceYears: 8,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
  },
]

// ─────────────────────// Hero showcase slides data
const HERO_SLIDES = [
  {
    eyebrow: 'NHA KHOA CROWN DENTAL',
    title: 'Không gian phòng khám chuyên nghiệp, hiện đại',
    description: 'Trải nghiệm thăm khám thoải mái với môi trường sạch sẽ, sáng sủa và trang thiết bị đồng bộ theo tiêu chuẩn cao.',
    tags: ['Phòng chờ sáng', 'Thiết bị hiện đại', 'Quy trình chuyên nghiệp'],
    img: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=1200',
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
    img: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200',
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
    img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200',
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
    img: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=1200',
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
    img: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=1200',
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

  // Booking Form State — Matching AppointmentRequestModal
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    phone: '',
    description: '',
    branchId: '',
  })
  const [branches, setBranches] = useState([])
  const [bookingStatus, setBookingStatus] = useState({ loading: false, success: false, error: null })

  // Carousel state now follows the hero showcase cards
  const SLIDE_COUNT = HERO_SLIDES.length

  useEffect(() => {
    getBranches().then(setBranches).catch((error) => {
      console.error('Failed to load branches:', error)
    })
  }, [])


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, dentistsData, reviewsData] = await Promise.all([
          getServices().catch(() => []),
          getDentistsList().catch(() => []),
          getReviews().catch(() => []),
        ])
        setServices(servicesData)
        
        let normalizedDentists = []
        if (Array.isArray(dentistsData) && dentistsData.length > 0) {
          normalizedDentists = dentistsData.map((d) => ({
            id: d.id,
            name: d.name || d.fullName || d.username || 'Bác sĩ Nha khoa',
            fullName: d.name || d.fullName || d.username || 'Bác sĩ Nha khoa',
            avatarUrl: d.avatar || d.avatarUrl || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=600',
            specialization: (d.specializations && d.specializations.length > 0)
              ? d.specializations.map(s => s.name).join(', ')
              : (d.description || 'Nha khoa tổng quát'),
            qualification: d.qualification || 'Thạc sĩ - Bác sĩ Chuyên khoa',
            licenseNumber: d.licenseNumber || `CCHN-${(d.id || '8899').toString().slice(0, 6)}`,
            experienceYears: d.experienceYears || 10,
          }))
        }

        const finalDentists = normalizedDentists.length > 0 ? normalizedDentists : DEFAULT_DENTISTS
        setDentists(finalDentists)
        setReviews(reviewsData)
        if (finalDentists.length > 0) {
          setActiveDentist(finalDentists[0])
        }
      } catch (err) {
        console.error('Error fetching dynamic data:', err)
        setDentists(DEFAULT_DENTISTS)
        setActiveDentist(DEFAULT_DENTISTS[0])
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

  // Handle Quick Service Tag click
  const handleTagClick = (tag) => {
    setBookingForm((prev) => {
      if (!prev.description) return { ...prev, description: tag }
      if (prev.description.includes(tag)) return prev
      return { ...prev, description: `${prev.description}, ${tag}` }
    })
  }

  // Handle booking form submission — Exactly matching AppointmentRequestModal
  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!bookingForm.fullName.trim() || !bookingForm.phone.trim() || !bookingForm.branchId) {
      toast.error('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!')
      return
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
    if (!phoneRegex.test(bookingForm.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng kiểm tra lại.')
      return
    }

    setBookingStatus({ loading: true, success: false, error: null })
    try {
      await createAppointmentRequest({
        fullName: bookingForm.fullName.trim(),
        phone: bookingForm.phone.trim(),
        description: bookingForm.description.trim(),
        branchId: bookingForm.branchId,
      })

      setBookingStatus({ loading: false, success: true, error: null })
      toast.success('Gửi yêu cầu đặt lịch thành công!')
    } catch (err) {
      console.error('Lỗi gửi yêu cầu lịch hẹn:', err)
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!'
      setBookingStatus({
        loading: false,
        success: false,
        error: errorMsg,
      })
      toast.error(errorMsg)
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
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=1200'
                  }}
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

      {/* 3. Why Choose Crown Dental — Premium Luxury Redesign */}
      <section id="why-us-section" className="relative overflow-hidden py-24 my-6 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-white border-y border-slate-200/60">
        {/* Ambient Decorative Light Orbs & Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#1f4fb2]/10 to-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#00a859]/10 to-teal-300/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Badge & Title */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f4fb2]/10 via-indigo-500/10 to-[#00a859]/10 px-4 py-1.5 border border-[#1f4fb2]/20 shadow-sm backdrop-blur-md mb-5">
              <span className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#1f4fb2]">
                TẠI SAO CHỌN CROWN DENTAL
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Tiêu Chuẩn Nha Khoa <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] bg-clip-text text-transparent">
                Đỉnh Cao Công Nghệ & Chuyên Gia
              </span>
            </h2>

            <p className="mt-5 text-slate-600 text-sm sm:text-base leading-relaxed">
              Chúng tôi kết hợp chuẩn mực y khoa quốc tế JCI với công nghệ chẩn đoán AI 3D tiên tiến nhất — đem lại hành trình chăm sóc nụ cười êm ái, an toàn và thẩm mỹ tuyệt đối.
            </p>
          </div>

          {/* Stats Highlight Grid — Unified Medical Color Palette */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {[
              {
                value: '15+',
                label: 'Năm Kinh Nghiệm',
                sublabel: 'Thành lập từ 2011',
                icon: Award,
                gradient: 'from-[#1f4fb2] to-[#2563eb]',
                lightBg: 'bg-blue-50 border-blue-200/60 text-[#1f4fb2]',
                badgeText: 'Kinh nghiệm lâu năm',
              },
              {
                value: '50,000+',
                label: 'Bệnh Nhân Tin Tưởng',
                sublabel: 'Khách hàng toàn quốc',
                icon: Users,
                gradient: 'from-[#00a859] to-[#059669]',
                lightBg: 'bg-emerald-50 border-emerald-200/60 text-[#00a859]',
                badgeText: 'Uy tín hàng đầu',
              },
              {
                value: '1,000+',
                label: 'Ca Invisalign / Năm',
                sublabel: 'Top Platinum Provider',
                icon: Sparkles,
                gradient: 'from-[#1f4fb2] to-[#0284c7]',
                lightBg: 'bg-sky-50 border-sky-200/60 text-[#1f4fb2]',
                badgeText: 'Niềng răng trong suốt',
              },
              {
                value: '99.4%',
                label: 'Khách Hàng Hài Lòng',
                sublabel: 'Đánh giá 5.0 ★ Google',
                icon: Star,
                gradient: 'from-[#00a859] to-[#10b981]',
                lightBg: 'bg-emerald-50 border-emerald-200/60 text-[#00a859]',
                badgeText: 'Chất lượng 5 sao',
              },
            ].map((stat) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={stat.label}
                  className="group relative rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.1)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                >
                  {/* Hover top border gradient glow */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${stat.lightBg}`}>
                      {stat.badgeText}
                    </span>
                  </div>

                  <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <h4 className="text-sm font-bold text-slate-800 mt-1">
                    {stat.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {stat.sublabel}
                  </p>
                </div>
              )
            })}
          </div>

          {/* 3 Core Pillar Feature Cards — Unified Medical Blue & Emerald */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                category: 'CÔNG NGHỆ BẮT KÌM GIÂY',
                categoryBg: 'text-[#1f4fb2] bg-blue-50 border border-blue-100',
                title: 'Công Nghệ AI & Mô Phỏng 3D',
                icon: Cpu,
                accentGradient: 'from-[#1f4fb2] to-[#2563eb]',
                bulletIconColor: 'text-[#1f4fb2]',
                ringColor: 'group-hover:border-[#1f4fb2]/40',
                desc: 'Đi đầu trong việc số hóa quy trình khám nha khoa với hệ thống trang thiết bị tân tiến nhập khẩu trực tiếp từ Mỹ và Châu Âu.',
                bullets: [
                  'Scan dấu răng iTero Element 5D không đau trong 60 giây',
                  'AI chẩn đoán phát hiện sớm vi khuẩn & vi mô mảng bám',
                  'Mô phỏng trước kết quả nụ cười 3D (Smile Design) chuẩn xác',
                ],
                tags: ['Scan 3D iTero', 'AI Smile Design', 'Chuẩn FDA Mỹ'],
              },
              {
                category: 'ĐỘI NGŨ THẠC SĨ - BÁC SĨ',
                categoryBg: 'text-[#1f4fb2] bg-sky-50 border border-sky-100',
                title: 'Chuyên Gia Đầu Ngành 15+ Năm',
                icon: Stethoscope,
                accentGradient: 'from-[#1f4fb2] via-[#0284c7] to-[#00a859]',
                bulletIconColor: 'text-[#00a859]',
                ringColor: 'group-hover:border-[#0284c7]/40',
                desc: 'Quy tụ đội ngũ Thạc sĩ, Bác sĩ Chuyên khoa II tốt nghiệp tại các đại học danh tiếng tại Việt Nam và tu nghiệp chuyên sâu ở Singapore, Mỹ, Đức.',
                bullets: [
                  '100% Bác sĩ sở hữu chứng chỉ hành nghề & bằng tu nghiệp quốc tế',
                  'Chứng chỉ Invisalign Platinum Doctor và chuyên gia Implant',
                  'Trực tiếp khám, lập kế hoạch và điều trị 1-1 tận tâm',
                ],
                tags: ['Invisalign Platinum', 'Implant Master', 'Tu Nghiệp Châu Âu'],
              },
              {
                category: 'MINH BẠCH & AN TÂM TÂM TRÍ',
                categoryBg: 'text-[#00a859] bg-emerald-50 border border-emerald-100',
                title: 'Cam Kết Hợp Đồng & Bảo Hành',
                icon: ShieldCheck,
                accentGradient: 'from-[#00a859] to-[#059669]',
                bulletIconColor: 'text-[#00a859]',
                ringColor: 'group-hover:border-[#00a859]/40',
                desc: 'Crown Dental đặt chữ Tín lên hàng đầu với quy trình làm việc minh bạch, chi phí niêm yết và hợp đồng cam kết chất lượng dài hạn.',
                bullets: [
                  'Ký hợp đồng pháp lý cam kết kết quả trước khi thực hiện',
                  'Thẻ bảo hành chính hãng tra cứu QR Code linh hoạt trọn đời',
                  'Miễn phí tái khám định kỳ & tổng đài hỗ trợ 24/7',
                ],
                tags: ['Hợp Đồng Pháp Lý', 'Bảo Hành Trọn Đời', 'Trả Góp 0%'],
              },
            ].map((card) => {
              const IconComp = card.icon
              return (
                <div
                  key={card.title}
                  className={`group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(31,79,178,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden ${card.ringColor}`}
                >
                  {/* Top glowing ambient gradient slice */}
                  <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${card.accentGradient}`} />
                  <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${card.accentGradient} opacity-5 group-hover:opacity-15 blur-2xl transition-opacity duration-300 pointer-events-none`} />

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${card.categoryBg}`}>
                        {card.category}
                      </span>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.accentGradient} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-[#1f4fb2] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      {card.desc}
                    </p>

                    <div className="space-y-3 mb-8">
                      {card.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${card.bulletIconColor}`} />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>


          {/* Luxury Banner Call To Action — Standard Dental Light Theme */}
          <div className="relative rounded-3xl bg-gradient-to-br from-[#eef4ff] via-[#f5f8fe] to-[#e6f7f0] text-slate-900 p-8 sm:p-12 shadow-[0_10px_40px_rgba(31,79,178,0.06)] overflow-hidden border border-[#d2e0ff]/80">
            {/* Ambient Lighting FX */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1f4fb2]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#00a859]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center lg:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-[#1f4fb2]/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1f4fb2] border border-[#1f4fb2]/20">
                  <Sparkles className="w-3.5 h-3.5 text-[#1f4fb2]" />
                  <span>Ưu đãi đặc quyền dành cho bệnh nhân mới</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900">
                  Khám & Tư Vấn Nụ Cười 3D <span className="bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] bg-clip-text text-transparent">Miễn Phí 100%</span>
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                  Đăng ký ngay hôm nay để trải nghiệm dịch vụ nha khoa chuẩn quốc tế, nhận kết quả scan răng 3D tức thì và tư vấn trực tiếp từ bác sĩ chuyên khoa.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-2 text-xs text-slate-700 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00a859]" />
                    <span>Không phát sinh chi phí</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00a859]" />
                    <span>Hỗ trợ trả góp 0%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00a859]" />
                    <span>Xếp lịch ưu tiên</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-center">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#00a859] via-[#059669] to-[#047857] hover:from-[#059669] hover:to-[#047857] text-white font-extrabold px-9 py-4.5 rounded-2xl shadow-[0_10px_25px_rgba(0,168,89,0.3)] hover:shadow-[0_15px_35px_rgba(0,168,89,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-base cursor-pointer overflow-hidden"
                >
                  {/* Subtle shimmer effect */}
                  <span className="absolute inset-0 w-full h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  <Calendar className="w-5 h-5 text-emerald-100" />
                  <span>Đặt Lịch Tư Vấn ngay</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="mt-3 text-[11px] text-slate-500 font-semibold">
                  ⚡ Phản hồi xác nhận trong 15-30 phút
                </p>
              </div>
            </div>
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

      {/* 5. Dentist Team Section — Concise & Professional Image-Free Grid */}
      <section className="py-20 bg-gradient-to-b from-white via-[#f8fafc] to-white border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1f4fb2]/10 px-4 py-1.5 border border-[#1f4fb2]/20 shadow-sm backdrop-blur-md mb-4">
              <span className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#1f4fb2]">
                HỘI ĐỒNG CHUYÊN GIA
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Đội Ngũ Bác Sĩ <br />
              <span className="bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] bg-clip-text text-transparent">
                Răng Hàm Mặt Chuyên Sâu
              </span>
            </h3>
            <p className="mt-4 text-slate-600 text-sm leading-relaxed font-medium">
              100% bác sĩ tốt nghiệp các trường đại học y khoa danh tiếng, sở hữu chứng chỉ hành nghề quốc tế và luôn tận tâm vì sức khỏe nụ cười của bạn.
            </p>
          </div>

          {/* Doctor Cards Grid (Image & Logo Free — Clean Executive Medical Cards) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dentists.map((d) => {
              const doctorName = d.name || d.fullName || d.username || 'Bác sĩ Nha khoa'

              return (
                <div
                  key={d.id}
                  className="group relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(31,79,178,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:border-[#1f4fb2]/40"
                >
                  {/* Top glowing accent line */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#1f4fb2] to-[#00a859] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    {/* Header Row: Specialization Badge + Experience Pill */}
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1f4fb2] bg-blue-50 border border-blue-100/80 px-3 py-1 rounded-full truncate max-w-[140px]">
                        {d.specialization}
                      </span>
                      <span className="text-[10px] font-bold text-[#00a859] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                        {d.experienceYears || 10}+ Năm KN
                      </span>
                    </div>

                    {/* Doctor Name & Title */}
                    <h4 className="text-lg font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors leading-snug mb-2">
                      {doctorName}
                    </h4>

                    {/* Qualification */}
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mb-5">
                      <GraduationCap className="w-4 h-4 text-[#1f4fb2] shrink-0" />
                      <span className="line-clamp-1">{d.qualification || 'Thạc sĩ - Bác sĩ Chuyên khoa'}</span>
                    </p>

                    {/* Detail Highlights Box */}
                    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100/80 space-y-2 mb-6 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00a859] shrink-0" />
                        <span className="truncate">{d.licenseNumber || 'Giấy phép hành nghề chính thức'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1f4fb2] shrink-0" />
                        <span>Trực tiếp khám & điều trị 1-1</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button — Standard Dental Emerald Green with Crisp White Text */}
                  <a
                    href="#booking-form-section"
                    className="inline-flex items-center justify-between w-full bg-gradient-to-r from-[#00a859] via-[#059669] to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white text-xs font-extrabold px-4.5 py-3 rounded-2xl shadow-[0_4px_15px_rgba(0,168,89,0.25)] hover:shadow-[0_8px_25px_rgba(0,168,89,0.4)] transition-all duration-300 active:scale-[0.98]"
                  >
                    <span className="text-white font-extrabold tracking-wide">Đặt lịch tư vấn với BS</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              )
            })}
          </div>
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

      {/* 7. Before & After Treatment — Authentic Dental Cases */}
      <section className="py-20 bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 border border-emerald-100 shadow-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#00a859]">
                KẾT QUẢ THỰC TẾ
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Hiệu Quả Trước & Sau Điều Trị <br />
              <span className="bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] bg-clip-text text-transparent">
                Tại Crown Dental
              </span>
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Hàng ngàn nụ cười rạng rỡ đã được kiến tạo thành công nhờ quy trình chuẩn y khoa và công nghệ hiện đại.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Case 1 */}
            <div className="group bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-blue-50 text-[#1f4fb2] border border-blue-100 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Khách hàng: Nguyễn Anh Thư
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400">22 Tháng</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#1f4fb2] transition-colors mb-2">
                  Niềng Răng Invisalign Khớp Cắn Chéo
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">
                  Lộ trình khay niềng trong suốt Invisalign giúp làm đều cung răng, chỉnh khớp cắn chuẩn xác không cần nhổ răng.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="relative rounded-2xl overflow-hidden shadow-inner bg-slate-100 group/img">
                  <img
                    src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600"
                    alt="Trước điều trị"
                    className="h-36 w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md">
                    Trước điều trị
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-md ring-2 ring-[#00a859] group/img">
                  <img
                    src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=600"
                    alt="Sau điều trị"
                    className="h-36 w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#00a859] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Sau điều trị</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="group bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-blue-50 text-[#1f4fb2] border border-blue-100 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Khách hàng: Trần Quốc Bảo
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400">3 Ngày</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#1f4fb2] transition-colors mb-2">
                  Dán Sứ Veneer Emax Đóng Khe Thưa
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">
                  Phục hình 8 mặt dán sứ Emax siêu mỏng 0.2mm, bảo tồn tối đa răng thật, đem lại nụ cười trắng sáng tự nhiên.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="relative rounded-2xl overflow-hidden shadow-inner bg-slate-100 group/img">
                  <img
                    src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=600"
                    alt="Trước điều trị"
                    className="h-36 w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md">
                    Trước điều trị
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-md ring-2 ring-[#00a859] group/img">
                  <img
                    src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600"
                    alt="Sau điều trị"
                    className="h-36 w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#00a859] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Sau điều trị</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className="group bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between hidden lg:flex">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-blue-50 text-[#1f4fb2] border border-blue-100 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Khách hàng: Phạm Hoàng Yến
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400">1 Lần Hẹn</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#1f4fb2] transition-colors mb-2">
                  Cấy Ghép Implant Thụy Sĩ Tức Thì
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">
                  Trồng răng Implant StraumannThụy Sĩ công nghệ không đau, ăn nhai chắc chắn như răng thật chỉ sau 1 ca tiểu phẫu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="relative rounded-2xl overflow-hidden shadow-inner bg-slate-100 group/img">
                  <img
                    src="https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&q=80&w=600"
                    alt="Trước điều trị"
                    className="h-36 w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md">
                    Trước điều trị
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-md ring-2 ring-[#00a859] group/img">
                  <img
                    src="https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=600"
                    alt="Sau điều trị"
                    className="h-36 w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600'
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-[#00a859] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Sau điều trị</span>
                  </div>
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

      {/* 8. Find Crown Nearest */}
      <section className="py-20 bg-slate-50/70 border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1f4fb2]/10 px-4 py-1.5 border border-[#1f4fb2]/20 shadow-sm mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#1f4fb2]">
                HỆ THỐNG PHÒNG KHÁM
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Tìm Cơ Sở Crown Gần Nhất
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Hệ thống phòng khám chuẩn mực với đầy đủ trang thiết bị hiện đại tại các trung tâm thành phố lớn.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Branch 1 */}
            <div className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.12)] hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=800"
                  alt="Crown Phố Huế - Hà Nội"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
                  }}
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1f4fb2] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                  Cơ sở Hà Nội
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h4 className="font-black text-slate-900 text-base group-hover:text-[#1f4fb2] transition-colors">Crown Phố Huế</h4>
                <p className="text-xs text-slate-600 font-medium">328 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Hotline đặt lịch:</span>
                  <span className="font-bold text-[#1f4fb2]">1900 6899 (Nhánh 1)</span>
                </div>
              </div>
            </div>

            {/* Branch 2 */}
            <div className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.12)] hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800"
                  alt="Crown Nam Kỳ Khởi Nghĩa - TP.HCM"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800'
                  }}
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1f4fb2] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                  Cơ sở Sài Gòn
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h4 className="font-black text-slate-900 text-base group-hover:text-[#1f4fb2] transition-colors">Crown Nam Kỳ Khởi Nghĩa</h4>
                <p className="text-xs text-slate-600 font-medium">215 Nam Kỳ Khởi Nghĩa, Quận 3, TP. Hồ Chí Minh</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Hotline đặt lịch:</span>
                  <span className="font-bold text-[#1f4fb2]">1900 6899 (Nhánh 2)</span>
                </div>
              </div>
            </div>

            {/* Branch 3 */}
            <div className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(31,79,178,0.12)] hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800"
                  alt="Crown Thủ Dầu Một - Bình Dương"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
                  }}
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1f4fb2] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                  Cơ sở Bình Dương
                </span>
              </div>
              <div className="p-6 space-y-2">
                <h4 className="font-black text-slate-900 text-base group-hover:text-[#1f4fb2] transition-colors">Crown Thủ Dầu Một</h4>
                <p className="text-xs text-slate-600 font-medium">564 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Hotline đặt lịch:</span>
                  <span className="font-bold text-[#1f4fb2]">1900 6899 (Nhánh 3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Booking Form Section — Matches AppointmentRequestModal design */}
      <section id="booking-form-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-24 py-12">
        <div className="grid gap-10 lg:grid-cols-2 items-center bg-[#f0f4ff] rounded-[2.5rem] p-6 sm:p-10 border border-blue-100 shadow-md">
          {/* Form Card — Identical to Modal */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5">
            {/* Header Banner */}
            <div className="relative bg-gradient-to-r from-[#1f4fb2] to-[#00a859] px-6 py-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  <Sparkles size={13} className="text-yellow-300" />
                  Crown Dental Clinic
                </span>
              </div>
              <h3 className="text-2xl font-black leading-tight text-white">
                Đăng Ký Yêu Cầu Lịch Hẹn
              </h3>
              <p className="mt-1 text-xs text-white/90 font-medium">
                Vui lòng nhập thông tin bên dưới. Lễ tân phòng khám sẽ liên hệ gọi lại xác nhận xếp lịch hẹn!
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8">
              {bookingStatus.success ? (
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Đã Gửi Yêu Cầu Thành Công!</h4>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                      Cảm ơn bạn <span className="font-bold text-slate-900">{bookingForm.fullName}</span>. Bộ phận lễ tân sẽ sớm liên hệ tới SĐT{' '}
                      <span className="font-bold text-slate-900">{bookingForm.phone}</span> để tư vấn và chốt thời gian phù hợp nhất.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingForm({ fullName: '', phone: '', description: '', branchId: '' })
                        setBookingStatus({ loading: false, success: false, error: null })
                      }}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
                    >
                      Đăng ký lịch mới
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Họ tên */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={bookingForm.fullName}
                        onChange={handleInputChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={bookingForm.phone}
                        onChange={handleInputChange}
                        placeholder="0901 234 567"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                      />
                    </div>
                  </div>

                  {/* Mô tả / Ghi chú */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mô tả nhu cầu / Dịch vụ quan tâm
                    </label>
                    <div className="relative">
                      <FileText size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Chi nhánh <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="branchId"
                          required
                          value={bookingForm.branchId}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                        >
                          <option value="">-- Chọn chi nhánh --</option>
                          {branches.map((branch) => (
                            <option key={branch.branchId} value={branch.branchId}>
                              {branch.branchName} ({branch.branchCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        name="description"
                        rows={3}
                        value={bookingForm.description}
                        onChange={handleInputChange}
                        placeholder="Nhập ghi chú, dịch vụ hoặc thời gian mong muốn..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10"
                      />
                    </div>

                    {/* Quick suggestion tags */}
                    <div className="mt-2.5">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <Tag size={12} /> Chọn nhanh dịch vụ:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagClick(tag)}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-[#1f4fb2]/10 hover:text-[#1f4fb2] active:scale-95 cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={bookingStatus.loading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    >
                      {bookingStatus.loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck size={18} />
                          <span>Gửi Yêu Cầu Đặt Lịch</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-slate-400">
                    Thông tin cá nhân của bạn được bảo mật tuyệt đối.
                  </p>
                </form>
              )}
            </div>
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
