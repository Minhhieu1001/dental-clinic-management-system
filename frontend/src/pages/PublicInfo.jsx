import { Link, useLocation } from 'react-router-dom'

const pageContent = {
  '/celebrities': {
    eyebrow: 'Câu chuyện khách hàng', title: 'Nụ cười tự tin, thay đổi mỗi ngày',
    description: 'Lắng nghe hành trình chăm sóc nụ cười và những trải nghiệm thực tế cùng đội ngũ Crown Dental.',
    cards: [['Tư vấn cá nhân hóa', 'Bác sĩ phân tích tình trạng răng miệng và đề xuất lộ trình phù hợp.'], ['Theo dõi sát sao', 'Mỗi giai đoạn điều trị đều có lịch tái khám và hỗ trợ tận tâm.'], ['Nụ cười bền vững', 'Ưu tiên sức khỏe răng miệng lâu dài song song với yếu tố thẩm mỹ.']],
  },
  '/knowledge': {
    eyebrow: 'Kiến thức nha khoa', title: 'Chăm sóc răng miệng đúng cách',
    description: 'Các kiến thức cơ bản giúp bạn chủ động bảo vệ nụ cười khỏe đẹp cho bản thân và gia đình.',
    cards: [['Khám định kỳ', 'Duy trì thói quen kiểm tra răng miệng mỗi 6 tháng để phát hiện sớm vấn đề.'], ['Vệ sinh đúng cách', 'Chải răng hai lần mỗi ngày, kết hợp chỉ nha khoa và nước súc miệng phù hợp.'], ['Tư vấn chuyên môn', 'Liên hệ bác sĩ khi có đau nhức, ê buốt hoặc dấu hiệu bất thường kéo dài.']],
  },
  '/careers': {
    eyebrow: 'Tuyển dụng', title: 'Cùng kiến tạo trải nghiệm nha khoa tốt hơn',
    description: 'Crown Dental luôn chào đón những thành viên tận tâm, chuyên nghiệp và yêu thích việc chăm sóc khách hàng.',
    cards: [['Môi trường chuyên nghiệp', 'Quy trình rõ ràng, đội ngũ hỗ trợ và không gian phát triển năng lực.'], ['Đào tạo liên tục', 'Cập nhật kiến thức chuyên môn và kỹ năng phục vụ theo từng vị trí.'], ['Gửi hồ sơ', 'Ứng viên có thể gửi CV về email tuyển dụng để được liên hệ khi có vị trí phù hợp.']],
  },
  '/doctors': {
    eyebrow: 'Đội ngũ bác sĩ', title: 'Đồng hành cùng sức khỏe nụ cười',
    description: 'Đội ngũ bác sĩ được đào tạo bài bản, tận tâm tư vấn và theo dõi trong toàn bộ quá trình điều trị.',
    cards: [['Chỉnh nha', 'Đánh giá khớp cắn và xây dựng kế hoạch niềng răng cá nhân hóa.'], ['Phục hình thẩm mỹ', 'Tư vấn răng sứ, Veneer và giải pháp nâng tầm nụ cười tự nhiên.'], ['Cấy ghép Implant', 'Phục hồi răng mất với kế hoạch an toàn, minh bạch và theo dõi lâu dài.']],
  },
}

export default function PublicInfo() {
  const content = pageContent[useLocation().pathname] || pageContent['/knowledge']
  return <div className="bg-[#f8fbff] py-10 sm:py-16"><section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#143777] via-[#2050a8] to-[#4281ed] px-7 py-14 text-white shadow-xl sm:px-12"><p className="text-xs font-bold uppercase tracking-[0.32em] text-blue-100">{content.eyebrow}</p><h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{content.title}</h1><p className="mt-5 max-w-2xl leading-7 text-blue-50">{content.description}</p><Link to="/contact" className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[#2258ba] transition hover:bg-blue-50">Đăng ký tư vấn</Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{content.cards.map(([title, description], index) => <article key={title} className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-black text-[#2d6eea]">0{index + 1}</span><h2 className="mt-5 text-xl font-extrabold text-[#173e70]">{title}</h2><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}</div></section></div>
}
