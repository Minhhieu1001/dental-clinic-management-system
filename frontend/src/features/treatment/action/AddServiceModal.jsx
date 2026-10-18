import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Search,
  Plus,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  Shield,
  Smile,
  Anchor,
  Sun,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  SERVICE_CATEGORIES,
  getCategoryBadge,
  UPPER_JAW_RIGHT,
  UPPER_JAW_LEFT,
  LOWER_JAW_RIGHT,
  LOWER_JAW_LEFT,
} from '../clinicalExaminationHelpers';
import { createTreatmentService } from '../../../services/treatmentService.service';

export function AddServiceModal({
  isOpen,
  onClose,
  targetPhaseId,
  servicesCatalog = [],
  diagnosesList = [],
  onAddService,
  onAddSuccess,
}) {
  // 1. Bộ lọc tìm kiếm & Loại dịch vụ
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Dịch vụ đang được chọn để gán răng
  const [activeServiceId, setActiveServiceId] = useState('');

  // 3. Răng được chọn cho dịch vụ hiện tại (mảng các mã răng)
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [isFullMouth, setIsFullMouth] = useState(false);
  const [serviceQty, setServiceQty] = useState(1);

  // 4. Bảng các dịch vụ đã chọn (Pre-order / Staged services list)
  const [stagedServices, setStagedServices] = useState([]);

  // Lấy danh sách các số răng có trong chẩn đoán của bệnh nhân (chỉ lấy mã số răng để hiển thị gợi ý trên sơ đồ răng)
  const diagnosedToothNumbers = useMemo(() => {
    const setOfTeeth = new Set();
    diagnosesList.forEach((d) => {
      const match = (d.toothPosition || '').match(/\d+/g);
      if (match) {
        match.forEach((num) => setOfTeeth.add(num));
      }
    });
    return Array.from(setOfTeeth);
  }, [diagnosesList]);

  // Reset & khởi tạo khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('ALL');
      setSearchQuery('');
      setStagedServices([]);
      setIsSubmitting(false);

      // Mặc định chọn dịch vụ đầu tiên
      if (servicesCatalog.length > 0) {
        setActiveServiceId(servicesCatalog[0].service_id);
      } else {
        setActiveServiceId('');
      }

      // Vị trí răng để trống để nha sĩ tự chọn theo dịch vụ, số lượng mặc định 1
      setSelectedTeeth([]);
      setIsFullMouth(false);
      setServiceQty(1);
    }
  }, [isOpen, servicesCatalog]);

  // Lọc danh sách dịch vụ realtime theo category và từ khóa
  const filteredServices = useMemo(() => {
    return servicesCatalog.filter((s) => {
      const matchCategory =
        selectedCategory === 'ALL' ||
        (s.category && s.category.toUpperCase() === selectedCategory);

      const queryLower = searchQuery.trim().toLowerCase();
      const matchQuery =
        !queryLower ||
        s.service_name.toLowerCase().includes(queryLower) ||
        (s.description && s.description.toLowerCase().includes(queryLower)) ||
        (s.unit && s.unit.toLowerCase().includes(queryLower));

      return matchCategory && matchQuery;
    });
  }, [servicesCatalog, selectedCategory, searchQuery]);

  // Dịch vụ đang hoạt động
  const activeService = useMemo(() => {
    return servicesCatalog.find((s) => s.service_id === activeServiceId) || filteredServices[0] || null;
  }, [servicesCatalog, activeServiceId, filteredServices]);

  // Khi bấm chọn một răng trong sơ đồ
  const handleToggleTooth = (toothNum) => {
    setIsFullMouth(false);
    let newTeeth;
    if (selectedTeeth.includes(toothNum)) {
      newTeeth = selectedTeeth.filter((t) => t !== toothNum);
    } else {
      newTeeth = [...selectedTeeth, toothNum].sort((a, b) => Number(a) - Number(b));
    }
    setSelectedTeeth(newTeeth);
    // Tự động cập nhật số lượng theo số răng đã chọn
    setServiceQty(Math.max(1, newTeeth.length));
  };

  // Chọn toàn hàm
  const handleSelectFullMouth = () => {
    setIsFullMouth(true);
    setSelectedTeeth([]);
    setServiceQty(1);
  };

  // Chọn tất cả răng hàm trên
  const handleSelectUpperJaw = () => {
    setIsFullMouth(false);
    const upper = [...UPPER_JAW_RIGHT, ...UPPER_JAW_LEFT];
    setSelectedTeeth(upper);
    setServiceQty(upper.length);
  };

  // Chọn tất cả răng hàm dưới
  const handleSelectLowerJaw = () => {
    setIsFullMouth(false);
    const lower = [...LOWER_JAW_RIGHT, ...LOWER_JAW_LEFT];
    setSelectedTeeth(lower);
    setServiceQty(lower.length);
  };



  // Xóa toàn bộ lựa chọn răng
  const handleClearTeeth = () => {
    setIsFullMouth(false);
    setSelectedTeeth([]);
    setServiceQty(1);
  };

  // Format chuỗi vị trí răng
  const getTeethDisplayString = () => {
    if (isFullMouth) return 'Toàn hàm';
    if (selectedTeeth.length === 0) return 'Chung';
    return selectedTeeth.map((t) => `R${t}`).join(', ');
  };

  // Thêm dịch vụ hiện tại vào bảng stagedServices (Bảng danh sách bên dưới)
  const handleAddCurrentServiceToStaged = () => {
    if (!activeService) {
      toast.error('Vui lòng chọn dịch vụ trước!');
      return;
    }

    const toothString = getTeethDisplayString();
    const qty = Math.max(1, Number(serviceQty) || 1);
    const price = Number(activeService.price) || 0;

    const newItem = {
      treatmentServicesId: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      service_id: activeService.service_id,
      service_name: activeService.service_name,
      category: activeService.category,
      unit: activeService.unit || 'Răng',
      toothNumber: toothString,
      selectedTeeth: [...selectedTeeth],
      quantity: qty,
      price: price,
      subtotal: price * qty,
    };

    setStagedServices((prev) => [...prev, newItem]);
    toast.success(`Đã thêm "${activeService.service_name}" (${toothString}) vào bảng chỉ định!`, {
      icon: '✨',
    });
  };

  // Xóa một dòng khỏi bảng stagedServices
  const handleRemoveStagedItem = (tempId) => {
    setStagedServices((prev) => prev.filter((item) => item.treatmentServicesId !== tempId));
  };

  // Tổng tiền và tổng số răng trong bảng stagedServices
  const stagedTotalAmount = useMemo(() => {
    return stagedServices.reduce((sum, item) => sum + item.subtotal, 0);
  }, [stagedServices]);

  // XÁC NHẬN THÊM TOÀN BỘ VÀO GIAI ĐOẠN ĐIỀU TRỊ
  const handleConfirmAddAll = async (e) => {
    e?.preventDefault();
    if (!targetPhaseId) {
      toast.error('Không tìm thấy giai đoạn điều trị tương ứng!');
      return;
    }

    if (String(targetPhaseId).startsWith('ph-')) {
      toast.error('Giai đoạn điều trị chưa tồn tại trong cơ sở dữ liệu. Vui lòng lưu phác đồ trước khi thêm dịch vụ.');
      return;
    }

    let finalItems = [...stagedServices];

    // Nếu người dùng chưa bấm nút "+ Thêm vào bảng" nhưng đã chọn dịch vụ ở trên, tự động gom thêm luôn
    if (finalItems.length === 0 && activeService) {
      const toothString = getTeethDisplayString();
      const qty = Math.max(1, Number(serviceQty) || 1);
      const price = Number(activeService.price) || 0;

      finalItems.push({
        treatmentServicesId: `ts-${Date.now()}`,
        service_id: activeService.service_id,
        service_name: activeService.service_name,
        category: activeService.category,
        unit: activeService.unit || 'Răng',
        toothNumber: toothString,
        quantity: qty,
        price: price,
        subtotal: price * qty,
      });
    }

    if (finalItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ nha khoa!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Đang lưu ${finalItems.length} dịch vụ vào giai đoạn...`);

    try {
      const savedItems = [];
      for (const item of finalItems) {
        const serviceUuid = item.service_id && !String(item.service_id).startsWith('srv-')
          ? item.service_id
          : null;

        if (!serviceUuid) {
          throw new Error(`Dịch vụ "${item.service_name}" không có mã định danh UUID hợp lệ trong hệ thống.`);
        }

        const payload = {
          serviceId: serviceUuid,
          toothNumber: item.toothNumber || '',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        };

        const res = await createTreatmentService(targetPhaseId, payload);
        savedItems.push({
          treatmentServicesId: res?.id || item.treatmentServicesId,
          service_id: res?.serviceId || item.service_id,
          service_name: res?.serviceName || item.service_name,
          category: item.category,
          unit: item.unit || 'Răng',
          toothNumber: res?.toothNumber || item.toothNumber,
          quantity: res?.quantity || item.quantity,
          price: Number(res?.price ?? item.price),
          subtotal: Number(res?.totalAmount ?? (item.price * item.quantity)),
        });
      }

      toast.success(`Đã thêm thành công ${savedItems.length} dịch vụ vào giai đoạn!`, {
        id: toastId,
        icon: '✅',
      });

      // Bắn sự kiện thành công về UI chính
      const callback = onAddSuccess || onAddService;
      if (callback) {
        callback(targetPhaseId, savedItems);
      }

      // Đóng modal sau khi thêm thành công
      onClose();
    } catch (err) {
      console.error('Lỗi khi thêm dịch vụ vào giai đoạn:', err);
      toast.error(`Lỗi: ${err?.response?.data?.message || err.message}`, { id: toastId });
      // Thất bại: không gọi callback, không thêm vào state, không đóng modal
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2.5 overflow-y-auto">
          {/* Backdrop mờ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container Lớn Gần Bằng Màn Hình Chính */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative z-10 w-[98vw] max-w-[1750px] h-[95vh] max-h-[96vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* ================= 1. MODAL HEADER ================= */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-800 to-teal-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-teal-200 border border-white/10">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    Chỉ Định Dịch Vụ Nha Khoa Vào Giai Đoạn Điều Trị
                  </h3>
                  <p className="text-xs text-teal-100/80">
                    Tìm kiếm theo danh mục, chọn nhiều răng can thiệp (số lượng tự động tính) và duyệt bảng chỉ định dịch vụ.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* ================= 2. MODAL BODY (SCROLLABLE CONTAINER) ================= */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
              {/* --- THANH TÌM KIẾM & BỘ LỌC CATEGORY (Theo CSDL Postgres) --- */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Ô tìm kiếm */}
                  <div className="relative flex-1">
                    <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên dịch vụ, đơn vị tính, từ khóa mô tả..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-300 pl-10 pr-9 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Hiển thị số lượng tìm thấy */}
                  <span className="text-xs text-slate-500 font-semibold shrink-0">
                    Hiển thị: <strong className="text-teal-800">{filteredServices.length}</strong> dịch vụ
                  </span>
                </div>

                {/* Các nút phân loại theo Database Categories */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Layers size={13} /> Loại dịch vụ:
                  </span>
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    const IconComp = cat.icon;

                    // Đếm số lượng trong mỗi loại
                    const count =
                      cat.key === 'ALL'
                        ? servicesCatalog.length
                        : servicesCatalog.filter((s) => s.category?.toUpperCase() === cat.key).length;

                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${isActive
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        {IconComp && <IconComp size={13} className={isActive ? 'text-white' : 'text-slate-500'} />}
                        <span>{cat.label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* --- KHỐI GIỮA: 2 CỘT (DANH MỤC DỊCH VỤ + CHỌN RĂNG & SỐ LƯỢNG) --- */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* CỘT TRÁI (6 cols): Danh sách dịch vụ với Tên, Đơn vị tính, Giá tiền */}
                <div className="xl:col-span-6 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Stethoscope size={14} className="text-teal-700" />
                      1. Danh sách dịch vụ nha khoa
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium italic">
                      Nhấp dòng để chọn dịch vụ
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[440px] divide-y divide-slate-100">
                    {filteredServices.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Không tìm thấy dịch vụ nha khoa nào phù hợp với từ khóa!
                      </div>
                    ) : (
                      filteredServices.map((srv) => {
                        const isSelected = activeService?.service_id === srv.service_id;
                        const badgeInfo = getCategoryBadge(srv.category);

                        return (
                          <div
                            key={srv.service_id}
                            onClick={() => setActiveServiceId(srv.service_id)}
                            className={`px-4 py-3.5 sm:px-5 sm:py-4 transition-all cursor-pointer flex items-center justify-between gap-4 border-l-4 sm:border-l-[5px] ${isSelected
                              ? 'bg-teal-50/80 border-teal-700 text-teal-950 font-bold'
                              : 'border-transparent hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-normal">
                                  {srv.service_name}
                                </span>
                                <span
                                  className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${badgeInfo.cls}`}
                                >
                                  {badgeInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                                {srv.description || 'Thủ thuật nha khoa can thiệp lâm sàng theo chỉ định'}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-base sm:text-lg font-bold text-teal-700 block">
                                {Number(srv.price).toLocaleString('vi-VN')} đ
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1 mt-1 border border-slate-200">
                                ĐVT: {srv.unit || 'Răng'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI (6 cols): Chọn răng (Multi-select) + Gợi ý chẩn đoán + Tự động tính số lượng */}
                <div className="xl:col-span-6 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header thông tin dịch vụ đang chọn */}
                    <div className="pb-3 border-b border-slate-200">
                      <span className="text-xs text-slate-400 font-bold uppercase block">
                        Dịch vụ đang chọn:
                      </span>
                      {activeService ? (
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <h4 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                            {activeService.service_name}
                          </h4>
                          <span className="text-sm sm:text-base font-bold text-teal-700 shrink-0">
                            {Number(activeService.price).toLocaleString('vi-VN')} đ / {activeService.unit || 'Răng'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-500 italic mt-1 font-medium">Vui lòng nhấp chọn 1 dịch vụ ở bảng bên trái</p>
                      )}
                    </div>

                    {/* --- THÔNG TIN CHẨN ĐOÁN CỦA NHA SĨ (CHỈ MANG TÍNH CHẤT THAM KHẢO) --- */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                          <Sparkles size={13} className="text-amber-600" />
                          Chẩn đoán của nha sĩ (Tham khảo):
                        </span>
                        <span className="text-[11px] text-amber-700 font-medium italic">
                          Chỉ mang tính chất tham khảo thông tin
                        </span>
                      </div>

                      {diagnosesList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Chưa có dữ liệu chẩn đoán răng trước đó.</p>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 bg-amber-50/60 rounded-lg border border-amber-200/80">
                          {diagnosesList.map((diag, dIdx) => (
                            <div
                              key={dIdx}
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs bg-white text-amber-900 border border-amber-300 shadow-2xs"
                            >
                              <span className="font-bold text-amber-800">{diag.toothPosition || 'Chung'}:</span>
                              <span className="text-[11px] font-medium text-slate-700">
                                {diag.label || diag.primaryDiagnosis}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* --- SƠ ĐỒ CHỌN NHIỀU RĂNG TRỰC QUAN (FDI 32 RĂNG) --- */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Chọn vị trí răng điều trị (Cho phép chọn nhiều răng):
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={handleSelectFullMouth}
                            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${isFullMouth ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            Toàn hàm
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectUpperJaw}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                          >
                            Hàm trên
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectLowerJaw}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                          >
                            Hàm dưới
                          </button>
                          <button
                            type="button"
                            onClick={handleClearTeeth}
                            className="text-rose-600 hover:underline font-semibold cursor-pointer ml-1"
                          >
                            Xóa chọn
                          </button>
                        </div>
                      </div>

                      {/* Lưới răng trực quan FDI */}
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-center text-xs">
                        {/* HÀM TRÊN (Cung 1 & Cung 2) */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-slate-500 font-bold uppercase block">
                            Hàm trên (Cung 1 | Cung 2)
                          </span>
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {UPPER_JAW_RIGHT.map((num) => {
                              const isSel = selectedTeeth.includes(num);
                              const isDiag = diagnosedToothNumbers.includes(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleToggleTooth(num)}
                                  className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer relative ${isSel
                                    ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-700/20'
                                    : isDiag
                                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-900'
                                    }`}
                                  title={`Răng ${num}${isDiag ? ' (Có trong chẩn đoán)' : ''}`}
                                >
                                  {num}
                                  {isDiag && !isSel && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-white" />
                                  )}
                                </button>
                              );
                            })}
                            <span className="w-px h-7 bg-slate-300 mx-1.5" />
                            {UPPER_JAW_LEFT.map((num) => {
                              const isSel = selectedTeeth.includes(num);
                              const isDiag = diagnosedToothNumbers.includes(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleToggleTooth(num)}
                                  className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer relative ${isSel
                                    ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-700/20'
                                    : isDiag
                                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-900'
                                    }`}
                                  title={`Răng ${num}${isDiag ? ' (Có trong chẩn đoán)' : ''}`}
                                >
                                  {num}
                                  {isDiag && !isSel && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-white" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* HÀM DƯỚI (Cung 4 & Cung 3) */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {LOWER_JAW_RIGHT.map((num) => {
                              const isSel = selectedTeeth.includes(num);
                              const isDiag = diagnosedToothNumbers.includes(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleToggleTooth(num)}
                                  className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer relative ${isSel
                                    ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-700/20'
                                    : isDiag
                                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-900'
                                    }`}
                                  title={`Răng ${num}${isDiag ? ' (Có trong chẩn đoán)' : ''}`}
                                >
                                  {num}
                                  {isDiag && !isSel && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-white" />
                                  )}
                                </button>
                              );
                            })}
                            <span className="w-px h-7 bg-slate-300 mx-1.5" />
                            {LOWER_JAW_LEFT.map((num) => {
                              const isSel = selectedTeeth.includes(num);
                              const isDiag = diagnosedToothNumbers.includes(num);
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleToggleTooth(num)}
                                  className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-lg font-black text-xs sm:text-sm transition-all cursor-pointer relative ${isSel
                                    ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-700/20'
                                    : isDiag
                                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-900'
                                    }`}
                                  title={`Răng ${num}${isDiag ? ' (Có trong chẩn đoán)' : ''}`}
                                >
                                  {num}
                                  {isDiag && !isSel && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border border-white" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-[11px] text-slate-500 font-bold uppercase block">
                            Hàm dưới (Cung 4 | Cung 3)
                          </span>
                        </div>
                      </div>

                      {/* Tóm tắt răng đang chọn + Tự động tính số lượng */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/60 border border-teal-200 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Vị trí răng áp dụng: </span>
                          <strong className="text-teal-900 font-extrabold">
                            {getTeethDisplayString()}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Số lượng:</span>
                          <input
                            type="number"
                            min={1}
                            value={serviceQty}
                            onChange={(e) => setServiceQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-12 h-7 rounded border border-teal-300 bg-white text-center font-bold text-teal-900 outline-none focus:border-teal-600"
                          />
                          <span className="text-[11px] font-semibold text-slate-500">
                            ({activeService?.unit || 'Răng'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút to: THÊM DỊCH VỤ NÀY VÀO BẢNG CHỈ ĐỊNH BÊN DƯỚI */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Tạm tính dịch vụ này:</span>
                      <span className="text-lg sm:text-xl font-bold text-teal-700">
                        {((Number(activeService?.price) || 0) * serviceQty).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={handleAddCurrentServiceToStaged}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-extrabold px-5 py-2.5 shadow-md hover:shadow-lg cursor-pointer transition-all"
                    >
                      <Plus size={18} />
                      <span>+ Thêm vào bảng chỉ định</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ================= 3. TABLE HIỂN THỊ ĐẦY ĐỦ DỊCH VỤ, RĂNG VÀ GIÁ TIỀN ĐÃ CHỌN ================= */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden space-y-0">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-xs shadow-2xs">
                      2
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Bảng Tổng Hợp Dịch Vụ Nha Khoa Đã Chọn Thêm Vào Giai Đoạn
                    </h4>
                    <span className="rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold px-2.5 py-0.5">
                      {stagedServices.length} mục đã chọn
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    (Kiểm tra vị trí răng, số lượng và tổng chi phí trước khi lưu)
                  </span>
                </div>

                {stagedServices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs space-y-1.5">
                    <AlertCircle size={24} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">Chưa có dịch vụ nào trong bảng chỉ định!</p>
                    <p className="text-[11px] text-slate-400">
                      Chọn dịch vụ và vị trí răng ở trên rồi nhấp <strong>"+ Thêm vào bảng chỉ định"</strong>, hoặc nhấp trực tiếp <strong>"Xác nhận thêm dịch vụ"</strong> để lấy dịch vụ đang chọn.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                          <th className="p-2.5 text-center w-12">STT</th>
                          <th className="p-2.5 min-w-[220px]">Tên dịch vụ nha khoa</th>
                          <th className="p-2.5 w-32">Loại dịch vụ</th>
                          <th className="p-2.5 text-center min-w-[140px]">Vị trí răng áp dụng</th>
                          <th className="p-2.5 text-center w-24">Đơn vị tính</th>
                          <th className="p-2.5 text-center w-24">Số lượng</th>
                          <th className="p-2.5 text-right w-32">Đơn giá</th>
                          <th className="p-2.5 text-right w-36">Thành tiền</th>
                          <th className="p-2.5 text-center w-14">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stagedServices.map((item, index) => {
                          const badgeInfo = getCategoryBadge(item.category);

                          return (
                            <tr key={item.treatmentServicesId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2.5 text-center font-bold text-slate-400">{index + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900">{item.service_name}</td>
                              <td className="p-2.5">
                                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${badgeInfo.cls}`}>
                                  {badgeInfo.label}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-extrabold text-xs inline-block">
                                  {item.toothNumber}
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-medium text-slate-600">
                                {item.unit || 'Răng'}
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-800">
                                {item.quantity}
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-600">
                                {Number(item.price).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-teal-800">
                                {item.subtotal.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStagedItem(item.treatmentServicesId)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                  title="Xóa mục này khỏi bảng"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-teal-50/60 font-bold border-t border-teal-200 text-xs">
                          <td colSpan={5} className="p-2.5 text-right text-slate-700">
                            Tổng chi phí tạm tính ({stagedServices.length} mục chỉ định):
                          </td>
                          <td className="p-2.5 text-center font-extrabold text-teal-900">
                            {stagedServices.reduce((acc, s) => acc + s.quantity, 0)}
                          </td>
                          <td />
                          <td className="p-2.5 text-right font-black text-teal-900 text-sm">
                            {stagedTotalAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ================= 4. MODAL FOOTER ================= */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Tổng chi phí dự kiến thêm vào giai đoạn:
                </span>
                <span className="text-lg font-black text-teal-800">
                  {(stagedServices.length > 0
                    ? stagedTotalAmount
                    : activeService
                      ? (Number(activeService.price) || 0) * serviceQty
                      : 0
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng / Hủy
                </motion.button>

                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.96 }}
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAddAll}
                  className="rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2 text-xs sm:text-sm font-bold text-white shadow cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Lưu dịch vụ</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AddServiceModal;
