import { useState, useMemo } from 'react';
import { LineChart, Filter } from 'lucide-react';
import type { DashboardClassItem } from '../../../types/dashboard';

interface DashboardCapacityChartProps {
  classes: DashboardClassItem[];
  isLoading: boolean;
}

export function DashboardCapacityChart({
  classes,
  isLoading,
}: DashboardCapacityChartProps) {
  const [filterMode, setFilterMode] = useState<'active' | 'all' | 'top'>('active');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayClasses = useMemo(() => {
    let result = [...classes];

    if (filterMode === 'active') {
      result = result.filter(
        (c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS'
      );
    } else if (filterMode === 'top') {
      result = result.sort((a, b) => b.enrolledCount - a.enrolledCount);
    }

    return result.slice(0, 8);
  }, [classes, filterMode]);

  const maxY = useMemo(() => {
    if (displayClasses.length === 0) return 10;
    const highest = Math.max(...displayClasses.map((c) => c.enrolledCount || 0), 5);
    return Math.max(Math.ceil(highest / 5) * 5, 5);
  }, [displayClasses]);

  const yTicks = useMemo(() => {
    const step = maxY / 4;
    return [0, step, step * 2, step * 3, maxY].map((val) => Math.round(val));
  }, [maxY]);

  const svgWidth = 720;
  const svgHeight = 200;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 38;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    const count = displayClasses.length;
    if (count === 0) return [];

    return displayClasses.map((item, idx) => {
      const x = count === 1 ? padLeft + chartW / 2 : padLeft + (idx / (count - 1)) * chartW;
      const enrolledRatio = maxY > 0 ? Math.min(item.enrolledCount / maxY, 1) : 0;
      const yEnrolled = padTop + chartH - enrolledRatio * chartH;

      return {
        item,
        x,
        yEnrolled,
      };
    });
  }, [displayClasses, maxY, chartW, chartH, padLeft, padTop]);

  const enrolledPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yEnrolled.toFixed(1)}`).join(' ');
  }, [points]);

  const enrolledAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baseline = (padTop + chartH).toFixed(1);
    return `${enrolledPath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`;
  }, [points, enrolledPath, padTop, chartH]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Đang tải biểu đồ đào tạo...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Biểu đồ Sĩ số theo lớp học
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setFilterMode('active');
              setHoveredIndex(null);
            }}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              filterMode === 'active'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode('top');
              setHoveredIndex(null);
            }}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              filterMode === 'top'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top sĩ số
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setHoveredIndex(null);
            }}
            className={`rounded-md px-2.5 py-1 font-semibold transition ${
              filterMode === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-50 px-1">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="h-2.5 w-6 rounded-full bg-indigo-600"></span>
          Sĩ số sinh viên ghi danh
        </div>
        <span className="text-[11px] text-slate-400">
          {displayClasses.length} lớp hiển thị
        </span>
      </div>

      {displayClasses.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <Filter className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          Không có lớp học phần nào phù hợp trong bộ lọc hiện tại.
        </div>
      ) : (
        <div className="relative my-auto py-2 flex-1 flex flex-col justify-center">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="enrolledAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {yTicks.map((tickVal) => {
              const y = padTop + chartH - (tickVal / (maxY || 1)) * chartH;
              return (
                <g key={tickVal}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + chartW}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {enrolledAreaPath && (
              <path
                d={enrolledAreaPath}
                fill="url(#enrolledAreaGrad)"
              />
            )}

            {enrolledPath && (
              <path
                d={enrolledPath}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {activePoint && (
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + chartH}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            )}

            {points.map((p, idx) => (
              <g key={p.item.classId}>
                <circle
                  cx={p.x}
                  cy={p.yEnrolled}
                  r={hoveredIndex === idx ? 6 : 4.5}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                />

                <text
                  x={p.x}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${
                    hoveredIndex === idx ? 'fill-indigo-600 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {p.item.classCode}
                </text>
              </g>
            ))}

            {points.map((p, idx) => {
              const sliceW = chartW / Math.max(points.length, 1);
              const sliceX = p.x - sliceW / 2;
              return (
                <rect
                  key={`hit-${p.item.classId}`}
                  x={sliceX}
                  y={padTop}
                  width={sliceW}
                  height={chartH + padBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              );
            })}

            {activePoint && (
              <g
                transform={`translate(${
                  activePoint.x > svgWidth - 170
                    ? activePoint.x - 165
                    : activePoint.x + 15
                }, ${Math.max(padTop, Math.min(activePoint.yEnrolled - 40, chartH - 20))})`}
                className="pointer-events-none"
              >
                <rect
                  width="150"
                  height="58"
                  rx="8"
                  fill="#1e293b"
                  opacity="0.95"
                />
                <text x="10" y="18" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {activePoint.item.classCode}
                </text>
                <text x="10" y="34" fill="#a5b4fc" fontSize="10">
                  Sĩ số: {activePoint.item.enrolledCount} sinh viên
                </text>
                <text x="10" y="48" fill="#94a3b8" fontSize="9">
                  Học kỳ: {activePoint.item.semester}
                </text>
              </g>
            )}
          </svg>

          {activePoint ? (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50/70 border border-indigo-100 p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-900">
                  {activePoint.item.classCode}
                </span>
                <span className="text-slate-600 truncate max-w-[180px] sm:max-w-[240px]">
                  {activePoint.item.courseName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">Sĩ số:</span>
                <span className="rounded bg-indigo-600 px-2 py-0.5 font-bold text-white text-[11px]">
                  {activePoint.item.enrolledCount} SV
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-500">
              <span>Rê chuột vào điểm trên biểu đồ để xem chi tiết</span>
              <span className="text-slate-600 font-medium">Cao nhất: <strong>{maxY}</strong> SV</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
