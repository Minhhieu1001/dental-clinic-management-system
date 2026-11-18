import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getPromotion, getPromotions } from '../services/promotion.service'
import { createPublicAppointment as createAppointment } from '../services/appointment.service'

const formatMoney = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value || 0) + 'đ'

// Custom hook tính thời gian đếm ngược trực tiếp
function useCountdown(endDateString) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!endDateString) return

    const calculateTimeLeft = () => {
      const difference = +new Date(endDateString) - +new Date()
      if (difference <= 0) return null

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDateString])

  return timeLeft
}

export default function PromotionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [promotion, setPromotion] = useState(null)
  const [otherPromotions, setOtherPromotions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Booking Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [formStatus, setFormStatus] = useState({ loading: false, success: false, error: null })

  useEffect(() => {
    setLoading(true)
    setError('')

    // Fetch promotion chi tiết
    getPromotion(id)
      .then((data) => {
        setPromotion(data)
        if (data.services && data.services.length > 0) {
          setSelectedServiceId(data.services[0].id)
        }
      })
      .catch(() => setError('Không tìm thấy chương trình ưu đãi.'))
      .finally(() => setLoading(false))

    // Fetch các ưu đãi khác để gợi ý
    getPromotions()
      .then((allData) => {
        const filtered = allData.filter((p) => p.id !== id).slice(0, 3)
        setOtherPromotions(filtered)
      })
      .catch((err) => console.error('Lỗi tải các ưu đãi khác:', err))
  }, [id])

  const timeLeft = useCountdown(promotion?.endDate)

  // Xử lý nộp form tư vấn / đặt hẹn
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại!')
      return
    }

    // Tìm tên dịch vụ được chọn để gửi đi
    const chosenService = promotion?.services?.find(s => s.id === selectedServiceId)
    const serviceNameForBooking = chosenService
      ? `Ưu đãi: ${chosenService.serviceName} (-${promotion.discountPercent}%)`
      : `Ưu đãi: ${promotion?.title}`

    setFormStatus({ loading: true, success: false, error: null })
    try {
      await createAppointment({
        fullName: fullName,
        phone: phone,
        serviceName: serviceNameForBooking,
        branchName: 'Tư vấn trực tuyến',
        message: `Đăng ký nhận ưu đãi "${promotion?.title}". Giảm ${promotion?.discountPercent}%.`,
      })
      setFormStatus({ loading: false, success: true, error: null })
      setFullName('')
      setPhone('')
      setTimeout(() => {
        setFormStatus(prev => ({ ...prev, success: false }))
      }, 5000)
    } catch (err) {
      setFormStatus({
        loading: false,
        success: false,
        error: err.response?.data?.message || 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau sau!',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-slate-50/50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1f4fb2] border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse">Đang tải dữ liệu ưu đãi...</p>
      </div>
    )
  }

  if (error || !promotion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center bg-slate-50">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">{error || 'Không tìm thấy ưu đãi tương thích.'}</p>
        <Link to="/promotions" className="inline-flex items-center justify-center rounded-full bg-[#1f4fb2] px-6 py-2.5 text-xs font-black text-white hover:bg-[#153a8a] transition shadow-md">
          ← Quay lại danh sách ưu đãi
        </Link>
      </div>
    )
  }

  const primaryService = promotion.services?.[0]
  const isChildOrth = promotion.title.includes("Gói can thiệp sớm")

  // Tính toán phần trăm thời hạn ưu đãi đã trôi qua (phục vụ thanh tiến trình trực quan)
  const calculateDurationPercentage = () => {
    if (!promotion.startDate || !promotion.endDate) return 100
    const start = +new Date(promotion.startDate)
    const end = +new Date(promotion.endDate)
    const now = +new Date()
    if (now >= end) return 0
    if (now <= start) return 100
    return Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100))
  }
  const timeProgress = calculateDurationPercentage()

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#1f4fb2] transition">Trang chủ</Link>
            <span className="text-slate-300">›</span>
            <Link to="/promotions" className="hover:text-[#1f4fb2] transition">Ưu đãi</Link>
            <span className="text-slate-300">›</span>
            <span className="text-[#1f4fb2] font-bold line-clamp-1">{promotion.title}</span>
          </p>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-[#182a5c] via-[#203a7d] to-[#122046] text-white py-12 sm:py-16 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
        <div className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap gap-2.5 items-center mb-4">
            <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-300">
              {promotion.category || 'Chương trình ưu đãi'}
            </span>
            <span className="rounded-full bg-orange-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white animate-pulse">
              Tiết kiệm {Number(promotion.discountPercent)}%
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight max-w-4xl tracking-tight">
            {promotion.title}
          </h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid gap-8 lg:grid-cols-[2.5fr_1.1fr] items-start">

          {/* Left Column: Image, Applied Services, & Details */}
          <div className="space-y-8">
            {/* Image Box */}
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-2.5 shadow-[0_15px_45px_rgba(15,45,95,0.03)] group">
              <div className="overflow-hidden rounded-2xl relative">
                {promotion.imageUrl ? (
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    className="w-full h-auto max-h-[500px] object-cover mx-auto transform transition duration-700 group-hover:scale-102"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 font-bold">
                    Crown Dental
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Applicable Services Section */}
            {promotion.services && promotion.services.length > 0 && (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_45px_rgba(15,45,95,0.03)]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <span className="h-6 w-[4px] bg-[#1f4fb2] rounded-full" />
                  <h2 className="text-lg font-black text-[#1f3266]">Dịch vụ áp dụng ưu đãi</h2>
                </div>

                <div className="space-y-4">
                  {promotion.services.map((item) => {
                    const originalPrice = Number(item.price)
                    const finalPrice = originalPrice * (1 - Number(promotion.discountPercent) / 100)
                    const savedAmount = originalPrice - finalPrice

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedServiceId(item.id)}
                        className={`group border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition duration-300 cursor-pointer ${selectedServiceId === item.id
                            ? 'border-[#1f4fb2] bg-blue-50/30 ring-1 ring-[#1f4fb2]/30'
                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selectedServiceId === item.id
                              ? 'border-[#1f4fb2] bg-[#1f4fb2] text-white'
                              : 'border-slate-300 group-hover:border-slate-400'
                            }`}>
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-[#1f3266] group-hover:text-[#1f4fb2] transition">
                              {item.serviceName}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                              Danh mục: {promotion.category || 'Nha khoa chuyên sâu'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center sm:text-right gap-3 sm:gap-4 sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div>
                            <span className="block text-[11px] font-semibold text-slate-400 line-through">
                              {formatMoney(originalPrice)}
                            </span>
                            <span className="block text-base font-black text-[#f33434] mt-0.5">
                              {formatMoney(finalPrice)}
                            </span>
                          </div>
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-center min-w-[110px]">
                            <span className="block text-[9px] font-bold uppercase tracking-wider">Tiết kiệm ngay</span>
                            <span className="block text-[11px] font-extrabold">{formatMoney(savedAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Content Body / Description */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_45px_rgba(15,45,95,0.03)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <span className="h-6 w-[4px] bg-[#1f4fb2] rounded-full" />
                <h2 className="text-lg font-black text-[#1f3266]">Chi tiết chương trình</h2>
              </div>

              <div className="prose max-w-none text-slate-600 leading-relaxed text-sm">
                {promotion.description ? (
                  promotion.description.split('\n').map((para, idx) => {
                    const cleanPara = para.trim()
                    if (!cleanPara) return <div key={idx} className="h-4" />

                    // Heading matching: ends with "?" or contains "Ưu điểm" or "Những lưu ý" or "Các kỹ thuật"
                    if (cleanPara.endsWith('?') || cleanPara.startsWith('Ưu điểm') || cleanPara.startsWith('Những lưu ý') || cleanPara.startsWith('Các kỹ thuật')) {
                      return (
                        <h3 key={idx} className="text-base font-black text-[#1f3266] mt-8 mb-4 border-l-4 border-blue-500 pl-3">
                          {cleanPara}
                        </h3>
                      )
                    }

                    // Bullet point matching: starts with "-" or "*" or bullet symbol
                    if (cleanPara.startsWith('-') || cleanPara.startsWith('*')) {
                      return (
                        <ul key={idx} className="list-disc pl-6 my-2 text-slate-600">
                          <li className="pl-1 py-0.5">{cleanPara.substring(1).trim()}</li>
                        </ul>
                      )
                    }

                    return <p key={idx} className="mb-4 text-justify">{cleanPara}</p>
                  })
                ) : (
                  <p>Thông tin chi tiết về chương trình ưu đãi đang được cập nhật. Quý khách vui lòng điền thông tin vào form đăng ký để nhận tư vấn chi tiết miễn phí.</p>
                )}
              </div>
            </div>

            {/* Why Choose Crown Dental Section */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_45px_rgba(15,45,95,0.03)]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <span className="h-6 w-[4px] bg-[#1f4fb2] rounded-full" />
                <h2 className="text-lg font-black text-[#1f3266]">Cam kết dịch vụ tại Crown Dental</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Bác sĩ chuyên môn cao',
                    desc: 'Đội ngũ thạc sĩ, bác sĩ giỏi chuyên khoa chỉnh nha & thẩm mỹ với trên 10 năm kinh nghiệm.',
                    icon: '🎓'
                  },
                  {
                    title: 'Vật liệu chính hãng 100%',
                    desc: 'Sử dụng khay niềng Invisalign, ClearCorrect nhập khẩu Mỹ/Thụy Sĩ, có mã vạch check nguồn gốc.',
                    icon: '🛡️'
                  },
                  {
                    title: 'Hỗ trợ trả góp 0% lãi suất',
                    desc: 'Thủ tục nhanh chóng qua thẻ tín dụng của hơn 25 ngân hàng hoặc trả trực tiếp tại phòng khám.',
                    icon: '💳'
                  },
                  {
                    title: 'Hệ thống vô trùng tuyệt đối',
                    desc: 'Đảm bảo an toàn y khoa khép kín theo tiêu chuẩn Châu Âu, hạn chế lây nhiễm chéo tối đa.',
                    icon: '✨'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 border border-slate-50 rounded-2xl bg-slate-50/30 hover:bg-slate-50 transition duration-200">
                    <span className="text-2xl mt-1 select-none">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-[#1f3266] uppercase tracking-wide">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Flow Guide */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_45px_rgba(15,45,95,0.03)] text-center">
              <h3 className="text-sm font-black text-[#1f3266] uppercase tracking-wider mb-6">3 Bước nhận ưu đãi đơn giản</h3>
              <div className="grid gap-6 sm:grid-cols-3 relative">
                {[
                  { step: '01', title: 'Đăng ký thông tin', desc: 'Điền họ tên & SĐT vào form tư vấn hoặc gọi hotline.' },
                  { step: '02', title: 'Tư vấn & Thăm khám', desc: 'Bác sĩ khám miễn phí, chụp phim và lên phác đồ điều trị.' },
                  { step: '03', title: 'Nhận ưu đãi giảm giá', desc: 'Nhận mức giảm trực tiếp khi thanh toán chi phí tại quầy.' }
                ].map((item, index) => (
                  <div key={index} className="relative z-10 flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-[#1f4fb2] border-2 border-white shadow-md mb-3">
                      {item.step}
                    </span>
                    <h4 className="text-xs font-black text-[#1f3266]">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Sidebar with Urgency, Price, & Direct Booking Form */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_15px_50px_rgba(15,45,95,0.05)] overflow-hidden relative">

              {/* Hot promo banner line */}
              <div className="absolute top-0 left-0 right-0 h-[5px] bg-[#1f4fb2]" />

              {/* Urgency Section: Live Countdown Timer */}
              {promotion.endDate && (
                <div className="border-b border-slate-100 pb-5 mb-5 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 mb-3 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    Ưu đãi sắp kết thúc!
                  </div>

                  {timeLeft ? (
                    <div className="grid grid-cols-4 gap-2 text-center mt-1">
                      {[
                        { label: 'Ngày', value: timeLeft.days },
                        { label: 'Giờ', value: timeLeft.hours },
                        { label: 'Phút', value: timeLeft.minutes },
                        { label: 'Giây', value: timeLeft.seconds }
                      ].map((t, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                          <span className="block text-base font-black text-[#1f3266]">{String(t.value).padStart(2, '0')}</span>
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">Thời gian áp dụng đã kết thúc</p>
                  )}

                  {/* Visual timer progress bar */}
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000"
                      style={{ width: `${timeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Price Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                <span className="inline-flex rounded-full bg-blue-100 border border-blue-200 px-3 py-0.5 text-[9px] font-bold text-[#1f4fb2] uppercase tracking-wider mb-2.5">
                  Giá dịch vụ sau ưu đãi
                </span>

                <div>
                  {isChildOrth ? (
                    <>
                      <p className="text-xs font-semibold text-slate-400 line-through">17.000.000đ - 21.000.000đ</p>
                      <p className="text-xl font-black text-[#f33434] mt-0.5">15.300.000đ - 18.900.000đ</p>
                    </>
                  ) : primaryService?.price ? (
                    <>
                      <p className="text-xs font-semibold text-slate-400 line-through">
                        {formatMoney(
                          promotion.services.find(s => s.id === selectedServiceId)?.price || primaryService.price
                        )}
                      </p>
                      <p className="text-xl font-black text-[#f33434] mt-0.5">
                        {formatMoney(
                          (Number(promotion.services.find(s => s.id === selectedServiceId)?.price || primaryService.price)) *
                          (1 - Number(promotion.discountPercent) / 100)
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-black text-[#f33434]">Liên hệ để nhận giá</p>
                  )}
                  <p className="text-[9px] text-slate-400 italic mt-2 leading-snug">*Giá chính xác áp dụng dựa trên tình trạng răng của bạn.</p>
                </div>
              </div>

              {/* Booking/Registration Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h4 className="text-xs font-black text-[#1f3266] uppercase tracking-wider">Đăng ký nhận cuộc gọi tư vấn miễn phí</h4>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>

                {promotion.services && promotion.services.length > 1 && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Dịch vụ muốn đăng ký</label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                    >
                      {promotion.services.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.serviceName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#ff5b15] hover:bg-[#e04c0d] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 transition duration-200 shadow-md shadow-orange-500/10"
                >
                  {formStatus.loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang đăng ký...
                    </>
                  ) : 'Nhận ưu đãi ngay'}
                </button>

                {formStatus.success && (
                  <p className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 p-2.5 rounded-xl mt-2 text-center">
                    ✓ Đăng ký thành công! Tư vấn viên sẽ liên hệ lại sớm nhất.
                  </p>
                )}

                {formStatus.error && (
                  <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl mt-2 text-center">
                    ✗ Lỗi: {formStatus.error}
                  </p>
                )}
              </form>

              {/* Call Hotline */}
              <div className="mt-5 border-t border-slate-100 pt-5 text-center">
                <p className="text-[10px] font-semibold text-slate-400">Hoặc liên hệ tổng đài đặt lịch trực tiếp:</p>
                <a
                  href="tel:19008059"
                  className="inline-flex items-center gap-2 mt-2 text-base font-black text-[#1f4fb2] hover:text-[#153a8a] transition"
                >
                  📞 1900 8059
                </a>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Section: Related Promotions Carousel/Grid */}
        {otherPromotions && otherPromotions.length > 0 && (
          <div className="mt-20 border-t border-slate-200/80 pt-16">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-xl sm:text-2xl font-black text-[#1f3266] tracking-tight">Chương trình ưu đãi khác dành cho bạn</h2>
              <p className="text-xs text-slate-500 mt-2 font-medium">Khám phá các ưu đãi đặc biệt khác đang diễn ra tại hệ thống Nha khoa Crown</p>
              <div className="w-12 h-[2px] bg-[#1f4fb2] mx-auto mt-4 rounded-full" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherPromotions.map((promo) => {
                const promoService = promo.services?.[0]
                const discountedPromoPrice = promoService?.price
                  ? Number(promoService.price) * (1 - Number(promo.discountPercent) / 100)
                  : null

                return (
                  <article
                    key={promo.id}
                    className="flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-300 hover:-translate-y-0.5"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {promo.imageUrl ? (
                        <img src={promo.imageUrl} alt={promo.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-xs font-extrabold text-[#1e3a8a]">
                          Crown Dental
                        </div>
                      )}
                      <span className="absolute left-0 top-3 rounded-r-lg bg-[#ff5b15] px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                        Giảm {Number(promo.discountPercent)}%
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4 text-center">
                      <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-black leading-snug text-[#1f3266] hover:text-[#1f4fb2] transition">
                        <Link to={`/promotions/${promo.id}`}>{promo.title}</Link>
                      </h3>

                      <div className="mt-1.5">
                        <span className="inline-flex rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-[#1f4fb2] uppercase tracking-wider">
                          {promo.category || 'Ưu đãi'}
                        </span>
                      </div>

                      <div className="mt-3 mb-4 flex flex-col items-center justify-center min-h-[2.5rem]">
                        {promo.title.includes("Gói can thiệp sớm") ? (
                          <>
                            <span className="text-[10px] font-semibold text-slate-400 line-through">17.000.000đ - 21.000.000đ</span>
                            <span className="text-xs font-black text-[#f33434] mt-0.5">15.300.000đ - 18.900.000đ</span>
                          </>
                        ) : promoService?.price ? (
                          <>
                            <span className="text-[10px] font-semibold text-slate-400 line-through">{formatMoney(promoService.price)}</span>
                            <span className="text-xs font-black text-[#f33434] mt-0.5">{formatMoney(discountedPromoPrice)}</span>
                          </>
                        ) : (
                          <span className="text-xs font-black text-[#f33434]">Liên hệ để nhận giá</span>
                        )}
                      </div>

                      <Link
                        to={`/promotions/${promo.id}`}
                        className="mt-auto mx-auto inline-flex items-center justify-center rounded-xl bg-[#edf4ff] px-5 py-2 text-[10px] font-black text-[#1f64f2] transition hover:bg-[#e1ecff]"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
