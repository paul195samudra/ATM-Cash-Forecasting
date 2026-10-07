import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy, StressScenario } from '../types/operations';
import { runFleetStressTest } from '../utils/cashCalculations';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Banknote,
  Truck,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Plus
} from 'lucide-react';

interface StressTestEngineProps {
  atms: ATMRecord[];
  policy: OperationalPolicy;
  onAddAtmToManifest: (atm: ATMRecord) => void;
  manifestIds: string[];
}

export const StressTestEngine: React.FC<StressTestEngineProps> = ({
  atms,
  policy,
  onAddAtmToManifest,
  manifestIds,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('holiday_surge');
  const [customDemandMultiplier, setCustomDemandMultiplier] = useState<number>(1.35);
  const [customDelayDays, setCustomDelayDays] = useState<number>(1);

  const scenarios: StressScenario[] = [
    {
      id: 'holiday_surge',
      name: 'Extended Holiday / Festival Outflow Spike',
      description: 'Simulates a +35% surge in cash withdrawals due to 3-day holiday shopping and travel.',
      demandMultiplier: 1.35,
      carrierDelayDays: 0,
      affectedClusters: 'all',
    },
    {
      id: 'cit_blackout',
      name: '48-Hour Armored Carrier Transit Strike',
      description: 'Zero physical replenishment visits possible for 48 hours while consumer withdrawals continue.',
      demandMultiplier: 1.0,
      carrierDelayDays: 2,
      affectedClusters: 'all',
    },
    {
      id: 'payday_month_end',
      name: 'Bi-Monthly Salary & Month-End Confluence',
      description: 'Simulates a +45% withdrawal spike on commercial and residential machine corridors.',
      demandMultiplier: 1.45,
      carrierDelayDays: 1,
      affectedClusters: 'all',
    },
    {
      id: 'custom',
      name: 'Custom Treasury Stress Scenario',
      description: 'User-calibrated withdrawal surge multiplier and delivery blackout duration.',
      demandMultiplier: customDemandMultiplier,
      carrierDelayDays: customDelayDays,
      affectedClusters: 'all',
    },
  ];

  const activeScenario = useMemo(() => {
    return (
      scenarios.find((s) => s.id === selectedPreset) || {
        id: 'custom',
        name: 'Custom Treasury Stress Scenario',
        description: 'User-calibrated withdrawal surge multiplier and delivery blackout duration.',
        demandMultiplier: customDemandMultiplier,
        carrierDelayDays: customDelayDays,
        affectedClusters: 'all' as const,
      }
    );
  }, [selectedPreset, customDemandMultiplier, customDelayDays]);

  const testResult = useMemo(() => {
    return runFleetStressTest(atms, activeScenario, policy);
  }, [atms, activeScenario, policy]);

  const newAtRiskAtms = useMemo(() => {
    return testResult.stressedAtms.filter(
      (a) => a.stressedStatus === 'Refill Now' && a.Status !== 'Refill Now'
    );
  }, [testResult]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-2 border border-rose-500/30">
            <Flame className="w-3.5 h-3.5" /> Fleet Liquidity Resilience Simulator
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Network Stress Testing & Cash Shock Simulation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Test the 256-machine network against extreme operational disruptions, severe regional holidays,
            and armored carrier delivery delays to identify hidden vulnerabilities before they trigger cash-outs.
          </p>
        </div>
      </div>

      {/* Preset Selector & Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-sm text-slate-800">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Select Operational Stress Scenario</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedPreset(s.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedPreset === s.id
                  ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-500 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 mb-1">{s.name}</div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {s.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600 font-mono">
                <span>Demand: +{Math.round((s.demandMultiplier - 1) * 100)}%</span>
                <span>Delay: {s.carrierDelayDays}d</span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Controls */}
        {selectedPreset === 'custom' && (
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Fleet Demand Shock Multiplier (+{Math.round((customDemandMultiplier - 1) * 100)}%)
              </label>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.05}
                value={customDemandMultiplier}
                onChange={(e) => setCustomDemandMultiplier(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-0.5">
                <span>Normal (1.0x)</span>
                <span>+50% (1.5x)</span>
                <span>Double (2.0x)</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Carrier Delivery Delay ({customDelayDays} Days)
              </label>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={customDelayDays}
                onChange={(e) => setCustomDelayDays(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-0.5">
                <span>0 Days (On Schedule)</span>
                <span>2 Days (Minor Strike)</span>
                <span>4 Days (Severe Delay)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stress Impact Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Baseline Cash-Outs</span>
          <div className="text-2xl font-black text-slate-800 font-mono my-1">
            {testResult.baselineDryCount}{' '}
            <span className="text-xs font-normal text-slate-500">ATMs</span>
          </div>
          <span className="text-[11px] text-slate-500">Under standard forecast</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-300 shadow-xs bg-rose-50/20">
          <span className="text-[11px] uppercase font-bold text-rose-600">Stressed Cash-Outs</span>
          <div className="text-2xl font-black text-rose-600 font-mono my-1">
            {testResult.stressedDryCount}{' '}
            <span className="text-xs font-semibold text-rose-500">
              (+{testResult.deltaDryCount} newly at-risk)
            </span>
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Under shock conditions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Additional Capital Buffer</span>
          <div className="text-2xl font-black text-indigo-700 font-mono my-1">
            +৳{(testResult.additionalCashRequired / 1000000).toFixed(2)}M
          </div>
          <span className="text-[11px] text-slate-500">Vault liquidity to absorb shock</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400">Lost Interchange Revenue</span>
          <div className="text-2xl font-black text-amber-700 font-mono my-1">
            ৳{(testResult.potentialLostInterchange / 1000).toFixed(0)}k
          </div>
          <span className="text-[11px] text-slate-500">Fee margin loss if unrefilled</span>
        </div>
      </div>

      {/* Newly Vulnerable Escalation List */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Newly Vulnerable ATMs Requiring Pre-emptive Action ({newAtRiskAtms.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These machines are safe under normal baseline operations, but will deplete rapidly under the
              active shock scenario.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold">ATMID</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold text-right">Pre-Shock Cash</th>
                <th className="py-2.5 px-3 font-semibold text-right">Post-Shock Cash</th>
                <th className="py-2.5 px-3 font-semibold text-center">Stressed Days</th>
                <th className="py-2.5 px-3 font-semibold text-right">Emergency Refill</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newAtRiskAtms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No additional ATMs cross the critical threshold under this shock scenario.
                  </td>
                </tr>
              ) : (
                newAtRiskAtms.map((a) => {
                  const isInRoute = manifestIds.includes(a.ATMID);
                  return (
                    <tr key={a.ATMID} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{a.ATMID}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={a.Location}>
                        {a.Location.replace('(location not in dataset)', '').trim() || 'Central Regional Hub'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ৳{Math.round(a.Estimated_Cash_Remaining).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        ৳{Math.round(a.stressedCash).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600">
                        {a.stressedDays.toFixed(1)}d
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        ৳{Math.round(a.stressedRefillNeeded).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onAddAtmToManifest(a)}
                          disabled={isInRoute}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                            isInRoute
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          }`}
                        >
                          {isInRoute ? 'In Manifest' : 'Add to Emergency Route'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
