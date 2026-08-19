import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Navigation, Info, Zap, Sparkles, Pin, Check } from 'lucide-react';
import { ChargingStation, PredefinedRoute } from '../types';

interface RoutePanelProps {
  onSearch: (origin: string, destination: string) => Promise<void>;
  loading: boolean;
  explanation: string;
  stations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  selectedStationId: string | null;
  onOpenSimulator: (station: ChargingStation) => void;
}

export const PREDEFINED_ROUTES: PredefinedRoute[] = [
  {
    id: "la-sf",
    name: "California Corridor (I-5 north)",
    origin: "Los Angeles, CA",
    destination: "San Francisco, CA",
    originCoords: { lat: 34.0522, lng: -118.2437 },
    destCoords: { lat: 37.7749, lng: -122.4194 },
    description: "Crucial Pacific highway connection with top-tier high density V3/V4 Supercharger setups."
  },
  {
    id: "austin-dallas",
    name: "Texan Expressway (I-35 north)",
    origin: "Austin, TX",
    destination: "Dallas, TX",
    originCoords: { lat: 30.2672, lng: -97.7431 },
    destCoords: { lat: 32.7767, lng: -96.7970 },
    description: "Texas charging infrastructure featuring NACS native ports with auto-billing active."
  },
  {
    id: "chicago-madison",
    name: "Rustbelt Corridor (I-90 west)",
    origin: "Chicago, IL",
    destination: "Madison, WI",
    originCoords: { lat: 41.8781, lng: -87.6298 },
    destCoords: { lat: 43.0731, lng: -89.4012 },
    description: "Great Lakes connection linking major metropolitan hubs across highly cold-resistant charger grids."
  },
  {
    id: "dc-ny",
    name: "East Coast Hub (I-95 north)",
    origin: "Washington, DC",
    destination: "New York, NY",
    originCoords: { lat: 38.9072, lng: -77.0369 },
    destCoords: { lat: 40.7128, lng: -74.0060 },
    description: "Super dense Northeast corridor featuring active Tesla Magic Docks and NACS native plugs."
  }
];

export default function RoutePanel({
  onSearch,
  loading,
  explanation,
  stations,
  onSelectStation,
  selectedStationId,
  onOpenSimulator
}: RoutePanelProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filterPnC, setFilterPnC] = useState(true);
  const [filterNacsOnly, setFilterNacsOnly] = useState(false);
  const [minStalls, setMinStalls] = useState<number>(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin.trim() && destination.trim()) {
      onSearch(origin, destination);
    }
  };

  const selectPredefined = (route: PredefinedRoute) => {
    setOrigin(route.origin);
    setDestination(route.destination);
    onSearch(route.origin, route.destination);
  };

  // Filter stations based on toggle states
  const filteredStations = stations.filter(s => {
    if (filterPnC && !s.plugAndCharge) return false;
    if (filterNacsOnly && s.connectorType !== 'NACS') return false;
    if (s.availableStalls < minStalls) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0A0E14] border-r border-slate-800 text-white w-full md:w-[420px] shrink-0 relative">
      {/* Immersive Accent Top Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
      
      {/* Search Header Form */}
      <div className="p-6 pt-7 border-b border-slate-800">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center font-sans uppercase tracking-wider text-white">
          <Zap className="h-5 w-5 text-cyan-400 mr-2.5 fill-cyan-400" />
          NACS Route Planner
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 font-sans">
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Enter Origin City (e.g. Los Angeles, CA)"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full bg-[#141B26] border border-slate-700/80 focus:border-cyan-500 rounded-xl py-3 pl-10 pr-4 text-xs font-mono tracking-tight text-slate-100 placeholder-slate-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Navigation className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-500" />
            <input
              type="text"
              placeholder="Enter Destination City (e.g. San Francisco, CA)"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full bg-[#141B26] border border-slate-700/80 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs font-mono tracking-tight text-slate-100 placeholder-slate-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                showFilters 
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                : 'bg-[#141B26] border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Show Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold py-3 px-4 rounded-xl hover:from-cyan-500 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 active:from-cyan-700 active:to-blue-800 transition-all shadow-lg shadow-cyan-950/40 text-xs tracking-widest uppercase flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 stroke-[2.5]" />
                  <span>Analyze Route</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Expandable Advanced Filtering Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-[#141B26]/80 rounded-xl border border-slate-700/60 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Plug & Charge Active (ISO 15118)</span>
              <input
                type="checkbox"
                checked={filterPnC}
                onChange={e => setFilterPnC(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-sans">NACS Native Connector Only</span>
              <input
                type="checkbox"
                checked={filterNacsOnly}
                onChange={e => setFilterNacsOnly(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Min Available Charging Stalls</span>
              <select
                value={minStalls}
                onChange={e => setMinStalls(Number(e.target.value))}
                className="bg-[#0A0E14] border border-slate-700 rounded px-2 py-1 text-[11px] outline-none text-slate-200"
              >
                <option value={1}>1</option>
                <option value={4}>4+</option>
                <option value={8}>8+</option>
                <option value={12}>12+</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Panel Content (Predefined Routes, Tips, and Station List) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Predefined Corridor selection */}
        {stations.length === 0 && !loading && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono font-bold tracking-wider">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>POPULAR COMPATIBLE CORRIDORS</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {PREDEFINED_ROUTES.map(route => (
                <button
                  key={route.id}
                  onClick={() => selectPredefined(route)}
                  className="text-left bg-[#141B26]/40 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/30 hover:bg-[#141B26]/60 transition-all font-sans"
                >
                  <div className="font-bold text-sm text-slate-200">{route.name}</div>
                  <div className="text-[10px] text-slate-550 font-mono mt-1">{route.origin} → {route.destination}</div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">{route.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Route AI Insights from Gemini */}
        {explanation && (
          <div className="relative bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-2xl border border-cyan-500/20 p-4 font-sans text-xs">
            <div className="flex items-center space-x-1.5 mb-2.5 font-bold text-[11px] text-cyan-400">
              <Sparkles className="h-4 w-4 fill-cyan-400/10 animate-pulse" />
              <span className="font-sans font-bold uppercase tracking-wide">GEMINI 3.5 ROUTING ADVISORY</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">{explanation}</p>
          </div>
        )}

        {/* Stations List Header */}
        {stations.length > 0 && (
          <div className="space-y-4 font-sans">
            <div className="flex justify-between items-center text-xs font-mono font-bold tracking-wider text-slate-400">
              <div className="flex items-center">
                <Pin className="h-4 w-4 text-cyan-400 mr-1" />
                <span>COMPATIBLE TESLA STATIONS ({filteredStations.length})</span>
              </div>
              {filteredStations.length !== stations.length && (
                <span className="text-[10px] text-cyan-400 font-bold">Filters Active</span>
              )}
            </div>

            {filteredStations.length === 0 ? (
              <div className="bg-[#141B26]/60 rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-800">
                No chargers match active filters. Try loosening your available stalls or connector constraints.
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                {filteredStations.map(station => {
                  const isSelected = selectedStationId === station.id;
                  return (
                    <div
                      key={station.id}
                      onClick={() => onSelectStation(station)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-[#141B26]/40 ${
                        isSelected 
                        ? 'bg-[#141B26] border-cyan-500 shadow-lg shadow-cyan-500/5' 
                        : 'bg-[#0A0E14] border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm text-slate-200 hover:text-white leading-snug">
                            {station.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">{station.address}</div>
                        </div>

                        {/* Speed badge */}
                        <span className="shrink-0 text-[10px] font-mono bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold border border-cyan-500/30">
                          {station.speedKw} kW
                        </span>
                      </div>

                      {/* Station details indicators */}
                      <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-slate-850 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500">STALLS:</span>{' '}
                          <span className="text-slate-200 font-bold">
                            {station.availableStalls} / {station.totalStalls}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">TYPE:</span>{' '}
                          <span className="text-slate-200 font-bold">{station.chargerType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">NATIVE NACS:</span>{' '}
                          <span className="text-slate-200 font-bold">
                            {station.connectorType === 'NACS' ? 'Yes' : 'No (Magic Dock)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">BILLING:</span>{' '}
                          <span className="text-slate-200 font-bold">
                            {station.plugAndCharge ? 'Plug & Charge' : 'Tesla App'}
                          </span>
                        </div>
                      </div>

                      {/* Plug and charge badge and detail trigger */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center">
                          {station.plugAndCharge ? (
                            <span className="inline-flex items-center text-[10px] font-mono font-bold text-cyan-400">
                              <Check className="h-3 w-3 mr-1 text-cyan-400" /> Ready (ISO 15118)
                            </span>
                          ) : (
                            <span className="text-[10px] text-yellow-500 font-mono">App Auth Required</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSimulator(station);
                          }}
                          className="bg-[#141B26] border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 font-bold text-[11px] font-sans px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Zap className="h-3 w-3 fill-cyan-400" />
                          <span>Simulate Connection</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
