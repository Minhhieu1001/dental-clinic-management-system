import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromotions, createAppointment } from '../services/api'

const formatMoney = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value || 0) + 'đ'

function PromotionCard({ promotion }) {
  const service = promotion.services?.[0]
  const discountedPrice = service?.price ? Number(service.price) * (1 - Number(promotion.discountPercent) / 100) : null
  
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,45,95,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(15,45,95,0.12)] border border-slate-100">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {promotion.imageUrl ? (
          <img src={promotion.imageUrl} alt={promotion.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-sm font-semibold text-[#1e3a8a]">
            Crown Dental
          </div>
        )}
        <span className="absolute left-0 top-3 rounded-r-lg bg-[#ff5b15] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
          Giảm {Number(promotion.discountPercent)}%
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 text-center">
        <h3 className="line-clamp-2 min-h-[3rem] text-sm font-extrabold leading-snug text-[#1f3266]">
          {promotion.title}
        </h3>
        
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-[#1f4fb2] uppercase tracking-wider">
            {promotion.category || 'Dịch vụ'}
          </span>
        </div>

        <div className="mt-3.5 mb-5 flex flex-col items-center justify-center">
          {promotion.title.includes("Gói can thiệp sớm") ? (
            <>
              <span className="text-[11px] font-semibold text-slate-400 line-through">17.000.000đ - 21.000.000đ</span>
              <span className="text-sm font-black text-[#f33434] mt-0.5">15.300.000đ - 18.900.000đ</span>
            </>
          ) : service?.price ? (
            <>
              <span className="text-[11px] font-semibold text-slate-400 line-through">{formatMoney(service.price)}</span>
              <span className="text-sm font-black text-[#f33434] mt-0.5">{formatMoney(discountedPrice)}</span>
            </>
          ) : (
            <span className="text-sm font-black text-[#f33434]">Liên hệ để nhận giá</span>
          )}
        </div>

        <Link
          to={`/promotions/${promotion.id}`}
          className="mt-auto mx-auto inline-flex items-center justify-center rounded-full bg-[#edf4ff] px-6 py-2 text-xs font-black text-[#1f64f2] transition hover:bg-[#e1ecff]"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  )
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'nieng_rang', 'price_desc', 'price_asc'

  // Contact Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [formStatus, setFormStatus] = useState({ loading: false, success: false, error: null })

  useEffect(() => {
    getPromotions()
      .then(setPromotions)
      .catch(() => setError('Chưa thể tải dữ liệu ưu đãi. Vui lòng thử lại sau.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredAndSortedPromotions = useMemo(() => {
    let result = [...promotions]

    // 1. Category Filter: 'nieng_rang' filters categories containing 'Niềng răng'
    if (activeFilter === 'nieng_rang') {
      result = result.filter(
        (p) => p.category && p.category.toLowerCase().includes('niềng răng')
      )
    }

    // 2. Price Sorting
    if (activeFilter === 'price_desc' || activeFilter === 'price_asc') {
      result.sort((a, b) => {
        const getPromoPrice = (p) => {
          if (p.title.includes("Gói can thiệp sớm")) return 15300000;
          const service = p.services?.[0]
          if (!service) return 0
          return Number(service.price) * (1 - Number(p.discountPercent) / 100)
        }
        const priceA = getPromoPrice(a)
        const priceB = getPromoPrice(b)
        return activeFilter === 'price_desc' ? priceB - priceA : priceA - priceB
      })
    }

    return result
  }, [promotions, activeFilter])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      alert('Vui lòng điền đầy đủ Họ và tên, Số điện thoại!')
      return
    }

    setFormStatus({ loading: true, success: false, error: null })
    try {
      await createAppointment({
        fullName: fullName,
        phone: phone,
        serviceName: 'Tư vấn ưu đãi',
        branchName: 'Tư vấn trực tuyến',
        message: 'Yêu cầu tư vấn cuộc gọi miễn phí từ trang Ưu đãi',
      })
      setFormStatus({ loading: false, success: true, error: null })
      setFullName('')
      setPhone('')
      setTimeout(() => setFormStatus((prev) => ({ ...prev, success: false })), 4000)
    } catch (err) {
      setFormStatus({
        loading: false,
        success: false,
        error: err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#1f4fb2] transition">Trang chủ</Link>
            <span className="text-slate-300">›</span>
            <span className="text-[#1f4fb2]">Ưu đãi</span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header Title with vertical line and filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-[6px] bg-[#1f4fb2] rounded-full" />
            <h1 className="text-3xl font-black tracking-tight text-[#1f3266]">Ưu đãi</h1>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'nieng_rang', label: 'Niềng răng' },
              { id: 'price_desc', label: 'Giá từ cao xuống thấp' },
              { id: 'price_asc', label: 'Giá từ thấp đến cao' },
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveFilter(tag.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  activeFilter === tag.id
                    ? 'bg-[#1f4fb2] text-white shadow-sm shadow-blue-500/10'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        <div className="mt-10">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-96 animate-pulse rounded-2xl bg-white border border-slate-100" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-6 text-center text-sm font-semibold text-red-600 border border-red-100 max-w-lg mx-auto">
              {error}
            </div>
          )}

          {!loading && !error && (
            filteredAndSortedPromotions.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredAndSortedPromotions.map((promotion) => (
                  <PromotionCard key={promotion.id} promotion={promotion} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200/60 p-12 text-center text-slate-500 shadow-sm max-w-lg mx-auto mt-6">
                Chưa có chương trình ưu đãi nào phù hợp với bộ lọc này.
              </div>
            )
          )}
        </div>

        {/* Section divider and description text */}
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <p className="text-sm text-slate-600 leading-relaxed font-semibold">
            <span className="text-[#1f3266] font-black mr-1">Ưu đãi tốt nhất cho bạn</span> 
            Xem ngay tại đây để cập nhật các ưu đãi mới & hot nhất tại Nha khoa Crown!
          </p>
          <div className="w-16 h-[2px] bg-[#1f4fb2] mx-auto mt-6 rounded-full" />
        </div>

        {/* Section: Tìm Parkway gần nhất */}
        <div className="mt-20">
          <h2 className="text-xl font-black text-center text-[#1f3266] tracking-tight">Tìm Crown gần nhất</h2>
          <div className="grid gap-6 mt-8 sm:grid-cols-3">
            {[
              {
                city: 'Tp. Hồ Chí Minh',
                count: '+9 Phòng khám',
                image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
              },
              {
                city: 'Hà Nội',
                count: '+4 Phòng khám',
                image: 'https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=600&q=80',
              },
              {
                city: 'Các tỉnh',
                count: '+1 Phòng khám',
                image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
              },
            ].map((branch, index) => (
              <div
                key={index}
                className="group relative h-44 overflow-hidden rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition duration-300 cursor-pointer"
              >
                <img
                  src={branch.image}
                  alt={branch.city}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-base font-black tracking-wide">{branch.city}</h3>
                  <p className="text-[11px] text-slate-200 mt-1 font-semibold">{branch.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form & Info columns */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* Left: Registration Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_45px_rgba(15,45,95,0.05)] p-8 sm:p-10">
            <h3 className="text-lg font-black text-[#1f3266] tracking-tight">
              Để lại số điện thoại để được nhận cuộc gọi tư vấn miễn phí
            </h3>
            
            <form onSubmit={handleFormSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Họ và tên*
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên của bạn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Số điện thoại*
                </label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#ff5b15] hover:bg-[#e04c0d] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 transition duration-200 shadow-lg shadow-orange-500/10 w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {formStatus.loading ? 'Đang gửi...' : 'Đặt lịch ngay'}
                </button>
              </div>

              {formStatus.success && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  ✓ Gửi yêu cầu tư vấn thành công! Chúng tôi sẽ gọi lại cho bạn sớm nhất.
                </p>
              )}

              {formStatus.error && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  ✗ Lỗi: {formStatus.error}
                </p>
              )}
            </form>
          </div>

          {/* Right: Info & Contact CTAs */}
          <div className="flex flex-col justify-center">
            {/* Logo Row */}
            <div className="flex items-center gap-3 select-none">
              <img
                src="/logo.png"
                alt="Crown Dental Logo"
                className="h-12 w-12 object-contain"
              />
              <div className="leading-tight">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NHA KHOA</p>
                <h3 className="text-xl font-black tracking-tight text-[#1f4fb2] leading-none my-0.5">
                  CROWN Dental
                </h3>
                <p className="text-[7px] text-slate-400 uppercase tracking-wider font-semibold">NGƯỜI BẠN TRỌN ĐỜI</p>
              </div>
            </div>

            <h3 className="mt-6 text-lg font-black text-[#1f3266]">Nha khoa Crown</h3>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              Nha khoa Crown là một trong những chuỗi nha khoa hàng đầu tại Việt Nam, được công nhận danh hiệu Red Diamond Invisalign Provider - cấp độ cao nhất toàn cầu trong lĩnh vực niềng răng trong suốt. Với hơn 1.000 ca Invisalign mỗi năm, Crown không chỉ dẫn đầu tại Việt Nam mà còn vươn lên vị trí top đầu Đông Nam Á, khẳng định vị thế tiên phong của mình trong ngành nha khoa hiện đại.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href="tel:19008059"
                className="flex items-center justify-center gap-2.5 rounded-full bg-[#edf3ff] hover:bg-[#e1ecff] text-[#1f64f2] text-xs font-black py-3.5 w-full transition duration-200 border border-blue-100 shadow-sm"
              >
                <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                1900 8059
              </a>

              <Link
                to="/contact"
                className="flex items-center justify-center gap-2.5 rounded-full text-white text-xs font-black py-3.5 w-full transition duration-200 shadow-md hover:opacity-95"
                style={{ background: 'linear-gradient(90deg, #3E587B 0%, #394579 50%, #363876 100%)' }}
              >
                <svg className="h-4 w-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
