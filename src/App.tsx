import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Sparkles, 
  AlertCircle, 
  Car, 
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sliders,
  ThermometerSnowflake,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { ChargingStation, LatLng, VehicleSpecs, DistanceUnit } from "./types";
import { calculateRouteChargeTelemetry, CalculatedStationStop, TripType, StopsPreference } from "./utils/routeCalculator";
import { TOYOTA_BZ_CATALOG, DEFAULT_BZ_MODEL, getEffectiveVehicleRange } from "./data/toyotaModels";
import { formatDistance, formatRange } from "./utils/unitConverter";
import RouteMap from "./components/RouteMap";
import UserGuide from "./components/UserGuide";
import VehicleStats from "./components/VehicleStats";
import VehicleSelectorModal from "./components/VehicleSelectorModal";
import { ElevationProfile } from "./components/ElevationProfile";
import TripPlannerForm, { PREDEFINED_ROUTES, PredefinedRoute } from "./components/TripPlannerForm";
import ItineraryResults from "./components/ItineraryResults";
import { getFallbackStations } from "./data/fallbackCorridors";

// Reference city coordinates database
const MAJOR_CITIES_COORDS: Record<string, LatLng> = {
  "waterloo, on": { lat: 43.4643, lng: -80.5204 },
  "waterloo": { lat: 43.4643, lng: -80.5204 },
  "guelph, on": { lat: 43.5448, lng: -80.2482 },
  "guelph": { lat: 43.5448, lng: -80.2482 },
  "toronto, on": { lat: 43.6532, lng: -79.3832 },
  "toronto": { lat: 43.6532, lng: -79.3832 },
  "montreal, qc": { lat: 45.5017, lng: -73.5673 },
  "montreal": { lat: 45.5017, lng: -73.5673 },
  "austin, tx": { lat: 30.2672, lng: -97.7431 },
  "austin": { lat: 30.2672, lng: -97.7431 },
  "dallas, tx": { lat: 32.7767, lng: -96.7970 },
  "dallas": { lat: 32.7767, lng: -96.7970 },
  "los angeles, ca": { lat: 34.0522, lng: -118.2437 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "las vegas, nv": { lat: 36.1699, lng: -115.1398 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  "new york, ny": { lat: 40.7128, lng: -74.0060 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "washington, dc": { lat: 38.9072, lng: -77.0369 },
  "washington": { lat: 38.9072, lng: -77.0369 },
  "san francisco, ca": { lat: 37.7749, lng: -122.4194 },
  "san jose, ca": { lat: 37.3382, lng: -121.8863 },
  "seattle, wa": { lat: 47.6062, lng: -122.3321 },
  "portland, or": { lat: 45.5152, lng: -122.6784 },
  "chicago, il": { lat: 41.8781, lng: -87.6298 },
  "detroit, mi": { lat: 42.3314, lng: -83.0458 }
};

function getCoordsForCity(cityName: string): LatLng | null {
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  return MAJOR_CITIES_COORDS[key] || null;
}

export function App() {
  // Navigation active tab: 'planner' or 'guide'
  const [activePage, setActivePage] = useState<'planner' | 'guide'>('planner');

  // Theme Mode: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('toyota_bz_theme_mode');
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = themeMode === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const handleSetTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('toyota_bz_theme_mode', mode);
  };

  // Mobile Accordion state toggles
  const [isMobileSpecsOpen, setIsMobileSpecsOpen] = useState(false);
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);

  // Selected Toyota bZ Vehicle Specifications
  const [selectedVehicleSpecs, setSelectedVehicleSpecs] = useState<VehicleSpecs>(DEFAULT_BZ_MODEL);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);

  // Distance Unit: 'miles' | 'km'
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(() => {
    const saved = localStorage.getItem('toyota_bz_distance_unit');
    return (saved === 'km' || saved === 'miles') ? saved : 'miles';
  });

  const handleToggleUnit = (unit: DistanceUnit) => {
    setDistanceUnit(unit);
    localStorage.setItem('toyota_bz_distance_unit', unit);
  };

  // Topographics visibility preference
  const [showTopographics, setShowTopographics] = useState<boolean>(() => {
    const saved = localStorage.getItem('toyota_bz_show_topographics');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleTopographics = () => {
    setShowTopographics(prev => {
      const next = !prev;
      localStorage.setItem('toyota_bz_show_topographics', String(next));
      return next;
    });
  };

  // Trip Configuration
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [hasDestinationCharging, setHasDestinationCharging] = useState<boolean>(false);
  const [stopsPreference, setStopsPreference] = useState<StopsPreference>('auto');

  // Input states
  const [originInput, setOriginInput] = useState("Waterloo, ON");
  const [destInput, setDestInput] = useState("Guelph, ON");
  const [originCoords, setOriginCoords] = useState<LatLng | null>({ lat: 43.4643, lng: -80.5204 });
  const [destCoords, setDestCoords] = useState<LatLng | null>({ lat: 43.5448, lng: -80.2482 });
  const [origin, setOrigin] = useState("Waterloo, ON");
  const [destination, setDestination] = useState("Guelph, ON");

  // State of Charge sliders
  const [startingSoc, setStartingSoc] = useState(80);
  const [targetDestinationSoc, setTargetDestinationSoc] = useState(50);

  // Advanced Corridor Filter toggles
  const [filterPnC, setFilterPnC] = useState(false);
  const [filterNacsOnly, setFilterNacsOnly] = useState(false);
  const [minStallsAvailable, setMinStallsAvailable] = useState(1);
  const [minPowerKw, setMinPowerKw] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  // Results State
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [showOptionalStations, setShowOptionalStations] = useState<boolean>(false);

  // Execute initial route analysis on mount
  useEffect(() => {
    handleRouteSearch("Waterloo, ON", "Guelph, ON", { lat: 43.4643, lng: -80.5204 }, { lat: 43.5448, lng: -80.2482 });
  }, []);

  const handleRouteSearch = async (
    orig: string, 
    dest: string, 
    origCoordsOverride?: LatLng | null, 
    destCoordsOverride?: LatLng | null,
    overrideStartingSoc?: number,
    overrideTargetDestSoc?: number,
    overrideTripType?: TripType,
    overrideHasDestCharging?: boolean,
    overrideStopsPreference?: StopsPreference
  ) => {
    if (!orig || !dest) return;
    setLoading(true);
    setErrorText(null);
    setOrigin(orig);
    setDestination(dest);

    const currentStartingSoc = overrideStartingSoc !== undefined ? overrideStartingSoc : startingSoc;
    const currentTargetDestSoc = overrideTargetDestSoc !== undefined ? overrideTargetDestSoc : targetDestinationSoc;
    const currentTripType = overrideTripType !== undefined ? overrideTripType : tripType;
    const currentHasDestCharging = overrideHasDestCharging !== undefined ? overrideHasDestCharging : hasDestinationCharging;
    const currentStopsPreference = overrideStopsPreference !== undefined ? overrideStopsPreference : stopsPreference;

    const resolvedOrigin = origCoordsOverride !== undefined ? origCoordsOverride : (originCoords || getCoordsForCity(orig));
    const resolvedDest = destCoordsOverride !== undefined ? destCoordsOverride : (destCoords || getCoordsForCity(dest));

    if (resolvedOrigin) setOriginCoords(resolvedOrigin);
    if (resolvedDest) setDestCoords(resolvedDest);

    try {
      const response = await fetch('/api/analyze-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: orig,
          destination: dest,
          routeCoords: [resolvedOrigin, resolvedDest].filter(Boolean),
          startingSoc: currentStartingSoc,
          targetDestinationSoc: currentTargetDestSoc,
          tripType: currentTripType,
          hasDestinationCharging: currentHasDestCharging,
          stopsPreference: currentStopsPreference,
          vehicleSpecs: selectedVehicleSpecs
        })
      });

      if (!response.ok) {
        throw new Error(`API backend route query returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setExplanation(data.explanation || "");
      const returnedStations: ChargingStation[] = (data.stations && data.stations.length > 0)
        ? data.stations
        : getFallbackStations(orig, dest);
      setStations(returnedStations);

      let finalOrigin = data.originCoords && typeof data.originCoords.lat === 'number'
        ? data.originCoords
        : resolvedOrigin;

      let finalDest = data.destCoords && typeof data.destCoords.lat === 'number'
        ? data.destCoords
        : resolvedDest;

      if (!finalOrigin && returnedStations.length > 0) {
        const st0 = returnedStations[0].position;
        const st1 = returnedStations.length > 1 ? returnedStations[1].position : st0;
        finalOrigin = {
          lat: st0.lat - (st1.lat - st0.lat) * 0.5,
          lng: st0.lng - (st1.lng - st0.lng) * 0.5
        };
      }

      if (!finalDest && returnedStations.length > 0) {
        const stLast = returnedStations[returnedStations.length - 1].position;
        const stPrev = returnedStations.length > 1 ? returnedStations[returnedStations.length - 2].position : stLast;
        finalDest = {
          lat: stLast.lat + (stLast.lat - stPrev.lat) * 0.5,
          lng: stLast.lng + (stLast.lng - stPrev.lng) * 0.5
        };
      }

      setOriginCoords(finalOrigin);
      setDestCoords(finalDest);
      setErrorText(null);

    } catch {
      const fallbackStations = getFallbackStations(orig, dest);
      setStations(fallbackStations);
      setExplanation(`Corridor route calculated for ${orig} ➔ ${dest}. Loaded ${fallbackStations.length} verified Tesla Supercharger stations along this route supporting Plug & Charge for your Toyota bZ.`);
      setErrorText(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRouteSearch(originInput, destInput, originCoords, destCoords);
  };

  const selectPresetCorridor = (preset: PredefinedRoute) => {
    const pOriginCoords = getCoordsForCity(preset.origin);
    const pDestCoords = getCoordsForCity(preset.destination);
    setOriginInput(preset.origin);
    setOriginCoords(pOriginCoords);
    setDestInput(preset.destination);
    setDestCoords(pDestCoords);
    handleRouteSearch(preset.origin, preset.destination, pOriginCoords, pDestCoords);
  };

  const triggerSwap = () => {
    const tempInput = originInput;
    const tempCoords = originCoords;
    setOriginInput(destInput);
    setOriginCoords(destCoords);
    setDestInput(tempInput);
    setDestCoords(tempCoords);
  };

  // Filter stations based on user filter selections
  const filteredStations = stations.filter(s => {
    if (filterPnC && !s.plugAndCharge) return false;
    if (filterNacsOnly && s.connectorType !== 'NACS') return false;
    if (s.availableStalls < minStallsAvailable) return false;
    if (s.speedKw < minPowerKw) return false;
    return true;
  });

  // Calculate telemetry
  const routeSummary = calculateRouteChargeTelemetry(
    startingSoc,
    originCoords,
    destCoords,
    filteredStations,
    selectedVehicleSpecs,
    targetDestinationSoc,
    tripType,
    hasDestinationCharging,
    stopsPreference
  );

  const currentEffectiveRangeMiles = routeSummary.effectiveRangeMiles || selectedVehicleSpecs.estimatedRangeMiles;
  const startingRangeMiles = Math.round((startingSoc / 100) * currentEffectiveRangeMiles);
  const oneWayDistanceMiles = Math.round(routeSummary.totalDistanceMiles / (tripType === 'two-way' ? 2 : 1));

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#04060b] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* 1. Header Bar with Theme Toggle & Unit Switcher */}
      <header className="h-[70px] shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-40 relative transition-colors">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/25">
            <Zap className="h-5 w-5 text-cyan-500 dark:text-cyan-400 fill-cyan-500/20 dark:fill-cyan-400/20" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white uppercase font-sans">
              Toyota bZ Supercharge <span className="text-cyan-600 dark:text-cyan-400">Hub</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] font-mono text-cyan-600 dark:text-cyan-400/80">
              Smart NACS Route & Battery Destination Planner
            </p>
          </div>
        </div>

        {/* Center/Right Navigation Tabs, Unit Selector & Theme Controller */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Controller (Light / Dark / System Auto) */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800" title="Switch Theme (Light / Dark / System Auto)">
            <button
              type="button"
              onClick={() => handleSetTheme('light')}
              className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                themeMode === 'light'
                  ? 'bg-white text-amber-600 shadow-sm font-extrabold border border-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Light Mode"
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline text-[10px]">Light</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetTheme('dark')}
              className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                themeMode === 'dark'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm font-extrabold border border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dark Mode"
            >
              <Moon className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[10px]">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetTheme('system')}
              className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                themeMode === 'system'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="System Default (Auto)"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-[10px]">Auto</span>
            </button>
          </div>

          {/* Unit Toggle Switcher Pill (Miles ⇄ KM) */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800" title="Toggle Distance Unit (Miles / Kilometers)">
            <button
              type="button"
              onClick={() => handleToggleUnit('miles')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                distanceUnit === 'miles'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              MILES
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnit('km')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                distanceUnit === 'km'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              KM
            </button>
          </div>

          {/* Top Page Switcher Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActivePage('planner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activePage === 'planner'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Route Planner</span>
            </button>
            <button
              onClick={() => setActivePage('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activePage === 'guide'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">User Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activePage === 'guide' ? (
          <UserGuide
            specs={selectedVehicleSpecs}
            unit={distanceUnit}
            onToggleUnit={handleToggleUnit}
            onNavigateToPlanner={(preset) => {
              setActivePage('planner');
              if (preset) {
                const pOriginCoords = getCoordsForCity(preset.origin);
                const pDestCoords = getCoordsForCity(preset.destination);
                setOriginInput(preset.origin);
                setOriginCoords(pOriginCoords);
                setDestInput(preset.destination);
                setDestCoords(pDestCoords);
                handleRouteSearch(preset.origin, preset.destination, pOriginCoords, pDestCoords);
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            
            {/* LEFT COLUMN: Inputs & Controls (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-3.5">
              
              {/* Consolidated Vehicle Specifications Badge Strip */}
              <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm dark:shadow-md transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/40 truncate">
                          Toyota {selectedVehicleSpecs.model}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {selectedVehicleSpecs.trim}
                        </span>
                        {selectedVehicleSpecs.nacsNative ? (
                          <span className="text-[9px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/40 px-1.5 py-0.5 rounded shrink-0">
                            NACS Native
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                            CCS1 + Adapter
                          </span>
                        )}
                        {selectedVehicleSpecs.isCustom && (
                          <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsVehicleModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-white text-[11px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                      title="Switch / Customize Toyota bZ Model"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Switch</span>
                    </button>

                    {/* Mobile Accordion Toggle for Specs */}
                    <button
                      type="button"
                      onClick={() => setIsMobileSpecsOpen(!isMobileSpecsOpen)}
                      className="sm:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                      title="Toggle specification details"
                    >
                      {isMobileSpecsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Horizontal badge strip */}
                <div className={`mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] font-mono text-slate-600 dark:text-slate-400 ${
                  isMobileSpecsOpen ? 'flex' : 'hidden sm:flex'
                }`}>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    Pack: <strong className="text-slate-900 dark:text-white">{selectedVehicleSpecs.batteryCapacityKwh} kWh</strong>
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    Max DC: <strong className="text-emerald-700 dark:text-emerald-400">{selectedVehicleSpecs.maxChargeRateKw} kW</strong>
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    EPA: <strong className="text-cyan-700 dark:text-cyan-300">{formatRange(selectedVehicleSpecs.estimatedRangeMiles, distanceUnit)}</strong>
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    Drive: <strong className="text-purple-700 dark:text-purple-300">{selectedVehicleSpecs.drivetrain}</strong>
                  </span>
                  {routeSummary.consumptionPenaltyPercent > 0 && (
                    <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <ThermometerSnowflake className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Eff: {formatRange(routeSummary.effectiveRangeMiles, distanceUnit)} (-{routeSummary.consumptionPenaltyPercent}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Form Card */}
              <TripPlannerForm
                originInput={originInput}
                destInput={destInput}
                setOriginInput={setOriginInput}
                setDestInput={setDestInput}
                originCoords={originCoords}
                destCoords={destCoords}
                setOriginCoords={setOriginCoords}
                setDestCoords={setDestCoords}
                triggerSwap={triggerSwap}
                handleFormSubmit={handleFormSubmit}
                loading={loading}
                tripType={tripType}
                setTripType={setTripType}
                hasDestinationCharging={hasDestinationCharging}
                setHasDestinationCharging={setHasDestinationCharging}
                stopsPreference={stopsPreference}
                setStopsPreference={setStopsPreference}
                startingSoc={startingSoc}
                setStartingSoc={setStartingSoc}
                targetDestinationSoc={targetDestinationSoc}
                setTargetDestinationSoc={setTargetDestinationSoc}
                startingRangeMiles={startingRangeMiles}
                distanceUnit={distanceUnit}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filterPnC={filterPnC}
                setFilterPnC={setFilterPnC}
                filterNacsOnly={filterNacsOnly}
                setFilterNacsOnly={setFilterNacsOnly}
                minStallsAvailable={minStallsAvailable}
                setMinStallsAvailable={setMinStallsAvailable}
                minPowerKw={minPowerKw}
                setMinPowerKw={setMinPowerKw}
                origin={origin}
                destination={destination}
                selectPresetCorridor={selectPresetCorridor}
                isMobileConfigOpen={isMobileConfigOpen}
                setIsMobileConfigOpen={setIsMobileConfigOpen}
              />

              {/* Error feedback if any */}
              {errorText && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/20 rounded-2xl p-3 flex items-start space-x-2 text-xs text-red-800 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Vehicle Stats Architecture on Desktop */}
              <div className="hidden lg:block">
                <VehicleStats
                  specs={selectedVehicleSpecs}
                  unit={distanceUnit}
                  onToggleUnit={handleToggleUnit}
                  onOpenSelector={() => setIsVehicleModalOpen(true)}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Route Map & Itinerary Results (7 cols on lg, sticky on desktop) */}
            <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-4 self-start">
              
              {/* Interactive Route Map (Prominently anchored at the top of the sticky column) */}
              <RouteMap
                originName={origin || originInput || "Origin"}
                destinationName={destination || destInput || "Destination"}
                originCoords={originCoords}
                destCoords={destCoords}
                allCorridorStations={filteredStations}
                calculatedStops={routeSummary.stops}
                isDirectRoute={routeSummary.isDirectRoute}
                targetDestinationSoc={targetDestinationSoc}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
                tripType={tripType}
                returnArrivalSoc={routeSummary.returnArrivalSoc}
                unit={distanceUnit}
                theme={resolvedTheme}
                showTopographics={showTopographics}
                onToggleTopographics={handleToggleTopographics}
                isInitialPlanningState={!originCoords || !destCoords || !origin || !destination}
                onSelectPresetRoute={(preset) => {
                  const pOriginCoords = getCoordsForCity(preset.origin);
                  const pDestCoords = getCoordsForCity(preset.destination);
                  setOriginInput(preset.origin);
                  setOriginCoords(pOriginCoords);
                  setDestInput(preset.destination);
                  setDestCoords(pDestCoords);
                  handleRouteSearch(preset.origin, preset.destination, pOriginCoords, pDestCoords);
                }}
              />

              {/* Gemini AI Route Intelligence Advisory */}
              {explanation && !loading && (
                <article className="bg-cyan-50/70 dark:bg-[#0b1427]/60 border border-cyan-300 dark:border-cyan-500/20 rounded-2xl p-3.5 font-sans relative overflow-hidden flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 shadow-sm">
                  <div className="bg-cyan-100 dark:bg-cyan-500/10 p-2 rounded-xl text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/20 shrink-0 w-fit">
                    <Sparkles className="h-4 w-4 fill-cyan-500/20 animate-pulse text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-widest leading-none">
                        Gemini AI EV Route Intelligence
                      </span>
                      {tripType === 'two-way' && (
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                          Round Trip
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans mt-0.5">
                      {explanation}
                    </p>
                  </div>
                </article>
              )}

              {/* Itinerary Results Table & Telemetry HUD */}
              <ItineraryResults
                origin={origin}
                destination={destination}
                tripType={tripType}
                stopsPreference={stopsPreference}
                routeSummary={routeSummary}
                loading={loading}
                startingSoc={startingSoc}
                startingRangeMiles={startingRangeMiles}
                oneWayDistanceMiles={oneWayDistanceMiles}
                distanceUnit={distanceUnit}
                targetDestinationSoc={targetDestinationSoc}
                setTargetDestinationSoc={setTargetDestinationSoc}
                showTopographics={showTopographics}
                onToggleTopographics={handleToggleTopographics}
                filteredStations={filteredStations}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
                showOptionalStations={showOptionalStations}
                setShowOptionalStations={setShowOptionalStations}
                onResetFilters={() => {
                  setFilterPnC(false);
                  setFilterNacsOnly(false);
                  setMinStallsAvailable(1);
                  setMinPowerKw(100);
                }}
              />

              {/* Elevation Profile (Topographics) */}
              {(origin || originInput) && (destination || destInput) && routeSummary.totalDistanceMiles > 0 && (
                <ElevationProfile
                  originName={origin || originInput}
                  destinationName={destination || destInput}
                  originCoords={originCoords}
                  destCoords={destCoords}
                  totalDistanceMiles={routeSummary.totalDistanceMiles}
                  calculatedStops={routeSummary.stops}
                  specs={selectedVehicleSpecs}
                  startingSoc={startingSoc}
                  tripType={tripType}
                  unit={distanceUnit}
                  isVisible={showTopographics}
                  onToggleVisibility={handleToggleTopographics}
                />
              )}

              {/* Mobile specs card at the bottom */}
              <div className="lg:hidden">
                <VehicleStats
                  specs={selectedVehicleSpecs}
                  unit={distanceUnit}
                  onToggleUnit={handleToggleUnit}
                  onOpenSelector={() => setIsVehicleModalOpen(true)}
                />
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Toyota bZ Model Selection & Custom Tuning Modal */}
      {isVehicleModalOpen && (
        <VehicleSelectorModal
          currentSpecs={selectedVehicleSpecs}
          unit={distanceUnit}
          onToggleUnit={handleToggleUnit}
          onSelectVehicle={(specs) => {
            setSelectedVehicleSpecs(specs);
          }}
          onClose={() => setIsVehicleModalOpen(false)}
        />
      )}

    </div>
  );
}

export default App;
