import React, { useState, useEffect, useMemo } from 'react';
import { X, Pill, User, Search, RefreshCw, CheckCircle2, Calendar, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Radio,
} from '@mui/material';
import { getPrescriptions } from '../../../../services/prescription.service';

const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PrescriptionSelectModal({
  open,
  onClose,
  patientName,
  patientId,
  patientCode,
  onAddPrescriptionItems,
}) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRxId, setSelectedRxId] = useState(null);

  // Fetch prescriptions when modal opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedRxId(null);
      fetchPatientPrescriptions();
    }
  }, [open, patientId, patientCode]);

  const fetchPatientPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await getPrescriptions({ patientId, patientCode });
      const list = Array.isArray(data) ? data : [];
      setPrescriptions(list);
      if (list.length > 0) {
        setSelectedRxId(list[0].id);
      }
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách đơn thuốc bệnh nhân:', err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter prescriptions by search term (search by prescriptionCode, name, or doctor)
  const filteredPrescriptions = useMemo(() => {
    if (!searchTerm.trim()) return prescriptions;
    const term = searchTerm.trim().toLowerCase();
    return prescriptions.filter((p) => {
      const code = (p.prescriptionCode || p.code || (p.id ? String(p.id).slice(0, 8) : '')).toLowerCase();
      const name = (p.prescriptionName || '').toLowerCase();
      const doctor = (p.prescriber || '').toLowerCase();
      return code.includes(term) || name.includes(term) || doctor.includes(term);
    });
  }, [prescriptions, searchTerm]);

  // Handle adding selected prescription into invoice
  const handleConfirmAdd = () => {
    const selectedRx = prescriptions.find((p) => String(p.id) === String(selectedRxId));
    if (!selectedRx) {
      onClose();
      return;
    }

    // let itemsToAdd = [];
    // const details = selectedRx.prescriptionDetails || [];

    // if (details.length > 0) {
    //   itemsToAdd = details.map((item, idx) => ({
    //     stt: idx + 1,
    //     name: item.medicineName || item.name || 'Thuốc',
    //     dosage: item.dosage || '',
    //     quantity: item.quantity || 1,
    //     unit: item.unit || 'viên',
    //     note: item.dosage || '',
    //     amount: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
    //   }));
    // } else {
    //   itemsToAdd = [];
    // }

    if (onAddPrescriptionItems) {
      onAddPrescriptionItems(selectedRx);
    }
    onClose();
  };

  const selectedRx = prescriptions.find((p) => String(p.id) === String(selectedRxId));

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onClose();
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{ style: { borderRadius: '6px', overflow: 'hidden', maxWidth: '850px' } }}
    >
      {/* Header Modal */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Pill size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
              Chọn đơn thuốc vào hóa đơn
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-sm hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <DialogContent className="p-4 space-y-3 bg-white">
        {/* Panel Thông tin Khách hàng */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-sm p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
              <User size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{patientName || 'Khách hàng'}</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Mã bệnh nhân: <span className="font-bold text-blue-700">{patientCode || patientId || 'N/A'}</span>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                Tổng số đơn thuốc: <span className="font-bold text-slate-800">{prescriptions.length} đơn</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPatientPrescriptions}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 px-2 py-1 rounded-sm bg-white border border-blue-200 hover:bg-blue-50 cursor-pointer shadow-2xs"
            title="Tải lại danh sách"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Thanh tìm kiếm Mã đơn thuốc / Tên đơn thuốc */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập mã đơn thuốc "
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Section: Bảng Đơn thuốc của bệnh nhân */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              <span>Danh sách đơn thuốc của bệnh nhân ({filteredPrescriptions.length})</span>
            </h4>
            {selectedRx && (
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-200">
                Đã chọn đơn: {selectedRx.prescriptionCode || (selectedRx.id ? String(selectedRx.id).slice(0, 8).toUpperCase() : 'DT-SELECT')}
              </span>
            )}
          </div>

          {/* Table hiển thị danh sách đơn thuốc theo các cột yêu cầu */}
          <div className="border border-slate-200 rounded-sm overflow-hidden max-h-[300px] overflow-y-auto">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: '#f0f9ff', color: '#1e3a8a', fontWeight: 700, fontSize: '11px', py: 1, px: 1.5, borderRight: '1px solid #e2e8f0' } }}>
                  <TableCell align="center" sx={{ width: 45 }}>STT</TableCell>
                  <TableCell sx={{ width: 110 }}>Mã đơn thuốc</TableCell>
                  <TableCell sx={{ width: 140 }}>Ngày kê đơn</TableCell>
                  <TableCell>Tên đơn thuốc</TableCell>
                  <TableCell sx={{ width: 140 }}>Bác sĩ kê</TableCell>

                  <TableCell align="right" sx={{ width: 110 }}>Tổng tiền</TableCell>
                  <TableCell align="center" sx={{ width: 60, borderRight: 'none !important' }}>Chọn</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                      <span className="text-xs font-semibold">Đang tải đơn thuốc bệnh nhân...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredPrescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <Pill size={28} className="mx-auto mb-1 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-xs">
                        {searchTerm ? 'Không tìm thấy đơn thuốc khớp với mã/tên tìm kiếm' : 'Bệnh nhân chưa có đơn thuốc nào'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrescriptions.map((rx, idx) => {
                    const isSelected = String(rx.id) === String(selectedRxId);
                    const rxCode = rx.prescriptionCode;

                    return (
                      <TableRow
                        key={rx.id || idx}
                        hover
                        onClick={() => setSelectedRxId(rx.id)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          '&:hover': { backgroundColor: isSelected ? '#dbeafe' : '#f8fafc' },
                          '& td': { borderRight: '1px solid #f1f5f9', py: 1.2, px: 1.5, fontSize: '12px' },
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>
                          {idx + 1}
                        </TableCell>

                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e40af' }}>
                          {rxCode}
                        </TableCell>

                        <TableCell sx={{ color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatDateTime(rx.prescriptionDate || rx.createdAt)}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {rx.prescriptionName || 'Đơn thuốc điều trị'}
                        </TableCell>

                        <TableCell sx={{ color: '#334155' }}>
                          {rx.prescriber || 'Nha sĩ'}
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800, color: '#047857' }}>
                          {formatVND(rx.totalAmount)}
                        </TableCell>

                        <TableCell align="center" sx={{ borderRight: 'none !important', p: '0 !important' }}>
                          <Radio
                            checked={isSelected}
                            onChange={() => setSelectedRxId(rx.id)}
                            value={rx.id}
                            size="small"
                            sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#2563eb' } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Selected Prescription Details Summary */}
        {selectedRx && (
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-2.5  items-end">
            <div className="text-right">
              <span className="text-slate-600 text-[11px] block">Tổng tiền đơn thuốc đã chọn:</span>
              <strong className="text-emerald-700 text-sm font-extrabold">{formatVND(selectedRx.totalAmount)}</strong>
            </div>
          </div>
        )}

        {/* Footer Nút Đóng & Thêm vào hóa đơn */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={!selectedRxId || prescriptions.length === 0}
            className={`px-4 py-1.5 rounded-sm font-bold text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${selectedRxId && prescriptions.length > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
          >
            <CheckCircle2 size={14} />
            <span>Thêm vào hóa đơn</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
