import { Link } from 'react-router-dom'

// ── Breadcrumb ──────────────────────────────────────────────────────────────
function Breadcrumb() {
  return (
    <div className="bg-[#f4f7fb] border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-[#1f4fb2] transition-colors">Trang chủ</Link>
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[#1f4fb2] font-semibold">Giới thiệu</span>
      </div>
    </div>
  )
}

// ── Section 1: Intro ────────────────────────────────────────────────────────
function SectionIntro() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-[#132c6b] leading-snug">
            Giới thiệu nha khoa Crown
            <span className="block text-[#1f4fb2]">Người bạn trọn đời</span>
          </h1>
          <p className="mt-5 text-[15px] leading-8 text-slate-600">
            Nha khoa Crown là một hệ thống nha khoa chuyên sâu, cam kết chuẩn phòng khám nước
            ngoài, đạt nhiều danh hiệu về chăm sóc sức khoẻ răng miệng. Chuyên sâu về niềng
            răng, trồng răng Implant, liệu pháp sứ với triết lý điều trị toàn diện – lấy trải
            nghiệm khách hàng làm trung tâm hàng đầu.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            {[
              { num: '27+', label: 'Chi nhánh toàn quốc' },
              { num: '150k+', label: 'Khách hàng tin tưởng' },
              { num: '20+', label: 'Năm kinh nghiệm' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-[#1f4fb2]">{stat.num}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-2xl overflow-hidden h-56 bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80"
              alt="Đội ngũ nha khoa Crown"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-2xl overflow-hidden h-40 bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?auto=format&fit=crop&w=400&q=80"
              alt="Phòng khám Crown"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-2xl overflow-hidden h-40 bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=400&q=80"
              alt="Tư vấn nha khoa"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#132c6b] text-white text-[10px] font-bold py-1.5 px-5 rounded-full shadow-lg uppercase tracking-widest whitespace-nowrap">
            Red Diamond Provider 2024
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 2: Awards ───────────────────────────────────────────────────────
function SectionAwards() {
  return (
    <section className="bg-[#f4f7fb] py-16 mt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg h-72">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=700&q=80"
              alt="Giải thưởng Red Diamond Provider 2024"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="inline-block bg-[#f04a00] text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Đạt hạng
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-[#132c6b] leading-snug">
              Red Diamond Provider 2024 –<br />
              <span className="text-[#e85d04]">Hàng đầu châu Á</span>
            </h2>
            <p className="mt-4 text-[15px] leading-8 text-slate-600">
              Nha khoa Crown đạt danh hiệu Red Diamond Provider – danh hiệu cao nhất trong hệ
              thống đánh giá toàn cầu của Straumann Group, chứng tỏ kỹ thuật chuyên sâu và
              năng lực điều trị implant đỉnh cao tại khu vực.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                'Top 100 phòng khám uy tín Đông Nam Á',
                'Đạt chuẩn ISO 9001:2015 trong quản lý chất lượng',
                'Được hơn 150.000 khách hàng tin tưởng',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#00a859] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 3: Digital ──────────────────────────────────────────────────────
function SectionDigital() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-[#132c6b] leading-snug">
            Đi đầu về số hóa nha khoa
          </h2>
          <p className="mt-5 text-[15px] leading-8 text-slate-600">
            Với sứ mệnh kiến tạo nền chăm sóc răng miệng tiên tiến, Crown là hệ thống nha khoa
            tiên phong ứng dụng công nghệ số hoá toàn diện, từ hồ sơ bệnh nhân điện tử đến
            kế hoạch điều trị bằng AI và phần mềm CAD/CAM nhập từ Mỹ và các nước tiên tiến.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: '🤖', title: 'AI X-Ray phân tích', desc: 'Chẩn đoán hình ảnh tự động' },
              { icon: '🦷', title: 'CAD/CAM 3D', desc: 'Phục hình sứ chỉ trong 1 ngày' },
              { icon: '📋', title: 'Hồ sơ điện tử', desc: 'Quản lý toàn diện 100%' },
              { icon: '💡', title: 'Điều trị cá nhân hoá', desc: 'Phác đồ riêng từng bệnh nhân' },
            ].map((item) => (
              <div key={item.title} className="bg-[#f4f7fb] rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-bold text-[#132c6b]">{item.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg h-96">
          <img
            src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=700&q=80"
            alt="Công nghệ số hóa nha khoa"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

// ── Section 4: Philosophy ───────────────────────────────────────────────────
function SectionPhilosophy() {
  return (
    <section className="bg-[#f4f7fb] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-lg h-96">
            <img
              src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=700&q=80"
              alt="Triết lý chăm sóc nụ cười"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow">
              <p className="text-[11px] font-black text-[#1f4fb2] uppercase tracking-widest">Tiêu chí điều trị</p>
              <p className="text-sm font-semibold text-[#132c6b] mt-1">An toàn · Thẩm mỹ · Bền vững</p>
            </div>
          </div>
          <div>
            <span className="inline-block text-[11px] font-black text-[#1f4fb2] uppercase tracking-widest border-l-4 border-[#1f4fb2] pl-3 mb-4">
              Triết lý
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-[#132c6b] leading-snug">
              Chăm sóc nụ cười khỏe đẹp từ gốc
            </h2>
            <p className="mt-5 text-[15px] leading-8 text-slate-600">
              Với vị trí thương hiệu nha khoa đứng đầu Việt Nam, chúng tôi mang đến những giải
              pháp từ nha khoa đến các phương pháp tiên tiến nhất, đảm bảo mỗi nụ cười không chỉ
              đẹp về mặt thẩm mỹ mà còn khoẻ mạnh từ nền tảng sâu bên trong.
            </p>
            <div className="mt-7 space-y-4">
              {[
                { color: '#1f4fb2', title: 'Chẩn đoán toàn diện', desc: 'Đánh giá 360° tình trạng răng miệng trước mỗi liệu trình.' },
                { color: '#00a859', title: 'Điều trị từ gốc rễ', desc: 'Không chỉ khắc phục triệu chứng mà xử lý nguyên nhân sâu xa.' },
                { color: '#e85d04', title: 'Đồng hành lâu dài', desc: 'Chương trình chăm sóc sau điều trị và tái khám định kỳ miễn phí.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <span className="mt-1.5 flex-shrink-0 w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <div>
                    <div className="font-bold text-[#132c6b] text-sm">{item.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 5: Core Values ──────────────────────────────────────────────────
const coreValues = [
  { num: '1', title: 'TRẢI NGHIỆM KHÁCH HÀNG — CUSTOMER EXPERIENCE', desc: 'Đặt khách hàng làm trọng tâm trong mọi quyết định và hành động của tổ chức.' },
  { num: '2', title: 'CHẤT LƯỢNG DỊCH VỤ — ELITE SERVICE QUALITY', desc: 'Không ngừng cải tiến, chuẩn hóa quy trình và nâng cao tay nghề bác sĩ.' },
  { num: '3', title: 'AN TOÀN VỆ SINH — CLEANLINESS & SAFETY', desc: 'Tiêu chuẩn vệ sinh vô trùng tuyệt đối trong từng ca điều trị.' },
  { num: '4', title: 'THIẾU HỤT QUAN TÂM — COMPASSIONATE CARE', desc: 'Lắng nghe, thấu hiểu và đồng cảm với từng nhu cầu của khách hàng.' },
  { num: '5', title: 'HƯỚNG DẪN CỘNG ĐỒNG — COMMUNITY COMMITMENT', desc: 'Chia sẻ kiến thức nha khoa, đóng góp tích cực cho cộng đồng địa phương.' },
]

function SectionCoreValues() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-14 items-start">
        <div>
          <span className="inline-block text-[11px] font-black text-[#1f4fb2] uppercase tracking-widest border-l-4 border-[#1f4fb2] pl-3 mb-4">
            Cam kết
          </span>
          <h2 className="text-2xl lg:text-3xl font-black text-[#132c6b] leading-snug">
            Giá trị cốt lõi
          </h2>
          <p className="mt-5 text-[15px] leading-8 text-slate-600">
            Crown luôn đặt sự chuẩn mực trong mỗi tổ chức với triết lý quan tâm tới khách hàng
            và cộng đồng từ tận tâm, chú tâm với từng khách hàng cũng như mỗi chi nhánh.
          </p>
          <div className="mt-8 rounded-2xl overflow-hidden shadow-md h-56">
            <img
              src="https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&w=600&q=80"
              alt="Giá trị cốt lõi Crown Dental"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {coreValues.map((item) => (
            <div key={item.num} className="flex items-start gap-5 py-5 group">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#132c6b] text-white flex items-center justify-center text-base font-black group-hover:bg-[#1f4fb2] transition-colors">
                {item.num}
              </span>
              <div>
                <div className="text-[11px] font-black text-[#1f4fb2] uppercase tracking-widest leading-tight">
                  {item.title}
                </div>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section 6: 5C Commitments ───────────────────────────────────────────────
const commitments5C = [
  { title: 'CHUYÊN NGHIỆP — COMPETENCE', desc: 'Đội ngũ bác sĩ đào tạo bài bản, chứng chỉ quốc tế, cập nhật kỹ thuật mới nhất.' },
  { title: 'CHẤT LƯỢNG — CARE QUALITY', desc: 'Vật liệu nhập khẩu cao cấp, quy trình điều trị đạt chuẩn quốc tế.' },
  { title: 'CAM KẾT — COMMITMENT', desc: 'Bảo hành minh bạch, hỗ trợ sau điều trị tận tình và chu đáo.' },
  { title: 'CÔNG NGHỆ — CUTTING-EDGE TECHNOLOGY', desc: 'Ứng dụng công nghệ tiên tiến nhất trong chẩn đoán và điều trị.' },
  { title: 'CỘNG ĐỒNG — COMMUNITY', desc: 'Trách nhiệm xã hội, lan toả kiến thức chăm sóc răng miệng đúng cách.' },
]

function Section5C() {
  return (
    <section className="bg-[#132c6b] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-14 items-start">
          <div>
            <span className="inline-block text-[11px] font-black text-[#00a859] uppercase tracking-widest border-l-4 border-[#00a859] pl-3 mb-4">
              Chuẩn mực
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white leading-snug">
              Cam kết tiêu chuẩn 5C
            </h2>
            <p className="mt-5 text-[15px] leading-8 text-slate-300">
              Crown mang đến kỳ vọng vượt trội. Crown luôn mang đến dịch vụ nha khoa theo tiêu
              chuẩn quốc tế và luôn đặt sự an toàn, hài lòng của khách hàng lên hàng đầu.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center gap-2 bg-[#00a859] hover:bg-[#00954d] transition-colors text-white text-sm font-bold px-7 py-3 rounded-full"
            >
              Đặt lịch tư vấn miễn phí
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-slate-600/40">
            {commitments5C.map((item, idx) => (
              <div key={idx} className="flex items-start gap-5 py-5 group">
                <span className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-[#00a859] text-[#00a859] flex items-center justify-center text-base font-black group-hover:bg-[#00a859] group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-[11px] font-black text-[#00a859] uppercase tracking-widest leading-tight">
                    {item.title}
                  </div>
                  <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function About() {
  return (
    <>
      <Breadcrumb />
      <SectionIntro />
      <SectionAwards />
      <SectionDigital />
      <SectionPhilosophy />
      <SectionCoreValues />
      <Section5C />
    </>
  )
}
