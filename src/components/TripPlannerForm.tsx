import React from 'react';
import {
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Battery,
  Target,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Layers,
  Sparkles
} from 'lucide-react';
import { LatLng, DistanceUnit } from '../types';
import { TripType, StopsPreference } from '../utils/routeCalculator';
import { formatDistance } from '../utils/unitConverter';
import LocationInput from './LocationInput';

export interface PredefinedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
}

export const PREDEFINED_ROUTES: PredefinedRoute[] = [
  { id: "waterloo-guelph", name: "Waterloo ➔ Guelph (Short Direct Trip)", origin: "Waterloo, ON", destination: "Guelph, ON" },
  { id: "toronto-montreal", name: "Toronto ➔ Kingston ➔ Montreal (Hwy 401)", origin: "Toronto, ON", destination: "Montreal, QC" },
  { id: "austin-dallas", name: "Austin ➔ Waco ➔ Dallas (I-35)", origin: "Austin, TX", destination: "Dallas, TX" },
  { id: "la-vegas", name: "Los Angeles ➔ Barstow ➔ Las Vegas (I-15)", origin: "Los Angeles, CA", destination: "Las Vegas, NV" },
  { id: "nyc-dc", name: "New York ➔ Philadelphia ➔ Washington DC (I-95)", origin: "New York, NY", destination: "Washington, DC" }
];

interface TripPlannerFormProps {
  originInput: string;
  destInput: string;
  setOriginInput: (val: string) => void;
  setDestInput: (val: string) => void;
  originCoords: LatLng | null;
  destCoords: LatLng | null;
  setOriginCoords: (coords: LatLng | null) => void;
  setDestCoords: (coords: LatLng | null) => void;
  triggerSwap: () => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  tripType: TripType;
  setTripType: (type: TripType) => void;
  hasDestinationCharging: boolean;
  setHasDestinationCharging: (val: boolean) => void;
  stopsPreference: StopsPreference;
  setStopsPreference: (pref: StopsPreference) => void;
  startingSoc: number;
  setStartingSoc: (soc: number) => void;
  targetDestinationSoc: number;
  setTargetDestinationSoc: (soc: number) => void;
  startingRangeMiles: number;
  distanceUnit: DistanceUnit;
  showFilters: boolean;
  setShowFilters: (show: boolean | ((prev: boolean) => boolean)) => void;
  filterPnC: boolean;
  setFilterPnC: (val: boolean) => void;
  filterNacsOnly: boolean;
  setFilterNacsOnly: (val: boolean) => void;
  minStallsAvailable: number;
  setMinStallsAvailable: (val: number) => void;
  minPowerKw: number;
  setMinPowerKw: (val: number) => void;
  origin: string;
  destination: string;
  selectPresetCorridor: (preset: PredefinedRoute) => void;
  isMobileConfigOpen: boolean;
  setIsMobileConfigOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export default function TripPlannerForm({
  originInput,
  destInput,
  setOriginInput,
  setDestInput,
  setOriginCoords,
  setDestCoords,
  triggerSwap,
  handleFormSubmit,
  loading,
  tripType,
  setTripType,
  hasDestinationCharging,
  setHasDestinationCharging,
  stopsPreference,
  setStopsPreference,
  startingSoc,
  setStartingSoc,
  targetDestinationSoc,
  setTargetDestinationSoc,
  startingRangeMiles,
  distanceUnit,
  showFilters,
  setShowFilters,
  filterPnC,
  setFilterPnC,
  filterNacsOnly,
  setFilterNacsOnly,
  minStallsAvailable,
  setMinStallsAvailable,
  minPowerKw,
  setMinPowerKw,
  origin,
  destination,
  selectPresetCorridor,
  isMobileConfigOpen,
  setIsMobileConfigOpen
}: TripPlannerFormProps) {
  return (
    <section className="bg-white dark:bg-[#090d18] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        {/* Origin & Destination with subtle borders and focus rings */}
        <div className="space-y-2.5">
          <div className="relative">
            <LocationInput
              id="origin-input"
              label={tripType === 'two-way' ? 'Starting & Return Point' : 'Departure Origin'}
              labelColorClass="text-cyan-700 dark:text-cyan-400"
              icon={<MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
              placeholder="Enter departure city or address (e.g. Waterloo, ON)"
              value={originInput}
              onChange={(val, coords) => {
                setOriginInput(val);
                if (coords) setOriginCoords(coords);
              }}
              onSelectLocation={(val, coords) => {
                setOriginInput(val);
                setOriginCoords(coords);
              }}
              accentBorderClass="focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
              enableCurrentLocation={true}
              required
            />
          </div>

          {/* Quick Swap Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={triggerSwap}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-cyan-500 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 w-8 h-8 shadow-sm"
              title="Swap origin and destination"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 transform rotate-90" />
            </button>
          </div>

          <div className="relative">
            <LocationInput
              id="dest-input"
              label={tripType === 'two-way' ? 'Turnaround City' : 'Arrival Destination'}
              labelColorClass="text-blue-700 dark:text-blue-400"
              icon={<Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              placeholder="Enter destination city or address (e.g. Guelph, ON)"
              value={destInput}
              onChange={(val, coords) => {
                setDestInput(val);
                if (coords) setDestCoords(coords);
              }}
              onSelectLocation={(val, coords) => {
                setDestInput(val);
                setDestCoords(coords);
              }}
              accentBorderClass="focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
              enableCurrentLocation={true}
              required
            />
          </div>
        </div>

        {/* Primary CTA: Prominent, full-width with glowing/solid cyan/blue accent */}
        <div className="pt-1">
          <button
            type="submit"
            id="plan-trip-submit-button"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-black py-3 px-4 rounded-2xl disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-800 dark:disabled:to-slate-850 disabled:text-slate-500 transition-all font-sans text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-cyan-500/25 dark:shadow-cyan-600/30 border border-cyan-400/30"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Route Telemetry...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 stroke-[2.5]" />
                <span>{tripType === 'two-way' ? 'Plan Round Trip' : 'Plan Trip'}</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Accordion Header for Trip Configuration Settings to prioritize the fold */}
        <div className="sm:hidden pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileConfigOpen(!isMobileConfigOpen)}
            className="w-full flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <div className="flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-bold">Trip Configuration Settings:</span>
            </div>
            {isMobileConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Trip Configuration Settings */}
        <div className={`space-y-3 pt-2 border-t border-slate-200 dark:border-slate-850 ${
          isMobileConfigOpen ? 'block' : 'hidden sm:block'
        }`}>
          {/* Plan Mode & Turnaround Charging */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                Plan Mode:
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTripType('one-way')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    tripType === 'one-way'
                      ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Navigation className="h-3 w-3" />
                  <span>One-Way</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('two-way')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    tripType === 'two-way'
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Round Trip</span>
                </button>
              </div>
            </div>

            {tripType === 'two-way' && (
              <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 px-3 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  id="dest-charging-chk"
                  checked={hasDestinationCharging}
                  onChange={(e) => setHasDestinationCharging(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="dest-charging-chk" className="text-xs font-sans text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                  Destination Charging (Level 2 / Overnight at turnaround)
                </label>
              </div>
            )}
          </div>

          {/* Charging Stops: Redundant Stepper removed as requested */}
          <div className="bg-slate-50 dark:bg-[#0d1424]/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                Charging Stops:
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {stopsPreference === 'auto' ? '⚡ Auto Optimal' : stopsPreference === 0 ? '🚗 Direct 0 Stops' : `📍 ${stopsPreference} Stop${stopsPreference !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 w-full rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStopsPreference('auto')}
                className={`flex-1 min-w-[85px] px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                  stopsPreference === 'auto'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚡ Auto
              </button>
              
              <button
                type="button"
                onClick={() => setStopsPreference(0)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  stopsPreference === 0
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Direct non-stop trip"
              >
                0 (Direct)
              </button>

              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setStopsPreference(num)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    stopsPreference === num
                      ? 'bg-cyan-500 text-slate-950 shadow font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* SoC Sliders: Tightened vertical padding and compact grid */}
          <div className="space-y-2">
            {/* 1. Starting SoC */}
            <div className="bg-slate-50 dark:bg-[#111624] border border-slate-200 dark:border-slate-850 rounded-2xl p-2.5 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Battery className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Starting SoC
                </label>
                <span className="text-[11px] font-extrabold font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
                  {startingSoc}% (~{formatDistance(startingRangeMiles, distanceUnit, true)})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={startingSoc}
                  onChange={(e) => setStartingSoc(Number(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={startingSoc}
                  onChange={(e) => setStartingSoc(Math.min(100, Math.max(5, Number(e.target.value))))}
                  className="w-11 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-1 py-0.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                {[50, 70, 80, 90, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStartingSoc(preset)}
                    className={`flex-1 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                      startingSoc === preset
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Desired Destination SoC */}
            <div className="bg-slate-50 dark:bg-[#111624] border border-slate-200 dark:border-slate-850 rounded-2xl p-2.5 space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  {tripType === 'two-way' ? 'Turnaround Goal' : 'Destination Goal'}
                </label>
                <span className="text-[11px] font-extrabold font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
                  {targetDestinationSoc}% Target SoC
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={10}
                  max={95}
                  step={5}
                  value={targetDestinationSoc}
                  onChange={(e) => setTargetDestinationSoc(Number(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min={10}
                  max={95}
                  value={targetDestinationSoc}
                  onChange={(e) => setTargetDestinationSoc(Math.min(95, Math.max(10, Number(e.target.value))))}
                  className="w-11 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-1 py-0.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                {[20, 50, 70, 80, 85, 90].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetDestinationSoc(preset)}
                    className={`flex-1 py-0.5 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                      targetDestinationSoc === preset
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-mono flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Advanced Corridor Filters</span>
              </div>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                {showFilters ? 'Collapse ▲' : 'Expand ▼'}
              </span>
            </button>
          </div>

          {/* Inline Advanced Filters */}
          {showFilters && (
            <div className="p-2.5 bg-slate-50 dark:bg-[#111624]/75 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12]/50">
                <div>
                  <span className="block font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wide">ISO 15118 Only</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Plug & Charge</span>
                </div>
                <input
                  type="checkbox"
                  checked={filterPnC}
                  onChange={(e) => setFilterPnC(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12]/50">
                <div>
                  <span className="block font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wide">NACS Native</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Skip Magic Dock</span>
                </div>
                <input
                  type="checkbox"
                  checked={filterNacsOnly}
                  onChange={(e) => setFilterNacsOnly(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12]/50">
                <div className="flex justify-between items-center mb-1 text-[11px] uppercase font-bold">
                  <span className="text-slate-700 dark:text-white">Min Stalls</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono">{minStallsAvailable}+</span>
                </div>
                <select
                  value={minStallsAvailable}
                  onChange={(e) => setMinStallsAvailable(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-[#111624] border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] outline-none text-slate-800 dark:text-slate-200 w-full cursor-pointer"
                >
                  <option value={1}>1 (Any Available)</option>
                  <option value={4}>4+ Stalls</option>
                  <option value={8}>8+ Stalls</option>
                </select>
              </div>

              <div className="flex flex-col justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12]/50">
                <div className="flex justify-between items-center mb-1 text-[11px] uppercase font-bold">
                  <span className="text-slate-700 dark:text-white">Min Speed</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono">{minPowerKw} kW</span>
                </div>
                <select
                  value={minPowerKw}
                  onChange={(e) => setMinPowerKw(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-[#111624] border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] outline-none text-slate-800 dark:text-slate-200 w-full cursor-pointer"
                >
                  <option value={100}>100 kW+</option>
                  <option value={150}>150 kW+ (V3/V4)</option>
                  <option value={250}>250 kW+</option>
                </select>
              </div>
            </div>
          )}

          {/* Quick preset corridors */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-850">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono block mb-1.5">
              Popular Toyota Corridors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_ROUTES.map((route) => {
                const active = origin.toLowerCase() === route.origin.toLowerCase() && destination.toLowerCase() === route.destination.toLowerCase();
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => selectPresetCorridor(route)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium cursor-pointer transition-all border whitespace-nowrap ${
                      active
                        ? 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ✨ {route.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
