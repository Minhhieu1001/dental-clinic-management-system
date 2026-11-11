import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, MapPin, ArrowRight, Sparkles, Users, Award, ShieldCheck, Mail, Calendar } from 'lucide-react'

const CAREER_OPENINGS = [
  {
    title: 'Bác Sĩ Chuyên Khoa Chỉnh Nha (Invisalign)',
    type: 'Toàn thời gian',
    location: 'Hà Nội & TP. HCM',
    exp: '3+ năm kinh nghiệm',
    salary: 'Thỏa thuận hấp dẫn (35 - 70 Triệu)',
    desc: 'Trực tiếp khám, lên phác đồ điều trị ClinCheck 3D và điều trị chỉnh nha cho bệnh nhân.',
  },
  {
    title: 'Bác Sĩ Cấy Ghép Implant & Phục Hình',
    type: 'Toàn thời gian',
    location: 'TP. Hồ Chí Minh',
    exp: '5+ năm kinh nghiệm',
    salary: 'Cạnh tranh (50 - 100 Triệu)',
    desc: 'Thực hiện các ca cấy ghép Implant đơn lẻ, toàn hàm All-on-4/6 và phục hình sứ thẩm mỹ.',
  },
  {
    title: 'Phụ Tá Nha Khoa / Điều Dưỡng Nha Khoa',
    type: 'Toàn thời gian',
    location: 'Hà Nội, TP. HCM, Bình Dương',
    exp: '1+ năm hoặc mới tốt nghiệp',
    salary: '10 - 18 Triệu + Thưởng KPI',
    desc: 'Hỗ trợ bác sĩ điều trị trong ca thủ thuật, chuẩn bị phòng khám và dụng cụ vô trùng.',
  },
  {
    title: 'Chuyên Viên Tư Vấn & Chăm Sóc Khách Hàng',
    type: 'Toàn thời gian',
    location: 'Hà Nội & TP. HCM',
    exp: 'Ưu tiên kinh nghiệm nha khoa / thẩm mỹ',
    salary: '12 - 25 Triệu',
    desc: 'Tư vấn phác đồ điều trị, tiếp đón và chăm sóc khách hàng trước, trong và sau dịch vụ.',
  },
]

const DOCTOR_COUNCIL = [
  {
    name: 'ThS. BS. Nguyễn Minh Tuấn',
    title: 'Giám Đốc Chuyên Môn - Chuyên Gia Chỉnh Nha',
    qualification: 'Thạc sĩ Răng Hàm Mặt ĐH Y Dược TP.HCM - Tu nghiệp Hoa Kỳ',
    experience: '15+ năm kinh nghiệm • Đạt danh hiệu Invisalign Platinum Elite Doctor',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=800',
    specialties: ['Niềng răng trong suốt Invisalign', 'Chỉnh nha mặt trong', 'Khớp cắn phức tạp'],
  },
  {
    name: 'BS. CKII Hoàng Thanh Hà',
    title: 'Trưởng Khoa Cấy Ghép Implant & Phẫu Thuật Hàm Mặt',
    qualification: 'Bác sĩ Chuyên Khoa II - Tu nghiệp CHFG Cộng Hòa Liên Bang Đức',
    experience: '12+ năm kinh nghiệm • Thành viên Hiệp hội Implant Quốc tế ITI',
    image: 'https://images.unsplash.com/photo-1594824813572-c0e86b453e97?auto=format&fit=crop&q=80&w=800',
    specialties: ['Cấy ghép Implant Straumann', 'Ghép xương màng', 'Implant tức thì'],
  },
  {
    name: 'ThS. BS. Trần Đức Anh',
    title: 'Chuyên Gia Phục Hình Thẩm Mỹ & Smile Design',
    qualification: 'Thạc sĩ Nha Khoa - Chứng chỉ Thẩm Mỹ Nụ Cười Singapore',
    experience: '10+ năm kinh nghiệm • Hơn 8.000 ca dán sứ Veneer thành công',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=800',
    specialties: ['Dán sứ Veneer Emax siêu mỏng', 'Thiết kế nụ cười 3D', 'Bọc răng sứ cao cấp'],
  },
  {
    name: 'BS. CKI Lê Thị Mai Anh',
    title: 'Bác Sĩ Trưởng Khoa Nha Khoa Tổng Quát & Trẻ Em',
    qualification: 'Bác sĩ CKI ĐH Y Hà Nội - Chứng chỉ Chỉnh Nha Can Thiệp Sớm',
    experience: '8+ năm kinh nghiệm • Được hàng ngàn phụ huynh và trẻ em yêu mến',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
    specialties: ['Can thiệp tiền chỉnh nha trẻ em', 'Điều trị nội nha không đau', 'Nhổ răng khôn'],
  },
]

export default function PublicInfo() {
  const location = useLocation()
  const isCareers = location.pathname.includes('careers')

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2b66] via-[#1f4fb2] to-[#00a859] py-16 lg:py-20 text-white">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#00a859]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <span className="text-blue-300">›</span>
            <span className="text-white font-extrabold">{isCareers ? 'Tuyển Dụng Nhân Tài' : 'Hội Đồng Bác Sĩ'}</span>
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-[#4ade80] backdrop-blur-md mb-4">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
            <span>{isCareers ? 'CAREERS AT CROWN DENTAL' : 'MEDICAL EXPERT COUNCIL'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
            {isCareers
              ? 'Gia Nhập Đội Ngũ Kiến Tạo Nụ Cười Chuẩn Quốc Tế'
              : 'Đội Ngũ Thạc Sĩ - Bác Sĩ Chuyên Khoa Đầu Ngành'}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
            {isCareers
              ? 'Môi trường làm việc y khoa chuyên nghiệp, trang thiết bị tân tiến và chế độ đãi ngộ hàng đầu trong ngành nha khoa tại Việt Nam.'
              : '100% bác sĩ tốt nghiệp các trường đại học y danh tiếng, tu nghiệp quốc tế chuyên sâu và trực tiếp khám điều trị 1-1 cho từng bệnh nhân.'}
          </p>
        </div>
      </section>

      {/* 2. Content Sections based on page */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
        {isCareers ? (
          /* ================= CAREERS PAGE ================= */
          <div className="space-y-16">
            {/* Why Work at Crown Dental */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Thu nhập vượt trội', desc: 'Lương cạnh tranh, thưởng KPIs và chế độ đãi ngộ bảo hiểm đầy đủ.', icon: Award },
                { title: 'Trang thiết bị hiện đại', desc: 'Làm việc với máy scan iTero 5D, CT Cone Beam và công nghệ nha khoa 4.0.', icon: Sparkles },
                { title: 'Đào tạo liên tục', desc: 'Tài trợ học bổng và các khóa học tu nghiệp nâng cao chứng chỉ trong & ngoài nước.', icon: GraduationCap },
                { title: 'Môi trường văn minh', desc: 'Đồng nghiệp thân thiện, tôn trọng chuyên môn và cơ hội thăng tiến rõ ràng.', icon: Users },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1f4fb2] flex items-center justify-center mb-4">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Job Openings List */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#00a859] rounded-full inline-block" />
                    Vị Trí Đang Tuyển Dụng
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Gửi hồ sơ ngay hôm nay để nhận phản hồi phỏng vấn sớm</p>
                </div>
              </div>

              <div className="grid gap-5">
                {CAREER_OPENINGS.map((job, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md hover:border-[#1f4fb2]/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-[#1f4fb2] bg-blue-50 px-2.5 py-1 rounded-md">
                          {job.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <MapPin size={11} /> {job.location}
                        </span>
                        <span className="text-[10px] font-bold text-[#00a859] bg-emerald-50 px-2.5 py-1 rounded-md">
                          {job.salary}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors">
                        {job.title}
                      </h3>

                      <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                        {job.desc}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <a
                        href="mailto:tuyendung@crown.vn?subject=Ứng tuyển vị trí: "
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white text-xs font-bold px-6 py-3 shadow-sm hover:scale-102 transition duration-200"
                      >
                        <span>Ứng tuyển ngay</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HR Contact Box */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00a859] flex items-center justify-center mx-auto">
                <Mail size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Chưa tìm thấy vị trí phù hợp?</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Hãy gửi hồ sơ CV của bạn tới phòng nhân sự Crown Dental qua email <strong className="text-[#1f4fb2]">tuyendung@crown.vn</strong> hoặc liên hệ hotline <strong className="text-[#00a859]">1900 8059</strong> để được lưu trữ và liên hệ ngay khi có nhu cầu.
              </p>
            </div>
          </div>
        ) : (
          /* ================= DOCTORS COUNCIL PAGE ================= */
          <div className="space-y-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-[#1f4fb2] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                100% Bác sĩ tu nghiệp quốc tế
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-3 leading-tight">
                Chuyên Môn Cao - Tận Tâm Phục Vụ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                Đội ngũ bác sĩ tại Crown Dental luôn đặt y đức lên hàng đầu, đảm bảo lập kế hoạch điều trị minh bạch, bảo tồn tối đa răng thật và đồng hành dài hạn cùng bệnh nhân.
              </p>
            </div>

            {/* Doctors Grid */}
            <div className="grid gap-8 md:grid-cols-2">
              {DOCTOR_COUNCIL.map((doc, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-xl hover:border-[#1f4fb2]/40 transition-all duration-300 flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="relative w-full sm:w-44 h-56 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=800'
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#00a859] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                        Hội Đồng Y Khoa
                      </span>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors mt-1.5 leading-snug">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-[#1f4fb2] font-bold mt-0.5">{doc.title}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                      <p className="flex items-start gap-1.5">
                        <GraduationCap size={15} className="text-[#1f4fb2] shrink-0 mt-0.5" />
                        <span>{doc.qualification}</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck size={15} className="text-[#00a859] shrink-0 mt-0.5" />
                        <span>{doc.experience}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 mb-1.5">Chuyên khoa mũi nhọn:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.specialties.map((spec, sIdx) => (
                          <span key={sIdx} className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#1f4fb2] hover:text-[#00a859] transition"
                      >
                        <span>Đặt lịch tư vấn trực tiếp</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Book Appointment CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] p-8 text-white text-center space-y-4 shadow-md max-w-2xl mx-auto">
              <h3 className="text-2xl font-black">Khám & Chụp Phim 3D Trực Tiếp Cùng Chuyên Gia</h3>
              <p className="text-xs text-blue-100 font-medium leading-relaxed">
                Đăng ký ngay hôm nay để nhận suất khám miễn phí và tư vấn phác đồ điều trị cá nhân hóa từ các bác sĩ đầu ngành.
              </p>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#1f4fb2] hover:bg-blue-50 px-7 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition"
                >
                  <Calendar size={15} />
                  <span>Đăng ký lịch khám ngay</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
