import { useState, useEffect } from 'react';
import {
  X,
  Scan,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  RefreshCw,
  FileText,
  UserRound,
  ShieldCheck,
  Stethoscope,
  Check,
} from 'lucide-react';
import { cleanDoctorName } from '../../utils/certificateOcr';

export default function OcrCertificateReviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageFile,
  ocrData,
  isScanning,
  progress = 0,
  statusMessage = '',
  isPracticeLicense = true,
  onConfirm,
  onRescan,
}) {
  const [formData, setFormData] = useState({
    certificate_name: '',
    certificate_number: '',
    issued_by: '',
    issue_date: '',
    expiry_date: '',
    is_lifetime: true,
    certificate_type: 'GENERAL_DENTISTRY',
    qualification: '',
    scope_of_practice: '',
    doctor_name: '',
    identity_card_number: '',
    date_of_birth: '',
    address: '',
    syncToPersonal: true,
  });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Sync state when ocrData changes or modal opens
  useEffect(() => {
    if (ocrData) {
      setFormData({
        certificate_name: ocrData.certificate_name || (isPracticeLicense ? 'Chứng chỉ hành nghề khám bệnh, chữa bệnh' : 'Chứng chỉ chuyên môn'),
        certificate_number: ocrData.certificate_number || '',
        issued_by: ocrData.issued_by || '',
        issue_date: ocrData.issue_date || '',
        expiry_date: ocrData.expiry_date || '',
        is_lifetime: ocrData.is_lifetime !== undefined ? ocrData.is_lifetime : true,
        certificate_type: ocrData.certificate_type || 'GENERAL_DENTISTRY',
        qualification: ocrData.qualification || '',
        scope_of_practice: ocrData.scope_of_practice || '',
        doctor_name: cleanDoctorName(ocrData.doctor_name || ''),
        identity_card_number: ocrData.identity_card_number || '',
        date_of_birth: ocrData.date_of_birth || '',
        address: ocrData.address || '',
        syncToPersonal: true,
      });
    }
  }, [ocrData, isPracticeLicense]);

  // Reset zoom & rotation when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    if (onConfirm) {
      onConfirm({
        ...formData,
        doctor_name: cleanDoctorName(formData.doctor_name),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container - thật lớn (w-[96vw] max-w-7xl h-[92vh]) */}
      <div className="relative w-[96vw] max-w-7xl h-[92vh] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Đối soát & Quét thông tin chứng chỉ
                </h2>

              </div>
              <p className="text-xs text-slate-500">
                So sánh ảnh gốc bên trái và dữ liệu nhận diện tự động bên phải để đảm bảo chính xác 100%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRescan && (
              <button
                type="button"
                onClick={onRescan}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                title="Quét lại ảnh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : ''}`} />
                <span>Quét lại</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">

          {/* Left Column (50% / 6 cols): Image Preview with Zoom & Controls */}
          <div className="lg:col-span-6 flex flex-col bg-slate-900/95 min-h-0 relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-white text-xs shrink-0 z-10">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Ảnh chứng chỉ gốc
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-1 text-[11px] font-mono text-slate-400 min-w-[42px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors ml-1"
                  title="Xoay ảnh 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Đặt lại khung nhìn"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Image Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0 select-none relative">
              {imageUrl ? (
                <div
                  className="transition-transform duration-150 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Chứng chỉ"
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-slate-700 pointer-events-auto"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">Chưa có ảnh chứng chỉ</p>
                </div>
              )}

              {/* Scanning Overlay Animation */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
                    <div className="relative w-full h-full rounded-full border-4 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                      <Scan className="w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-blue-300">Đang nhận diện dữ liệu AI...</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs text-center">
                    {statusMessage || 'Đang quét phân tích họ tên, văn bằng, số CCHN...'}
                  </p>
                  <div className="w-48 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.max(10, Math.round(progress * 100))}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 mt-1">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (50% / 6 cols): Review & Edit Form */}
          <div className="lg:col-span-6 flex flex-col bg-white min-h-0">
            {/* Status Banner */}
            <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Dữ liệu đã trích xuất — Bạn có thể chỉnh sửa trực tiếp nếu muốn</span>
              </div>
              {formData.doctor_name && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  BS: {formData.doctor_name}
                </span>
              )}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Group 1: Thông tin chứng chỉ */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  1. Thông tin văn bản hành nghề
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Tên chứng chỉ</label>
                    <input
                      type="text"
                      value={formData.certificate_name}
                      onChange={(e) => handleChange('certificate_name', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Số chứng chỉ (CCHN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.certificate_number}
                      onChange={(e) => handleChange('certificate_number', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-bold text-blue-700 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Nơi cấp (Cơ quan cấp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.issued_by}
                      onChange={(e) => handleChange('issued_by', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Ngày cấp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => handleChange('issue_date', e.target.value)}
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Ngày hết hạn</label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_lifetime}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleChange('is_lifetime', checked);
                            if (checked) handleChange('expiry_date', '');
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Vô thời hạn</span>
                      </label>
                    </div>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      disabled={formData.is_lifetime}
                      onChange={(e) => handleChange('expiry_date', e.target.value)}
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Chuyên môn y tế */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  2. Trình độ & Phạm vi chuyên môn
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Văn bằng chuyên môn</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => handleChange('qualification', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Phạm vi hoạt động chuyên môn</label>
                    <textarea
                      rows={2}
                      value={formData.scope_of_practice}
                      onChange={(e) => handleChange('scope_of_practice', e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Thông tin đối chiếu Bác sĩ */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <UserRound className="w-4 h-4 text-purple-600" />
                    3. Thông tin bác sĩ trên chứng chỉ
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-blue-700 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    <input
                      type="checkbox"
                      checked={formData.syncToPersonal}
                      onChange={(e) => handleChange('syncToPersonal', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Tự động cập nhật vào thông tin cá nhân</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Họ và tên bác sĩ</label>
                    <input
                      type="text"
                      value={formData.doctor_name}
                      onChange={(e) => handleChange('doctor_name', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-bold text-purple-900 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Số CMND / CCCD</label>
                    <input
                      type="text"
                      value={formData.identity_card_number}
                      onChange={(e) => handleChange('identity_card_number', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Ngày sinh</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange('date_of_birth', e.target.value)}
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder=""
                      className="w-full px-3 h-9 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/70 transition-colors"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận & Điền thông tin vào Form
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
