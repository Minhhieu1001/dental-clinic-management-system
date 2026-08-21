import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ChevronLeft,
  User,
  Phone,
  Calendar,
  HeartPulse,
  AlertTriangle,
  Plus,
  Save,
  CheckCircle2,
  Activity,
  FileText,
  Clock,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Maximize2,
  CheckSquare,
  Sparkles,
  Upload,
  Paintbrush,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 32 Adult Teeth Layout
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Legend Condition Definitions
const TOOTH_CONDITIONS = [
  { key: 'CARIES', label: 'Sâu răng', fill: '#2563EB', stroke: '#1D4ED8', text: '#FFFFFF', badgeClass: 'bg-blue-600 text-white' },
  { key: 'FILLING', label: 'Trám', fill: '#38BDF8', stroke: '#0284C7', text: '#FFFFFF', badgeClass: 'bg-sky-400 text-white' },
  { key: 'MISSING', label: 'Mất răng', fill: '#CBD5E1', stroke: '#64748B', text: '#475569', badgeClass: 'bg-slate-300 text-slate-700' },
  { key: 'GINGIVITIS', label: 'Viêm lợi', fill: '#F43F5E', stroke: '#E11D48', text: '#FFFFFF', badgeClass: 'bg-rose-500 text-white' },
  { key: 'WARNING', label: 'Răng cần chú ý', fill: '#F59E0B', stroke: '#D97706', text: '#FFFFFF', badgeClass: 'bg-amber-500 text-white' },
  { key: 'NORMAL', label: 'Bình thường', fill: '#F8FAFC', stroke: '#94A3B8', text: '#475569', badgeClass: 'bg-slate-100 text-slate-600' },
];

// Custom Anatomical SVG Tooth Component
function AnatomicalToothSVG({ number, isUpper, conditionKey, isSelected, onClick }) {
  const cond = TOOTH_CONDITIONS.find((c) => c.key === conditionKey) || TOOTH_CONDITIONS[5]; // Normal

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-0.5 rounded transition-all cursor-pointer select-none ${isSelected
        ? 'ring-2 ring-teal-600 bg-teal-50 shadow-sm scale-110 z-10'
        : 'hover:bg-slate-100 hover:scale-105'
        }`}
      title={`Răng ${number} - ${cond.label}`}
    >
      {/* Real Anatomical Tooth Crown & Root SVG */}
      <svg
        viewBox="0 0 24 34"
        className={`w-5 sm:w-6 h-8 sm:h-9 transition-transform duration-200 ${isUpper ? 'rotate-180' : ''}`}
      >
        {/* Main Tooth Body Path (Crown & Roots) */}
        <path
          d="M 6,2 C 4,2 2,5 2,10 C 2,16 5,20 7,24 C 8.5,27 10,30 12,30 C 14,30 15.5,27 17,24 C 19,20 22,16 22,10 C 22,5 20,2 18,2 C 15,2 14,5 12,5 C 10,5 9,2 6,2 Z"
          fill={cond.fill}
          stroke={isSelected ? '#0D9488' : cond.stroke}
          strokeWidth={isSelected ? '2' : '1.5'}
        />

        {/* Missing Tooth Cross Mark Overlay */}
        {conditionKey === 'MISSING' && (
          <path d="M 4,4 L 20,28 M 20,4 L 4,28" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Tooth Fissure / Occlusal Grooves */}
        {conditionKey !== 'MISSING' && (
          <path
            d="M 8,6 C 10,9 12,12 12,14 M 16,6 C 14,9 12,12 12,14"
            fill="none"
            stroke={conditionKey === 'NORMAL' ? '#94A3B8' : '#FFFFFF'}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        )}
      </svg>

      {/* Tooth Number Label */}
      <span
        className={`text-[10px] font-extrabold mt-0.5 ${isSelected
          ? 'bg-teal-700 text-white px-1 rounded'
          : conditionKey !== 'NORMAL'
            ? 'text-slate-900 font-bold'
            : 'text-slate-500'
          }`}
      >
        {number}
      </span>
    </button>
  );
}

export default function ClinicalExamination() {
  const location = useLocation();
  const navigate = useNavigate();

  // Patient Passed from state or fallback default
  const patient = location.state?.patient || {
    patientCode: 'PA-881460',
    fullName: 'Trần Thị Mai',
    gender: 'FEMALE',
    dateOfBirth: '1990-05-12',
    phone: '0901 234 567',
    allergies: 'Dị ứng nhẹ Lidocaine',
    systemicDisease: 'Huyết áp cao',
  };

  // Active Marking Tool Selected from Legend (Default CARIES = Sâu răng)
  const [activeMarkingTool, setActiveMarkingTool] = useState('CARIES');

  // Interactive Teeth Conditions Map (Key = Tooth Number, Value = Condition Key)
  const [teethMap, setTeethMap] = useState({
    46: 'CARIES',
    26: 'WARNING',
    18: 'FILLING',
    38: 'GINGIVITIS',
  });

  // Selected Active Tooth for Clinical Examination
  const [selectedTooth, setSelectedTooth] = useState(46);
  const [toothFilter, setToothFilter] = useState('PERMANENT'); // Permanent teeth

  // Clinical Exam Form State for Tooth 46
  const [cariesStatus, setCariesStatus] = useState('YES'); // NO, SUSPICIOUS, YES
  const [cariesLocation, setCariesLocation] = useState('Mặt nhai + Mặt gần');
  const [cariesDepth, setCariesDepth] = useState('Sâu ngà');
  const [painLevel, setPainLevel] = useState('STIMULATED'); // NONE, STIMULATED, SPONTANEOUS
  const [percussionVert, setPercussionVert] = useState('Negative');
  const [percussionHoriz, setPercussionHoriz] = useState('Negative');
  const [mobility, setMobility] = useState('Không lung lay');
  const [gingivaStatus, setGingivaStatus] = useState('Viêm nhẹ');
  const [pocketDepth, setPocketDepth] = useState('2');
  const [pusStatus, setPusStatus] = useState('NO'); // NO, YES
  const [examNotes, setExamNotes] = useState('');

  // X-Ray & AI Analysis State
  const [xrayTab, setXrayTab] = useState('XRAY'); // XRAY | INTRORAL
  const [aiOverlayEnabled, setAiOverlayEnabled] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Doctor Diagnosis Form State
  const [mainDiagnosis, setMainDiagnosis] = useState('K02.1'); // Sâu ngà (K02.1)
  const [subDiagnosis, setSubDiagnosis] = useState('');
  const [severity, setSeverity] = useState('Trung bình');
  const [diagnosisNotes, setDiagnosisNotes] = useState(
    'Sâu ngà mặt nhai và mặt gần, chưa ảnh hưởng tủy. Bệnh nhân đau khi ăn nhai.'
  );

  // Info Sources Checkboxes
  const [sources, setSources] = useState({
    clinicalExam: true,
    xray: true,
    photos: true,
    aiSuggestion: true,
  });

  const [treatingDoctor, setTreatingDoctor] = useState('Dr. Nguyễn Văn Tâm');

  // Tooth Click Handler: Assign condition color & open clinical exam form for tooth
  const handleToothClick = (toothNo) => {
    setSelectedTooth(toothNo);

    // Apply active marking tool condition to tooth
    if (activeMarkingTool) {
      setTeethMap((prev) => ({
        ...prev,
        [toothNo]: activeMarkingTool,
      }));

      const toolObj = TOOTH_CONDITIONS.find((c) => c.key === activeMarkingTool);
      toast.success(`Đã đánh dấu Răng ${toothNo}: ${toolObj?.label || activeMarkingTool}`, {
        duration: 1800,
      });
    }
  };

  // Reset Tooth Map
  const handleResetTeethMap = () => {
    setTeethMap({ 46: 'CARIES' });
    setSelectedTooth(46);
    toast.info('Đã xóa bộ nhớ đánh dấu sơ đồ răng!');
  };

  // Submit Handler
  const handleConfirmDiagnosis = () => {
    toast.success(`Đã xác nhận chẩn đoán y khoa cho Răng ${selectedTooth}!`, {
      icon: '🩺',
      duration: 3000,
    });
  };

  return (
    <div className="mx-auto max-w-[1550px] px-2 sm:px-4 space-y-4 py-2 text-slate-800">
      {/* 1. Header Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Quay lại Hồ sơ Bệnh nhân"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="text-teal-700" size={22} />
              Module Khám Lâm Sàng & Chẩn Đoán AI Nha Khoa
            </h1>
            <p className="text-xs text-slate-500">
              Sơ đồ 32 răng giải phẫu, phân tích tổn thương X-quang bằng AI và Chẩn đoán chuyên khoa ICD-10.
            </p>
          </div>
        </div>

        {/* Action Buttons: Save & Create Treatment Plan */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmDiagnosis}
            className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Save size={14} />
            <span>Lưu chẩn đoán</span>
          </button>

          <button
            type="button"
            onClick={() => {
              toast.success('Đã xác nhận chẩn đoán! Đang chuyển sang Lên Kế Hoạch Điều Trị...', {
                icon: '🩺',
                duration: 2500,
              });
              navigate('/dentist/treatment-plans', {
                state: {
                  patient,
                  diagnosis: mainDiagnosis,
                  selectedTooth,
                  diagnosisNotes,
                },
              });
            }}
            className="flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <FileText size={15} />
            <span>Tạo Kế Hoạch Điều Trị &rarr;</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TOP PATIENT HEADER BANNER (12 COLS FULL WIDTH) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Patient Profile Card (4 cols) */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
            alt={patient.fullName}
            className="h-16 w-16 rounded-full object-cover border-2 border-teal-100 shadow-xs shrink-0"
          />
          <div className="space-y-1 text-xs">
            <h2 className="text-base font-bold text-slate-900 leading-tight">{patient.fullName}</h2>
            <p className="text-slate-500 font-medium">♀ Nữ · 35 tuổi (12/05/1990)</p>
            <p className="text-slate-600 flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              <span>{patient.phone}</span>
            </p>
            <button
              type="button"
              onClick={() => navigate('/dentist/medical-records', { state: { patient } })}
              className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-0.5 cursor-pointer"
            >
              <FileText size={12} />
              <span>Xem hồ sơ chi tiết</span>
            </button>
          </div>
        </div>

        {/* Reason & Main Symptoms (8 cols - Full Width 12 cols total) */}
        <div className="lg:col-span-8 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs text-xs space-y-2.5">
          <div>
            <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wide">Lý do khám</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">Đau nhức răng hàm dưới bên phải</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wide">Triệu chứng chính</span>
            <p className="text-slate-700 font-medium mt-0.5">Đau nhức khi ăn nhai, ê buốt khi uống nước lạnh</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: SƠ ĐỒ RĂNG INTERACTIVE & KHÁM LÂM SÀNG (MATCHING IMAGE 1) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (6 cols): Sơ đồ 32 Răng Giải Phẫu */}
        <div className="lg:col-span-6 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-teal-700" />
              Sơ đồ răng (Odontogram)
            </h3>

            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Paintbrush size={13} className="text-teal-700" />
              <span>Công cụ tô màu:</span>
              <span className="font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {TOOTH_CONDITIONS.find((c) => c.key === activeMarkingTool)?.label}
              </span>
            </div>
          </div>

          {/* Interactive Legend Palette Selector (Bấm chọn bút tô màu bệnh lý) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-slate-400 text-[10px] font-bold uppercase w-full sm:w-auto mb-1 sm:mb-0">
              Chọn màu tô bệnh lý:
            </span>
            {TOOTH_CONDITIONS.map((cond) => {
              const isActive = activeMarkingTool === cond.key;

              return (
                <button
                  type="button"
                  key={cond.key}
                  onClick={() => setActiveMarkingTool(cond.key)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all cursor-pointer ${isActive
                    ? 'bg-slate-900 text-white font-extrabold shadow ring-2 ring-slate-400 scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full border border-black/20" style={{ backgroundColor: cond.fill }} />
                  <span>{cond.label}</span>
                </button>
              );
            })}
          </div>

          {/* Anatomical Teeth Graphic Grid (32 Răng) */}
          <div className="space-y-3 py-2 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
            {/* HÀM TRÊN (UPPER JAW - 16 TEETH) */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-1">
                --- HÀM TRÊN (UPPER TEETH) ---
              </p>
              <div className="grid grid-cols-16 gap-1">
                {UPPER_TEETH.map((t) => (
                  <AnatomicalToothSVG
                    key={t}
                    number={t}
                    isUpper={true}
                    conditionKey={teethMap[t] || 'NORMAL'}
                    isSelected={selectedTooth === t}
                    onClick={() => handleToothClick(t)}
                  />
                ))}
              </div>
            </div>

            {/* HÀM DƯỚI (LOWER JAW - 16 TEETH) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="grid grid-cols-16 gap-1">
                {LOWER_TEETH.map((t) => (
                  <AnatomicalToothSVG
                    key={t}
                    number={t}
                    isUpper={false}
                    conditionKey={teethMap[t] || 'NORMAL'}
                    isSelected={selectedTooth === t}
                    onClick={() => handleToothClick(t)}
                  />
                ))}
              </div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mt-1">
                --- HÀM DƯỚI (LOWER TEETH) ---
              </p>
            </div>
          </div>

          {/* Quick Select Controls & Condition Palette */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Chọn loại răng</span>
              <select
                value={toothFilter}
                onChange={(e) => setToothFilter(e.target.value)}
                className="rounded border border-slate-300 px-3 py-1 bg-white font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="PERMANENT">Răng vĩnh viễn</option>
                <option value="DECIDUOUS">Răng sữa</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleResetTeethMap}
              className="flex items-center gap-1 rounded border border-slate-200 px-3 py-1 bg-white font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Xóa lựa chọn</span>
            </button>
          </div>
        </div>

        {/* Right Column (6 cols): Khám lâm sàng - Răng 46 */}
        <div className="lg:col-span-6 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Khám lâm sàng — Răng {selectedTooth}
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
                Răng hàm dưới bên phải
              </span>

              {/* Quick condition badge for selected tooth */}
              <span className="rounded bg-teal-700 px-2 py-0.5 text-xs text-white font-bold">
                {TOOTH_CONDITIONS.find((c) => c.key === (teethMap[selectedTooth] || 'NORMAL'))?.label}
              </span>
            </div>
          </div>

          {/* Quick Change Condition Buttons for Currently Selected Tooth */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium text-[11px]">Đổi tình trạng R{selectedTooth}:</span>
            <div className="flex flex-wrap gap-1">
              {TOOTH_CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => {
                    setTeethMap({ ...teethMap, [selectedTooth]: c.key });
                    toast.success(`Răng ${selectedTooth} $\rightarrow$ ${c.label}`);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${teethMap[selectedTooth] === c.key
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Sâu răng Toggle */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sâu răng</label>
              <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setCariesStatus('NO')}
                  className={`flex-1 py-1 rounded text-[11px] font-bold cursor-pointer ${cariesStatus === 'NO' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                    }`}
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() => setCariesStatus('SUSPICIOUS')}
                  className={`flex-1 py-1 rounded text-[11px] font-bold cursor-pointer ${cariesStatus === 'SUSPICIOUS' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                    }`}
                >
                  Nghi ngờ
                </button>
                <button
                  type="button"
                  onClick={() => setCariesStatus('YES')}
                  className={`flex-1 py-1 rounded text-[11px] font-bold cursor-pointer ${cariesStatus === 'YES' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500'
                    }`}
                >
                  ✓ Có
                </button>
              </div>
            </div>

            {/* Lung lay Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lung lay</label>
              <select
                value={mobility}
                onChange={(e) => setMobility(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Không lung lay">Không lung lay</option>
                <option value="Độ 1">Độ 1</option>
                <option value="Độ 2">Độ 2</option>
                <option value="Độ 3">Độ 3</option>
              </select>
            </div>

            {/* Vị trí sâu */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vị trí sâu</label>
              <select
                value={cariesLocation}
                onChange={(e) => setCariesLocation(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Mặt nhai + Mặt gần">Mặt nhai + Mặt gần</option>
                <option value="Mặt nhai">Mặt nhai</option>
                <option value="Mặt xa">Mặt xa</option>
                <option value="Mặt ngoài">Mặt ngoài</option>
              </select>
            </div>

            {/* Nướu quanh răng */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nướu quanh răng</label>
              <select
                value={gingivaStatus}
                onChange={(e) => setGingivaStatus(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Viêm nhẹ">Viêm nhẹ</option>
                <option value="Bình thường">Bình thường</option>
                <option value="Viêm nặng">Viêm nặng</option>
              </select>
            </div>

            {/* Mức độ sâu */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ sâu</label>
              <select
                value={cariesDepth}
                onChange={(e) => setCariesDepth(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Sâu ngà">Sâu ngà</option>
                <option value="Sâu men">Sâu men</option>
                <option value="Sâu sát tủy">Sâu sát tủy</option>
              </select>
            </div>

            {/* Túi nha chu */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Túi nha chu (mm)</label>
              <input
                type="text"
                value={pocketDepth}
                onChange={(e) => setPocketDepth(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none"
              />
            </div>

            {/* Đau Toggle */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Đau</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPainLevel('NONE')}
                  className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${painLevel === 'NONE' ? 'bg-teal-700 text-white border-teal-800' : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() => setPainLevel('STIMULATED')}
                  className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${painLevel === 'STIMULATED' ? 'bg-teal-700 text-white border-teal-800' : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                >
                  Có khi kích thích
                </button>
                <button
                  type="button"
                  onClick={() => setPainLevel('SPONTANEOUS')}
                  className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${painLevel === 'SPONTANEOUS' ? 'bg-teal-700 text-white border-teal-800' : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                >
                  Đau tự phát
                </button>
              </div>
            </div>

            {/* Mủ Toggle */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Mủ</label>
              <div className="flex gap-2 items-center pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pus"
                    checked={pusStatus === 'NO'}
                    onChange={() => setPusStatus('NO')}
                    className="text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span className="font-bold text-slate-700">✓ Không</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                  <input
                    type="radio"
                    name="pus"
                    checked={pusStatus === 'YES'}
                    onChange={() => setPusStatus('YES')}
                    className="text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span className="font-medium text-slate-600">Có</span>
                </label>
              </div>
            </div>

            {/* Gõ dọc & Gõ ngang */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gõ dọc</label>
              <select
                value={percussionVert}
                onChange={(e) => setPercussionVert(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Negative">Âm tính</option>
                <option value="Positive">Dương tính</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gõ ngang</label>
              <select
                value={percussionHoriz}
                onChange={(e) => setPercussionHoriz(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Negative">Âm tính</option>
                <option value="Positive">Dương tính</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: X-QUANG, PHÂN TÍCH AI & CHẨN ĐOÁN BÁC SĨ (3 CỘT BẰNG NHAU 4-4-4) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Card 1 (4 cols): X-quang & Hình ảnh Viewer Canvas */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900">X-quang & hình ảnh</h3>

            {/* 2 nút chức năng: Tải ảnh lên & Phân tích AI */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toast.success('Chọn tệp ảnh X-quang từ máy tính để tải lên')}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Upload size={12} className="text-teal-700" />
                <span>Tải ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAiOverlayEnabled(true);
                  toast.success('AI đã quét và phát hiện tổn thương trên phim X-quang R46!');
                }}
                className="flex items-center gap-1 rounded bg-teal-700 px-2.5 py-1 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Phân tích AI</span>
              </button>
            </div>
          </div>

          {/* Main Canvas Viewer (w-full 100% width) */}
          <div className="w-full relative rounded-lg bg-slate-950 p-2.5 text-white overflow-hidden min-h-[260px] flex flex-col justify-between shadow-inner border border-slate-800">
            {/* Header inside Canvas */}
            <div className="flex items-center justify-between text-xs px-1 pt-0.5 z-10">
              <span className="font-extrabold text-sm text-white">Răng 46</span>

              <div className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 shadow-2xs">
                <span className="text-[11px] text-slate-300 font-bold">AI overlay</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiOverlayEnabled}
                    onChange={() => setAiOverlayEnabled(!aiOverlayEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600" />
                </label>
              </div>
            </div>

            {/* X-Ray Image Simulation with AI Purple Overlay */}
            <div className="relative flex items-center justify-center my-2">
              <div className="relative border border-slate-800 rounded bg-slate-900 p-1.5 shadow-md w-full">
                <img
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=400"
                  alt="X-ray Tooth 46"
                  className="h-44 w-full object-cover rounded opacity-90 grayscale"
                />
                {/* Purple AI Decay Detection Simulation Overlay */}
                {aiOverlayEnabled && (
                  <div
                    className="absolute top-8 right-16 w-16 h-12 bg-purple-600/60 backdrop-blur-[1px] border-2 border-purple-300 rounded-full shadow-lg animate-pulse"
                    title="AI Phát hiện: Vùng sâu ngà R46"
                  />
                )}
              </div>
            </div>

            {/* Instruction Legend */}
            <p className="text-[10px] text-slate-400 text-center pb-0.5">
              Kéo chuột để di chuyển • Scroll để zoom
            </p>
          </div>
        </div>

        {/* Card 2 (4 cols): Kết quả phân tích AI trên X-quang */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Sparkles size={16} className="text-purple-600" />
            Kết quả phân tích AI trên X-quang
          </h3>

          <div className="flex items-center gap-2 text-slate-600 font-semibold text-[11px]">
            <span>Chú thích:</span>
            <span className="flex items-center gap-1 text-purple-700"><span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Vùng nghi ngờ</span>
          </div>

          {/* AI Tooth Graphic Simulation */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Sơ đồ tổn thương AI phát hiện</p>
            <div className="inline-block p-2 bg-white rounded border border-purple-200 shadow-2xs">
              <span className="inline-block rounded bg-purple-600 px-3 py-1 text-white font-extrabold text-xs">
                R46
              </span>
            </div>
          </div>

          {/* AI Details List */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Chi tiết phát hiện:</p>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-semibold text-slate-900">Mặt nhai, mặt gần</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại tổn thương:</span>
                <span className="font-semibold text-slate-900">Sâu ngà</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mức độ:</span>
                <span className="font-semibold text-slate-900">Trung bình</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ảnh hưởng tủy:</span>
                <span className="font-semibold text-slate-900">Chưa thấy ảnh hưởng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Viêm quanh chóp:</span>
                <span className="font-semibold text-slate-900">Không phát hiện</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAiOverlayEnabled(!aiOverlayEnabled)}
            className="w-full mt-2 rounded border border-slate-300 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {aiOverlayEnabled ? 'Ẩn vùng AI' : 'Hiện vùng AI'}
          </button>
        </div>

        {/* Card 3 (4 cols): Chẩn đoán của bác sĩ (Doctor Confirmation) */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Chẩn đoán của bác sĩ</h3>

          <div className="space-y-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Răng</label>
              <select
                value={selectedTooth}
                onChange={(e) => setSelectedTooth(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value={46}>46</option>
                <option value={48}>48</option>
                <option value={18}>18</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chẩn đoán chính (ICD-10)</label>
              <select
                value={mainDiagnosis}
                onChange={(e) => setMainDiagnosis(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="K02.1">Sâu ngà (K02.1)</option>
                <option value="K02.0">Sâu men (K02.0)</option>
                <option value="K04.0">Viêm tủy cấp (K04.0)</option>
                <option value="K05.1">Viêm nướu mãn tính (K05.1)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="Trung bình">Trung bình</option>
                <option value="Nhẹ">Nhẹ</option>
                <option value="Nặng">Nặng</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ghi chú chẩn đoán</label>
              <textarea
                rows={3}
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-xs font-medium text-slate-800 outline-none focus:border-teal-600 transition-colors"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nguồn thông tin</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-semibold">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sources.clinicalExam}
                    onChange={(e) => setSources({ ...sources, clinicalExam: e.target.checked })}
                    className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span>☑ Khám lâm sàng</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sources.xray}
                    onChange={(e) => setSources({ ...sources, xray: e.target.checked })}
                    className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span>☑ X-quang</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sources.photos}
                    onChange={(e) => setSources({ ...sources, photos: e.target.checked })}
                    className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span>☑ Hình ảnh</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sources.aiSuggestion}
                    onChange={(e) => setSources({ ...sources, aiSuggestion: e.target.checked })}
                    className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <span>☑ AI gợi ý</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bác sĩ điều trị</label>
              <input
                type="text"
                value={treatingDoctor}
                onChange={(e) => setTreatingDoctor(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmDiagnosis}
              className="flex-1 rounded border border-teal-700 bg-white py-2 text-xs font-bold text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
            >
              Lưu chẩn đoán
            </button>

            <button
              type="button"
              onClick={() => {
                toast.success('Đã xác nhận chẩn đoán! Đang chuyển sang Lên Kế Hoạch Điều Trị...');
                navigate('/dentist/treatment-plans', {
                  state: {
                    patient,
                    diagnosis: mainDiagnosis,
                    selectedTooth,
                    diagnosisNotes,
                  },
                });
              }}
              className="flex-1 rounded bg-teal-700 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
            >
              Tạo Kế Hoạch &rarr;
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Chẩn đoán sẽ được lưu vào hồ sơ bệnh án
          </p>
        </div>
      </div>
    </div>
  );
}
