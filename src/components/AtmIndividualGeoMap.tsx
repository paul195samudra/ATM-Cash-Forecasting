import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { ATMRecord } from '../data/atmData';
import { getAtmGeoCoordinates, formatCoordinates } from '../utils/geoCoordinates';
import {
  MapPin,
  Compass,
  Navigation,
  Layers,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  LocateFixed,
  Banknote,
  Truck
} from 'lucide-react';

interface AtmIndividualGeoMapProps {
  atm: ATMRecord;
  nearbyAtms?: ATMRecord[];
  onSelectNearbyAtm?: (atmId: string) => void;
  heightClass?: string;
  showNearbyToggle?: boolean;
}

export type IndividualMapTileStyle = 'street' | 'dark' | 'osm';

export const AtmIndividualGeoMap: React.FC<AtmIndividualGeoMapProps> = ({
  atm,
  nearbyAtms = [],
  onSelectNearbyAtm,
  heightClass = 'h-[320px]',
  showNearbyToggle = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileGroupRef = useRef<L.LayerGroup | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const circleGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapTileStyle, setMapTileStyle] = useState<IndividualMapTileStyle>('street');
  const [showNearby, setShowNearby] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(15);

  const geoInfo = useMemo(() => {
    return getAtmGeoCoordinates(atm);
  }, [atm]);

  // Compute nearby ATMs in the same corridor
  const corridorNearby = useMemo(() => {
    return nearbyAtms
      .filter((a) => a.ATMID !== atm.ATMID)
      .slice(0, 8)
      .map((a) => ({
        atm: a,
        coords: getAtmGeoCoordinates(a),
      }));
  }, [atm, nearbyAtms]);

  // Initialize Leaflet Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [geoInfo.lat, geoInfo.lng],
      zoom: 15,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false, // We render sleek custom controls
      attributionControl: false,
    });

    const tileGroup = L.layerGroup().addTo(map);
    const circleGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);

    tileGroupRef.current = tileGroup;
    circleGroupRef.current = circleGroup;
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Invalidate size on initial mount
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // ResizeObserver to handle tab switching and container resizing smoothly
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
      circleGroupRef.current = null;
      markerGroupRef.current = null;
    };
  }, []); // Run once on mount

  // Update Center when target ATM changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geoInfo.lat, geoInfo.lng], 15, {
        duration: 0.8,
      });
    }
  }, [geoInfo.lat, geoInfo.lng]);

  // Update Base Map Tiles (Reliable OSM & fallback, ZERO API KEY NEEDED)
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
      // Humanitarian Street style with automatic fallback to standard OSM
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap contributors',
      });

      let errCount = 0;
      streetLayer.on('tileerror', () => {
        errCount++;
        if (errCount > 2 && tileGroupRef.current) {
          tileGroupRef.current.clearLayers();
          const fallback = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
          });
          fallback.addTo(tileGroupRef.current);
        }
      });

      streetLayer.addTo(tileGroup);
    }

    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);
    return () => clearTimeout(t);
  }, [mapTileStyle]);

  // Draw Circle perimeter & Markers
  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    const circleGroup = circleGroupRef.current;
    if (!markerGroup || !circleGroup) return;

    markerGroup.clearLayers();
    circleGroup.clearLayers();

    // 1. Draw CIT Replenishment Service Perimeter (600m)
    const perimeterColor =
      atm.Status === 'Refill Now'
        ? '#ef4444'
        : atm.Status === 'Refill Soon'
        ? '#f59e0b'
        : '#10b981';

    L.circle([geoInfo.lat, geoInfo.lng], {
      radius: 500,
      color: perimeterColor,
      weight: 1.5,
      dashArray: '4, 6',
      fillColor: perimeterColor,
      fillOpacity: 0.12,
    }).addTo(circleGroup);

    // 2. Draw Target ATM Marker
    const mainPinColor =
      atm.Status === 'Refill Now'
        ? '#dc2626'
        : atm.Status === 'Refill Soon'
        ? '#d97706'
        : '#16a34a';

    const mainMarkerHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <!-- Pulsing radar ring for urgent/active machine -->
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: ${perimeterColor};
          opacity: 0.35;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>

        <!-- Central Pin Circle -->
        <div style="
          position: relative;
          background: ${mainPinColor};
          color: #ffffff;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          font-family: 'IBM Plex Mono', monospace;
          z-index: 10;
        ">
          ৳
        </div>

        <!-- Pin Label Badge -->
        <div style="
          margin-top: 4px;
          background: #0f172a;
          color: #ffffff;
          border: 1px solid #334155;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          font-family: 'IBM Plex Mono', monospace;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 10;
        ">
          ${atm.ATMID}
        </div>
      </div>
    `;

    const mainIcon = L.divIcon({
      className: 'custom-geo-marker',
      html: mainMarkerHtml,
      iconSize: [46, 68],
      iconAnchor: [23, 20],
    });

    const mainMarker = L.marker([geoInfo.lat, geoInfo.lng], {
      icon: mainIcon,
      zIndexOffset: 1000,
    });

    mainMarker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; min-width: 200px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-size: 13px; color: #0f172a; font-family: 'IBM Plex Mono', monospace;">${atm.ATMID}</strong>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
            atm.Status === 'Refill Now' ? '#fee2e2; color: #991b1b;' : atm.Status === 'Refill Soon' ? '#fef3c7; color: #92400e;' : '#dcfce7; color: #166534;'
          }">
            ${atm.Status}
          </span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.3;">
          ${atm.Location}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Available Cash</span>
            <strong style="color: #0f172a;">৳${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Cash Runway</span>
            <strong style="color: #0f172a;">${atm.Days_of_Cash.toFixed(1)} Days</strong>
          </div>
        </div>
      </div>
    `);

    mainMarker.addTo(markerGroup);

    // 3. Draw Nearby ATMs if toggled on
    if (showNearby && corridorNearby.length > 0) {
      corridorNearby.forEach(({ atm: nAtm, coords: nCoords }) => {
        const nColor =
          nAtm.Status === 'Refill Now'
            ? '#dc2626'
            : nAtm.Status === 'Refill Soon'
            ? '#d97706'
            : '#2563eb';

        const nHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: ${nColor};
              color: #ffffff;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 10px;
              font-family: 'IBM Plex Mono', monospace;
            ">
              ${nAtm.ATMID.slice(-2)}
            </div>
            <div style="
              margin-top: 2px;
              background: rgba(15, 23, 42, 0.85);
              color: #e2e8f0;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 9px;
              font-family: 'IBM Plex Mono', monospace;
              white-space: nowrap;
            ">
              ${nAtm.ATMID}
            </div>
          </div>
        `;

        const nIcon = L.divIcon({
          className: 'custom-geo-marker',
          html: nHtml,
          iconSize: [32, 44],
          iconAnchor: [16, 13],
        });

        const nMarker = L.marker([nCoords.lat, nCoords.lng], { icon: nIcon });

        nMarker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
            <strong style="font-family: 'IBM Plex Mono', monospace; color: #0f172a; font-size: 12px;">${nAtm.ATMID}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${nAtm.Location}</div>
            <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 4px;">
              Cash: ৳${Math.round(nAtm.Estimated_Cash_Remaining).toLocaleString()} (${nAtm.Days_of_Cash.toFixed(1)}d)
            </div>
          </div>
        `);

        if (onSelectNearbyAtm) {
          nMarker.on('click', () => {
            onSelectNearbyAtm(nAtm.ATMID);
          });
        }

        nMarker.addTo(markerGroup);
      });
    }
  }, [atm, geoInfo, showNearby, corridorNearby, onSelectNearbyAtm]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([geoInfo.lat, geoInfo.lng], 15, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Map Header Toolbar */}
      <div className="px-3 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>GPS Satellite & Street Locator</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-300 font-semibold">{atm.ATMID}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Base map style switcher */}
          <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setMapTileStyle('street')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mapTileStyle === 'street' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapTileStyle('dark')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mapTileStyle === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setMapTileStyle('osm')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mapTileStyle === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>

          {showNearbyToggle && corridorNearby.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNearby(!showNearby)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all border cursor-pointer ${
                showNearby
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Show nearby terminals in same transit corridor"
            >
              Nearby ({corridorNearby.length})
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Recenter on ATM"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Map Canvas with Leaflet */}
      <div
        className={`relative w-full ${heightClass} overflow-hidden ${
          mapTileStyle === 'dark' ? 'bg-slate-950 dark-map-mode' : 'bg-slate-100'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Custom On-Map Zoom Controls */}
        <div className="absolute top-2 right-2 z-[400] flex flex-col gap-1 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 bg-white/95 hover:bg-white text-slate-700 rounded-md flex items-center justify-center font-bold text-sm shadow-xs border border-slate-200 hover:text-blue-600 transition-colors cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 bg-white/95 hover:bg-white text-slate-700 rounded-md flex items-center justify-center font-bold text-sm shadow-xs border border-slate-200 hover:text-blue-600 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            -
          </button>
        </div>

        {/* Floating Geo Telemetry HUD Overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-slate-700/80 shadow-lg text-[10px] flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                atm.Status === 'Refill Now'
                  ? 'bg-rose-500 animate-pulse'
                  : atm.Status === 'Refill Soon'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-mono text-slate-300 font-semibold truncate">
              {formatCoordinates(geoInfo.lat, geoInfo.lng)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[9px] text-slate-300">
            <span className="text-slate-400 hidden sm:inline">{geoInfo.highway}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 font-bold">
              {geoInfo.distanceKm} km to Vault
            </span>
          </div>
        </div>
      </div>

      {/* Corridor & Address Context Footer */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-700">{atm.Location}</span>
        </div>
        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 shrink-0">
          {geoInfo.corridorName}
        </span>
      </div>
    </div>
  );
};
