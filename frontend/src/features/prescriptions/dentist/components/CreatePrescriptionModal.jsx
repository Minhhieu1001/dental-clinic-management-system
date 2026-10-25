import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import SelectMedicineModal from './SelectMedicineModal';
import toast from 'react-hot-toast';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'align',
];

export default function CreatePrescriptionModal({
  isOpen,
  onClose,
  onSavePrescription,
  currentDoctorName = '',
  currentDoctorId = null,
  patient = null,
  type = 'create',
  prescriptionData = null,
}) {
  const [prescriber, setPrescriber] = useState(currentDoctorName || '');
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [prescriptionName, setPrescriptionName] = useState('');
  const [items, setItems] = useState([]);
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [isSelectMedModalOpen, setIsSelectMedModalOpen] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (type === 'edit' && prescriptionData) {
        setPrescriber(prescriptionData.prescriber || currentDoctorName || '');
        setPrescriptionCode(prescriptionData.prescriptionCode || prescriptionData.code || '');
        setPrescriptionName(prescriptionData.prescriptionName || '');
        setDoctorAdvice(prescriptionData.doctorAdvice || prescriptionData.advice || '');
        const mapped = (prescriptionData.prescriptionDetails || []).map((item) => ({
          medicineId: item.medicineId || item.id,
          code: item.medicineCode || item.code || '',
          brandName: item.brandName || '',
          name: item.medicineName || item.name || '',
          unit: item.unit || 'Viên',
          quantity: item.quantity || 1,
          dosage: item.dosage || item.usageInstruction || '',
          unitPrice: item.unitPrice || 0,
        }));
        setItems(mapped);
      } else {
        setPrescriber(currentDoctorName || '');
        setPrescriptionCode('');
        setPrescriptionName('');
        setItems([]);
        setDoctorAdvice('');
      }
    }
  }, [isOpen, type, prescriptionData, currentDoctorName]);

  // Handle adding medicines from SelectMedicineModal
  const handleSaveSelectedMedicines = (selectedList) => {
    setItems((prev) => {
      const copy = [...prev];
      selectedList.forEach((med) => {
        const existingIdx = copy.findIndex((c) => (c.code && c.code === med.code) || (c.medicineId && c.medicineId === med.id));
        if (existingIdx >= 0) {
          copy[existingIdx].quantity = (copy[existingIdx].quantity || 1) + 1;
        } else {
          copy.push({
            medicineId: med.id,
            code: med.code || '',
            brandName: med.brandName || '',
            name: med.name,
            unit: med.unit || 'Viên',
            quantity: 1,
            dosage: med.usageInstruction || '',
          });
        }
      });
      return copy;
    });
    toast.success(`Đã thêm ${selectedList.length} thuốc vào danh sách`);
  };

  // Remove row
  const handleRemoveRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field directly in table
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Save full prescription
  const handleSave = () => {
    const dentistId = type === 'edit' ? prescriptionData?.dentistId : currentDoctorId;
    if (!dentistId) {
      toast.error('Chưa xác định được bác sĩ kê đơn. Vui lòng kiểm tra hồ sơ bác sĩ.');
      return;
    }
    if (!prescriptionName.trim()) {
      toast.error('Vui lòng nhập tên đơn thuốc');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một loại thuốc vào đơn');
      return;
    }

    const cleanAdvice = doctorAdvice && doctorAdvice !== '<p><br></p>' ? doctorAdvice.trim() : '';

    const payload = {
      prescriptionCode: prescriptionCode.trim() || undefined,
      prescriptionName: prescriptionName.trim(),
      dentistId,
      doctorAdvice: cleanAdvice,
      prescriptionDate: (type === 'edit' && prescriptionData?.prescriptionDate)
        ? prescriptionData.prescriptionDate
        : new Date().toISOString(),
      prescriptionDetails: items.map((item) => ({
        medicineId: item.medicineId || null,
        medicineCode: item.code || '',
        brandName: item.brandName || '',
        medicineName: item.name || '',
        unit: item.unit || '',
        quantity: Number(item.quantity) || 1,
        dosage: item.dosage || '',
      })),
    };

    const targetId = type === 'edit' ? (prescriptionData?.id || prescriptionData?.prescriptionId) : null;
    onSavePrescription(payload, targetId);
    onClose();
  };

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKey = (e) => {
        if (e.key === 'Escape' && !isSelectMedModalOpen) onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, isSelectMedModalOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-prescription-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop with smooth blur and dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Dialog with smooth spring physics */}
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
            className="relative w-full max-w-6xl bg-white border border-slate-300 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-xs rounded-sm z-10"
          >
            {/* Header modal */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-600 inline-block"></span>
                {type === 'edit' ? 'CẬP NHẬT ĐƠN THUỐC' : 'KÊ ĐƠN THUỐC KHÁCH HÀNG'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Top Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Mã đơn thuốc */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã đơn thuốc: <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={prescriptionCode}
                    onChange={(e) => setPrescriptionCode(e.target.value.toUpperCase())}
                    placeholder="Tự động tạo (vd: DT-001)..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden font-mono font-semibold text-teal-800 uppercase"
                  />
                </div>

                {/* Bác sĩ kê đơn */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bác sĩ kê đơn: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={prescriber}
                    readOnly
                    placeholder="Chưa xác định bác sĩ kê đơn"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden font-semibold text-slate-800"
                  />
                </div>

                {/* Tên đơn thuốc */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đơn thuốc: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={prescriptionName}
                    onChange={(e) => setPrescriptionName(e.target.value)}
                    placeholder="Nhập tên đơn thuốc..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Action Bar with "Thêm thuốc" button in Teal with Icon */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsSelectMedModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Thêm thuốc</span>
                </button>
              </div>

              {/* Table of Prescribed Medicines with fixed height (~6 rows) and scroll */}
              <div className="border border-slate-300 overflow-x-auto h-[290px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-300 text-slate-700 font-bold text-[11px] border-b border-slate-300 sticky top-0 z-10 shadow-xs">

                    <tr>
                      <th className="w-12 py-2 px-3 text-center border-r border-slate-300">STT</th>
                      <th className="w-36 min-w-[130px] py-2 px-3 border-r border-slate-300 whitespace-nowrap">Mã thuốc</th>
                      <th className="min-w-[200px] px-3 border-r border-slate-300">Tên thuốc</th>
                      <th className="w-36 min-w-[130px] py-2 px-3 border-r border-slate-300 whitespace-nowrap">Đơn vị</th>
                      <th className="w-24 py-2 px-3 border-r border-slate-300 text-center whitespace-nowrap">Số lượng</th>
                      <th className="min-w-[260px] py-2 px-3 border-r border-slate-300">Cách dùng</th>
                      <th className="w-26 py-2 px-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Chưa có loại thuốc nào trong đơn. Vui lòng bấm "Thêm thuốc" ở trên.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium border-r border-slate-200 text-slate-700 whitespace-nowrap">
                            {item.code || ''}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-teal-600 focus:bg-white rounded-xs font-semibold text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                            <span className="inline-block px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {item.unit || 'Viên'}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                              className="w-16 px-2 py-1 text-center font-bold text-slate-800 border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <textarea
                              rows={2}
                              value={item.dosage || ''}
                              onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                              placeholder="Nhập cách dùng..."
                              className="w-full px-2 py-1 border border-slate-300 rounded-sm focus:border-teal-600 focus:outline-hidden text-xs text-slate-800"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 mx-auto cursor-pointer"
                              title="Xóa dòng"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Lời dặn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Lời dặn của Bác sĩ:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {(doctorAdvice || '').replace(/<[^>]*>/g, '').length} / 7000 ký tự
                  </span>
                </div>

                <div className="bg-white border border-slate-300 rounded-sm overflow-hidden text-xs shadow-2xs">
                  <ReactQuill
                    theme="snow"
                    value={doctorAdvice}
                    onChange={setDoctorAdvice}
                    placeholder="Nhập lời dặn bác sĩ điều trị (VD: Uống thuốc sau ăn, kiêng đồ ăn cay nóng, tái khám sau 5 ngày...)"
                    modules={quillModules}
                    formats={quillFormats}
                    className="quill-prescription-editor"
                  />
                </div>
              </div>
            </div>

            {/* Footer modal with Icons on all buttons */}
            <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-500">
                Tổng số thuốc: <strong className="text-slate-800">{items.length}</strong> loại
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-sm transition-colors cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>{type === 'edit' ? 'Cập nhật đơn thuốc' : 'Lưu thông tin'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                >
                  <X size={14} />
                  <span>Hủy bỏ</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <SelectMedicineModal
        isOpen={isSelectMedModalOpen}
        onClose={() => setIsSelectMedModalOpen(false)}
        onSaveSelected={handleSaveSelectedMedicines}
      />
    </AnimatePresence>,
    document.body
  );
}
