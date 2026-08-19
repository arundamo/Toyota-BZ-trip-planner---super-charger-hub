import React, { useState } from "react";
import { 
  Zap, 
  MapPin, 
  Navigation, 
  Search, 
  SlidersHorizontal, 
  Battery, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Compass, 
  Car, 
  Check, 
  Target,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Layers,
  Plus,
  Minus
} from "lucide-react";
import { ChargingStation, LatLng, VehicleSpecs } from "./types";
import { calculateRouteChargeTelemetry, CalculatedStationStop, TripType, StopsPreference } from "./utils/routeCalculator";
import RouteMap from "./components/RouteMap";

// Predefined Popular Corridors for Instant Testing
const PREDEFINED_ROUTES = [
  { id: "waterloo-guelph", name: "Waterloo ➔ Guelph (Short Direct Trip)", origin: "Waterloo, ON", destination: "Guelph, ON" },
  { id: "toronto-montreal", name: "Toronto ➔ Kingston ➔ Montreal (Hwy 401)", origin: "Toronto, ON", destination: "Montreal, QC" },
  { id: "austin-dallas", name: "Austin ➔ Waco ➔ Dallas (I-35)", origin: "Austin, TX", destination: "Dallas, TX" },
  { id: "la-vegas", name: "Los Angeles ➔ Barstow ➔ Las Vegas (I-15)", origin: "Los Angeles, CA", destination: "Las Vegas, NV" },
  { id: "nyc-dc", name: "New York ➔ Philadelphia ➔ Washington DC (I-95)", origin: "New York, NY", destination: "Washington, DC" }
];

// Reference city coordinates database
const MAJOR_CITIES_COORDS: Record<string, LatLng> = {
  "waterloo, on": { lat: 43.4643, lng: -80.5204 },
  "waterloo": { lat: 43.4643, lng: -80.5204 },
  "guelph, on": { lat: 43.5448, lng: -80.2482 },
  "guelph": { lat: 43.5448, lng: -80.2482 },
  "kitchener, on": { lat: 43.4516, lng: -80.4925 },
  "kitchener": { lat: 43.4516, lng: -80.4925 },
  "cambridge, on": { lat: 43.3616, lng: -80.3144 },
  "cambridge": { lat: 43.3616, lng: -80.3144 },
  "toronto, on": { lat: 43.6532, lng: -79.3832 },
  "toronto": { lat: 43.6532, lng: -79.3832 },
  "mississauga, on": { lat: 43.5890, lng: -79.6441 },
  "kingston, on": { lat: 44.2312, lng: -76.4860 },
  "kingston": { lat: 44.2312, lng: -76.4860 },
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
  "washington": { lat: 38.9072, lng: -77.0369 }
};

// 2026 Toyota bZ Specifications
const TOYOTA_BZ_SPECS: VehicleSpecs = {
  brand: "Toyota",
  model: "2026 Toyota bZ (NACS Standard)",
  year: 2026,
  batteryCapacityKwh: 72.8,
  maxChargeRateKw: 150,
  nacsNative: true,
  plugAndChargeSupported: true,
  estimatedRangeMiles: 252
};

export default function App() {
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<LatLng | null>(null);
  const [destCoords, setDestCoords] = useState<LatLng | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Trip Type State: One-way vs Two-way (Round Trip)
  const [tripType, setTripType] = useState<TripType>('one-way');
  const [hasDestinationCharging, setHasDestinationCharging] = useState<boolean>(false);

  // Stops Preference: 'auto' or custom number of stops (0, 1, 2, 3, etc.)
  const [stopsPreference, setStopsPreference] = useState<StopsPreference>('auto');

  // Vehicle Charge State
  const [startingSoc, setStartingSoc] = useState<number>(80);
  const [targetDestinationSoc, setTargetDestinationSoc] = useState<number>(20); // Desired % charge after reaching destination

  // Optional Stations drawer toggle when direct trip
  const [showOptionalStations, setShowOptionalStations] = useState<boolean>(false);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterPnC, setFilterPnC] = useState(true); // Active by default to highlight Plug & Charge
  const [filterNacsOnly, setFilterNacsOnly] = useState(false);
  const [minStallsAvailable, setMinStallsAvailable] = useState<number>(1);
  const [minPowerKw, setMinPowerKw] = useState<number>(150);

  // Specs Overlay State
  const [showSpecs, setShowSpecs] = useState(false);

  // Error alert message
  const [errorText, setErrorText] = useState("");

  const getCoordsForCity = (city: string): LatLng | null => {
    const key = city.trim().toLowerCase();
    if (MAJOR_CITIES_COORDS[key]) {
      return MAJOR_CITIES_COORDS[key];
    }
    for (const [name, coords] of Object.entries(MAJOR_CITIES_COORDS)) {
      if (key.includes(name) || name.includes(key)) {
        return coords;
      }
    }
    return null;
  };

  const handleRouteSearch = async (
    orig: string, 
    dest: string, 
    currentStartingSoc = startingSoc, 
    currentTargetDestSoc = targetDestinationSoc,
    currentTripType = tripType,
    currentHasDestCharging = hasDestinationCharging,
    currentStopsPreference = stopsPreference
  ) => {
    if (!orig.trim() || !dest.trim()) return;

    setLoading(true);
    setErrorText("");
    setOrigin(orig);
    setDestination(dest);

    const resolvedOrigin = getCoordsForCity(orig);
    const resolvedDest = getCoordsForCity(dest);
    setOriginCoords(resolvedOrigin);
    setDestCoords(resolvedDest);
    setSelectedStationId(null);

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
          stopsPreference: currentStopsPreference
        })
      });

      if (!response.ok) {
        throw new Error("API backend route query unsuccessful.");
      }

      const data = await response.json();
      setExplanation(data.explanation || "");
      const returnedStations: ChargingStation[] = data.stations || [];
      setStations(returnedStations);

      // Determine final origin & dest coordinates for accurate distance & SoC math
      let finalOrigin = data.originCoords && typeof data.originCoords.lat === 'number'
        ? data.originCoords
        : resolvedOrigin;

      let finalDest = data.destCoords && typeof data.destCoords.lat === 'number'
        ? data.destCoords
        : resolvedDest;

      // If origin/dest are still unmapped, derive relative to first/last station corridor
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

    } catch (err) {
      console.error("Error querying `/api/analyze-route` corridor analysis: ", err);
      setErrorText("Unable to analyze route via Gemini. Falling back to default corridor stations.");
      setExplanation(`Trip pre-planned ${currentTripType === 'two-way' ? 'round trip' : ''} between ${orig} and ${dest}. Connect your Toyota bZ with the Tesla NACS network for automated charging.`);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRouteSearch(originInput, destInput);
  };

  const selectPresetCorridor = (preset: typeof PREDEFINED_ROUTES[0]) => {
    setOriginInput(preset.origin);
    setDestInput(preset.destination);
    handleRouteSearch(preset.origin, preset.destination);
  };

  const triggerSwap = () => {
    const temp = originInput;
    setOriginInput(destInput);
    setDestInput(temp);
  };

  // Live filter results dynamically on client side
  const filteredStations = stations.filter(s => {
    if (filterPnC && !s.plugAndCharge) return false;
    if (filterNacsOnly && s.connectorType !== 'NACS') return false;
    if (s.availableStalls < minStallsAvailable) return false;
    if (s.speedKw < minPowerKw) return false;
    return true;
  });

  // Calculate live route telemetry (arrival SoC %, required departure SoC %, charge time, one-way/two-way, user stop count preference)
  const routeSummary = calculateRouteChargeTelemetry(
    startingSoc,
    originCoords,
    destCoords,
    filteredStations,
    TOYOTA_BZ_SPECS,
    targetDestinationSoc,
    tripType,
    hasDestinationCharging,
    stopsPreference
  );

  const calculatedStopMap = new Map<string, CalculatedStationStop>();
  routeSummary.stops.forEach(stop => {
    calculatedStopMap.set(stop.station.id, stop);
  });

  // Calculated real-world km approximations for display
  const startingRangeKm = Math.round((startingSoc / 100) * TOYOTA_BZ_SPECS.estimatedRangeMiles * 1.60934);
  const startingRangeMiles = Math.round((startingSoc / 100) * TOYOTA_BZ_SPECS.estimatedRangeMiles);
  const totalDistanceKm = Math.round(routeSummary.totalDistanceMiles * 1.60934);
  const oneWayDistanceKm = Math.round((routeSummary.totalDistanceMiles / (tripType === 'two-way' ? 2 : 1)) * 1.60934);

  return (
    <div className="flex flex-col min-h-screen bg-[#04060b] text-slate-100 font-sans">
      
      {/* 1. Header Bar */}
      <header className="h-[70px] shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-40 relative">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/25">
            <Zap className="h-5 w-5 text-cyan-400 fill-cyan-400/20" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase font-sans">
              Toyota bZ Supercharge <span className="text-cyan-400">Hub</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] font-mono text-cyan-400/80">
              Smart NACS Route & Battery Destination Planner
            </p>
          </div>
        </div>

        {/* Right Header: Vehicle Specs Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-all text-xs font-mono cursor-pointer"
          >
            <Car className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">2026 Toyota bZ (NACS)</span>
            <span className="sm:hidden">bZ Specs</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-6">

        {/* Top Control Section: Route Selector & SoC Config */}
        <section className="bg-[#090d18] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Specs Panel Overlay (collapsible) */}
          {showSpecs && (
            <div className="mb-6 p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl animate-fadeIn space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    2026 Toyota bZ EV Architecture Specifications
                  </span>
                </div>
                <button
                  onClick={() => setShowSpecs(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">DC Peak Charging</span>
                  <p className="font-extrabold text-cyan-400 text-sm">{TOYOTA_BZ_SPECS.maxChargeRateKw} kW</p>
                  <p className="text-[9px] font-mono text-slate-500">10% to 80% in ~28 mins</p>
                </div>
                <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Usable Capacity</span>
                  <p className="font-extrabold text-white text-sm">{TOYOTA_BZ_SPECS.batteryCapacityKwh} kWh</p>
                  <p className="text-[9px] font-mono text-slate-500">Lithium-ion Pack</p>
                </div>
                <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">NACS Connector</span>
                  <p className="font-extrabold text-white text-sm">ISO 15118 Secure</p>
                  <p className="text-[9px] font-mono text-slate-500">Auto-billing enabled</p>
                </div>
                <div className="bg-[#090d16] border border-slate-800/80 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase">Est. Highway Range</span>
                  <p className="font-extrabold text-emerald-400 text-sm">{TOYOTA_BZ_SPECS.estimatedRangeMiles} MILES (~405 KM)</p>
                  <p className="text-[9px] font-mono text-slate-500">Real-world EPA tested</p>
                </div>
              </div>

              <div className="text-[10px] sm:text-xs text-slate-350 leading-relaxed font-sans bg-cyan-950/15 border border-cyan-800/20 p-3 rounded-xl">
                <span className="font-bold text-cyan-400 uppercase tracking-wide inline-block mr-1">NACS Handshake Note:</span> 
                This vehicle uses cryptographic Handshake authorization. Enabling Tesla Supercharger integration inside the Toyota App binds your VIN directly to the vehicle's onboard communication controller, meaning physical connection triggers automatic authentication and charge startup in under 10 seconds.
              </div>
            </div>
          )}

          {/* Form container */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Trip Type & Stops Control Bar */}
            <div className="space-y-3 pb-3 border-b border-slate-850">
              
              {/* Row 1: Plan Mode & Destination Charging */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Plan Mode:
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTripType('one-way')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        tripType === 'one-way'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>One-Way Trip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType('two-way')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        tripType === 'two-way'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Two-Way (Round Trip)</span>
                    </button>
                  </div>
                </div>

                {/* Destination Level-2 Charging toggle (active only when two-way trip selected) */}
                {tripType === 'two-way' && (
                  <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl animate-fadeIn">
                    <input
                      type="checkbox"
                      id="dest-charging-chk"
                      checked={hasDestinationCharging}
                      onChange={(e) => setHasDestinationCharging(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <label htmlFor="dest-charging-chk" className="text-xs font-sans text-amber-200 cursor-pointer select-none">
                      Destination Charging (Level 2 / Overnight at turnaround)
                    </label>
                  </div>
                )}
              </div>

              {/* Row 2: Number of Charging Stops Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1424]/70 border border-slate-800/80 rounded-2xl p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    Charging Stops:
                  </span>
                  
                  {/* Preset Stops Chips */}
                  <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStopsPreference('auto')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        stopsPreference === 'auto'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      ⚡ Auto (Optimal)
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStopsPreference(0)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        stopsPreference === 0
                          ? 'bg-emerald-500 text-slate-950 shadow font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      0 (Direct)
                    </button>

                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setStopsPreference(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          stopsPreference === num
                            ? 'bg-cyan-400 text-slate-950 shadow font-black'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {num} {num === 1 ? 'Stop' : 'Stops'}
                      </button>
                    ))}
                  </div>

                  {/* Stepper for custom stop counts */}
                  <div className="inline-flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        const current = typeof stopsPreference === 'number' ? stopsPreference : 1;
                        if (current > 0) setStopsPreference(current - 1);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Decrease stops"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-mono font-bold text-cyan-300 min-w-[28px] text-center">
                      {stopsPreference === 'auto' ? 'Auto' : `${stopsPreference}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = typeof stopsPreference === 'number' ? stopsPreference : 0;
                        if (current < 8) setStopsPreference(current + 1);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Increase stops"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Informative mode badge */}
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
                  {stopsPreference === 'auto' ? (
                    <span className="text-cyan-300">
                      ⚡ <strong>Smart Auto</strong>: Fewest stops planned to protect range
                    </span>
                  ) : stopsPreference === 0 ? (
                    <span className="text-emerald-400">
                      🚗 <strong>Direct Non-Stop</strong>: 0 charging stops selected
                    </span>
                  ) : (
                    <span className="text-cyan-300">
                      📍 <strong>Fixed Mode</strong>: {stopsPreference} charging stop{stopsPreference !== 1 ? 's' : ''} along corridor
                    </span>
                  )}
                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              
              {/* Origin station address (4 cols) */}
              <div className="lg:col-span-4 relative">
                <label className="absolute left-3.5 top-2 text-[8px] font-mono text-cyan-500 font-bold uppercase tracking-wider block">
                  {tripType === 'two-way' ? 'Starting & Return Point' : 'Departure Origin'}
                </label>
                <MapPin className="absolute left-3.5 bottom-3 h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Enter departure city (e.g. Waterloo, ON)"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  className="w-full bg-[#111624] border border-slate-850 focus:border-cyan-500 rounded-2xl pt-6 pb-2.5 pl-10 pr-4 text-xs font-medium tracking-tight text-white placeholder-slate-500 outline-none transition-all duration-150"
                  required
                />
              </div>

              {/* Swapper button (1 col) */}
              <div className="flex justify-center lg:col-span-1">
                <button
                  type="button"
                  onClick={triggerSwap}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 w-10 h-10 lg:w-11 lg:h-11"
                  title="Swap origin and destination"
                >
                  <ArrowLeftRight className="h-4 w-4 transform rotate-90 lg:rotate-0" />
                </button>
              </div>

              {/* Destination address (4 cols) */}
              <div className="lg:col-span-4 relative">
                <label className="absolute left-3.5 top-2 text-[8px] font-mono text-blue-500 font-bold uppercase tracking-wider block">
                  {tripType === 'two-way' ? 'Turnaround City' : 'Arrival Destination'}
                </label>
                <Navigation className="absolute left-3.5 bottom-3 h-4 w-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="Enter destination city (e.g. Guelph, ON)"
                  value={destInput}
                  onChange={(e) => setDestInput(e.target.value)}
                  className="w-full bg-[#111624] border border-slate-850 focus:border-blue-500 rounded-2xl pt-6 pb-2.5 pl-10 pr-4 text-xs font-medium tracking-tight text-white placeholder-slate-500 outline-none transition-all duration-150"
                  required
                />
              </div>

              {/* Action Buttons (3 cols) */}
              <div className="lg:col-span-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3.5 rounded-2xl border transition-colors flex items-center justify-center shrink-0 w-12 h-12 lg:h-[54px] cursor-pointer select-none ${
                    showFilters 
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' 
                      : 'bg-[#111624] border-slate-850 text-slate-400 hover:text-white'
                  }`}
                  title="Tweak route optimization parameters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-extrabold px-5 rounded-2xl hover:from-cyan-500 hover:to-blue-600 disabled:from-slate-850 disabled:to-slate-900 disabled:text-slate-500 transition-all font-sans text-xs tracking-wider uppercase h-12 lg:h-[54px] flex items-center justify-center space-x-2 cursor-pointer select-none shadow-lg shadow-cyan-600/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>{tripType === 'two-way' ? 'Plan Round Trip' : 'Plan Trip'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* State of Charge (SoC) Controls Row: Starting SoC & Desired Destination SoC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              
              {/* 1. Starting Vehicle Charge % */}
              <div className="bg-[#111624] border border-slate-850 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Battery className="h-3.5 w-3.5 text-emerald-400" />
                    Starting State of Charge (SoC)
                  </label>
                  <span className="text-xs font-extrabold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {startingSoc}% SoC (~{startingRangeKm} km / {startingRangeMiles} mi)
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 mb-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={startingSoc}
                    onChange={(e) => setStartingSoc(Number(e.target.value))}
                    className="flex-1 accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={startingSoc}
                    onChange={(e) => setStartingSoc(Math.min(100, Math.max(5, Number(e.target.value))))}
                    className="w-12 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  {[50, 70, 80, 90, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStartingSoc(preset)}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                        startingSoc === preset
                          ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-850'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Desired % of Charge After Reaching Destination */}
              <div className="bg-[#111624] border border-slate-850 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-cyan-400" />
                    {tripType === 'two-way' ? 'Turnaround / Return Battery Goal' : 'Desired Destination Charge Goal'}
                  </label>
                  <span className="text-xs font-extrabold font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {targetDestinationSoc}% Target SoC
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 mb-2">
                  <input
                    type="range"
                    min={10}
                    max={95}
                    step={5}
                    value={targetDestinationSoc}
                    onChange={(e) => setTargetDestinationSoc(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min={10}
                    max={95}
                    value={targetDestinationSoc}
                    onChange={(e) => setTargetDestinationSoc(Math.min(95, Math.max(10, Number(e.target.value))))}
                    className="w-12 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  {[20, 50, 70, 80, 85, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetDestinationSoc(preset)}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                        targetDestinationSoc === preset
                          ? 'bg-cyan-400 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-850'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Advanced Charging Preferences Inline Section */}
            {showFilters && (
              <div className="p-4 bg-[#111624]/75 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-fadeIn font-sans mt-3">
                
                {/* Plug & Charge Check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-[#070a12]/50 hover:border-slate-700 transition-all">
                  <div>
                    <span className="block font-bold text-white text-[11px] uppercase tracking-wide">ISO 15118 Only</span>
                    <span className="text-[10px] text-slate-400 font-mono">Plug & Charge handshakes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterPnC}
                    onChange={(e) => setFilterPnC(e.target.checked)}
                    className="w-4.5 h-4.5 accent-cyan-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* NACS Native connectors check */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-[#070a12]/50 hover:border-slate-700 transition-all">
                  <div>
                    <span className="block font-bold text-white text-[11px] uppercase tracking-wide">NACS Native Inlet</span>
                    <span className="text-[10px] text-slate-400 font-mono">Skip Magic Dock adapters</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filterNacsOnly}
                    onChange={(e) => setFilterNacsOnly(e.target.checked)}
                    className="w-4.5 h-4.5 accent-cyan-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* Min Free Stalls Slider/picker */}
                <div className="flex flex-col justify-center p-2.5 rounded-xl border border-slate-800 bg-[#070a12]/50 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-center mb-1 text-[11px] uppercase font-bold tracking-wide">
                    <span className="text-white font-sans">Min Free Stalls</span>
                    <span className="text-cyan-400 font-mono font-bold">{minStallsAvailable}+ stalls</span>
                  </div>
                  <select
                    value={minStallsAvailable}
                    onChange={(e) => setMinStallsAvailable(Number(e.target.value))}
                    className="bg-[#111624] border border-slate-800 rounded px-2.5 py-1 text-[11px] outline-none text-slate-200 w-full cursor-pointer"
                  >
                    <option value={1}>1 (Any Available)</option>
                    <option value={4}>4+ Stall Openings</option>
                    <option value={8}>8+ Stall Openings</option>
                    <option value={12}>12+ Stall Openings</option>
                  </select>
                </div>

                {/* Min Speed requirements */}
                <div className="flex flex-col justify-center p-2.5 rounded-xl border border-slate-800 bg-[#070a12]/50 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-center mb-1 text-[11px] uppercase font-bold tracking-wide">
                    <span className="text-white font-sans">Min Terminal Speed</span>
                    <span className="text-cyan-400 font-mono font-bold">{minPowerKw} kW</span>
                  </div>
                  <select
                    value={minPowerKw}
                    onChange={(e) => setMinPowerKw(Number(e.target.value))}
                    className="bg-[#111624] border border-slate-800 rounded px-2.5 py-1 text-[11px] outline-none text-slate-200 w-full cursor-pointer"
                  >
                    <option value={100}>All (100 kW+)</option>
                    <option value={150}>V3 / V4 Capable (150 kW+)</option>
                    <option value={250}>Ultra-Fast Core (250 kW+)</option>
                  </select>
                </div>

              </div>
            )}
          </form>

          {/* Quick preset chips list */}
          <div className="mt-4 pt-3.5 border-t border-slate-850 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold font-sans">Popular Toyota Corridors:</span>
            {PREDEFINED_ROUTES.map((route) => {
              const active = origin.toLowerCase() === route.origin.toLowerCase() && destination.toLowerCase() === route.destination.toLowerCase();
              return (
                <button
                  key={route.id}
                  onClick={() => selectPresetCorridor(route)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border whitespace-nowrap outline-none ${
                    active 
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-sm font-bold' 
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  ✨ {route.name}
                </button>
              );
            })}
          </div>

        </section>

        {/* 3. Advisory Section: Displays route-planning insight under route inputs */}
        {explanation && !loading && (
          <article className="bg-[#0b1427]/60 border border-cyan-500/20 rounded-2xl p-4.5 font-sans relative overflow-hidden flex flex-col md:flex-row md:items-start space-y-3 md:space-y-0 md:space-x-3.5 shadow-lg">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
            <div className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-400 border border-cyan-500/20 shrink-0 w-fit">
              <Sparkles className="h-5 w-5 fill-cyan-400/20 animate-pulse text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest leading-none">
                  Gemini AI EV Route Intelligence
                </span>
                {tripType === 'two-way' && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                    Round Trip Plan
                  </span>
                )}
                {routeSummary.isDirectRoute && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                    Direct Trip (0 Stops)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-sans mt-1">
                {explanation}
              </p>
            </div>
          </article>
        )}

        {/* Local Error feedback if required */}
        {errorText && (
          <div className="bg-red-950/40 border border-red-500/20 rounded-2xl p-3.5 flex items-start space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            <span>{errorText}</span>
          </div>
        )}

        {/* 4. Bottom Section: Results & Stops Schedule */}
        <section id="results-table-section" className="flex-1 flex flex-col overflow-hidden">
          
          {/* Table Container Header info */}
          {origin && destination && (
            <div className="space-y-3 shrink-0 mb-3.5 px-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Optimized Journey Progression {tripType === 'two-way' ? '(Round Trip)' : ''}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 uppercase tracking-tight">
                    {origin} 
                    <span className={tripType === 'two-way' ? 'text-amber-400' : 'text-cyan-400'}>
                      {tripType === 'two-way' ? '⇄' : '➔'}
                    </span> 
                    {destination}
                    {tripType === 'two-way' && (
                      <span className="text-xs text-slate-400 font-mono font-normal">
                        (➔ {origin})
                      </span>
                    )}
                  </span>
                </div>

                {/* Status tally parameters */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                  {routeSummary.isDirectRoute ? (
                    <div className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      DIRECT DRIVE: 0 STOPS {stopsPreference === 0 ? '(USER SELECTED)' : 'REQUIRED'}
                    </div>
                  ) : (
                    <div className="bg-slate-900 text-slate-350 border border-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>STOPS PLANNED: <strong className="text-cyan-400">{routeSummary.stops.length} Supercharger{routeSummary.stops.length !== 1 ? 's' : ''}</strong></span>
                      <span className="text-slate-500 font-normal">
                        ({stopsPreference === 'auto' ? 'Auto Optimal' : `User set: ${stopsPreference}`})
                      </span>
                    </div>
                  )}
                  <div className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-mono">
                    Target Dest. Charge: <strong>{targetDestinationSoc}%</strong>
                  </div>
                </div>
              </div>

              {/* Journey Charge & Range Summary HUD */}
              {!loading && (
                <div className="bg-[#0c1322] border border-cyan-500/25 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans shadow-lg">
                  <div className="bg-[#080d1a] border border-slate-800 p-2.5 rounded-xl flex items-center space-x-2.5">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Battery className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Starting Charge</span>
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">{startingSoc}% SoC</span>
                      <span className="text-[9px] font-mono text-slate-500 block">~{startingRangeKm} km range</span>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] border border-slate-800 p-2.5 rounded-xl flex items-center space-x-2.5">
                    <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Charging Stops Time</span>
                      <span className="text-xs sm:text-sm font-extrabold text-cyan-400 font-mono">
                        {routeSummary.isDirectRoute ? '0 mins (Direct)' : `${routeSummary.totalChargeMinutes} mins`}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        {routeSummary.isDirectRoute ? 'No stops needed' : `${routeSummary.stops.length} stop${routeSummary.stops.length !== 1 ? 's' : ''} planned`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] border border-slate-800 p-2.5 rounded-xl flex items-center space-x-2.5">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 border border-blue-500/20 shrink-0">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">
                        {tripType === 'two-way' ? 'Round-Trip Distance' : 'Route Distance'}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-100 font-mono">
                        ~{totalDistanceKm} km (~{routeSummary.totalDistanceMiles} mi)
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        {tripType === 'two-way' ? `~${oneWayDistanceKm} km each way` : 'Corridor driving span'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#080d1a] border border-slate-800 p-2.5 rounded-xl flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg border shrink-0 ${
                      routeSummary.destinationArrivalSoc >= targetDestinationSoc
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : routeSummary.destinationArrivalSoc >= 15
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">
                        {tripType === 'two-way' ? 'Turnaround / Final SoC' : 'Destination Arrival'}
                      </span>
                      <span className={`text-xs sm:text-sm font-extrabold font-mono ${
                        routeSummary.destinationArrivalSoc >= targetDestinationSoc ? 'text-emerald-400' : 'text-cyan-300'
                      }`}>
                        {tripType === 'two-way' 
                          ? `${routeSummary.destinationArrivalSoc}% / ${routeSummary.returnArrivalSoc}%` 
                          : `${routeSummary.destinationArrivalSoc}% SoC`}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block">
                        Goal: {targetDestinationSoc}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Low SoC Warning Banner */}
              {!loading && routeSummary.hasLowSocWarning && (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-amber-200 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-300 uppercase tracking-wider block font-mono text-[11px]">
                      ⚠️ Low Battery Level Warning On Route
                    </span>
                    <p className="leading-relaxed text-[11.5px]">
                      With your selected starting charge of <strong className="text-white">{startingSoc}%</strong>, battery SoC drops low before reaching some stops.
                    </p>
                    <p className="text-[10.5px] text-amber-300/90 font-mono pt-0.5">
                      💡 Tip: Increase your starting charge to at least <strong className="text-emerald-400 font-bold">{routeSummary.recommendedMinStartingSoc}% SoC</strong> or adjust stops.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Results Display Area */}
          <div className="flex-grow bg-[#090e1a]/85 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-full">
            <div className="absolute inset-0 bg-[#05070a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

            {loading ? (
              /* Loading skeletal structure */
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 relative z-10 my-8">
                <Compass className="h-10 w-10 text-cyan-400 animate-spin" />
                <div className="text-center space-y-1">
                  <span className="block text-xs font-mono tracking-widest text-slate-500 uppercase">CALCULATING ROUTE FEASIBILITY</span>
                  <p className="text-xs text-slate-300 font-sans">
                    Analyzing starting charge, distances, and optimal Tesla Supercharger hubs for your {tripType === 'two-way' ? 'round trip' : 'journey'}...
                  </p>
                </div>
              </div>
            ) : !origin || !destination ? (
              /* Landing state guide when empty */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10 max-w-md mx-auto space-y-5 my-12">
                <div className="bg-cyan-500/10 p-5 rounded-3xl border border-cyan-500/20 text-cyan-400 animate-pulse">
                  <Navigation className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-sans">
                    NACS Smart Itinerary & Battery Planner
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5 font-sans">
                    Choose a predefined route above (try <strong>Waterloo to Guelph</strong> for short trips) or enter your custom cities to calculate exact arrival charge and required charging stops for one-way and two-way round trips.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 py-1.5 px-4 rounded-full border border-cyan-500/20 uppercase tracking-wide">
                  Ready with ISO 15118 Plug & Charge & Custom Battery Goals
                </div>
              </div>
            ) : routeSummary.isDirectRoute ? (
              /* ZERO STOPS REQUIRED VIEW: Dedicated, interactive experience for direct trips! */
              <div className="p-6 sm:p-8 space-y-6 relative z-10">
                
                {/* Main Hero Card: Direct Trip Confirmed */}
                <div className="bg-gradient-to-r from-emerald-950/40 via-[#0a1624] to-cyan-950/30 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-500/15 p-3 rounded-2xl border border-emerald-500/30 text-emerald-400 shrink-0">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Zero Charging Stops Needed
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {tripType === 'two-way' ? 'Direct Round-Trip Feasible' : 'Direct Drive Feasible'}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">
                          No charging stops are required for this {tripType === 'two-way' ? 'round trip' : 'trip'}!
                        </h3>
                        <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-2xl pt-1 font-sans">
                          Starting at <strong className="text-emerald-400 font-mono font-bold">{startingSoc}% State of Charge (SoC)</strong> in your 2026 Toyota bZ gives you approximately <strong className="text-emerald-300 font-mono">{startingRangeKm} km ({startingRangeMiles} miles)</strong> of real-world range. This is more than sufficient to cover this {tripType === 'two-way' ? 'round-trip' : 'short'} <strong className="text-white font-mono">~{totalDistanceKm} km (~{routeSummary.totalDistanceMiles} miles)</strong> route between {origin} and {destination} without any mandatory stops.
                        </p>
                      </div>
                    </div>

                    {/* Arrival Stat Pill */}
                    <div className="bg-[#070c17] border border-emerald-500/30 p-4 rounded-xl text-center shrink-0 min-w-[170px] self-stretch md:self-auto flex flex-col justify-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">
                        {tripType === 'two-way' ? 'Final Return Arrival SoC' : 'Estimated Arrival SoC'}
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono my-0.5">
                        {tripType === 'two-way' ? `${routeSummary.returnArrivalSoc}%` : `${routeSummary.destinationArrivalSoc}%`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tripType === 'two-way' && `(Midpoint at ${destination}: ${routeSummary.destinationArrivalSoc}%)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Destination Goal Box: What is your desired % of charge after reaching destination? */}
                <div className="bg-[#0d1424] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400 shrink-0">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                        Need extra charge after reaching {destination}?
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">
                        If you need a higher battery level upon arrival (for example, <strong className="text-cyan-300">85% SoC</strong> for a return trip, local driving, or onward journey without destination charging), choose or enter your desired arrival percentage below:
                      </p>
                    </div>
                  </div>

                  {/* Interactive Target SoC Selection Buttons */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">Quick Destination Target:</span>
                      {[
                        { label: `${routeSummary.directArrivalSoc}% (Direct Arrival)`, val: routeSummary.directArrivalSoc },
                        { label: '50% SoC', val: 50 },
                        { label: '70% SoC', val: 70 },
                        { label: '80% SoC', val: 80 },
                        { label: '85% SoC (e.g. Return Trip)', val: 85 },
                        { label: '90% SoC (Full Boost)', val: 90 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setTargetDestinationSoc(item.val)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                            targetDestinationSoc === item.val
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-extrabold scale-105'
                              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 border-slate-850'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Feedback Callout */}
                    <div className="text-[11.5px] font-sans text-slate-400 bg-[#070b14] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                      <span>
                        Current Destination Goal: <strong className="text-cyan-400 font-mono font-bold">{targetDestinationSoc}% SoC</strong>.
                        {targetDestinationSoc <= routeSummary.directArrivalSoc ? (
                          <span className="text-emerald-400 font-medium ml-1">
                            ✓ Your direct arrival of {routeSummary.directArrivalSoc}% already satisfies this goal without stopping.
                          </span>
                        ) : (
                          <span className="text-cyan-300 font-medium ml-1">
                            ℹ️ Setting a target above {routeSummary.directArrivalSoc}% will automatically generate an optimized stop along the corridor.
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Collapsible: Nearby Corridor Superchargers */}
                {filteredStations.length > 0 && (
                  <div className="border border-slate-800/80 rounded-2xl bg-[#070b14]/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowOptionalStations(!showOptionalStations)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Compass className="h-4 w-4 text-cyan-400" />
                        <span className="font-bold uppercase tracking-wider">
                          View {filteredStations.length} Nearby Tesla Superchargers along corridor (Optional Contingency)
                        </span>
                      </div>
                      {showOptionalStations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showOptionalStations && (
                      <div className="p-4 border-t border-slate-850 divide-y divide-slate-850 space-y-2">
                        <p className="text-[11px] text-slate-400 font-sans pb-2">
                          These stations are located along the route if you decide to make an unscheduled stop or need unexpected charging:
                        </p>
                        {filteredStations.map((station, idx) => (
                          <div 
                            key={station.id} 
                            onClick={() => setSelectedStationId(station.id)}
                            className="pt-2 flex items-center justify-between text-xs cursor-pointer hover:text-cyan-400 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">#{idx + 1}</span>
                              <div>
                                <span className="font-bold text-slate-200">{station.name}</span>
                                <span className="text-[10px] text-slate-500 block font-mono">{station.address}</span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-[11px]">
                              <span className="text-cyan-400 font-bold">{station.speedKw} kW</span>
                              <span className="text-slate-500 block text-[10px]">{station.availableStalls}/{station.totalStalls} open</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : routeSummary.stops.length === 0 ? (
              /* No matching filters helper */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm mx-auto my-8">
                <SlidersHorizontal className="h-9 w-9 text-yellow-500 stroke-[1.5]" />
                <div className="space-y-1.5 font-sans">
                  <h4 className="text-xs font-extrabold text-white uppercase">Your filter options are too narrow</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    No stations match your criteria. Try to switch off NACS Native filters or decrease the required available stalls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterPnC(false);
                    setFilterNacsOnly(false);
                    setMinStallsAvailable(1);
                    setMinPowerKw(100);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all font-mono cursor-pointer"
                >
                  Reset parameters to default
                </button>
              </div>
            ) : (
              /* REQUIRED / PLANNED CHARGING STOPS TABLE (When charging is needed for trip or destination target) */
              <div className="flex-grow overflow-auto relative z-10 select-none scrollbar-thin">
                
                {/* Banner when stops are planned to meet targetDestinationSoc */}
                {targetDestinationSoc > routeSummary.directArrivalSoc && (
                  <div className="bg-cyan-950/30 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-cyan-300">
                      <Target className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>
                        Charging plan calculated to guarantee at least <strong className="text-white font-mono font-bold">{targetDestinationSoc}% SoC</strong> upon arriving in <strong className="text-white">{destination}</strong>.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Custom Target Plan
                    </span>
                  </div>
                )}

                {/* Standard robust HTML Table View for large viewports */}
                <table className="w-full text-left border-collapse text-xs select-text hidden md:table font-sans">
                  <thead>
                    <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-mono tracking-wide text-[10px] uppercase">
                      <th className="py-4 pl-6 pr-3 font-bold text-center w-14">Stop</th>
                      <th className="py-4 px-3 font-bold">Tesla Supercharger Station</th>
                      {tripType === 'two-way' && <th className="py-4 px-3 font-bold text-center">Leg</th>}
                      <th className="py-4 px-3 font-bold text-center">Arrival Charge (% SoC)</th>
                      <th className="py-4 px-3 font-bold text-center">Required Charge</th>
                      <th className="py-4 px-3 font-bold text-center">Est. Charge Time</th>
                      <th className="py-4 px-3 font-bold text-center">Peak Speed</th>
                      <th className="py-4 px-3 font-bold text-center">Pricing / Stalls</th>
                      <th className="py-4 pr-6 pl-3 font-bold">NACS Auto-Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-950/15">
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
                          onClick={() => setSelectedStationId(station.id)}
                          className={`hover:bg-cyan-500/10 cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-cyan-950/20 text-white' : 'text-slate-300'
                          }`}
                        >
                          {/* Circle stop sequence */}
                          <td className="py-4 pl-6 pr-3 text-center">
                            <span className={`inline-flex items-center justify-center font-mono font-extrabold text-[11.5px] rounded-full h-7 w-7 border ${
                              isSelected 
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25' 
                                : isReturnLeg
                                ? 'bg-purple-900/60 text-purple-200 border-purple-500/40'
                                : 'bg-[#111724] text-slate-400 border-slate-850'
                            }`}>
                              {index + 1}
                            </span>
                          </td>

                          {/* Station details */}
                          <td className="py-4 px-3">
                            <div className="font-extrabold text-slate-100 flex items-center gap-1.5">
                              <span>{station.name}</span>
                              {station.chargerType === 'V4 Supercharger' && (
                                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                                  V4 350kW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                              <span>{station.address}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-cyan-400/80">+{stop.distanceFromPrevMiles} mi from prev point</span>
                            </div>
                            {stop.stopReason && (
                              <div className="text-[10px] text-cyan-300 font-mono mt-1 font-semibold flex items-center gap-1">
                                <Target className="w-3 h-3 text-cyan-400" />
                                {stop.stopReason}
                              </div>
                            )}
                          </td>

                          {/* Two-way Leg Badge */}
                          {tripType === 'two-way' && (
                            <td className="py-4 px-3 text-center">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isReturnLeg
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              }`}>
                                {isReturnLeg ? 'Return Leg' : 'Outbound Leg'}
                              </span>
                            </td>
                          )}

                          {/* Arrival Battery SoC */}
                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex items-center space-x-1.5">
                              <span className={`font-mono font-extrabold text-xs sm:text-[13px] px-2 py-0.5 rounded-lg border ${
                                stop.arrivalCritical
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                  : stop.arrivalWarning
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              }`}>
                                {arrivalSoc}% SoC
                              </span>
                            </div>
                            {stop.arrivalWarning && (
                              <span className="block text-[9px] font-mono text-amber-400 mt-0.5">
                                Low Buffer
                              </span>
                            )}
                          </td>

                          {/* Required Departure SoC */}
                          <td className="py-4 px-3 text-center">
                            {chargeNeededPercent > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono font-black text-cyan-300 text-xs sm:text-[13px] block">
                                  Charge to {targetDepartureSoc}%
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400/80 block">
                                  (+{chargeNeededPercent}% boost)
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Pass-through (+0%)
                              </span>
                            )}
                          </td>

                          {/* Charging duration */}
                          <td className="py-4 px-3 text-center font-mono">
                            {estimatedChargeMinutes > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-white text-xs sm:text-[13px] flex items-center justify-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                                  ~{estimatedChargeMinutes} mins
                                </span>
                                <span className="text-[9px] text-slate-400 block font-sans">
                                  10-150kW taper
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">0 mins</span>
                            )}
                          </td>

                          {/* Speed */}
                          <td className="py-4 px-3 text-center font-mono">
                            <span className="font-extrabold text-cyan-400 text-xs">
                              {station.speedKw} kW
                            </span>
                            <span className="block text-[9px] text-slate-500 uppercase font-sans">
                              {station.chargerType}
                            </span>
                          </td>

                          {/* Stalls and pricing */}
                          <td className="py-4 px-3 text-center font-mono">
                            <span className="font-bold text-white block">
                              ${station.costPerKwh.toFixed(2)}/kWh
                            </span>
                            <span className={`text-[10px] font-bold ${
                              station.availableStalls > 4 
                                ? 'text-emerald-400' 
                                : station.availableStalls > 0 
                                ? 'text-amber-400' 
                                : 'text-red-400'
                            }`}>
                              {station.availableStalls}/{station.totalStalls} open
                            </span>
                          </td>

                          {/* NACS Auto-billing */}
                          <td className="py-4 pr-6 pl-3">
                            <div className="flex items-center space-x-1.5">
                              {station.plugAndCharge ? (
                                <span className="inline-flex items-center text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold whitespace-nowrap">
                                  <Check className="h-3 w-3 mr-1" />
                                  ISO 15118 Autocharge
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  Toyota App Auth
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                              Direct to Toyota Wallet
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Cards fallback */}
                <div className="md:hidden divide-y divide-slate-800">
                  {routeSummary.stops.map((stop, index) => {
                    const station = stop.station;
                    const isSelected = selectedStationId === station.id;
                    const arrivalSoc = stop.arrivalSoc;
                    const targetDepartureSoc = stop.targetDepartureSoc;
                    const chargeNeededPercent = stop.chargeNeededPercent;
                    const estimatedChargeMinutes = stop.estimatedChargeMinutes;
                    const isReturnLeg = stop.legType === 'return';

                    return (
                      <div 
                        key={`${station.id}-${index}`}
                        onClick={() => setSelectedStationId(station.id)}
                        className={`p-4 space-y-3 font-sans ${
                          isSelected ? 'bg-cyan-950/20' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className={`inline-flex items-center justify-center font-mono font-extrabold text-xs rounded-full h-6 w-6 ${
                              isReturnLeg ? 'bg-purple-600 text-white' : 'bg-cyan-500 text-slate-950'
                            }`}>
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-slate-100 text-sm">{station.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-mono">{station.address}</span>
                                {tripType === 'two-way' && (
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                    isReturnLeg ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                                  }`}>
                                    {isReturnLeg ? 'Return' : 'Outbound'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-cyan-400 font-bold text-xs">{station.speedKw} kW</span>
                        </div>

                        {/* Telemetry chips on mobile */}
                        <div className="grid grid-cols-3 gap-2 text-center bg-[#070b14] p-2.5 rounded-xl border border-slate-800/80 font-mono">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Arrival</span>
                            <span className={`font-black text-xs ${
                              stop.arrivalWarning ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {arrivalSoc}% SoC
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Needed</span>
                            <span className="font-black text-cyan-300 text-xs">
                              {chargeNeededPercent > 0 ? `To ${targetDepartureSoc}%` : '0%'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">Time</span>
                            <span className="font-black text-white text-xs">
                              ~{estimatedChargeMinutes}m
                            </span>
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

        {/* Interactive Highway Corridor Map View at Bottom of Page */}
        {originCoords && destCoords && (
          <RouteMap
            originName={origin || "Origin"}
            destinationName={destination || "Destination"}
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
          />
        )}

      </main>

    </div>
  );
}
