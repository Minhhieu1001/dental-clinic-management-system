import {
  Activity,
  Paintbrush,
  RotateCcw,
  Save,
  CheckCircle2,
  Pencil,
  Trash2,
  Sparkles,
  ArrowRight,
  Lock,
  MousePointer,
} from 'lucide-react';
import { useClinicalExam } from '../ClinicalExamContext';
import {
  UPPER_TEETH,
  LOWER_TEETH,
  TOOTH_CONDITIONS,
  TOOTH_TYPE_OPTIONS,
  CARIES_STATUS_OPTIONS,
  MOBILITY_OPTIONS,
  CARIES_LOCATION_OPTIONS,
  GINGIVA_STATUS_OPTIONS,
  CARIES_DEPTH_OPTIONS,
  PAIN_LEVEL_OPTIONS,
  getToothQuadrantLabel,
  getCariesDepthLabel,
} from '../clinicalExaminationHelpers';

// Custom Anatomical SVG Tooth Component
function AnatomicalToothSVG({ number, isUpper, conditionKey, isSelected, onClick, isHistoricalSession }) {
  const cond = TOOTH_CONDITIONS.find((c) => c.key === conditionKey) || TOOTH_CONDITIONS[5]; // Normal

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-0.5 rounded transition-all select-none cursor-pointer ${isSelected
        ? 'ring-2 ring-teal-600 bg-teal-50 shadow-sm scale-110 z-10'
        : 'hover:bg-slate-100 hover:scale-105'
        }`}
      title={`Răng ${number} - ${cond.label}${isHistoricalSession ? ' (Chế độ chỉ xem)' : ''}`}
    >
      {/* Anatomical Tooth Crown & Root SVG */}
      <svg
        viewBox="0 0 24 34"
        className={`w-6 sm:w-8 h-9 sm:h-11 transition-transform duration-200 ${isUpper ? 'rotate-180' : ''}`}
      >
        <path
          d="M 6,2 C 4,2 2,5 2,10 C 2,16 5,20 7,24 C 8.5,27 10,30 12,30 C 14,30 15.5,27 17,24 C 19,20 22,16 22,10 C 22,5 20,2 18,2 C 15,2 14,5 12,5 C 10,5 9,2 6,2 Z"
          fill={cond.fill}
          stroke={isSelected ? '#0D9488' : cond.stroke}
          strokeWidth={isSelected ? '2' : '1.5'}
        />

        {conditionKey === 'MISSING' && (
          <path d="M 4,4 L 20,28 M 20,4 L 4,28" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        )}

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

export default function ClinicalExamTab() {
  const {
    activeMarkingTool,
    setActiveMarkingTool,
    teethMap,
    setTeethMap,
    selectedTooth,
    isMultiToothMode,
    multiSelectedTeeth,
    setMultiSelectedTeeth,
    handleToggleMultiToothMode,
    handleChangeToothCondition,
    toothFilter,
    setToothFilter,
    cariesStatus,
    setCariesStatus,
    cariesLocation,
    setCariesLocation,
    cariesDepth,
    setCariesDepth,
    painLevel,
    setPainLevel,
    mobility,
    setMobility,
    gingivaStatus,
    setGingivaStatus,
    examinedTeeth,
    examinationResultId,
    isSavingTooth,
    isLoadingTeeth,
    treatmentSessions,
    selectedSessionId,
    isHistoricalSession,
    handleToothClick,
    handleSaveToothRecord,
    handleEditToothRecord,
    handleDeleteToothRecord,
    handleResetTeethMap,
    setActiveTab,
  } = useClinicalExam();

  const currentSession = treatmentSessions.find(
    (s) => String(s.id) === String(selectedSessionId) || String(s.examinationResultId) === String(selectedSessionId)
  );

  const clinicalExamDropdowns = [
    {
      label: 'Lung lay',
      value: mobility,
      onChange: (e) => setMobility(e.target.value),
      options: MOBILITY_OPTIONS,
    },
    {
      label: 'Vị trí sâu',
      value: cariesLocation,
      onChange: (e) => setCariesLocation(e.target.value),
      options: CARIES_LOCATION_OPTIONS,
    },
    {
      label: 'Nướu quanh răng',
      value: gingivaStatus,
      onChange: (e) => setGingivaStatus(e.target.value),
      options: GINGIVA_STATUS_OPTIONS,
    },
    {
      label: 'Mức độ sâu',
      value: cariesDepth,
      onChange: (e) => setCariesDepth(e.target.value),
      options: CARIES_DEPTH_OPTIONS,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sơ đồ răng & Khám lâm sàng Răng đang chọn */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
        {/* Left Column (6/10 = 60%): Sơ đồ 32 Răng Giải Phẫu */}
        <div className="lg:col-span-6 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          {/* Header Sơ đồ răng + Nút công tắc Chế độ chọn răng (1 răng / Nhiều răng) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Activity size={16} className="text-teal-700" />
                Sơ đồ răng (Odontogram)
              </h3>

              {/* Nút công tắc: Chọn 1 răng (Mặc định) vs Chọn nhiều răng */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  disabled={isHistoricalSession}
                  onClick={() => handleToggleMultiToothMode(false)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    !isMultiToothMode
                      ? 'bg-white text-teal-900 shadow-2xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  } ${isHistoricalSession ? 'cursor-not-allowed opacity-40' : ''}`}
                  title="Chế độ chọn 1 răng (mặc định): Chọn trạng thái rồi chọn răng"
                >
                  Chọn 1 răng
                </button>
                <button
                  type="button"
                  disabled={isHistoricalSession}
                  onClick={() => handleToggleMultiToothMode(true)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isMultiToothMode
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  } ${isHistoricalSession ? 'cursor-not-allowed opacity-40' : ''}`}
                  title="Chế độ chọn nhiều răng: Chọn trạng thái rồi click các răng để gán và lưu cùng lúc"
                >
                  <span>Chọn nhiều răng</span>
                  {isMultiToothMode && multiSelectedTeeth.length > 0 && (
                    <span className="rounded-full bg-white/20 text-white px-1.5 py-0.2 text-[10px] font-black">
                      {multiSelectedTeeth.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold shrink-0">
              <Paintbrush size={13} className="text-teal-700" />
              <span>Chế độ:</span>
              <span
                className={`font-extrabold px-2 py-0.5 rounded border ${isHistoricalSession
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : !activeMarkingTool
                    ? 'text-teal-800 bg-teal-50 border-teal-200'
                    : 'text-slate-900 bg-slate-100 border-slate-300'
                  }`}
              >
                {isHistoricalSession
                  ? 'Chỉ xem (Lịch sử)'
                  : !activeMarkingTool
                    ? (isMultiToothMode ? 'Chọn nhiều răng' : 'Chọn & Xem răng')
                    : `${isMultiToothMode ? 'Tô nhiều răng' : 'Tô'}: ${TOOTH_CONDITIONS.find((c) => c.key === activeMarkingTool)?.label}`}
              </span>
            </div>
          </div>

          {/* Thanh thông báo răng đang chọn khi ở chế độ nhiều răng */}
          {isMultiToothMode && !isHistoricalSession && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-teal-50/80 border border-teal-200 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 flex-wrap text-teal-900">
                <span className="font-bold">Đang chọn {multiSelectedTeeth.length} răng:</span>
                <span className="font-extrabold text-teal-700">
                  {multiSelectedTeeth.length > 0 ? multiSelectedTeeth.map((t) => `R${t}`).join(', ') : 'Chưa chọn răng nào'}
                </span>
                <span className="text-[11px] text-teal-600/80 italic ml-1">
                  (Click trên sơ đồ để thêm hoặc bỏ chọn răng)
                </span>
              </div>
              {multiSelectedTeeth.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMultiSelectedTeeth([])}
                  className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer shrink-0 ml-2"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          )}

          {/* Banner thông báo chế độ xem lịch sử đợt khám */}
          {isHistoricalSession && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
              <Lock size={15} className="text-amber-600 shrink-0" />
              <span>
                Đang xem đợt khám: <strong>{currentSession?.label || 'Đợt cũ'}</strong> (ngày {currentSession?.date || 'lịch sử'}). Chế độ chỉ xem — sơ đồ răng và kết quả khám đã được khóa, không thể chỉnh sửa.
              </span>
            </div>
          )}

          {/* Palette Selector */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-slate-400 text-[10px] font-bold uppercase w-full sm:w-auto mb-1 sm:mb-0">
              Công cụ:
            </span>
            <button
              type="button"
              disabled={isHistoricalSession}
              onClick={() => setActiveMarkingTool(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${!activeMarkingTool && !isHistoricalSession
                ? 'bg-teal-700 text-white font-extrabold shadow ring-2 ring-teal-400 scale-105'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                } ${isHistoricalSession ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              title="Chế độ chọn và xem chi tiết răng mà không đổi tình trạng bệnh lý"
            >
              <MousePointer size={12} />
              <span>Chọn & Xem răng</span>
            </button>
            {TOOTH_CONDITIONS.map((cond) => {
              const isActive = activeMarkingTool === cond.key && !isHistoricalSession;

              return (
                <button
                  type="button"
                  key={cond.key}
                  disabled={isHistoricalSession}
                  onClick={() => {
                    if (!isHistoricalSession) {
                      const newTool = isActive ? null : cond.key;
                      setActiveMarkingTool(newTool);
                      if (newTool && isMultiToothMode && multiSelectedTeeth.length > 0) {
                        setTeethMap((prev) => {
                          const next = { ...prev };
                          multiSelectedTeeth.forEach((t) => {
                            next[t] = newTool;
                          });
                          return next;
                        });
                      }
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${isActive
                    ? 'bg-slate-900 text-white font-extrabold shadow ring-2 ring-slate-400 scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    } ${isHistoricalSession ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full border border-black/20" style={{ backgroundColor: cond.fill }} />
                  <span>{cond.label}</span>
                </button>
              );
            })}
          </div>

          {/* Teeth Graphic Grid */}
          <div className="space-y-3 py-2 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
            {/* HÀM TRÊN (16 TEETH) */}
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
                    isSelected={isMultiToothMode ? multiSelectedTeeth.includes(t) : selectedTooth === t}
                    onClick={() => handleToothClick(t)}
                    isHistoricalSession={isHistoricalSession}
                  />
                ))}
              </div>
            </div>

            {/* HÀM DƯỚI (16 TEETH) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="grid grid-cols-16 gap-1">
                {LOWER_TEETH.map((t) => (
                  <AnatomicalToothSVG
                    key={t}
                    number={t}
                    isUpper={false}
                    conditionKey={teethMap[t] || 'NORMAL'}
                    isSelected={isMultiToothMode ? multiSelectedTeeth.includes(t) : selectedTooth === t}
                    onClick={() => handleToothClick(t)}
                    isHistoricalSession={isHistoricalSession}
                  />
                ))}
              </div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mt-1">
                --- HÀM DƯỚI (LOWER TEETH) ---
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Chọn loại răng</span>
              <select
                value={toothFilter}
                onChange={(e) => setToothFilter(e.target.value)}
                className="rounded border border-slate-300 px-3 py-1 bg-white font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {TOOTH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isHistoricalSession}
              onClick={handleResetTeethMap}
              className={`flex items-center gap-1 rounded border border-slate-200 px-3 py-1 bg-white font-semibold transition-colors ${isHistoricalSession
                ? 'text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
                }`}
            >
              <RotateCcw size={12} />
              <span>Xóa lựa chọn</span>
            </button>
          </div>
        </div>

        {/* Right Column (4/10 = 40%): Khám lâm sàng Răng đang chọn */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              {isMultiToothMode
                ? `Khám lâm sàng — ${multiSelectedTeeth.length > 0 ? `${multiSelectedTeeth.length} răng đang chọn` : 'Chưa chọn răng nào'}`
                : `Khám lâm sàng — Răng ${selectedTooth}`}
            </h3>
            {isMultiToothMode && multiSelectedTeeth.length > 0 && (
              <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {multiSelectedTeeth.map((t) => `R${t}`).join(', ')}
              </span>
            )}
          </div>

          {/* Quick Change Condition Buttons */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium text-[11px]">
              {isMultiToothMode ? `Đổi tình trạng ${multiSelectedTeeth.length} răng:` : `Đổi tình trạng R${selectedTooth}:`}
            </span>
            <div className="flex flex-wrap gap-1">
              {TOOTH_CONDITIONS.map((c) => {
                const currentCond = isMultiToothMode
                  ? (activeMarkingTool || (multiSelectedTeeth.length > 0 ? teethMap[multiSelectedTeeth[0]] : 'NORMAL'))
                  : (teethMap[selectedTooth] || 'NORMAL');
                const isSelected = currentCond === c.key;
                return (
                  <button
                    type="button"
                    key={c.key}
                    disabled={isHistoricalSession}
                    onClick={() => handleChangeToothCondition(c.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${isSelected
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      } ${isHistoricalSession ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sâu răng</label>
              <div className="flex rounded border border-slate-200 p-0.5 bg-slate-50">
                {CARIES_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isHistoricalSession}
                    onClick={() => {
                      if (!isHistoricalSession) setCariesStatus(opt.value);
                    }}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${cariesStatus === opt.value
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                      } ${isHistoricalSession ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {clinicalExamDropdowns.map((field) => (
              <div key={field.label}>
                <label className="block font-semibold text-slate-700 mb-1">{field.label}</label>
                <select
                  disabled={isHistoricalSession}
                  value={field.value}
                  onChange={field.onChange}
                  className={`w-full rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-800 outline-none ${isHistoricalSession ? 'bg-slate-100 text-slate-500 opacity-60 cursor-not-allowed' : 'bg-white cursor-pointer'
                    }`}
                >
                  {field.options.map((opt) => {
                    const optVal = typeof opt === 'object' ? (opt.value ?? opt.key) : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <option key={optVal} value={optVal}>
                        {optLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Đau</label>
              <div className="flex gap-1">
                {PAIN_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isHistoricalSession}
                    onClick={() => {
                      if (!isHistoricalSession) setPainLevel(opt.value);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${painLevel === opt.value
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                      } ${isHistoricalSession ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {isMultiToothMode
                  ? `Cập nhật chi tiết ${multiSelectedTeeth.length} răng (${multiSelectedTeeth.map(t => 'R' + t).join(', ') || 'Chưa chọn'})`
                  : `Cập nhật chi tiết Răng ${selectedTooth}`}
              </span>
              <button
                type="button"
                onClick={handleSaveToothRecord}
                disabled={isSavingTooth || isHistoricalSession || (isMultiToothMode && multiSelectedTeeth.length === 0)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow transition-all ${isHistoricalSession || (isMultiToothMode && multiSelectedTeeth.length === 0)
                  ? 'bg-slate-400 cursor-not-allowed opacity-50'
                  : 'bg-teal-700 hover:bg-teal-800 active:scale-95 cursor-pointer'
                  }`}
                title={isHistoricalSession ? 'Chế độ xem lịch sử - Không thể chỉnh sửa' : 'Lưu thông tin răng'}
              >
                {isSavingTooth ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Đang lưu CSDL...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>
                      {isMultiToothMode && multiSelectedTeeth.length > 1
                        ? `Lưu thông tin ${multiSelectedTeeth.length} răng`
                        : 'Lưu thông tin răng'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách các răng đã khám (Lấy theo ExaminationResultId từ CSDL) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="text-teal-700" size={18} />
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách các răng đã khám
            </h3>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
              {examinedTeeth.length} răng
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Dữ liệu đồng bộ trực tiếp từ CSDL theo ID kết quả khám
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10">#</th>
                <th className="px-3 py-2.5">Răng</th>
                <th className="px-3 py-2.5">Tình trạng</th>
                <th className="px-3 py-2.5">Sâu răng</th>
                <th className="px-3 py-2.5">Vị trí sâu</th>
                <th className="px-3 py-2.5">Mức độ sâu</th>
                <th className="px-3 py-2.5">Lung lay</th>
                <th className="px-3 py-2.5">Nướu quanh răng</th>
                <th className="px-3 py-2.5">Triệu chứng đau</th>
                <th className="px-3 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingTeeth && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-teal-700 border-t-transparent animate-spin mr-2 align-middle" />
                    <span>Đang tải danh sách răng từ CSDL theo ID kết quả khám...</span>
                  </td>
                </tr>
              )}

              {!isLoadingTeeth && examinedTeeth.map((record, index) => {
                const cond = TOOTH_CONDITIONS.find((c) => c.key === record.toothStatus) || TOOTH_CONDITIONS[5];
                const isCurrent = selectedTooth === record.toothNumber;

                return (
                  <tr
                    key={record.id || record.toothNumber}
                    onClick={() => handleEditToothRecord(record)}
                    className={`cursor-pointer transition-colors ${isCurrent ? 'bg-teal-50/70 font-medium' : 'hover:bg-slate-50'
                      }`}
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-medium">{index + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Răng {record.toothNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${cond.badgeClass}`}>
                        {cond.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={record.cariesStatus === 'YES' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {record.cariesStatus === 'YES' ? '✓ Có' : 'Không'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{record.cariesLocation || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{getCariesDepthLabel(record.cariesDepth)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{record.mobility || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{record.gingivaStatus || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={record.painLevel !== 'NONE' ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                        {record.painLevel === 'NONE'
                          ? 'Không'
                          : record.painLevel === 'STIMULATED'
                            ? 'Có khi kích thích'
                            : 'Đau tự phát'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEditToothRecord(record)}
                          className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          title="Xem chi tiết răng này"
                        >
                          <Pencil size={14} />
                        </button>
                        {!isHistoricalSession && (
                          <button
                            type="button"
                            onClick={() => handleDeleteToothRecord(record.toothNumber)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa khỏi CSDL"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoadingTeeth && examinedTeeth.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    Chưa có răng nào được lưu vào CSDL cho kết quả khám này. Vui lòng chọn răng trên sơ đồ và nhấn <strong>"Lưu thông tin răng"</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Chuyển bước nhanh sang Phân tích AI */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Tiếp tục: Phân tích X-quang & AI</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
