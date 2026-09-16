import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { ChargingStation, LatLng, DistanceUnit } from '../types';
import { CalculatedStationStop, TripType } from '../utils/routeCalculator';
import { formatDistance, formatDistanceDelta } from '../utils/unitConverter';
import { Compass, RefreshCw, Layers, ShieldCheck, Zap, ArrowLeftRight, Navigation, Mountain } from 'lucide-react';

interface RouteMapProps {
  originName: string;
  destinationName: string;
  originCoords: LatLng | null;
  destCoords: LatLng | null;
  allCorridorStations: ChargingStation[];
  calculatedStops: CalculatedStationStop[];
  isDirectRoute: boolean;
  targetDestinationSoc: number;
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
  tripType?: TripType;
  returnArrivalSoc?: number;
  unit?: DistanceUnit;
  isInitialPlanningState?: boolean;
  onSelectPresetRoute?: (preset: { origin: string; destination: string }) => void;
  theme?: 'light' | 'dark';
  showTopographics?: boolean;
  onToggleTopographics?: () => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originName,
  destinationName,
  originCoords,
  destCoords,
  allCorridorStations,
  calculatedStops,
  isDirectRoute,
  targetDestinationSoc,
  selectedStationId,
  onSelectStation,
  tripType = 'one-way',
  returnArrivalSoc,
  unit = 'miles' as DistanceUnit,
  isInitialPlanningState,
  onSelectPresetRoute,
  theme = 'dark',
  showTopographics = false,
  onToggleTopographics
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Toggle for showing optional/nearby unselected corridor chargers
  const [showOptionalStations, setShowOptionalStations] = useState<boolean>(true);

  // Derive planning state flag
  const isPlanningMode = isInitialPlanningState ?? (!originCoords || !destCoords || !originName || !destinationName);

  // Map of planned stop IDs
  const plannedStopMap = new Map<string, { stop: CalculatedStationStop; stopNumber: number }>();
  calculatedStops.forEach((s, idx) => {
    plannedStopMap.set(s.station.id, { stop: s, stopNumber: idx + 1 });
  });

  // Re-invalidate map bounds when shifting states or updating coords
  useEffect(() => {
    const timer1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const timer2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 450);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isPlanningMode, originCoords, destCoords]);

  // Initialize map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = originCoords?.lat ?? 43.65;
    const initialLng = originCoords?.lng ?? -80.0;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 8,
      zoomControl: false,
      attributionControl: false
    });

    const tileUrl = showTopographics
      ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: showTopographics ? 17 : 19,
      subdomains: ['a', 'b', 'c'],
      className: theme === 'dark' ? 'dark-map-tiles' : 'light-map-tiles',
      attribution: showTopographics
        ? '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer whenever theme or topography toggle switches
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = showTopographics
      ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: showTopographics ? 17 : 19,
      subdomains: ['a', 'b', 'c'],
      className: theme === 'dark' ? 'dark-map-tiles' : 'light-map-tiles',
      attribution: showTopographics
        ? '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Send tile layer to back so route polylines remain visible
    if (newTileLayer.bringToBack) {
      newTileLayer.bringToBack();
    }
    tileLayerRef.current = newTileLayer;
  }, [theme, showTopographics]);

  // Update markers, active route polyline, and bounds whenever locations or stops change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const boundsLatLngs: L.LatLng[] = [];
    const outboundCoords: L.LatLngExpression[] = [];
    const returnCoords: L.LatLngExpression[] = [];

    // 1. Add Origin Marker (Start & Final Return Point for 2-way)
    if (originCoords) {
      const origLatLng = L.latLng(originCoords.lat, originCoords.lng);
      boundsLatLngs.push(origLatLng);
      outboundCoords.push(origLatLng);

      const originIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="absolute -inset-3 rounded-full border-2 border-emerald-400 bg-emerald-400/20 animate-marker-ripple pointer-events-none" style="animation-delay: 150ms;"></div>
            <div class="animate-marker-drop" style="animation-delay: 80ms;">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/40 border-2 border-white cursor-pointer transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const origMarker = L.marker(origLatLng, { icon: originIcon }).addTo(layerGroup);
      origMarker.bindPopup(`
        <div class="p-1.5 font-sans text-slate-900 min-w-[180px]">
          <div class="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
            ${tripType === 'two-way' ? 'Trip Origin & Round-Trip End' : 'Starting Point (Origin)'}
          </div>
          <div class="font-extrabold text-sm text-slate-950 mt-0.5">${originName}</div>
          <div class="text-[11px] text-slate-600 mt-1 font-mono">
            ${tripType === 'two-way' && returnArrivalSoc !== undefined ? `Final Round-Trip Arrival SoC: ${returnArrivalSoc}%` : 'Trip Departure Point'}
          </div>
        </div>
      `);
    }

    // 2. Add Planned Charging Stops
    const outboundStops = calculatedStops.filter(s => s.legType !== 'return');
    const returnStops = calculatedStops.filter(s => s.legType === 'return');

    // Add outbound stop coords
    outboundStops.forEach(s => {
      outboundCoords.push(L.latLng(s.station.position.lat, s.station.position.lng));
    });

    if (destCoords) {
      outboundCoords.push(L.latLng(destCoords.lat, destCoords.lng));
    }

    // If 2-way, build return coords
    if (tripType === 'two-way' && destCoords && originCoords) {
      returnCoords.push(L.latLng(destCoords.lat, destCoords.lng));
      returnStops.forEach(s => {
        returnCoords.push(L.latLng(s.station.position.lat, s.station.position.lng));
      });
      returnCoords.push(L.latLng(originCoords.lat, originCoords.lng));
    }

    // Render stop markers
    calculatedStops.forEach((stopItem, idx) => {
      const station = stopItem.station;
      const stationLatLng = L.latLng(station.position.lat, station.position.lng);
      boundsLatLngs.push(stationLatLng);

      const isSelected = selectedStationId === station.id;
      const stopNumber = idx + 1;
      const arrivalSoc = stopItem.arrivalSoc;
      const chargeNeeded = stopItem.chargeNeededPercent;
      const targetDep = stopItem.targetDepartureSoc;
      const estMins = stopItem.estimatedChargeMinutes;
      const isReturnLeg = stopItem.legType === 'return';

      // Entrance animation delays staggered across stop sequence
      const animDelay = idx * 160 + 180;
      const rippleDelay = idx * 160 + 340;
      const badgeDelay = idx * 160 + 440;

      const markerHtml = `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          <!-- Expanding shockwave ripple ring on entrance -->
          <div class="absolute -inset-3.5 rounded-full border-2 ${
            isReturnLeg ? 'border-purple-400 bg-purple-400/20' : 'border-cyan-400 bg-cyan-400/20'
          } animate-marker-ripple pointer-events-none" style="animation-delay: ${rippleDelay}ms;"></div>

          ${isSelected ? '<div class="absolute -inset-2.5 rounded-full bg-cyan-400/50 animate-ping"></div>' : ''}

          <!-- Spring Drop-in Marker Pin -->
          <div class="animate-marker-drop" style="animation-delay: ${animDelay}ms;">
            <div class="relative flex flex-col items-center justify-center w-9 h-9 rounded-full ${
              isSelected
                ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/60 scale-125'
                : isReturnLeg
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-2 border-white shadow-xl shadow-purple-500/40 hover:scale-110'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border-2 border-white shadow-xl shadow-cyan-500/40 hover:scale-110'
            } font-black text-xs transition-all">
              <span class="text-[11px] font-extrabold font-mono">${stopNumber}</span>
            </div>
          </div>

          <!-- Staggered Delta Charge & Duration Badge -->
          <div class="absolute -bottom-5.5 animate-badge-pop pointer-events-none" style="animation-delay: ${badgeDelay}ms;">
            <div class="bg-slate-950/95 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap shadow-lg font-bold flex items-center gap-1 backdrop-blur-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
              +${chargeNeeded}% (${estMins}m)
            </div>
          </div>
        </div>
      `;

      const stationIcon = L.divIcon({
        className: 'custom-map-pin',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker(stationLatLng, { icon: stationIcon }).addTo(layerGroup);
      marker.on('click', () => {
        onSelectStation(station.id);
      });

      const popupContent = `
        <div class="p-2 font-sans text-slate-900 min-w-[220px]">
          <div class="flex items-center justify-between text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
            <span>Stop #${stopNumber} (${isReturnLeg ? 'Return Leg' : 'Outbound Leg'})</span>
            <span class="bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-mono">NACS</span>
          </div>
          <div class="font-extrabold text-sm text-slate-950 mt-0.5">${station.name}</div>
          <div class="text-[11px] text-slate-600 mt-0.5">${station.address}</div>
          
          <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
            <div>
              <span class="text-slate-500 block text-[10px]">Arrival SoC</span>
              <span class="font-extrabold text-emerald-700 font-mono">${arrivalSoc}%</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">Distance</span>
              <span class="font-bold text-slate-800 font-mono">${formatDistance(stopItem.distanceFromPrevMiles, unit)}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">Charge Needed</span>
              <span class="font-extrabold text-cyan-800 font-mono">To ${targetDep}% (+${chargeNeeded}%)</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">Charge Time</span>
              <span class="font-bold text-slate-800 font-mono">~${estMins} mins</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">Speed</span>
              <span class="font-bold text-slate-800 font-mono">${station.speedKw} kW</span>
            </div>
          </div>
          ${stopItem.stopReason ? `
            <div class="mt-2 text-[10px] bg-cyan-50 border border-cyan-200 p-1.5 rounded text-cyan-900 font-medium">
              🎯 ${stopItem.stopReason}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      if (isSelected) {
        marker.openPopup();
      }
    });

    // 3. Render Other Corridor Stations (Unplanned / Optional) if enabled
    if (showOptionalStations) {
      allCorridorStations.forEach((station, optIdx) => {
        if (plannedStopMap.has(station.id)) return;

        const stationLatLng = L.latLng(station.position.lat, station.position.lng);
        boundsLatLngs.push(stationLatLng);

        const isSelected = selectedStationId === station.id;
        const optAnimDelay = 300 + (optIdx % 10) * 45;

        const markerHtml = `
          <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group opacity-75 hover:opacity-100 transition-opacity">
            <div class="animate-badge-pop" style="animation-delay: ${optAnimDelay}ms;">
              <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${
                isSelected
                  ? 'bg-slate-300 text-slate-950 ring-2 ring-cyan-400 scale-110'
                  : 'bg-slate-800 text-slate-400 border border-slate-600 hover:border-cyan-400 hover:text-cyan-300'
              } text-[10px] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
            </div>
          </div>
        `;

        const stationIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker(stationLatLng, { icon: stationIcon }).addTo(layerGroup);
        marker.on('click', () => {
          onSelectStation(station.id);
        });

        const popupContent = `
          <div class="p-2 font-sans text-slate-900 min-w-[200px]">
            <div class="flex items-center space-x-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Nearby Corridor Charger</span>
              <span>•</span>
              <span class="text-amber-600 font-bold">Optional / Not in Route</span>
            </div>
            <div class="font-extrabold text-sm text-slate-950 mt-0.5">${station.name}</div>
            <div class="text-[11px] text-slate-600 mt-0.5">${station.address}</div>
            
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Max Power</span>
                <span class="font-bold text-slate-800">${station.speedKw} kW</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Stalls</span>
                <span class="font-bold text-slate-800">${station.availableStalls}/${station.totalStalls} open</span>
              </div>
            </div>
            <div class="mt-2 text-[10px] bg-slate-100 border border-slate-200 p-1.5 rounded text-slate-600">
              ℹ️ Your vehicle has sufficient charge; stopping here is not required for your planned route.
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        if (isSelected) {
          marker.openPopup();
        }
      });
    }

    // 4. Add Destination Marker
    if (destCoords) {
      const destLatLng = L.latLng(destCoords.lat, destCoords.lng);
      boundsLatLngs.push(destLatLng);

      const destAnimDelay = Math.max(calculatedStops.length * 160 + 220, 260);
      const destRippleDelay = destAnimDelay + 160;

      const destIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="absolute -inset-3 rounded-full border-2 ${tripType === 'two-way' ? 'border-amber-400 bg-amber-400/20' : 'border-rose-400 bg-rose-400/20'} animate-marker-ripple pointer-events-none" style="animation-delay: ${destRippleDelay}ms;"></div>
            <div class="animate-marker-drop" style="animation-delay: ${destAnimDelay}ms;">
              <div class="flex items-center justify-center w-8 h-8 rounded-full ${tripType === 'two-way' ? 'bg-amber-500' : 'bg-rose-500'} text-white font-black shadow-lg ${tripType === 'two-way' ? 'shadow-amber-500/40' : 'shadow-rose-500/40'} border-2 border-white cursor-pointer transition-transform hover:scale-110">
                ${tripType === 'two-way' 
                  ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>'
                  : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>'
                }
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const destMarker = L.marker(destLatLng, { icon: destIcon }).addTo(layerGroup);
      destMarker.bindPopup(`
        <div class="p-1.5 font-sans text-slate-900 min-w-[180px]">
          <div class="text-[10px] uppercase font-bold ${tripType === 'two-way' ? 'text-amber-600' : 'text-rose-600'} tracking-wider">
            ${tripType === 'two-way' ? 'Turnaround Point (Destination)' : 'Final Destination'}
          </div>
          <div class="font-extrabold text-sm text-slate-950 mt-0.5">${destinationName}</div>
          <div class="text-[11px] text-slate-600 mt-1 font-mono">
            ${tripType === 'two-way' ? `Midpoint Arrival SoC Goal: ${targetDestinationSoc}%` : `Target Arrival Goal: ${targetDestinationSoc}% SoC`}
          </div>
        </div>
      `);
    }

    // 5. Draw Active Highway Route Polylines (Outbound & Return for two-way)
    if (outboundCoords.length > 1) {
      if (isDirectRoute || calculatedStops.length === 0) {
        // Direct Route Styling (Emerald Glow)
        L.polyline(outboundCoords, {
          color: '#10b981',
          weight: 6,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layerGroup);

        L.polyline(outboundCoords, {
          color: '#34d399',
          weight: 3.5,
          opacity: 0.9,
          dashArray: '6, 6',
          lineCap: 'round'
        }).addTo(layerGroup);
      } else {
        // Outbound Route Styling (Cyan/Blue Glow)
        L.polyline(outboundCoords, {
          color: '#06b6d4',
          weight: 6,
          opacity: 0.45,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layerGroup);

        L.polyline(outboundCoords, {
          color: '#22d3ee',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(layerGroup);
      }
    }

    // If 2-way, draw return leg polyline (Indigo/Purple Dash)
    if (tripType === 'two-way' && returnCoords.length > 1) {
      L.polyline(returnCoords, {
        color: '#8b5cf6',
        weight: 5,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroup);

      L.polyline(returnCoords, {
        color: '#a78bfa',
        weight: 3,
        opacity: 0.9,
        dashArray: '4, 8',
        lineCap: 'round'
      }).addTo(layerGroup);
    }

    // 6. Smooth camera fly animation to encompass corridor route pins
    if (boundsLatLngs.length > 0) {
      const bounds = L.latLngBounds(boundsLatLngs);
      if (bounds.isValid()) {
        map.flyToBounds(bounds, {
          padding: [48, 48],
          duration: 1.4,
          easeLinearity: 0.25,
          maxZoom: 12
        });
      }
    } else {
      map.setView([43.65, -80.0], 8, { animate: true });
    }
  }, [originCoords, destCoords, allCorridorStations, calculatedStops, isDirectRoute, targetDestinationSoc, selectedStationId, showOptionalStations, tripType, returnArrivalSoc]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const points: L.LatLng[] = [];
    if (originCoords) points.push(L.latLng(originCoords.lat, originCoords.lng));
    calculatedStops.forEach(s => points.push(L.latLng(s.station.position.lat, s.station.position.lng)));
    if (destCoords) points.push(L.latLng(destCoords.lat, destCoords.lng));

    if (points.length > 0) {
      map.flyToBounds(L.latLngBounds(points), { padding: [50, 50], duration: 1.2, easeLinearity: 0.3 });
    }
  };

  const nonPlannedCount = allCorridorStations.filter(s => !plannedStopMap.has(s.id)).length;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden font-sans transition-colors"
    >
      {/* Map Header Bar */}
      <motion.div layout className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-xs uppercase tracking-widest font-mono">
            <Compass className="h-4 w-4 shrink-0" />
            <span>Interactive Highway Corridor & Stop Map</span>
          </div>

          <AnimatePresence mode="wait">
            {isPlanningMode ? (
              <motion.h3
                key="planning-title"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-300 tracking-tight mt-0.5"
              >
                Corridor Overview & Standby Map
              </motion.h3>
            ) : (
              <motion.h3
                key={`route-title-${originName}-${destinationName}-${tripType}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 flex items-center gap-2 flex-wrap"
              >
                <span>{originName}</span>
                <span className={tripType === 'two-way' ? 'text-amber-500 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}>
                  {tripType === 'two-way' ? '⇄' : '➔'}
                </span>
                <span>{destinationName}</span>
                {tripType === 'two-way' && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
                    Round Trip
                  </span>
                )}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>

        {/* Cohesive Top-Right Action & Status Toolbar */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 shrink-0 flex-wrap sm:flex-nowrap shadow-sm">
          {/* Status Badge: Route Computed / Direct Drive / Planning Mode */}
          {isPlanningMode ? (
            <div className="h-7 px-2.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse"></span>
              <span>PLANNING MODE</span>
            </div>
          ) : isDirectRoute || calculatedStops.length === 0 ? (
            <div className="h-7 px-2.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              <span>DIRECT DRIVE: 0 STOPS</span>
            </div>
          ) : (
            <div className="h-7 px-2.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
              <span>ROUTE COMPUTED</span>
            </div>
          )}

          {/* Topo toggle button */}
          {onToggleTopographics && (
            <button
              type="button"
              onClick={onToggleTopographics}
              className={`h-7 px-2.5 rounded-xl text-[11px] font-mono flex items-center space-x-1.5 transition-all border cursor-pointer font-bold ${
                showTopographics
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-extrabold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-250 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Toggle topographical terrain layer"
            >
              <Mountain className="h-3.5 w-3.5" />
              <span>Topo: {showTopographics ? 'Visible' : 'Hidden'}</span>
            </button>
          )}

          {/* Action Toggles: Hide Optional Stations & Fit Recenter */}
          {!isPlanningMode && (
            <>
              {nonPlannedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOptionalStations(!showOptionalStations)}
                  className={`h-7 px-2.5 rounded-xl text-[11px] font-mono flex items-center space-x-1.5 transition-all border cursor-pointer font-bold ${
                    showOptionalStations
                      ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-250 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                      : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/20'
                  }`}
                  title="Toggle display of unselected/optional corridor stations"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{showOptionalStations ? 'Hide Optional' : `Show All (${allCorridorStations.length})`}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRecenter}
                className="h-7 px-2.5 rounded-xl text-[11px] font-sans font-bold flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 shadow-sm"
                title="Fit map view to route points"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Fit</span>
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Map Legend Bar */}
      {!isPlanningMode && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
            <span>Start {tripType === 'two-way' ? '& End' : ''}</span>
          </div>
          
          {calculatedStops.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 dark:bg-cyan-400 inline-flex items-center justify-center text-[8px] font-black text-white dark:text-slate-950">1</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-bold">Planned ({calculatedStops.length})</span>
            </div>
          )}

          {tripType === 'two-way' && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-500 inline-flex items-center justify-center text-[8px] font-black text-white">R</span>
              <span className="text-purple-700 dark:text-purple-300 font-bold">Return</span>
            </div>
          )}

          {nonPlannedCount > 0 && showOptionalStations && (
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 inline-block border border-slate-300 dark:border-slate-400"></span>
              <span className="text-slate-500 dark:text-slate-400">Optional ({nonPlannedCount})</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${tripType === 'two-way' ? 'bg-amber-500' : 'bg-rose-500'} inline-block shadow-sm`}></span>
            <span>{tripType === 'two-way' ? 'Turnaround' : 'Dest'}</span>
          </div>
        </div>
      )}

      {/* Initial Planning State Interactive Helper Banner */}
      <AnimatePresence>
        {isPlanningMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-3.5 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-cyan-50 dark:from-cyan-950/40 via-slate-50 dark:via-slate-900/60 to-blue-50 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-500/25 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 shrink-0">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-cyan-800 dark:text-cyan-300 font-mono block">Initial Planning State</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Select a corridor preset or enter cities to calculate and map Supercharger stops.
                  </span>
                </div>
              </div>

              {onSelectPresetRoute && (
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => onSelectPresetRoute({ origin: 'Waterloo, ON', destination: 'Guelph, ON' })}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800/90 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 rounded-lg text-[11px] font-mono transition-all cursor-pointer shadow-sm"
                  >
                    Waterloo ➔ Guelph
                  </button>
                  <button
                    onClick={() => onSelectPresetRoute({ origin: 'Toronto, ON', destination: 'Montreal, QC' })}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800/90 hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 rounded-lg text-[11px] font-mono transition-all cursor-pointer shadow-sm"
                  >
                    Toronto ➔ Montreal
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[390px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Overlaid quick route summary badge with animated transition */}
        <AnimatePresence mode="wait">
          {isPlanningMode ? (
            <motion.div
              key="planning-overlay"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-250 dark:border-cyan-500/30 text-xs font-mono shadow-lg flex items-center space-x-2 text-slate-800 dark:text-cyan-300"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
              <span className="text-[11px]">Enter origin & destination to compute corridor stops</span>
            </motion.div>
          ) : isDirectRoute || calculatedStops.length === 0 ? (
            <motion.div
              key="direct-overlay"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 text-xs font-mono shadow-lg flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px]">Direct {tripType === 'two-way' ? 'Round Trip' : 'Route'} • 0 Charging Stops Required</span>
            </motion.div>
          ) : (
            <motion.div
              key={`stops-overlay-${calculatedStops.length}`}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-300 dark:border-cyan-500/40 text-xs font-mono shadow-lg flex items-center space-x-2 text-cyan-800 dark:text-cyan-300 font-bold"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 fill-cyan-500/20" />
              <span className="text-[11px]">
                {calculatedStops.length} Planned Stop{calculatedStops.length > 1 ? 's' : ''} (Arrival Goal: {targetDestinationSoc}% SoC)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RouteMap;
