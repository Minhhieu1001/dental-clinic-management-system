import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { X, History, AlertCircle, User, IdCard, Phone } from 'lucide-react';
import { getPaymentTransactionByInvoiceId } from '../../../../services/paymentTransaction.service';
import PaymentTransactionDetail from './action/PaymentTransactionDetail';

export default function PaymentHistoryModal({ open, onClose, invoice }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;

    const targetId = invoice.rawId || invoice.id;
    const isUuid = typeof targetId === 'string' &&
      !targetId.startsWith('DRAFT-') &&
      !targetId.startsWith('HD-') &&
      targetId.length >= 32;

    if (isUuid) {
      setLoading(true);
      getPaymentTransactionByInvoiceId(targetId)
        .then((res) => {
          setTransactions(Array.isArray(res) ? res : []);
        })
        .catch((err) => {
          console.error('Lỗi khi tải lịch sử thanh toán:', err);
          setTransactions(invoice.paymentHistory || []);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setTransactions(invoice.paymentHistory || []);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0);

  const history = transactions;
  const paidAmount = invoice.paidAmount || 0;
  const totalAmount = invoice.finalAmount || 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  const handleOpenDetail = (pay) => {
    setSelectedTransaction(pay);
    setDetailOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          onClose();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ style: { borderRadius: '4px', maxWidth: '1050px', overflow: 'hidden' } }}
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-sm">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch sử giao dịch thanh toán
              </h3>
              <p className="text-xs text-slate-500">
                Mã hóa đơn: <span className="font-semibold text-slate-700">{invoice.id}</span>
              </p>
            </div>
          </div>
          <IconButton onClick={onClose} size="small" className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </IconButton>
        </div>

        {loading && <LinearProgress sx={{ height: 3 }} />}

        <DialogContent sx={{ p: 3, backgroundColor: '#f8fafc' }}>
          {/* Top Info Bar: Patient Info Left + Metric Cards Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
            {/* Patient Info Left with Icons */}
            <div className="flex items-center gap-3.5">
              <div className="w-15 h-15 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                <User size={30} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                  {invoice.patientName || 'Khách hàng'}
                </h4>
                <div className=" items-center gap-3.5 mt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-2">
                    <IdCard size={14} className="text-blue-500" />
                    Mã hồ sơ: <strong className="text-slate-800 font-semibold">{invoice.patientCode || invoice.patientProfileCode || invoice.patientId || '-'}</strong>
                  </span>
                  <span className="flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-blue-500" />
                    SĐT: <strong className="text-slate-800 font-semibold">{invoice.patientPhone}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Cards Right */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white px-4 py-2.5 rounded-sm border border-blue-200/80 min-w-[200px]">
                <span className="text-xs text-slate-500 font-medium block mb-0.5">Tổng hóa đơn</span>
                <span className="text-base font-black text-slate-900">{formatVND(totalAmount)}đ</span>
              </div>

              <div className="bg-emerald-50/50 px-4 py-2.5 rounded-sm border border-emerald-200/80 min-w-[200px]">
                <span className="text-xs text-emerald-700 font-medium block mb-0.5">Đã thanh toán</span>
                <span className="text-base font-black text-emerald-600">{formatVND(paidAmount)}đ</span>
              </div>

              <div className="bg-rose-50/50 px-4 py-2.5 rounded-sm border border-rose-200/80 min-w-[200px]">
                <span className="text-xs text-rose-700 font-medium block mb-0.5">Còn nợ</span>
                <span className="text-base font-black text-rose-600">{formatVND(remainingDebt)}đ</span>
              </div>
            </div>
          </div>

          {/* Transaction History Table Container - Fixed Height */}
          <div className="bg-white rounded-sm border border-slate-200 shadow-2xs h-[420px] flex flex-col justify-between overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Danh sách các lần thanh toán ({history.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {history.length > 0 ? (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>MÃ GD</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>THỜI GIAN</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>PHƯƠNG THỨC</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>SỐ TIỀN THU</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>TIỀN KHÁCH ĐƯA</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>TIỀN TRẢ LẠI</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>NGƯỜI THU</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '11.5px', color: '#475569', backgroundColor: '#f1f5f9', whiteSpace: 'nowrap', py: 1.5 }}>GHI CHÚ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((pay, idx) => {
                      const methodLabel = pay.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : (pay.paymentMethod === 'CASH' ? 'Tiền mặt' : (pay.paymentMethod === 'CREDIT_CARD' ? 'Thẻ ngân hàng' : (pay.paymentMethod || pay.method || 'Thanh toán')));
                      const dateStr = pay.paymentTime ? new Date(pay.paymentTime).toLocaleString('vi-VN') : (pay.date || '-');
                      const amount = Number(pay.totalAmount ?? pay.amount ?? 0);
                      const cash = pay.amountReceived !== undefined && pay.amountReceived !== null ? Number(pay.amountReceived) : pay.customerCash;
                      const change = pay.changeAmount !== undefined && pay.changeAmount !== null ? Number(pay.changeAmount) : pay.changeReturn;

                      return (
                        <TableRow
                          key={idx}
                          hover
                          onDoubleClick={() => handleOpenDetail(pay)}
                          title="Nhấp đôi để xem chi tiết giao dịch"
                          className="cursor-pointer select-none"
                        >
                          <TableCell
                            onClick={() => handleOpenDetail(pay)}
                            sx={{
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: '#2563eb',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {pay.transactionCode || pay.id || `PAY-${idx + 100}`}
                          </TableCell>
                          <TableCell sx={{ fontSize: '12.5px', color: '#334155' }}>{dateStr}</TableCell>
                          <TableCell sx={{ fontSize: '12.5px', color: '#334155' }}>
                            <Chip
                              label={methodLabel}
                              size="small"
                              sx={{
                                fontSize: '11px',
                                fontWeight: 600,
                                height: '22px',
                                backgroundColor: (pay.paymentMethod === 'CASH' || methodLabel === 'Tiền mặt') ? '#f0fdf4' : '#eff6ff',
                                color: (pay.paymentMethod === 'CASH' || methodLabel === 'Tiền mặt') ? '#166534' : '#1e40af',
                                border: `1px solid ${(pay.paymentMethod === 'CASH' || methodLabel === 'Tiền mặt') ? '#bbf7d0' : '#bfdbfe'}`,
                                borderRadius: '4px',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                            +{formatVND(amount)}đ
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                            {cash !== null && cash !== undefined ? `${formatVND(cash)}đ` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '12.5px', fontWeight: 600, color: '#059669' }}>
                            {change !== null && change !== undefined ? `${formatVND(change)}đ` : '-'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '12.5px', color: '#475569' }}>{pay.employeeName || pay.staff || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '12.5px', color: '#64748b' }}>{pay.note || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                  <AlertCircle size={32} className="mb-2 text-slate-300" />
                  Chưa có giao dịch thanh toán nào được ghi nhận cho hóa đơn này.
                </div>
              )}
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              backgroundColor: '#475569',
              borderRadius: '4px',
              px: 3,
              '&:hover': { backgroundColor: '#334155' },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Detail Modal */}
      <PaymentTransactionDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        transaction={selectedTransaction}
        invoice={invoice}
      />
    </>
  );
}
