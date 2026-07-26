import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createAppointment, getServices } from '../services/api'

export default function Contact() {
  const [searchParams] = useSearchParams()
  const serviceParam = searchParams.get('service')

  // Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('Hà Nội - 328 Phố Huế')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      alert('Vui lòng điền đầy đủ Họ và tên, Số điện thoại!')
      return
    }

    setFormStatus({ loading: true, success: false, error: null })
    try {
      await createAppointment({
        fullName,
        phone,
        serviceName: selectedService,
        branchName: selectedBranch,
        date,
        time,
        message,
      })
      setFormStatus({ loading: false, success: true, error: null })
      setFullName('')
      setPhone('')
      setDate('')
      setMessage('')
      setTimeout(() => setFormStatus((prev) => ({ ...prev, success: false })), 5000)
    } catch (err) {
      setFormStatus({
        loading: false,
        success: false,
        error: err.response?.data?.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau!',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#132c6b] to-[#1f4fb2] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex justify-center sm:justify-start items-center gap-1.5 mb-2">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span>›</span>
            <span>Liên hệ</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Liên hệ & Đặt lịch hẹn</h1>
          <p className="mt-2 text-xs text-blue-100 max-w-xl">
            Hệ thống phòng khám nha khoa Crown - Đội ngũ bác sĩ tận tâm sẵn sàng lắng nghe và chăm sóc nụ cười của bạn.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Left Column: Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_45px_rgba(15,45,95,0.04)] p-6 sm:p-10">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span className="h-6 w-[4px] bg-[#1f4fb2] rounded-full" />
              <h2 className="text-base font-black text-[#1f3266]">Gửi yêu cầu hoặc Đặt lịch hẹn nhanh</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Họ và tên*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-450 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Số điện thoại*
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-450 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Dịch vụ quan tâm
                  </label>
                  <div className="relative">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200 appearance-none cursor-pointer"
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
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2050/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Phòng khám gần bạn
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200 appearance-none cursor-pointer"
                    >
                      <option value="Hà Nội - 328 Phố Huế">Hà Nội - 328 Phố Huế, Hai Bà Trưng</option>
                      <option value="TP. HCM - 215 Nam Kỳ Khởi Nghĩa">TP. HCM - 215 Nam Kỳ Khởi Nghĩa, Quận 3</option>
                      <option value="Tư vấn trực tuyến">Tư vấn trực tuyến</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2050/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Ngày khám mong muốn
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Giờ khám mong muốn
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Lời nhắn / Triệu chứng bệnh lý
                </label>
                <textarea
                  rows={4}
                  placeholder="Ghi chú triệu chứng hoặc thời gian bạn có thể nghe điện thoại tư vấn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 px-5 py-3 text-sm text-slate-800 focus:border-[#1f4fb2] focus:bg-white focus:outline-none transition duration-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#ff5b15] hover:bg-[#e04c0d] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-4 transition duration-200 shadow-lg shadow-orange-500/10 w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  {formStatus.loading ? 'Đang xử lý...' : 'Gửi yêu cầu ngay'}
                </button>
              </div>

              {formStatus.success && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  ✓ Yêu cầu đặt lịch của bạn đã được gửi thành công! Đội ngũ Crown Dental sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
              )}

              {formStatus.error && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  ✗ Lỗi: {formStatus.error}
                </p>
              )}
            </form>
          </div>

          {/* Right Column: Contact Details & Map */}
          <div className="space-y-8">
            {/* Info Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <span className="h-6 w-[4px] bg-[#00a859] rounded-full" />
                <h2 className="text-base font-black text-[#1f3266]">Thông tin liên hệ</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1f4fb2]">
                    <svg className="h-5 w-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hotline tổng đài</p>
                    <p className="mt-1 text-sm font-black text-[#1f3266]">1900 8059</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#00a859]">
                    <svg className="h-5 w-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Email tiếp nhận</p>
                    <p className="mt-1 text-sm font-black text-[#1f3266]">info@crown.vn</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ff5b15]">
                    <svg className="h-5 w-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Giờ làm việc</p>
                    <p className="mt-1 text-sm font-black text-[#1f3266]">8:30 - 19:30 (Cả tuần)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Box */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-3 overflow-hidden">
              <iframe
                title="Bản đồ Crown Dental"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.3648043683074!2d105.84714651152063!3d21.018090588072175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m2s0x0%3A0x0!2zMjHCsDAxJzA1LjEiTiAxMDXCsDUwJzU5LjciRQ!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn"
                className="w-full h-60 rounded-2xl border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Address List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <svg className="h-5 w-5 text-[#1f4fb2] stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm font-black text-[#1f3266]">Hệ thống cơ sở</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-extrabold text-[#1f3266] uppercase text-[9px] tracking-wider">Chi nhánh Hà Nội</p>
                  <p className="text-slate-650 mt-1 font-semibold">328 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="font-extrabold text-[#1f3266] uppercase text-[9px] tracking-wider">Chi nhánh TP. HCM</p>
                  <p className="text-slate-650 mt-1 font-semibold">215 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}