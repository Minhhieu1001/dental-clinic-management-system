import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, RefreshCw, Plus, Check, Filter } from 'lucide-react';
import { getMedicines } from '../../../../services/medicine.service';
import toast from 'react-hot-toast';

export default function SelectMedicineModal({
  isOpen,
  onClose,
  onSaveSelected,
  alreadySelectedCodes = [],
}) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadMedicines();
      setSelectedIds([]);
      setSearchTerm('');
      setSelectedUnit('ALL');
    }
  }, [isOpen]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await getMedicines();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((m) => ({
          id: m.id || m.code,
          code: m.code || '',
          brandName: m.manufacturer || m.brandName || '',
          name: m.name,
          unit: m.unit || 'Viên',
          uses: m.description || m.uses || '',
          usageInstruction: m.usageInstruction || '',
        }));
        setMedicines(mapped);
      } else {
        setMedicines([]);
      }
    } catch (err) {
      console.warn('Cannot fetch medicines:', err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Trích xuất danh sách đơn vị duy nhất
  const availableUnits = useMemo(() => {
    const set = new Set();
    medicines.forEach((m) => {
      if (m.unit && m.unit.trim()) {
        set.add(m.unit.trim());
      }
    });
    return Array.from(set).sort();
  }, [medicines]);

  // Lọc theo từ khóa tìm kiếm & đơn vị tính
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.code?.toLowerCase().includes(q) ||
        m.brandName?.toLowerCase().includes(q) ||
        m.uses?.toLowerCase().includes(q);

      const matchUnit =
        selectedUnit === 'ALL' ||
        m.unit?.toLowerCase() === selectedUnit.toLowerCase();

      return matchSearch && matchUnit;
    });
  }, [medicines, searchTerm, selectedUnit]);

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMedicines.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMedicines.map((m) => m.id));
    }
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 loại thuốc');
      return;
    }

    const chosen = medicines.filter((m) => selectedIds.includes(m.id));
    onSaveSelected(chosen);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="select-medicine-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Dialog Container with spring physics & fixed height to prevent shrinking */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 380,
              mass: 0.8,
            }}
            className="relative w-full max-w-6xl h-[640px] max-h-[92vh] bg-white border border-slate-300 shadow-2xl flex flex-col overflow-hidden text-xs rounded-sm z-10"
          >
            {/* Header modal */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600 inline-block"></span>
                CHỌN THUỐC
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Bar & Filter Toolbar */}
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                {/* Input tìm kiếm */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo tên thuốc, mã thuốc, tên biệt dược..."
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden text-slate-800"
                    autoFocus
                  />
                  <Search size={15} className="absolute right-2.5 top-2 text-slate-400" />
                </div>

                {/* Bộ lọc theo Đơn vị tính */}
                <div className="flex items-center gap-1.5 shrink-0 text-slate-700">
                  <Filter size={13} className="text-teal-700" />
                  <span className="font-semibold text-xs text-slate-600 hidden sm:inline">Đơn vị:</span>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="ALL">-- Tất cả đơn vị ({availableUnits.length}) --</option>
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nút Thêm mới với Icon */}
              <button
                type="button"
                onClick={() => toast('Tính năng thêm thuốc mới thuộc khu vực quản trị kho dược.', { icon: 'ℹ️' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <Plus size={13} />
                <span>Thêm mới</span>
              </button>
            </div>

            {/* Table of Medicines with soft gray header & fixed height (never shrink) */}
            <div className="flex-1 overflow-y-auto h-[440px] max-h-[440px]">
              <table className="w-full border-collapse text-left border-b border-slate-200">
                <thead className="bg-slate-300 text-slate-700 sticky top-0 font-bold select-none text-[11px] border-b border-slate-300 shadow-2xs">
                  <tr>
                    <th className="w-10 px-3 py-2 text-center border-r border-slate-300">
                      <input
                        type="checkbox"
                        checked={filteredMedicines.length > 0 && selectedIds.length === filteredMedicines.length}
                        onChange={toggleSelectAll}
                        className="cursor-pointer accent-teal-700"
                      />
                    </th>
                    <th className="w-36 min-w-[130px] px-3 py-2 border-r border-slate-300 whitespace-nowrap">Mã thuốc</th>
                    <th className="w-40 min-w-[130px] px-3 py-2 border-r border-slate-300">Tên biệt dược</th>
                    <th className="min-w-[190px] px-3 py-2 border-r border-slate-300">Tên thuốc/hàm lượng</th>
                    <th className="w-28 min-w-[100px] px-3 py-2 border-r border-slate-300 text-center whitespace-nowrap">Đơn vị tính</th>
                    <th className="min-w-[220px] px-3 py-2 border-r border-slate-300">Công dụng</th>
                    <th className="min-w-[220px] px-3 py-2">Cách dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-1 text-teal-600" />
                        Đang tải danh sách thuốc...
                      </td>
                    </tr>
                  ) : filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        Không tìm thấy thuốc nào khớp với từ khóa tìm kiếm hoặc đơn vị đã chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((m) => {
                      const isChecked = selectedIds.includes(m.id);
                      return (
                        <tr
                          key={m.id}
                          onClick={() => toggleSelectOne(m.id)}
                          className={`hover:bg-teal-50/50 cursor-pointer transition-colors ${
                            isChecked ? 'bg-teal-50 font-medium text-teal-950' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-center border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="cursor-pointer accent-teal-700"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono font-medium border-r border-slate-200 text-slate-700 whitespace-nowrap">
                            {m.code || ''}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-600">
                            {m.brandName || ''}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900 border-r border-slate-200">
                            {m.name}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-600">
                            <span className="inline-block px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-medium text-[10px]">
                              {m.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 text-slate-600">
                            {m.uses}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {m.usageInstruction}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Icons on all buttons */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-500">
                Đã chọn: <strong className="text-teal-700 font-bold">{selectedIds.length}</strong> / {filteredMedicines.length} thuốc
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>Lưu thông tin</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                >
                  <X size={14} />
                  <span>Hủy bỏ</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
