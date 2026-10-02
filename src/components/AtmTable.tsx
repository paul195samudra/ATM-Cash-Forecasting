import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { getAtmRegion, CORRIDORS } from '../utils/cashCalculations';
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
  Minimize2
} from 'lucide-react';

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
}) => {
  const [pctFilter, setPctFilter] = useState('all');
  const [sortKey, setSortKey] = useState<keyof ATMRecord>('Days_of_Cash');
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompact, setIsCompact] = useState(false);

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
      const vA = a[sortKey];
      const vB = b[sortKey];

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
  }, [filteredAtms, sortKey, sortAsc]);

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
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70">
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
          <thead className="bg-[#121c2c] text-white sticky top-0 z-10 shadow-xs select-none">
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
                className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-[#1e2f47] transition-colors min-w-[110px]"
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
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-[#1e2f47] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Pred. Demand
                  {sortKey === 'Predicted_Demand' ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('Refill_Suggestion_Amount')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                className="py-2.5 px-3 font-semibold text-center cursor-pointer hover:bg-[#1e2f47] transition-colors"
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> OK
                  </span>
                );
                let rowBg = isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/90';

                if (isChecked) {
                  rowBg = 'bg-blue-50/60 hover:bg-blue-50/80';
                }

                let barColor = 'bg-emerald-500';
                if (r.Status === 'Refill Now') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                      <AlertOctagon className="w-3 h-3 text-red-600" /> Refill Now
                    </span>
                  );
                  barColor = 'bg-red-600';
                  if (!isSelected && !isChecked) rowBg = 'bg-red-50/40 hover:bg-red-50/70';
                } else if (r.Status === 'Refill Soon') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Refill Soon
                    </span>
                  );
                  barColor = 'bg-amber-500';
                  if (!isSelected && !isChecked) rowBg = 'bg-amber-50/30 hover:bg-amber-50/60';
                }

                let daysColor = 'text-emerald-700 font-semibold';
                if (days < 1) daysColor = 'text-red-600 font-extrabold';
                else if (days < 2) daysColor = 'text-amber-600 font-bold';

                const cellPadding = isCompact ? 'py-1.5 px-3' : 'py-2.5 px-3';

                return (
                  <tr
                    key={r.ATMID}
                    className={`transition-colors group ${rowBg} ${
                      isSelected ? 'ring-1 ring-inset ring-blue-500' : ''
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
                      className={`${cellPadding} font-mono font-bold text-slate-900 cursor-pointer hover:underline`}
                    >
                      {r.ATMID}
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
                      ${Math.round(r.ATM_Capacity).toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono font-semibold text-slate-900 cursor-pointer`}
                    >
                      ${Math.round(r.Estimated_Cash_Remaining).toLocaleString()}
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
                      className={`${cellPadding} text-right font-mono text-blue-700 font-medium cursor-pointer`}
                    >
                      ${Math.round(r.Predicted_Demand).toLocaleString()}
                    </td>
                    <td
                      onClick={() => onSelectAtm(r.ATMID)}
                      className={`${cellPadding} text-right font-mono font-bold text-emerald-800 cursor-pointer`}
                    >
                      ${Math.round(r.Refill_Suggestion_Amount).toLocaleString()}
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
