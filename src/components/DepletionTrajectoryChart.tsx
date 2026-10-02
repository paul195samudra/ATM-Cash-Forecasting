import React, { useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy } from '../types/operations';
import { calculateForwardDepletion } from '../utils/cashCalculations';
import {
  TrendingDown,
  AlertOctagon,
  Clock,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface DepletionTrajectoryChartProps {
  atm: ATMRecord;
  policy: OperationalPolicy;
  demandMultiplier?: number;
}

export const DepletionTrajectoryChart: React.FC<DepletionTrajectoryChartProps> = ({
  atm,
  policy,
  demandMultiplier = 1.0,
}) => {
  const result = useMemo(() => {
    return calculateForwardDepletion(atm, policy, demandMultiplier);
  }, [atm, policy, demandMultiplier]);

  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(atm.ATM_Capacity, atm.Estimated_Cash_Remaining * 1.1, 100000);
  const minVal = 0;

  // 8 steps: 0 = Today's current balance, 1..7 = Day 1 through Day 7 closing balances
  const getX = (stepIndex: number) => {
    return padding.left + (stepIndex / 7) * chartW;
  };

  const getY = (val: number) => {
    const ratio = Math.max(0, val - minVal) / (maxVal - minVal || 1);
    return padding.top + chartH - ratio * chartH;
  };

  const pathPoints = [
    {
      x: getX(0),
      y: getY(atm.Estimated_Cash_Remaining),
      val: atm.Estimated_Cash_Remaining,
      label: 'Now',
      sub: 'Start',
      isDry: atm.Estimated_Cash_Remaining <= 0,
    },
    ...result.dailyPoints.map((pt, idx) => ({
      x: getX(idx + 1),
      y: getY(pt.projectedClosingCash),
      val: pt.projectedClosingCash,
      label: pt.date.slice(5),
      sub: pt.dayName.slice(0, 3),
      isDry: pt.projectedClosingCash <= 0,
    })),
  ];

  const trajectoryPath = pathPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  const criticalY = getY(atm.ATM_Capacity * (policy.refillNowPctThreshold / 100));

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                7-Day Cash Depletion Trajectory — ATM {atm.ATMID}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Forward burn-down projection incorporating weekend rhythms, paydays, and scheduled drawdowns
            </p>
          </div>

          <div className="text-right">
            {result.cashOutDate ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5" /> Runs Empty on {result.cashOutDate}
              </span>
            ) : result.criticalDate ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5" /> Drops Below {policy.refillNowPctThreshold}% on{' '}
                {result.criticalDate}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Safe through 7-Day Window
              </span>
            )}
          </div>
        </div>

        {/* Forecast KPI bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Vault Cash</span>
            <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
              ${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">{atm.Cash_Remaining_Pct.toFixed(1)}% full</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">7-Day Outflow</span>
            <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
              ${Math.round(result.total7DayDemand).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Cumulative forecast</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Projected Run-Out</span>
            <div
              className={`text-sm font-mono font-bold mt-0.5 ${
                atm.Days_of_Cash < 1
                  ? 'text-red-600'
                  : atm.Days_of_Cash < 2
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {atm.Days_of_Cash} days
            </div>
            <span className="text-[10px] text-slate-500">Burn rate velocity</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Optimal Load Window</span>
            <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
              {result.criticalDate ? result.criticalDate.slice(5) : 'Day 4 - Day 5'}
            </div>
            <span className="text-[10px] text-slate-500">Before penalty trigger</span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[300px]">
            <defs>
              <linearGradient id="depletionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Critical Safety Zone fill */}
            <rect
              x={padding.left}
              y={criticalY}
              width={chartW}
              height={padding.top + chartH - criticalY}
              fill="#fee2e2"
              fillOpacity="0.35"
            />

            {/* Threshold Line */}
            <line
              x1={padding.left}
              y1={criticalY}
              x2={padding.left + chartW}
              y2={criticalY}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <text
              x={padding.left + 8}
              y={criticalY - 4}
              fontSize="10"
              fontFamily="IBM Plex Mono, monospace"
              fill="#dc2626"
              fontWeight="600"
            >
              Critical Threshold ({policy.refillNowPctThreshold}%)
            </text>

            {/* Zero Axis / Ground Floor */}
            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={padding.left + chartW}
              y2={padding.top + chartH}
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Trajectory Curve */}
            <path
              d={trajectoryPath}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {pathPoints.map((pt, idx) => {
              return (
                <g key={idx}>
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + chartH}
                    stroke="#e2e8f0"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.isDry ? 5.5 : idx === 0 ? 5 : 4}
                    fill={pt.isDry ? '#dc2626' : idx === 0 ? '#2563eb' : '#ffffff'}
                    stroke={pt.isDry ? '#ffffff' : idx === 0 ? '#ffffff' : '#dc2626'}
                    strokeWidth="2"
                  />
                  {/* Closing cash label */}
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#1e293b"
                    fontWeight="600"
                  >
                    ${(pt.val / 1000).toFixed(0)}k
                  </text>
                  {/* Date label */}
                  <text
                    x={pt.x}
                    y={padding.top + chartH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#475569"
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                  <text
                    x={pt.x}
                    y={padding.top + chartH + 30}
                    textAnchor="middle"
                    fontSize="9"
                    fill={idx === 0 ? '#2563eb' : pt.sub === 'Fri' || pt.sub === 'Sat' ? '#2563eb' : '#94a3b8'}
                    fontWeight={idx === 0 || pt.sub === 'Fri' || pt.sub === 'Sat' ? '600' : 'normal'}
                  >
                    {pt.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Day-by-Day Forecast Breakdown Grid */}
        <div className="grid grid-cols-7 gap-1 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
          {result.dailyPoints.map((pt, idx) => (
            <div
              key={idx}
              className={`p-1.5 rounded-lg border ${
                pt.status === 'Refill Now'
                  ? 'bg-red-50/70 border-red-200'
                  : pt.status === 'Refill Soon'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="font-bold text-[10px] text-slate-700">
                {pt.dayName.slice(0, 3)} {pt.isWeekend && <span className="text-blue-600">★</span>}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                -${(pt.projectedDemand / 1000).toFixed(0)}k
              </div>
              <div className="text-[10px] font-bold text-slate-800 font-mono mt-0.5">
                {pt.projectedPct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 text-center mt-3 pt-2 border-t border-slate-100">
        ★ Highlights weekend surge factors & bi-monthly salary windows. Red shaded area marks critical safety buffer.
      </div>
    </div>
  );
};
