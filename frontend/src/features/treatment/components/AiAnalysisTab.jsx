import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  BrainCircuit,
  GitCompareArrows,
  ChevronRight,
  ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinicalExam } from '../ClinicalExamContext';
import {
  XRAY_IMAGE_TYPES,
  getImageTypeLabel,
  getSeverityMeta,
  getQuadrantLabel,
  reconcileClinicalWithXray,
  RECONCILE_META,
  describeClinical,
  buildDiagnosisPrefillFromFinding,
} from '../xrayAiHelpers';

const DECISION_META = {
  ACCEPTED: { label: 'Đã đồng ý', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Đã bác bỏ', cls: 'bg-slate-100 text-slate-500 border-slate-300', icon: XCircle },
  PENDING: { label: 'Chờ bác sĩ', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
};

export default function AiAnalysisTab() {
  const {
    selectedTooth,
    setSelectedTooth,
    examinedTeeth,
    primaryDiagnoses,
    aiOverlayEnabled,
    setAiOverlayEnabled,
    isAiAnalyzing,
    analyzeXrayFile,
    xrayAnalysis,
    setIsXrayModalOpen,
    setActiveTab,
    setPendingDiagnosisPrefill,
    isHistoricalSession,
  } = useClinicalExam();

  const fileInputRef = useRef(null);

  // File đang chọn xem trước nhưng chưa phân tích
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [selectedImageType, setSelectedImageType] = useState('AUTO');
  const [isDragging, setIsDragging] = useState(false);

  // Viewer state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [invert, setInvert] = useState(false);
  const [activeTabSub, setActiveTabSub] = useState('detail'); // 'detail' | 'reconcile'

  // Giải phóng object URL khi unmount
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  // Kiểm tra trạng thái: có ảnh hay chưa
  const hasAnalyzedData = Boolean(xrayAnalysis && xrayAnalysis.findings && xrayAnalysis.findings.length > 0);
  const hasImage = Boolean(pendingPreview || xrayAnalysis?.imageUrl);
  const displayImage = pendingPreview || xrayAnalysis?.imageUrl || null;

  // Danh sách phát hiện: CHỈ LẤY KHI ĐÃ CÓ KẾT QUẢ PHÂN TÍCH THỰC TẾ
  const findings = useMemo(() => {
    if (pendingFile) return []; // Nếu vừa chọn ảnh mới thì chưa có kết quả
    return xrayAnalysis?.findings || [];
  }, [xrayAnalysis, pendingFile]);

  // Răng đang được chọn xem chi tiết
  const activeToothNumber = selectedTooth || (findings[0]?.toothNumber ?? null);
  const activeFinding = useMemo(() => {
    if (findings.length === 0) return null;
    return (
      findings.find((f) => Number(f.toothNumber) === Number(activeToothNumber)) ||
      findings[0]
    );
  }, [findings, activeToothNumber]);

  // Quyết định đối soát của bác sĩ từ doctorReview
  const doctorDecisions = useMemo(() => {
    return xrayAnalysis?.doctorReview?.decisions || {};
  }, [xrayAnalysis]);

  const activeFindingDecision = activeFinding ? (doctorDecisions[activeFinding.id] || 'PENDING') : 'PENDING';

  // Đối soát lâm sàng với X-quang
  const reconciliation = useMemo(() => {
    if (!hasAnalyzedData) return [];
    return reconcileClinicalWithXray(examinedTeeth, {
      findings,
      teeth: xrayAnalysis?.teeth || [],
    });
  }, [examinedTeeth, findings, xrayAnalysis, hasAnalyzedData]);

  const activeReconcile = reconciliation.find(
    (r) => Number(r.toothNumber) === Number(activeToothNumber)
  );

  // Xử lý chọn file từ máy tính
  const handlePickFile = (file) => {
    if (!file) return;
    const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!okTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file ảnh JPEG, PNG, WEBP. Với file DICOM, vui lòng xuất sang JPEG/PNG từ phần mềm máy chụp.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng phim tối đa 10MB.');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setZoomLevel(1);
    setRotation(0);
    setInvert(false);
  };

  // Nạp mẫu X-quang thử nghiệm cho bác sĩ test nhanh
  const handleLoadSampleDemo = () => {
    fetch('/sample-panoramic-xray.jpg')
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'phim-panorama-mau-test.jpg', { type: 'image/jpeg' });
        handlePickFile(file);
        setSelectedImageType('PANORAMIC');
        toast.success('Đã tải phim Panorama mẫu để thử nghiệm. Nhấn "Phân tích AI" để quét!');
      })
      .catch(() => {
        toast.error('Không tải được phim mẫu. Vui lòng chọn file ảnh từ máy tính.');
      });
  };

  // Bắt đầu gọi AI phân tích ảnh đã chọn
  const handleStartAnalysis = async () => {
    if (!pendingFile && !xrayAnalysis?.imageUrl) {
      toast.error('Vui lòng chọn hoặc tải phim X-quang lên trước khi phân tích!');
      return;
    }
    if (pendingFile) {
      const res = await analyzeXrayFile(pendingFile, selectedImageType);
      if (res) {
        setPendingFile(null);
        setPendingPreview(null);
        if (res.findings && res.findings.length > 0) {
          setSelectedTooth(res.findings[0].toothNumber);
        }
      }
    } else {
      setIsXrayModalOpen(true);
    }
  };

  // Hủy ảnh đang chọn để tải lại
  const handleCancelPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  // Đồng ý chuyển phát hiện AI sang Bước 3 (Chẩn đoán)
  const handleDiagnoseCurrentFinding = () => {
    if (!activeFinding) return;
    const clinical = examinedTeeth.find((t) => Number(t.toothNumber) === Number(activeFinding.toothNumber));
    const prefill = buildDiagnosisPrefillFromFinding(activeFinding, primaryDiagnoses, clinical);
    setPendingDiagnosisPrefill(prefill);
    setActiveTab('diagnosis');
    toast.success(`Đã chuyển đề xuất Răng ${activeFinding.toothNumber} sang Bước 3: Chẩn đoán bác sĩ!`);
  };

  return (
    <div className="space-y-4">
      {/* Ẩn input file */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handlePickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* =========================================================================
       * KHỐI TRÊN: 2 CỘT CHÍNH (CANVAS X-QUANG KỸ THUẬT SỐ & KẾT QUẢ PHÂN TÍCH AI)
       * ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1 (7/12): X-quang & hình ảnh Viewer Canvas */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>X-quang & hình ảnh nha khoa</span>
                <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {hasImage ? getImageTypeLabel(xrayAnalysis?.imageType || selectedImageType) : 'Chờ tải phim'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Xem phim X-quang kỹ thuật số và lớp phủ chẩn đoán AI hỗ trợ
              </p>
            </div>

            {/* Các nút hành động */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isHistoricalSession || isAiAnalyzing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                title="Tải ảnh X-quang từ máy tính"
              >
                <Upload size={13} className="text-teal-700" />
                <span>{hasImage ? 'Đổi phim khác' : 'Tải phim lên'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsXrayModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-extrabold text-purple-900 hover:bg-purple-100 transition-colors shadow-2xs cursor-pointer"
                title="Mở giao diện phân tích toàn diện trên modal kích thước lớn"
              >
                <Maximize2 size={13} className="text-purple-700" />
                <span>Bản phim lớn</span>
              </button>

              {hasImage && !hasAnalyzedData && (
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={isAiAnalyzing || isHistoricalSession}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Sparkles size={13} className={isAiAnalyzing ? 'animate-spin' : ''} />
                  <span>{isAiAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}</span>
                </button>
              )}
            </div>
          </div>

          {/* MAIN VIEWER CANVAS */}
          <div
            className="w-full relative rounded-2xl bg-slate-950 p-3 sm:p-4 text-white overflow-hidden min-h-[390px] flex flex-col justify-between shadow-inner border border-slate-800 select-none"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handlePickFile(e.dataTransfer.files?.[0]);
            }}
          >
            {/* TRƯỜNG HỢP 1: CHƯA CÓ ẢNH ĐƯỢC TẢI LÊN (EMPTY UPLOAD STATE CHUẨN Y KHOA) */}
            {!hasImage ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto">
                <div
                  className={`w-full max-w-lg rounded-2xl border-2 border-dashed p-8 sm:p-10 transition-all ${isDragging
                    ? 'border-teal-400 bg-teal-500/10 scale-102'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 mb-4 shadow-inner">
                    <ImageIcon size={32} />
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white">
                    Chưa có phim X-quang cho đợt khám này
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
                    Kéo thả hoặc chọn phim X-quang nha khoa từ máy tính để AI tiến hành quét cấu trúc răng, đo độ sâu tổn thương và đối soát lâm sàng.
                  </p>

                  {/* Chế độ nhận diện AI tự động */}
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
                    <div
                      className="flex items-center gap-1.5 bg-slate-800 text-teal-300 border border-teal-500/30 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm"
                      title="AI tự động phân loại cấu trúc phim và phát hiện răng"
                    >
                      <Sparkles size={13} className="text-teal-400 animate-pulse" />
                      <span>Nhận diện AI tự động</span>
                    </div>
                  </div>

                  {/* Nhãn định dạng hỗ trợ */}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-500 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">DICOM Export</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">JPEG</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">PNG</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Tối đa 10MB</span>
                  </div>

                  {/* Các nút hành động chính */}
                  <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white hover:bg-teal-500 transition-colors shadow-lg cursor-pointer"
                    >
                      <Upload size={15} />
                      <span>Chọn phim X-quang từ máy tính</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleDemo}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                      title="Nạp phim Panorama mẫu để thử nghiệm nhanh tính năng AI"
                    >
                      <Sparkles size={13} />
                      <span>Dùng phim mẫu thử nghiệm</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP 2 & 3: ĐÃ CÓ ẢNH (ẢNH MỚI CHỌN HOẶC ĐÃ PHÂN TÍCH XONG) */
              <>
                {/* Header inside Canvas */}
                <div className="flex items-center justify-between text-xs px-1 pt-0.5 z-10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {hasAnalyzedData && activeToothNumber ? (
                      <>
                        <span className="font-extrabold text-base text-white tracking-wide flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                          Răng {activeToothNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          [DICOM #00{activeToothNumber}]
                        </span>
                        {activeFinding && (
                          <span className="text-[10.5px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/60 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                            {activeFinding.label.split('(')[0].trim()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        {pendingFile ? `Phim mới: ${pendingFile.name}` : 'Phim X-quang đã tải lên'}
                      </span>
                    )}
                  </div>

                  {/* Toolbar chế độ hiển thị */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInvert((v) => !v)}
                      className={`text-[10.5px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${invert
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      title="Đảo màu âm bản (dễ nhìn thấu quang cuống chóp)"
                    >
                      Âm bản
                    </button>

                    {hasAnalyzedData && (
                      <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700 shadow-2xs backdrop-blur-xs">
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
                    )}
                  </div>
                </div>

                {/* IMAGE CANVAS VỚI LỚP PHỦ AI ĐỘC QUYỀN (CHỈ HIỆN KHI ĐÃ PHÂN TÍCH XONG) */}
                <div className="relative flex items-center justify-center my-3 overflow-hidden rounded-xl bg-black/60 border border-slate-800/80 p-2 min-h-[260px]">
                  <div
                    className="relative rounded bg-slate-900 shadow-lg w-full max-w-[620px] transition-transform duration-200 overflow-hidden"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={displayImage}
                      alt="Phim X-quang răng"
                      className={`w-full max-h-[300px] sm:max-h-[320px] object-contain mx-auto rounded transition-all duration-150 ${invert ? 'invert brightness-110 contrast-125' : 'contrast-115'
                        }`}
                    />

                    {/* HIỆU ỨNG QUÉT KHI ĐANG PHÂN TÍCH */}
                    {isAiAnalyzing && (
                      <div className="absolute inset-0 overflow-hidden rounded pointer-events-none">
                        <div className="absolute inset-0 bg-teal-500/15" />
                        <div className="absolute left-0 right-0 h-14 bg-gradient-to-b from-transparent via-teal-300/60 to-transparent animate-pulse" />
                      </div>
                    )}

                    {/* CÁC HỘP GIỚI HẠN AI (CHỈ VẼ KHI ĐÃ CÓ KẾT QUẢ VÀ BẬT OVERLAY) */}
                    {hasAnalyzedData &&
                      aiOverlayEnabled &&
                      findings.map((f) => {
                        const isCurrent = Number(f.toothNumber) === Number(activeToothNumber);
                        if (!Array.isArray(f.box_2d) || f.box_2d.length !== 4) return null;
                        const [ymin, xmin, ymax, xmax] = f.box_2d;
                        const sev = getSeverityMeta(f.severity);
                        const dec = doctorDecisions[f.id] || 'PENDING';
                        const isRej = dec === 'REJECTED';

                        return (
                          <div
                            key={f.id}
                            onClick={() => setSelectedTooth(f.toothNumber)}
                            className={`absolute rounded-md cursor-pointer transition-all ${
                              isRej
                                ? 'opacity-35 line-through border-dashed'
                                : isCurrent
                                  ? 'ring-2 ring-purple-300 animate-pulse z-20'
                                  : 'hover:opacity-100 opacity-80 z-10'
                            }`}
                            style={{
                              top: `${ymin / 10}%`,
                              left: `${xmin / 10}%`,
                              height: `${(ymax - ymin) / 10}%`,
                              width: `${(xmax - xmin) / 10}%`,
                              border: `${isCurrent ? 2.5 : 1.5}px ${isRej ? 'dashed' : 'solid'} ${isRej ? '#94a3b8' : sev.stroke}`,
                              backgroundColor: isRej ? 'rgba(148, 163, 184, 0.1)' : isCurrent ? sev.fill : 'rgba(147, 51, 234, 0.12)',
                            }}
                            title={`AI Phát hiện: ${f.label} - Răng ${f.toothNumber} (${f.confidence}%)${isRej ? ' [BÁC SĨ ĐÃ BÁC BỎ]' : dec === 'ACCEPTED' ? ' [ĐÃ ĐỒNG Ý]' : ''}`}
                          >
                            <span
                              className={`absolute -top-4 left-0 text-[9px] font-black text-white px-1 py-0.2 rounded shadow-xs whitespace-nowrap ${
                                isRej ? 'bg-slate-500 line-through' : ''
                              }`}
                              style={isRej ? {} : { backgroundColor: sev.stroke }}
                            >
                              R{f.toothNumber} · {Math.round(f.confidence)}%{isRej ? ' (Đã bác bỏ)' : ''}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* BANNER THAO TÁC KHI VỪA TẢI ẢNH MỚI NHƯNG CHƯA BẤM PHÂN TÍCH */}
                  {!hasAnalyzedData && pendingPreview && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-slate-700 px-3.5 py-2 shadow-2xl backdrop-blur-sm z-30">
                      <span className="text-[11px] text-slate-300 max-w-[180px] truncate">
                        {pendingFile?.name || 'Ảnh vừa tải lên'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelPending}
                        disabled={isAiAnalyzing}
                        className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleStartAnalysis}
                        disabled={isAiAnalyzing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-purple-600 px-3.5 py-1 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isAiAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        <span>{isAiAnalyzing ? 'Đang đọc phim...' : 'Bắt đầu phân tích AI'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ZOOM & ROTATE TOOLBAR */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 px-1 z-10 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(+(z + 0.2).toFixed(2), 3))}
                      className="p-1 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Phóng to"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(+(z - 0.2).toFixed(2), 0.7))}
                      className="p-1 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Thu nhỏ"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-300 w-10 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      title="Xoay ảnh 90°"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomLevel(1);
                        setRotation(0);
                        setInvert(false);
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-400">
                    {hasAnalyzedData ? (
                      <span>Nhấp vào vùng khoanh đỏ để chọn răng</span>
                    ) : (
                      <span>Nhấn &quot;Bắt đầu phân tích AI&quot; để đọc phim</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsXrayModalOpen(true)}
                      className="text-teal-400 hover:text-teal-300 font-bold underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở toàn màn hình</span>
                      <Maximize2 size={11} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SƠ ĐỒ CHỌN NHANH CÁC RĂNG AI PHÁT HIỆN TỔN THƯƠNG (CHỈ HIỆN KHI ĐÃ PHÂN TÍCH XONG) */}
          {hasAnalyzedData && findings.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <BrainCircuit size={13} className="text-purple-600" />
                  Răng AI phát hiện tổn thương trên phim ({findings.length} răng):
                </span>
                <span className="text-[10.5px] text-slate-400">Chọn răng để xem đối soát</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {findings.map((f) => {
                  const isSelected = Number(f.toothNumber) === Number(activeToothNumber);
                  const sev = getSeverityMeta(f.severity);
                  const dec = doctorDecisions[f.id] || 'PENDING';
                  const isRej = dec === 'REJECTED';

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedTooth(f.toothNumber)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-mono transition-all cursor-pointer border ${
                        isRej
                          ? 'bg-slate-100 text-slate-400 border-slate-300 opacity-70 line-through'
                          : isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm scale-105'
                            : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                      title={isRej ? `Răng ${f.toothNumber}: Bác sĩ đã bác bỏ phát hiện này` : `Răng ${f.toothNumber}`}
                    >
                      <span>R{f.toothNumber}</span>
                      <span
                        className={`text-[9.5px] px-1 py-0.2 rounded font-sans font-bold ${
                          isRej
                            ? 'bg-slate-200 text-slate-500'
                            : isSelected
                              ? 'bg-white/20 text-white'
                              : sev.badge
                        }`}
                      >
                        {isRej ? 'Bác bỏ' : `${f.confidence}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Card 2 (5/12): Kết quả phân tích AI trên X-quang & Đối soát lâm sàng */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3.5 flex-1 flex flex-col">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Kết quả phân tích AI trên X-quang
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mô hình học sâu (Deep Learning) phát hiện tổn thương cấu trúc răng
                </p>
              </div>

              {hasAnalyzedData ? (
                /* Nút chuyển tab phụ khi đã có dữ liệu phân tích */
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10.5px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTabSub('detail')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${activeTabSub === 'detail'
                      ? 'bg-white text-purple-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabSub('reconcile')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${activeTabSub === 'reconcile'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    Đối soát
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                  Chờ phim X-quang
                </span>
              )}
            </div>

            {/* TRƯỜNG HỢP A: CHƯA CÓ KẾT QUẢ PHÂN TÍCH (EMPTY STATE PHẢI) */}
            {!hasAnalyzedData ? (
              <div className="py-6 px-3 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                  <BrainCircuit size={28} />
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    {pendingPreview
                      ? 'Phim đã sẵn sàng phân tích'
                      : 'Chưa có dữ liệu phân tích X-quang'}
                  </h4>
                  <p className="text-slate-500 text-[11.5px] max-w-xs mx-auto leading-relaxed">
                    {pendingPreview
                      ? 'Nhấn nút "Bắt đầu phân tích AI" để mô hình quét toàn bộ phim và trích xuất tổn thương.'
                      : 'Vui lòng tải phim X-quang lên ở khung bên trái để AI tiến hành đọc phim.'}
                  </p>
                </div>

                {/* Quy trình nghiệp vụ 4 bước chuẩn phòng khám */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 text-left space-y-2 text-[11px]">
                  <p className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px]">
                    Quy trình phân tích & đối soát y khoa:
                  </p>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                      <span>Tải phim X-quang (Panorama, Cận chóp, Cánh cắn)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                      <span>AI quét men, ngà, tủy, chóp và đánh số răng FDI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                      <span>Bác sĩ đối soát chéo với khám lâm sàng Bước 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                      <span>Đồng ý kết luận và chuyển sang Bước 3 (Chẩn đoán)</span>
                    </div>
                  </div>
                </div>

                {pendingPreview && (
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    disabled={isAiAnalyzing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
                  >
                    {isAiAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>{isAiAnalyzing ? 'Đang phân tích...' : 'Bắt đầu phân tích AI ngay'}</span>
                  </button>
                )}
              </div>
            ) : activeTabSub === 'detail' ? (
              /* TRƯỜNG HỢP B: TAB PHỤ 1 - CHI TIẾT TỔN THƯƠNG AI */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Sơ đồ tổn thương AI phát hiện */}
                  <div className="bg-gradient-to-r from-purple-50/70 via-white to-slate-50 p-3.5 rounded-xl border border-purple-200/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          SƠ ĐỒ TỔN THƯƠNG AI PHÁT HIỆN
                        </p>
                        {activeFindingDecision === 'REJECTED' && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.2 rounded-full border border-slate-300">
                            Bác sĩ đã bác bỏ
                          </span>
                        )}
                        {activeFindingDecision === 'ACCEPTED' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-300">
                            Bác sĩ đã đồng ý
                          </span>
                        )}
                      </div>
                      <p className={`font-extrabold text-sm ${activeFindingDecision === 'REJECTED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {activeFinding?.label || `Tổn thương Răng ${activeToothNumber}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activeFinding?.region || getQuadrantLabel(activeToothNumber)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block rounded-xl font-mono font-black text-base px-3 py-1 shadow-2xs ${
                        activeFindingDecision === 'REJECTED'
                          ? 'bg-slate-400 text-white line-through'
                          : 'bg-purple-700 text-white'
                      }`}>
                        R{activeToothNumber}
                      </span>
                      <p className="text-[10.5px] text-purple-900 font-extrabold mt-1">
                        Độ tin cậy: <span className="text-emerald-700">{activeFinding?.confidence || 96}%</span>
                      </p>
                    </div>
                  </div>

                  {/* Chi tiết phát hiện theo chuẩn bệnh án */}
                  <div className="space-y-2 pt-2.5">
                    <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide flex items-center justify-between">
                      <span>CHI TIẾT PHÁT HIỆN:</span>
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                        Đã xác thực thuật toán
                      </span>
                    </p>

                    <div className="space-y-2 text-slate-700 divide-y divide-slate-100 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500">Vị trí:</span>
                        <span className="font-bold text-slate-900">
                          {activeFinding?.surfaces || 'Mặt nhai, mặt gần'}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Loại tổn thương:</span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {activeFinding?.label?.split('(')[0]?.trim() || 'Sâu ngà (Dentin Caries)'}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Mức độ:</span>
                        <span
                          className={`font-bold px-2 py-0.2 rounded text-[10.5px] border ${getSeverityMeta(activeFinding?.severity).badge
                            }`}
                        >
                          {activeFinding?.severity || 'Trung bình'}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Ảnh hưởng tủy:</span>
                        <span className="font-semibold text-slate-800">
                          {activeFinding?.pulpInvolvement || 'Chưa thấy ảnh hưởng'}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Viêm quanh chóp:</span>
                        <span className="font-semibold text-slate-800">
                          {activeFinding?.periapicalStatus || 'Không phát hiện'}
                        </span>
                      </div>

                      {activeFinding?.evidence && (
                        <div className="pt-2 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800">Dấu hiệu X-quang: </span>
                          <span>{activeFinding.evidence}</span>
                        </div>
                      )}

                      {activeFinding?.recommendation && (
                        <div className="pt-2 text-[11px] text-teal-900 bg-teal-50/90 p-2.5 rounded-lg border border-teal-200/80">
                          <span className="font-bold">Khuyến nghị xử lý: </span>
                          <span>{activeFinding.recommendation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP C: TAB PHỤ 2 - ĐỐI SOÁT LÂM SÀNG BƯỚC 1 VÀ X-QUANG */
              <div className="space-y-3">
                <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-teal-950 text-xs flex items-center gap-1.5">
                      <GitCompareArrows size={14} className="text-teal-700" />
                      Đối soát Răng {activeToothNumber}
                    </span>
                    {activeReconcile && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${RECONCILE_META[activeReconcile.status].badge
                          }`}
                      >
                        {RECONCILE_META[activeReconcile.status].label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-800">
                    {activeReconcile?.advice ||
                      'So sánh giữa triệu chứng lâm sàng ở Bước 1 và hình ảnh X-quang ở Bước 2.'}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/70">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">
                      Khám lâm sàng (Bước 1):
                    </span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">
                      {describeClinical(
                        examinedTeeth.find((t) => Number(t.toothNumber) === Number(activeToothNumber))
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-200 p-2.5 bg-purple-50/50">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide block">
                      Phát hiện hình ảnh học (Bước 2):
                    </span>
                    <p className="font-bold text-purple-950 text-xs mt-0.5">
                      {activeFinding?.label || 'Chưa phát hiện tổn thương'}
                    </p>
                    {activeFinding?.evidence && (
                      <p className="text-[11px] text-slate-600 mt-1">{activeFinding.evidence}</p>
                    )}
                  </div>
                </div>

                {/* Danh sách tóm tắt tất cả các răng đối soát */}
                <div className="pt-1">
                  <p className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">
                    Tất cả các răng có đối soát:
                  </p>
                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {reconciliation.map((r) => {
                      const m = RECONCILE_META[r.status];
                      const isSel = Number(r.toothNumber) === Number(activeToothNumber);

                      return (
                        <div
                          key={r.toothNumber}
                          onClick={() => setSelectedTooth(r.toothNumber)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-[11px] transition-colors cursor-pointer ${isSel
                            ? 'bg-purple-100/70 border-purple-300 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <span className="font-mono font-bold text-slate-900">
                            R{r.toothNumber}
                          </span>
                          <span className="text-slate-600 truncate max-w-[140px]">
                            {r.aiFindings[0]?.label || 'Lâm sàng'}
                          </span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold border ${m.badge}`}
                          >
                            {m.short}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS DƯỚI CARD 2 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {hasAnalyzedData ? (
              activeFindingDecision === 'REJECTED' ? (
                <div className="w-full rounded-xl bg-slate-100 py-2.5 px-3 text-xs font-bold text-slate-500 border border-slate-200 flex items-center justify-center gap-2">
                  <XCircle size={14} className="text-slate-500" />
                  <span>Phát hiện này đã bị bác sĩ bác bỏ (không lập chẩn đoán)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDiagnoseCurrentFinding}
                  disabled={isHistoricalSession}
                  className="w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <FileText size={14} />
                  <span>Đồng ý & lập chẩn đoán cho Răng {activeToothNumber}</span>
                  <ChevronRight size={14} />
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                <span>Cần tải và phân tích phim trước khi lập chẩn đoán</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsXrayModalOpen(true)}
              className="w-full rounded-xl border border-purple-300 bg-purple-50/60 py-2 text-xs font-bold text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Maximize2 size={13} className="text-purple-700" />
              <span>Mở giao diện đọc phim AI chuyên sâu (Toàn màn hình)</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * ĐIỀU HƯỚNG GIỮA CÁC BƯỚC KHÁM
       * ========================================================================= */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Bước 1: Khám lâm sàng & Sơ đồ răng</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsXrayModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3.5 py-2 text-xs font-extrabold text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <BrainCircuit size={14} className="text-purple-700" />
            <span>Trình đọc phim AI chuyên sâu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnosis')}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <FileText size={14} />
            <span>Tiếp tục: Bước 3 - Chẩn đoán của bác sĩ</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
