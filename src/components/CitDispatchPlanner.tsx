import React, { useState, useMemo, useEffect } from 'react';
import { ATMRecord } from '../data/atmData';
import { DEFAULT_CIT_CARRIERS, CitCarrierContract } from '../types/operations';
import { optimizeRouteTSP, OptimizedRouteResult } from '../utils/tspOptimizer';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Download,
  Banknote,
  MapPin,
  Calendar,
  Sparkles,
  Sliders,
  ShieldCheck,
  SendHorizontal,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Navigation,
  Clock,
  Compass,
  Building,
  Layers,
  Fuel
} from 'lucide-react';

interface CitDispatchPlannerProps {
  atms: ATMRecord[];
  manifestIds: string[];
  onToggleManifest: (atmId: string) => void;
  onClearManifest: () => void;
  onSelectAtm: (atmId: string) => void;
  onOpenFormalManifest?: () => void;
  onOpenFestivalModal?: () => void;
  isFestivalSurgeActive?: boolean;
  festivalMultiplier?: number;
}

export const CitDispatchPlanner: React.FC<CitDispatchPlannerProps> = ({
  atms,
  manifestIds,
  onToggleManifest,
  onClearManifest,
  onSelectAtm,
  onOpenFormalManifest,
  onOpenFestivalModal,
  isFestivalSurgeActive = false,
  festivalMultiplier = 1.0,
}) => {
  // Carrier Selection
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('brinks');
  const activeCarrier =
    DEFAULT_CIT_CARRIERS.find((c) => c.id === selectedCarrierId) || DEFAULT_CIT_CARRIERS[0];

  // Configurable constraints
  const [vehicleCapacity, setVehicleCapacity] = useState<number>(activeCarrier.maxPayload);
  const [maxStopsPerVehicle, setMaxStopsPerVehicle] = useState<number>(activeCarrier.maxStops);
  const [citCostPerStop, setCitCostPerStop] = useState<number>(activeCarrier.costPerStop);
  const [dispatched, setDispatched] = useState<boolean>(false);
  const [isTspOptimized, setIsTspOptimized] = useState<boolean>(true);

  // Sync carrier defaults
  useEffect(() => {
    setVehicleCapacity(activeCarrier.maxPayload);
    setMaxStopsPerVehicle(activeCarrier.maxStops);
    setCitCostPerStop(activeCarrier.costPerStop);
  }, [activeCarrier]);

  // Urgent candidate ATMs (Refill Now + Refill Soon)
  const candidateAtms = useMemo(() => {
    return atms
      .filter((a) => a.Status === 'Refill Now' || a.Status === 'Refill Soon')
      .sort((a, b) => {
        if (a.Status === 'Refill Now' && b.Status !== 'Refill Now') return -1;
        if (b.Status === 'Refill Now' && a.Status !== 'Refill Now') return 1;
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

  const totalCitExpense =
    manifestAtms.length * citCostPerStop + trucksNeeded * activeCarrier.baseTruckRate;
  const estimatedPotentialCashOutLoss = manifestAtms.reduce((sum, a) => {
    const days = Number(a.Days_of_Cash) || 0;
    if (days < 1) return sum + a.Predicted_Demand * 1.5;
    return sum + a.Predicted_Demand * 0.4;
  }, 0);

  const netSavings = Math.max(0, estimatedPotentialCashOutLoss - totalCitExpense);

  // TSP-Optimized Route Clusters
  const optimizedRoutes: OptimizedRouteResult[] = useMemo(() => {
    if (manifestAtms.length === 0) return [];
    const results: OptimizedRouteResult[] = [];
    const chunkSize = Math.max(1, maxStopsPerVehicle);

    for (let i = 0; i < manifestAtms.length; i += chunkSize) {
      const slice = manifestAtms.slice(i, i + chunkSize);
      const truckIdx = Math.floor(i / chunkSize);
      const tsp = optimizeRouteTSP(slice, truckIdx, 'DHA_CORE', '08:30');
      results.push(tsp);
    }
    return results;
  }, [manifestAtms, maxStopsPerVehicle]);

  // Total mileage and time savings from TSP
  const totalSavedKm = optimizedRoutes.reduce((acc, r) => acc + r.savedDistanceKm, 0);
  const totalSavedMins = optimizedRoutes.reduce((acc, r) => acc + r.savedDriveTimeMins, 0);

  // Interactive Route Simulator
  const [simActiveRoute, setSimActiveRoute] = useState<number>(0);
  const [simCurrentStop, setSimCurrentStop] = useState<number>(0);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isSimRunning || optimizedRoutes.length === 0) return;
    const currentRoute = optimizedRoutes[simActiveRoute];
    if (!currentRoute) return;

    const timer = setInterval(() => {
      setSimCurrentStop((prev) => {
        if (prev >= currentRoute.waypoints.length) {
          setIsSimRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, [isSimRunning, simActiveRoute, optimizedRoutes]);

  const handleExportCSV = () => {
    if (manifestAtms.length === 0) return;
    const headers = [
      'Stop_No',
      'ATMID',
      'Location',
      'ETA',
      'Status',
      'Days_of_Cash',
      'Distance_Km',
      'Drive_Time_Mins',
      'Refill_Cash_Amount',
      'Tamper_Seal_Number',
      'Carrier',
      'Assigned_Truck_Unit',
    ];

    const rows = optimizedRoutes.flatMap((r) =>
      r.waypoints.map((wp) => [
        wp.sequence,
        wp.atm.ATMID,
        `"${wp.atm.Location.replace(/"/g, '""')}"`,
        wp.eta,
        wp.atm.Status,
        wp.atm.Days_of_Cash,
        wp.distanceFromPrevKm,
        wp.driveTimeMins,
        wp.atm.Refill_Suggestion_Amount,
        wp.sealNumber,
        activeCarrier.name,
        r.truckName,
      ].join(','))
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CIT_Optimized_Manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
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
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-xs border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold mb-2 border border-slate-700">
              <Truck className="w-3.5 h-3.5 text-blue-400" /> CIT Replenishment Operations & Dispatch
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Cash-in-Transit (CIT) Routing & Multi-Carrier Dispatch Planner
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Synthesize machine-level demand forecasts into automated TSP-optimized armored delivery
              routes. Compare contracted carriers, balance payload capacities, and sequence waypoints to
              minimize courier driving hours.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAllUrgent}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Select All Urgent ATMs
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
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg border border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" /> Official Carrier Order Form
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={manifestAtms.length === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Manifest
            </button>
          </div>
        </div>
      </div>

      {/* Festival Surge Operational Banner */}
      {isFestivalSurgeActive && (
        <div className="p-4 rounded-xl border bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-900 border-emerald-500/50 text-emerald-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                  Eid & Festival Surge Active
                </h4>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950">
                  {festivalMultiplier.toFixed(2)}x Velocity
                </span>
              </div>
              <p className="text-[11px] mt-0.5 text-emerald-100/80">
                Prioritize ৳1,000 / ৳500 notes & dispatch early before holiday bank branch shutdown.
              </p>
            </div>
          </div>

          {onOpenFestivalModal && (
            <button
              onClick={onOpenFestivalModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs"
            >
              Adjust Surge
            </button>
          )}
        </div>
      )}

      {/* Multi-Carrier Contract Comparison Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Contracted Armored Courier Vendors & Tariff Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select contracted CIT carrier to evaluate service level agreements, armed escort tiers, and dispatch pricing.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Active: <strong className="text-slate-900">{activeCarrier.name}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEFAULT_CIT_CARRIERS.map((c) => {
            const isSelected = c.id === selectedCarrierId;
            const carrierQuote =
              manifestAtms.length * c.costPerStop + trucksNeeded * c.baseTruckRate;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCarrierId(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {c.slaAvailabilityPct}% SLA
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs truncate">{c.name}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.armedGuardLevel}</div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Stop Fee</span>
                      <strong>৳{c.costPerStop.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Base Truck</span>
                      <strong>৳{c.baseTruckRate.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[10px]">Estimated Quote:</span>
                  <strong className="font-mono text-blue-700 font-bold">
                    ৳{carrierQuote.toLocaleString()}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Calculated Routes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Operational Constraints */}
        <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-slate-200 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Dispatch Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Truck Vault Limit (BDT ৳)
              </label>
              <input
                type="number"
                step={1000000}
                value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Insurance ceiling per vehicle run
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
                Limited by 8-hour courier shift SLA
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                CIT Fee per ATM Stop (BDT ৳)
              </label>
              <input
                type="number"
                min={500}
                max={10000}
                step={100}
                value={citCostPerStop}
                onChange={(e) => setCitCostPerStop(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Contract handling & armored escort fee
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setIsTspOptimized(!isTspOptimized)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isTspOptimized
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isTspOptimized ? 'TSP Route Optimization ON' : 'Enable TSP Sequencing'}</span>
            </button>

            <button
              onClick={() => {
                setDispatched(true);
                setTimeout(() => setDispatched(false), 3000);
              }}
              disabled={manifestAtms.length === 0}
              className="w-full py-2.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
            >
              {dispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Fleet Dispatched Successfully!</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  <span>Dispatch CIT Armored Vehicles</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Financial Metrics & Route Waypoint Views */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div className="text-2xl font-black text-emerald-700 font-mono my-1 truncate">
                ৳{(totalRefillCash / 1000000).toFixed(2)}M
              </div>
              <div className="text-[11px] text-slate-500">From bank central vault</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-slate-400 text-xs font-semibold uppercase">Armored Trucks</div>
              <div className="text-2xl font-black text-blue-700 font-mono my-1">
                {trucksNeeded}{' '}
                <span className="text-xs font-normal text-slate-500">vehicles</span>
              </div>
              <div className="text-[11px] text-slate-500">{activeCarrier.name}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-slate-400 text-xs font-semibold uppercase">TSP Efficiency Saved</div>
              <div className="text-2xl font-black text-emerald-700 font-mono my-1 truncate">
                -{totalSavedKm} km
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                Saved ~{totalSavedMins} mins road time
              </div>
            </div>
          </div>

          {/* TSP Waypoint Optimization Route Cards */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  TSP-Optimized Armored Waypoint Sequences ({optimizedRoutes.length} Trucks)
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 text-blue-600 fill-current" />
                  <span>{isSimulatorOpen ? 'Hide Route Simulator' : 'Test Route Playback'}</span>
                </button>
              </div>
            </div>

            {/* Route Stepper Simulator Drawer */}
            {isSimulatorOpen && optimizedRoutes.length > 0 && (
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">Route Execution Simulator</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Truck Unit {String.fromCharCode(65 + simActiveRoute)} · Stop #{simCurrentStop} of{' '}
                      {optimizedRoutes[simActiveRoute]?.waypoints.length || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={simActiveRoute}
                      onChange={(e) => {
                        setSimActiveRoute(Number(e.target.value));
                        setSimCurrentStop(0);
                      }}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs"
                    >
                      {optimizedRoutes.map((rt, idx) => (
                        <option key={idx} value={idx}>
                          {rt.truckName} ({rt.waypoints.length} stops)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsSimRunning(!isSimRunning)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                        isSimRunning ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isSimRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{isSimRunning ? 'Pause' : 'Start Run'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSimCurrentStop(0);
                        setIsSimRunning(false);
                      }}
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                      title="Reset Run"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Waypoint Steps */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
                  {optimizedRoutes[simActiveRoute]?.waypoints.map((wp, sIdx) => {
                    const isCompleted = sIdx < simCurrentStop;
                    const isCurrent = sIdx === simCurrentStop;

                    return (
                      <div
                        key={wp.atm.ATMID}
                        onClick={() => onSelectAtm(wp.atm.ATMID)}
                        className={`min-w-[150px] p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                            : isCurrent
                            ? 'bg-blue-900/60 border-blue-500 ring-2 ring-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>Stop #{wp.sequence} ({wp.eta})</span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isCurrent ? (
                            <Truck className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                          ) : (
                            <span className="text-slate-500">+{wp.driveTimeMins}m</span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-white text-xs mt-1">{wp.atm.ATMID}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {wp.atm.Location.split('(')[0]}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold">
                          +৳{(wp.atm.Refill_Suggestion_Amount / 1000).toFixed(0)}k
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Route Cards */}
            {optimizedRoutes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select ATMs from the candidate table below to populate automated delivery routes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {optimizedRoutes.map((rt, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 bg-slate-50/70 rounded-xl p-4 text-xs flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <Truck className="w-4 h-4" /> {rt.truckName}
                        </span>
                        <span className="text-emerald-700 font-mono text-sm">
                          ৳{(rt.totalRefillCash / 1000000).toFixed(2)}M
                        </span>
                      </div>

                      {/* Route metrics badge */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-2 mb-3 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="font-mono font-bold text-slate-800">
                          {rt.waypoints.length} Stops
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-800">{rt.totalDistanceKm} km</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-800">~{rt.totalDriveTimeMins} mins road</span>
                        {rt.savedDistanceKm > 0 && (
                          <span className="ml-auto text-emerald-700 font-bold">
                            Saved {rt.savedDistanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Stop Sequence List */}
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {rt.waypoints.map((wp) => (
                          <div
                            key={wp.atm.ATMID}
                            onClick={() => onSelectAtm(wp.atm.ATMID)}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center hover:border-blue-400 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                                {wp.sequence}
                              </span>
                              <div>
                                <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{wp.atm.ATMID}</span>
                                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                                    ETA {wp.eta}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                  {wp.atm.Location.split('(')[0]}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-800 block text-xs">
                                +৳{Math.round(wp.atm.Refill_Suggestion_Amount / 1000)}k
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {wp.distanceFromPrevKm} km (+{wp.driveTimeMins}m)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Depot: Dhaka Central Vault</span>
                      <span className="font-bold text-slate-700 font-mono">08:30 AM Departure</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate ATM Selection Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Critical & Urgent Candidate Terminals ({candidateAtms.length} Eligible)
            </h3>
            <p className="text-xs text-slate-500">
              Select or remove individual terminals to include them into the dynamic delivery run.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-2.5 text-center w-12">Manifest</th>
                <th className="p-2.5">ATMID</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Cash Runway</th>
                <th className="p-2.5 text-right">Remaining</th>
                <th className="p-2.5 text-right">Recommended Refill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {candidateAtms.slice(0, 30).map((atm) => {
                const isSelected = manifestIds.includes(atm.ATMID);
                return (
                  <tr
                    key={atm.ATMID}
                    className={`hover:bg-slate-50 ${isSelected ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleManifest(atm.ATMID)}
                        className="rounded accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 font-mono">
                      <span>{atm.ATMID}</span>
                    </td>
                    <td className="p-2.5 font-sans text-slate-600 truncate max-w-[220px]">
                      {atm.Location.split('(')[0]}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          atm.Status === 'Refill Now'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {atm.Status}
                      </span>
                    </td>
                    <td
                      className={`p-2.5 text-right font-bold ${
                        Number(atm.Days_of_Cash) < 1 ? 'text-red-600' : 'text-amber-600'
                      }`}
                    >
                      {Number(atm.Days_of_Cash).toFixed(1)} days
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800">
                      ৳{Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-800">
                      ৳{Math.round(atm.Refill_Suggestion_Amount).toLocaleString()}
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
