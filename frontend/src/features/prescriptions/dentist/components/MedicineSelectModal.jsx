import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Pill,
  Plus,
  Check,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  DollarSign,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { getMedicines, getDistinctUnits } from '../../../../services/medicine.service';
import toast from 'react-hot-toast';

const DOSAGE_TEMPLATES = [
  'Ngày 2 lần, mỗi lần 1 viên sau ăn sáng - tối',
  'Ngày 3 lần, mỗi lần 1 viên sau các bữa ăn',
  'Ngày 2 lần, mỗi lần 2 viên sau ăn no',
  'Uống 1 viên khi có cơn đau nhức (cách nhau ít nhất 6 giờ)',
  'Uống trước khi đi ngủ 30 phút',
  'Súc miệng 15ml trong 30 giây, ngày 2-3 lần sau khi chải răng',
  'Thoa lớp mỏng lên vùng nướu/lợi tổn thương ngày 2-3 lần',
];

const formatCurrency = (amount) => {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function MedicineSelectModal({
  isOpen,
  onClose,
  onAddMedicine,
  existingMedicineIds = [],
}) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [units, setUnits] = useState([]);

  // Selected medicine inside modal to configure dosage & quantity
  const [selectedMed, setSelectedMed] = useState(null);
  const [quantity, setQuantity] = useState(10);
  const [dosage, setDosage] = useState('');
  const [customPrice, setCustomPrice] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadMedicines();
      loadUnits();
      setSelectedMed(null);
      setQuantity(10);
      setDosage('');
    }
  }, [isOpen]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await getMedicines({ status: 'ACTIVE' });
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      toast.error('Không thể tải danh sách thuốc từ kho');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      const u = await getDistinctUnits();
      if (Array.isArray(u)) setUnits(u);
    } catch (err) {
      console.warn('Cannot load units:', err);
    }
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchUnit = selectedUnit === 'ALL' || m.unit === selectedUnit;
      return matchSearch && matchUnit;
    });
  }, [medicines, searchQuery, selectedUnit]);

  const handleSelectMed = (med) => {
    setSelectedMed(med);
    setQuantity(10);
    setCustomPrice(med.price || 0);
    // Gợi ý liều dùng theo mô tả hoặc mặc định
    if (med.usageInstruction) {
      setDosage(med.usageInstruction);
    } else if (med.name?.toLowerCase().includes('súc miệng')) {
      setDosage('Súc miệng 15ml trong 30 giây, ngày 2-3 lần sau khi chải răng');
    } else if (med.name?.toLowerCase().includes('gel') || med.name?.toLowerCase().includes('bôi')) {
      setDosage('Thoa lớp mỏng lên vùng nướu/lợi tổn thương ngày 2-3 lần');
    } else {
      setDosage('Ngày 2 lần, mỗi lần 1 viên sau ăn sáng - tối');
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedMed) return;

    if (quantity <= 0) {
      toast.error('Số lượng kê đơn phải lớn hơn 0');
      return;
    }

    if (!dosage.trim()) {
      toast.error('Vui lòng nhập hoặc chọn hướng dẫn liều dùng cho bệnh nhân');
      return;
    }

    const payload = {
      medicineId: selectedMed.id,
      medicineCode: selectedMed.code,
      medicineName: selectedMed.name,
      unit: selectedMed.unit || 'Viên',
      dosage: dosage.trim(),
      quantity: Number(quantity),
      unitPrice: Number(customPrice || selectedMed.price || 0),
      totalPrice: Number(quantity) * Number(customPrice || selectedMed.price || 0),
      stockQuantity: selectedMed.stockQuantity,
      manufacturer: selectedMed.manufacturer,
    };

    onAddMedicine(payload);
    toast.success(`Đã thêm ${selectedMed.name} vào đơn`);
    // Reset selection để có thể thêm thuốc tiếp theo
    setSelectedMed(null);
    setQuantity(10);
    setDosage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Pill size={20} className="text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Chọn Thuốc Từ Kho Danh Mục
              </h3>
              <p className="text-xs text-teal-100">
                Tìm kiếm thuốc, cấu hình liều lượng và số lượng trước khi thêm vào đơn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body 2 columns: Left: Medicine list | Right: Selected Medicine Config */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* CỘT TRÁI: Tìm kiếm & Danh sách thuốc (7 cols) */}
          <div className="md:col-span-7 flex flex-col border-r border-slate-200 p-4 min-h-0 overflow-hidden bg-slate-50/50">
            {/* Search and Unit filter */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên thuốc, mã thuốc, nhà sản xuất..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Unit filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Đơn vị:</span>
                <button
                  type="button"
                  onClick={() => setSelectedUnit('ALL')}
                  className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] whitespace-nowrap cursor-pointer transition-colors ${selectedUnit === 'ALL'
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Tất cả
                </button>
                {units.slice(0, 5).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setSelectedUnit(u)}
                    className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] whitespace-nowrap cursor-pointer transition-colors ${selectedUnit === u
                      ? 'bg-teal-700 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-teal-600" />
                  Đang tải danh mục thuốc từ kho...
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                  <Package size={28} className="mx-auto mb-2 text-slate-300" />
                  Không tìm thấy thuốc nào khớp với từ khóa.
                </div>
              ) : (
                filteredMedicines.map((m) => {
                  const isSelected = selectedMed && selectedMed.id === m.id;
                  const isAlreadyAdded = existingMedicineIds.includes(m.id);
                  const isLowStock = m.stockQuantity != null && m.stockQuantity < 30;
                  const isOutOfStock = m.stockQuantity != null && m.stockQuantity <= 0;

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMed(m)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/30 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 leading-tight">
                              {m.name}
                            </span>
                            {m.code && (
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {m.code}
                              </span>
                            )}
                            {isAlreadyAdded && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                ✓ Đã có trong đơn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {m.manufacturer ? `${m.manufacturer} • ` : ''}
                            ĐVT: <strong className="text-slate-700">{m.unit || 'Viên'}</strong>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-teal-700 block">
                            {formatCurrency(m.price)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-500'
                              }`}
                          >
                            Tồn: {m.stockQuantity != null ? m.stockQuantity : 0} {m.unit || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Cấu hình thuốc đã chọn (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col justify-between overflow-y-auto bg-white">
            {selectedMed ? (
              <div className="space-y-4">
                {/* Thông tin thuốc chọn */}
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/90">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={16} className="text-teal-700" />
                    <span className="text-xs font-bold text-teal-900">Thuốc đang chọn</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {selectedMed.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Mã: <strong className="text-slate-800">{selectedMed.code || 'N/A'}</strong></span>
                    <span>Đơn giá: <strong className="text-teal-700">{formatCurrency(selectedMed.price)}</strong></span>
                  </div>
                </div>

                {/* Số lượng */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Số lượng kê đơn ({selectedMed.unit || 'Đơn vị'}):
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Tồn kho: <strong className="text-slate-800">{selectedMed.stockQuantity || 0}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-9 w-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="flex-1 py-1.5 px-3 text-center text-sm font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="h-9 w-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {selectedMed.stockQuantity != null && quantity > selectedMed.stockQuantity && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Số lượng kê vượt quá số lượng tồn trong kho!
                    </p>
                  )}
                </div>

                {/* Hướng dẫn liều dùng */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hướng dẫn liều dùng & Cách dùng:
                  </label>
                  <textarea
                    rows={3}
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="VD: Ngày 2 lần, mỗi lần 1 viên sau ăn sáng/tối..."
                    className="w-full p-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                  />

                  {/* Template gợi ý nhanh */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Gợi ý mẫu liều dùng nhanh:
                    </span>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                      {DOSAGE_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDosage(tmpl)}
                          className="text-left text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200/80 transition-colors text-slate-600 font-medium cursor-pointer"
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tổng tiền thuốc này */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Thành tiền tạm tính:</span>
                  <span className="font-extrabold text-sm text-teal-700">
                    {formatCurrency(quantity * (customPrice || selectedMed.price || 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-12 text-center text-slate-400">
                <Pill size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  Chưa chọn loại thuốc nào
                </p>
                <p className="text-[11px] text-slate-400">
                  Nhấp chọn một loại thuốc ở cột bên trái để thiết lập số lượng và liều dùng.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={!selectedMed}
                onClick={handleConfirmAdd}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={14} /> Thêm vào đơn thuốc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
