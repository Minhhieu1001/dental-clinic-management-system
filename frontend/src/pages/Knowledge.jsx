import { useState } from 'react'
import { Link } from 'react-router-dom'

// ── Mock data ────────────────────────────────────────────────────────────────
const ARTICLES = [
  {
    id: 1,
    date: '29/06/2025',
    title: 'Tẩy trắng răng giá bao nhiêu tiền? Bảng giá tẩy trắng răng tại nha khoa mới nhất 2025',
    excerpt: 'Sở hữu một nụ cười tỏa sáng là vốn ước mơ của rất nhiều người. Chính vì vậy hiện nay có rất nhiều người muốn tìm hiểu về dịch vụ tẩy trắng răng tại nha khoa. Hãy cùng Crown tìm hiểu bảng giá chi tiết nhất...',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=300&q=80',
    category: 'Tẩy trắng răng',
  },
  {
    id: 2,
    date: '24/06/2025',
    title: 'Nhổ răng khôn kiêng ăn gì? Những loại thức ăn phải tránh xa',
    excerpt: 'Sau nhổ răng khôn nên ăn gì và kiêng gì để nhanh lành? Nha Khoa Crown chia sẻ chế độ ăn uống khoa học sau khi nhổ răng khôn giúp vết thương mau hồi phục và giảm đau hiệu quả...',
    image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=300&q=80',
    category: 'Nhổ răng khôn',
  },
  {
    id: 3,
    date: '23/06/2025',
    title: 'Răng mọc lẫy ở trẻ em là gì? Tác hại khi răng trẻ mọc lẫy',
    excerpt: 'Răng mọc lẫy hay còn gọi là răng mọc không đúng vị trí là hiện tượng phổ biến ở trẻ. Hiện tượng này được gọi là răng mọc lẫy. Tình trạng này có thể ảnh hưởng đến thẩm mỹ và chức năng nhai...',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=300&q=80',
    category: 'Nha khoa trẻ em',
  },
  {
    id: 4,
    date: '22/06/2025',
    title: 'Cập nhật bảng giá răng sứ chi tiết mới nhất 2025',
    excerpt: 'Răng sứ là một loại răng thẩm mỹ được chế tác từ sứ (ceramic) hoặc kết hợp giữa sứ và kim loại, dùng để phục hình răng đã mài hoặc bị mất. Bảng giá mới nhất cập nhật năm 2025...',
    image: 'https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&w=300&q=80',
    category: 'Răng sứ',
  },
  {
    id: 5,
    date: '22/06/2025',
    title: 'Cười hở lợi: Dấu hiệu, nguyên nhân và cách điều trị tại nha khoa',
    excerpt: 'Biểu hiện của cười hở lợi là tình trạng khi cười, phần nướu ở hàm trên bị lộ ra nhiều hơn mức bình thường so với tiêu chuẩn thẩm mỹ. Đây là tình trạng có thể điều trị hiệu quả...',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=300&q=80',
    category: 'Thẩm mỹ nha khoa',
  },
  {
    id: 6,
    date: '20/06/2025',
    title: 'Niềng răng Invisalign là gì? Quy trình và chi phí niềng răng 2025',
    excerpt: 'Niềng răng Invisalign là phương pháp chỉnh nha hiện đại sử dụng khay trong suốt thay thế cho mắc cài truyền thống. Phương pháp này ngày càng được ưa chuộng nhờ tính thẩm mỹ cao...',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=300&q=80',
    category: 'Niềng răng',
  },
  {
    id: 7,
    date: '18/06/2025',
    title: 'Trồng răng Implant có đau không? Những điều cần biết trước khi thực hiện',
    excerpt: 'Cấy ghép Implant là giải pháp phục hình răng mất tối ưu nhất hiện nay. Nhiều bệnh nhân thắc mắc liệu quá trình này có đau không và cần chuẩn bị gì trước khi thực hiện...',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
    category: 'Implant',
  },
  {
    id: 8,
    date: '15/06/2025',
    title: 'Sâu răng: Nguyên nhân, dấu hiệu và cách phòng ngừa hiệu quả',
    excerpt: 'Sâu răng là một trong những bệnh lý răng miệng phổ biến nhất. Hiểu rõ nguyên nhân và cách phòng ngừa sẽ giúp bạn bảo vệ sức khỏe răng miệng lâu dài cho cả gia đình...',
    image: 'https://images.unsplash.com/photo-1533228896864-42b243384210?auto=format&fit=crop&w=300&q=80',
    category: 'Sức khỏe răng miệng',
  },
]

const SIDEBAR_ARTICLES = [
  {
    id: 101,
    date: '01/06/2025',
    title: 'Giá niềng răng bao nhiêu tiền? Bảng giá niềng răng chi tiết 2025',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 102,
    date: '01/01/2025',
    title: 'Niềng răng Invisalign giá bao nhiêu? Bảng giá niềng răng Invisalign chi tiết...',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 103,
    date: '01/01/2025',
    title: 'Trồng răng implant giá bao nhiêu? Bảng giá cấy ghép implant chi tiết 2025',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 104,
    date: '01/01/2025',
    title: 'Niềng răng mắc cài kim loại giá bao nhiêu? Bảng giá chi tiết 2025',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 105,
    date: '15/05/2025',
    title: 'Top 5 địa chỉ niềng răng uy tín Quận 7',
    image: 'https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?auto=format&fit=crop&w=80&q=80',
  },
]

const CATEGORIES = [
  'Tất cả',
  'Niềng răng',
  'Implant',
  'Răng sứ',
  'Tẩy trắng răng',
  'Nhổ răng khôn',
  'Nha khoa trẻ em',
  'Thẩm mỹ nha khoa',
  'Sức khỏe răng miệng',
]

const ITEMS_PER_PAGE = 5
const TOTAL_PAGES = 103

// ── Article Card (horizontal layout) ────────────────────────────────────────
function ArticleCard({ article }) {
  return (
    <article className="flex gap-5 border-b border-slate-100 pb-7 mb-7 last:border-b-0 last:mb-0 last:pb-0 group">
      {/* Thumbnail */}
      <Link
        to={`/knowledge/${article.id}`}
        className="flex-shrink-0 w-[200px] h-[145px] rounded-xl overflow-hidden bg-slate-100 block"
      >
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-1.5">{article.date}</p>
        <Link to={`/knowledge/${article.id}`}>
          <h2 className="text-[15px] font-extrabold text-[#132c6b] leading-snug line-clamp-2 hover:text-[#1f4fb2] transition-colors">
            {article.title}
          </h2>
        </Link>
        <p className="mt-2 text-[13px] text-slate-500 leading-relaxed line-clamp-3">
          {article.excerpt}
        </p>
        <Link
          to={`/knowledge/${article.id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1f4fb2] hover:text-[#0f3a9e] transition-colors"
        >
          Xem chi tiết
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

// ── Sidebar article card ─────────────────────────────────────────────────────
function SidebarCard({ article }) {
  return (
    <Link
      to={`/knowledge/${article.id}`}
      className="flex gap-3 items-start group border-b border-slate-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
    >
      <div className="flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden bg-slate-100">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#132c6b] leading-snug line-clamp-2 group-hover:text-[#1f4fb2] transition-colors">
          {article.title}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">{article.date}</p>
      </div>
    </Link>
  )
}

// ── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPages = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    // Always show: 1, 2, 3, 4, ..., totalPages-2, totalPages-1, totalPages
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, '...', totalPages - 2, totalPages - 1, totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, 2, 3, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }

  const pages = getPages()

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={[
              'w-9 h-9 rounded-full text-sm font-bold transition-colors',
              currentPage === page
                ? 'bg-[#132c6b] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {page}
          </button>
        )
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Knowledge() {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const filtered =
    activeCategory === 'Tất cả'
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory)

  // Paginate client-side (simulate server)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const pageArticles = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#f4f7fb] border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#1f4fb2] transition-colors">Trang chủ</Link>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1f4fb2] font-semibold">Kiến Thức Nha Khoa</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setCurrentPage(1) }}
              className={[
                'px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer',
                activeCategory === cat
                    ? 'bg-[#132c6b] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1f4fb2] hover:text-[#1f4fb2]',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          {/* ── Main feed ── */}
          <div>
            <h1 className="text-xl font-black text-[#132c6b] mb-6 pb-3 border-b-2 border-[#132c6b] inline-block">
              Kiến Thức Nha Khoa
            </h1>

            {pageArticles.length > 0 ? (
              <>
                {pageArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.min(TOTAL_PAGES, Math.ceil((filtered.length || TOTAL_PAGES) / ITEMS_PER_PAGE))}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <p className="text-slate-500 text-sm">Không có bài viết nào trong danh mục này.</p>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Tin nổi bật */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-base font-black text-[#132c6b] mb-4 pb-2 border-b-2 border-[#132c6b] inline-block">
                Tin nổi bật
              </h2>
              <div>
                {SIDEBAR_ARTICLES.map((article) => (
                  <SidebarCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* CTA box */}
            <div className="rounded-2xl bg-gradient-to-br from-[#132c6b] to-[#1f4fb2] p-6 text-white text-center shadow-md">
              <div className="text-3xl mb-3">🦷</div>
              <h3 className="font-black text-lg leading-snug mb-2">Đặt lịch khám miễn phí</h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                Gặp bác sĩ Crown và nhận tư vấn cá nhân hoá cho nụ cười của bạn.
              </p>
              <Link
                to="/contact"
                className="inline-block bg-[#00a859] hover:bg-[#00954d] transition-colors text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs"
              >
                Đặt lịch ngay
              </Link>
            </div>

            {/* Hotline box */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Hotline tư vấn</p>
              <a
                href="tel:19008059"
                className="text-2xl font-black text-[#1f4fb2] hover:text-[#0f3a9e] transition-colors block"
              >
                1900 8059
              </a>
              <p className="text-[11px] text-slate-400 mt-1">Thứ 2 – Chủ nhật: 8:30 – 19:30</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
