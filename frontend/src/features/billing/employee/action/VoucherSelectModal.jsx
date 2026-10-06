import React, { useState, useEffect } from 'react';
import { Ticket, X } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  Radio,
} from '@mui/material';
import toast from 'react-hot-toast';
import { getAvailableVouchers } from '../../../../services/promotion.service';

export default function VoucherSelectModal({ open, onClose, appliedVoucher, onSelectVoucher }) {
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [vouchersList, setVouchersList] = useState([]);
  const [selectedModalVoucher, setSelectedModalVoucher] = useState(appliedVoucher);

  useEffect(() => {
    if (open) {
      setSelectedModalVoucher(appliedVoucher);
      fetchVouchers();
    }
  }, [open, appliedVoucher]);

  const fetchVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const res = await getAvailableVouchers();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setVouchersList(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách voucher:', err);
      toast.error('Không thể tải danh sách voucher khuyến mãi!');
    } finally {
      setLoadingVouchers(false);
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0);

  const formatDateString = (dateInput) => {
    if (!dateInput) return 'Không giới hạn';
    if (Array.isArray(dateInput)) {
      const [y, m, d] = dateInput;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    try {
      const dateStr = String(dateInput);
      if (dateStr.includes('T')) {
        const [datePart] = dateStr.split('T');
        const [y, m, d] = datePart.split('-');
        if (y && m && d) return `${d}/${m}/${y}`;
      }
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return d.toLocaleDateString('vi-VN');
    } catch (e) {
      return String(dateInput);
    }
  };

  const handleSaveModalVoucher = () => {
    if (!selectedModalVoucher) {
      onSelectVoucher(null);
      toast.success('Đã bỏ chọn mã giảm giá');
    } else {
      onSelectVoucher(selectedModalVoucher);
      toast.success(`Đã chọn mã giảm giá ${selectedModalVoucher.couponCode || ''}`);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '12px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bg: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <Ticket className="w-5 h-5 text-blue-600" />
          <span>Chọn Voucher Khuyến Mãi</span>
        </div>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ ml: 'auto', color: '#64748b' }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5, backgroundColor: '#f8fafc', maxHeight: '460px' }}>
        {loadingVouchers ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <CircularProgress size={32} />
            <span className="text-xs text-slate-500 font-medium">Đang tải danh sách voucher khuyến mãi...</span>
          </div>
        ) : vouchersList.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Hiện tại không có mã voucher nào có thể áp dụng.
          </div>
        ) : (
          <div className="space-y-3">
            {vouchersList.map((v) => {
              const isSelected = selectedModalVoucher?.id === v.id || (v.couponCode && selectedModalVoucher?.couponCode === v.couponCode);
              const limit = v.usageLimit || 0;
              const used = v.usedCount || 0;
              const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

              let discountLabel = '';
              if (v.promotionType === 'DISCOUNT_PERCENT' || (v.discountPercent && Number(v.discountPercent) > 0)) {
                discountLabel = `Giảm ${v.discountPercent}%`;
                if (v.maxDiscountAmount && Number(v.maxDiscountAmount) > 0) {
                  discountLabel += ` (Tối đa ${formatVND(v.maxDiscountAmount)})`;
                }
              } else if (v.promotionType === 'VOUCHER' || (v.discountAmount && Number(v.discountAmount) > 0)) {
                discountLabel = `Giảm ${formatVND(v.discountAmount)}`;
              } else {
                discountLabel = 'Ưu đãi đặc biệt';
              }

              return (
                <div
                  key={v.id || v.couponCode}
                  onClick={() => setSelectedModalVoucher(v)}
                  className={`cursor-pointer border rounded-xl transition-all flex items-stretch bg-white relative overflow-hidden ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                >
                  {/* Visual left accent bar if selected */}
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10"></div>}

                  {/* Left content: Information */}
                  <div className="p-2.5 flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Radio Select */}
                    <Radio
                      checked={isSelected}
                      onChange={() => setSelectedModalVoucher(v)}
                      size="small"
                      sx={{ p: 0.5, color: '#cbd5e1', '&.Mui-checked': { color: '#2563eb' } }}
                    />

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-xs tracking-wide">
                          {v.couponCode}
                        </span>
                        <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-xs border border-amber-200/60">
                          {discountLabel}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {v.title || v.description}
                      </h4>

                      {/* Usage Limit Progress Bar */}
                      {limit > 0 && (
                        <div className="space-y-0.5 pt-0.5">
                          <div className="flex justify-between text-[10.5px] text-slate-500 font-medium">
                            <span>Số lượng</span>
                            <span>Đã dùng {used}/{limit}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="text-[10.5px] text-slate-400 font-medium pt-0.5">
                        Hạn dùng: {formatDateString(v.startDate)} - {formatDateString(v.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Right image: Full height of item, wider width */}
                  <div className="w-32 sm:w-36 shrink-0 bg-slate-50 border-l border-slate-100 flex items-center justify-center overflow-hidden self-stretch">
                    {v.imageUrl ? (
                      <img
                        src={v.imageUrl}
                        alt={v.title || 'Voucher'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full items-center justify-center bg-blue-50 text-blue-600"
                      style={{ display: v.imageUrl ? 'none' : 'flex' }}
                    >
                      <Ticket size={26} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bg: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={() => {
            setSelectedModalVoucher(null);
          }}
          color="inherit"
          size="small"
          sx={{ textTransform: 'none', color: '#64748b', fontSize: '13px' }}
        >
          Bỏ chọn
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', borderColor: '#cbd5e1', color: '#475569', fontSize: '13px' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSaveModalVoucher}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', backgroundColor: '#2563eb', fontSize: '13px', fontWeight: 600 }}
          >
            Lưu
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
