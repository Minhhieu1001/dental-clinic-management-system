import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Check, X, RotateCcw, Calculator } from 'lucide-react';

const DENOMINATIONS = [
  { value: 500000, label: '500.000 đ' },
  { value: 200000, label: '200.000 đ' },
  { value: 100000, label: '100.000 đ' },
  { value: 50000, label: '50.000 đ' },
  { value: 20000, label: '20.000 đ' },
  { value: 10000, label: '10.000 đ' },
  { value: 5000, label: '5.000 đ' },
  { value: 2000, label: '2.000 đ' },
  { value: 1000, label: '1.000 đ' },
];

export default function CashDenominationModal({
  isOpen,
  onClose,
  initialDenominations = {},
  onApply,
}) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (isOpen) {
      setCounts(initialDenominations || {});
    }
  }, [isOpen, initialDenominations]);

  if (!isOpen) return null;

  const handleChange = (val, count) => {
    const num = Math.max(0, parseInt(count, 10) || 0);
    setCounts((prev) => ({
      ...prev,
      [val]: num,
    }));
  };

  const handleQuickAdd = (val, delta) => {
    setCounts((prev) => {
      const current = prev[val] || 0;
      return {
        ...prev,
        [val]: Math.max(0, current + delta),
      };
    });
  };

  const handleReset = () => {
    setCounts({});
  };

  const totalCalculated = DENOMINATIONS.reduce((sum, item) => {
    const count = counts[item.value] || 0;
    return sum + count * item.value;
  }, 0);

  const totalSheets = Object.values(counts).reduce((sum, val) => sum + (val || 0), 0);

  const handleConfirm = () => {
    onApply(totalCalculated, counts);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl border border-slate-200 flex flex-col max-h-[85vh]"
        >
          {/* Header đơn giản */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng kiểm đếm tiền mặt chi tiết
                </h3>
                <p className="text-[11px] text-slate-500">
                  Nhập số tờ tiền thực tế trong két để tự động tính tổng
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body: Denomination List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-2">
              {DENOMINATIONS.map((item) => {
                const count = counts[item.value] || 0;
                const subtotal = count * item.value;

                return (
                  <div
                    key={item.value}
                    className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 w-36">
                      <span className="font-bold text-slate-800">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.value, -1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={counts[item.value] || ''}
                        onChange={(e) => handleChange(item.value, e.target.value)}
                        placeholder="0"
                        className="h-7 w-16 text-center font-bold text-xs rounded-md border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.value, 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold active:scale-95 transition-all"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item.value, 5)}
                        className="h-7 px-1.5 flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        +5
                      </button>
                    </div>

                    <div className="w-28 text-right font-bold text-slate-800">
                      {subtotal.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">
                Tổng: <strong className="text-slate-800">{totalSheets} tờ</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Thành tiền: <strong className="text-teal-700 text-sm font-bold">{totalCalculated.toLocaleString('vi-VN')} đ</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Đặt lại
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                Áp dụng
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
