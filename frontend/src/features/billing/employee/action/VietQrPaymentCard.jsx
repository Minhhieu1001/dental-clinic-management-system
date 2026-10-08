import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Building2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Component hiển thị Mã VietQR Động & Thông tin chuyển khoản.
 * SỬ DỤNG 100% DỮ LIỆU TỪ BACKEND API (InitiateQrResponse).
 */
export default function VietQrPaymentCard({
  amount = 0,
  invoiceId = '',
  patientName = '',
  qrData = null,
  onSimulatePayment = null,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Chỉ lấy dữ liệu từ Backend API trả về (qrData)
  const qrUrl = qrData?.qrUrl || '';
  const transferMemo = qrData?.transactionCode || '';
  const accountNo = qrData?.accountNo || '';
  const accountName = qrData?.accountName || '';
  const bankName = qrData?.bankName || 'MBBank';
  const payAmount = qrData?.amount || amount;

  const imgRef = React.useRef(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImgLoading(false);
    } else {
      setImgLoading(true);
    }
    setImgError(false);
  }, [qrUrl, amount, invoiceId]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' đ';

  if (!qrData && !qrUrl) {
    return (
      <div className="bg-white rounded-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
        <span className="text-xs font-bold text-slate-600">Đang chờ dữ liệu mã VietQR từ Backend máy chủ...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-2xs p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Cột Trái: Mã QR Code VietQR từ BE */}
        <div className="md:col-span-6 flex flex-col items-center justify-between bg-slate-50/90 p-4 rounded-sm border border-slate-200/80 h-full">
          <div className="relative w-full aspect-square max-w-[360px] flex items-center justify-center bg-white rounded-sm p-2 shadow-xs border border-slate-200 my-auto">
            {imgLoading && (
              <div className="absolute inset-0 bg-white/95 rounded-sm flex flex-col items-center justify-center gap-2 z-10">
                <RefreshCw size={28} className="animate-spin text-blue-600" />
                <span className="text-xs font-bold text-slate-600">Đang tải mã VietQR...</span>
              </div>
            )}

            {imgError ? (
              <div className="text-center p-3 text-rose-500 space-y-1">
                <Info size={28} className="mx-auto text-rose-400" />
                <p className="text-xs font-bold">Không thể tải mã QR</p>
                <p className="text-[10px] text-slate-500">Vui lòng kiểm tra kết nối mạng</p>
              </div>
            ) : (
              <img
                ref={imgRef}
                src={qrUrl}
                alt="VietQR Payment Code"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  setImgError(true);
                }}
                className="w-full h-full object-contain rounded-xs"
              />
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-slate-900 block">
              Quét bằng ứng dụng Ngân hàng / Momo
            </span>
            <p className="text-[11px] text-slate-500 font-medium">Tự động nhận diện số tiền & nội dung chuyển khoản</p>
          </div>
        </div>

        {/* Cột Phải: Thông tin ngân hàng thụ hưởng từ BE & Nút copy */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-3 h-full">
          {/* Thông tin Ngân hàng Thụ hưởng từ BE */}
          <div className="bg-blue-50/70 p-2.5 rounded-sm border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 size={50} className="text-blue-700 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-blue-900 block uppercase tracking-wider">Ngân hàng thụ hưởng</span>
                <span className="text-xs font-black text-slate-900">{bankName}</span>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết chuyển khoản ERP Rộng Rãi */}
          <div className="bg-slate-50 rounded-sm p-2.5 border border-slate-200/90 space-y-2.5 text-xs flex-1 flex flex-col justify-center">
            {/* Số tài khoản */}
            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-sm border border-slate-200/80">
              <div>
                <span className="text-[13px] font-medium text-slate-500 block">Số tài khoản:</span>
                <span className="font-mono font-black text-slate-900 tracking-wider text-sm">{accountNo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accountNo, 'Số tài khoản')}
                className="px-2.5 py-1 text-xs font-bold rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer border border-slate-300/80"
              >
                {copiedField === 'Số tài khoản' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Tên chủ tài khoản */}
            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-sm border border-slate-200/80">
              <div>
                <span className="text-[13px] font-medium text-slate-500 block">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900 uppercase text-xs">{accountName}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accountName, 'Tên chủ tài khoản')}
                className="px-2.5 py-1 text-xs font-bold rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer border border-slate-300/80"
              >
                {copiedField === 'Tên chủ tài khoản' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedField === 'Tên chủ tài khoản' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Số tiền cần thanh toán */}
            <div className="flex items-center justify-between bg-emerald-50/80 px-3 py-2.5 rounded-sm border border-emerald-200">
              <div>
                <span className="text-[13px] font-bold text-emerald-800 block">Số tiền cần chuyển:</span>
                <span className="font-black text-emerald-700 text-base">{formatVND(payAmount)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(String(payAmount), 'Số tiền')}
                className="px-2.5 py-1 text-xs font-bold rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs border border-emerald-700"
              >
                {copiedField === 'Số tiền' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Nội dung chuyển khoản */}
            <div className="flex items-center justify-between bg-amber-50/90 px-3 py-3 rounded-sm border border-amber-300/80">
              <div>
                <span className="text-[13px] font-bold text-amber-900 block">
                  Nội dung chuyển khoản:
                </span>
                <span className="font-mono font-black text-amber-900 tracking-wider text-sm pt-3">{transferMemo}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
                className="px-2.5 py-1 text-xs font-bold rounded-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs border border-amber-700"
              >
                {copiedField === 'Nội dung chuyển khoản' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
