import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { getAtmRegion, CORRIDORS, getAtmHorizonForecast, HorizonForecast } from '../utils/cashCalculations';
import { OperationalPolicy, defaultOperationalPolicy } from '../types/operations';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Building,
  CheckSquare,
  Truck,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Calendar,
  Zap,
  Clock,
  FileSpreadsheet,
  UploadCloud
} from 'lucide-react';

export type ForecastHorizon = 'base' | 't1' | 't2';

interface AtmTableProps {
  atms: ATMRecord[];
  selectedId: string | null;
  onSelectAtm: (atmId: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  daysFilter: string;
  setDaysFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  regionFilter: string;
  setRegionFilter: (val: string) => void;
  checkedIds: string[];
  onToggleCheck: (id: string) => void;
  onCheckAll: (ids: string[]) => void;
  onClearChecked: () => void;
  onOpenPolicyModal?: () => void;
  onQuickAddToManifest?: (atm: ATMRecord) => void;
  onQuickSimulateRefill?: (atmId: string) => void;
  manifestIds?: string[];
  policy?: OperationalPolicy;
  isCustomDataActive?: boolean;
  customDataName?: string;
  onOpenImportModal?: () => void;
  onResetToDefault?: () => void;
}

export const AtmTable: React.FC<AtmTableProps> = ({
  atms,
  selectedId,
  onSelectAtm,
  statusFilter,
  setStatusFilter,
  daysFilter,
  setDaysFilter,
  searchQuery,
  setSearchQuery,
  regionFilter,
  setRegionFilter,
  checkedIds,
  onToggleCheck,
  onCheckAll,
  onClearChecked,
  onOpenPolicyModal,
  onQuickAddToManifest,
  onQuickSimulateRefill,
  manifestIds = [],
  policy = defaultOperationalPolicy,
  isCustomDataActive = false,
  customDataName,
  onOpenImportModal,
  onResetToDefault,
}) => {
  const [pctFilter, setPctFilter] = useState('all');
  const [sortKey, setSortKey] = useState<keyof ATMRecord>('Days_of_Cash');
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompact, setIsCompact] = useState(false);
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('base');

  // Next Day (T+1) & Next 2 Days (T+2) Horizon Map for all ATMs
  const horizonMap = useMemo(() => {
    const map: Record<string, HorizonForecast> = {};
    atms.forEach((a) => {
      map[a.ATMID] = getAtmHorizonForecast(a, policy);
    });
    return map;
  }, [atms, policy]);

  // Aggregate horizon metrics for fleet
  const horizonSummary = useMemo(() => {
    let totalT1Demand = 0;
    let totalT2Demand = 0;
    let totalT1Notes1000 = 0;
    let totalT1Notes500 = 0;
    let totalT2Notes1000 = 0;
    let totalT2Notes500 = 0;
    let countT1Critical = 0;
    let countT2Critical = 0;

    atms.forEach((a) => {
      const h = horizonMap[a.ATMID];
      if (h) {
        totalT1Demand += h.t1Demand;
        totalT2Demand += h.t2Demand;
        totalT1Notes1000 += h.t1Notes.notes1000Count;
        totalT1Notes500 += h.t1Notes.notes500Count;
        totalT2Notes1000 += h.t2Notes.notes1000Count;
        totalT2Notes500 += h.t2Notes.notes500Count;
        if (h.t1Status === 'Refill Now' || h.t1ClosingCash <= 0) countT1Critical++;
        if (h.t2Status === 'Refill Now' || h.t2ClosingCash <= 0) countT2Critical++;
      }
    });

    return {
      totalT1Demand,
      totalT2Demand,
      totalT1Notes1000,
      totalT1Notes500,
      totalT2Notes1000,
      totalT2Notes500,
      countT1Critical,
      countT2Critical,
    };
  }, [atms, horizonMap]);

  // Available regions list
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    atms.forEach((a) => {
      const { code } = getAtmRegion(a.ATMID);
      if (code) set.add(code);
    });
    return Array.from(set).sort();
  }, [atms]);

  // Filtering
  const filteredAtms = useMemo(() => {
    return atms.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.ATMID.toLowerCase().includes(q);
        const matchesLoc = r.Location.toLowerCase().includes(q);
        if (!matchesId && !matchesLoc) return false;
      }
      if (statusFilter !== 'all' && r.Status !== statusFilter) {
        return false;
      }
      const days = Number(r.Days_of_Cash) || 0;
      if (daysFilter === 'lt1' && days >= 1) return false;
      if (daysFilter === 'lt2' && days >= 2) return false;
      if (daysFilter === 'lt3' && days >= 3) return false;
      if (daysFilter === 'gte3' && days < 3) return false;

      const pct = Number(r.Cash_Remaining_Pct) || 0;
      if (pctFilter === 'lt20' && pct > 20) return false;
      if (pctFilter === 'lt40' && pct > 40) return false;
      if (pctFilter === 'gt40' && pct <= 40) return false;

      if (regionFilter !== 'all') {
        const { code } = getAtmRegion(r.ATMID);
        if (code !== regionFilter) return false;
      }

      return true;
    });
  }, [atms, searchQuery, statusFilter, daysFilter, pctFilter, regionFilter]);

  // Sorting
  const sortedAtms = useMemo(() => {
    const list = [...filteredAtms];
    list.sort((a, b) => {
      let vA = a[sortKey];
      let vB = b[sortKey];

      if (sortKey === 'Predicted_Demand') {
        if (forecastHorizon === 't1') {
          vA = horizonMap[a.ATMID]?.t1Demand ?? a.Predicted_Demand;
          vB = horizonMap[b.ATMID]?.t1Demand ?? b.Predicted_Demand;
        } else if (forecastHorizon === 't2') {
          vA = horizonMap[a.ATMID]?.t2Demand ?? a.Predicted_Demand;
          vB = horizonMap[b.ATMID]?.t2Demand ?? b.Predicted_Demand;
        }
      }

      if (typeof vA === 'string' || typeof vB === 'string') {
        const comp = String(vA).localeCompare(String(vB));
        return sortAsc ? comp : -comp;
      }

      const numA = Number(vA) || 0;
      const numB = Number(vB) || 0;

      if (numA < numB) return sortAsc ? -1 : 1;
      if (numA > numB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredAtms, sortKey, sortAsc, forecastHorizon, horizonMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedAtms.length / pageSize));
  const paginatedAtms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAtms.slice(start, start + pageSize);
  }, [sortedAtms, currentPage, pageSize]);

  const handleSort = (key: keyof ATMRecord) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'Days_of_Cash' || key === 'Cash_Remaining_Pct' || key === 'Status');
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDaysFilter('all');
    setPctFilter('all');
    setRegionFilter('all');
    setSortKey('Days_of_Cash');
    setSortAsc(true);
    setCurrentPage(1);
    setForecastHorizon('base');
    onClearChecked();
  };

  const isAllPaginatedChecked =
    paginatedAtms.length > 0 && paginatedAtms.every((a) => checkedIds.includes(a.ATMID));

  const handleToggleSelectAllCurrentPage = () => {
    if (isAllPaginatedChecked) {
      const pageIds = paginatedAtms.map((a) => a.ATMID);
      const remaining = checkedIds.filter((id) => !pageIds.includes(id));
      onCheckAll(remaining);
    } else {
      const pageIds = paginatedAtms.map((a) => a.ATMID);
      const combined = Array.from(new Set([...checkedIds, ...pageIds]));
      onCheckAll(combined);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-8">
      {/* Custom Dataset Active Alert Banner */}
      {isCustomDataActive && (
        <div className="px-4 py-2.5 bg-blue-50/90 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Custom Feature-Engineered Dataset Active:</strong> {atms.length} ATM records loaded {customDataName ? `("${customDataName}")` : ''}. All cash burn predictions, fill ratios, and CIT logistics are computed from your model data.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenImportModal && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors cursor-pointer"
              >
                Upload Another CSV
              </button>
            )}
            {onResetToDefault && (
              <button
                type="button"
                onClick={onResetToDefault}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Restore default 256 football legends fleet"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70">
        {/* Cash Demand Forecasting Horizon Switcher */}
        <div className="flex flex-wrap items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cash Demand Forecast Horizon
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Next-Day & 2-Day Predictive Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Switch forecast horizon to simulate terminal cash burn, closing balances, and stockout probability.
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setForecastHorizon('base')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                forecastHorizon === 'base'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Today (Base 24h)</span>
            </button>

            <button
              type="button"
              onClick={() => setForecastHorizon('t1')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                forecastHorizon === 't1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Next Day (T+1)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  forecastHorizon === 't1' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                ৳{(horizonSummary.totalT1Demand / 1000000).toFixed(1)}M
              </span>
            </button>

            <button
              type="button"
              onClick={() => setForecastHorizon('t2')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                forecastHorizon === 't2'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Next 2 Days (T+2)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  forecastHorizon === 't2' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                ৳{(horizonSummary.totalT2Demand / 1000000).toFixed(1)}M
              </span>
            </button>
          </div>
        </div>

        {/* Actionable Banner for Active Horizon */}
        {forecastHorizon === 't1' && (
          <div className="mb-3.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold">Tomorrow's (T+1) Fleet Demand Outlook: </span>
                <span className="font-mono text-blue-800 font-bold">
                  ৳{Math.round(horizonSummary.totalT1Demand).toLocaleString()}
                </span>
                <span className="text-slate-500">across {atms.length} terminals</span>
                {horizonSummary.countT1Critical > 0 && (
                  <span className="ml-1 text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                    {horizonSummary.countT1Critical} terminals hit &le;20% tomorrow
                  </span>
                )}
              </div>
              {/* Vault 1000 and 500 Note Requirement */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-blue-200/60 font-mono">
                <span className="text-slate-600 font-sans font-semibold">Suggested Fleet Vault Loading:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-medium">
                  ৳1,000 notes: {horizonSummary.totalT1Notes1000.toLocaleString()} bills (৳{(horizonSummary.totalT1Notes1000 * 1000 / 1000000).toFixed(2)}M)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                  ৳500 notes: {horizonSummary.totalT1Notes500.toLocaleString()} bills (৳{(horizonSummary.totalT1Notes500 * 500 / 1000000).toFixed(2)}M)
                </span>
              </div>
            </div>

            {horizonSummary.countT1Critical > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDaysFilter('lt1');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Filter {horizonSummary.countT1Critical} At-Risk Tomorrow (&lt;24h)
              </button>
            )}
          </div>
        )}

        {forecastHorizon === 't2' && (
          <div className="mb-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="font-bold">Next 2 Days (T+2) Cumulative Demand Outlook: </span>
                <span className="font-mono text-slate-900 font-bold">
                  ৳{Math.round(horizonSummary.totalT2Demand).toLocaleString()}
                </span>
                <span className="text-slate-500">across {atms.length} terminals</span>
                {horizonSummary.countT2Critical > 0 && (
                  <span className="ml-1 text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                    {horizonSummary.countT2Critical} terminals hit &le;20% in 48h
                  </span>
                )}
              </div>
              {/* Vault 1000 and 500 Note Requirement */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 border-t border-slate-200 font-mono">
                <span className="text-slate-600 font-sans font-semibold">Suggested 48h Fleet Vault Loading:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-medium">
                  ৳1,000 notes: {horizonSummary.totalT2Notes1000.toLocaleString()} bills (৳{(horizonSummary.totalT2Notes1000 * 1000 / 1000000).toFixed(2)}M)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                  ৳500 notes: {horizonSummary.totalT2Notes500.toLocaleString()} bills (৳{(horizonSummary.totalT2Notes500 * 500 / 1000000).toFixed(2)}M)
                </span>
              </div>
            </div>

            {horizonSummary.countT2Critical > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDaysFilter('lt2');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Filter {horizonSummary.countT2Critical} At-Risk in 48h (&lt;2 Days)
              </button>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Fleet Terminals
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search terminal ID, city or branch..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
              />
            </div>
          </div>

          {/* Region Filter */}
          <div className="w-[160px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sector Corridor
            </label>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Corridors ({availableRegions.length})</option>
              {availableRegions.map((code) => {
                const info = CORRIDORS[code];
                const displayName = info ? info.shortName : code;
                return (
                  <option key={code} value={code}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-[130px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status Flag
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Refill Now">Refill Now (&le;20%)</option>
              <option value="Refill Soon">Refill Soon (&le;40%)</option>
              <option value="OK">OK (&gt;40%)</option>
            </select>
          </div>

          {/* Days Filter */}
          <div className="w-[130px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Runway (Days)
            </label>
            <select
              value={daysFilter}
              onChange={(e) => {
                setDaysFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Any Runway</option>
              <option value="lt1">&lt; 1 Day (Urgent)</option>
              <option value="lt2">&lt; 2 Days</option>
              <option value="lt3">&lt; 3 Days</option>
              <option value="gte3">&ge; 3 Days (Safe)</option>
            </select>
          </div>

          {/* Density Toggle & Reset */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              className="py-1.5 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title={isCompact ? 'Switch to Standard Spacing' : 'Switch to Compact Spacing'}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCompact ? 'Standard' : 'Compact'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Counter badge & Batch Controls */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-mono">{sortedAtms.length}</strong> of{' '}
              <strong className="text-slate-900 font-mono">{atms.length}</strong> ATMs
            </span>
            {checkedIds.length > 0 && (
              <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-blue-600" />
                {checkedIds.length} Selected for Batch Refill
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAllCurrentPage}
              className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <CheckSquare className="w-3 h-3" />
              <span>{isAllPaginatedChecked ? 'Deselect Page' : 'Select All on Page'}</span>
            </button>
            <span className="text-slate-300">·</span>
            <div className="text-[11px] text-slate-400">
              Click rows to inspect · Use checkboxes for bulk logistics actions
            </div>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#0f172a] text-slate-200 sticky top-0 z-10 shadow-xs select-none border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllPaginatedChecked}
                  onChange={handleToggleSelectAllCurrentPage}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Select all on current page"
                />
              </th>
              <th
                onClick={() => handleSort('ATMID')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Terminal ID
                  {sortKey === 'ATMID' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Location')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Location & Corridor
                  {sortKey === 'Location' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('ATM_Capacity')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Capacity
                  {sortKey === 'ATM_Capacity' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Estimated_Cash_Remaining')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Cash Remaining
                  {sortKey === 'Estimated_Cash_Remaining' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Cash_Remaining_Pct')}
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-slate-800 transition-colors min-w-[110px]"
              >
                <div className="flex items-center justify-center gap-1">
                  Fill Reservoir
                  {sortKey === 'Cash_Remaining_Pct' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Days_of_Cash')}
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  Days Left
                  {sortKey === 'Days_of_Cash' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Predicted_Demand')}
                className={`py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors ${
                  forecastHorizon === 't1' ? 'bg-blue-900/60 text-blue-200' : forecastHorizon === 't2' ? 'bg-slate-800 text-slate-200' : ''
                }`}
              >
                <div className="flex items-center justify-end gap-1">
                  {forecastHorizon === 't1' ? (
                    <span className="flex items-center gap-1 text-blue-200 font-bold">
                      <Zap className="w-3 h-3 text-blue-400" /> T+1 Demand
                    </span>
                  ) : forecastHorizon === 't2' ? (
                    <span className="flex items-center gap-1 text-slate-200 font-bold">
                      <Clock className="w-3 h-3 text-slate-400" /> T+2 Demand (48h)
                    </span>
                  ) : (
                    <span>Pred. Demand</span>
                  )}
                  {sortKey === 'Predicted_Demand' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Refill_Suggestion_Amount')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Refill Sugg.
                  {sortKey === 'Refill_Suggestion_Amount' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Status')}
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  {sortKey === 'Status' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAtms.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  No ATMs match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedAtms.map((r) => {
                const isSelected = selectedId === r.ATMID;
                const isChecked = checkedIds.includes(r.ATMID);
                const days = Number(r.Days_of_Cash) || 0;
                const region = getAtmRegion(r.ATMID);
                const isInManifest = manifestIds.includes(r.ATMID);

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OK
                  </span>
                );
                let rowBg = isSelected ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50/80';

                if (isChecked) {
                  rowBg = 'bg-blue-50/50 hover:bg-blue-50/70';
                }

                let barColor = 'bg-emerald-600';
                if (r.Status === 'Refill Now') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/90">
                      <AlertOctagon className="w-3 h-3 text-rose-600" /> Refill Now
                    </span>
                  );
                  barColor = 'bg-rose-500';
                  if (!isSelected && !isChecked) rowBg = 'bg-rose-50/20 hover:bg-rose-50/40';
                } else if (r.Status === 'Refill Soon') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/90">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Refill Soon
                    </span>
                  );
                  barColor = 'bg-amber-500';
                  if (!isSelected && !isChecked) rowBg = 'bg-amber-50/15 hover:bg-amber-50/35';
                }

                let daysColor = 'text-emerald-700 font-semibold';
                if (days < 1) daysColor = 'text-rose-600 font-extrabold';
                else if (days < 2) daysColor = 'text-amber-700 font-bold';

                const cellPadding = isCompact ? 'py-1.5 px-3' : 'py-2.5 px-3';

                return (
                  <tr
                    key={r.ATMID}
                    className={`transition-colors group ${rowBg} ${
                      isSelected ? 'ring-1 ring-inset ring-blue-500/50' : ''
                    }`}
                  >
                    <td className={`${cellPadding} text-center`} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleCheck(r.ATMID)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} font-mono font-bold text-slate-900 cursor-pointer`}
                    >
                      <span className="hover:underline">{r.ATMID}</span>
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-slate-600 max-w-[200px] truncate cursor-pointer`}
                      title={r.Location}
                    >
                      <div className="truncate font-medium text-slate-800">
                        {r.Location.replace('(location not in dataset)', '').trim() ||
                          'Central Regional Hub'}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {region.code} · {region.name}
                      </span>
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono text-slate-700 cursor-pointer`}
                    >
                      ৳{Math.round(r.ATM_Capacity).toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono font-semibold text-slate-900 cursor-pointer`}
                    >
                      ৳{Math.round(r.Estimated_Cash_Remaining).toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-center font-mono cursor-pointer`}
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(100, r.Cash_Remaining_Pct)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 w-9 text-right">
                          {r.Cash_Remaining_Pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-center font-mono cursor-pointer ${daysColor}`}
                    >
                      {days.toFixed(1)}d
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono cursor-pointer`}
                    >
                      {forecastHorizon === 't1' ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-blue-700 text-xs">
                              ৳{Math.round(horizonMap[r.ATMID]?.t1Demand || r.Predicted_Demand).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans font-medium">T+1</span>
                          </div>

                          {/* 1000 and 500 Tk Note Mix */}
                          {horizonMap[r.ATMID]?.t1Notes && (
                            <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                              <span
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/90 font-medium"
                                title={`৳1,000 Notes: ${horizonMap[r.ATMID].t1Notes.notes1000Count} bills = ৳${horizonMap[r.ATMID].t1Notes.notes1000Value.toLocaleString()} (${horizonMap[r.ATMID].t1Notes.notes1000Straps} straps)`}
                              >
                                {horizonMap[r.ATMID].t1Notes.notes1000Count} × ৳1k
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-950 border border-emerald-200/70 font-medium"
                                title={`৳500 Notes: ${horizonMap[r.ATMID].t1Notes.notes500Count} bills = ৳${horizonMap[r.ATMID].t1Notes.notes500Value.toLocaleString()} (${horizonMap[r.ATMID].t1Notes.notes500Straps} straps)`}
                              >
                                {horizonMap[r.ATMID].t1Notes.notes500Count} × ৳500
                              </span>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 font-sans flex items-center justify-end gap-1">
                            <span>Close: ৳{((horizonMap[r.ATMID]?.t1ClosingCash || 0) / 1000).toFixed(0)}k</span>
                            {horizonMap[r.ATMID]?.t1Status === 'Refill Now' && (
                              <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded">
                                Empty Tomorrow
                              </span>
                            )}
                          </div>
                        </div>
                      ) : forecastHorizon === 't2' ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              ৳{Math.round(horizonMap[r.ATMID]?.t2Demand || r.Predicted_Demand * 2).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans font-medium">48h</span>
                          </div>

                          {/* 1000 and 500 Tk Note Mix */}
                          {horizonMap[r.ATMID]?.t2Notes && (
                            <div className="flex items-center justify-end gap-1 font-mono text-[10px]">
                              <span
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/90 font-medium"
                                title={`৳1,000 Notes: ${horizonMap[r.ATMID].t2Notes.notes1000Count} bills = ৳${horizonMap[r.ATMID].t2Notes.notes1000Value.toLocaleString()} (${horizonMap[r.ATMID].t2Notes.notes1000Straps} straps)`}
                              >
                                {horizonMap[r.ATMID].t2Notes.notes1000Count} × ৳1k
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-950 border border-emerald-200/70 font-medium"
                                title={`৳500 Notes: ${horizonMap[r.ATMID].t2Notes.notes500Count} bills = ৳${horizonMap[r.ATMID].t2Notes.notes500Value.toLocaleString()} (${horizonMap[r.ATMID].t2Notes.notes500Straps} straps)`}
                              >
                                {horizonMap[r.ATMID].t2Notes.notes500Count} × ৳500
                              </span>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 font-sans flex items-center justify-end gap-1">
                            <span>Close: ৳{((horizonMap[r.ATMID]?.t2ClosingCash || 0) / 1000).toFixed(0)}k</span>
                            {horizonMap[r.ATMID]?.t2Status === 'Refill Now' && (
                              <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1 rounded">
                                &lt;48h Stockout
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-blue-700 font-medium">
                          ৳{Math.round(r.Predicted_Demand).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono font-bold text-emerald-800 cursor-pointer`}
                    >
                      ৳{Math.round(r.Refill_Suggestion_Amount).toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-center cursor-pointer`}
                    >
                      {statusBadge}
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {onQuickAddToManifest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAddToManifest(r);
                            }}
                            disabled={isInManifest}
                            className={`p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              isInManifest
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                            }`}
                            title={isInManifest ? 'In Route' : 'Add to CIT Route'}
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onQuickSimulateRefill && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickSimulateRefill(r.ATMID);
                            }}
                            className="p-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition-colors cursor-pointer"
                            title="Simulate Instant Refill"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={300}>All (256)</option>
          </select>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            let pageNum = idx + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + idx;
              if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
