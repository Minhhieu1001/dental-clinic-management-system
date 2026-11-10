import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  Tag,
  Mail,
  Headphones,
  Search,
  ExternalLink,
  Navigation,
  Building2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { getBranches } from '../services/clinic.service'
import { getAdminServices } from '../services/service.service'
import { createAppointmentRequest } from '../services/appointmentRequest.service'
import { createAppointment } from '../services/api'
import toast from 'react-hot-toast'

const DEFAULT_BRANCHES = [
  {
    branchId: 'branch-hn-01',
    branchCode: 'CN-HN01',
    branchName: 'Crown Dental Phố Huế - Hà Nội',
    phoneNumber: '1900 8059',
    email: 'hanoi@crowndental.vn',
    address: '328 Phố Huế, Quận Hai Bà Trưng, Hà Nội',
    openTime: '08:30:00',
    closeTime: '19:30:00',
    imageBranch: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    city: 'Hà Nội',
    status: 'ACTIVE',
  },
  {
    branchId: 'branch-hcm-01',
    branchCode: 'CN-HCM01',
    branchName: 'Crown Dental Nam Kỳ Khởi Nghĩa - TP.HCM',
    phoneNumber: '1900 8059',
    email: 'hcm@crowndental.vn',
    address: '215 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    openTime: '08:30:00',
    closeTime: '19:30:00',
    imageBranch: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    city: 'TP. Hồ Chí Minh',
    status: 'ACTIVE',
  },
  {
    branchId: 'branch-bd-01',
    branchCode: 'CN-BD01',
    branchName: 'Crown Dental Thủ Dầu Một - Bình Dương',
    phoneNumber: '1900 8059',
    email: 'binhduong@crowndental.vn',
    address: '564 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương',
    openTime: '08:30:00',
    closeTime: '19:30:00',
    imageBranch: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    city: 'Bình Dương',
    status: 'ACTIVE',
  },
]

const QUICK_TAGS = [
  'Khám răng tổng quát',
  'Tư vấn niềng răng',
  'Trồng răng Implant',
  'Răng sứ thẩm mỹ',
  'Tẩy trắng răng',
  'Nhổ răng khôn',
]

const CITY_TABS = [
  { key: 'ALL', label: 'Tất cả cơ sở' },
  { key: 'HN', label: 'Hà Nội' },
  { key: 'HCM', label: 'TP. Hồ Chí Minh' },
  { key: 'BD', label: 'Bình Dương' },
]

function detectCity(branch) {
  const text = `${branch.address || ''} ${branch.branchName || ''}`.toLowerCase()
  if (text.includes('hà nội') || text.includes('ha noi')) return 'HN'
  if (text.includes('hồ chí minh') || text.includes('hcm') || text.includes('sài gòn')) return 'HCM'
  if (text.includes('bình dương') || text.includes('binh duong') || text.includes('thủ dầu một')) return 'BD'
  return 'OTHER'
}

function formatTimeString(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return timeStr
}

export default function Contact() {
  const [searchParams] = useSearchParams()
  const serviceParam = searchParams.get('service')
  const formRef = useRef(null)

  // Remote data state
  const [branches, setBranches] = useState(DEFAULT_BRANCHES)
  const [services, setServices] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(true)

  // Filter state
  const [selectedCityTab, setSelectedCityTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Selected branch for Booking & Map
  const [selectedBranchId, setSelectedBranchId] = useState(DEFAULT_BRANCHES[0].branchId)

  // Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [message, setMessage] = useState('')
  const [formStatus, setFormStatus] = useState({ loading: false, success: false, error: null })

  // 1. Load branches from BE API
  useEffect(() => {
    let isMounted = true
    getBranches()
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) && data.length > 0 ? data : DEFAULT_BRANCHES
        setBranches(list)
        if (list.length > 0) {
          setSelectedBranchId((prev) => (list.some((b) => b.branchId === prev) ? prev : list[0].branchId))
        }
      })
      .catch((err) => {
        console.warn('Không thể tải chi nhánh từ BE, dùng dữ liệu chuẩn:', err)
        if (isMounted) setBranches(DEFAULT_BRANCHES)
      })
      .finally(() => {
        if (isMounted) setLoadingBranches(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Load services from BE API
  useEffect(() => {
    getAdminServices({ isActive: true })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setServices(list)
        if (serviceParam) {
          setSelectedService(serviceParam)
        } else if (list.length > 0) {
          setSelectedService(list[0].serviceName)
        }
      })
      .catch((err) => console.error('Failed to load services:', err))
  }, [serviceParam])

  // Filter branches by City tab & search keyword
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const city = detectCity(b)
      if (selectedCityTab !== 'ALL' && city !== selectedCityTab) {
        return false
      }
      if (searchTerm.trim()) {
        const keyword = searchTerm.trim().toLowerCase()
        const searchable = `${b.branchName || ''} ${b.branchCode || ''} ${b.address || ''} ${b.phoneNumber || ''}`.toLowerCase()
        return searchable.includes(keyword)
      }
      return true
    })
  }, [branches, selectedCityTab, searchTerm])

  // Active selected branch object
  const activeBranch = useMemo(() => {
    return branches.find((b) => b.branchId === selectedBranchId) || branches[0] || DEFAULT_BRANCHES[0]
  }, [branches, selectedBranchId])

  // Quick choose branch & scroll to form
  const handleSelectBranchForBooking = (branchId) => {
    setSelectedBranchId(branchId)
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Handle Quick Tag click
  const handleTagClick = (tag) => {
    if (!message) {
      setMessage(tag)
    } else if (!message.includes(tag)) {
      setMessage(`${message}, ${tag}`)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ và tên và Số điện thoại!')
      return
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
    if (!phoneRegex.test(phone.trim())) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng kiểm tra lại.')
      return
    }

    setFormStatus({ loading: true, success: false, error: null })
    try {
      const chosenBranch = branches.find((b) => b.branchId === selectedBranchId) || activeBranch

      // Send to Backend API with valid branchId & branchName
      await createAppointmentRequest({
        fullName: fullName.trim(),
        phone: phone.trim(),
        branchId: chosenBranch?.branchId || null,
        branchName: chosenBranch?.branchName || 'Crown Dental',
        description: `Dịch vụ: ${selectedService || 'Chưa chọn'} | Cơ sở: ${chosenBranch?.branchName || ''} (${chosenBranch?.address || ''}) | Ngày hẹn: ${date || 'Sớm nhất'} | Giờ: ${time} | Ghi chú: ${message.trim() || 'Không có'}`,
      })

      // Secondary legacy appointment record if needed
      await createAppointment({
        fullName: fullName.trim(),
        phone: phone.trim(),
        serviceName: selectedService,
        branchName: chosenBranch?.branchName || '',
        date,
        time,
        message,
      }).catch(() => null)

      setFormStatus({ loading: false, success: true, error: null })
      toast.success('Gửi yêu cầu đặt lịch hẹn thành công!')
      setFullName('')
      setPhone('')
      setDate('')
      setMessage('')
    } catch (err) {
      console.error('Lỗi gửi thông tin liên hệ:', err)
      const errorMsg = err.response?.data?.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau!'
      setFormStatus({
        loading: false,
        success: false,
        error: errorMsg,
      })
      toast.error(errorMsg)
    }
  }

  // Google Maps embed URL
  const mapEmbedUrl = useMemo(() => {
    const query = activeBranch?.address || '328 Phố Huế, Hai Bà Trưng, Hà Nội'
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }, [activeBranch])

  const mapExternalUrl = useMemo(() => {
    const query = activeBranch?.address || 'Crown Dental'
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }, [activeBranch])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24">
      {/* 1. Page Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0f2b66] via-[#1f4fb2] to-[#00a859] py-14 lg:py-18 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00a859]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Link to="/" className="hover:text-white transition">
              Trang chủ
            </Link>
            <span className="text-blue-300">›</span>
            <span className="text-white font-extrabold">Tìm Phòng Khám</span>
          </p>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#4ade80] backdrop-blur-md">
              <Sparkles size={13} className="text-yellow-300" />
              Hệ Thống Cơ Sở Crown Dental
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Tìm Phòng Khám Gần Bạn & Đặt Lịch
          </h1>

          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-2xl font-medium leading-relaxed">
            Hệ thống phòng khám tiêu chuẩn Châu Âu tại các vị trí đắc địa Hà Nội, TP. Hồ Chí Minh và Bình Dương. Sẵn sàng phục vụ bạn từ 08:30 đến 19:30 mỗi ngày.
          </p>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15">
              <p className="text-xs text-blue-200 font-semibold">Cơ sở tiêu chuẩn</p>
              <p className="text-lg font-black text-white">{branches.length} Chi nhánh</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15">
              <p className="text-xs text-blue-200 font-semibold">Hotline tổng đài</p>
              <p className="text-lg font-black text-white">1900 8059</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15">
              <p className="text-xs text-blue-200 font-semibold">Giờ hoạt động</p>
              <p className="text-lg font-black text-white">08:30 - 19:30</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/15">
              <p className="text-xs text-blue-200 font-semibold">Khám tổng quát</p>
              <p className="text-lg font-black text-emerald-300">Miễn Phí 100%</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Branch Locator & Directory Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Filter Bar */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* City Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CITY_TABS.map((tab) => {
              const isActive = selectedCityTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCityTab(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1f4fb2] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên đường, quận, chi nhánh..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-[#1f4fb2] focus:bg-white focus:ring-2 focus:ring-[#1f4fb2]/10"
            />
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 bg-[#1f4fb2] rounded-full" />
              <h2 className="text-lg font-black text-slate-900">
                Danh Sách Cơ Sở Hoạt Động ({filteredBranches.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Đồng bộ dữ liệu trực tiếp từ hệ thống quản lý
            </p>
          </div>

          {loadingBranches ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1f4fb2] border-t-transparent mb-3" />
              Đang tải danh sách phòng khám...
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <Building2 size={36} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">Không tìm thấy chi nhánh phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển sang tab &quot;Tất cả cơ sở&quot;.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBranches.map((branch) => {
                const isSelected = branch.branchId === selectedBranchId
                const openHour = formatTimeString(branch.openTime) || '08:30'
                const closeHour = formatTimeString(branch.closeTime) || '19:30'

                return (
                  <div
                    key={branch.branchId}
                    className={`group rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-[#1f4fb2] ring-2 ring-[#1f4fb2]/20 shadow-lg'
                        : 'border-slate-200/90 hover:border-blue-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Branch Image */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        <img
                          src={branch.imageBranch || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'}
                          alt={branch.branchName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-black tracking-wide text-white">
                            {branch.branchCode || 'CROWN'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Đang mở cửa
                          </span>
                        </div>

                        {/* Branch Title over image bottom */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="text-base font-black leading-snug drop-shadow-sm line-clamp-1">
                            {branch.branchName}
                          </h3>
                        </div>
                      </div>

                      {/* Branch Info Body */}
                      <div className="p-4 sm:p-5 space-y-3">
                        {/* Address */}
                        <div className="flex items-start gap-2.5 text-xs text-slate-700">
                          <MapPin size={16} className="text-[#1f4fb2] shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{branch.address}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2.5 text-xs text-slate-700">
                          <Phone size={15} className="text-[#00a859] shrink-0" />
                          <a
                            href={`tel:${(branch.phoneNumber || '1900 8059').replace(/\s+/g, '')}`}
                            className="font-bold text-[#1f4fb2] hover:underline"
                          >
                            {branch.phoneNumber || '1900 8059'}
                          </a>
                          <span className="text-slate-300">|</span>
                          <span className="text-[11px] text-slate-500 font-medium">Hỗ trợ 24/7</span>
                        </div>

                        {/* Hours */}
                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                          <Clock size={15} className="text-slate-400 shrink-0" />
                          <span>
                            {openHour} - {closeHour} (Thứ 2 - Chủ Nhật)
                          </span>
                        </div>

                        {/* Email */}
                        {branch.email && (
                          <div className="flex items-center gap-2.5 text-xs text-slate-500">
                            <Mail size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">{branch.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBranchId(branch.branchId)}
                        className={`rounded-xl border py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#1f4fb2] bg-blue-50/70 text-[#1f4fb2]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Navigation size={13} />
                        <span>Xem bản đồ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectBranchForBooking(branch.branchId)}
                        className="rounded-xl bg-[#1f4fb2] hover:bg-[#183d8b] text-white py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Đặt lịch ngay</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. Booking Form & Interactive Map Grid */}
      <section ref={formRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] items-start">
          {/* Left Column: Booking Form */}
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="h-7 w-[4px] bg-[#1f4fb2] rounded-full" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Đăng Ký Khám Hoặc Yêu Cầu Tư Vấn
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Khám tổng quát, tư vấn giải pháp & chụp X-quang ban đầu hoàn toàn miễn phí
                  </p>
                </div>
              </div>
            </div>

            {formStatus.success ? (
              <div className="py-8 text-center space-y-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00a859] text-white shadow-md">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Gửi Yêu Cầu Đặt Lịch Thành Công!
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                    Hệ thống đã chuyển lịch hẹn của bạn đến chi nhánh{' '}
                    <strong className="text-slate-900">{activeBranch?.branchName}</strong>. Lễ tân phòng khám sẽ gọi xác nhận trong 15 phút.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStatus({ loading: false, success: false, error: null })}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  <span>Gửi Yêu Cầu Mới</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: FullName & Phone */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0901 234 567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Selected Branch (Real DB Entities) & Service */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Phòng khám tiếp nhận <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 appearance-none cursor-pointer font-medium"
                      >
                        {branches.map((b) => (
                          <option key={b.branchId} value={b.branchId}>
                            {b.branchName} ({b.address?.split(',')[0]})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Dịch vụ nha khoa quan tâm
                    </label>
                    <div className="relative">
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 appearance-none cursor-pointer font-medium"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.serviceName}>
                            {s.serviceName}
                          </option>
                        ))}
                        {serviceParam && !services.some((s) => s.serviceName === serviceParam) && (
                          <option value={serviceParam}>{serviceParam}</option>
                        )}
                        {services.length === 0 && (
                          <option value="Khám răng tổng quát">Khám răng tổng quát</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Date & Time */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Ngày khám mong muốn
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Giờ khám mong muốn
                    </label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Textarea & Quick suggestion tags */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Lời nhắn / Mô tả triệu chứng bệnh lý
                  </label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <textarea
                      rows={3}
                      placeholder="Ghi chú triệu chứng, tình trạng răng miệng hoặc thời gian bạn có thể nghe máy..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                    />
                  </div>

                  {/* Quick Tag suggestions */}
                  <div className="mt-2.5">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <Tag size={12} /> Chọn nhanh triệu chứng / nhu cầu:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagClick(tag)}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-[#1f4fb2]/10 hover:text-[#1f4fb2] active:scale-95 cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formStatus.loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] hover:from-[#00a859] hover:to-[#059669] text-white text-sm font-black uppercase tracking-wider py-3.5 shadow-md shadow-blue-500/15 transition-all duration-300 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {formStatus.loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Đang xử lý thông tin...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        <span>Gửi Yêu Cầu Đặt Lịch Hẹn Ngay</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Thông tin của bạn được bảo mật tuyệt đối theo quy chuẩn Y tế.</span>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Selected Branch Details & Google Map Embed */}
          <div className="space-y-6">
            {/* Active Branch Highlight Card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-5 w-1 bg-[#00a859] rounded-full" />
                  <h3 className="text-sm font-black text-slate-900">Chi Nhánh Đang Chọn</h3>
                </div>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#1f4fb2]">
                  {activeBranch?.branchCode || 'CROWN'}
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">{activeBranch?.branchName}</h4>
                <p className="mt-1 text-xs text-slate-600 font-medium flex items-start gap-1.5">
                  <MapPin size={15} className="text-[#1f4fb2] shrink-0 mt-0.5" />
                  <span>{activeBranch?.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hotline cơ sở</p>
                  <p className="font-extrabold text-[#1f4fb2] mt-0.5">{activeBranch?.phoneNumber || '1900 8059'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Giờ làm việc</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">
                    {formatTimeString(activeBranch?.openTime) || '08:30'} - {formatTimeString(activeBranch?.closeTime) || '19:30'}
                  </p>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <a
                  href={`tel:${(activeBranch?.phoneNumber || '1900 8059').replace(/\s+/g, '')}`}
                  className="flex-1 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#1f4fb2] py-2 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                >
                  <Headphones size={14} />
                  <span>Gọi Hotline</span>
                </a>
                <a
                  href={mapExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Mở Google Maps</span>
                </a>
              </div>
            </div>

            {/* Google Map Box */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-3 overflow-hidden">
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#1f4fb2]" />
                  Vị trí trên bản đồ vệ tinh
                </span>
                <span className="text-[11px] text-slate-400">Phóng to / Thu nhỏ trực tiếp</span>
              </div>
              <iframe
                title="Bản đồ Crown Dental"
                src={mapEmbedUrl}
                className="w-full h-72 rounded-xl border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
