import { Link, useParams } from 'react-router-dom'

// ── Full article data (reuse IDs from Knowledge.jsx) ─────────────────────────
const ARTICLES_DETAIL = {
  1: {
    date: '29/06/2025',
    category: 'Tẩy trắng răng',
    title: 'Tẩy trắng răng giá bao nhiêu tiền? Bảng giá tẩy trắng răng tại nha khoa mới nhất 2025',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80',
    author: 'BS. Nguyễn Minh Trí',
    content: [
      { type: 'lead', text: 'Sở hữu một nụ cười tỏa sáng là vốn ước mơ của rất nhiều người. Chính vì vậy hiện nay có rất nhiều người muốn tìm hiểu về dịch vụ tẩy trắng răng tại nha khoa.' },
      { type: 'h2', text: 'Tẩy trắng răng là gì?' },
      { type: 'p', text: 'Tẩy trắng răng là phương pháp sử dụng các hoạt chất (thường là hydrogen peroxide hoặc carbamide peroxide) để phân giải các phân tử màu bám trên men răng và ngà răng, giúp răng trở nên sáng hơn.' },
      { type: 'h2', text: 'Các phương pháp tẩy trắng răng phổ biến' },
      { type: 'p', text: 'Hiện nay có nhiều phương pháp tẩy trắng răng, mỗi phương pháp có ưu nhược điểm và mức giá khác nhau:' },
      { type: 'list', items: ['Tẩy trắng răng bằng đèn Plasma / Laser – hiệu quả nhanh, an toàn, phù hợp cho người bận rộn.', 'Tẩy trắng răng bằng máng – thực hiện tại nhà, tiết kiệm chi phí, kết quả từ từ.', 'Tẩy trắng răng bằng bút gel – tiện lợi, dùng hàng ngày nhưng hiệu quả thấp hơn.'] },
      { type: 'h2', text: 'Bảng giá tẩy trắng răng tại Crown Dental 2025' },
      { type: 'table', headers: ['Phương pháp', 'Thời gian', 'Mức giá'], rows: [['Tẩy trắng đèn Plasma', '60 – 90 phút', '1.500.000 – 2.500.000đ'], ['Tẩy trắng đèn Laser', '60 – 90 phút', '2.000.000 – 3.500.000đ'], ['Tẩy trắng máng tại nhà', '2 – 4 tuần', '800.000 – 1.500.000đ']] },
      { type: 'p', text: 'Lưu ý: Mức giá có thể thay đổi tùy theo tình trạng răng miệng và phòng khám cụ thể. Nên đến thăm khám trực tiếp để nhận báo giá chính xác nhất.' },
      { type: 'h2', text: 'Những ai không nên tẩy trắng răng?' },
      { type: 'list', items: ['Trẻ em dưới 16 tuổi.', 'Phụ nữ mang thai hoặc đang cho con bú.', 'Người có men răng mỏng hoặc răng quá nhạy cảm.', 'Người đang có vấn đề về nướu hoặc sâu răng chưa điều trị.'] },
    ],
  },
  2: {
    date: '24/06/2025',
    category: 'Nhổ răng khôn',
    title: 'Nhổ răng khôn kiêng ăn gì? Những loại thức ăn phải tránh xa',
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80',
    author: 'BS. Lê Thị Hoa',
    content: [
      { type: 'lead', text: 'Sau nhổ răng khôn nên ăn gì và kiêng gì để nhanh lành? Nha Khoa Crown chia sẻ chế độ ăn uống khoa học sau khi nhổ răng khôn giúp vết thương mau hồi phục.' },
      { type: 'h2', text: 'Tại sao phải kiêng ăn sau nhổ răng khôn?' },
      { type: 'p', text: 'Sau khi nhổ răng khôn, vết thương cần thời gian để hình thành cục máu đông giúp bảo vệ xương và dây thần kinh bên dưới. Ăn sai loại thức ăn có thể làm tan cục máu đông, gây biến chứng "ổ răng khô" rất đau.' },
      { type: 'h2', text: 'Những thức ăn nên tránh' },
      { type: 'list', items: ['Thức ăn cứng, giòn: bánh mì nướng, hạt, đá viên.', 'Thức ăn dính: kẹo cao su, caramel, gạo nếp.', 'Thức ăn cay nóng: ớt, tiêu, thức ăn nóng bỏng.', 'Đồ uống có ga và cồn: bia, rượu, nước ngọt có ga.', 'Hút thuốc lá trong ít nhất 72 giờ đầu.'] },
      { type: 'h2', text: 'Nên ăn gì sau nhổ răng khôn?' },
      { type: 'list', items: ['Cháo, súp loãng nguội.', 'Sữa chua, sinh tố không hạt.', 'Trứng hấp, đậu phụ mềm.', 'Rau luộc mềm, thịt hầm nhỏ.'] },
    ],
  },
  3: {
    date: '23/06/2025',
    category: 'Nha khoa trẻ em',
    title: 'Răng mọc lẫy ở trẻ em là gì? Tác hại khi răng trẻ mọc lẫy',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80',
    author: 'BS. Trần Văn Hùng',
    content: [
      { type: 'lead', text: 'Răng mọc lẫy hay còn gọi là răng mọc không đúng vị trí là hiện tượng phổ biến ở trẻ. Tình trạng này có thể ảnh hưởng đến thẩm mỹ và chức năng nhai của trẻ.' },
      { type: 'h2', text: 'Răng mọc lẫy là gì?' },
      { type: 'p', text: 'Răng mọc lẫy (hay còn gọi là răng mọc chen chúc) là hiện tượng răng vĩnh viễn mọc ra nhưng không đúng vị trí vì răng sữa chưa rụng hoặc không đủ chỗ trên cung hàm.' },
      { type: 'h2', text: 'Nguyên nhân khiến răng mọc lẫy' },
      { type: 'list', items: ['Răng sữa chưa rụng khi răng vĩnh viễn đã mọc.', 'Cung hàm nhỏ, không đủ chỗ cho răng vĩnh viễn.', 'Thói quen xấu: mút ngón tay, đẩy lưỡi vào răng.', 'Di truyền từ cha mẹ.'] },
      { type: 'h2', text: 'Tác hại của răng mọc lẫy' },
      { type: 'list', items: ['Mất thẩm mỹ, ảnh hưởng nụ cười và sự tự tin.', 'Khó vệ sinh răng miệng, dễ bị sâu răng và viêm nướu.', 'Ảnh hưởng chức năng nhai và phát âm.', 'Gây đau khớp thái dương hàm lâu dài.'] },
      { type: 'h2', text: 'Khi nào nên đưa trẻ đến nha khoa?' },
      { type: 'p', text: 'Cha mẹ nên đưa trẻ đến khám khi thấy dấu hiệu răng chen chúc từ 6-7 tuổi. Can thiệp sớm giúp nắn chỉnh dễ dàng hơn và tiết kiệm chi phí.' },
    ],
  },
}

// Fallback article for IDs not in detail map
const FALLBACK = {
  date: '15/06/2025',
  category: 'Sức khỏe răng miệng',
  title: 'Kiến thức nha khoa bổ ích từ chuyên gia Crown Dental',
  image: 'https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&w=900&q=80',
  author: 'BS. Crown Dental',
  content: [
    { type: 'lead', text: 'Nha khoa Crown chia sẻ những kiến thức bổ ích về sức khỏe răng miệng giúp bạn và gia đình có nụ cười khỏe đẹp mỗi ngày.' },
    { type: 'h2', text: 'Chăm sóc răng miệng đúng cách' },
    { type: 'p', text: 'Việc chăm sóc răng miệng đúng cách là nền tảng cho sức khỏe toàn diện. Hãy duy trì thói quen chải răng đều đặn, dùng chỉ nha khoa và thăm khám định kỳ 6 tháng/lần.' },
  ],
}

const SIDEBAR_ARTICLES = [
  { id: 1, date: '29/06/2025', title: 'Tẩy trắng răng giá bao nhiêu tiền? Bảng giá mới nhất 2025', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=80&q=80' },
  { id: 2, date: '24/06/2025', title: 'Nhổ răng khôn kiêng ăn gì? Những loại thức ăn phải tránh xa', image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=80&q=80' },
  { id: 3, date: '23/06/2025', title: 'Răng mọc lẫy ở trẻ em là gì? Tác hại khi răng trẻ mọc lẫy', image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=80&q=80' },
  { id: 4, date: '22/06/2025', title: 'Cập nhật bảng giá răng sứ chi tiết mới nhất 2025', image: 'https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&w=80&q=80' },
  { id: 5, date: '22/06/2025', title: 'Cười hở lợi: Dấu hiệu, nguyên nhân và cách điều trị', image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=80&q=80' },
]

// ── Content renderer ─────────────────────────────────────────────────────────
function RenderContent({ blocks }) {
  return (
    <div className="prose-custom">
      {blocks.map((block, i) => {
        if (block.type === 'lead')
          return <p key={i} className="text-[16px] leading-8 text-slate-700 font-medium mb-5 border-l-4 border-[#1f4fb2] pl-4 bg-blue-50/50 py-3 rounded-r-lg">{block.text}</p>
        if (block.type === 'h2')
          return <h2 key={i} className="text-[18px] font-black text-[#132c6b] mt-8 mb-3 pb-2 border-b border-slate-100">{block.text}</h2>
        if (block.type === 'p')
          return <p key={i} className="text-[15px] leading-8 text-slate-600 mb-4">{block.text}</p>
        if (block.type === 'list')
          return (
            <ul key={i} className="mb-4 space-y-2 pl-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-[14px] text-slate-600 leading-relaxed">
                  <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#1f4fb2]" />
                  {item}
                </li>
              ))}
            </ul>
          )
        if (block.type === 'table')
          return (
            <div key={i} className="mb-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#132c6b] text-white">
                  <tr>
                    {block.headers.map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-[13px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={['px-4 py-3 text-slate-700', ci === 2 ? 'font-bold text-[#e85d04]' : ''].join(' ')}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        return null
      })}
    </div>
  )
}

// ── Sidebar card ─────────────────────────────────────────────────────────────
function SidebarCard({ article }) {
  return (
    <Link
      to={`/knowledge/${article.id}`}
      className="flex gap-3 items-start group border-b border-slate-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
    >
      <div className="flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden bg-slate-100">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#132c6b] leading-snug line-clamp-2 group-hover:text-[#1f4fb2] transition-colors">{article.title}</p>
        <p className="text-[11px] text-slate-400 mt-1">{article.date}</p>
      </div>
    </Link>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function KnowledgeDetail() {
  const { id } = useParams()
  const article = ARTICLES_DETAIL[Number(id)] || FALLBACK

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#f4f7fb] border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-[#1f4fb2] transition-colors flex-shrink-0">Trang chủ</Link>
          <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/knowledge" className="hover:text-[#1f4fb2] transition-colors flex-shrink-0">Kiến Thức Nha Khoa</Link>
          <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1f4fb2] font-semibold line-clamp-1">{article.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">

          {/* ── Article body ── */}
          <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Hero image */}
            <div className="h-72 overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>

            <div className="p-6 lg:p-8">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-block bg-[#edf4ff] text-[#1f4fb2] text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  {article.category}
                </span>
                <span className="text-xs text-slate-400">{article.date}</span>
                <span className="text-xs text-slate-400">· Bởi {article.author}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-black text-[#132c6b] leading-snug mb-6">
                {article.title}
              </h1>

              {/* Content */}
              <RenderContent blocks={article.content} />

              {/* CTA bar */}
              <div className="mt-8 rounded-xl bg-gradient-to-r from-[#132c6b] to-[#1f4fb2] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-white">
                  <p className="font-black text-sm">Cần tư vấn thêm?</p>
                  <p className="text-blue-200 text-xs mt-0.5">Đặt lịch khám ngay hôm nay – miễn phí tư vấn ban đầu.</p>
                </div>
                <Link
                  to="/contact"
                  className="flex-shrink-0 bg-[#00a859] hover:bg-[#00954d] transition-colors text-white text-sm font-bold px-6 py-2.5 rounded-full"
                >
                  Đặt lịch ngay
                </Link>
              </div>

              {/* Back link */}
              <div className="mt-6 flex items-center gap-2">
                <Link to="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-[#1f4fb2] font-semibold hover:underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại danh sách bài viết
                </Link>
              </div>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-black text-[#132c6b] mb-4 pb-2 border-b-2 border-[#132c6b] inline-block">
                Bài viết liên quan
              </h2>
              {SIDEBAR_ARTICLES.filter((a) => a.id !== Number(id)).map((article) => (
                <SidebarCard key={article.id} article={article} />
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#132c6b] to-[#1f4fb2] p-6 text-white text-center shadow-md">
              <div className="text-3xl mb-3">🦷</div>
              <h3 className="font-black text-lg leading-snug mb-2">Đặt lịch khám miễn phí</h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">Gặp bác sĩ Crown và nhận tư vấn cá nhân hoá cho nụ cười của bạn.</p>
              <Link to="/contact" className="inline-block bg-[#00a859] hover:bg-[#00954d] transition-colors text-white text-sm font-bold px-6 py-2.5 rounded-full">
                Đặt lịch ngay
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Hotline tư vấn</p>
              <a href="tel:19008059" className="text-2xl font-black text-[#1f4fb2] hover:text-[#0f3a9e] transition-colors block">1900 8059</a>
              <p className="text-[11px] text-slate-400 mt-1">Thứ 2 – Chủ nhật: 8:30 – 19:30</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
