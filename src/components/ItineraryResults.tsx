import React from 'react';
import {
  CheckCircle2,
  Layers,
  Mountain,
  Eye,
  EyeOff,
  Battery,
  Clock,
  Compass,
  AlertCircle,
  Navigation,
  ShieldCheck,
  Target,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { ChargingStation, DistanceUnit } from '../types';
import { RouteChargeSummary, TripType, StopsPreference } from '../utils/routeCalculator';
import { formatDistance } from '../utils/unitConverter';

interface ItineraryResultsProps {
  origin: string;
  destination: string;
  tripType: TripType;
  stopsPreference: StopsPreference;
  routeSummary: RouteChargeSummary;
  loading: boolean;
  startingSoc: number;
  startingRangeMiles: number;
  oneWayDistanceMiles: number;
  distanceUnit: DistanceUnit;
  targetDestinationSoc: number;
  setTargetDestinationSoc: (soc: number) => void;
  showTopographics: boolean;
  onToggleTopographics: () => void;
  filteredStations: ChargingStation[];
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
  showOptionalStations: boolean;
  setShowOptionalStations: (show: boolean | ((prev: boolean) => boolean)) => void;
  onResetFilters: () => void;
  allStations?: ChargingStation[];
  onStopsPreferenceChange?: (pref: StopsPreference) => void;
}

export default function ItineraryResults({
  origin,
  destination,
  tripType,
  stopsPreference,
  routeSummary,
  loading,
  startingSoc,
  startingRangeMiles,
  distanceUnit,
  targetDestinationSoc,
  setTargetDestinationSoc,
  showTopographics,
  onToggleTopographics,
  filteredStations,
  selectedStationId,
  onSelectStation,
  showOptionalStations,
  setShowOptionalStations,
  onResetFilters,
  allStations = [],
  onStopsPreferenceChange
}: ItineraryResultsProps) {
  return (
    <section id="results-table-section" className="flex flex-col overflow-hidden space-y-3">
      {/* Table Container Header Info */}
      {origin && destination && (
        <div className="space-y-2.5 shrink-0 px-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Optimized Journey Progression {tripType === 'two-way' ? '(Round Trip)' : ''}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-tight">
                {origin} 
                <span className={tripType === 'two-way' ? 'text-amber-500 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}>
                  {tripType === 'two-way' ? '⇄' : '➔'}
                </span> 
                {destination}
                {tripType === 'two-way' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-normal">
                    (➔ {origin})
                  </span>
                )}
              </span>
            </div>

            {/* Cohesive Status & Action Toolbar Container */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {routeSummary.isDirectRoute ? (
                <div className="h-7 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>DIRECT DRIVE: 0 STOPS</span>
                </div>
              ) : (
                <div className="h-7 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>STOPS: <strong className="text-cyan-700 dark:text-cyan-400">{routeSummary.stops.length}</strong></span>
                </div>
              )}

              {/* Quick toggle for Topographics in Results Bar */}
              <button
                type="button"
                onClick={onToggleTopographics}
                className={`h-7 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
                  showTopographics
                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={showTopographics ? "Topographics is shown (click to hide)" : "Topographics is hidden (click to show)"}
              >
                <Mountain className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Topo: {showTopographics ? "Shown" : "Hidden"}</span>
                {showTopographics ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Journey Charge & Range Summary HUD */}
          {!loading && (
            <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-cyan-500/25 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans shadow-sm dark:shadow-lg transition-colors">
              <div className="bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center space-x-2">
                <div className="bg-cyan-100 dark:bg-cyan-500/10 p-1.5 rounded-lg text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shrink-0">
                  <Battery className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block truncate">Start Charge</span>
                  <span className="text-xs sm:text-sm font-extrabold text-cyan-700 dark:text-cyan-400 font-mono">{startingSoc}% SoC</span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">~{formatDistance(startingRangeMiles, distanceUnit)}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center space-x-2">
                <div className="bg-cyan-100 dark:bg-cyan-500/10 p-1.5 rounded-lg text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block truncate">Charging Time</span>
                  <span className="text-xs sm:text-sm font-extrabold text-cyan-700 dark:text-cyan-400 font-mono truncate">
                    {routeSummary.isDirectRoute ? '0 min (Direct)' : `${routeSummary.totalChargeMinutes} min`}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                    {routeSummary.isDirectRoute ? 'No stops needed' : `${routeSummary.stops.length} stop${routeSummary.stops.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center space-x-2">
                <div className="bg-blue-100 dark:bg-blue-500/10 p-1.5 rounded-lg text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shrink-0">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block truncate">
                    {tripType === 'two-way' ? 'Round-Trip' : 'Distance'}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono truncate">
                    ~{formatDistance(routeSummary.totalDistanceMiles, distanceUnit, true)}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                    Total driving
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  routeSummary.destinationArrivalSoc >= targetDestinationSoc
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20'
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block truncate">
                    {tripType === 'two-way' ? 'Turn / Final' : 'Arrival SoC'}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono truncate">
                    {tripType === 'two-way' 
                      ? `${routeSummary.destinationArrivalSoc}% / ${routeSummary.returnArrivalSoc}%` 
                      : `${routeSummary.destinationArrivalSoc}% SoC`}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                    Goal: {targetDestinationSoc}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Low SoC Warning Banner */}
          {!loading && routeSummary.hasLowSocWarning && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block font-mono text-[10px]">
                  ⚠️ Low Battery Buffer Alert
                </span>
                <p className="leading-snug text-[11px]">
                  Starting charge of <strong>{startingSoc}%</strong> drops low before reaching some stops. Increase starting charge to at least <strong>{routeSummary.recommendedMinStartingSoc}% SoC</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Results Display Box */}
      <div className="bg-white dark:bg-[#090e1a]/85 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col relative transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 my-6">
            <Compass className="h-9 w-9 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <div className="text-center space-y-1">
              <span className="block text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">CALCULATING ROUTE FEASIBILITY</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                Analyzing starting charge, distances, and optimal Tesla Superchargers...
              </p>
            </div>
          </div>
        ) : !origin || !destination ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3 my-6">
            <div className="bg-cyan-100 dark:bg-cyan-500/10 p-4 rounded-2xl border border-cyan-300 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400">
              <Navigation className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                NACS Route & Battery Destination Planner
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1 font-sans">
                Choose a popular corridor above or enter custom cities to calculate exact arrival charge and charging stops.
              </p>
            </div>
          </div>
        ) : routeSummary.isDirectRoute ? (
          /* ZERO STOPS REQUIRED VIEW: Dedicated direct trip view */
          <div className="p-4 sm:p-5 space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-[#0a1624] dark:to-cyan-950/30 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-emerald-100 dark:bg-emerald-500/15 p-2 rounded-xl border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20">
                        Zero Charging Stops Needed
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      No charging stops are required for this {tripType === 'two-way' ? 'round trip' : 'trip'}!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      Starting at <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{startingSoc}% SoC</strong> gives you ~<strong className="text-emerald-700 dark:text-emerald-300 font-mono">{formatDistance(startingRangeMiles, distanceUnit, true)}</strong> of range, which comfortably covers this <strong className="text-slate-900 dark:text-white font-mono">~{formatDistance(routeSummary.totalDistanceMiles, distanceUnit, true)}</strong> corridor without stops.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#070c17] border border-emerald-300 dark:border-emerald-500/30 p-3 rounded-xl text-center shrink-0 min-w-[140px] self-stretch md:self-auto flex flex-col justify-center shadow-sm">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block font-bold">
                    {tripType === 'two-way' ? 'Return SoC' : 'Arrival SoC'}
                  </span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono my-0.5">
                    {tripType === 'two-way' ? `${routeSummary.returnArrivalSoc}%` : `${routeSummary.destinationArrivalSoc}%`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Goal: {targetDestinationSoc}%
                  </span>
                </div>
              </div>
            </div>

            {/* Destination Goal Selector Box */}
            <div className="bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Desired Arrival Charge at {destination}:
                </span>
                <span className="text-xs font-mono font-extrabold text-cyan-700 dark:text-cyan-300">
                  {targetDestinationSoc}% SoC
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: `${routeSummary.directArrivalSoc}% (Direct)`, val: routeSummary.directArrivalSoc },
                  { label: '50%', val: 50 },
                  { label: '70%', val: 70 },
                  { label: '80%', val: 80 },
                  { label: '85% (Return)', val: 85 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTargetDestinationSoc(item.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                      targetDestinationSoc === item.val
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Nearby Corridor Superchargers Collapsible */}
            {filteredStations.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-[#070b14]/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalStations(!showOptionalStations)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5">
                    <Compass className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold uppercase tracking-wider">
                      {filteredStations.length} Nearby Superchargers (Optional Contingency)
                    </span>
                  </div>
                  {showOptionalStations ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showOptionalStations && (
                  <div className="p-3 border-t border-slate-200 dark:border-slate-850 divide-y divide-slate-200 dark:divide-slate-850 space-y-1.5">
                    {filteredStations.slice(0, 5).map((station, idx) => (
                      <div 
                        key={station.id} 
                        onClick={() => onSelectStation(station.id)}
                        className="pt-1.5 flex items-center justify-between text-xs cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded text-slate-600 dark:text-slate-400">#{idx + 1}</span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{station.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">{station.address}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-cyan-700 dark:text-cyan-400 font-bold">{station.speedKw} kW</span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{station.availableStalls}/{station.totalStalls} open</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : routeSummary.stops.length === 0 ? (
          stopsPreference === 0 ? (
            /* User explicitly picked 0 stops but battery is deficient or below target */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md mx-auto my-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 rounded-2xl">
              <AlertCircle className="h-8 w-8 text-amber-500 stroke-[1.5]" />
              <div className="space-y-1 font-sans">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">Charging Required To Reach Goal</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  You selected 0 charging stops (direct drive). However, arriving with your desired <strong className="text-slate-900 dark:text-white font-mono">{targetDestinationSoc}% SoC</strong> at {destination} requires at least one charging top-up (direct arrival is ~<strong className="text-amber-600 dark:text-amber-400 font-mono">{routeSummary.directArrivalSoc <= 0 ? '0% / Depleted' : `${routeSummary.directArrivalSoc}%`}</strong>).
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStopsPreferenceChange?.('auto')}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Auto-Plan Charging Stops
              </button>
            </div>
          ) : allStations.length > 0 && filteredStations.length === 0 ? (
            /* Filter options too narrow */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm mx-auto my-6">
              <SlidersHorizontal className="h-8 w-8 text-amber-500 stroke-[1.5]" />
              <div className="space-y-1 font-sans">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">Filter criteria too strict</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  No stations match your criteria. Try decreasing required speed or stall requirements.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetFilters}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-cyan-700 dark:text-cyan-400 text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all font-mono cursor-pointer font-bold"
              >
                Reset Filters to Default
              </button>
            </div>
          ) : (
            /* No corridor stations matched */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md mx-auto my-6">
              <Compass className="h-8 w-8 text-cyan-500 stroke-[1.5]" />
              <div className="space-y-1 font-sans">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">No Stations Available Along Corridor</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  No Tesla Superchargers open to non-Tesla EVs were found within 70 miles of this route corridor.
                </p>
              </div>
            </div>
          )
        ) : (
          /* REQUIRED / PLANNED CHARGING STOPS TABLE */
          <div className="overflow-auto relative z-10 select-none">
            {/* Target SoC banner if applicable */}
            {targetDestinationSoc > routeSummary.directArrivalSoc && (
              <div className="bg-cyan-50 dark:bg-cyan-950/30 border-b border-cyan-200 dark:border-cyan-500/20 px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-cyan-800 dark:text-cyan-300">
                  <Target className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>
                    Stops calculated to arrive with at least <strong>{targetDestinationSoc}% SoC</strong> at destination.
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/20 font-bold">
                  Target Plan
                </span>
              </div>
            )}

            {/* Desktop Table */}
            <table className="w-full text-left border-collapse text-xs select-text hidden md:table font-sans">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950/90 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono tracking-wide text-[10px] uppercase">
                  <th className="py-3 pl-4 pr-2 font-bold text-center w-10">#</th>
                  <th className="py-3 px-2.5 font-bold">Supercharger Station</th>
                  {tripType === 'two-way' && <th className="py-3 px-2 font-bold text-center">Leg</th>}
                  <th className="py-3 px-2 font-bold text-center">Arrival SoC</th>
                  <th className="py-3 px-2 font-bold text-center">Departure Goal</th>
                  <th className="py-3 px-2 font-bold text-center">Est. Time</th>
                  <th className="py-3 px-2 font-bold text-center">Speed</th>
                  <th className="py-3 pr-4 pl-2 font-bold">Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 bg-white dark:bg-slate-950/15">
                {routeSummary.stops.map((stop, index) => {
                  const station = stop.station;
                  const isSelected = selectedStationId === station.id;
                  const arrivalSoc = stop.arrivalSoc;
                  const targetDepartureSoc = stop.targetDepartureSoc;
                  const chargeNeededPercent = stop.chargeNeededPercent;
                  const estimatedChargeMinutes = stop.estimatedChargeMinutes;
                  const isReturnLeg = stop.legType === 'return';

                  return (
                    <tr 
                      key={`${station.id}-${index}`}
                      onClick={() => onSelectStation(station.id)}
                      className={`hover:bg-cyan-50 dark:hover:bg-cyan-500/10 cursor-pointer transition-colors duration-150 ${
                        isSelected ? 'bg-cyan-50/80 dark:bg-cyan-950/20 text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 text-center">
                        <span className={`inline-flex items-center justify-center font-mono font-extrabold text-[11px] rounded-full h-6 w-6 border ${
                          isSelected 
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' 
                            : isReturnLeg
                            ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-500/40'
                            : 'bg-slate-100 dark:bg-[#111724] text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-850'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      <td className="py-3 px-2.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <span>{station.name}</span>
                          {station.chargerType === 'V4 Supercharger' && (
                            <span className="bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 text-[9px] font-mono px-1 py-0.2 rounded font-bold">
                              V4
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>{station.address}</span>
                          <span>•</span>
                          <span className="text-cyan-700 dark:text-cyan-400/80">+{formatDistance(stop.distanceFromPrevMiles, distanceUnit)}</span>
                        </div>
                      </td>

                      {tripType === 'two-way' && (
                        <td className="py-3 px-2 text-center">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                            isReturnLeg
                              ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30'
                              : 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30'
                          }`}>
                            {isReturnLeg ? 'Return' : 'Outbound'}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-2 text-center">
                        <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg border inline-block ${
                          stop.arrivalCritical
                            ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-400 border-red-300 dark:border-red-500/30'
                            : stop.arrivalWarning
                            ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/25'
                        }`}
                        title={arrivalSoc < 0 ? `Battery depleted before arrival (deficit of ${Math.abs(arrivalSoc)}%)` : `Arrival SoC: ${arrivalSoc}%`}
                        >
                          {arrivalSoc < 0 ? `0% (${arrivalSoc}%)` : `${arrivalSoc}%`}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        {chargeNeededPercent > 0 ? (
                          <div>
                            <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 text-xs block">
                              To {targetDepartureSoc}%
                            </span>
                            <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400/80 block">
                              (+{chargeNeededPercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                            Direct (+0%)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center font-mono">
                        {estimatedChargeMinutes > 0 ? (
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center justify-center gap-0.5">
                            <Clock className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                            ~{estimatedChargeMinutes}m
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0m</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center font-mono">
                        <span className="font-extrabold text-cyan-700 dark:text-cyan-400 text-xs">
                          {station.speedKw} kW
                        </span>
                      </td>

                      <td className="py-3 pr-4 pl-2">
                        {station.plugAndCharge ? (
                          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold flex items-center gap-1 w-fit">
                            <Zap className="h-2.5 w-2.5" />
                            Plug & Charge
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[9px]">Toyota App</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {routeSummary.stops.map((stop, index) => {
                const station = stop.station;
                const isSelected = selectedStationId === station.id;
                const isReturnLeg = stop.legType === 'return';

                return (
                  <div
                    key={`${station.id}-${index}`}
                    onClick={() => onSelectStation(station.id)}
                    className={`p-3 space-y-2 font-sans ${
                      isSelected ? 'bg-cyan-50 dark:bg-cyan-950/20' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center justify-center font-mono font-extrabold text-xs rounded-full h-5 w-5 ${
                          isReturnLeg ? 'bg-purple-600 text-white' : 'bg-cyan-500 text-slate-950'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{station.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {station.address} • +{formatDistance(stop.distanceFromPrevMiles, distanceUnit)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-xs">{station.speedKw} kW</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-100 dark:bg-[#070b14] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Arrival</span>
                        <span className={`font-bold ${
                          stop.arrivalCritical
                            ? 'text-red-700 dark:text-red-400'
                            : stop.arrivalWarning
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {stop.arrivalSoc < 0 ? `0% (${stop.arrivalSoc}%)` : `${stop.arrivalSoc}%`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Charge To</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300">{stop.targetDepartureSoc}%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Time</span>
                        <span className="font-bold text-slate-900 dark:text-white">~{stop.estimatedChargeMinutes}m</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
