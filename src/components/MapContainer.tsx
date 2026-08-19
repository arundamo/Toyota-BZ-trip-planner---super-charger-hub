import React, { useEffect } from 'react';
import { ChargingStation, LatLng } from '../types';
import { 
  Zap, 
  MapPin, 
  Compass, 
  Car,
  Clock, 
  DollarSign, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Route
} from 'lucide-react';

export const hasValidKey = false;

interface MapContainerProps {
  origin: string;
  destination: string;
  originCoords: LatLng | null;
  destCoords: LatLng | null;
  stations: ChargingStation[];
  selectedStationId: string | null;
  onSelectStation: (station: ChargingStation) => void;
  onOpenSimulator: (station: ChargingStation) => void;
  onRouteParsed: (coords: LatLng[]) => void;
}

export default function MapContainer({
  origin,
  destination,
  originCoords,
  destCoords,
  stations,
  selectedStationId,
  onSelectStation,
  onOpenSimulator,
  onRouteParsed
}: MapContainerProps) {

  // Emit a mock path to satisfy App.tsx route-parsed logic without actual Google Map libraries
  useEffect(() => {
    if (originCoords && destCoords) {
      const mockPoints: LatLng[] = [
        originCoords,
        ...stations.map(s => s.position),
        destCoords
      ];
      onRouteParsed(mockPoints);
    }
  }, [originCoords, destCoords, stations]);

  // Sort charging stations chronologically from start towards end
  const orderedStations = [...stations].sort((a, b) => {
    if (!originCoords) return 0;
    // Euclidean distance proxy for route order from origin coords
    const distA = Math.pow(a.position.lat - originCoords.lat, 2) + Math.pow(a.position.lng - originCoords.lng, 2);
    const distB = Math.pow(b.position.lat - originCoords.lat, 2) + Math.pow(b.position.lng - originCoords.lng, 2);
    return distA - distB;
  });

  // Calculate high-level itinerary metrics
  const totalStallsAvailable = stations.reduce((acc, s) => acc + s.availableStalls, 0);
  const avgChargingSpeed = stations.length > 0
    ? Math.round(stations.reduce((acc, s) => acc + s.speedKw, 0) / stations.length)
    : 0;

  if (!origin || !destination) {
    return (
      <div className="flex-1 bg-[#060911] border-l border-slate-800/80 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-md space-y-5 relative z-10">
          <div className="inline-flex items-center justify-center bg-cyan-950/30 p-4 rounded-2xl border border-cyan-500/20 text-cyan-400">
            <Route className="h-8 w-8 text-cyan-400 stroke-[1.5]" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              Dynamic Stop-by-Stop Itinerary
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm mx-auto">
              Choose a predefined route corridor or type your start and target cities on the left to lay out your charging progression.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-cyan-500 bg-cyan-950/20 py-1.5 px-4 rounded-full border border-cyan-800/25 uppercase w-fit mx-auto">
            <span>Ready for smart travel planning</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#04070e] border-l border-slate-800/80 flex flex-col h-full overflow-hidden relative">
      
      {/* Route Header Dashboard widget */}
      <div className="p-4 md:p-6 bg-[#070b16] border-b border-slate-800/85 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase font-mono mb-1">
            Current Active Route Itinerary
          </div>
          <h2 className="text-base font-extrabold text-white font-sans flex items-center gap-2">
            <span className="uppercase">{origin}</span>
            <ArrowRight className="h-4 w-4 text-cyan-500 shrink-0" />
            <span className="uppercase text-slate-350">{destination}</span>
          </h2>
        </div>

        {/* Aggregate Journey Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#0b1021] border border-slate-800/60 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[8px] font-mono text-slate-500 uppercase">Stops Needed</span>
            <span className="text-xs font-extrabold text-cyan-400">{stations.length} superchargers</span>
          </div>
          <div className="bg-[#0b1021] border border-slate-800/60 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[8px] font-mono text-slate-500 uppercase">Avg Slot Speed</span>
            <span className="text-xs font-extrabold text-emerald-400">{avgChargingSpeed} kW</span>
          </div>
          <div className="bg-[#0b1021] border border-slate-800/60 px-3 py-1.5 rounded-xl text-center">
            <span className="block text-[8px] font-mono text-slate-500 uppercase">Standard Protocol</span>
            <span className="text-xs font-bold text-blue-400">NACS Ready</span>
          </div>
        </div>
      </div>

      {/* Main timeline listing */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin bg-[#04060b]">
        <div className="max-w-2xl mx-auto relative pl-7 sm:pl-9 border-l border-cyan-500/20 space-y-8 py-3 ml-2 sm:ml-4">
          
          {/* Departure block */}
          <div className="relative">
            <div className="absolute -left-[41px] sm:-left-[49px] top-0 flex items-center justify-center bg-blue-600/90 border-2 border-white text-white h-7.5 w-7.5 rounded-full shadow-lg shadow-blue-500/20">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider mb-0.5">
                Start point
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase">{origin}</h3>
              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                Ensure vehicle battery state of charge is ideally above 45% prior to departure.
              </p>
            </div>
          </div>

          {/* Sequential stations */}
          {orderedStations.length === 0 ? (
            <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-450 leading-relaxed font-sans">
              No compatible charging stations populated along this corridor. Adjust filters on the left panel to display more compatible stops.
            </div>
          ) : (
            orderedStations.map((station, index) => {
              const isSelected = selectedStationId === station.id;
              
              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a1224] border-cyan-500/80 shadow-md shadow-cyan-500/5'
                      : 'bg-[#090d15] border-slate-800/80 hover:bg-[#0e1422] hover:border-slate-700'
                  }`}
                >
                  {/* Circle number index node pin */}
                  <div className={`absolute -left-[45px] sm:-left-[53px] top-6 flex items-center justify-center text-[10px] font-mono font-extrabold border-2 rounded-full h-6 w-6 transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-400 border-cyan-300 text-slate-950 shadow-md shadow-cyan-400/25 scale-110'
                      : 'bg-slate-950 border-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0 font-sans">
                      <div className="flex items-center space-x-2 mr-6 flex-wrap gap-y-1">
                        <h4 className="font-sans font-bold text-sm text-white tracking-tight hover:text-cyan-300 transition-colors">
                          {station.name}
                        </h4>
                        <span className="bg-[#121927] border border-slate-800 px-2.5 py-0.5 rounded text-[9.5px] font-mono text-slate-400 uppercase">
                          {station.connectorType}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 leading-normal font-sans pr-4">
                        {station.address}
                      </p>

                      {/* Station specific telemetry items */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 mt-2.5 border-t border-slate-850/80 text-[10px] font-mono text-slate-450">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span>DETOUR: <strong className="text-white">+{station.detourTimeMinutes} mins</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-cyan-400" />
                          <span>COST: <strong className="text-white">${station.costPerKwh.toFixed(2)}/kWh</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Car className="h-3 w-3 text-cyan-400" />
                          <span>STALLS: <strong className="text-white">{station.availableStalls}/{station.totalStalls} free</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Left speed indicator + connection action button */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start shrink-0 gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-850/80">
                      <div className="text-left md:text-right">
                        <span className="inline-block text-[10.5px] font-mono bg-cyan-950/50 text-cyan-400 border border-cyan-800/35 px-2.5 py-0.5 rounded-full font-bold">
                          {station.speedKw} kW Max
                        </span>
                        
                        {/* Dynamic availability micro progress bar */}
                        <div className="hidden sm:block mt-2 font-mono text-[9px] text-slate-500 whitespace-nowrap">
                          {Math.round((station.availableStalls / station.totalStalls) * 100)}% Available Stalls
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSimulator(station);
                        }}
                        className="bg-cyan-550/15 border border-cyan-500/25 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-[10px] font-sans uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <Zap className="h-3 w-3 fill-current" />
                        <span>Connected Sandbox</span>
                      </button>
                    </div>
                  </div>

                  {/* ISO Autocharge status verification bar */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      {station.plugAndCharge ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">NACS Plug & Charge Enabled (ISO 15118 Autocharge)</span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-yellow-550">Manual Authentication via App Required</span>
                        </>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-cyan-400 text-[9px] uppercase tracking-widest font-extrabold animate-pulse">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Destination milestone arrival block */}
          <div className="relative pt-2">
            <div className="absolute -left-[41px] sm:-left-[49px] top-2 flex items-center justify-center bg-indigo-650/90 border-2 border-white text-white h-7.5 w-7.5 rounded-full shadow-lg shadow-indigo-500/20">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
                Arrival destination
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase">{destination}</h3>
              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                You will reach your destination with high energy margin, utilizing maximum NACS network optimization.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
