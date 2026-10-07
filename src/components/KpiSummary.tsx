import React from 'react';
import { ATMRecord } from '../data/atmData';
import {
  AlertOctagon,
  Clock,
  TrendingDown,
  Layers,
  Banknote,
  Percent,
  CheckCircle2,
  Activity,
  ArrowUpRight
} from 'lucide-react';

interface KpiSummaryProps {
  atms: ATMRecord[];
  onFilterClick?: (filterType: 'all' | 'now' | 'soon' | 'lt1') => void;
  activeFilter?: string;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  atms,
  onFilterClick,
  activeFilter = 'all',
}) => {
  const totalAtms = atms.length;

  const refillNowCount = atms.filter((a) => a.Status === 'Refill Now').length;
  const refillSoonCount = atms.filter((a) => a.Status === 'Refill Soon').length;
  const okCount = atms.filter((a) => a.Status === 'OK').length;
  const underOneDayCount = atms.filter((a) => Number(a.Days_of_Cash) < 1).length;

  const totalRefillNeeded = atms.reduce((acc, a) => acc + (a.Refill_Suggestion_Amount || 0), 0);
  const totalCapacity = atms.reduce((acc, a) => acc + (a.ATM_Capacity || 0), 0);
  const totalRemaining = atms.reduce((acc, a) => acc + (a.Estimated_Cash_Remaining || 0), 0);

  const avgDays =
    totalAtms > 0
      ? (atms.reduce((acc, a) => acc + (Number(a.Days_of_Cash) || 0), 0) / totalAtms).toFixed(1)
      : '0.0';

  const networkPct = totalCapacity > 0 ? ((totalRemaining / totalCapacity) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6 select-none">
      {/* 1. Total ATMs */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('all')}
        className={`bg-white rounded-xl p-3.5 border transition-all text-left shadow-xs hover:border-slate-400 group cursor-pointer relative overflow-hidden flex flex-col justify-between ${
          activeFilter === 'all'
            ? 'ring-2 ring-slate-900 border-slate-900 bg-slate-50/60'
            : 'border-slate-200/90 hover:shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Fleet Terminals
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">{totalAtms}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Active Nodes</span>
          <span className="text-emerald-700 font-semibold font-mono text-[10px]">100% Online</span>
        </div>
      </button>

      {/* 2. Refill Now */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('now')}
        className={`bg-white rounded-xl p-3.5 border transition-all text-left shadow-xs hover:border-rose-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between ${
          activeFilter === 'now'
            ? 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/30'
            : refillNowCount > 0
            ? 'border-rose-200/90 bg-rose-50/15'
            : 'border-slate-200/90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              Refill Now
            </span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">
            {refillNowCount}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Critical Floor</span>
          <span className="font-mono text-rose-700 font-bold text-[10px]">&le; 20% Cash</span>
        </div>
      </button>

      {/* 3. Refill Soon */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('soon')}
        className={`bg-white rounded-xl p-3.5 border transition-all text-left shadow-xs hover:border-amber-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between ${
          activeFilter === 'soon'
            ? 'ring-2 ring-amber-600 border-amber-600 bg-amber-50/30'
            : refillSoonCount > 0
            ? 'border-amber-200/90 bg-amber-50/15'
            : 'border-slate-200/90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Refill Soon
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
            {refillSoonCount}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Action Queue</span>
          <span className="font-mono text-amber-800 font-semibold text-[10px]">&le; 40% Cash</span>
        </div>
      </button>

      {/* 4. < 1 Day Cash */}
      <button
        type="button"
        onClick={() => onFilterClick && onFilterClick('lt1')}
        className={`bg-white rounded-xl p-3.5 border transition-all text-left shadow-xs hover:border-slate-400 group cursor-pointer relative overflow-hidden flex flex-col justify-between ${
          activeFilter === 'lt1'
            ? 'ring-2 ring-slate-800 border-slate-800 bg-slate-100/60'
            : 'border-slate-200/90'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              &lt; 1 Day Cash
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {underOneDayCount}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Depletion Risk</span>
          <span className="font-mono text-slate-700 font-semibold text-[10px]">Urgent Dispatch</span>
        </div>
      </button>

      {/* 5. Total Refill Needed */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Refill Req.
            </span>
            <Banknote className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono tracking-tight">
            ৳{(totalRefillNeeded / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Pipeline Cash</span>
          <span className="font-mono text-emerald-800 font-semibold text-[10px]">
            ৳{Math.round(totalRefillNeeded).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 6. Avg Days of Cash */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Avg Days Runway
            </span>
            <Activity className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {avgDays} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Fleet Outflow</span>
          <span className="font-mono text-slate-700 font-semibold text-[10px]">~3.1d Burn</span>
        </div>
      </div>

      {/* 7. Network Cash Utilization */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Vault Liquidity
            </span>
            <Percent className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono tracking-tight">
            {networkPct}%
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${networkPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>৳{(totalRemaining / 1000000).toFixed(0)}M Held</span>
            <span>৳{(totalCapacity / 1000000).toFixed(0)}M Cap</span>
          </div>
        </div>
      </div>
    </div>
  );
};
