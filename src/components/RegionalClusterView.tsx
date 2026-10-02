import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy, RegionalCluster } from '../types/operations';
import { groupAtmsByRegion, getAtmRegion } from '../utils/cashCalculations';
import {
  MapPin,
  Building2,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  Truck,
  ArrowRight,
  Search,
  Layers,
  Network,
  Share2,
  Compass,
  Navigation
} from 'lucide-react';

interface RegionalClusterViewProps {
  atms: ATMRecord[];
  policy: OperationalPolicy;
  onSelectAtm: (atmId: string) => void;
  onSelectRegionFilter?: (regionCode: string) => void;
}

// Well-spaced spatial coordinates for the 12 inter-district CIT corridors across Bangladesh
const TOPOLOGY_COORDS: Record<
  string,
  { x: number; y: number; labelYOffset?: number; nameOffset?: number }
> = {
  // North-West
  RAJ_BOGRA: { x: 140, y: 125, labelYOffset: 46 },
  // North-Central
  MYM_TANGAIL: { x: 420, y: 85, labelYOffset: 46 },
  // North-East
  SYL_VALLEY: { x: 790, y: 100, labelYOffset: 46 },
  // Greater Dhaka Metros (cleanly separated)
  DHA_NORTH: { x: 380, y: 200, labelYOffset: 46 },
  DHA_DIPLO: { x: 550, y: 195, labelYOffset: 46 },
  DHA_WEST: { x: 280, y: 290, labelYOffset: 46 },
  DHA_CORE: { x: 470, y: 300, labelYOffset: 46 },
  // Eastern Transit Hub
  COM_FENI: { x: 680, y: 290, labelYOffset: 46 },
  // South-East Maritime
  CTG_PORT: { x: 810, y: 400, labelYOffset: 46 },
  // Coastal Strip
  COX_COAST: { x: 890, y: 495, labelYOffset: 46 },
  // South-West Industrial
  KHU_JESSORE: { x: 150, y: 375, labelYOffset: 46 },
  // Southern Riverine
  BAR_PADMA: { x: 340, y: 445, labelYOffset: 46 },
};

export const RegionalClusterView: React.FC<RegionalClusterViewProps> = ({
  atms,
  policy,
  onSelectAtm,
  onSelectRegionFilter,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<string>('DHA_CORE');
  const [regionSearch, setRegionSearch] = useState<string>('');
  const [mapView, setMapView] = useState<'topology' | 'cards'>('topology');

  const clusters = useMemo(() => {
    return groupAtmsByRegion(atms, policy);
  }, [atms, policy]);

  const filteredClusters = useMemo(() => {
    if (!regionSearch.trim()) return clusters;
    const q = regionSearch.toLowerCase();
    return clusters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.codePrefix.toLowerCase().includes(q) ||
        (c.shortName && c.shortName.toLowerCase().includes(q))
    );
  }, [clusters, regionSearch]);

  const activeCluster = useMemo(() => {
    return (
      clusters.find((c) => c.id === selectedClusterId) ||
      clusters[0] || {
        id: 'DHA_CORE',
        name: 'Dhaka Central & Motijheel Banking Core',
        shortName: 'Dhaka Core',
        codePrefix: 'DHA_CORE',
        atmCount: 0,
        totalCapacity: 0,
        totalRemainingCash: 0,
        utilizationPct: 0,
        criticalCount: 0,
        urgentCount: 0,
        totalRefillNeeded: 0,
      }
    );
  }, [clusters, selectedClusterId]);

  const clusterAtms = useMemo(() => {
    return atms.filter((a) => getAtmRegion(a.ATMID).code === activeCluster.codePrefix);
  }, [atms, activeCluster]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c131f] via-[#152338] to-[#0c131f] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <Compass className="w-3.5 h-3.5" /> Regional Geographic Intelligence & Route Corridors
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Inter-District CIT Route Topology & Cash Density Network
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              256 terminals partitioned across the 12 primary inter-district transit corridors and banking hubs.
              Monitor corridor vault reserves, track burn rates, and bundle nearby replenishments into shared armored runs.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMapView('topology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapView === 'topology'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Spatial Network Map</span>
            </button>
            <button
              onClick={() => setMapView('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                mapView === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sector Cards Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spatial Topology Network Map */}
      {mapView === 'topology' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Inter-District CIT Route Topology & Cash Density Network</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any regional corridor node to inspect machines, liquidity levels, and replenishment requirements.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span>
                <span>Refill Now (&ge;2 Critical)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Refill Soon (Warning)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span>Safe Buffer</span>
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-[#0c1424] rounded-xl p-3 select-none border border-slate-800">
            <svg
              viewBox="0 0 980 570"
              className="w-full h-auto max-h-[520px]"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            >
              <defs>
                <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background Lines for Tactical Ops Feel */}
              <g stroke="#1e293b" strokeWidth="0.8" opacity="0.6">
                {[100, 200, 300, 400, 500].map((y) => (
                  <line key={`h-${y}`} x1="30" y1={y} x2="950" y2={y} strokeDasharray="3 6" />
                ))}
                {[150, 300, 450, 600, 750, 900].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="30" x2={x} y2="540" strokeDasharray="3 6" />
                ))}
              </g>

              {/* Transit corridors / connecting armored highway lines */}
              <g stroke="#334155" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round">
                {/* N5: Dhaka North <-> Rajshahi / Bogra Hub */}
                <line x1={380} y1={200} x2={140} y2={125} />
                {/* N3: Dhaka North <-> Mymensingh / Tangail */}
                <line x1={380} y1={200} x2={420} y2={85} />
                {/* N2: Dhaka Diplo <-> Sylhet Tea Corridor */}
                <line x1={550} y1={195} x2={790} y2={100} />
                {/* Dhaka Metropolitan Arterial Ring */}
                <line x1={380} y1={200} x2={550} y2={195} stroke="#475569" strokeWidth="3" strokeDasharray="none" />
                <line x1={380} y1={200} x2={280} y2={290} stroke="#475569" strokeWidth="3" strokeDasharray="none" />
                <line x1={550} y1={195} x2={470} y2={300} stroke="#475569" strokeWidth="3" strokeDasharray="none" />
                <line x1={280} y1={290} x2={470} y2={300} stroke="#475569" strokeWidth="3" strokeDasharray="none" />
                {/* N1: Dhaka Core <-> Comilla / Feni */}
                <line x1={470} y1={300} x2={680} y2={290} stroke="#3b82f6" strokeWidth="3.5" strokeOpacity="0.8" strokeDasharray="none" />
                {/* N1: Comilla / Feni <-> Chittagong Port */}
                <line x1={680} y1={290} x2={810} y2={400} stroke="#3b82f6" strokeWidth="3.5" strokeOpacity="0.8" strokeDasharray="none" />
                {/* N1: Chittagong Port <-> Cox's Bazar Coastal */}
                <line x1={810} y1={400} x2={890} y2={495} stroke="#3b82f6" strokeWidth="2.5" strokeOpacity="0.8" strokeDasharray="none" />
                {/* N8 (Padma Bridge Expressway): Dhaka Core <-> Barisal Riverine */}
                <line x1={470} y1={300} x2={340} y2={445} stroke="#10b981" strokeWidth="3" strokeOpacity="0.8" strokeDasharray="none" />
                {/* N7: Barisal <-> Khulna / Jessore */}
                <line x1={340} y1={445} x2={150} y2={375} stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.8" strokeDasharray="none" />
                {/* Khulna / Jessore to Dhaka West */}
                <line x1={150} y1={375} x2={280} y2={290} />
                {/* Rajshahi to Khulna connection */}
                <line x1={140} y1={125} x2={150} y2={375} />
                {/* Comilla to Sylhet connection */}
                <line x1={680} y1={290} x2={790} y2={100} />
              </g>

              {/* Highway Route Tags */}
              <g fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="#64748b" textAnchor="middle">
                <rect x="560" y="278" width="46" height="14" rx="3" fill="#1e293b" stroke="#334155" />
                <text x="583" y="288" fill="#93c5fd" fontWeight="bold">N1 HWY</text>

                <rect x="390" y="375" width="56" height="14" rx="3" fill="#1e293b" stroke="#334155" />
                <text x="418" y="385" fill="#6ee7b7" fontWeight="bold">N8 PADMA</text>

                <rect x="660" y="145" width="46" height="14" rx="3" fill="#1e293b" stroke="#334155" />
                <text x="683" y="155" fill="#93c5fd" fontWeight="bold">N2 SYL</text>

                <rect x="230" y="155" width="46" height="14" rx="3" fill="#1e293b" stroke="#334155" />
                <text x="253" y="165" fill="#cbd5e1" fontWeight="bold">N5 NW</text>
              </g>

              {/* Cluster Nodes */}
              {clusters.map((c) => {
                const pos = TOPOLOGY_COORDS[c.codePrefix] || { x: 470, y: 300, labelYOffset: 46 };
                const isSelected = c.id === activeCluster.id;
                const nodeRadius = 28;

                // Color coding based on critical thresholds
                let nodeColor = '#2563eb'; // blue (safe)
                let strokeColor = '#3b82f6';
                if (c.criticalCount >= 2) {
                  nodeColor = '#dc2626'; // red (urgent attention)
                  strokeColor = '#f87171';
                } else if (c.urgentCount > 0 || c.criticalCount === 1) {
                  nodeColor = '#d97706'; // amber (warning)
                  strokeColor = '#fbbf24';
                }

                return (
                  <g
                    key={c.id}
                    onClick={() => setSelectedClusterId(c.id)}
                    className="cursor-pointer transition-all hover:opacity-100 group"
                    style={{ opacity: isSelected ? 1 : 0.9 }}
                  >
                    {/* Selected pulse halo ring */}
                    {isSelected && (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeRadius + 12}
                          fill="none"
                          stroke="#60a5fa"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="animate-spin"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeRadius + 6}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                      </>
                    )}

                    {/* Ambient Glow */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeRadius}
                      fill={nodeColor}
                      opacity={isSelected ? 0.35 : 0.15}
                      filter="url(#nodeGlow)"
                    />

                    {/* Node Core Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeRadius}
                      fill={nodeColor}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-105"
                    />

                    {/* ATM count inside circle */}
                    <text
                      x={pos.x}
                      y={pos.y - 1}
                      textAnchor="middle"
                      fontSize="14"
                      fontFamily="IBM Plex Mono, monospace"
                      fill="#ffffff"
                      fontWeight="900"
                    >
                      {c.atmCount}
                    </text>

                    {/* "ATMs" sub-label inside circle */}
                    <text
                      x={pos.x}
                      y={pos.y + 11}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fill="rgba(255,255,255,0.85)"
                      fontWeight="bold"
                    >
                      ATMs
                    </text>

                    {/* Corridor Name Badge below circle */}
                    <g transform={`translate(${pos.x}, ${pos.y + (pos.labelYOffset || 46)})`}>
                      <rect
                        x="-70"
                        y="-12"
                        width="140"
                        height="24"
                        rx="12"
                        fill={isSelected ? '#1e293b' : '#0f172a'}
                        stroke={isSelected ? '#3b82f6' : '#334155'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="10"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        fill={isSelected ? '#93c5fd' : '#f1f5f9'}
                        fontWeight="bold"
                      >
                        {c.shortName || c.name}
                      </text>

                      {/* Cash Liquidity & Urgent Indicator */}
                      <text
                        x="0"
                        y="23"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill={c.criticalCount > 0 ? '#f87171' : c.urgentCount > 0 ? '#fbbf24' : '#94a3b8'}
                        fontWeight="600"
                      >
                        ${(c.totalRemainingCash / 1000000).toFixed(1)}M held •{' '}
                        {c.criticalCount > 0 ? `${c.criticalCount} Refill` : `${c.utilizationPct.toFixed(0)}% fill`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Top Regional Metrics & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Operational Corridors ({clusters.length} Active CIT Transit Sectors)
            </h3>
            <span className="text-xs text-slate-500">
              Aggregated across 256 network terminals · ISO-20022 Regional Partitioning
            </span>
          </div>
        </div>

        <div className="w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={regionSearch}
            onChange={(e) => setRegionSearch(e.target.value)}
            placeholder="Search corridor or region..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>
      </div>

      {/* Regional Sector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredClusters.map((c) => {
          const isSelected = c.id === activeCluster.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedClusterId(c.id)}
              className={`border rounded-xl p-3.5 transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-bold text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {c.shortName || c.codePrefix}
                </span>
                <div className="flex items-center gap-1.5">
                  {c.criticalCount > 0 && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                      <AlertOctagon className="w-3 h-3" /> {c.criticalCount} Critical
                    </span>
                  )}
                  {c.urgentCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> {c.urgentCount} Soon
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-xs truncate" title={c.name}>
                {c.name}
              </h4>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Fleet Count</span>
                  <span className="font-mono font-bold text-slate-800">{c.atmCount} ATMs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fill Level</span>
                  <span className="font-mono font-bold text-slate-800">
                    {c.utilizationPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Refill Pipeline:</span>
                <span className="font-mono font-bold text-emerald-800">
                  ${(c.totalRefillNeeded / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Region Detailed Machine Inspector */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                {activeCluster.shortName || activeCluster.codePrefix}
              </span>
              <h3 className="font-bold text-slate-900 text-base">{activeCluster.name}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {clusterAtms.length} ATMs deployed in this geographic cluster · Total Vault Liquidity:{' '}
              <strong className="font-mono text-slate-800">
                ${(activeCluster.totalRemainingCash / 1000000).toFixed(2)}M
              </strong>{' '}
              · Immediate Refill Capital Needed:{' '}
              <strong className="font-mono text-emerald-800">
                ${(activeCluster.totalRefillNeeded / 1000000).toFixed(2)}M
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSelectRegionFilter && (
              <button
                onClick={() => onSelectRegionFilter(activeCluster.codePrefix)}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Filter Fleet Operations Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Machine Cards within Cluster */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
          {clusterAtms.map((atm) => {
            const days = Number(atm.Days_of_Cash) || 0;
            return (
              <div
                key={atm.ATMID}
                onClick={() => onSelectAtm(atm.ATMID)}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">{atm.ATMID}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        atm.Status === 'Refill Now'
                          ? 'bg-red-100 text-red-700'
                          : atm.Status === 'Refill Soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {atm.Status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 truncate" title={atm.Location}>
                    {atm.Location.replace('(location not in dataset)', '').trim() ||
                      'Central Regional Hub'}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Cash Remaining</span>
                      <strong className="text-slate-800">
                        ${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Days of Cash</span>
                      <strong
                        className={
                          days < 1
                            ? 'text-red-600'
                            : days < 2
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }
                      >
                        {days.toFixed(1)} days
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[10px]">Refill Needed:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    ${Math.round(atm.Refill_Suggestion_Amount).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
