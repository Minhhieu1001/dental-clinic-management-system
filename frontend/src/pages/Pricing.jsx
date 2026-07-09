import SectionHeading from '../components/common/SectionHeading.jsx'

const pricingCards = [
  { title: 'Khám tổng quát', price: 'Miễn phí', note: 'Khung giá cho thăm khám ban đầu và tư vấn.' },
  { title: 'Niềng răng', price: 'Từ 32 triệu', note: 'Khung giá tham khảo cho chỉnh nha theo từng tình trạng.' },
  { title: 'Răng sứ', price: 'Từ 10 triệu/răng', note: 'Khung giá cho phục hình thẩm mỹ và vật liệu.' },
  { title: 'Implant', price: 'Từ 19 triệu/trụ', note: 'Khung giá cho phục hồi răng mất lâu dài.' },
]

export default function Pricing() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Bảng giá"
        title="Khung trang bảng giá"
        description="Bố cục giá tham khảo giúp hiển thị rõ các nhóm dịch vụ chủ lực và hỗ trợ đặt hẹn."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pricingCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              {card.title}
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{card.price}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
            <div className="mt-6 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
              Đặt lịch tư vấn
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}