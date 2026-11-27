import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Contrast,
  Sun,
  Eye,
  EyeOff,
  Tag,
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowRight,
  AlertTriangle,
  ScanLine,
  BrainCircuit,
  FileCheck2,
  GitCompareArrows,
  ImageIcon,
  Save,
  Loader2,
  History,
  Info,
  Stethoscope,
  Filter,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useClinicalExam } from '../ClinicalExamContext';
import {
  FDI_UPPER,
  FDI_LOWER,
  XRAY_IMAGE_TYPES,
  getImageTypeLabel,
  getToothStatusMeta,
  getSeverityMeta,
  getConfidenceTone,
  getQuadrantLabel,
  isPathologyFinding,
  isClinicalAbnormal,
  reconcileClinicalWithXray,
  RECONCILE_META,
  describeClinical,
  buildDiagnosisPrefillFromFinding,
} from '../xrayAiHelpers';

const QUALITY_LABEL = { GOOD: 'Tốt', ACCEPTABLE: 'Chấp nhận được', POOR: 'Kém — nên chụp lại' };
const DECISION_META = {
  ACCEPTED: { label: 'Đã đồng ý', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Đã bác bỏ', cls: 'bg-slate-100 text-slate-500 border-slate-300', icon: XCircle },
  PENDING: { label: 'Chờ bác sĩ', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function XrayAiAnalysisModal() {
  const {
    isXrayModalOpen,
    setIsXrayModalOpen,
    patient,
    examinedTeeth,
    primaryDiagnoses,
    xrayAnalysis,
    setXrayAnalysis,
    xrayHistory,
    analyzeXrayFile,
    reanalyzeCurrentXray,
    saveXrayReview,
    isAiAnalyzing,
    isHistoricalSession,
    setActiveTab,
    setPendingDiagnosisPrefill,
    treatmentSessions,
    selectedSessionId,
  } = useClinicalExam();

  const fileInputRef = useRef(null);
  const viewerRef = useRef(null);

  // Ảnh đang chọn (trước khi phân tích) & loại phim
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [imageType, setImageType] = useState('AUTO');
  const [isDragging, setIsDragging] = useState(false);

  // Viewer
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(110);
  const [invert, setInvert] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [onlyPathology, setOnlyPathology] = useState(false);
  const dragRef = useRef(null);

  // Lựa chọn & đối soát
  const [rightTab, setRightTab] = useState('findings');
  const [selectedFindingId, setSelectedFindingId] = useState(null);
  const [focusTooth, setFocusTooth] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [doctorNote, setDoctorNote] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  const readOnly = Boolean(isHistoricalSession);
  const analysis = pendingFile ? null : xrayAnalysis;
  const currentSession = treatmentSessions?.find(
    (s) => String(s.id) === String(selectedSessionId) || String(s.examinationResultId) === String(selectedSessionId)
  );

  // Đồng bộ quyết định đối soát khi đổi kết quả phân tích
  useEffect(() => {
    setDecisions(xrayAnalysis?.doctorReview?.decisions || {});
    setDoctorNote(xrayAnalysis?.doctorReview?.doctorNote || '');
    setSelectedFindingId(null);
    setFocusTooth(null);
  }, [xrayAnalysis?.analysisId, xrayAnalysis?.analyzedAt]);

  // Reset viewer khi đổi ảnh
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [pendingPreview, xrayAnalysis?.imageUrl]);

  // Giải phóng object URL
  useEffect(() => () => pendingPreview && URL.revokeObjectURL(pendingPreview), [pendingPreview]);

  // ESC để đóng
  useEffect(() => {
    if (!isXrayModalOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setIsXrayModalOpen(false);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isXrayModalOpen, setIsXrayModalOpen]);

  // Zoom bằng con lăn (listener non-passive để chặn cuộn trang)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => Math.min(5, Math.max(0.5, +(z + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isXrayModalOpen, analysis, pendingPreview]);

  const findings = useMemo(() => analysis?.findings || [], [analysis]);
  const visibleFindings = useMemo(
    () =>
      findings.filter(
        (f) => (!onlyPathology || isPathologyFinding(f)) && (!focusTooth || Number(f.toothNumber) === Number(focusTooth))
      ),
    [findings, onlyPathology, focusTooth]
  );
  const teethStatusMap = useMemo(() => {
    const m = {};
    (analysis?.teeth || []).forEach((t) => {
      m[t.toothNumber] = t;
    });
    return m;
  }, [analysis]);
  const clinicalMap = useMemo(() => {
    const m = {};
    (examinedTeeth || []).forEach((t) => {
      m[Number(t.toothNumber)] = t;
    });
    return m;
  }, [examinedTeeth]);
  const reconciliation = useMemo(() => reconcileClinicalWithXray(examinedTeeth, analysis), [examinedTeeth, analysis]);
  const reconcileByTooth = useMemo(() => {
    const m = {};
    reconciliation.forEach((r) => {
      m[r.toothNumber] = r;
    });
    return m;
  }, [reconciliation]);
  const reconcileCounts = useMemo(() => {
    const c = { MATCH: 0, PARTIAL: 0, XRAY_ONLY: 0, CLINICAL_ONLY: 0 };
    reconciliation.forEach((r) => {
      c[r.status] += 1;
    });
    return c;
  }, [reconciliation]);

  const decisionOf = useCallback((id) => decisions[id] || 'PENDING', [decisions]);
  const decisionCounts = useMemo(() => {
    const c = { ACCEPTED: 0, REJECTED: 0, PENDING: 0 };
    findings.forEach((f) => {
      c[decisionOf(f.id)] += 1;
    });
    return c;
  }, [findings, decisionOf]);
  const pathologyCount = findings.filter(isPathologyFinding).length;
  const affectedTeeth = new Set(findings.filter((f) => f.toothNumber).map((f) => f.toothNumber)).size;

  // ======================= Handlers =======================
  const handlePickFile = (file) => {
    if (!file) return;
    const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!okTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ JPEG, PNG, WEBP. Với DICOM vui lòng xuất sang JPEG/PNG từ phần mềm máy chụp.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng phim tối đa 10MB.');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setRightTab('findings');
  };

  const handleLoadSampleDemo = () => {
    fetch('/sample-panoramic-xray.jpg')
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'phim-panorama-mau-test.jpg', { type: 'image/jpeg' });
        handlePickFile(file);
        setImageType('PANORAMIC');
        toast.success('Đã tải phim Panorama mẫu để thử nghiệm. Nhấn "Bắt đầu phân tích AI" để quét!');
      })
      .catch(() => {
        toast.error('Không tải được phim mẫu. Vui lòng chọn file ảnh từ máy tính.');
      });
  };

  const handleStartAnalysis = async () => {
    if (!pendingFile) return;
    const result = await analyzeXrayFile(pendingFile, imageType);
    if (result) {
      setPendingFile(null);
      setPendingPreview(null);
      setRightTab('findings');
    }
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const setDecision = (id, value) => {
    if (readOnly) return;
    setDecisions((prev) => ({ ...prev, [id]: prev[id] === value ? 'PENDING' : value }));
  };

  const acceptAllHighConfidence = () => {
    if (readOnly) return;
    setDecisions((prev) => {
      const next = { ...prev };
      findings.forEach((f) => {
        if ((f.confidence || 0) >= 85 && (!next[f.id] || next[f.id] === 'PENDING')) next[f.id] = 'ACCEPTED';
      });
      return next;
    });
    toast.success('Đã đồng ý các phát hiện có độ tin cậy ≥ 85%. Vui lòng rà soát lại các phát hiện còn lại.');
  };

  const handleSaveReview = async (silent = false) => {
    if (!analysis || readOnly) return true;
    setIsSavingReview(true);
    const ok = await saveXrayReview({ decisions, doctorNote });
    setIsSavingReview(false);
    if (ok && !silent) toast.success('Đã lưu kết quả đối soát X-quang vào hồ sơ đợt khám.');
    return ok;
  };

  const handleCreateDiagnosis = async (finding) => {
    if (readOnly) return;
    const nextDecisions = { ...decisions, [finding.id]: 'ACCEPTED' };
    setDecisions(nextDecisions);
    await saveXrayReview({ decisions: nextDecisions, doctorNote });
    setPendingDiagnosisPrefill(
      buildDiagnosisPrefillFromFinding(finding, primaryDiagnoses, clinicalMap[Number(finding.toothNumber)])
    );
    setIsXrayModalOpen(false);
    setActiveTab('diagnosis');
  };

  const handleGoToDiagnosis = async () => {
    if (analysis && !readOnly) {
      if (decisionCounts.PENDING > 0) {
        toast(`Còn ${decisionCounts.PENDING} phát hiện AI chưa được bác sĩ xác nhận.`, { icon: '⚠️' });
      }
      await handleSaveReview(true);
    }
    setIsXrayModalOpen(false);
    setActiveTab('diagnosis');
  };

  const handleSelectFinding = (f) => {
    setSelectedFindingId((cur) => (cur === f.id ? null : f.id));
    setRightTab('findings');
    // Đưa khung tổn thương vào giữa khung nhìn khi đang phóng to
    if (f.box_2d && zoom > 1) setPan({ x: 0, y: 0 });
  };

  const handleToothClick = (no) => {
    setFocusTooth((cur) => (cur === no ? null : no));
    setSelectedFindingId(null);
  };

  // Kéo để di chuyển ảnh
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y, moved: false };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    dragRef.current.moved = true;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  const imageSrc = pendingPreview || analysis?.imageUrl || null;
  const notDental = analysis && analysis.isDentalRadiograph === false;

  // ======================= Sub-renders =======================
  const renderToothCell = (no) => {
    const aiTooth = teethStatusMap[no];
    const meta = aiTooth ? getToothStatusMeta(aiTooth.status) : null;
    const rec = reconcileByTooth[no];
    const hasFinding = findings.some((f) => Number(f.toothNumber) === no);
    const clinicalAbn = isClinicalAbnormal(clinicalMap[no]);
    const isFocus = Number(focusTooth) === no;
    return (
      <button
        key={no}
        type="button"
        onClick={() => handleToothClick(no)}
        title={`Răng ${no} · ${getQuadrantLabel(no)}\nAI: ${meta ? meta.label : 'Chưa đọc'}${aiTooth?.note ? ` — ${aiTooth.note}` : ''}\nLâm sàng: ${describeClinical(clinicalMap[no])}${rec ? `\nĐối soát: ${RECONCILE_META[rec.status].label}` : ''}`}
        className={`relative flex flex-col items-center justify-center rounded-md border text-[10.5px] font-black font-mono h-11 transition-all cursor-pointer ${isFocus ? 'ring-2 ring-offset-1 ring-teal-500 scale-105 z-10' : 'hover:scale-105'
          }`}
        style={{
          backgroundColor: meta ? meta.bg : '#F8FAFC',
          borderColor: meta ? meta.color : '#E2E8F0',
          borderStyle: meta?.dashed ? 'dashed' : 'solid',
          color: meta ? meta.text : '#94A3B8',
        }}
      >
        <span>{no}</span>
        <span className="text-[8.5px] font-bold leading-none mt-0.5 truncate max-w-full px-0.5 opacity-80">
          {meta && aiTooth.status !== 'NORMAL' ? meta.label.split(' ')[0] : ''}
        </span>
        {hasFinding && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-purple-600 ring-2 ring-white" />}
        {clinicalAbn && <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-white" />}
      </button>
    );
  };

  const renderFindingCard = (f) => {
    const sev = getSeverityMeta(f.severity);
    const tone = getConfidenceTone(f.confidence || 0);
    const decision = decisionOf(f.id);
    const dMeta = DECISION_META[decision];
    const DIcon = dMeta.icon;
    const rec = f.toothNumber ? reconcileByTooth[f.toothNumber] : null;
    const isSelected = selectedFindingId === f.id;
    return (
      <div
        key={f.id}
        onClick={() => handleSelectFinding(f)}
        className={`rounded-xl border p-3.5 space-y-2.5 transition-all cursor-pointer ${isSelected
          ? 'border-purple-400 bg-purple-50/50 shadow-md ring-1 ring-purple-300'
          : decision === 'REJECTED'
            ? 'border-slate-200 bg-slate-50/70 opacity-70'
            : 'border-slate-200 bg-white hover:border-purple-200 hover:shadow-sm'
          }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="shrink-0 inline-flex flex-col items-center justify-center rounded-lg bg-purple-700 text-white w-12 h-12 shadow-sm">
              <span className="text-[9px] font-bold opacity-80 leading-none">RĂNG</span>
              <span className="text-base font-black font-mono leading-tight">{f.toothNumber || '—'}</span>
            </span>
            <div className="min-w-0">
              <p className={`font-extrabold text-slate-900 text-[13px] leading-snug ${decision === 'REJECTED' ? 'line-through' : ''}`}>
                {f.label || 'Tổn thương nghi ngờ'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {f.region || getQuadrantLabel(f.toothNumber)}
                {f.surfaces ? ` · ${f.surfaces}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sev.badge}`}>{f.severity}</span>
                {f.icd10 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border bg-sky-50 text-sky-800 border-sky-200">
                    ICD {f.icd10}
                  </span>
                )}
                {rec && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${RECONCILE_META[rec.status].badge}`}>
                    {RECONCILE_META[rec.status].short}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${dMeta.cls}`}>
                  <DIcon size={10} /> {dMeta.label}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right w-20">
            <p className={`font-mono font-black text-sm ${tone.text}`}>{(f.confidence ?? 0).toFixed(1)}%</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/70">
              <div className={`h-full bg-gradient-to-r ${tone.bar}`} style={{ width: `${f.confidence || 0}%` }} />
            </div>
            <p className="text-[9.5px] text-slate-400 mt-0.5 font-semibold">Tin cậy {tone.label.toLowerCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Ảnh hưởng tủy</span>
            <span className="font-bold text-slate-800 text-right">{f.pulpInvolvement || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Vùng quanh chóp</span>
            <span className="font-bold text-slate-800 text-right">{f.periapicalStatus || '—'}</span>
          </div>
          <div className="col-span-2 flex justify-between gap-2 pt-1 border-t border-slate-200/70">
            <span className="text-slate-500 shrink-0">Lâm sàng (B1)</span>
            <span className="font-semibold text-slate-700 text-right">
              {describeClinical(clinicalMap[Number(f.toothNumber)])}
            </span>
          </div>
        </div>

        {f.evidence && (
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-700">Dấu hiệu trên phim: </span>
            {f.evidence}
          </p>
        )}
        {f.recommendation && (
          <p className="text-[11px] text-teal-900 bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
            <span className="font-bold">Khuyến nghị: </span>
            {f.recommendation}
          </p>
        )}

        {!readOnly && (
          <div className="flex items-center justify-end gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setDecision(f.id, 'REJECTED')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-colors cursor-pointer ${decision === 'REJECTED'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              title="AI nhận định sai (dương tính giả) — không đưa vào chẩn đoán"
            >
              <XCircle size={12} /> Bác bỏ
            </button>
            <button
              type="button"
              onClick={() => setDecision(f.id, 'ACCEPTED')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-colors cursor-pointer ${decision === 'ACCEPTED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                }`}
              title="Bác sĩ đồng ý với phát hiện của AI"
            >
              <CheckCircle2 size={12} /> Đồng ý
            </button>
            <button
              type="button"
              onClick={() => handleCreateDiagnosis(f)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-xs"
              title="Đồng ý & mở form lập chẩn đoán ở Bước 3 với dữ liệu điền sẵn"
            >
              <Stethoscope size={12} /> Lập chẩn đoán
            </button>
          </div>
        )}
      </div>
    );
  };

  const modal = (
    <AnimatePresence mode="wait">
      {isXrayModalOpen && (
        <motion.div
          key="xray-ai-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 will-change-[opacity]"
          onMouseDown={(e) => e.target === e.currentTarget && setIsXrayModalOpen(false)}
        >
          <motion.div
            key="xray-ai-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            className="w-[98vw] max-w-[1800px] h-[95vh] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/30 will-change-[transform,opacity]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* ============================ HEADER ============================ */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-teal-800 via-teal-700 to-purple-800 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 shrink-0">
                  <BrainCircuit size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Phân tích X-quang bằng AI · Đối soát lâm sàng
                  </h2>
                  <p className="text-[11.5px] text-teal-50/90 font-medium truncate">
                    {patient?.fullName || 'Bệnh nhân'}
                    {patient?.patientCode ? ` · ${patient.patientCode}` : ''}
                    {currentSession ? ` · ${currentSession.label} (${currentSession.date})` : ''}
                    {analysis?.model ? ` · Mô hình: ${analysis.model}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {xrayHistory?.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg border border-white/20 px-2 py-1">
                    <History size={13} />
                    <select
                      value={xrayAnalysis?.analysisId || xrayAnalysis?.xrayImageId || ''}
                      onChange={(e) => {
                        const found = xrayHistory.find(
                          (h) => String(h.analysisId || h.xrayImageId) === e.target.value
                        );
                        if (found) {
                          handleCancelPending();
                          setXrayAnalysis(found);
                        }
                      }}
                      className="bg-transparent text-xs font-bold outline-none cursor-pointer max-w-[230px]"
                    >
                      {xrayHistory.map((h, i) => (
                        <option key={h.analysisId || h.xrayImageId || i} value={h.analysisId || h.xrayImageId} className="text-slate-800">
                          Phim #{xrayHistory.length - i} · {getImageTypeLabel(h.imageType).split(' (')[0]} ·{' '}
                          {formatDateTime(h.analyzedAt || h.captureDate)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!pendingPreview && analysis?.imageUrl && (
                  <button
                    type="button"
                    onClick={() => reanalyzeCurrentXray && reanalyzeCurrentXray(analysis.imageType || imageType)}
                    disabled={isAiAnalyzing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/25 text-white px-3 py-1.5 text-xs font-semibold hover:bg-white/25 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Chạy AI phân tích lại phim X-quang đang xem"
                  >
                    <RotateCcw size={13} className={isAiAnalyzing ? 'animate-spin' : ''} />
                    <span>{isAiAnalyzing ? 'Đang phân tích...' : 'Phân tích lại'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAiAnalyzing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white text-teal-800 px-3 py-1.5 text-xs font-semibold hover:bg-teal-50 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Tải phim
                </button>
                {readOnly && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 border border-amber-300/40 px-2.5 py-1.5 text-[11px] font-bold">
                    <Lock size={12} /> Đợt khám đã khóa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsXrayModalOpen(false)}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X size={18} />
                </button>
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
              </div>
            </div>

            {/* ============================ BODY ============================ */}
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-hidden">
              {/* ---------------- LEFT: VIEWER + ODONTOGRAM ---------------- */}
              <div className="xl:col-span-7 flex flex-col min-h-0 bg-slate-950 border-r border-slate-800">
                {/* Toolbar */}
                <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800 text-slate-300 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer" title="Phóng to" onClick={() => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))}>
                      <ZoomIn size={15} />
                    </button>
                    <button type="button" className="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer" title="Thu nhỏ" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
                      <ZoomOut size={15} />
                    </button>
                    <span className="font-mono w-11 text-center text-slate-400">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer"
                      title="Khôi phục"
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                        setBrightness(100);
                        setContrast(110);
                        setInvert(false);
                      }}
                    >
                      <RotateCcw size={14} />
                    </button>
                    <span className="w-px h-5 bg-slate-700 mx-1.5" />
                    <label className="flex items-center gap-1.5" title="Độ sáng">
                      <Sun size={13} />
                      <input type="range" min={50} max={180} value={brightness} onChange={(e) => setBrightness(+e.target.value)} className="w-20 accent-teal-500" />
                    </label>
                    <label className="flex items-center gap-1.5 ml-2" title="Độ tương phản">
                      <Contrast size={13} />
                      <input type="range" min={50} max={220} value={contrast} onChange={(e) => setContrast(+e.target.value)} className="w-20 accent-teal-500" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setInvert((v) => !v)}
                      className={`ml-2 px-2 py-1 rounded font-bold cursor-pointer ${invert ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}
                      title="Đảo màu âm bản (dễ quan sát vùng thấu quang)"
                    >
                      Âm bản
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowOverlay((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold cursor-pointer ${showOverlay ? 'bg-purple-600 text-white' : 'hover:bg-slate-800'}`}
                    >
                      {showOverlay ? <Eye size={13} /> : <EyeOff size={13} />} Vùng AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLabels((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold cursor-pointer ${showLabels ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}
                    >
                      <Tag size={12} /> Nhãn
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlyPathology((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold cursor-pointer ${onlyPathology ? 'bg-rose-600 text-white' : 'hover:bg-slate-800'}`}
                      title="Chỉ hiện tổn thương bệnh lý (ẩn miếng trám, mão, implant...)"
                    >
                      <Filter size={12} /> Bệnh lý
                    </button>
                  </div>
                </div>

                {/* Canvas */}
                <div
                  ref={viewerRef}
                  className="relative flex-1 min-h-[280px] overflow-hidden select-none"
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  onDragOver={(e) => {
                    if (readOnly) return;
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    if (readOnly) return;
                    e.preventDefault();
                    setIsDragging(false);
                    handlePickFile(e.dataTransfer.files?.[0]);
                  }}
                  style={{ cursor: imageSrc ? 'grab' : 'default' }}
                >
                  {!imageSrc ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <div
                        className={`w-full max-w-md rounded-xl border p-8 text-center transition-colors ${isDragging ? 'border-teal-400 bg-teal-950/20' : 'border-slate-800/80 bg-slate-900/50'
                          }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                          Kho lưu trữ hình ảnh & X-quang
                        </p>
                        <h4 className="text-base font-bold text-slate-100 mt-1.5">
                          Chưa có phim X-quang cho đợt khám này
                        </h4>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                          Kéo thả hoặc chọn file phim X-quang từ thiết bị để bắt đầu phân tích cấu trúc răng và đối soát lâm sàng.
                        </p>

                        {!readOnly ? (
                          <div className="mt-5 flex items-center justify-center">
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-500 cursor-pointer shadow-xs transition-colors"
                            >
                              Chọn phim từ máy tính
                            </button>
                          </div>
                        ) : (
                          <div className="mt-5 flex flex-col items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-300 font-medium">
                              <Lock size={12} /> Đợt khám đã kết thúc / khóa hồ sơ
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer shadow-xs transition-colors"
                              title="Tải phim lên để xem hoặc bổ sung hồ sơ phim"
                            >
                              Tải phim bổ sung từ máy tính
                            </button>
                          </div>
                        )}

                        <p className="mt-4 text-[11px] text-slate-500">
                          Định dạng hỗ trợ: DICOM export, JPEG, PNG (tối đa 10MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div
                        className="relative inline-block transition-transform duration-75"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}
                      >
                        <img
                          src={imageSrc}
                          alt="Phim X-quang"
                          draggable={false}
                          className="block max-w-full object-contain rounded-md shadow-2xl"
                          style={{
                            maxHeight: 'calc(95vh - 300px)',
                            filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
                          }}
                        />

                        {/* Lớp phủ khung tổn thương AI */}
                        {showOverlay &&
                          !pendingPreview &&
                          visibleFindings
                            .filter((f) => Array.isArray(f.box_2d) && decisionOf(f.id) !== 'REJECTED')
                            .map((f) => {
                              const [ymin, xmin, ymax, xmax] = f.box_2d;
                              const sev = getSeverityMeta(f.severity);
                              const isSel = selectedFindingId === f.id;
                              const dim = selectedFindingId && !isSel;
                              return (
                                <div
                                  key={f.id}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={() => handleSelectFinding(f)}
                                  className={`absolute rounded-md cursor-pointer transition-all ${isSel ? 'animate-pulse' : ''}`}
                                  style={{
                                    top: `${ymin / 10}%`,
                                    left: `${xmin / 10}%`,
                                    height: `${(ymax - ymin) / 10}%`,
                                    width: `${(xmax - xmin) / 10}%`,
                                    border: `${isSel ? 3 : 2}px solid ${sev.stroke}`,
                                    backgroundColor: sev.fill,
                                    boxShadow: isSel ? `0 0 0 3px ${sev.stroke}55, 0 0 18px ${sev.stroke}` : 'none',
                                    opacity: dim ? 0.35 : 1,
                                  }}
                                  title={`R${f.toothNumber || '?'} · ${f.label} · ${f.confidence}%`}
                                >
                                  {showLabels && (
                                    <span
                                      className="absolute -top-[18px] left-0 whitespace-nowrap rounded px-1.5 py-[1px] text-[9.5px] font-black text-white shadow"
                                      style={{ backgroundColor: sev.stroke, transform: `scale(${1 / zoom})`, transformOrigin: 'bottom left' }}
                                    >
                                      R{f.toothNumber || '?'} · {Math.round(f.confidence)}%
                                    </span>
                                  )}
                                </div>
                              );
                            })}

                        {/* Hiệu ứng quét khi AI đang phân tích */}
                        {isAiAnalyzing && (
                          <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                            <div className="absolute inset-0 bg-teal-500/10" />
                            <motion.div
                              className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-teal-300/50 to-transparent"
                              initial={{ top: '-15%' }}
                              animate={{ top: '100%' }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Thẻ thông tin góc phim */}
                      <div className="absolute top-3 left-3 rounded-lg bg-slate-900/85 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300 space-y-0.5 pointer-events-none">
                        <p className="font-extrabold text-white text-xs">
                          {pendingPreview ? 'Phim mới — chưa phân tích' : getImageTypeLabel(analysis?.imageType)}
                        </p>
                        {!pendingPreview && analysis && (
                          <p>
                            {formatDateTime(analysis.analyzedAt || analysis.captureDate)} · {findings.length} phát hiện
                          </p>
                        )}
                        <p className="text-slate-500">P ← bên phải BN · bên trái BN → T</p>
                      </div>
                      {focusTooth && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setFocusTooth(null)}
                          className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Đang lọc răng {focusTooth} <X size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Thanh xác nhận phân tích khi vừa chọn phim */}
                  {pendingPreview && (
                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-2rem)] flex items-center gap-2.5 rounded-xl bg-slate-900/95 border border-slate-700 px-3.5 py-2 shadow-xl backdrop-blur-md z-30"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-medium text-slate-200 max-w-[160px] sm:max-w-[240px] truncate">
                        {pendingFile?.name || 'Ảnh vừa tải lên'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelPending}
                        disabled={isAiAnalyzing}
                        className="shrink-0 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleStartAnalysis}
                        disabled={isAiAnalyzing}
                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                      >
                        {isAiAnalyzing ? <Loader2 size={13} className="animate-spin shrink-0" /> : null}
                        <span>{isAiAnalyzing ? 'Đang đọc phim...' : 'Bắt đầu phân tích AI'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sơ đồ răng FDI theo AI */}
                <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <ScanLine size={13} className="text-purple-600" /> Sơ đồ 32 răng AI quét được (FDI)
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600" /> Có phát hiện AI</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Bất thường lâm sàng (B1)</span>
                      <span>Nhấn vào răng để lọc</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-16 gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                      {FDI_UPPER.map(renderToothCell)}
                    </div>
                    <div className="h-px bg-slate-200 mx-6" />
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                      {FDI_LOWER.map(renderToothCell)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------- RIGHT: RESULTS ---------------- */}
              <div className="xl:col-span-5 flex flex-col min-h-0 bg-white">
                {/* KPI */}
                <div className="shrink-0 grid grid-cols-4 gap-2 p-3 border-b border-slate-200 bg-slate-50/70">
                  {[
                    { label: 'Phát hiện', value: findings.length, sub: `${pathologyCount} bệnh lý`, cls: 'text-purple-800' },
                    { label: 'Răng liên quan', value: affectedTeeth, sub: `${analysis?.teeth?.length || 0} răng đã quét`, cls: 'text-slate-900' },
                    {
                      label: 'Độ tin cậy',
                      value: analysis ? `${Math.round(analysis.overallConfidence || 0)}%` : '—',
                      sub: analysis?.imageQuality?.rating ? `Phim: ${QUALITY_LABEL[analysis.imageQuality.rating] || analysis.imageQuality.rating}` : 'Chất lượng phim',
                      cls: 'text-emerald-700',
                    },
                    { label: 'Đã đối soát', value: `${decisionCounts.ACCEPTED + decisionCounts.REJECTED}/${findings.length}`, sub: `${decisionCounts.PENDING} chờ xác nhận`, cls: 'text-teal-800' },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{k.label}</p>
                      <p className={`text-lg font-black font-mono leading-tight ${k.cls}`}>{k.value}</p>
                      <p className="text-[9.5px] text-slate-400 font-semibold truncate">{k.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="shrink-0 flex items-center gap-1 px-3 pt-2 border-b border-slate-200">
                  {[
                    { id: 'findings', label: `Phát hiện AI (${findings.length})`, icon: Sparkles },
                    { id: 'reconcile', label: `Đối soát lâm sàng (${reconciliation.length})`, icon: GitCompareArrows },
                    { id: 'conclusion', label: 'Kết luận', icon: FileCheck2 },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = rightTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRightTab(t.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${active ? 'border-purple-600 text-purple-800' : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        <Icon size={13} /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {!analysis ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 px-8">
                      {isAiAnalyzing ? (
                        <>
                          <Loader2 size={30} className="animate-spin text-purple-500" />
                          <p className="font-bold text-slate-700 text-sm">AI đang đọc phim...</p>
                          <p className="text-xs">Quét từng cung hàm, định vị số răng FDI và đánh giá tổn thương. Quá trình có thể mất 15–60 giây.</p>
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={34} className="text-slate-300" />
                          <p className="font-bold text-slate-600 text-sm">
                            {pendingPreview ? 'Phim đã sẵn sàng — nhấn "Bắt đầu phân tích AI"' : 'Chưa có kết quả phân tích AI'}
                          </p>
                          <p className="text-xs">Tải phim X-quang để AI quét toàn bộ cung răng, sau đó bác sĩ đối soát với kết quả khám lâm sàng ở Bước 1.</p>
                        </>
                      )}
                    </div>
                  ) : notDental ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 space-y-1.5">
                      <p className="font-extrabold flex items-center gap-2"><AlertTriangle size={16} /> Ảnh không phải phim X-quang nha khoa</p>
                      <p className="text-xs leading-relaxed">{analysis.summary || 'Vui lòng tải lên phim Panorama, cận chóp hoặc cánh cắn hợp lệ.'}</p>
                    </div>
                  ) : rightTab === 'findings' ? (
                    <>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[11px] text-slate-500">
                          {focusTooth ? (
                            <>Đang xem phát hiện của <b className="text-teal-800">Răng {focusTooth}</b></>
                          ) : (
                            <>Xác nhận từng phát hiện: <b>Đồng ý</b> nếu đúng, <b>Bác bỏ</b> nếu AI đọc sai.</>
                          )}
                        </p>
                        {!readOnly && findings.length > 0 && (
                          <button
                            type="button"
                            onClick={acceptAllHighConfidence}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Đồng ý nhanh các phát hiện ≥ 85%
                          </button>
                        )}
                      </div>
                      {visibleFindings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                          {focusTooth ? (
                            <>
                              AI không ghi nhận tổn thương trên răng {focusTooth}.
                              <br />
                              Trạng thái: <b>{teethStatusMap[focusTooth] ? getToothStatusMeta(teethStatusMap[focusTooth].status).label : 'Không có trên phim'}</b>
                              {teethStatusMap[focusTooth]?.note ? ` — ${teethStatusMap[focusTooth].note}` : ''}
                            </>
                          ) : (
                            'AI không phát hiện tổn thương rõ ràng trên phim này.'
                          )}
                        </div>
                      ) : (
                        visibleFindings.map(renderFindingCard)
                      )}
                    </>
                  ) : rightTab === 'reconcile' ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(RECONCILE_META).map(([key, m]) => (
                          <div key={key} className={`rounded-lg border px-3 py-2 ${m.badge}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold">{m.label}</span>
                              <span className="font-mono font-black text-base">{reconcileCounts[key]}</span>
                            </div>
                            <p className="text-[10px] opacity-80 leading-snug mt-0.5">{m.advice}</p>
                          </div>
                        ))}
                      </div>
                      {reconciliation.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                          Không có răng bất thường ở cả lâm sàng và X-quang.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 text-[10.5px] uppercase tracking-wide text-slate-600">
                              <tr>
                                <th className="py-2 px-2.5 w-14">Răng</th>
                                <th className="py-2 px-2.5">Lâm sàng (Bước 1)</th>
                                <th className="py-2 px-2.5">X-quang (AI)</th>
                                <th className="py-2 px-2.5 w-32">Đối soát</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reconciliation.map((r) => {
                                const m = RECONCILE_META[r.status];
                                return (
                                  <tr
                                    key={r.toothNumber}
                                    className="hover:bg-slate-50 cursor-pointer align-top"
                                    onClick={() => {
                                      setFocusTooth(r.toothNumber);
                                      setRightTab('findings');
                                    }}
                                  >
                                    <td className="py-2 px-2.5">
                                      <span className="inline-block font-mono font-black text-teal-900 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                                        R{r.toothNumber}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2.5 text-slate-700">
                                      {r.clinicalExamined ? describeClinical(r.clinical) : <span className="text-slate-400">Chưa khám răng này</span>}
                                    </td>
                                    <td className="py-2 px-2.5">
                                      {r.aiFindings.length === 0 ? (
                                        <span className="text-slate-400">
                                          Không ghi nhận
                                          {r.aiToothStatus ? ` (${getToothStatusMeta(r.aiToothStatus).label})` : ''}
                                        </span>
                                      ) : (
                                        <ul className="space-y-0.5">
                                          {r.aiFindings.map((f) => (
                                            <li key={f.id} className={`font-semibold text-slate-800 ${decisionOf(f.id) === 'REJECTED' ? 'line-through text-slate-400' : ''}`}>
                                              {f.label}
                                              {f.confidence ? <span className="text-slate-400 font-mono"> · {Math.round(f.confidence)}%</span> : null}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </td>
                                    <td className="py-2 px-2.5">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${m.badge}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.short}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {examinedTeeth.length === 0 && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
                          <Info size={14} className="shrink-0 mt-0.5" />
                          Bước 1 chưa ghi nhận răng nào — kết quả đối soát chỉ dựa trên X-quang. Nên khám lâm sàng các răng AI phát hiện.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <section className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-2">
                        <p className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                          <BrainCircuit size={13} /> Kết luận hình ảnh học (AI)
                        </p>
                        <p className="text-[13px] font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                          {analysis.conclusion || '—'}
                        </p>
                        {analysis.summary && <p className="text-xs text-slate-600 leading-relaxed">{analysis.summary}</p>}
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <section className="rounded-xl border border-slate-200 p-3 space-y-1">
                          <p className="text-[10.5px] font-extrabold text-slate-500 uppercase">Xương ổ răng & nha chu</p>
                          <p className="text-xs text-slate-800 leading-relaxed">{analysis.boneAndPeriodontal || '—'}</p>
                        </section>
                        <section className="rounded-xl border border-slate-200 p-3 space-y-1">
                          <p className="text-[10.5px] font-extrabold text-slate-500 uppercase">Cấu trúc giải phẫu khác</p>
                          <p className="text-xs text-slate-800 leading-relaxed">{analysis.otherStructures || '—'}</p>
                        </section>
                        <section className="rounded-xl border border-slate-200 p-3 space-y-1">
                          <p className="text-[10.5px] font-extrabold text-slate-500 uppercase">Chất lượng phim</p>
                          <p className="text-xs text-slate-800">
                            <b>{QUALITY_LABEL[analysis.imageQuality?.rating] || analysis.imageQuality?.rating || '—'}</b>
                            {analysis.imageQuality?.notes ? ` — ${analysis.imageQuality.notes}` : ''}
                          </p>
                        </section>
                        <section className="rounded-xl border border-slate-200 p-3 space-y-1">
                          <p className="text-[10.5px] font-extrabold text-slate-500 uppercase">Bộ răng</p>
                          <p className="text-xs text-slate-800">
                            {{ PERMANENT: 'Răng vĩnh viễn', MIXED: 'Răng hỗn hợp', PRIMARY: 'Răng sữa' }[analysis.dentition] || analysis.dentition || '—'}
                            {analysis.estimatedAgeRange ? ` · Ước tính ${analysis.estimatedAgeRange}` : ''}
                          </p>
                        </section>
                      </div>

                      {analysis.recommendations?.length > 0 && (
                        <section className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-1.5">
                          <p className="text-[10.5px] font-extrabold text-teal-800 uppercase">Khuyến nghị của AI</p>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-800">
                            {analysis.recommendations.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ol>
                        </section>
                      )}

                      <section className="rounded-xl border border-slate-300 p-3 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-[11px] font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-teal-700" /> Nhận định của bác sĩ sau đối soát
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">{decisionCounts.ACCEPTED} đồng ý</span>
                            <span className="px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">{decisionCounts.REJECTED} bác bỏ</span>
                            <span className="px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">{decisionCounts.PENDING} chờ</span>
                          </div>
                        </div>
                        <textarea
                          value={doctorNote}
                          onChange={(e) => setDoctorNote(e.target.value)}
                          disabled={readOnly}
                          rows={4}
                          placeholder="VD: Đồng ý sâu ngà R46 mặt xa, R36 cần thử tủy lạnh; R38 mọc lệch gần — hẹn tư vấn tiểu phẫu. Bác bỏ thấu quang R11 (do chồng hình)."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50"
                        />
                        {analysis.doctorReview?.reviewedAt && (
                          <p className="text-[10.5px] text-slate-500">
                            Đã lưu đối soát lúc {formatDateTime(analysis.doctorReview.reviewedAt)}
                            {analysis.doctorReview.reviewedBy ? ` bởi ${analysis.doctorReview.reviewedBy}` : ''}
                          </p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ============================ FOOTER ============================ */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-white">
              <p className="text-[10.5px] text-slate-500 flex items-start gap-1.5 max-w-3xl">
                <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                {analysis?.disclaimer ||
                  'Kết quả do AI hỗ trợ đọc phim, chỉ mang tính tham khảo. Bác sĩ điều trị chịu trách nhiệm đối soát với khám lâm sàng và đưa ra chẩn đoán cuối cùng.'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsXrayModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                {analysis && !readOnly && !notDental && (
                  <button
                    type="button"
                    onClick={() => handleSaveReview(false)}
                    disabled={isSavingReview}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingReview ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Lưu kết quả đối soát
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGoToDiagnosis}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 cursor-pointer shadow"
                >
                  Tiếp tục: Chẩn đoán của bác sĩ <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

