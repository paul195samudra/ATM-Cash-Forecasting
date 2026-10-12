import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RegionalCluster } from '../types/operations';
import { ATMRecord } from '../data/atmData';
import { CORRIDOR_GEO_COORDS, getAtmGeoCoordinates, formatCoordinates } from '../utils/geoCoordinates';
import { getAtmRegion } from '../utils/cashCalculations';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  ShieldCheck,
  Zap,
  LocateFixed,
  Eye,
  Filter
} from 'lucide-react';

interface RegionalGeoMapProps {
  clusters: RegionalCluster[];
  selectedClusterId: string;
  onSelectCluster: (clusterId: string) => void;
  atms?: ATMRecord[];
  onSelectAtm?: (atmId: string) => void;
}

// Highway route paths between Bangladesh financial hubs
const HIGHWAY_ROUTES: Array<{ from: string; to: string; label: string; color: string; weight: number }> = [
  { from: 'DHA_CORE', to: 'DHA_NORTH', label: 'Dhaka Arterial', color: '#3b82f6', weight: 4 },
  { from: 'DHA_CORE', to: 'DHA_WEST', label: 'Mirpur Road', color: '#3b82f6', weight: 4 },
  { from: 'DHA_NORTH', to: 'DHA_DIPLO', label: 'Gulshan Link', color: '#3b82f6', weight: 4 },
  { from: 'DHA_CORE', to: 'COM_FENI', label: 'N1 Highway', color: '#2563eb', weight: 3.5 },
  { from: 'COM_FENI', to: 'CTG_PORT', label: 'N1 Highway', color: '#2563eb', weight: 3.5 },
  { from: 'CTG_PORT', to: 'COX_COAST', label: 'N1 Marine', color: '#2563eb', weight: 3 },
  { from: 'DHA_DIPLO', to: 'SYL_VALLEY', label: 'N2 Highway', color: '#6366f1', weight: 3 },
  { from: 'COM_FENI', to: 'SYL_VALLEY', label: 'R140 Connector', color: '#94a3b8', weight: 2 },
  { from: 'DHA_NORTH', to: 'MYM_TANGAIL', label: 'N3 Highway', color: '#0ea5e9', weight: 3 },
  { from: 'DHA_NORTH', to: 'RAJ_BOGRA', label: 'N5 Northwest', color: '#64748b', weight: 3 },
  { from: 'DHA_CORE', to: 'BAR_PADMA', label: 'N8 Padma Expressway', color: '#10b981', weight: 4 },
  { from: 'BAR_PADMA', to: 'KHU_JESSORE', label: 'N7 Highway', color: '#10b981', weight: 3 },
  { from: 'KHU_JESSORE', to: 'DHA_WEST', label: 'N804 Transit', color: '#64748b', weight: 2 },
  { from: 'RAJ_BOGRA', to: 'KHU_JESSORE', label: 'West Inter-Link', color: '#94a3b8', weight: 2 },
];

export type MapTileStyle = 'street' | 'dark' | 'osm';

export const RegionalGeoMap: React.FC<RegionalGeoMapProps> = ({
  clusters,
  selectedClusterId,
  onSelectCluster,
  atms = [],
  onSelectAtm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileGroupRef = useRef<L.LayerGroup | null>(null);
  const polylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const clusterMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const atmMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapTileStyle, setMapTileStyle] = useState<MapTileStyle>('street');
  const [showIndividualAtms, setShowIndividualAtms] = useState<boolean>(true);
  const [atmFilter, setAtmFilter] = useState<'all' | 'critical' | 'selected_corridor'>('selected_corridor');

  // Initialize Leaflet Map Once on Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [23.75, 90.35],
      zoom: 7,
      minZoom: 6,
      maxZoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    const tileGroup = L.layerGroup().addTo(map);
    const polylinesGroup = L.layerGroup().addTo(map);
    const clusterMarkersGroup = L.layerGroup().addTo(map);
    const atmMarkersGroup = L.layerGroup().addTo(map);

    tileGroupRef.current = tileGroup;
    polylinesGroupRef.current = polylinesGroup;
    clusterMarkersGroupRef.current = clusterMarkersGroup;
    atmMarkersGroupRef.current = atmMarkersGroup;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileGroupRef.current = null;
      polylinesGroupRef.current = null;
      clusterMarkersGroupRef.current = null;
      atmMarkersGroupRef.current = null;
    };
  }, []);

  // Update Base Map Tiles (Reliable OpenStreetMap servers with zero API keys required)
  useEffect(() => {
    const tileGroup = tileGroupRef.current;
    if (!tileGroup) return;

    tileGroup.clearLayers();

    if (mapTileStyle === 'dark') {
      const darkLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        className: 'map-tiles-dark',
        attribution: '&copy; OpenStreetMap contributors',
      });
      darkLayer.addTo(tileGroup);
    } else if (mapTileStyle === 'osm') {
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap contributors',
      });
      osmLayer.addTo(tileGroup);
    } else {
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap contributors',
      });

      let errorCount = 0;
      streetLayer.on('tileerror', () => {
        errorCount++;
        if (errorCount > 2 && tileGroupRef.current) {
          tileGroupRef.current.clearLayers();
          const fallbackOsm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
          });
          fallbackOsm.addTo(tileGroupRef.current);
        }
      });

      streetLayer.addTo(tileGroup);
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);

    return () => clearTimeout(timer);
  }, [mapTileStyle]);

  // Update Highway Polylines
  useEffect(() => {
    const polylinesGroup = polylinesGroupRef.current;
    if (!polylinesGroup) return;

    polylinesGroup.clearLayers();

    HIGHWAY_ROUTES.forEach((route) => {
      const fromCoord = CORRIDOR_GEO_COORDS[route.from];
      const toCoord = CORRIDOR_GEO_COORDS[route.to];
      if (fromCoord && toCoord) {
        L.polyline(
          [
            [fromCoord.lat, fromCoord.lng],
            [toCoord.lat, toCoord.lng],
          ],
          {
            color: mapTileStyle === 'dark' ? '#38bdf8' : route.color,
            weight: route.weight,
            opacity: mapTileStyle === 'dark' ? 0.75 : 0.85,
            dashArray: route.weight <= 2 ? '4, 6' : undefined,
          }
        ).addTo(polylinesGroup);
      }
    });
  }, [mapTileStyle]);

  // Update Corridor Cluster Markers
  useEffect(() => {
    const markersGroup = clusterMarkersGroupRef.current;
    if (!markersGroup) return;

    markersGroup.clearLayers();

    clusters.forEach((cluster) => {
      const geo = CORRIDOR_GEO_COORDS[cluster.codePrefix];
      if (!geo) return;

      const isSelected = cluster.id === selectedClusterId;
      const statusColor =
        cluster.criticalCount >= 2
          ? '#dc2626'
          : cluster.criticalCount === 1 || cluster.urgentCount > 0
          ? '#d97706'
          : '#2563eb';

      const customHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: ${statusColor};
            color: #ffffff;
            border: ${isSelected ? '3px solid #60a5fa' : '2px solid #ffffff'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            font-family: 'IBM Plex Mono', monospace;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            ${cluster.atmCount}
          </div>
          <div style="
            margin-top: 4px;
            background: rgba(15, 23, 42, 0.9);
            color: ${isSelected ? '#93c5fd' : '#f8fafc'};
            border: 1px solid ${isSelected ? '#3b82f6' : '#334155'};
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          ">
            ${cluster.shortName || cluster.name}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-geo-marker',
        html: customHtml,
        iconSize: [40, 56],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon, zIndexOffset: isSelected ? 500 : 100 });

      marker.on('click', () => {
        onSelectCluster(cluster.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([geo.lat, geo.lng], 11, { duration: 1.0 });
        }
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${cluster.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${geo.highway} • ${geo.roadKmFromDhaka > 0 ? `${geo.roadKmFromDhaka} km from Dhaka Central` : 'National Hub'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div>
              <span style="color: #64748b; display: block; font-size: 10px;">Corridor ATMs</span>
              <strong style="color: #0f172a; font-size: 13px;">${cluster.atmCount} Terminals</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; font-size: 10px;">Vault Cash Held</span>
              <strong style="color: #059669; font-size: 13px;">৳${(cluster.totalRemainingCash / 1000000).toFixed(1)}M</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; font-size: 10px;">Fill Level</span>
              <strong style="color: #0f172a;">${cluster.utilizationPct.toFixed(0)}%</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; font-size: 10px;">Stockout Risk</span>
              <strong style="color: #dc2626;">${cluster.criticalCount} Critical</strong>
            </div>
          </div>
        </div>
      `);

      marker.addTo(markersGroup);
    });
  }, [clusters, selectedClusterId, onSelectCluster]);

  // Update Individual ATM Markers on the Map
  useEffect(() => {
    const atmGroup = atmMarkersGroupRef.current;
    if (!atmGroup) return;

    atmGroup.clearLayers();

    if (!showIndividualAtms || atms.length === 0) return;

    // Filter which ATMs to plot
    const activeCluster = clusters.find((c) => c.id === selectedClusterId);
    const activePrefix = activeCluster ? activeCluster.codePrefix : 'DHA_CORE';

    let targetAtms: ATMRecord[] = [];

    if (atmFilter === 'selected_corridor') {
      targetAtms = atms.filter((a) => getAtmRegion(a.ATMID).code === activePrefix);
    } else if (atmFilter === 'critical') {
      targetAtms = atms.filter((a) => a.Status === 'Refill Now' || a.Status === 'Refill Soon');
    } else {
      // All ATMs (limit to 120 pins for smooth rendering)
      targetAtms = atms.slice(0, 120);
    }

    targetAtms.forEach((atm) => {
      const geo = getAtmGeoCoordinates(atm);
      const isRefillNow = atm.Status === 'Refill Now';
      const isRefillSoon = atm.Status === 'Refill Soon';

      const color = isRefillNow ? '#ef4444' : isRefillSoon ? '#f59e0b' : '#10b981';

      const pinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: ${color};
            color: #ffffff;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 10px;
            font-family: 'IBM Plex Mono', monospace;
          ">
            ৳
          </div>
          <div style="
            margin-top: 1px;
            background: rgba(15, 23, 42, 0.85);
            color: #ffffff;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-family: 'IBM Plex Mono', monospace;
            white-space: nowrap;
          ">
            ${atm.ATMID}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-geo-marker',
        html: pinHtml,
        iconSize: [28, 36],
        iconAnchor: [14, 11],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon, zIndexOffset: isRefillNow ? 300 : 50 });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 3px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <strong style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #0f172a;">${atm.ATMID}</strong>
            <span style="font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: ${
              isRefillNow ? '#fee2e2; color: #991b1b;' : isRefillSoon ? '#fef3c7; color: #92400e;' : '#dcfce7; color: #166534;'
            }">
              ${atm.Status}
            </span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">
            ${atm.Location}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
            <div>
              <span style="color: #64748b; font-size: 9px; display: block;">Available Cash</span>
              <strong style="color: #0f172a;">৳${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 9px; display: block;">Runway</span>
              <strong style="color: #0f172a;">${atm.Days_of_Cash.toFixed(1)} Days</strong>
            </div>
          </div>
          <button
            id="popup-btn-${atm.ATMID}"
            style="width: 100%; padding: 4px 8px; font-size: 10px; font-weight: 700; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; cursor: pointer;"
          >
            Select in Fleet Operations
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${atm.ATMID}`);
        if (btn && onSelectAtm) {
          btn.onclick = () => {
            onSelectAtm(atm.ATMID);
          };
        }
      });

      marker.addTo(atmGroup);
    });
  }, [clusters, selectedClusterId, atms, showIndividualAtms, atmFilter, onSelectAtm]);

  const handleFocusDhaka = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([23.76, 90.41], 11, { duration: 1.2 });
    }
  };

  const handleFitNational = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([23.75, 90.35], 7, { duration: 1.2 });
    }
  };

  const handleFocusActiveCluster = () => {
    const activeCluster = clusters.find((c) => c.id === selectedClusterId);
    if (!activeCluster) return;
    const geo = CORRIDOR_GEO_COORDS[activeCluster.codePrefix];
    if (geo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geo.lat, geo.lng], 11, { duration: 1.0 });
    }
  };

  const activeCluster = clusters.find((c) => c.id === selectedClusterId);
  const activeGeo = activeCluster ? CORRIDOR_GEO_COORDS[activeCluster.codePrefix] : null;

  return (
    <div className="space-y-3">
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Interactive GPS Geospatial Map & Corridor Radar</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Safe</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-1"></span>
            <span>Warning</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 ml-1"></span>
            <span>Priority Refill</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ATM Filter Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => {
                setShowIndividualAtms(true);
                setAtmFilter('selected_corridor');
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                showIndividualAtms && atmFilter === 'selected_corridor'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show individual ATMs in the active corridor"
            >
              Corridor ATMs
            </button>
            <button
              onClick={() => {
                setShowIndividualAtms(true);
                setAtmFilter('critical');
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                showIndividualAtms && atmFilter === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show all ATMs at stockout risk across Bangladesh"
            >
              Urgent ATMs
            </button>
            <button
              onClick={() => setShowIndividualAtms(!showIndividualAtms)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                !showIndividualAtms ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle individual ATM markers"
            >
              {showIndividualAtms ? 'Pins ON' : 'Pins OFF'}
            </button>
          </div>

          {/* Base Tile Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setMapTileStyle('street')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                mapTileStyle === 'street' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapTileStyle('dark')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                mapTileStyle === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapTileStyle('osm')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                mapTileStyle === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>

          <button
            onClick={handleFocusActiveCluster}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-all cursor-pointer text-[11px]"
            title="Focus active corridor"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-400" />
            <span>Focus Corridor</span>
          </button>

          <button
            onClick={handleFocusDhaka}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-all cursor-pointer text-[11px]"
            title="Focus Greater Dhaka metropolitan corridors"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Dhaka Metro</span>
          </button>

          <button
            onClick={handleFitNational}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-all cursor-pointer text-[11px]"
            title="Fit national 12-corridor network"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>National Grid</span>
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div
        className={`relative rounded-xl overflow-hidden border shadow-sm transition-colors ${
          mapTileStyle === 'dark'
            ? 'border-slate-800 bg-slate-950 dark-map-mode'
            : 'border-slate-200 bg-slate-100'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-[520px] z-10" />

        {/* Selected Corridor Live Floating Status Badge */}
        {activeCluster && activeGeo && (
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="font-bold text-xs text-white truncate">{activeCluster.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeGeo.highway}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Terminals</span>
                <span className="font-bold text-white font-mono">{activeCluster.atmCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vault Liquidity</span>
                <span className="font-bold text-emerald-400 font-mono">
                  ৳{(activeCluster.totalRemainingCash / 1000000).toFixed(1)}M
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Distance</span>
                <span className="font-bold text-slate-200 font-mono">
                  {activeGeo.roadKmFromDhaka > 0 ? `${activeGeo.roadKmFromDhaka} km` : '0 km (Core)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
