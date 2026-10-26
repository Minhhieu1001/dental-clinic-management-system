import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/axios'
import { getServices } from '../../services/api'
import { uploadImage } from '../../services/media.service'

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
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [inspectPromo, setInspectPromo] = useState(null)
  const [deleteConfirmPromo, setDeleteConfirmPromo] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Extension Modal State
  const [extendPromo, setExtendPromo] = useState(null)
  const [extendOption, setExtendOption] = useState('30') // '7', '30', '60', '90', '180', 'custom'
  const [customExtendDays, setCustomExtendDays] = useState('')
  const [submittingExtend, setSubmittingExtend] = useState(false)

  // Service list search filter inside Modal
  const [serviceSearch, setServiceSearch] = useState('')

  // View Mode: 'list' (compact table/rows) vs 'grid' (visual cards)
  const [viewMode, setViewMode] = useState('list')

  // Promotion list search & filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'upcoming', 'expired'
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
      setError('Không thể tải dữ liệu ưu đãi. Vui lòng kiểm tra quyền quản trị hoặc kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss success notification message after 3 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      setMessage('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [message])

  // Auto-dismiss error notification message after 3 seconds
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => {
      setError('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [error])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleService = (id) => {
    updateForm(
      'serviceIds',
      form.serviceIds.includes(id)
        ? form.serviceIds.filter((item) => item !== id)
        : [...form.serviceIds, id]
    )
  }

  const toggleAllServices = () => {
    const visibleServiceIds = filteredServices.map((s) => s.id)
    const allSelected = visibleServiceIds.every((id) => form.serviceIds.includes(id))

    if (allSelected) {
      updateForm(
        'serviceIds',
        form.serviceIds.filter((id) => !visibleServiceIds.includes(id))
      )
    } else {
      const merged = Array.from(new Set([...form.serviceIds, ...visibleServiceIds]))
      updateForm('serviceIds', merged)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setMessage('')
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
      setMessage('Tải ảnh chương trình thành công.')
    } catch (err) {
      console.error('Lỗi tải ảnh:', err)
      setError('Tải ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
    }
  }

  const openEditModal = (promotion) => {
    setEditingId(promotion.id)
    const isAmount = Boolean(
      promotion.discountAmount &&
      Number(promotion.discountAmount) > 0 &&
      (!promotion.discountPercent || Number(promotion.discountPercent) === 0)
    )
    setForm({
      title: promotion.title || '',
      couponCode: promotion.couponCode || '',
      category: promotion.category || 'Niềng răng',
      description: promotion.description || '',
      imageUrl: promotion.imageUrl || '',
      discountType: isAmount ? 'AMOUNT' : 'PERCENT',
      discountPercent: promotion.discountPercent || '',
      discountAmount: promotion.discountAmount || '',
      maxDiscountAmount: promotion.maxDiscountAmount || '',
      minOrderAmount: promotion.minOrderAmount || '',
      usageLimit: promotion.usageLimit || '',
      applyAllServices: Boolean(promotion.applyAllServices || (!promotion.services || promotion.services.length === 0)),
      status: promotion.status || 'ACTIVE',
      startDate: toInputDate(promotion.startDate),
      endDate: toInputDate(promotion.endDate),
      serviceIds: (promotion.services || []).map((service) => service.id),
    })
    setError('')
    setMessage('')
    setServiceSearch('')
    setIsFormModalOpen(true)
  }

  const closeModal = () => {
    setIsFormModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const openDetailInspect = (promo) => {
    setInspectPromo(promo)
    setIsDetailModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.applyAllServices && !form.serviceIds.length) {
      return setError('Vui lòng chọn ít nhất một dịch vụ áp dụng, hoặc tích chọn "Áp dụng cho toàn bộ dịch vụ".')
    }

    if (!form.startDate || !form.endDate) {
      return setError('Vui lòng chọn thời gian bắt đầu và kết thúc.')
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return setError('Ngày kết thúc phải sau ngày bắt đầu.')
    }

    const isAmount = form.discountType === 'AMOUNT'
    if (isAmount && (!form.discountAmount || Number(form.discountAmount) <= 0)) {
      return setError('Vui lòng nhập số tiền giảm giá hợp lệ lớn hơn 0đ.')
    }
    if (!isAmount && (!form.discountPercent || Number(form.discountPercent) <= 0)) {
      return setError('Vui lòng nhập phần trăm giảm giá hợp lệ (từ 0.01% đến 100%).')
    }

    setSubmitting(true)
    const payload = {
      title: form.title.trim(),
      couponCode: form.couponCode ? form.couponCode.trim().toUpperCase() : null,
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl,
      promotionType: form.couponCode ? 'VOUCHER' : (isAmount ? 'FIXED_AMOUNT' : 'DISCOUNT_PERCENT'),
      discountPercent: isAmount ? null : Number(form.discountPercent),
      discountAmount: isAmount ? Number(form.discountAmount) : null,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      applyAllServices: Boolean(form.applyAllServices),
      status: form.status || 'ACTIVE',
      startDate: toApiLocalDateTime(form.startDate),
      endDate: toApiLocalDateTime(form.endDate),
      serviceIds: form.applyAllServices ? [] : form.serviceIds,
    }

    try {
      if (editingId) {
        await api.put(`/admin/promotions/${editingId}`, payload)
        setMessage('Đã cập nhật chương trình ưu đãi thành công.')
      } else {
        await api.post('/admin/promotions', payload)
        setMessage('Đã tạo chương trình ưu đãi mới thành công.')
      }
      closeModal()
      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể lưu thông tin ưu đãi. Vui lòng kiểm tra lại các trường thông tin.'
      )
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
    setError('')
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
      return setError('Vui lòng nhập số ngày gia hạn hợp lệ.')
    }

    const newEnd = calculateNewEndDate(extendPromo, days)
    if (!newEnd) return

    setSubmittingExtend(true)
    try {
      await api.put(`/admin/promotions/${extendPromo.id}/extend?days=${days}`)
      setMessage(`Đã gia hạn thành công ưu đãi "${extendPromo.title}" thêm ${days} ngày!`)
      closeExtendModal()
      await loadData()
    } catch (err) {
      console.error('Lỗi gia hạn ưu đãi:', err)
      setError(err.response?.data?.message || 'Không thể gia hạn ưu đãi. Đã xảy ra lỗi hệ thống.')
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
      setMessage(`Đã xóa ưu đãi "${deleteConfirmPromo.title}" thành công.`)
      setDeleteConfirmPromo(null)
      await loadData()
    } catch {
      setError('Không thể xóa ưu đãi. Đã xảy ra lỗi hệ thống.')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered services inside Modal based on selected category & search query
  const filteredServices = useMemo(() => {
    let list = services

    // 1. Filter by chosen category if a specific category is picked
    const catChoice = (form.category || '').toLowerCase().trim()

    if (catChoice && catChoice !== 'tất cả danh mục' && catChoice !== 'tất cả') {
      list = list.filter((s) => {
        const catStr = String(s.category || '').toLowerCase()
        const subCatStr = String(s.subCategory || '').toLowerCase()
        const sName = String(s.serviceName || '').toLowerCase()

        if (catChoice.includes('implant') || catChoice.includes('cấy ghép')) {
          return (
            catStr === 'implant' ||
            catStr.includes('implant') ||
            catStr.includes('cấy ghép') ||
            subCatStr.includes('implant') ||
            sName.includes('implant') ||
            sName.includes('trụ')
          )
        }
        if (catChoice.includes('niềng')) {
          return (
            catStr === 'nieng_rang' ||
            catStr.includes('niềng') ||
            subCatStr.includes('mắc cài') ||
            sName.includes('mắc cài') ||
            sName.includes('niềng') ||
            sName.includes('invisalign') ||
            sName.includes('hàm duy trì') ||
            sName.includes('can thiệp sớm')
          )
        }
        if (catChoice.includes('tổng quát') || catChoice.includes('khám') || catChoice.includes('điều trị')) {
          return (
            catStr === 'kham_dieu_tri' ||
            catStr.includes('tổng quát') ||
            catStr.includes('khám') ||
            catStr.includes('điều trị') ||
            sName.includes('nhổ') ||
            sName.includes('trám') ||
            sName.includes('cạo vôi') ||
            sName.includes('khám') ||
            sName.includes('chữa tủy') ||
            sName.includes('tái tạo')
          )
        }
        if (catChoice.includes('thẩm mỹ') || catChoice.includes('răng sứ')) {
          return (
            catStr === 'rang_su' ||
            catStr.includes('thẩm mỹ') ||
            catStr.includes('răng sứ') ||
            sName.includes('sứ') ||
            sName.includes('veneer')
          )
        }
        if (catChoice.includes('trẻ em')) {
          return (
            catStr === 'nha_khoa_tre_em' ||
            catStr.includes('trẻ em') ||
            subCatStr.includes('trẻ em') ||
            sName.includes('trẻ em') ||
            sName.includes('can thiệp sớm')
          )
        }
        if (catChoice.includes('tẩy trắng')) {
          return (
            catStr === 'tay_trang' ||
            catStr.includes('tẩy trắng') ||
            sName.includes('tẩy trắng')
          )
        }

        return catStr.includes(catChoice) || subCatStr.includes(catChoice) || sName.includes(catChoice)
      })
    }

    // 2. Filter by search input inside Modal
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.serviceName?.toLowerCase().includes(q) ||
          String(s.category || '').toLowerCase().includes(q) ||
          s.subCategory?.toLowerCase().includes(q)
      )
    }

    return list
  }, [services, form.category, serviceSearch])

  // Get promotion status helper with minimal professional color scheme
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
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotClass: 'bg-emerald-500 animate-pulse',
    }
  }

  // Dashboard Stats calculation
  const stats = useMemo(() => {
    const total = promotions.length
    let active = 0
    let expiring = 0
    let expired = 0
    const activeServiceIds = new Set()
    const categoryCounts = {}

    promotions.forEach((p) => {
      const status = getPromotionStatus(p)
      const cat = p.category || 'Khác'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

      if (status.code === 'active') {
        active++
        p.services?.forEach((s) => activeServiceIds.add(s.id))
      } else if (status.code === 'expired') {
        expired++
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

    return { total, active, expiring, expired, activeServicesCount: activeServiceIds.size, categoryDistribution }
  }, [promotions])

  // Compute Smart AI Campaign Insights
  const smartInsights = useMemo(() => {
    const insights = []
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 1. Check for expiring promotions (within 7 days based on calendar dates)
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

      let dayText = `Còn ${diffDays} ngày nữa sẽ kết thúc`
      let remainingDaysText = `Còn ${diffDays} ngày`

      if (diffDays === 0) {
        dayText = 'Kết thúc hôm nay'
        remainingDaysText = 'Hết hôm nay'
      } else if (diffDays === 1) {
        dayText = 'Còn 1 ngày nữa sẽ kết thúc'
        remainingDaysText = 'Còn 1 ngày'
      }

      insights.push({
        id: `expiring-${expiring.id}`,
        type: 'warning',
        badge: 'Nhắc nhở hết hạn',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90 font-bold',
        title: `Gói "${expiring.title}" sắp hết hạn`,
        desc: `${dayText} (${formatDate(expiring.endDate)}).`,
        actionText: 'Bấm gia hạn ngay',
        remainingDaysText: remainingDaysText,
        actionLabel: '+30 ngày',
        actionClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs',
        onAction: () => openExtendModal(expiring),
      })
    })

    // 2. Check category coverage gap
    const activeCats = promotions.map((p) => (p.category || '').toLowerCase())
    const missingCat = CATEGORY_OPTIONS.find((cat) => {
      const catLower = cat.toLowerCase()
      const isCovered = activeCats.some(
        (active) => active.includes(catLower) || catLower.includes(active)
      )
      return !isCovered
    })

    if (missingCat) {
      insights.push({
        id: 'missing-cat',
        type: 'opportunity',
        badge: 'Gợi ý kích cầu',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200/80',
        title: `Chưa có ưu đãi cho "${missingCat}"`,
        desc: `Tạo chương trình ưu đãi mới cho danh mục này để tăng tỷ lệ đăng ký dịch vụ.`,
        actionLabel: '+ Tạo gói ngay',
        actionClass: 'bg-[#005f73] hover:bg-[#0a9396] text-white shadow-xs',
        onAction: () => {
          setForm({
            title: `Ưu đãi ${missingCat} đặc biệt`,
            category: missingCat,
            description: `Giảm giá ưu đãi cho các dịch vụ thuộc ${missingCat}`,
            imageUrl: '',
            discountPercent: 15,
            startDate: toInputDate(new Date()),
            endDate: toInputDate(new Date(Date.now() + 30 * 86400000)),
            serviceIds: [],
          })
          setIsFormModalOpen(true)
        },
      })
    }

    // 3. Highlight Top Discount Campaign
    const topPromo = [...promotions].sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))[0]
    if (topPromo && topPromo.discountPercent > 0) {
      insights.push({
        id: 'top-discount',
        type: 'success',
        badge: 'Chiến dịch Hot nhất',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
        title: `"${topPromo.title}" (-${topPromo.discountPercent}%)`,
        desc: `Đang là gói ưu đãi tốt nhất áp dụng cho ${topPromo.services?.length || 0} dịch vụ tại phòng khám.`,
        actionLabel: 'Chi tiết',
        actionClass: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs',
        onAction: () => openDetailInspect(topPromo),
      })
    }

    return insights
  }, [promotions])

  // Processed promotions list (search + filter)
  const processedPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = promo.title?.toLowerCase().includes(q)
        const matchCat = promo.category?.toLowerCase().includes(q)
        const matchService = promo.services?.some((s) => s.serviceName?.toLowerCase().includes(q))
        if (!matchTitle && !matchCat && !matchService) return false
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'expiring') {
          if (!isPromoExpiringSoon(promo)) return false
        } else {
          const status = getPromotionStatus(promo)
          if (status.code !== statusFilter) return false
        }
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
  }, [promotions, searchQuery, statusFilter, categoryFilter, discountFilter])

  return (
    <div className="space-y-5 pb-4 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Chương Trình Ưu Đãi Nha Khoa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các chương trình ưu đãi, chiết khấu và áp dụng khuyến mãi cho dịch vụ nha khoa
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#005f73] hover:bg-[#0a9396] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all active:scale-95 shrink-0"
        >
          <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tạo Ưu Đãi Mới</span>
        </button>
      </div>

      {/* Floating Top-Right Toast Notifications - Soft Dental Medical Theme */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
        {message && (
          <div className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 p-3.5 text-xs font-semibold shadow-xl shadow-teal-900/5 border border-teal-200/80 flex items-center justify-between animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#005f73] text-white text-[11px] font-bold shrink-0 shadow-2xs">
                ✓
              </span>
              <span className="leading-snug text-slate-800 font-semibold">{message}</span>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition shrink-0 ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 p-3.5 text-xs font-semibold shadow-xl shadow-rose-900/5 border border-rose-200/80 flex items-center justify-between animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold shrink-0 shadow-2xs">
                !
              </span>
              <span className="leading-snug text-slate-800 font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition shrink-0 ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Promos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Ưu Đãi</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        {/* Active Promos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              Đang Diễn Ra
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Upcoming Promos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Sắp Diễn Ra</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.upcoming}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Discounted Services */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Dịch Vụ Áp Dụng</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.activeServicesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2: Advanced Management Analytics Card (Category Distribution & Smart Campaign Spotlight) */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        {/* Category Promotion Analytics Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#005f73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Phân Phối Ưu Đãi Theo Danh Mục Dịch Vụ
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <svg className="w-3.5 h-3.5 text-[#005f73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Tỷ lệ bao phủ %
            </span>
          </div>

          <div className="flex-1 my-1 max-h-[250px] overflow-y-auto space-y-2.5 pr-1 py-1">
            {stats.categoryDistribution.length ? (
              stats.categoryDistribution.map((item, idx) => {
                const gradients = [
                  'bg-gradient-to-r from-blue-500 to-cyan-500',
                  'bg-gradient-to-r from-emerald-500 to-teal-500',
                  'bg-gradient-to-r from-purple-500 to-indigo-500',
                  'bg-gradient-to-r from-cyan-500 to-teal-400',
                  'bg-gradient-to-r from-amber-500 to-orange-500',
                  'bg-gradient-to-r from-rose-500 to-pink-500',
                ]
                const barGradient = gradients[idx % gradients.length]
                const dotColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-cyan-500', 'bg-amber-500', 'bg-rose-500']
                const dotColor = dotColors[idx % dotColors.length]

                return (
                  <div
                    key={item.name}
                    className="group rounded-lg p-2 hover:bg-slate-50/80 transition duration-150 space-y-1.5 border border-transparent hover:border-slate-200/60"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        <span className="font-semibold text-slate-800 group-hover:text-[#005f73] transition">
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

                    <div className="h-2 w-full rounded-full bg-slate-100/90 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full ${barGradient} transition-all duration-500 shadow-2xs`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu danh mục.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              Tổng số danh mục: <strong className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">{stats.categoryDistribution.length}</strong>
            </span>
            <span>
              Phủ sóng: <strong className="text-[#005f73] font-bold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100/80">{stats.activeServicesCount} dịch vụ nha khoa</strong>
            </span>
          </div>
        </div>

        {/* Quick Campaign Action Spotlight Card (Gợi Ý & Nhắc Nhở Ưu Đãi) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#005f73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Gợi Ý & Nhắc Nhở Ưu Đãi
              </h3>
            </div>
          </div>

          {/* Dynamic Insights Container with Internal Scroll */}
          <div className="flex-1 my-1 max-h-[250px] overflow-y-auto space-y-2.5 pr-1 py-1">
            {smartInsights.length > 0 ? (
              smartInsights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-slate-50/70 border border-slate-200/70 p-2.5 hover:border-slate-300 transition duration-150 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.remainingDaysText ? (
                        <button
                          type="button"
                          onClick={item.onAction}
                          className="animate-wobble rounded-lg bg-rose-50/90 hover:bg-rose-100 text-rose-700 border border-rose-200/90 px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-rose-300"
                          title="Bấm để gia hạn thêm 30 ngày cho ưu đãi này"
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                          </span>
                          <span>{item.remainingDaysText}</span>
                        </button>
                      ) : item.onAction ? (
                        <button
                          type="button"
                          onClick={item.onAction}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition shrink-0 ${item.actionClass}`}
                        >
                          {item.actionLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.title}</h4>
                  <div className="text-[11px] text-slate-500 leading-snug flex flex-wrap items-center gap-1">
                    <span>{item.desc}</span>
                    {item.onAction && item.actionText && (
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="font-extrabold text-[#005f73] hover:text-[#0a9396] no-underline transition cursor-pointer hover:bg-teal-50 px-1 py-0.5 rounded text-[11px] inline-flex items-center active:scale-95"
                        title="Bấm để gia hạn thêm thời gian cho ưu đãi này"
                      >
                        <span>{item.actionText}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 text-center text-xs text-emerald-800 font-medium">
                ✨ Tất cả các chiến dịch khuyến mãi đều đang vận hành tối ưu!
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Giám sát: <strong className="text-slate-800 font-semibold">Tự động 24/7</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <span>Đề xuất: </span>
              <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[11px] font-bold text-[#005f73]">
                {smartInsights.length} hành động
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Promotions Table & Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters TopBar */}
        <div className="sticky top-0 z-10 bg-white p-4 sm:p-4.5 border-b border-slate-100 space-y-3 shadow-2xs">
          {/* Row 1: Section Title & Search + View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-[3.5px] bg-[#005f73] rounded-full" />
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Danh Sách Chương Trình Ưu Đãi</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên chương trình, dịch vụ..."
                  className="w-full sm:w-60 rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#005f73] focus:bg-white transition"
                />
                <svg
                  className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-slate-600 border border-slate-200/60 shrink-0">
                <button
                  onClick={() => setViewMode('list')}
                  title="Hiển thị dạng danh sách"
                  className={`rounded-md px-2 py-1 transition flex items-center gap-1.5 text-xs ${viewMode === 'list' ? 'bg-white text-[#005f73] shadow-2xs font-semibold' : 'hover:text-slate-900'
                    }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">Bảng</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Hiển thị dạng lưới thẻ"
                  className={`rounded-md px-2 py-1 transition flex items-center gap-1.5 text-xs ${viewMode === 'grid' ? 'bg-white text-[#005f73] shadow-2xs font-semibold' : 'hover:text-slate-900'
                    }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Thẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Status Tabs (Left) + Category & Discount Filters (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 pt-1.5 border-t border-slate-100">
            {/* Status Filter Tabs with Counter Badges */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-1 text-xs font-medium text-slate-600 border border-slate-200/60">
              {[
                { key: 'all', label: 'Tất cả', count: stats.total },
                { key: 'active', label: 'Đang chạy', count: stats.active },
                { key: 'expiring', label: 'Sắp hết hạn', count: stats.expiring },
                { key: 'expired', label: 'Đã hết hạn', count: stats.expired },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-md px-3 py-1 transition cursor-pointer ${statusFilter === tab.key
                    ? 'bg-[#005f73] text-white shadow-2xs font-semibold'
                    : 'hover:text-[#005f73]'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#005f73] transition"
              >
                <option value="all">Tất cả danh mục</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Discount Filter */}
              <select
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#005f73] transition"
              >
                <option value="all">Tất cả mức giảm</option>
                <option value="high">Mức giảm lớn (≥ 20%)</option>
                <option value="medium">Mức giảm vừa (10% - 20%)</option>
                <option value="low">Mức giảm nhỏ (&lt; 10%)</option>
              </select>

              {/* Reset button if any filter active */}
              {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || discountFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                    setDiscountFilter('all')
                  }}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 text-xs font-semibold transition border border-slate-200/80 flex items-center gap-1"
                >
                  ✕ Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Promotions Display Container with Internal Scroll */}
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#005f73] border-t-transparent mb-2" />
              <p>Đang tải danh sách ưu đãi...</p>
            </div>
          ) : processedPromotions.length ? (
            viewMode === 'list' ? (
              /* Compact Rows List View */
              <div className="divide-y divide-slate-100">
                {processedPromotions.map((promo) => {
                  const status = getPromotionStatus(promo)
                  return (
                    <div
                      key={promo.id}
                      className="p-4 sm:p-4.5 hover:bg-slate-50/70 transition duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                            <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[10px] font-bold text-blue-700">
                              Crown
                            </div>
                          )}
                          <span className="absolute top-1 left-1 z-20 rounded bg-[#ff5b15] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase shadow-2xs">
                            {formatDiscountBadge(promo)}
                          </span>
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className="font-bold text-slate-900 text-sm leading-snug hover:text-[#005f73] transition cursor-pointer"
                              onClick={() => openDetailInspect(promo)}
                            >
                              {promo.title}
                            </h4>
                            {promo.couponCode && (
                              <span className="rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 tracking-wider">
                                {promo.couponCode}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${status.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                            <span className="rounded-full bg-blue-50 border border-blue-100/80 px-2.5 py-0.5 text-[10px] font-medium text-blue-700">
                              {promo.category || 'Dịch vụ'}
                            </span>
                          </div>

                          {/* Applied Services summary */}
                          <div className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Áp dụng:</span>
                            {promo.applyAllServices || (!promo.services || promo.services.length === 0) ? (
                              <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                Toàn bộ dịch vụ / Hóa đơn
                              </span>
                            ) : (
                              promo.services.map((svc) => (
                                <span key={svc.id} className="inline-block rounded-md bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  {svc.serviceName}
                                </span>
                              ))
                            )}
                          </div>

                          {/* Time period */}
                          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            ⏱ Thời gian: {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
                        <button
                          disabled={!isPromoExpiringSoon(promo)}
                          onClick={() => openExtendModal(promo)}
                          title={getExtendTooltip(promo)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1 ${
                            isPromoExpiringSoon(promo)
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 shadow-2xs cursor-pointer'
                              : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <span>Gia hạn</span>
                        </button>
                        <button
                          onClick={() => openDetailInspect(promo)}
                          className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 text-xs font-medium transition"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => openEditModal(promo)}
                          className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 text-xs font-medium transition"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          className="rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60 px-3 py-1.5 text-xs font-medium transition"
                        >
                          Xóa
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
                      className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition duration-200"
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
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-xs font-bold text-blue-800">
                            Crown Dental
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 z-20 rounded bg-[#ff5b15] px-2 py-0.5 text-xs font-bold text-white uppercase shadow-xs">
                          {formatDiscountBadge(promo)}
                        </span>
                        <span className={`absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md shadow-2xs ${status.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-blue-50 border border-blue-100/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              {promo.category || 'Dịch vụ'}
                            </span>
                            {promo.couponCode && (
                              <span className="rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {promo.couponCode}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                            </span>
                          </div>

                          <h4
                            className="font-bold text-slate-900 text-sm leading-snug mt-2 hover:text-[#005f73] transition cursor-pointer"
                            onClick={() => openDetailInspect(promo)}
                          >
                            {promo.title}
                          </h4>

                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {promo.description || 'Không có mô tả chi tiết'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">Áp dụng: </span>
                            {promo.applyAllServices || (!promo.services || promo.services.length === 0) ? (
                              <span className="font-semibold text-emerald-700">Toàn bộ dịch vụ / Hóa đơn</span>
                            ) : (
                              promo.services.map(s => s.serviceName).join(', ')
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              disabled={!isPromoExpiringSoon(promo)}
                              onClick={() => openExtendModal(promo)}
                              title={getExtendTooltip(promo)}
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                isPromoExpiringSoon(promo)
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 shadow-2xs cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                              }`}
                            >
                              Gia hạn
                            </button>
                            <button
                              onClick={() => openDetailInspect(promo)}
                              className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium transition"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => openEditModal(promo)}
                              className="rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium transition"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(promo)}
                              className="rounded-md bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 text-xs font-medium transition"
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
            <div className="p-8 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">
              Không tìm thấy chương trình ưu đãi nào phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT PROMOTION MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs transition duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Chỉnh Sửa Chương Trình Ưu Đãi' : 'Tạo Chương Trình Ưu Đãi Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điền các thông tin khuyến mãi và lựa chọn dịch vụ áp dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleSubmit} className="overflow-y-auto pt-3.5 space-y-3.5 pr-1 flex-1">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200/80">
                  {error}
                </div>
              )}

              <div className="grid gap-3.5 md:grid-cols-2">
                {/* Tên chương trình */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên chương trình ưu đãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition"
                    placeholder="VD: Ưu đãi chào hè - Giảm 200.000đ hoặc Giảm 20% Niềng răng"
                  />
                </div>

                {/* Mã Coupon / Voucher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Coupon / Voucher (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={form.couponCode}
                    onChange={(e) => updateForm('couponCode', e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase text-slate-800 outline-none focus:border-[#005f73] transition"
                    placeholder="VD: SUMMER2026, CROWNVIP"
                  />
                </div>

                {/* Danh mục ưu đãi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh mục ưu đãi
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn loại giảm giá */}
                <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Hình thức giảm giá <span className="text-red-500">*</span>
                    </label>
                    <div className="flex rounded-lg bg-slate-200/70 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => updateForm('discountType', 'PERCENT')}
                        className={`rounded-md px-3 py-1 font-semibold transition ${
                          form.discountType === 'PERCENT'
                            ? 'bg-white text-[#005f73] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Giảm theo phần trăm (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm('discountType', 'AMOUNT')}
                        className={`rounded-md px-3 py-1 font-semibold transition ${
                          form.discountType === 'AMOUNT'
                            ? 'bg-white text-[#005f73] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Giảm số tiền cố định (VNĐ)
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.discountType === 'PERCENT' ? (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Mức giảm (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value={form.discountPercent}
                            onChange={(e) => updateForm('discountPercent', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] bg-white transition"
                            placeholder="VD: 20 (tức giảm 20%)"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Giảm tối đa (VNĐ) (Tùy chọn)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={form.maxDiscountAmount}
                            onChange={(e) => updateForm('maxDiscountAmount', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] bg-white transition"
                            placeholder="VD: 1000000 (tối đa 1 triệu)"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Số tiền giảm trực tiếp (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1000"
                          step="1000"
                          value={form.discountAmount}
                          onChange={(e) => updateForm('discountAmount', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] bg-white transition"
                          placeholder="VD: 200000 (giảm 200.000đ)"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Giá trị đơn hàng tối thiểu (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={form.minOrderAmount}
                        onChange={(e) => updateForm('minOrderAmount', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] bg-white transition"
                        placeholder="VD: 500000 (đơn từ 500k mới áp dụng)"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Giới hạn số lượt dùng (Lượt)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.usageLimit}
                        onChange={(e) => updateForm('usageLimit', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] bg-white transition"
                        placeholder="VD: 100 (để trống nếu không giới hạn)"
                      />
                    </div>
                  </div>
                </div>

                {/* URL / Tải ảnh chương trình */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ảnh chương trình (Dán URL hoặc Tải file lên)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => updateForm('imageUrl', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 text-xs shadow-2xs">
                      <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{uploadingImage ? 'Đang tải...' : 'Tải file'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                    </label>
                  </div>

                  {/* Image Preview Box */}
                  {form.imageUrl && (
                    <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-9 h-9 object-cover rounded-md border border-slate-200 shadow-2xs bg-white shrink-0"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=200&q=80'
                          }}
                        />
                        <div className="text-xs truncate min-w-0">
                          <p className="font-semibold text-slate-700 text-[11px]">Xem trước ảnh</p>
                          <p className="text-[10px] text-slate-400 truncate">{form.imageUrl}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateForm('imageUrl', '')}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-medium px-2 py-1 hover:bg-rose-50 rounded transition shrink-0 ml-2"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => updateForm('startDate', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition"
                  />
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => updateForm('endDate', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition"
                  />
                </div>

                {/* Áp dụng cho toàn bộ dịch vụ / Hóa đơn */}
                <div className="md:col-span-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.applyAllServices}
                      onChange={(e) => updateForm('applyAllServices', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#005f73] focus:ring-[#005f73]"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-950">
                        Áp dụng cho toàn bộ dịch vụ / Toàn bộ hóa đơn
                      </span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Tích chọn mục này nếu chương trình ưu đãi áp dụng chung cho mọi dịch vụ nha khoa hoặc giảm trực tiếp trên tổng hóa đơn.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Mô tả */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả chương trình
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows="3"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-[#005f73] transition"
                    placeholder="Nội dung, điều kiện áp dụng..."
                  />
                </div>
              </div>

              {/* Dịch vụ áp dụng Fieldset */}
              <fieldset className={`border-t border-slate-100 pt-3.5 transition ${form.applyAllServices ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5">
                  <div>
                    <legend className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>Dịch vụ áp dụng</span>
                      {!form.applyAllServices && <span className="text-red-500">*</span>}
                      {form.applyAllServices && (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Áp dụng tất cả dịch vụ
                        </span>
                      )}
                    </legend>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {form.applyAllServices
                        ? 'Đã bật chế độ áp dụng toàn bộ dịch vụ & hóa đơn.'
                        : `Đã chọn ${form.serviceIds.length} dịch vụ`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Tìm dịch vụ..."
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#005f73]"
                    />
                    <button
                      type="button"
                      onClick={toggleAllServices}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition shrink-0 border border-slate-200/60"
                    >
                      {filteredServices.every((s) => form.serviceIds.includes(s.id))
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-52 overflow-y-auto p-1 pr-1.5">
                  {filteredServices.length ? (
                    filteredServices.map((service) => {
                      const checked = form.serviceIds.includes(service.id)
                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition ${checked
                            ? 'border-[#005f73] bg-teal-50/60 text-[#005f73] font-medium'
                            : 'border-slate-200/80 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="mt-0.5 rounded border-slate-300 text-[#005f73] focus:ring-[#005f73]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block truncate font-medium text-xs">{service.serviceName}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                              {formatMoney(service.price)}
                            </span>
                          </div>
                        </label>
                      )
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center text-xs text-slate-500">
                      <p>Không tìm thấy dịch vụ nào thuộc danh mục <span className="font-bold text-slate-800">"{form.category}"</span>.</p>
                      <button
                        type="button"
                        onClick={() => updateForm('category', 'Tất cả danh mục')}
                        className="mt-1.5 inline-block text-xs font-bold text-[#005f73] hover:underline"
                      >
                        Hiện tất cả dịch vụ
                      </button>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-3.5 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition border border-slate-200/80"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#005f73] hover:bg-[#0a9396] px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : editingId ? 'Lưu cập nhật' : 'Tạo ưu đãi ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL INSPECT MODAL */}
      {isDetailModalOpen && inspectPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs transition duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200/80 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-[#ff5b15] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                  {formatDiscountBadge(inspectPromo)}
                </span>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {inspectPromo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pt-4 space-y-4 flex-1 pr-1">
              {inspectPromo.imageUrl && (
                <div className="relative w-full overflow-hidden rounded-xl bg-slate-900/5 border border-slate-200/80 shadow-xs min-h-[160px] max-h-[380px] flex items-center justify-center">
                  <img
                    src={inspectPromo.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-25 pointer-events-none"
                  />
                  <img
                    src={inspectPromo.imageUrl}
                    alt={inspectPromo.title}
                    className="relative z-10 w-full h-auto max-h-[380px] object-contain drop-shadow-xs"
                  />
                </div>
              )}

              {/* Thông số khuyến mãi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Mã Coupon</span>
                  <span className="font-bold text-slate-800">{inspectPromo.couponCode || 'Không áp dụng'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Đơn tối thiểu</span>
                  <span className="font-bold text-slate-800">{inspectPromo.minOrderAmount ? formatMoney(inspectPromo.minOrderAmount) : '0đ'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Giảm tối đa</span>
                  <span className="font-bold text-slate-800">{inspectPromo.maxDiscountAmount ? formatMoney(inspectPromo.maxDiscountAmount) : 'Không giới hạn'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Đã dùng / Giới hạn</span>
                  <span className="font-bold text-slate-800">{inspectPromo.usedCount || 0} / {inspectPromo.usageLimit || '∞'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian diễn ra</h4>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  📅 {formatDate(inspectPromo.startDate)} – {formatDate(inspectPromo.endDate)}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mô tả chi tiết</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                  {inspectPromo.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phạm vi áp dụng
                </h4>
                {inspectPromo.applyAllServices || (!inspectPromo.services || inspectPromo.services.length === 0) ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs font-medium text-emerald-800">
                    🎉 Chương trình ưu đãi này áp dụng cho <strong>toàn bộ dịch vụ & mọi hóa đơn</strong> tại Crown Dental.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {inspectPromo.services.map((svc) => {
                      const origPrice = Number(svc.price)
                      let finalPrice = origPrice
                      if (inspectPromo.discountPercent && Number(inspectPromo.discountPercent) > 0) {
                        finalPrice = origPrice * (1 - Number(inspectPromo.discountPercent) / 100)
                      } else if (inspectPromo.discountAmount && Number(inspectPromo.discountAmount) > 0) {
                        finalPrice = Math.max(0, origPrice - Number(inspectPromo.discountAmount))
                      }
                      return (
                        <div key={svc.id} className="flex items-center justify-between border border-slate-200/70 rounded-lg p-2.5 bg-slate-50/50 text-xs">
                          <span className="font-bold text-slate-800">{svc.serviceName}</span>
                          <div className="text-right">
                            <span className="line-through text-slate-400 text-[11px] mr-2">{formatMoney(origPrice)}</span>
                            <span className="font-bold text-[#f33434]">{formatMoney(finalPrice)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2 shrink-0">
              {(() => {
                const canExtend = isPromoExpiringSoon(inspectPromo)
                return (
                  <button
                    type="button"
                    disabled={!canExtend}
                    onClick={() => {
                      setIsDetailModalOpen(false)
                      openExtendModal(inspectPromo)
                    }}
                    title={getExtendTooltip(inspectPromo)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                      !canExtend
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                  >
                    Gia Hạn Ưu Đãi
                  </button>
                )
              })()}
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  openEditModal(inspectPromo)
                }}
                className="rounded-lg bg-[#005f73] hover:bg-[#0a9396] px-4 py-1.5 text-xs font-semibold text-white transition"
              >
                Chỉnh Sửa Ưu Đãi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="h-11 w-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa ưu đãi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn chương trình ưu đãi{' '}
              <span className="font-bold text-slate-900">"{deleteConfirmPromo.title}"</span> khỏi hệ thống nha khoa?
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmPromo(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xóa ưu đãi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extension Processing Modal */}
      {extendPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#005f73] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Gia Hạn Chương Trình Ưu Đãi</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{extendPromo.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeExtendModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Duration Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Chọn thời gian gia hạn thêm <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: '7', label: '1 Tuần', daysLabel: '+7 ngày' },
                  { value: '30', label: '1 Tháng', daysLabel: '+30 ngày' },
                  { value: '60', label: '2 Tháng', daysLabel: '+60 ngày' },
                  { value: '90', label: '3 Tháng', daysLabel: '+90 ngày' },
                  { value: '180', label: '6 Tháng', daysLabel: '+180 ngày' },
                  { value: 'custom', label: 'Tự nhập', daysLabel: 'Tùy chọn...' },
                ].map((option) => {
                  const isSelected = extendOption === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setExtendOption(option.value)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#005f73] bg-teal-50/70 text-[#005f73] font-bold shadow-2xs ring-1 ring-[#005f73]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold">{option.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-[#005f73]' : 'text-slate-400'}`}>
                        {option.daysLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Custom days input */}
              {extendOption === 'custom' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nhập số ngày muốn gia hạn thêm:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customExtendDays}
                    onChange={(e) => setCustomExtendDays(e.target.value)}
                    placeholder="Ví dụ: 45"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#005f73] transition"
                  />
                </div>
              )}

              {/* Live Date Preview */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Thời hạn hiện tại:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(extendPromo.endDate)}
                    {new Date(extendPromo.endDate) < new Date() && (
                      <span className="ml-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
                        Đã kết thúc
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[#005f73] font-bold pt-1.5 border-t border-slate-200/60">
                  <span>
                    {new Date(extendPromo.endDate) < new Date()
                      ? 'Hạn mới (tái kích hoạt từ hôm nay):'
                      : 'Hạn mới (cộng dồn thời gian):'}
                  </span>
                  <span>
                    {formatDate(calculateNewEndDate(extendPromo, getExtendDaysCount()))} ({`+${getExtendDaysCount()} ngày`})
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeExtendModal}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingExtend || (extendOption === 'custom' && (!customExtendDays || parseInt(customExtendDays) <= 0))}
                onClick={handleConfirmExtend}
                className="rounded-lg bg-[#005f73] hover:bg-[#0a9396] px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {submittingExtend ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Xác Nhận Gia Hạn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
