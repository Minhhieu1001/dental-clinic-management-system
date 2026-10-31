import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAdminServices } from '../services/service.service'

// Định nghĩa thông tin tĩnh hỗ trợ giới thiệu chi tiết cho từng danh mục (Brochure Content)
const CATEGORY_INTRO_DATA = {
  NIENG_RANG: {
    title: 'Niềng Răng Thẩm Mỹ',
    subtitle: 'Kiến tạo nụ cười đều đẹp, chuẩn khớp cắn',
    whatIs: 'Niềng răng (chỉnh nha) là giải pháp sử dụng các khí cụ chuyên dụng như mắc cài kim loại, mắc cài sứ hoặc khay niềng trong suốt Invisalign để dịch chuyển các răng mọc lệch lạc, hô, móm, thưa về đúng vị trí mong muốn trên cung hàm.',
    advantages: [
      { title: 'Khắc phục toàn diện lệch lạc', desc: 'Sắp xếp các răng thẳng đều, đưa khớp cắn về tỷ lệ chuẩn xác.' },
      { title: 'Cải thiện chức năng ăn nhai', desc: 'Giảm áp lực cho khớp thái dương hàm, bảo vệ hệ tiêu hóa khỏe mạnh.' },
      { title: 'Bảo tồn răng thật tối đa', desc: 'Không cần mài cùi răng, hạn chế xâm lấn cấu trúc răng thật.' },
      { title: 'Hiệu quả duy trì trọn đời', desc: 'Kết quả nụ cười rạng rỡ và tự tin đi cùng bạn suốt năm tháng.' },
    ],
    cases: [
      'Răng khấp khểnh, chen chúc, mọc lệch hướng.',
      'Răng hô, móm, khớp cắn ngược, khớp cắn sâu.',
      'Răng thưa, khoảng cách giữa các răng lớn gây mất thẩm mỹ và dễ dắt thức ăn.',
      'Lệch nhân trung, cung hàm méo lệch.'
    ],
    steps: [
      { name: 'Thăm khám & Chụp phim', desc: 'Chụp phim Panorama, CBCT 3D xác định cấu trúc răng và xương hàm.' },
      { name: 'Lập phác đồ điều trị', desc: 'Mô phỏng dịch chuyển răng 3D (ClinCheck) và thống nhất thời gian.' },
      { name: 'Gắn khí cụ chỉnh nha', desc: 'Gắn mắc cài hoặc bàn giao khay niềng trong suốt cho bệnh nhân.' },
      { name: 'Tái khám định kỳ', desc: 'Theo dõi tiến độ và điều chỉnh lực kéo định kỳ mỗi 4-6 tuần.' },
      { name: 'Tháo niềng & Đeo hàm duy trì', desc: 'Hoàn tất điều trị và đeo máng duy trì chống chạy răng.' }
    ]
  },
  IMPLANT: {
    title: 'Trồng Răng Implant Phục Hồi',
    subtitle: 'Giải pháp khôi phục răng mất tốt nhất hiện nay',
    whatIs: 'Cấy ghép Implant là phương pháp phục hình răng mất bằng cách đặt một trụ chân răng giả bằng Titanium lành tính vào trong xương hàm. Sau khi trụ tích hợp vững chắc vào xương, bác sĩ tiến hành lắp mão răng sứ lên trên thông qua khớp nối Abutment, tái tạo chiếc răng hoàn chỉnh giống 99% răng thật cả về thẩm mỹ lẫn chức năng.',
    advantages: [
      { title: 'Ăn nhai như răng thật', desc: 'Trụ Implant cắm sâu vào xương hàm chịu lực cực tốt, thoải mái ăn uống thức ăn cứng.' },
      { title: 'Ngăn ngừa tiêu xương hàm', desc: 'Kích thích xương hàm duy trì mật độ nhờ lực nhai truyền qua trụ, tránh hóp má.' },
      { title: 'Không mài răng bên cạnh', desc: 'Phục hình độc lập tại vị trí răng mất, không gây ảnh hưởng đến các răng khỏe mạnh kế cận.' },
      { title: 'Tuổi thọ lên đến trọn đời', desc: 'Vật liệu Titanium cao cấp siêu bền vững, có thể tồn tại trọn đời nếu chăm sóc tốt.' }
    ],
    cases: [
      'Mất một răng đơn lẻ ở bất kỳ vị trí nào trên cung hàm.',
      'Mất nhiều răng liền kề hoặc cách quãng nhau.',
      'Mất răng toàn bộ một hàm hoặc cả hai hàm.',
      'Răng bị hỏng nặng bắt buộc phải nhổ bỏ và muốn cấy phục hình ngay.'
    ],
    steps: [
      { name: 'Khám lâm sàng & Chụp CBCT', desc: 'Đánh giá mật độ xương hàm và xác định vị trí đặt trụ an toàn.' },
      { name: 'Cấy ghép trụ Implant', desc: 'Tiến hành tiểu phẫu đặt trụ Implant vào xương hàm dưới gây tê cục bộ.' },
      { name: 'Chờ tích hợp xương', desc: 'Chờ từ 2 - 3 tháng để trụ Implant bám chặt hoàn toàn vào xương.' },
      { name: 'Lắp khớp nối & Lấy dấu', desc: 'Gắn Abutment hướng dẫn nướu và lấy dấu răng chế tác mão sứ.' },
      { name: 'Lắp mão sứ hoàn thiện', desc: 'Cố định răng sứ lên trụ Implant, kiểm tra khớp cắn ăn nhai hoàn tất.' }
    ]
  },
  RANG_SU: {
    title: 'Răng Sứ Thẩm Mỹ & Veneer',
    subtitle: 'Kiến tạo nụ cười rạng rỡ tinh tế trong từng chi tiết',
    whatIs: 'Bọc răng sứ và dán sứ Veneer là các giải pháp phục hình thẩm mỹ cao cấp dành cho răng gặp khuyết điểm về màu sắc, hình dáng. Trong đó, dán sứ Veneer sử dụng mặt sứ siêu mỏng (0.3mm - 0.5mm) dán lên mặt trước của răng giúp bảo tồn tối đa răng thật, đem lại nụ cười chuẩn tỷ lệ vàng.',
    advantages: [
      { title: 'Thẩm mỹ vượt trội', desc: 'Răng trắng sáng tự nhiên, dáng răng đều đặn cân đối hoàn hảo.' },
      { title: 'Chịu lực ăn nhai tốt', desc: 'Độ bền gấp 4-8 lần răng thật, thoải mái nhai cắn không lo sứt mẻ.' },
      { title: 'Không bám màu thực phẩm', desc: 'Bề mặt sứ kháng khuẩn, kháng màu tốt từ trà, cà phê, nước ngọt.' },
      { title: 'Thực hiện nhanh chóng', desc: 'Chỉ mất từ 2-3 lần hẹn là hoàn thành nụ cười rạng rỡ như ý.' }
    ],
    cases: [
      'Răng xỉn màu, ố vàng nặng, nhiễm kháng sinh Tetracycline không thể tẩy trắng.',
      'Răng mẻ, vỡ, mòn cổ răng hoặc sâu răng diện rộng.',
      'Răng thưa kẽ nhẹ, răng ngắn dài không đều.',
      'Hình thể răng xấu, méo mó mong muốn sở hữu nụ cười đẹp nhanh chóng.'
    ],
    steps: [
      { name: 'Thiết kế nụ cười Smile Design', desc: 'Chụp ảnh chân dung, thiết kế dáng răng phù hợp với khuôn mặt.' },
      { name: 'Sửa soạn răng & Lấy dấu', desc: 'Vệ sinh, chuẩn bị bề mặt răng (mài cực ít với Veneer) và quét dấu hàm 3D.' },
      { name: 'Chế tác răng sứ CAD/CAM', desc: 'Hệ thống labo chế tác răng sứ nguyên khối có độ chính xác cao.' },
      { name: 'Thử răng & Điều chỉnh', desc: 'Bác sĩ đặt thử răng sứ lên cung hàm, tinh chỉnh màu sắc khớp cắn.' },
      { name: 'Dán gắn răng sứ cố định', desc: 'Sử dụng keo nha khoa chuyên dụng gắn chặt răng sứ, đánh bóng hoàn thiện.' }
    ]
  },
  TAY_TRANG: {
    title: 'Tẩy Trắng Răng Công Nghệ Cao',
    subtitle: 'Nâng tông sáng bật nụ cười rạng rỡ chỉ sau 60 phút',
    whatIs: 'Tẩy trắng răng công nghệ cao là phương pháp dùng gel tẩy trắng chuyên dụng kết hợp với nguồn ánh sáng năng lượng cao (đèn Plasma hoặc Laser) để cắt đứt các liên kết màu hữu cơ bám trên men răng, mang lại hàm răng trắng sáng đều màu mà không làm hại đến men răng hay cấu trúc tủy răng bên trong.',
    advantages: [
      { title: 'Hiệu quả tức thì', desc: 'Răng bật sáng từ 4-8 tông chỉ sau một lần thực hiện khoảng 45-60 phút.' },
      { title: 'An toàn cho men răng', desc: 'Thuốc tẩy trắng chính hãng được kiểm định y tế, chứa fluor bảo vệ men.' },
      { title: 'Không đau buốt', desc: 'Công nghệ ánh sáng lạnh kiểm soát nhiệt lượng tốt, hạn chế tối đa ê buốt.' },
      { title: 'Giữ màu bền lâu', desc: 'Hiệu quả trắng sáng duy trì từ 2 - 3 năm nếu chăm sóc răng miệng tốt.' }
    ],
    cases: [
      'Răng bị ố vàng do mảng bám thức ăn, hút thuốc lá.',
      'Răng xỉn màu do thường xuyên dùng trà, cà phê, nước ngọt đậm màu.',
      'Răng không đều màu do tuổi tác.',
      'Khách hàng mong muốn sở hữu nụ cười trắng sáng rạng ngời nhanh chóng.'
    ],
    steps: [
      { name: 'Khám răng miệng tổng quát', desc: 'Đảm bảo răng không bị sâu, viêm nướu trước khi thực hiện tẩy trắng.' },
      { name: 'So màu răng ban đầu', desc: 'Sử dụng bảng màu nha khoa xác định tông màu hiện tại và mục tiêu.' },
      { name: 'Cách ly môi và nướu', desc: 'Đeo dụng cụ bảo vệ môi, bôi gel che nướu tránh thuốc tiếp xúc mô mềm.' },
      { name: 'Thoa gel & Chiếu ánh sáng', desc: 'Phủ thuốc tẩy trắng lên răng và chiếu đèn hoạt hóa thuốc trong 2-3 chu kỳ.' },
      { name: 'Làm sạch & Hướng dẫn', desc: 'Vệ sinh sạch thuốc, bôi gel chống ê buốt và hướng dẫn ăn kiêng không màu.' }
    ]
  },
  KHAM_DIEU_TRI: {
    title: 'Nha Khoa Tổng Quát & Điều Trị',
    subtitle: 'Chăm sóc sức khỏe răng miệng toàn diện cho cả gia đình',
    whatIs: 'Nha khoa tổng quát bao gồm các dịch vụ khám định kỳ, chẩn đoán hình ảnh, lấy cao răng, trám răng sâu, nhổ răng khôn và điều trị nội nha. Đây là nền tảng cốt lõi giúp phát hiện sớm các bệnh lý răng miệng nguy hiểm, từ đó đưa ra giải pháp điều trị kịp thời để bảo vệ hàm răng khỏe mạnh bền lâu.',
    advantages: [
      { title: 'Phòng ngừa bệnh lý tối đa', desc: 'Lấy sạch vôi răng định kỳ ngăn chặn triệt để viêm nướu, viêm nha chu.' },
      { title: 'Điều trị không đau đớn', desc: 'Ứng dụng máy nhổ răng siêu âm Piezotome, công nghệ gây tê tiên tiến.' },
      { title: 'Bảo tồn tối đa răng gốc', desc: 'Điều trị tủy răng công nghệ vi phẫu giúp giữ lại răng thật bị tổn thương nặng.' },
      { title: 'Bác sĩ chuyên khoa giàu kinh nghiệm', desc: 'Đội ngũ bác sĩ răng hàm mặt khám kỹ lưỡng, đưa phác đồ chính xác.' }
    ],
    cases: [
      'Định kỳ lấy cao răng 6 tháng/lần cho mọi lứa tuổi.',
      'Răng ê buốt khi ăn đồ nóng lạnh, răng có lỗ sâu đen cần trám.',
      'Đau răng dữ dội vào ban đêm do viêm tủy.',
      'Răng khôn mọc lệch, mọc ngầm gây đau nhức sưng nướu, hôi miệng.'
    ],
    steps: [
      { name: 'Thăm khám & Hỏi bệnh sử', desc: 'Khám răng miệng tổng thể, phát hiện các tổn thương nhìn thấy bằng mắt.' },
      { name: 'Chụp phim chẩn đoán (nếu cần)', desc: 'Xác định sâu kẽ răng, tình trạng chân răng bị tiêu hoặc răng khôn mọc lệch.' },
      { name: 'Tư vấn giải pháp điều trị', desc: 'Giải thích tình trạng bệnh lý và đề xuất phương án khắc phục phù hợp nhất.' },
      { name: 'Tiến hành điều trị', desc: 'Thực hiện lấy cao răng, trám composite, nội nha hoặc nhổ răng nhẹ nhàng.' },
      { name: 'Hướng dẫn chăm sóc & Hẹn lịch', desc: 'Dặn dò vệ sinh răng miệng tại nhà và đặt lịch tái khám định kỳ.' }
    ]
  }
}

const TABS = [
  { key: 'NIENG_RANG', label: 'Niềng Răng', icon: '🔧' },
  { key: 'IMPLANT', label: 'Trồng Răng Implant', icon: '🦴' },
  { key: 'RANG_SU', label: 'Nha Khoa Thẩm Mỹ', icon: '✨' },
  { key: 'TAY_TRANG', label: 'Tẩy Trắng Răng', icon: '💎' },
  { key: 'KHAM_DIEU_TRI', label: 'Nha Khoa Tổng Quát', icon: '🩺' }
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

    // Thiết lập ảnh minh họa mặc định nếu thiếu
    if (!imageUrl) {
      if (category === 'NIENG_RANG') imageUrl = 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80';
      else if (category === 'IMPLANT') imageUrl = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80';
      else if (category === 'RANG_SU') imageUrl = 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80';
      else if (category === 'TAY_TRANG') imageUrl = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80';
      else imageUrl = 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80';
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

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // Xác định tab active ban đầu dựa vào query param
  const initialTab = TABS.some(t => t.key === tabParam) ? tabParam : 'NIENG_RANG'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, FEATURED, PRICE_ASC, PRICE_DESC

  // Đọc danh mục từ API backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const data = await getAdminServices({ isActive: true })
        const normalized = normalizeServices(data)
        setServices(normalized)
      } catch (error) {
        console.error('Lỗi khi tải danh sách dịch vụ:', error)
      } finally {
        setLoading(false)
      }
    };
    fetchServices()
  }, [])

  // Mỗi lần query param thay đổi thì cập nhật activeTab tương ứng
  useEffect(() => {
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (key) => {
    setActiveTab(key)
    setSearchParams({ tab: key })
  }

  // Lọc dịch vụ theo danh mục (category) đang chọn và chỉ lấy dịch vụ đang hoạt động
  const filteredByCategory = services.filter(
    (service) => service.category === activeTab && service.isActive !== false
  )

  // Áp dụng bộ lọc sắp xếp bổ sung (Tất cả, Khuyến mãi/Bán chạy, Giá tăng/giảm)
  const getProcessedServices = () => {
    let list = [...filteredByCategory]
    
    // Tự động lọc nếu đường dẫn từ Navbar truyền filter=KIDS
    const filterParam = searchParams.get('filter')
    if (filterParam === 'KIDS') {
      list = list.filter(
        (s) => 
          s.serviceName.toLowerCase().includes('trẻ em') || 
          s.description.toLowerCase().includes('trẻ em')
      )
    }

    if (filter === 'FEATURED') {
      list = list.filter((s) => s.isFeatured)
    }
    if (filter === 'PRICE_ASC') {
      list.sort((a, b) => a.price - b.price)
    } else if (filter === 'PRICE_DESC') {
      list.sort((a, b) => b.price - a.price)
    }
    return list
  }

  const processedList = getProcessedServices()
  const intro = CATEGORY_INTRO_DATA[activeTab]

  // Định dạng hiển thị giá tiền
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí'
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#1f4fb2] transition-colors">Trang chủ</Link>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/services" className="hover:text-[#1f4fb2] transition-colors">Dịch vụ</Link>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#1f4fb2] font-semibold">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-[#132c6b] via-[#1a3d8f] to-[#1f4fb2] text-white py-14 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block text-[11px] font-black uppercase tracking-[0.35em] bg-white/10 px-4 py-1.5 rounded-full text-blue-200 mb-4 border border-white/5">
            Dịch Vụ Chuyên Sâu
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
            {intro.title}
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed">
            {intro.subtitle} – Đội ngũ bác sĩ chuyên khoa giỏi trực tiếp điều trị bằng công nghệ chuẩn quốc tế.
          </p>
        </div>
      </section>



      {/* ── Main Content Area ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* ── Filter & Sub-services Title ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
          <div>
            <h2 className="text-2xl font-black text-[#132c6b] flex items-center gap-3">
              <span className="w-1.5 h-6 bg-[#00a859] rounded-full inline-block" />
              Các Dịch Vụ Con & Giá Tham Khảo
            </h2>
            <p className="text-xs text-slate-500 mt-1">Lọc và sắp xếp bảng giá dịch vụ theo mong muốn</p>
          </div>
          
          {/* Bộ lọc giống trong ảnh thiết kế */}
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-bold">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'FEATURED', label: '🔥 Bán chạy / Nổi bật' },
              { id: 'PRICE_ASC', label: 'Giá từ thấp đến cao' },
              { id: 'PRICE_DESC', label: 'Giá từ cao xuống thấp' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={[
                  'px-4 py-2 rounded-lg transition-all border',
                  filter === btn.id
                    ? 'bg-blue-50 border-[#1f4fb2] text-[#1f4fb2] shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                ].join(' ')}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Services Cards Grid ── */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1f4fb2]" />
            <p className="text-sm text-slate-500 mt-3 font-semibold">Đang tải dữ liệu dịch vụ...</p>
          </div>
        ) : processedList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-lg text-slate-500 font-bold">Hiện chưa có dịch vụ nào thuộc danh mục này</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng quay lại sau hoặc liên hệ Hotline để được tư vấn trực tiếp.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {processedList.map((service, index) => (
              <article
                key={service.id || index}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="h-56 overflow-hidden relative bg-slate-100">
                  <img
                    src={service.imageUrl || 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80'}
                    alt={service.serviceName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {service.isFeatured && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      Bán chạy
                    </span>
                  )}
                  <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    Đơn vị: {service.unit || 'Lần'}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {service.subCategory || TABS.find((t) => t.key === activeTab)?.label}
                      </p>
                      {service.warrantyPeriod && service.warrantyPeriod !== 'Không bảo hành' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🛡️ {service.warrantyPeriod}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1f4fb2] transition-colors leading-snug">
                      {service.serviceName}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-500 line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá tham khảo</span>
                      <span className="text-lg font-black text-[#e85d04]">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    
                    <Link
                      to="/contact"
                      className="bg-blue-50 text-[#1f4fb2] hover:bg-[#1f4fb2] hover:text-white transition-all font-bold text-xs px-4 py-2.5 rounded-full"
                    >
                      Đăng ký tư vấn
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── Creative Brochure & Detail Section (Dưới dạng bài viết bổ sung cực đẹp) ── */}
        <section className="mt-16 bg-white rounded-[2.5rem] border border-slate-200/80 shadow-md p-6 sm:p-10 lg:p-14 space-y-12">
          
          {/* Hộp định nghĩa */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-[#132c6b] tracking-tight">
                {intro.title} là gì?
              </h2>
              <div className="w-16 h-1 bg-[#00a859] rounded-full" />
              <p className="text-base text-slate-600 leading-relaxed font-medium">
                {intro.whatIs}
              </p>
            </div>
            <div className="bg-[#f4f7fb] rounded-3xl p-6 border border-slate-100 text-center shadow-inner hidden lg:block">
              <span className="text-5xl inline-block mb-3">💡</span>
              <h4 className="font-black text-slate-800 text-sm mb-1">Tư vấn của chuyên gia</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Được khám trực tiếp bởi Thạc sĩ, Bác sĩ tu nghiệp nước ngoài và nhận phác đồ điều trị 3D hoàn toàn miễn phí.
              </p>
            </div>
          </div>

          {/* Hộp ưu điểm nổi bật (Brochure style) */}
          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xl font-black text-[#132c6b] mb-6 flex items-center gap-3">
              🎯 Ưu điểm vượt trội của phương pháp {TABS.find(t => t.key === activeTab)?.label}
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {intro.advantages.map((adv, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 hover:bg-blue-50/40 transition-colors">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#edf4ff] text-xs font-black text-[#1f4fb2] mb-3">
                    0{idx + 1}
                  </span>
                  <h4 className="font-black text-slate-800 text-sm mb-1.5">{adv.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hai cột: Các trường hợp nên chỉ định & Quy trình thực hiện */}
          <div className="grid lg:grid-cols-2 gap-10 pt-8 border-t border-slate-100">
            
            {/* Cột trái: Các trường hợp chỉ định */}
            <div className="space-y-5">
              <h3 className="text-xl font-black text-[#132c6b] flex items-center gap-2">
                📋 Ai nên làm {TABS.find(t => t.key === activeTab)?.label}?
              </h3>
              <ul className="space-y-3.5">
                {intro.cases.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#edfcf2] text-[#00a859] flex items-center justify-center text-xs font-black mt-0.5">
                      ✓
                    </span>
                    <span className="text-sm text-slate-600 font-semibold leading-normal">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột phải: Quy trình chuẩn Nha Khoa Crown */}
            <div className="space-y-5">
              <h3 className="text-xl font-black text-[#132c6b] flex items-center gap-2">
                ⚙ Quy trình điều trị tiêu chuẩn Singapore
              </h3>
              <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                {intro.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Chấm tròn đầu mốc */}
                    <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-white border-2 border-[#1f4fb2] text-[#1f4fb2] flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm leading-none">{step.name}</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* ── Bottom Call To Action (Banner Hẹn Lịch Nổi Bật) ── */}
        <section className="mt-12 rounded-[2.5rem] border border-transparent bg-gradient-to-r from-[#132c6b] to-[#1f4fb2] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" />
            </svg>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center relative z-10">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                Hỗ Trợ 24/7
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                Đặt Lịch Hẹn Tư Vấn Miễn Phí Với Bác Sĩ Chuyên Khoa
              </h3>
              <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                Minh bạch lộ trình và chi phí điều trị ngay từ đầu. Cam kết mang đến trải nghiệm không đau, không phát sinh chi phí phụ.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="tel:19008059"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-full transition-all flex items-center gap-2"
              >
                📞 Hotline: 1900 8059
              </a>
              <Link
                to="/contact"
                className="bg-white hover:bg-blue-50 text-[#1f4fb2] font-black text-sm px-6 py-3.5 rounded-full shadow-lg shadow-black/10 transition-all flex items-center gap-1"
              >
                Đặt lịch hẹn ngay
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
