import { useEffect, useState } from 'react'
import api from '../../services/axios'
import { getServices } from '../../services/api'

const emptyForm = { title: '', description: '', imageUrl: '', discountPercent: '', startDate: '', endDate: '', serviceIds: [] }
const toInputDate = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
const dateLabel = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value))

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [promotionResponse, serviceResponse] = await Promise.all([api.get('/admin/promotions'), getServices()])
      setPromotions(promotionResponse.data)
      setServices(serviceResponse)
    } catch {
      setError('Không thể tải dữ liệu ưu đãi. Vui lòng kiểm tra quyền quản trị hoặc kết nối máy chủ.')
    } finally { setLoading(false) }
  }
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const updateForm = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const toggleService = (id) => updateForm('serviceIds', form.serviceIds.includes(id) ? form.serviceIds.filter(item => item !== id) : [...form.serviceIds, id])
  const resetForm = () => { setForm(emptyForm); setEditingId(null); setError(''); setMessage('') }

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    if (!form.serviceIds.length) return setError('Chọn ít nhất một dịch vụ áp dụng.')
    const payload = { ...form, discountPercent: Number(form.discountPercent), startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() }
    try {
      if (editingId) await api.put(`/admin/promotions/${editingId}`, payload)
      else await api.post('/admin/promotions', payload)
      setMessage(editingId ? 'Đã cập nhật ưu đãi.' : 'Đã tạo ưu đãi mới.')
      setForm(emptyForm); setEditingId(null); await load()
    } catch (requestError) { setError(requestError.response?.data?.message || 'Không thể lưu ưu đãi. Hãy kiểm tra lại dữ liệu.') }
  }

  const edit = (promotion) => {
    setEditingId(promotion.id)
    setForm({ title: promotion.title, description: promotion.description || '', imageUrl: promotion.imageUrl || '', discountPercent: promotion.discountPercent, startDate: toInputDate(promotion.startDate), endDate: toInputDate(promotion.endDate), serviceIds: promotion.services.map(service => service.id) })
    setMessage(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const remove = async (promotion) => {
    if (!window.confirm(`Xóa ưu đãi “${promotion.title}”?`)) return
    try { await api.delete(`/admin/promotions/${promotion.id}`); setMessage('Đã xóa ưu đãi.'); await load() } catch { setError('Không thể xóa ưu đãi.') }
  }

  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-blue-600">QUẢN LÝ DỊCH VỤ</p><h2 className="mt-1 text-2xl font-black text-slate-800">Ưu đãi</h2><p className="mt-1 text-sm text-slate-500">Tạo, cập nhật và công khai các chương trình ưu đãi trên website.</p></div>
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-800">{editingId ? 'Cập nhật ưu đãi' : 'Tạo ưu đãi mới'}</h3>{editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Hủy chỉnh sửa</button>}</div>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Tên chương trình<input required value={form.title} onChange={e => updateForm('title', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" placeholder="VD: Ưu đãi niềng răng mùa hè" /></label><label className="text-sm font-semibold text-slate-700">Phần trăm giảm<input required min="0.01" max="100" step="0.01" type="number" value={form.discountPercent} onChange={e => updateForm('discountPercent', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" placeholder="20" /></label><label className="text-sm font-semibold text-slate-700 md:col-span-2">URL ảnh chương trình<input type="url" value={form.imageUrl} onChange={e => updateForm('imageUrl', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" placeholder="https://..." /></label><label className="text-sm font-semibold text-slate-700">Ngày bắt đầu<input required type="datetime-local" value={form.startDate} onChange={e => updateForm('startDate', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label><label className="text-sm font-semibold text-slate-700">Ngày kết thúc<input required type="datetime-local" value={form.endDate} onChange={e => updateForm('endDate', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label><label className="text-sm font-semibold text-slate-700 md:col-span-2">Mô tả<textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows="3" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" placeholder="Nội dung, điều kiện áp dụng..." /></label></div>
      <fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Dịch vụ áp dụng</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{services.map(service => <label key={service.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${form.serviceIds.includes(service.id) ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700'}`}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />{service.serviceName}</label>)}</div></fieldset><button className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">{editingId ? 'Lưu thay đổi' : 'Tạo ưu đãi'}</button>
    </form>
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-800">Danh sách ưu đãi</h3></div>{loading ? <p className="p-6 text-slate-500">Đang tải...</p> : <div className="divide-y divide-slate-100">{promotions.length ? promotions.map(promotion => <div key={promotion.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-800">{promotion.title}</h4><span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">-{Number(promotion.discountPercent)}%</span></div><p className="mt-1 text-sm text-slate-500">{promotion.services.map(service => service.serviceName).join(', ') || 'Chưa gắn dịch vụ'} · {dateLabel(promotion.startDate)} – {dateLabel(promotion.endDate)}</p></div><div className="flex gap-2"><button onClick={() => edit(promotion)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Sửa</button><button onClick={() => remove(promotion)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Xóa</button></div></div>) : <p className="p-6 text-slate-500">Chưa có ưu đãi.</p>}</div>}</section>
  </div>
}
