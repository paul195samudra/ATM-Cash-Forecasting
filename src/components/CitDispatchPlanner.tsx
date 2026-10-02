import React, { useState, useMemo, useEffect } from 'react';
import { ATMRecord } from '../data/atmData';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Download,
  DollarSign,
  MapPin,
  Calendar,
  Sparkles,
  Sliders,
  ShieldCheck,
  SendHorizontal,
  Play,
  Pause,
  RotateCcw,
  SkipForward
} from 'lucide-react';

interface CitDispatchPlannerProps {
  atms: ATMRecord[];
  manifestIds: string[];
  onToggleManifest: (atmId: string) => void;
  onClearManifest: () => void;
  onSelectAtm: (atmId: string) => void;
  onOpenFormalManifest?: () => void;
}

export const CitDispatchPlanner: React.FC<CitDispatchPlannerProps> = ({
  atms,
  manifestIds,
  onToggleManifest,
  onClearManifest,
  onSelectAtm,
  onOpenFormalManifest,
}) => {
  // Configurable constraints
  const [vehicleCapacity, setVehicleCapacity] = useState<number>(15000000); // $15M per armored truck
  const [maxStopsPerVehicle, setMaxStopsPerVehicle] = useState<number>(8);
  const [citCostPerStop, setCitCostPerStop] = useState<number>(350); // $350 per physical stop
  const [dispatched, setDispatched] = useState<boolean>(false);

  // Urgent candidate ATMs (Refill Now + Refill Soon)
  const candidateAtms = useMemo(() => {
    return atms
      .filter((a) => a.Status === 'Refill Now' || a.Status === 'Refill Soon')
      .sort((a, b) => {
        // Refill Now first
        if (a.Status === 'Refill Now' && b.Status !== 'Refill Now') return -1;
        if (b.Status === 'Refill Now' && a.Status !== 'Refill Now') return 1;
        // Then by days of cash ascending
        return (Number(a.Days_of_Cash) || 0) - (Number(b.Days_of_Cash) || 0);
      });
  }, [atms]);

  // Selected manifest ATMs
  const manifestAtms = useMemo(() => {
    return atms.filter((a) => manifestIds.includes(a.ATMID));
  }, [atms, manifestIds]);

  // Calculations
  const totalRefillCash = manifestAtms.reduce(
    (sum, a) => sum + (a.Refill_Suggestion_Amount || 0),
    0
  );

  const trucksNeeded = Math.max(
    manifestAtms.length > 0 ? 1 : 0,
    Math.max(
      Math.ceil(totalRefillCash / (vehicleCapacity || 1)),
      Math.ceil(manifestAtms.length / (maxStopsPerVehicle || 1))
    )
  );

  const totalCitExpense = manifestAtms.length * citCostPerStop + trucksNeeded * 600; // stop cost + truck fixed base
  const estimatedPotentialCashOutLoss = manifestAtms.reduce((sum, a) => {
    const days = Number(a.Days_of_Cash) || 0;
    if (days < 1) return sum + a.Predicted_Demand * 1.5;
    return sum + a.Predicted_Demand * 0.4;
  }, 0);

  const netSavings = Math.max(0, estimatedPotentialCashOutLoss - totalCitExpense);

  // Route Clusters
  const routes = useMemo(() => {
    if (manifestAtms.length === 0) return [];
    const clusters: { name: string; atms: ATMRecord[]; cash: number }[] = [];
    const chunkSize = Math.max(1, maxStopsPerVehicle);

    for (let i = 0; i < manifestAtms.length; i += chunkSize) {
      const slice = manifestAtms.slice(i, i + chunkSize);
      const cash = slice.reduce((acc, a) => acc + (a.Refill_Suggestion_Amount || 0), 0);
      clusters.push({
        name: `CIT Truck Unit ${String.fromCharCode(65 + Math.floor(i / chunkSize))}`,
        atms: slice,
        cash,
      });
    }
    return clusters;
  }, [manifestAtms, maxStopsPerVehicle]);

  // Interactive Dispatch Route Simulator
  const [simActiveRoute, setSimActiveRoute] = useState<number>(0);
  const [simCurrentStop, setSimCurrentStop] = useState<number>(0);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isSimRunning || routes.length === 0) return;
    const currentRoute = routes[simActiveRoute];
    if (!currentRoute) return;

    const timer = setInterval(() => {
      setSimCurrentStop((prev) => {
        if (prev >= currentRoute.atms.length) {
          setIsSimRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, [isSimRunning, simActiveRoute, routes]);

  const handleExportCSV = () => {
    if (manifestAtms.length === 0) return;
    const headers = [
      'ATMID',
      'Location',
      'Status',
      'Days_of_Cash',
      'Vault_Capacity',
      'Cash_Remaining',
      'Refill_Cash_Amount',
      'Assigned_Truck_Unit',
    ];

    let rowIdx = 0;
    const rows = routes.flatMap((r) =>
      r.atms.map((a) => {
        rowIdx++;
        return [
          a.ATMID,
          `"${a.Location.replace(/"/g, '""')}"`,
          a.Status,
          a.Days_of_Cash,
          a.ATM_Capacity,
          a.Estimated_Cash_Remaining,
          a.Refill_Suggestion_Amount,
          r.name,
        ].join(',');
      })
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CIT_Replenishment_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAllUrgent = () => {
    candidateAtms.forEach((a) => {
      if (!manifestIds.includes(a.ATMID)) {
        onToggleManifest(a.ATMID);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e3a5f] to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <Truck className="w-3.5 h-3.5" /> CIT Replenishment Operations & Dispatch
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Cash-in-Transit (CIT) Routing & Refill Manifest
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Synthesize machine-level demand forecasts into optimized armored delivery routes.
              Balances vault safety thresholds against CIT vehicle transit expenses and lost customer
              interchange revenue.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAllUrgent}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Select All 64 Urgent ATMs
            </button>
            <button
              onClick={onClearManifest}
              disabled={manifestAtms.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              Clear Route
            </button>
            {onOpenFormalManifest && (
              <button
                onClick={onOpenFormalManifest}
                disabled={manifestAtms.length === 0}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Official Carrier Order Form
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={manifestAtms.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CIT Manifest (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Constraints & Optimization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Constraint Controls */}
        <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-3 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Operational Constraints</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Truck Vault Limit ($)
                </label>
                <select
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                >
                  <option value={10000000}>$10,000,000 (Small Armored Van)</option>
                  <option value={15000000}>$15,000,000 (Standard CIT Truck)</option>
                  <option value={25000000}>$25,000,000 (Heavy High-Security Transporter)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Insurance cap per vehicle run
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Max Stops per Route
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={maxStopsPerVehicle}
                  onChange={(e) => setMaxStopsPerVehicle(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Limited by 8-hour shift delivery SLA
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  CIT Fee per ATM Stop ($)
                </label>
                <input
                  type="number"
                  min={100}
                  max={1000}
                  step={25}
                  value={citCostPerStop}
                  onChange={(e) => setCitCostPerStop(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Handling, vault replenishment & armed escort
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setDispatched(true);
                setTimeout(() => setDispatched(false), 3000);
              }}
              disabled={manifestAtms.length === 0}
              className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <SendHorizontal className="w-4 h-4" />
              {dispatched ? 'Dispatch Order Sent to CIT Team!' : 'Approve & Dispatch Manifest'}
            </button>
          </div>
        </div>

        {/* Financial & Logistic Calculations */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold uppercase">Scheduled Refills</div>
            <div className="text-2xl font-black text-slate-900 font-mono my-1">
              {manifestAtms.length}{' '}
              <span className="text-xs font-normal text-slate-500">ATMs</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {manifestAtms.filter((a) => a.Status === 'Refill Now').length} critical machines
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold uppercase">Total Cash to Load</div>
            <div className="text-2xl font-black text-emerald-700 font-mono my-1 truncate" title={`$${totalRefillCash.toLocaleString()}`}>
              ${(totalRefillCash / 1000000).toFixed(2)}M
            </div>
            <div className="text-[11px] text-slate-500">From bank vault reserves</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold uppercase">Armored Trucks</div>
            <div className="text-2xl font-black text-blue-700 font-mono my-1">
              {trucksNeeded}{' '}
              <span className="text-xs font-normal text-slate-500">vehicles</span>
            </div>
            <div className="text-[11px] text-slate-500">Auto-balanced by stops & cap</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold uppercase">Net Savings Value</div>
            <div className="text-2xl font-black text-indigo-700 font-mono my-1 truncate">
              ${(netSavings / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-slate-500">Cash-out downtime prevented</div>
          </div>

          {/* Route Manifest Card View */}
          <div className="col-span-2 sm:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Active Dispatch Routes & Stop Manifests ({routes.length} Trucks)
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {manifestAtms.length === 0
                  ? 'No ATMs selected yet — pick below or click Select All Urgent'
                  : 'Stops grouped according to capacity & travel cluster'}
              </span>
            </div>

            {/* Interactive Route Execution Simulator */}
            {routes.length > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                      <Truck className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="font-bold text-sm text-white flex items-center gap-2">
                        Armored Route Dispatch Simulation
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          Live Turn-by-Turn
                        </span>
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {routes[simActiveRoute]?.name} · Stop{' '}
                        {Math.min(simCurrentStop, routes[simActiveRoute]?.atms.length || 0)} of{' '}
                        {routes[simActiveRoute]?.atms.length || 0} Replenished
                      </span>
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={simActiveRoute}
                      onChange={(e) => {
                        setSimActiveRoute(Number(e.target.value));
                        setSimCurrentStop(0);
                        setIsSimRunning(false);
                      }}
                      className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono"
                    >
                      {routes.map((rt, idx) => (
                        <option key={idx} value={idx}>
                          {rt.name} (${(rt.cash / 1000000).toFixed(2)}M)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsSimRunning(!isSimRunning)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSimRunning
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      }`}
                    >
                      {isSimRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Run Simulation
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const len = routes[simActiveRoute]?.atms.length || 0;
                        setSimCurrentStop((p) => Math.min(len, p + 1));
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                      title="Step to next stop"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSimCurrentStop(0);
                        setIsSimRunning(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                      title="Reset route"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Simulation Stepper Sequence */}
                <div className="pt-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
                    {routes[simActiveRoute]?.atms.map((a, sIdx) => {
                      const isCompleted = sIdx < simCurrentStop;
                      const isCurrent = sIdx === simCurrentStop;
                      return (
                        <div
                          key={a.ATMID}
                          onClick={() => onSelectAtm(a.ATMID)}
                          className={`min-w-[130px] p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                              : isCurrent
                              ? 'bg-blue-900/60 border-blue-500 ring-2 ring-blue-500 text-white'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>Stop #{sIdx + 1}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : isCurrent ? (
                              <Truck className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                            ) : (
                              <span className="text-slate-500">Scheduled</span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-white text-xs mt-1">{a.ATMID}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{a.Location.split('(')[0]}</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
                            +${(a.Refill_Suggestion_Amount / 1000).toFixed(0)}k
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {routes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Select ATMs from the candidate table below to populate route manifests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {routes.map((rt, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 bg-slate-50/70 rounded-lg p-3.5 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <Truck className="w-3.5 h-3.5" /> {rt.name}
                        </span>
                        <span className="text-emerald-700 font-mono">
                          ${(rt.cash / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 mb-2">
                        {rt.atms.length} replenishment stops allocated
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {rt.atms.map((a, stopIdx) => (
                          <div
                            key={a.ATMID}
                            onClick={() => onSelectAtm(a.ATMID)}
                            className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center hover:border-blue-400 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                {stopIdx + 1}
                              </span>
                              <div>
                                <span className="font-mono font-bold text-slate-800">{a.ATMID}</span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                  {a.Location.replace('(location not in dataset)', '').trim() || 'Central Hub'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-emerald-700">
                                ${(a.Refill_Suggestion_Amount / 1000).toFixed(0)}k
                              </div>
                              <span className="text-[10px] text-slate-400">{a.Days_of_Cash}d left</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate ATMs Selection Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Refill Candidates ({candidateAtms.length} Requiring Action)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Check boxes to include in the CIT manifest or click anywhere on a row to inspect its time-series
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Selected: <strong className="text-slate-900">{manifestIds.length}</strong> of{' '}
            {candidateAtms.length} urgent machines
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#1e3a5f] text-white sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">Route</th>
                <th className="py-2.5 px-3 font-semibold">ATMID</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-center">Days of Cash</th>
                <th className="py-2.5 px-3 font-semibold text-right">Cash Remaining</th>
                <th className="py-2.5 px-3 font-semibold text-right">Pred. Demand</th>
                <th className="py-2.5 px-3 font-semibold text-right">Refill Sugg.</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidateAtms.map((a) => {
                const isChecked = manifestIds.includes(a.ATMID);
                const days = Number(a.Days_of_Cash) || 0;

                return (
                  <tr
                    key={a.ATMID}
                    className={`transition-colors hover:bg-slate-50 ${
                      isChecked ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleManifest(a.ATMID)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td
                      onClick={() => onSelectAtm(a.ATMID)}
                      className="py-2 px-3 font-mono font-bold text-slate-900 cursor-pointer hover:underline"
                    >
                      {a.ATMID}
                    </td>
                    <td
                      onClick={() => onSelectAtm(a.ATMID)}
                      className="py-2 px-3 text-slate-600 cursor-pointer max-w-[200px] truncate"
                      title={a.Location}
                    >
                      {a.Location.replace('(location not in dataset)', '').trim() ||
                        'Central Regional Hub'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {a.Status === 'Refill Now' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 animate-pulse">
                          <AlertOctagon className="w-3 h-3" /> Refill Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Refill Soon
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2 px-3 text-center font-mono font-bold ${
                        days < 1 ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {days.toFixed(1)}d
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      ${Math.round(a.Estimated_Cash_Remaining).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-blue-700 font-medium">
                      ${Math.round(a.Predicted_Demand).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                      ${Math.round(a.Refill_Suggestion_Amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onToggleManifest(a.ATMID)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        }`}
                      >
                        {isChecked ? 'Remove' : 'Add to Route'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
