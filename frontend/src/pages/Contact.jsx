import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { User, Phone, MapPin, Calendar, Clock, FileText, Sparkles, CheckCircle2, Tag, Mail, Headphones, ShieldCheck, ArrowRight } from 'lucide-react'
import { createAppointment, getServices } from '../services/api'
import { createAppointmentRequest } from '../services/appointmentRequest.service'
import toast from 'react-hot-toast'

const QUICK_TAGS = [
  'Khám răng tổng quát',
  'Tư vấn niềng răng',
  'Trồng răng Implant',
  'Răng sứ thẩm mỹ',
  'Tẩy trắng răng',
  'Nhổ răng khôn',
]

export default function Contact() {
  const [searchParams] = useSearchParams()
  const serviceParam = searchParams.get('service')

  // Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('Hà Nội - 328 Phố Huế, Hai Bà Trưng')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [message, setMessage] = useState('')
  
  const [services, setServices] = useState([])
  const [formStatus, setFormStatus] = useState({ loading: false, success: false, error: null })

  // Load services for dropdown
  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data)
        if (serviceParam) {
          setSelectedService(serviceParam)
        } else if (data.length > 0) {
          setSelectedService(data[0].serviceName)
        }
      })
      .catch((err) => console.error('Failed to load services:', err))
  }, [serviceParam])

  // Handle Quick Tag click
  const handleTagClick = (tag) => {
    if (!message) {
      setMessage(tag)
    } else if (!message.includes(tag)) {
      setMessage(`${message}, ${tag}`)
    }
  }

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
      // Create appointment request
      await createAppointmentRequest({
        fullName: fullName.trim(),
        phone: phone.trim(),
        branchName: selectedBranch.split(' - ')[0].trim(),
        description: `Dịch vụ: ${selectedService || 'Chưa chọn'} | Cơ sở: ${selectedBranch} | Ngày: ${date || 'Chưa chọn'} | Giờ: ${time} | Ghi chú: ${message.trim()}`,
      })

      // Also submit appointment API if needed
      await createAppointment({
        fullName,
        phone,
        serviceName: selectedService,
        branchName: selectedBranch,
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* 1. Page Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2b66] via-[#1f4fb2] to-[#00a859] py-16 lg:py-20 text-white">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00a859]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="text-blue-300">›</span>
            <span className="text-white font-extrabold">Liên hệ & Đặt lịch</span>
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#4ade80] backdrop-blur-md">
              <Sparkles size={13} className="text-yellow-300 animate-pulse" />
              Crown Dental Clinic
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Liên Hệ & Đặt Lịch Hẹn Thăm Khám
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-2xl font-medium leading-relaxed">
            Hệ thống phòng khám nha khoa Crown - Đội ngũ thạc sĩ, bác sĩ chuyên khoa sẵn sàng lắng nghe, tư vấn và chăm sóc nụ cười của bạn.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          
          {/* Left Column: Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="h-7 w-[4px] bg-[#1f4fb2] rounded-full" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">Gửi Yêu Cầu Hoặc Đặt Lịch Hẹn Khám</h2>
                  <p className="text-xs text-slate-500 font-medium">Tư vấn và khám tổng quát miễn phí 100%</p>
                </div>
              </div>
            </div>

            {formStatus.success ? (
              <div className="py-8 text-center space-y-4 bg-emerald-50/60 rounded-3xl border border-emerald-100 p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00a859] text-white shadow-md">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Gửi Yêu Cầu Đặt Lịch Thành Công!</h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                    Cảm ơn bạn đã lựa chọn Crown Dental. Lễ tân phòng khám sẽ gọi lại tư vấn và xác nhận thời gian đặt lịch trong 15 phút tới.
                  </p>
                </div>
                <button
                  onClick={() => setFormStatus({ loading: false, success: false, error: null })}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white text-xs font-black uppercase tracking-wider px-7 py-3 shadow-md hover:scale-105 transition duration-200 cursor-pointer"
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Service & Branch */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Dịch vụ quan tâm
                    </label>
                    <div className="relative">
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 appearance-none cursor-pointer font-medium"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.serviceName}>
                            {s.serviceName}
                          </option>
                        ))}
                        {serviceParam && !services.some(s => s.serviceName === serviceParam) && (
                          <option value={serviceParam}>{serviceParam}</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2050/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Phòng khám gần bạn
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 appearance-none cursor-pointer font-medium"
                      >
                        <option value="Hà Nội - 328 Phố Huế, Hai Bà Trưng">Hà Nội - 328 Phố Huế, Hai Bà Trưng</option>
                        <option value="TP. HCM - 215 Nam Kỳ Khởi Nghĩa, Quận 3">TP. HCM - 215 Nam Kỳ Khởi Nghĩa, Quận 3</option>
                        <option value="Bình Dương - 564 Đại Lộ Bình Dương">Bình Dương - 564 Đại Lộ Bình Dương</option>
                        <option value="Tư vấn trực tuyến 1-1">Tư vấn trực tuyến 1-1</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2050/svg" viewBox="0 0 20 20">
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
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
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
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
                      placeholder="Ghi chú triệu chứng hoặc thời gian bạn có thể nghe điện thoại tư vấn..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4fb2] focus:bg-white focus:ring-4 focus:ring-[#1f4fb2]/10 font-medium"
                    />
                  </div>

                  {/* Quick Tag suggestions */}
                  <div className="mt-2.5">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <Tag size={12} /> Chọn nhanh nhu cầu:
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

                {/* Submit Button — Crown Dental Emerald & Royal Blue Gradient */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={formStatus.loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f4fb2] via-[#2563eb] to-[#00a859] hover:from-[#00a859] hover:to-[#059669] text-white text-sm font-black uppercase tracking-wider py-4 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-emerald-500/25 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {formStatus.loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Đang xử lý thông tin...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        <span>GỬI ĐĂNG KÝ HẸN KHÁM NGAY</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-400 font-medium">
                  Thông tin cá nhân của bạn được bảo mật tuyệt đối theo quy chuẩn Bộ Y Tế.
                </p>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details & Map */}
          <div className="space-y-8">
            {/* Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                <span className="h-6 w-[4px] bg-[#00a859] rounded-full" />
                <h2 className="text-base font-black text-slate-900">Thông Tin Liên Hệ Trực Tiếp</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 transition">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1f4fb2] font-bold">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hotline Tổng Đài 24/7</p>
                    <p className="mt-0.5 text-base font-black text-[#1f4fb2]">1900 8059 - 0901 234 567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-emerald-200 transition">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00a859] font-bold">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email Tư Vấn & Hỗ Trợ</p>
                    <p className="mt-0.5 text-base font-black text-slate-800">info@crown.vn</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-blue-200 transition">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1f4fb2] font-bold">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Giờ Làm Việc Hàng Ngày</p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-800">8:30 - 19:30 (Tất cả các ngày trong tuần)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <MapPin size={20} className="text-[#1f4fb2]" />
                <h3 className="text-base font-black text-slate-900">Hệ Thống Cơ Sở Crown Dental</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-black text-[#1f4fb2] uppercase text-[10px] tracking-wider">Cơ sở 1 - Hà Nội</p>
                  <p className="text-slate-700 mt-1 font-semibold">328 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hotline: 1900 6899 (Nhánh 1)</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="font-black text-[#1f4fb2] uppercase text-[10px] tracking-wider">Cơ sở 2 - TP. Hồ Chí Minh</p>
                  <p className="text-slate-700 mt-1 font-semibold">215 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. HCM</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hotline: 1900 6899 (Nhánh 2)</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="font-black text-[#1f4fb2] uppercase text-[10px] tracking-wider">Cơ sở 3 - Bình Dương</p>
                  <p className="text-slate-700 mt-1 font-semibold">564 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hotline: 1900 6899 (Nhánh 3)</p>
                </div>
              </div>
            </div>

            {/* Google Map Box */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-3 overflow-hidden">
              <iframe
                title="Bản đồ Crown Dental"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.3648043683074!2d105.84714651152063!3d21.018090588072175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m2s0x0%3A0x0!2zMjHCsDAxJzA1LjEiTiAxMDXCsDUwJzU5LjciRQ!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn"
                className="w-full h-64 rounded-2xl border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}