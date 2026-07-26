import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getServices } from '../services/api'

// ── Fallback Static Data (Dữ liệu dự phòng khi API lỗi hoặc chưa nạp) ───────────────────────────
const FALLBACK_PRICING_DATA = {
  NIENG_RANG: {
    label: 'Niềng răng',
    icon: '🔧',
    intro: 'Chỉnh nha tại Crown sử dụng phác đồ cá nhân hoá, công nghệ lên kế hoạch 3D và vật liệu nhập khẩu chính hãng.',
    image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    groups: [
      {
        name: 'Niềng răng mắc cài kim loại',
        rows: [
          { serviceName: 'Mắc cài kim loại tiêu chuẩn', unit: 'Cả 2 hàm', price: 25000000, description: 'Bao gồm toàn bộ quá trình' },
          { serviceName: 'Mắc cài kim loại tự buộc (Damon)', unit: 'Cả 2 hàm', price: 35000000, description: 'Giảm ma sát, rút ngắn thời gian' },
          { serviceName: 'Mắc cài kim loại chỉnh nha trẻ em', unit: 'Cả 2 hàm', price: 20000000, description: 'Dành cho trẻ 8–14 tuổi' },
        ],
      },
      {
        name: 'Niềng răng mắc cài sứ',
        rows: [
          { serviceName: 'Mắc cài sứ thường', unit: 'Cả 2 hàm', price: 32000000, description: 'Thẩm mỹ cao, màu sắc tự nhiên' },
          { serviceName: 'Mắc cài sứ tự buộc', unit: 'Cả 2 hàm', price: 42000000, description: 'Công nghệ Damon sứ' },
        ],
      },
      {
        name: 'Niềng răng trong suốt Invisalign',
        rows: [
          { serviceName: 'Invisalign Lite (≤14 khay)', unit: 'Cả 2 hàm', price: 55000000, description: 'Phù hợp răng lệch nhẹ' },
          { serviceName: 'Invisalign Moderate', unit: 'Cả 2 hàm', price: 70000000, description: 'Phổ biến nhất' },
          { serviceName: 'Invisalign Full (không giới hạn khay)', unit: 'Cả 2 hàm', price: 95000000, description: 'Phức tạp, tái niềng' },
        ],
      },
    ],
  },
  RANG_SU: {
    label: 'Răng sứ',
    icon: '✨',
    intro: 'Phục hình sứ tại Crown sử dụng công nghệ CAD/CAM, chế tác trong ngày với vật liệu sứ cao cấp e.max, Zirconia nguyên khối.',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    groups: [
      {
        name: 'Răng sứ kim loại',
        rows: [
          { serviceName: 'Sứ kim loại thường', unit: '/răng', price: 2000000, description: 'Kim loại thường' },
          { serviceName: 'Sứ kim loại Titan', unit: '/răng', price: 3500000, description: 'Titan sinh học cao cấp' },
        ],
      },
      {
        name: 'Răng sứ toàn sứ (Ceramic)',
        rows: [
          { serviceName: 'Sứ Cercon (Đức)', unit: '/răng', price: 6500000, description: 'Bền, thẩm mỹ cao' },
          { serviceName: 'Sứ e.max (Thụy Sĩ)', unit: '/răng', price: 8500000, description: 'Trong suốt, tự nhiên nhất' },
          { serviceName: 'Sứ Zirconia nguyên khối', unit: '/răng', price: 7000000, description: 'Chịu lực tốt, không bọc kim' },
        ],
      },
      {
        name: 'Răng Veneer thẩm mỹ',
        rows: [
          { serviceName: 'Veneer Composite', unit: '/răng', price: 3000000, description: 'Thực hiện tại ghế, nhanh' },
          { serviceName: 'Veneer sứ e.max', unit: '/răng', price: 9000000, description: 'Mỏng 0.3–0.5mm, không mài răng' },
        ],
      },
    ],
  },
  IMPLANT: {
    label: 'Implant',
    icon: '🦴',
    intro: 'Cấy ghép Implant tại Crown sử dụng trụ Implant chính hãng Straumann (Thụy Sĩ), Nobel Biocare (Thụy Điển), phục hình lâu dài 20–30 năm.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    groups: [
      {
        name: 'Trụ Implant theo hãng',
        rows: [
          { serviceName: 'Implant Osstem (Hàn Quốc)', unit: '/trụ', price: 19000000, description: 'Phổ biến, chất lượng tốt' },
          { serviceName: 'Implant Straumann Bone Level (Thụy Sĩ)', unit: '/trụ', price: 35000000, description: 'Hãng số 1 thế giới' },
          { serviceName: 'Implant Nobel Active (Thụy Điển)', unit: '/trụ', price: 38000000, description: 'Tải lực tức thì' },
          { serviceName: 'Implant Zimmer Biomet (Mỹ)', unit: '/trụ', price: 32000000, description: 'Ổn định cao' },
        ],
      },
      {
        name: 'Phục hình trên Implant',
        rows: [
          { serviceName: 'Răng sứ Zirconia trên Implant', unit: '/răng', price: 6000000, description: 'Kèm theo trụ Implant' },
          { serviceName: 'Cầu răng sứ trên 2 Implant', unit: '/cầu', price: 16000000, description: 'Tiết kiệm hơn 3 trụ' },
          { serviceName: 'Hàm tháo lắp trên Implant (All-on-4)', unit: '/hàm', price: 120000000, description: 'Phục hồi toàn hàm' },
        ],
      },
    ],
  },
  TAY_TRANG: {
    label: 'Tẩy trắng',
    icon: '💎',
    intro: 'Tẩy trắng răng tại Crown sử dụng công nghệ đèn Plasma & Laser kết hợp gel tẩy chuyên dụng, an toàn và hiệu quả lâu dài.',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    groups: [
      {
        name: 'Tẩy trắng tại phòng khám',
        rows: [
          { serviceName: 'Tẩy trắng đèn Plasma', unit: '/lần', price: 1500000, description: '60 phút, nâng 4–6 độ sáng' },
          { serviceName: 'Tẩy trắng đèn Laser Whitening', unit: '/lần', price: 2500000, description: '90 phút, nâng 6–10 độ sáng' },
          { serviceName: 'Tẩy trắng Zoom 2 (Mỹ)', unit: '/lần', price: 3500000, description: 'Nâng tối đa 8 độ sáng' },
        ],
      },
      {
        name: 'Tẩy trắng tại nhà',
        rows: [
          { serviceName: 'Máng tẩy trắng + gel (bộ)', unit: '/bộ', price: 800000, description: 'Dùng 14 ngày tại nhà' },
          { serviceName: 'Gel tẩy trắng bổ sung', unit: '/tuýp', price: 250000, description: 'Bổ sung sau liệu trình' },
        ],
      },
    ],
  },
  KHAM_DIEU_TRI: {
    label: 'Khám & Điều trị',
    icon: '🩺',
    intro: 'Gói khám tổng quát và các dịch vụ điều trị cơ bản tại Crown Dental, giúp phát hiện sớm và điều trị kịp thời các vấn đề răng miệng.',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    groups: [
      {
        name: 'Khám & Chẩn đoán',
        rows: [
          { serviceName: 'Khám răng tổng quát', unit: '/lần', price: 0, description: 'Tư vấn ban đầu miễn phí' },
          { serviceName: 'Chụp X-quang toàn cảnh', unit: '/lần', price: 200000, description: 'Panorama kỹ thuật số' },
          { serviceName: 'Chụp CBCT 3D', unit: '/lần', price: 450000, description: 'Chẩn đoán xương cấy ghép' },
        ],
      },
      {
        name: 'Điều trị cơ bản',
        rows: [
          { serviceName: 'Lấy cao răng & đánh bóng', unit: '/lần', price: 300000, description: 'Làm sạch cao răng 2 hàm' },
          { serviceName: 'Trám răng Composite', unit: '/răng', price: 400000, description: 'Trám răng thẩm mỹ' },
          { serviceName: 'Điều trị tủy (1 ống tủy)', unit: '/răng', price: 1200000, description: 'Điều trị nội nha' },
          { serviceName: 'Nhổ răng thường', unit: '/răng', price: 200000, description: 'Răng lung lay nha chu' },
          { serviceName: 'Nhổ răng khôn', unit: '/răng', price: 1500000, description: 'Nhổ răng bằng Piezotome' },
        ],
      },
    ],
  },
}

const TABS = [
  { key: 'NIENG_RANG', label: 'Niềng răng', icon: '🔧' },
  { key: 'RANG_SU', label: 'Răng sứ', icon: '✨' },
  { key: 'IMPLANT', label: 'Implant', icon: '🦴' },
  { key: 'TAY_TRANG', label: 'Tẩy trắng', icon: '💎' },
  { key: 'KHAM_DIEU_TRI', label: 'Khám & Điều trị', icon: '🩺' },
]

// Hàm tự động chuẩn hóa dữ liệu đề phòng API trả về thiếu trường do chưa rebuild Spring Boot
const normalizeServices = (rawServices) => {
  if (!rawServices || !Array.isArray(rawServices)) return [];
  return rawServices.map((service) => {
    let category = service.category;
    let subCategory = service.subCategory;
    let unit = service.unit || 'Lần';
    let imageUrl = service.imageUrl;
    let isFeatured = service.isFeatured || false;

    // Tự động phân loại dựa trên tên nếu backend trả về thiếu trường category
    if (!category) {
      const name = (service.serviceName || '').toLowerCase();
      if (name.includes('niềng') || name.includes('invisalign') || name.includes('clearcorrect') || name.includes('mắc cài') || name.includes('chỉnh nha')) {
        category = 'NIENG_RANG';
        if (name.includes('mắc cài kim loại')) {
          subCategory = 'Niềng răng mắc cài kim loại';
        } else if (name.includes('mắc cài sứ')) {
          subCategory = 'Niềng răng mắc cài sứ';
        } else {
          subCategory = 'Niềng răng trong suốt Invisalign';
        }
      } else if (name.includes('implant') || name.includes('cấy ghép') || name.includes('trụ')) {
        category = 'IMPLANT';
        if (name.includes('trụ') || name.includes('osstem') || name.includes('straumann') || name.includes('nobel') || name.includes('zimmer')) {
          subCategory = 'Trụ Implant theo hãng';
        } else {
          subCategory = 'Phục hình trên Implant';
        }
      } else if (name.includes('sứ') || name.includes('veneer') || name.includes('cercon') || name.includes('e.max') || name.includes('zirconia')) {
        category = 'RANG_SU';
        if (name.includes('titan') || name.includes('kim loại')) {
          subCategory = 'Răng sứ kim loại';
        } else if (name.includes('veneer')) {
          subCategory = 'Răng Veneer thẩm mỹ';
        } else {
          subCategory = 'Răng sứ toàn sứ (Ceramic)';
        }
      } else if (name.includes('tẩy') || name.includes('trăng') || name.includes('trắng') || name.includes('plasma') || name.includes('laser') || name.includes('zoom')) {
        category = 'TAY_TRANG';
        if (name.includes('nhà') || name.includes('máng') || name.includes('gel')) {
          subCategory = 'Tẩy trắng tại nhà';
        } else {
          subCategory = 'Tẩy trắng tại phòng khám';
        }
      } else {
        category = 'KHAM_DIEU_TRI';
        if (name.includes('khám') || name.includes('chụp') || name.includes('panorama') || name.includes('cbct') || name.includes('x-quang') || name.includes('phim')) {
          subCategory = 'Khám & Chẩn đoán';
        } else {
          subCategory = 'Điều trị cơ bản';
        }
      }
    }

    return {
      ...service,
      category,
      subCategory,
      unit,
      imageUrl,
      isFeatured,
    };
  });
};

export default function Pricing() {
  const [activeTab, setActiveTab] = useState('NIENG_RANG')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Tải dữ liệu từ API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const data = await getServices()
        const normalized = normalizeServices(data)
        setServices(normalized)
      } catch (error) {
        console.error('Lỗi lấy bảng giá từ API:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Xử lý dữ liệu động thành định dạng hiển thị nhóm (Groups)
  const getDisplayData = () => {
    // Nếu API đang tải hoặc không trả về dữ liệu, sử dụng static fallback
    if (services.length === 0) {
      return FALLBACK_PRICING_DATA[activeTab]
    }

    // Lọc dịch vụ theo tab đang hoạt động
    const filtered = services.filter((s) => s.category === activeTab)

    // Nếu không tìm thấy dịch vụ nào trên DB phù hợp với category, chuyển qua fallback
    if (filtered.length === 0) {
      return FALLBACK_PRICING_DATA[activeTab]
    }

    // Nhóm dịch vụ theo subCategory
    const groupsMap = {}
    filtered.forEach((item) => {
      const groupName = item.subCategory || 'Khác'
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = []
      }
      groupsMap[groupName].push({
        serviceName: item.serviceName,
        unit: item.unit || 'Lần',
        price: item.price,
        description: item.description,
      })
    })

    const groups = Object.entries(groupsMap).map(([name, rows]) => ({
      name,
      rows,
    }))

    // Lấy thông tin giới thiệu chung của Category từ Fallback dữ liệu tĩnh
    const baseMeta = FALLBACK_PRICING_DATA[activeTab]

    return {
      label: baseMeta.label,
      icon: baseMeta.icon,
      intro: baseMeta.intro,
      image: baseMeta.image,
      groups,
    }
  }

  const currentData = getDisplayData()

  // Format tiền tệ Việt Nam
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí'
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  return (
    <div className="bg-slate-50 min-h-screen" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#1f4fb2] transition-colors">Trang chủ</Link>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1f4fb2] font-semibold">Bảng Giá</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#132c6b] via-[#1a3d8f] to-[#1f4fb2] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_40%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[0.40em] text-blue-200 mb-3">Crown Dental</p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
            Bảng Giá Dịch Vụ Nha Khoa Mới Nhất 2026
          </h1>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Minh bạch – Cạnh tranh – Không phát sinh. Crown cam kết báo giá rõ ràng và chi tiết trước khi điều trị.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="tel:19008059"
              className="inline-flex items-center gap-2 bg-white text-[#1f4fb2] font-black text-sm px-6 py-3 rounded-full hover:bg-blue-50 transition-all shadow-md shadow-blue-900/10"
            >
              📞 1900 8059 – Nhận tư vấn nhanh
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#00a859] hover:bg-[#00954d] text-white font-bold text-sm px-6 py-3 rounded-full transition-all shadow-md shadow-green-900/10"
            >
              Đặt lịch tư vấn miễn phí
            </Link>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="sticky top-[73px] z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'flex items-center gap-2 whitespace-nowrap px-6 py-4 text-[14px] font-bold transition-all border-b-2 -mb-[1px] flex-shrink-0',
                  activeTab === tab.key
                    ? 'border-[#1f4fb2] text-[#1f4fb2] scale-[1.02]'
                    : 'border-transparent text-slate-500 hover:text-[#1f4fb2]',
                ].join(' ')}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Select Box Chọn Dịch Vụ (Đúng theo ảnh 4 mẫu của Parkway) */}
      <div className="bg-white border-b border-slate-200/60 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-black text-[#132c6b] uppercase tracking-wider flex-shrink-0">
              Chọn dịch vụ:
            </span>
            <div className="relative max-w-xs w-full">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl px-5 py-3 appearance-none focus:outline-none focus:border-[#1f4fb2] focus:bg-white transition-all cursor-pointer shadow-sm"
              >
                {TABS.map((tab) => (
                  <option key={tab.key} value={tab.key} className="font-bold py-1">
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">

          {/* Left Column: Tables */}
          <div className="space-y-8">
            {/* Tab Introduction info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-3xl flex items-center justify-center flex-shrink-0">
                {currentData.icon}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black text-[#132c6b]">{currentData.label}</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-2xl">{currentData.intro}</p>
              </div>
            </div>

            {/* Dynamic Price tables */}
            {currentData.groups.map((group, index) => (
              <div key={index} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
                <h3 className="text-sm font-black text-[#132c6b] uppercase tracking-widest border-l-4 border-[#00a859] pl-3 py-0.5 mb-5">
                  {group.name}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Dịch vụ</th>
                        <th className="pb-3 px-4 text-center">Đơn vị</th>
                        <th className="pb-3 pl-4 text-right">Giá tham khảo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {group.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4 pr-4">
                            <span className="font-bold text-slate-800 text-[14px]">{row.serviceName}</span>
                            {row.description && (
                              <span className="block text-[11px] text-slate-400 font-medium mt-0.5 leading-normal">
                                {row.description}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center text-xs text-slate-500">{row.unit}</td>
                          <td className="py-4 pl-4 text-right">
                            <span className={[
                              'font-black text-[15px]',
                              (!row.price || row.price === 0) ? 'text-[#00a859]' : 'text-[#e85d04]',
                            ].join(' ')}>
                              {formatPrice(row.price)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Note box */}
            <div className="rounded-3xl bg-amber-50/60 border border-amber-100/70 p-6 flex gap-4">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">Lưu ý quan trọng về bảng giá</h4>
                <p className="text-[12px] text-amber-700 leading-relaxed font-semibold">
                  Bảng giá trên đây mang tính chất tham khảo. Chi phí thực tế sẽ phụ thuộc chính xác vào tình trạng sức khỏe răng miệng thực tế, loại vật liệu lựa chọn và phác đồ điều trị của bác sĩ chuyên khoa. 
                  Quý khách nên đến trực tiếp phòng khám nha khoa hoặc liên hệ hotline{' '}
                  <a href="tel:19008059" className="font-black text-[#1f4fb2] underline">1900 8059</a> để nhận báo giá chi tiết, cá nhân hóa hoàn toàn miễn phí.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="space-y-6">
            {/* Service Banner Image */}
            <div className="rounded-3xl overflow-hidden shadow-md h-52 border border-slate-200 bg-slate-100">
              <img src={currentData.image} alt={currentData.label} className="w-full h-full object-cover" />
            </div>

            {/* Categories sidebar quick list */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-[#132c6b] uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                Danh mục giá dịch vụ
              </h3>
              <div className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-black transition-all',
                      activeTab === tab.key
                        ? 'bg-blue-50 text-[#1f4fb2]'
                        : 'text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span className="flex-1">{tab.label}</span>
                    {activeTab === tab.key && (
                      <svg className="w-4 h-4 text-[#1f4fb2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Side CTA Block */}
            <div className="rounded-3xl bg-gradient-to-br from-[#132c6b] to-[#1f4fb2] p-6 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-5">
                <svg width="150" height="150" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-black text-base mb-2">Nhận Báo Giá Chính Xác</h3>
              <p className="text-blue-100 text-xs mb-4 leading-relaxed font-semibold">
                Đăng ký khám miễn phí cùng Thạc sĩ, Bác sĩ tu nghiệp Singapore để nhận báo giá chi tiết theo tình trạng răng miệng.
              </p>
              <Link
                to="/contact"
                className="inline-block bg-[#00a859] hover:bg-[#00954d] transition-all text-white text-xs font-bold px-6 py-3 rounded-full shadow-md"
              >
                Đặt lịch hẹn khám miễn phí
              </Link>
            </div>

            {/* Hotline Contact box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng đài hỗ trợ 24/7</p>
              <a href="tel:19008059" className="text-2xl font-black text-[#1f4fb2] hover:text-[#0f3a9e] transition-colors block">
                1900 8059
              </a>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Thứ 2 – Chủ nhật: 8:30 – 19:30</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom stats details */}
      <div className="bg-white border-t border-slate-200 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '0đ', label: 'Khám răng & Tư vấn trực tiếp' },
              { num: '0%', label: 'Trả góp lãi suất 0% 12 tháng' },
              { num: 'Trọn đời', label: 'Bảo hành trụ Implant chính hãng' },
              { num: '100%', label: 'Vật liệu nhập khẩu chính hãng' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 hover:shadow-md transition-shadow">
                <div className="text-2xl font-black text-[#1f4fb2]">{item.num}</div>
                <div className="text-xs font-semibold text-slate-500 mt-2.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
