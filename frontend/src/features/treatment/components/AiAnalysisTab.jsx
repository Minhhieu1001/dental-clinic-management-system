import { useState } from 'react';
import {
  Sparkles,
  Upload,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinicalExam } from '../ClinicalExamContext';

export default function AiAnalysisTab() {
  const {
    selectedTooth,
    aiOverlayEnabled,
    setAiOverlayEnabled,
    isAiAnalyzing,
    triggerAiAnalysis,
    setActiveTab,
  } = useClinicalExam();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleUploadImage = () => {
    toast.success('Mở hộp thoại chọn file ảnh X-quang (DICOM/JPEG/PNG) từ máy tính...', {
      icon: '📁',
    });
  };

  return (
    <div className="space-y-4">
      {/* 2 Cột: Card 1 (X-quang & Viewer) + Card 2 (Kết quả AI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Card 1 (7/12): X-quang & hình ảnh Viewer Canvas */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>X-quang & hình ảnh</span>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Phim Cận Chóp
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Xem phim X-quang kỹ thuật số và lớp phủ chẩn đoán AI hỗ trợ
              </p>
            </div>

            {/* 2 nút chức năng: Tải ảnh lên & Phân tích AI */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUploadImage}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Upload size={13} className="text-teal-700" />
                <span>Tải ảnh</span>
              </button>

              <button
                type="button"
                onClick={triggerAiAnalysis}
                disabled={isAiAnalyzing}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Sparkles size={13} className={isAiAnalyzing ? 'animate-spin' : ''} />
                <span>{isAiAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}</span>
              </button>
            </div>
          </div>

          {/* Main Canvas Viewer */}
          <div className="w-full relative rounded-xl bg-slate-950 p-3.5 text-white overflow-hidden min-h-[360px] flex flex-col justify-between shadow-inner border border-slate-800 select-none">
            {/* Header inside Canvas */}
            <div className="flex items-center justify-between text-xs px-2 pt-1 z-10">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-wide">
                  Răng {selectedTooth || 46}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [DICOM #0046]
                </span>
              </div>

              {/* AI Overlay Switch */}
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 shadow-2xs backdrop-blur-xs">
                <span className="text-[11px] text-slate-300 font-bold">AI overlay</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiOverlayEnabled}
                    onChange={() => setAiOverlayEnabled(!aiOverlayEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            </div>

            {/* X-Ray Image Viewer with Interactive Overlay */}
            <div className="relative flex items-center justify-center my-3 overflow-hidden rounded-lg">
              <div
                className="relative border border-slate-800 rounded bg-slate-900 p-2 shadow-lg w-full max-w-[500px] transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600"
                  alt={`X-ray Tooth ${selectedTooth || 46}`}
                  className="h-56 sm:h-64 w-full object-cover rounded opacity-90 grayscale contrast-125"
                />

                {/* Purple AI Decay Detection Simulation Overlay */}
                {aiOverlayEnabled && (
                  <div
                    className="absolute top-12 right-24 sm:right-28 w-20 h-16 bg-purple-600/60 backdrop-blur-[1px] border-2 border-purple-300 rounded-full shadow-lg animate-pulse flex items-center justify-center cursor-pointer"
                    title={`AI Phát hiện: Vùng sâu ngà Răng ${selectedTooth || 46} (Độ tin cậy: 96%)`}
                  >
                    <span className="text-[10px] font-black text-white px-1 py-0.5 rounded bg-purple-900/80">
                      96%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Zoom & Rotate Toolbar */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 px-1 z-10 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
                  className="p-1 hover:text-white rounded hover:bg-slate-800"
                  title="Phóng to"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  className="p-1 hover:text-white rounded hover:bg-slate-800"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 hover:text-white rounded hover:bg-slate-800"
                  title="Xoay ảnh"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="px-2 py-0.5 text-[10px] hover:text-white rounded hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-right">
                Kéo chuột để di chuyển • Scroll để zoom
              </p>
            </div>
          </div>
        </div>

        {/* Card 2 (5/12): Kết quả phân tích AI trên X-quang */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Sparkles size={16} />
              </span>
              <span>Kết quả phân tích AI trên X-quang</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Mô hình học sâu (Deep Learning) phát hiện tổn thương cấu trúc răng
            </p>
          </div>

          {/* Chú thích màu */}
          <div className="flex items-center gap-3 text-slate-600 font-semibold text-[11px] bg-purple-50/60 p-2.5 rounded-lg border border-purple-100">
            <span>Chú thích:</span>
            <span className="flex items-center gap-1.5 text-purple-800 font-bold">
              <span className="h-3 w-3 rounded-full bg-purple-600 shadow-xs ring-2 ring-purple-300" />
              Vùng nghi ngờ tổn thương (Pathology)
            </span>
          </div>

          {/* Sơ đồ tổn thương AI phát hiện */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              SƠ ĐỒ TỔN THƯƠNG AI PHÁT HIỆN
            </p>
            <div className="inline-block p-2 bg-white rounded-lg border border-purple-200 shadow-xs">
              <span className="inline-block rounded-md bg-purple-600 px-4 py-1.5 text-white font-extrabold text-sm tracking-wide shadow-xs">
                R{selectedTooth || 46}
              </span>
            </div>
            <p className="text-[11px] text-purple-900 font-bold">
              Độ tin cậy phát hiện: <span className="text-emerald-600">96.4%</span>
            </p>
          </div>

          {/* Chi tiết phát hiện */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center justify-between">
              <span>CHI TIẾT PHÁT HIỆN:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                Đã xác thực thuật toán
              </span>
            </p>

            <div className="space-y-2 text-slate-700 divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-bold text-slate-900">Mặt nhai, mặt gần</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Loại tổn thương:</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Sâu ngà (Dentin Caries)
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Mức độ:</span>
                <span className="font-bold text-amber-700">Trung bình</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Ảnh hưởng tủy:</span>
                <span className="font-semibold text-slate-700">Chưa thấy ảnh hưởng</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Viêm quanh chóp:</span>
                <span className="font-semibold text-slate-700">Không phát hiện</span>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setAiOverlayEnabled(!aiOverlayEnabled)}
            className="w-full mt-2 rounded-lg border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Eye size={14} className="text-purple-600" />
            <span>{aiOverlayEnabled ? 'Ẩn vùng AI trên X-quang' : 'Hiện vùng AI trên X-quang'}</span>
          </button>
        </div>
      </div>

      {/* Điều hướng giữa các bước */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Khám lâm sàng & Sơ đồ răng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnosis')}
          className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
        >
          <FileText size={14} />
          <span>Tiếp tục: Chẩn đoán của bác sĩ</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
