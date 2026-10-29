import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Tag,
  Ticket,
  Plus,
  Search,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Eye,
  Layers,
  Activity,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react'
import api from '../../services/axios'
import { getServices } from '../../services/api'
import { uploadImage } from '../../services/media.service'

// Import Sub-Modals from action folder
import PromotionFormModal from './action/PromotionFormModal'
import PromotionDetailModal from './action/PromotionDetailModal'
import PromotionExtendModal from './action/PromotionExtendModal'
import PromotionDeleteModal from './action/PromotionDeleteModal'

const emptyForm = {
  title: '',
  couponCode: '',
  category: 'Niềng răng',
  description: '',
  imageUrl: '',
  discountType: 'PERCENT', // 'PERCENT' | 'AMOUNT'
  discountPercent: '',
  discountAmount: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  usageLimit: '',
  applyAllServices: false,
  status: 'ACTIVE',
  startDate: '',
  endDate: '',
  serviceIds: [],
}

const formatDiscountBadge = (promo) => {
  if (!promo) return 'Ưu đãi'
  if (promo.discountPercent && Number(promo.discountPercent) > 0) {
    return `-${Number(promo.discountPercent)}%`
  }
  if (promo.discountAmount && Number(promo.discountAmount) > 0) {
    const val = Number(promo.discountAmount)
    if (val >= 1000000 && val % 1000000 === 0) {
      return `-${val / 1000000}Tr`
    }
    if (val >= 1000) {
      return `-${(val / 1000).toLocaleString('vi-VN')}k`
    }
    return `-${formatMoney(val)}`
  }
  return 'Ưu đãi'
}

const isVoucherPromo = (promo) => {
  if (!promo) return false
  return Boolean(
    promo.promotionType === 'VOUCHER' ||
      (promo.couponCode && promo.couponCode.trim()) ||
      (promo.discountAmount &&
        Number(promo.discountAmount) > 0 &&
        (!promo.discountPercent || Number(promo.discountPercent) === 0))
  )
}

const CATEGORY_OPTIONS = [
  'Niềng răng',
  'Trồng Răng Implant',
  'Cấy ghép Implant',
  'Răng sứ thẩm mỹ',
  'Nha Khoa Thẩm Mỹ',
  'Tẩy trắng răng',
  'Khám & Điều trị',
  'Nha Khoa Tổng Quát',
  'Nha khoa trẻ em',
  'Tất cả danh mục',
]

const toInputDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toApiLocalDateTime = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return null
  const pad = (num) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value || 0) + 'đ'

export default function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [modalError, setModalError] = useState('')
  const [lockedNotice, setLockedNotice] = useState(null)
  const [promoTab, setPromoTab] = useState('EVENT') // 'EVENT' | 'VOUCHER'

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [inspectPromo, setInspectPromo] = useState(null)
  const [deleteConfirmPromo, setDeleteConfirmPromo] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Extension Modal State
  const [extendPromo, setExtendPromo] = useState(null)
  const [extendOption, setExtendOption] = useState('30')
  const [customExtendDays, setCustomExtendDays] = useState('')
  const [submittingExtend, setSubmittingExtend] = useState(false)

  // Service search inside Modal
  const [serviceSearch, setServiceSearch] = useState('')

  // View Mode: 'list' (compact table/rows) vs 'grid' (cards)
  const [viewMode, setViewMode] = useState('list')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'upcoming', 'expired'
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'VOUCHER', 'EVENT'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [discountFilter, setDiscountFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const [promotionRes, serviceList] = await Promise.all([
        api.get('/admin/promotions'),
        getServices(),
      ])
      setPromotions(promotionRes.data || [])
      setServices(serviceList || [])
    } catch {
      toast.error('Không thể tải danh sách chương trình ưu đãi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleService = (serviceId) => {
    setForm((prev) => {
      const exists = prev.serviceIds.includes(serviceId)
      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      }
    })
  }

  const getServicePromo = (service) => {
    if (service.promotionId) {
      return {
        promotionId: service.promotionId,
        promotionTitle: service.promotionTitle || 'Chương trình ưu đãi khác',
      }
    }
    for (const promo of promotions) {
      if (promo.services?.some((s) => s.id === service.id)) {
        return {
          promotionId: promo.id,
          promotionTitle: promo.title,
        }
      }
    }
    return null
  }

  const handleServiceCardClick = (service) => {
    const promoInfo = getServicePromo(service)
    if (promoInfo && promoInfo.promotionId !== editingId) {
      setLockedNotice({
        serviceName: service.serviceName,
        promotionTitle: promoInfo.promotionTitle,
      })
      toast.error(
        `Dịch vụ "${service.serviceName}" đã được áp dụng cho chương trình: "${promoInfo.promotionTitle}"`
      )
      return
    }

    setLockedNotice(null)
    toggleService(service.id)
  }

  const toggleAllServices = () => {
    const availableServices = filteredServices.filter((s) => {
      const promoInfo = getServicePromo(s)
      return !promoInfo || promoInfo.promotionId === editingId
    })

    if (!availableServices.length) {
      toast.error('Tất cả dịch vụ đang hiển thị đều đã được áp dụng chương trình khuyến mãi khác!')
      return
    }

    const availableIds = availableServices.map((s) => s.id)
    const allSelected = availableIds.every((id) => form.serviceIds.includes(id))

    if (allSelected) {
      updateForm(
        'serviceIds',
        form.serviceIds.filter((id) => !availableIds.includes(id))
      )
    } else {
      const merged = Array.from(new Set([...form.serviceIds, ...availableIds]))
      updateForm('serviceIds', merged)
    }
  }

  const handleSwitchPromoTab = (newTab) => {
    if (newTab === promoTab) return
    setPromoTab(newTab)
    setModalError('')
    setLockedNotice(null)
    setForm((prev) => ({
      ...prev,
      couponCode: '',
      usageLimit: '',
      discountAmount: '',
      discountPercent: '',
      maxDiscountAmount: '',
      serviceIds: [],
      applyAllServices: false,
    }))
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setPromoTab('EVENT')
    setModalError('')
    setLockedNotice(null)
    setServiceSearch('')
    setIsFormModalOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const url = await uploadImage(file)
      updateForm('imageUrl', url)
      toast.success('Tải ảnh chương trình thành công.')
    } catch (err) {
      console.error('Lỗi tải ảnh:', err)
      toast.error('Tải ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
    }
  }

  const openEditModal = (promotion) => {
    setEditingId(promotion.id)
    const isVoucher = Boolean(
      promotion.promotionType === 'VOUCHER' ||
        (promotion.couponCode && promotion.couponCode.trim()) ||
        (promotion.discountAmount &&
          Number(promotion.discountAmount) > 0 &&
          (!promotion.discountPercent || Number(promotion.discountPercent) === 0))
    )
    setPromoTab(isVoucher ? 'VOUCHER' : 'EVENT')
    setForm({
      title: promotion.title || '',
      couponCode: promotion.couponCode || '',
      category: promotion.category || 'Niềng răng',
      description: promotion.description || '',
      imageUrl: promotion.imageUrl || '',
      discountType: isVoucher ? 'AMOUNT' : 'PERCENT',
      discountPercent: promotion.discountPercent || '',
      discountAmount: promotion.discountAmount || '',
      maxDiscountAmount: promotion.maxDiscountAmount || '',
      minOrderAmount: promotion.minOrderAmount || '',
      usageLimit: promotion.usageLimit || '',
      applyAllServices: Boolean(promotion.applyAllServices),
      status: promotion.status || 'ACTIVE',
      startDate: toInputDate(promotion.startDate),
      endDate: toInputDate(promotion.endDate),
      serviceIds: (promotion.services || []).map((service) => service.id),
    })
    setModalError('')
    setLockedNotice(null)
    setServiceSearch('')
    setIsFormModalOpen(true)
  }

  const closeModal = () => {
    setIsFormModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setModalError('')
  }

  const openDetailInspect = (promo) => {
    setInspectPromo(promo)
    setIsDetailModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    const isVoucher = promoTab === 'VOUCHER'

    if (!form.startDate || !form.endDate) {
      setModalError('Vui lòng chọn thời gian bắt đầu và kết thúc.')
      return toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc.')
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setModalError('Ngày kết thúc phải sau ngày bắt đầu.')
      return toast.error('Ngày kết thúc phải sau ngày bắt đầu.')
    }

    if (isVoucher) {
      if (!form.couponCode || !form.couponCode.trim()) {
        const msg = 'Vui lòng nhập mã Coupon / Voucher (ví dụ: SUMMER2026).'
        setModalError(msg)
        return toast.error(msg)
      }
      if (!form.discountAmount || Number(form.discountAmount) <= 0) {
        const msg = 'Vui lòng nhập số tiền giảm giá hợp lệ lớn hơn 0đ (VNĐ).'
        setModalError(msg)
        return toast.error(msg)
      }
    } else {
      if (
        !form.discountPercent ||
        Number(form.discountPercent) <= 0 ||
        Number(form.discountPercent) > 100
      ) {
        const msg = 'Vui lòng nhập phần trăm giảm giá hợp lệ (từ 0.01% đến 100%).'
        setModalError(msg)
        return toast.error(msg)
      }
    }

    setSubmitting(true)
    const payload = {
      title: form.title?.trim() || null,
      couponCode: isVoucher && form.couponCode?.trim() ? form.couponCode.trim().toUpperCase() : null,
      category: isVoucher
        ? 'Voucher hóa đơn'
        : form.category?.trim() && form.category !== 'Tất cả danh mục'
        ? form.category.trim()
        : null,
      description: form.description?.trim() ? form.description.trim() : null,
      imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
      promotionType: isVoucher ? 'VOUCHER' : 'DISCOUNT_PERCENT',
      discountPercent:
        !isVoucher && form.discountPercent !== '' && form.discountPercent != null
          ? Number(form.discountPercent)
          : null,
      discountAmount:
        isVoucher && form.discountAmount !== '' && form.discountAmount != null
          ? Number(form.discountAmount)
          : null,
      maxDiscountAmount:
        !isVoucher && form.maxDiscountAmount !== '' && form.maxDiscountAmount != null
          ? Number(form.maxDiscountAmount)
          : null,
      minOrderAmount:
        form.minOrderAmount !== '' && form.minOrderAmount != null
          ? Number(form.minOrderAmount)
          : null,
      usageLimit:
        isVoucher && form.usageLimit !== '' && form.usageLimit != null
          ? parseInt(form.usageLimit)
          : null,
      applyAllServices: isVoucher ? false : Boolean(form.applyAllServices),
      status: form.status || 'ACTIVE',
      startDate: toApiLocalDateTime(form.startDate),
      endDate: toApiLocalDateTime(form.endDate),
      serviceIds: isVoucher ? [] : form.applyAllServices ? [] : form.serviceIds || [],
    }

    try {
      if (editingId) {
        await api.put(`/admin/promotions/${editingId}`, payload)
        toast.success('Đã cập nhật chương trình ưu đãi thành công.')
      } else {
        await api.post('/admin/promotions', payload)
        toast.success('Đã tạo chương trình ưu đãi mới thành công.')
      }
      closeModal()
      await loadData()
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        'Không thể lưu thông tin ưu đãi. Vui lòng kiểm tra lại các trường thông tin.'
      setModalError(errMsg)
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const isPromoExpiringSoon = (promo) => {
    if (!promo || !promo.endDate) return false
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(promo.endDate)
    const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    const diffDays = Math.ceil((endOfDay - startOfToday) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  const getExtendTooltip = (promo) => {
    if (!promo) return ''
    const status = getPromotionStatus(promo)
    if (status.code === 'expired') return 'Chương trình đã kết thúc, không thể gia hạn'
    if (!isPromoExpiringSoon(promo)) return 'Chỉ có thể gia hạn khi ưu đãi sắp hết hạn (còn ≤ 7 ngày)'
    return `Gia hạn ưu đãi "${promo.title}"`
  }

  const openExtendModal = (promo) => {
    if (!promo) return
    if (!isPromoExpiringSoon(promo)) return
    setExtendPromo(promo)
    setExtendOption('30')
    setCustomExtendDays('')
  }

  const closeExtendModal = () => {
    setExtendPromo(null)
    setExtendOption('30')
    setCustomExtendDays('')
    setSubmittingExtend(false)
  }

  const getExtendDaysCount = () => {
    if (extendOption === 'custom') {
      return Math.max(1, parseInt(customExtendDays) || 0)
    }
    return parseInt(extendOption) || 30
  }

  const calculateNewEndDate = (promo, days) => {
    if (!promo || !promo.endDate) return null
    const currentEnd = new Date(promo.endDate)
    const baseTime = currentEnd.getTime() < Date.now() ? Date.now() : currentEnd.getTime()
    return new Date(baseTime + days * 24 * 60 * 60 * 1000)
  }

  const handleConfirmExtend = async () => {
    if (!extendPromo) return
    const days = getExtendDaysCount()
    if (days <= 0) {
      return toast.error('Vui lòng nhập số ngày gia hạn hợp lệ.')
    }

    const newEnd = calculateNewEndDate(extendPromo, days)
    if (!newEnd) return

    setSubmittingExtend(true)
    try {
      await api.put(`/admin/promotions/${extendPromo.id}/extend?days=${days}`)
      toast.success(`Đã gia hạn thành công ưu đãi "${extendPromo.title}" thêm ${days} ngày!`)
      closeExtendModal()
      await loadData()
    } catch (err) {
      console.error('Lỗi gia hạn ưu đãi:', err)
      toast.error(err.response?.data?.message || 'Không thể gia hạn ưu đãi. Đã xảy ra lỗi hệ thống.')
    } finally {
      setSubmittingExtend(false)
    }
  }

  const handleDelete = (promotion) => {
    setDeleteConfirmPromo(promotion)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmPromo) return
    try {
      setDeleting(true)
      await api.delete(`/admin/promotions/${deleteConfirmPromo.id}`)
      toast.success(`Đã xóa ưu đãi "${deleteConfirmPromo.title}" thành công.`)
      setDeleteConfirmPromo(null)
      await loadData()
    } catch {
      toast.error('Không thể xóa ưu đãi. Đã xảy ra lỗi hệ thống.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredServices = useMemo(() => {
    let list = services
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.serviceName?.toLowerCase().includes(q) ||
          s.serviceCode?.toLowerCase().includes(q) ||
          String(s.category || '').toLowerCase().includes(q) ||
          s.subCategory?.toLowerCase().includes(q)
      )
    }
    return list
  }, [services, serviceSearch])

  const getPromotionStatus = (promo) => {
    const now = new Date()
    const start = new Date(promo.startDate)
    const end = new Date(promo.endDate)

    if (now < start)
      return {
        label: 'Sắp diễn ra',
        code: 'upcoming',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dotClass: 'bg-amber-500',
      }
    if (now > end)
      return {
        label: 'Đã kết thúc',
        code: 'expired',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/80',
        dotClass: 'bg-slate-400',
      }
    return {
      label: 'Đang diễn ra',
      code: 'active',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
      dotClass: 'bg-teal-500 animate-pulse',
    }
  }

  // Dashboard Stats
  const stats = useMemo(() => {
    const total = promotions.length
    let active = 0
    let expiring = 0
    let expired = 0
    let upcoming = 0
    let vouchers = 0
    let events = 0
    const activeServiceIds = new Set()
    const categoryCounts = {}

    promotions.forEach((p) => {
      if (isVoucherPromo(p)) {
        vouchers++
      } else {
        events++
      }

      const status = getPromotionStatus(p)
      const cat = p.category || 'Khác'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

      if (status.code === 'active') {
        active++
        p.services?.forEach((s) => activeServiceIds.add(s.id))
      } else if (status.code === 'expired') {
        expired++
      } else if (status.code === 'upcoming') {
        upcoming++
      }

      if (isPromoExpiringSoon(p)) {
        expiring++
      }
    })

    const categoryDistribution = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      total,
      active,
      upcoming,
      expiring,
      expired,
      vouchers,
      events,
      activeServicesCount: activeServiceIds.size,
      categoryDistribution,
    }
  }, [promotions])

  // AI Campaign Insights
  const smartInsights = useMemo(() => {
    const insights = []
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const expiringList = promotions
      .filter((p) => {
        if (!p.endDate) return false
        const end = new Date(p.endDate)
        const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
        const diffDays = Math.ceil((endOfDay - startOfToday) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))

    expiringList.forEach((expiring) => {
      const end = new Date(expiring.endDate)
      const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      const diffDays = Math.ceil((endOfDay - startOfToday) / (1000 * 60 * 60 * 24))
      const dayText = diffDays === 0 ? 'hôm nay' : `còn ${diffDays} ngày`

      insights.push({
        id: `expiring-${expiring.id}`,
        title: `Ưu đãi "${expiring.title}" sắp hết hạn (${dayText})`,
        desc: `Chương trình kết thúc vào ${formatDate(expiring.endDate)}. Gia hạn ngay để tiếp tục thu hút bệnh nhân.`,
        badge: 'Cần gia hạn',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        remainingDaysText: `Gia hạn ngay (+30 ngày)`,
        onAction: () => openExtendModal(expiring),
      })
    })

    return insights
  }, [promotions])

  // Search & Filtered Promotions
  const processedPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = promo.title?.toLowerCase().includes(q)
        const matchCat = promo.category?.toLowerCase().includes(q)
        const matchCode = promo.couponCode?.toLowerCase().includes(q)
        const matchService = promo.services?.some((s) => s.serviceName?.toLowerCase().includes(q))
        if (!matchTitle && !matchCat && !matchCode && !matchService) return false
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'expiring') {
          if (!isPromoExpiringSoon(promo)) return false
        } else {
          const status = getPromotionStatus(promo)
          if (status.code !== statusFilter) return false
        }
      }

      if (typeFilter !== 'all') {
        const isV = isVoucherPromo(promo)
        if (typeFilter === 'VOUCHER' && !isV) return false
        if (typeFilter === 'EVENT' && isV) return false
      }

      if (categoryFilter !== 'all') {
        if (promo.category !== categoryFilter) return false
      }

      if (discountFilter !== 'all') {
        const disc = Number(promo.discountPercent || 0)
        if (discountFilter === 'high' && disc < 20) return false
        if (discountFilter === 'medium' && (disc < 10 || disc >= 20)) return false
        if (discountFilter === 'low' && disc >= 10) return false
      }

      return true
    })
  }, [promotions, searchQuery, statusFilter, typeFilter, categoryFilter, discountFilter])

  return (
    <div className="space-y-5 pb-6 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>Chương Trình Ưu Đãi Nha Khoa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các chương trình ưu đãi, voucher và áp dụng khuyến mãi cho dịch vụ nha khoa
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all duration-200 active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Ưu Đãi Mới</span>
        </button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex items-center justify-between group">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Ưu Đãi</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              <span className="text-violet-600 font-bold">{stats.vouchers}</span> Voucher · <span className="text-sky-600 font-bold">{stats.events}</span> Sự kiện
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex items-center justify-between group">
          <div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              Đang Diễn Ra
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5 tracking-tight">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-200 flex items-center justify-between group">
          <div>
            <p className="text-xs text-slate-500 font-medium">Sắp Diễn Ra</p>
            <p className="text-2xl font-bold text-amber-700 mt-0.5 tracking-tight">{stats.upcoming}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Discounted Services */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-200 transition-all duration-200 flex items-center justify-between group">
          <div>
            <p className="text-xs text-slate-500 font-medium">Dịch Vụ Áp Dụng</p>
            <p className="text-2xl font-bold text-teal-800 mt-0.5 tracking-tight">
              {stats.activeServicesCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 2: Analytics & Smart Campaign Spotlight */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        {/* Category Promotion Analytics Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Phân Phối Ưu Đãi Theo Danh Mục
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              Tỷ lệ bao phủ %
            </span>
          </div>

          <div className="flex-1 my-1 max-h-[240px] overflow-y-auto space-y-2.5 pr-1 py-1">
            {stats.categoryDistribution.length ? (
              stats.categoryDistribution.map((item) => (
                <div
                  key={item.name}
                  className="group rounded-xl p-2 hover:bg-slate-50/80 transition duration-150 space-y-1.5 border border-transparent hover:border-slate-200/60"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      <span className="font-semibold text-slate-800 group-hover:text-teal-700 transition">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium text-[11px]">
                        {item.count} chương trình
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px] min-w-[42px] text-center shadow-2xs">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 shadow-2xs"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu danh mục.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              Tổng danh mục:{' '}
              <strong className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                {stats.categoryDistribution.length}
              </strong>
            </span>
            <span>
              Phủ sóng:{' '}
              <strong className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {stats.activeServicesCount} dịch vụ nha khoa
              </strong>
            </span>
          </div>
        </div>

        {/* Quick Campaign Action Spotlight Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Gợi Ý & Nhắc Nhở Ưu Đãi
              </h3>
            </div>
          </div>

          <div className="flex-1 my-1 max-h-[240px] overflow-y-auto space-y-2.5 pr-1 py-1">
            {smartInsights.length > 0 ? (
              smartInsights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3 hover:border-slate-300 transition duration-150 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                    {item.remainingDaysText && (
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 text-[11px] font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>{item.remainingDaysText}</span>
                      </button>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-4 text-center text-xs text-teal-800 font-medium flex flex-col items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>Tất cả các chiến dịch khuyến mãi đều đang vận hành tối ưu!</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Giám sát: <strong className="text-slate-800 font-semibold">Tự động</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Đề xuất: </span>
              <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                {smartInsights.length} hành động
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Promotions Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 sm:p-4.5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 bg-gradient-to-b from-teal-600 to-emerald-600 rounded-full" />
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Danh Sách Chương Trình Ưu Đãi
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, mã code, dịch vụ..."
                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-0.5 text-slate-600 border border-slate-200/60 shrink-0">
                <button
                  onClick={() => setViewMode('list')}
                  title="Hiển thị dạng danh sách"
                  className={`rounded-lg px-2.5 py-1 transition flex items-center gap-1.5 text-xs cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-teal-700 shadow-sm font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Bảng</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Hiển thị dạng thẻ"
                  className={`rounded-lg px-2.5 py-1 transition flex items-center gap-1.5 text-xs cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-teal-700 shadow-sm font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Thẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Status Tabs + Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/90 p-1 text-xs font-medium text-slate-600 border border-slate-200/60">
              {[
                { key: 'all', label: 'Tất cả', count: stats.total },
                { key: 'active', label: 'Đang chạy', count: stats.active },
                { key: 'expiring', label: 'Sắp hết hạn', count: stats.expiring },
                { key: 'expired', label: 'Đã hết hạn', count: stats.expired },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs font-bold'
                      : 'hover:text-teal-700'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition cursor-pointer"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="VOUCHER">Mã Voucher</option>
                <option value="EVENT">Chương trình Sự kiện</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition cursor-pointer"
              >
                <option value="all">Tất cả mức giảm</option>
                <option value="high">Mức giảm lớn (≥ 20%)</option>
                <option value="medium">Mức giảm vừa (10% - 20%)</option>
                <option value="low">Mức giảm nhỏ (&lt; 10%)</option>
              </select>

              {(searchQuery ||
                statusFilter !== 'all' ||
                typeFilter !== 'all' ||
                categoryFilter !== 'all' ||
                discountFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setTypeFilter('all')
                    setCategoryFilter('all')
                    setDiscountFilter('all')
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 text-xs font-semibold transition border border-slate-200/80 cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Promotions Display Container */}
        <div className="max-h-[640px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium uppercase tracking-wider flex flex-col items-center justify-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mb-2" />
              <p>Đang tải danh sách ưu đãi...</p>
            </div>
          ) : processedPromotions.length ? (
            viewMode === 'list' ? (
              /* Compact Rows List View (TỐI ĐA 3 DỊCH VỤ + SỐ LƯỢNG KHÔNG VỠ LAYOUT) */
              <div className="divide-y divide-slate-100">
                {processedPromotions.map((promo) => {
                  const status = getPromotionStatus(promo)
                  const hasMoreServices = (promo.services || []).length > 3

                  return (
                    <div
                      key={promo.id}
                      className="p-4 sm:p-4.5 hover:bg-teal-50/20 transition duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900/5 border border-slate-200/80 shadow-2xs flex items-center justify-center">
                          {promo.imageUrl ? (
                            <>
                              <img
                                src={promo.imageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover blur-sm scale-110 opacity-30 pointer-events-none"
                              />
                              <img
                                src={promo.imageUrl}
                                alt={promo.title}
                                className="relative z-10 h-full w-full object-contain p-0.5"
                              />
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-teal-50 text-[10px] font-bold text-teal-800">
                              Crown
                            </div>
                          )}
                          <span className="absolute top-1 left-1 z-20 rounded bg-gradient-to-r from-teal-600 to-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase shadow-2xs">
                            {formatDiscountBadge(promo)}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className="font-bold text-slate-900 text-sm leading-snug hover:text-teal-700 transition cursor-pointer"
                              onClick={() => openDetailInspect(promo)}
                            >
                              {promo.title}
                            </h4>

                            {/* Badge Loại Ưu Đãi: Voucher vs Sự Kiện */}
                            {isVoucherPromo(promo) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200/90 px-2.5 py-0.5 text-[10px] font-bold shadow-2xs">
                                <Ticket className="w-3 h-3 text-violet-600" />
                                <span>Voucher</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/90 px-2.5 py-0.5 text-[10px] font-bold shadow-2xs">
                                <Sparkles className="w-3 h-3 text-sky-600" />
                                <span>Sự kiện</span>
                              </span>
                            )}

                            {promo.couponCode && (
                              <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-800 tracking-wider">
                                {promo.couponCode}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${status.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                              {promo.category || 'Dịch vụ'}
                            </span>
                          </div>

                          {/* Applied Services (Tối đa 3 dịch vụ + Số lượng còn lại) */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                              Áp dụng:
                            </span>
                            {promo.applyAllServices ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Toàn bộ dịch vụ / Hóa đơn
                              </span>
                            ) : (promo.services || []).length > 0 ? (
                              <>
                                {(promo.services || []).slice(0, 3).map((svc) => (
                                  <span
                                    key={svc.id}
                                    className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 max-w-[180px] truncate"
                                    title={svc.serviceName}
                                  >
                                    {svc.serviceName}
                                  </span>
                                ))}
                                {hasMoreServices && (
                                  <button
                                    type="button"
                                    onClick={() => openDetailInspect(promo)}
                                    className="inline-flex items-center rounded-md bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 text-[11px] font-bold text-teal-800 cursor-pointer transition shadow-2xs"
                                    title={(promo.services || [])
                                      .slice(3)
                                      .map((s) => s.serviceName)
                                      .join(', ')}
                                  >
                                    +{(promo.services || []).length - 3} dịch vụ khác
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                Áp dụng trên toàn hóa đơn
                              </span>
                            )}
                          </div>

                          {/* Time */}
                          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
                        <button
                          disabled={!isPromoExpiringSoon(promo)}
                          onClick={() => openExtendModal(promo)}
                          title={getExtendTooltip(promo)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                            isPromoExpiringSoon(promo)
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs cursor-pointer active:scale-95'
                              : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Gia hạn</span>
                        </button>
                        <button
                          onClick={() => openDetailInspect(promo)}
                          className="rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-teal-800 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => openEditModal(promo)}
                          className="rounded-xl bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          className="rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/60 px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Visual Grid Cards View */
              <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {processedPromotions.map((promo) => {
                  const status = getPromotionStatus(promo)
                  return (
                    <div
                      key={promo.id}
                      className="flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-200 hover:shadow-md transition duration-200"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-slate-900/5 flex items-center justify-center border-b border-slate-100">
                        {promo.imageUrl ? (
                          <>
                            <img
                              src={promo.imageUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
                            />
                            <img
                              src={promo.imageUrl}
                              alt={promo.title}
                              className="relative z-10 h-full w-full object-contain p-1.5 drop-shadow-xs"
                            />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-teal-50 text-xs font-bold text-teal-800">
                            Crown Dental
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 z-20 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-2 py-0.5 text-xs font-bold text-white uppercase shadow-xs">
                          {formatDiscountBadge(promo)}
                        </span>
                        <span
                          className={`absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md shadow-2xs ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Badge Loại Ưu Đãi: Voucher vs Sự Kiện */}
                              {isVoucherPromo(promo) ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200/90 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                                  <Ticket className="w-3 h-3 text-violet-600" />
                                  <span>Voucher</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/90 px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                                  <Sparkles className="w-3 h-3 text-sky-600" />
                                  <span>Sự kiện</span>
                                </span>
                              )}
                              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {promo.category || 'Dịch vụ'}
                              </span>
                              {promo.couponCode && (
                                <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-800">
                                  {promo.couponCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                            </span>
                          </div>

                          <h4
                            className="font-bold text-slate-900 text-sm leading-snug mt-2 hover:text-teal-700 transition cursor-pointer line-clamp-1"
                            onClick={() => openDetailInspect(promo)}
                          >
                            {promo.title}
                          </h4>

                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {promo.description || 'Không có mô tả chi tiết'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            <span className="font-semibold text-slate-700">Áp dụng: </span>
                            {promo.applyAllServices ? (
                              <span className="font-semibold text-emerald-700">
                                Toàn bộ dịch vụ / Hóa đơn
                              </span>
                            ) : (promo.services && promo.services.length > 0) ? (
                              <span>
                                {promo.services.slice(0, 3).map((s) => s.serviceName).join(', ')}
                                {promo.services.length > 3 ? ` (+${promo.services.length - 3})` : ''}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">Áp dụng trên hóa đơn</span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              disabled={!isPromoExpiringSoon(promo)}
                              onClick={() => openExtendModal(promo)}
                              title={getExtendTooltip(promo)}
                              className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                                isPromoExpiringSoon(promo)
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                              }`}
                            >
                              Gia hạn
                            </button>
                            <button
                              onClick={() => openDetailInspect(promo)}
                              className="rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => openEditModal(promo)}
                              className="rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(promo)}
                              className="rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              Không tìm thấy chương trình ưu đãi nào phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: FORM CREATE / EDIT */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        editingId={editingId}
        promoTab={promoTab}
        setPromoTab={setPromoTab}
        form={form}
        updateForm={updateForm}
        handleSwitchPromoTab={handleSwitchPromoTab}
        handleImageUpload={handleImageUpload}
        uploadingImage={uploadingImage}
        services={services}
        filteredServices={filteredServices}
        serviceSearch={serviceSearch}
        setServiceSearch={setServiceSearch}
        toggleAllServices={toggleAllServices}
        handleServiceCardClick={handleServiceCardClick}
        getServicePromo={getServicePromo}
        modalError={modalError}
        lockedNotice={lockedNotice}
        submitting={submitting}
        handleSubmit={handleSubmit}
        onClose={closeModal}
        CATEGORY_OPTIONS={CATEGORY_OPTIONS}
        formatMoney={formatMoney}
      />

      {/* MODAL 2: INSPECT DETAIL */}
      <PromotionDetailModal
        isOpen={isDetailModalOpen}
        promo={inspectPromo}
        onClose={() => setIsDetailModalOpen(false)}
        onOpenEdit={(promo) => openEditModal(promo)}
        onOpenExtend={(promo) => openExtendModal(promo)}
        isPromoExpiringSoon={isPromoExpiringSoon}
        getExtendTooltip={getExtendTooltip}
        formatMoney={formatMoney}
        formatDate={formatDate}
        formatDiscountBadge={formatDiscountBadge}
      />

      {/* MODAL 3: EXTEND PROMOTION */}
      <PromotionExtendModal
        isOpen={Boolean(extendPromo)}
        promo={extendPromo}
        extendOption={extendOption}
        setExtendOption={setExtendOption}
        customExtendDays={customExtendDays}
        setCustomExtendDays={setCustomExtendDays}
        submittingExtend={submittingExtend}
        onConfirm={handleConfirmExtend}
        onClose={closeExtendModal}
        formatDate={formatDate}
        calculateNewEndDate={calculateNewEndDate}
        getExtendDaysCount={getExtendDaysCount}
      />

      {/* MODAL 4: DELETE CONFIRMATION */}
      <PromotionDeleteModal
        isOpen={Boolean(deleteConfirmPromo)}
        promo={deleteConfirmPromo}
        deleting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirmPromo(null)}
      />
    </div>
  )
}
