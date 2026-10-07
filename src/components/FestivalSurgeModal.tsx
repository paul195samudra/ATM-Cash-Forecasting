import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Truck,
  ArrowRight,
  TrendingUp,
  Flame,
  Layers,
  Building,
  RotateCcw,
  Zap,
  Clock,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { BANGLADESH_FESTIVALS } from '../data/festivalData';
import { FestivalSurgeState, FestivalEvent } from '../types/festival';
import { ATMRecord } from '../data/atmData';

interface FestivalSurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  festivalState: FestivalSurgeState;
  onUpdateFestivalState: (newState: FestivalSurgeState) => void;
  atms: ATMRecord[];
  onQueueAtRiskAtms: (atmIds: string[]) => void;
}

export const FestivalSurgeModal: React.FC<FestivalSurgeModalProps> = ({
  isOpen,
  onClose,
  festivalState,
  onUpdateFestivalState,
  atms,
  onQueueAtRiskAtms,
}) => {
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>(
    festivalState.selectedFestivalId || 'eid_ul_fitr'
  );

  const activeFestival =
    BANGLADESH_FESTIVALS.find((f) => f.id === selectedFestivalId) || BANGLADESH_FESTIVALS[0];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    festivalState.selectedPhaseId || activeFestival.phases[1]?.id || activeFestival.phases[0].id
  );

  const activePhase =
    activeFestival.phases.find((p) => p.id === selectedPhaseId) || activeFestival.phases[0];

  const [targetCorridors, setTargetCorridors] = useState<FestivalSurgeState['targetCorridors']>(
    festivalState.targetCorridors || 'all'
  );

  const [prioritize1000Notes, setPrioritize1000Notes] = useState<boolean>(
    festivalState.prioritize1000Notes ?? true
  );

  const [customMultiplier, setCustomMultiplier] = useState<number>(
    festivalState.customMultiplier || activePhase.demandMultiplier
  );

  if (!isOpen) return null;

  // Impact Calculations
  const baselineDailyDemand = atms.reduce((acc, a) => acc + (a.Predicted_Demand || 0), 0);
  const surgeDailyDemand = baselineDailyDemand * customMultiplier;
  const surgeDeltaDemand = surgeDailyDemand - baselineDailyDemand;

  // Estimate which ATMs would deplete under this surge multiplier
  const atRiskUnderSurge = atms.filter((a) => {
    const surgeDays = (a.Estimated_Cash_Remaining || 0) / (a.Predicted_Demand * customMultiplier || 1);
    return surgeDays < 1.0;
  });

  const handleActivateSurge = () => {
    onUpdateFestivalState({
      isActive: true,
      selectedFestivalId,
      selectedPhaseId,
      customMultiplier,
      targetCorridors,
      prioritize1000Notes,
    });
    onClose();
  };

  const handleDeactivateSurge = () => {
    onUpdateFestivalState({
      isActive: false,
      selectedFestivalId,
      selectedPhaseId,
      customMultiplier: 1.0,
      targetCorridors: 'all',
      prioritize1000Notes: false,
    });
    onClose();
  };

  const handleQueueAllSurgeAtRisk = () => {
    const ids = atRiskUnderSurge.map((a) => a.ATMID);
    onQueueAtRiskAtms(ids);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Eid & Festival Liquidity Surge Planner
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bangladesh Bank Calendar
                </span>
                {festivalState.isActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-400 text-slate-950 animate-pulse">
                    Surge Active (+{Math.round((festivalState.customMultiplier - 1) * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/80">
                Pre-load high-denomination cassettes and adjust cash burn curves ahead of statutory bank branch holidays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Festival Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select National Festival Liquidity Event:
              </span>
              <span className="text-[11px] text-emerald-700 font-bold font-mono">
                {activeFestival.bengaliName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {BANGLADESH_FESTIVALS.map((fest) => {
                const isSelected = fest.id === selectedFestivalId;
                return (
                  <button
                    key={fest.id}
                    type="button"
                    onClick={() => {
                      setSelectedFestivalId(fest.id);
                      setSelectedPhaseId(fest.phases[0].id);
                      setCustomMultiplier(fest.phases[0].demandMultiplier);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                        <span className="truncate">{fest.name.split('(')[0]}</span>
                        <span className="text-emerald-700 font-mono text-[10px]">
                          {fest.historicalPeakMultiplier}x
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium line-clamp-1">
                        {fest.season}
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                      <span>Closure:</span>
                      <strong className="text-slate-800 font-mono">{fest.branchClosureDurationDays} Days</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Festival Phase Timeline */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Operational Phase & Liquidity Ramp-Up Curve</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Primary Footfall: <strong className="text-slate-800">{activeFestival.primaryZone}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {activeFestival.phases.map((ph, idx) => {
                const isPhaseSelected = ph.id === selectedPhaseId;
                return (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(ph.id);
                      setCustomMultiplier(ph.demandMultiplier);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isPhaseSelected
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {ph.daysToFestival}
                        </span>
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {ph.demandMultiplier}x
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{ph.name}</div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{ph.description}</p>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                      <span className="block truncate font-semibold text-emerald-800">{ph.keyAction}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Multiplier Calibration & Live Impact Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Calibration Controls */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Demand Multiplier Override
              </span>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Surge Velocity Factor:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {customMultiplier.toFixed(2)}x (+{Math.round((customMultiplier - 1) * 100)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.05"
                  value={customMultiplier}
                  onChange={(e) => setCustomMultiplier(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                  <span>0.5x (Post-Eid)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.5x (Peak)</span>
                  <span>4.0x (Haat Blitz)</span>
                </div>
              </div>

              {/* Corridor filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Prioritized Geographic Corridor:
                </label>
                <select
                  value={targetCorridors}
                  onChange={(e) => setTargetCorridors(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium"
                >
                  <option value="all">All 256 Fleet Terminals Nationwide</option>
                  <option value="cattle_markets_transit">Cattle Haats & Inter-District Transit Hubs</option>
                  <option value="commercial_shopping">Shopping Mall & Garment Worker Hubs</option>
                  <option value="rural_hubs">Rural Home Migration Branches</option>
                </select>
              </div>

              {/* High Denom Option */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prioritize1000Notes}
                  onChange={(e) => setPrioritize1000Notes(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">
                    Enforce ৳1,000 High-Denomination Cassette Loading
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Shifts cassette fill ratio to 70%+ in ৳1,000 notes to maximize physical note volume
                  </span>
                </div>
              </label>
            </div>

            {/* Impact Metric Cards */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Baseline Daily Outflow</span>
                <div className="text-lg font-mono font-bold text-slate-800">
                  ৳{(baselineDailyDemand / 1000000).toFixed(2)}M
                </div>
                <div className="text-[10px] text-slate-500">Standard working day</div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-emerald-800 text-[10px] uppercase font-bold">Surge Daily Outflow</span>
                <div className="text-xl font-mono font-black text-emerald-800">
                  ৳{(surgeDailyDemand / 1000000).toFixed(2)}M
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  +৳{(surgeDeltaDemand / 1000000).toFixed(2)}M incremental
                </div>
              </div>

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="text-red-700 text-[10px] uppercase font-bold">Stockout Exposure</span>
                <div className="text-xl font-mono font-black text-red-600">
                  {atRiskUnderSurge.length} ATMs
                </div>
                <div className="text-[10px] text-red-700 font-semibold">Deplete within &lt; 24h</div>
              </div>

              {/* Recommended Cassette Denomination Mix for active phase */}
              <div className="sm:col-span-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Recommended Cassette Denomination Mix ({activePhase.name.split(':')[0]})
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-bold">
                    Target Total: 100%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-mono">
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-slate-500 text-[10px] font-sans">৳1,000 Note</div>
                    <div className="text-base font-black text-blue-700 mt-0.5">{activePhase.c1000Pct}%</div>
                    <div className="text-[9px] text-slate-400">High Capacity</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-slate-500 text-[10px] font-sans">৳500 Note</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">{activePhase.c500Pct}%</div>
                    <div className="text-[9px] text-slate-400">Standard Change</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-slate-500 text-[10px] font-sans">৳200 Note</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">{activePhase.c200Pct}%</div>
                    <div className="text-[9px] text-slate-400">Retail Small</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-slate-500 text-[10px] font-sans">৳100 Note</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">{activePhase.c100Pct}%</div>
                    <div className="text-[9px] text-slate-400">Dispense Min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {festivalState.isActive && (
              <button
                type="button"
                onClick={handleDeactivateSurge}
                className="px-3.5 py-2 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold transition-colors cursor-pointer"
              >
                Reset to Baseline (Deactivate Surge)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQueueAllSurgeAtRisk}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Queue {atRiskUnderSurge.length} At-Risk ATMs to Manifest</span>
            </button>

            <button
              type="button"
              onClick={handleActivateSurge}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Festival Surge ({customMultiplier.toFixed(2)}x)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
