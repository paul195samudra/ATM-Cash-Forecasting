import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { getAtmHistory, HistoryRecord } from '../data/historyHelper';
import { OperationalPolicy } from '../types/operations';
import { DepletionTrajectoryChart } from './DepletionTrajectoryChart';
import {
  TrendingUp,
  AlertCircle,
  BarChart3,
  Calendar,
  Activity,
  TrendingDown
} from 'lucide-react';

interface AtmChartProps {
  atm: ATMRecord;
  policy: OperationalPolicy;
}

export const AtmChart: React.FC<AtmChartProps> = ({ atm, policy }) => {
  const [chartMode, setChartMode] = useState<'historical' | 'forward'>('forward');
  const [range, setRange] = useState<'14d' | '30d' | '60d' | 'all'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const history: HistoryRecord = useMemo(() => {
    return getAtmHistory(atm.ATMID);
  }, [atm.ATMID]);

  const filteredData = useMemo(() => {
    if (!history.dates || history.dates.length === 0) return { dates: [], actual: [], predicted: [] };
    const total = history.dates.length;
    let sliceStart = 0;
    if (range === '14d') sliceStart = Math.max(0, total - 14);
    else if (range === '30d') sliceStart = Math.max(0, total - 30);
    else if (range === '60d') sliceStart = Math.max(0, total - 60);

    return {
      dates: history.dates.slice(sliceStart),
      actual: history.actual.slice(sliceStart),
      predicted: history.predicted.slice(sliceStart),
    };
  }, [history, range]);

  const stats = useMemo(() => {
    if (filteredData.actual.length === 0) {
      return { mae: 0, avgActual: 0, peakActual: 0, accuracy: 0 };
    }
    const n = filteredData.actual.length;
    let sumAbsErr = 0;
    let sumActual = 0;
    let peak = 0;

    for (let i = 0; i < n; i++) {
      const act = filteredData.actual[i];
      const pred = filteredData.predicted[i];
      sumAbsErr += Math.abs(act - pred);
      sumActual += act;
      if (act > peak) peak = act;
    }

    const mae = sumAbsErr / n;
    const avgActual = sumActual / n;
    const accuracy = avgActual > 0 ? Math.max(0, 100 - (mae / avgActual) * 100) : 0;

    return { mae, avgActual, peakActual: peak, accuracy };
  }, [filteredData]);

  // SVG Chart Geometry
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = filteredData.dates.length;

  const maxVal = useMemo(() => {
    let m = 1000;
    filteredData.actual.forEach((v) => { if (v > m) m = v; });
    filteredData.predicted.forEach((v) => { if (v > m) m = v; });
    return Math.ceil(m * 1.1);
  }, [filteredData]);

  const minVal = 0;

  const getX = (idx: number) => {
    if (n <= 1) return padding.left + chartW / 2;
    return padding.left + (idx / (n - 1)) * chartW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padding.top + chartH - ratio * chartH;
  };

  const actualPath = filteredData.actual
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)},${getY(val).toFixed(1)}`)
    .join(' ');

  const predictedPath = filteredData.predicted
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)},${getY(val).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const val = minVal + p * (maxVal - minVal);
    return { val, y: getY(val) };
  });

  const xTicks = useMemo(() => {
    if (n === 0) return [];
    const step = Math.max(1, Math.floor(n / 6));
    const ticks: { date: string; x: number; idx: number }[] = [];
    for (let i = 0; i < n; i += step) {
      ticks.push({ date: filteredData.dates[i], x: getX(i), idx: i });
    }
    if (ticks[ticks.length - 1].idx !== n - 1) {
      ticks.push({ date: filteredData.dates[n - 1], x: getX(n - 1), idx: n - 1 });
    }
    return ticks;
  }, [filteredData, n, chartW]);

  const activeIdx = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n ? hoverIndex : null;
  const activeDate = activeIdx !== null ? filteredData.dates[activeIdx] : null;
  const activeActual = activeIdx !== null ? filteredData.actual[activeIdx] : null;
  const activePredicted = activeIdx !== null ? filteredData.predicted[activeIdx] : null;

  return (
    <div className="space-y-3">
      {/* Chart View Switcher Bar */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setChartMode('forward')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              chartMode === 'forward'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Forward 7-Day Depletion Trajectory</span>
          </button>

          <button
            onClick={() => setChartMode('historical')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              chartMode === 'historical'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2024 Actual vs Predicted History</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Focus: <strong className="font-mono text-slate-900">{atm.ATMID}</strong>
        </div>
      </div>

      {/* Trajectory View */}
      {chartMode === 'forward' && (
        <DepletionTrajectoryChart atm={atm} policy={policy} />
      )}

      {/* Historical View */}
      {chartMode === 'historical' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h3 className="font-bold text-slate-800 text-sm md:text-base">
                  Actual vs Predicted Cash Demand — ATM {atm.ATMID}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily cash withdrawal observations vs machine learning forecast model
              </p>
            </div>

            {/* Range filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['14d', '30d', '60d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    range === r
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === '14d' ? '14 Days' : r === '30d' ? '30 Days' : r === '60d' ? '60 Days' : 'Full 2024'}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Forecast MAE</div>
              <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                ৳{Math.round(stats.mae).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Mean absolute error</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Daily Demand</div>
              <div className="text-sm font-bold text-blue-700 font-mono mt-0.5">
                ৳{Math.round(stats.avgActual).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Over selected window</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peak Demand</div>
              <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">
                ৳{Math.round(stats.peakActual).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Highest daily outflow</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Accuracy</div>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                {stats.accuracy.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500">Normalized fidelity</div>
            </div>
          </div>

          {/* Chart SVG */}
          <div className="relative w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto max-h-[300px]"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * width;
                if (relX >= padding.left && relX <= padding.left + chartW) {
                  const fraction = (relX - padding.left) / chartW;
                  const idx = Math.round(fraction * (n - 1));
                  setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
                }
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {yTicks.map((t, idx) => (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={t.y}
                    x2={padding.left + chartW}
                    y2={t.y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={t.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#94a3b8"
                  >
                    ৳{(t.val / 1000).toFixed(0)}k
                  </text>
                </g>
              ))}

              {/* Area fill under actual demand */}
              {filteredData.actual.length > 0 && (
                <path
                  d={`${actualPath} L ${getX(n - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`}
                  fill="url(#actualGradient)"
                />
              )}

              {/* Actual line (Blue) */}
              <path
                d={actualPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Predicted line (Red dashed) */}
              <path
                d={predictedPath}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X Axis Labels */}
              {xTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={tick.x}
                    y1={padding.top + chartH}
                    x2={tick.x}
                    y2={padding.top + chartH + 5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={tick.x}
                    y={padding.top + chartH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#64748b"
                  >
                    {tick.date.slice(5)}
                  </text>
                </g>
              ))}

              {/* Active Hover Crosshair & Dots */}
              {activeIdx !== null && (
                <g>
                  <line
                    x1={getX(activeIdx)}
                    y1={padding.top}
                    x2={getX(activeIdx)}
                    y2={padding.top + chartH}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={getX(activeIdx)}
                    cy={getY(filteredData.actual[activeIdx])}
                    r="4.5"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <circle
                    cx={getX(activeIdx)}
                    cy={getY(filteredData.predicted[activeIdx])}
                    r="4.5"
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activeIdx !== null && activeDate && activeActual !== null && activePredicted !== null && (
              <div
                className="absolute top-2 pointer-events-none bg-slate-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur-xs border border-slate-700 font-mono transition-transform"
                style={{
                  left: `${Math.min(
                    Math.max(10, ((getX(activeIdx) - 20) / width) * 100),
                    70
                  )}%`,
                }}
              >
                <div className="font-semibold text-slate-300 pb-1 border-b border-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  {activeDate}
                </div>
                <div className="flex justify-between gap-4 mt-1.5">
                  <span className="text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Actual:
                  </span>
                  <span className="font-bold">৳{Math.round(activeActual).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4 mt-1">
                  <span className="text-red-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Predicted:
                  </span>
                  <span className="font-bold">৳{Math.round(activePredicted).toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Deviation:</span>
                  <span className={activeActual > activePredicted ? 'text-amber-400' : 'text-emerald-400'}>
                    {activeActual > activePredicted ? '+' : ''}
                    ৳{Math.round(activeActual - activePredicted).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
                <span className="font-medium text-slate-700">Actual Outflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-red-600 inline-block"></span>
                <span className="font-medium text-slate-700">Model Predicted Demand</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Hover over data points to inspect date-specific demand figures
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
