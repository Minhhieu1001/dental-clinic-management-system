import React, { useState } from 'react';
import { formatCurrency, formatNumber } from './dashboardUtils';

/**
 * AreaTrendChart: Modern SVG multi-line area chart with gradient fills and hover tooltip
 */
export function AreaTrendChart({
  data = [],
  series = [
    { key: 'invoiceRevenue', label: 'Doanh thu HĐ', color: '#0d9488', gradientId: 'tealGrad' },
    { key: 'actualCollected', label: 'Thực thu', color: '#10b981', gradientId: 'emeraldGrad' },
  ],
  isCurrency = true,
  height = 240,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Không có dữ liệu xu hướng trong khoảng thời gian này
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 35, left: 65 };
  const svgWidth = 800;
  const svgHeight = height;
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Find max value across all series
  let maxValue = 0;
  data.forEach((item) => {
    series.forEach((s) => {
      const val = parseFloat(item[s.key] || 0);
      if (val > maxValue) maxValue = val;
    });
  });
  if (maxValue === 0) maxValue = 1000000;
  // Round up max for clean grid
  const niceMax = Math.ceil(maxValue * 1.15);

  const getX = (idx) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    const num = parseFloat(val || 0);
    return padding.top + chartHeight - (num / niceMax) * chartHeight;
  };

  // Generate paths for each series
  const seriesPaths = series.map((s) => {
    if (data.length === 1) {
      const x = getX(0);
      const y = getY(data[0][s.key]);
      return {
        ...s,
        linePath: `M ${x - 20} ${y} L ${x + 20} ${y}`,
        areaPath: `M ${x - 20} ${y} L ${x + 20} ${y} L ${x + 20} ${padding.top + chartHeight} L ${x - 20} ${padding.top + chartHeight} Z`,
      };
    }

    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[s.key]) }));
    // Simple smooth bezier path or straight lines
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      linePath += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = padding.top + chartHeight;
    const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { ...s, linePath, areaPath, points };
  });

  // Y-axis grid ticks (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => ({
    val: niceMax * pct,
    y: padding.top + chartHeight - pct * chartHeight,
  }));

  const activeItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md bg-slate-50/50 p-2 border border-slate-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: `${height}px` }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={svgWidth - padding.right}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {isCurrency
                  ? tick.val >= 1000000
                    ? `${(tick.val / 1000000).toFixed(1)}Tr`
                    : tick.val >= 1000
                    ? `${(tick.val / 1000).toFixed(0)}k`
                    : '0'
                  : formatNumber(tick.val)}
              </text>
            </g>
          ))}

          {/* Areas and Lines */}
          {seriesPaths.map((s) => (
            <g key={s.key}>
              <path d={s.areaPath} fill={`url(#${s.gradientId || 'tealGrad'})`} />
              <path
                d={s.linePath}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = getX(i);
            // Show all if <= 10 items, else step
            const step = Math.ceil(data.length / 10);
            if (i % step !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[11px] fill-slate-500 font-medium"
              >
                {d.label || d.dateKey}
              </text>
            );
          })}

          {/* Hover tracker line & markers */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {series.map((s) => {
                const item = data[hoverIndex];
                const y = getY(item[s.key]);
                return (
                  <circle
                    key={s.key}
                    cx={getX(hoverIndex)}
                    cy={y}
                    r="5"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Transparent Hover catchers */}
          {data.map((_, i) => {
            const x = getX(i);
            const w = chartWidth / data.length;
            return (
              <rect
                key={i}
                x={x - w / 2}
                y={padding.top}
                width={w}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeItem && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-20 rounded-md bg-slate-900/90 p-3 text-xs text-white shadow-xl backdrop-blur-md transition-all border border-slate-700/50"
            style={{
              left: `${Math.min(Math.max(15, (getX(hoverIndex) / svgWidth) * 100), 75)}%`,
              top: '10px',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{activeItem.label || activeItem.dateKey}</span>
              {activeItem.invoiceCount !== undefined && (
                <span className="text-[10px] text-teal-300 font-normal">
                  {activeItem.invoiceCount} hóa đơn
                </span>
              )}
            </div>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}:
                  </span>
                  <span className="font-semibold text-white">
                    {isCurrency
                      ? formatCurrency(activeItem[s.key])
                      : formatNumber(activeItem[s.key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BarTrendChart: Clean vertical bar chart with architectural tracks and soft dental gradients
 */
export function BarTrendChart({
  data = [],
  xKey = 'label',
  yKey = 'revenue',
  isCurrency = true,
  height = 220,
  barColor = '#0d9488',
  barGradient = 'linear-gradient(180deg, #2dd4bf 0%, #0d9488 100%)',
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        Không có dữ liệu biểu đồ cột
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => parseFloat(d[yKey] || 0)), 1);

  return (
    <div className="relative w-full pt-6">
      <div
        className="flex items-end justify-around gap-4 pb-2 px-3"
        style={{ height: `${height}px` }}
      >
        {data.map((item, idx) => {
          const val = parseFloat(item[yKey] || 0);
          // Scale bar up to 75% of the track height so tooltip has ample headroom and is never clipped
          const heightPercent = Math.max((val / maxVal) * 75, 6);
          const isHovered = hoverIndex === idx;

          return (
            <div
              key={idx}
              className="group relative flex flex-col items-center justify-end h-full min-w-[54px] max-w-[84px] flex-1 cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Tooltip on top of bar - guaranteed ample headroom, never cut off */}
              {isHovered && (
                <div className="absolute top-0 z-30 whitespace-nowrap rounded-md bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl border border-slate-700/60 pointer-events-none transition-all">
                  {isCurrency ? formatCurrency(val) : formatNumber(val)}
                </div>
              )}

              {/* Architectural Bar Track */}
              <div className="relative w-full h-[calc(100%-26px)] rounded-t-lg bg-slate-100/70 flex items-end justify-center p-1 transition-colors group-hover:bg-teal-50/60">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isHovered ? 'brightness-105 scale-y-[1.01]' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    background: barGradient || barColor,
                    boxShadow: isHovered ? '0 4px 12px rgba(13, 148, 136, 0.3)' : 'none',
                  }}
                />
              </div>

              {/* X label */}
              <span className="mt-2 text-[11px] font-medium text-slate-500 truncate max-w-full text-center group-hover:text-teal-700 transition-colors">
                {item[xKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * DonutChart: Clean circular percentage breakdown with soft harmonious colors
 */
export function DonutChart({
  items = [], // [{ label, value, color }]
  isCurrency = false,
  centerTitle = 'Tổng',
  centerValue = '',
  layout = 'horizontal', // 'horizontal' | 'vertical'
  showLegend = true,
  size = 140,
}) {
  const total = items.reduce((acc, curr) => acc + parseFloat(curr.value || 0), 0);

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        Chưa có số liệu phân bổ
      </div>
    );
  }

  // Calculate SVG arc paths
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Track active items with real value to prevent 0-value items from rendering orphan dots
  const activeItems = items.filter((item) => parseFloat(item.value || 0) > 0);

  let currentOffset = 0;
  const segments = items.map((item) => {
    const val = parseFloat(item.value || 0);
    const strokeDasharray = `${(val / total) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    if (val > 0) {
      currentOffset += (val / total) * circumference;
    }
    const pct = Math.round((val / total) * 1000) / 10;
    return { ...item, strokeDasharray, strokeDashoffset, pct, isActive: val > 0 };
  });

  return (
    <div
      className={`flex items-center ${
        layout === 'vertical'
          ? 'flex-col gap-3 w-full'
          : 'flex-col sm:flex-row gap-4 w-full min-w-0'
      }`}
    >
      {/* SVG Donut */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => {
            if (!seg.isActive) return null;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap={activeItems.length === 1 ? 'round' : 'butt'}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{centerTitle}</span>
          <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[90px]">
            {centerValue || (isCurrency ? formatCurrency(total) : formatNumber(total))}
          </span>
        </div>
      </div>

      {/* Legend list */}
      {showLegend && (
        <div className="space-y-1.5 text-xs w-full min-w-0">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-2 min-w-0 ${
                !seg.isActive ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <span
                  className={`truncate ${seg.isActive ? 'text-slate-700 font-medium' : 'text-slate-400'}`}
                  title={seg.label}
                >
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-right flex-shrink-0">
                <span className={`font-semibold ${seg.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {isCurrency ? formatCurrency(seg.value) : formatNumber(seg.value)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({seg.pct}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
