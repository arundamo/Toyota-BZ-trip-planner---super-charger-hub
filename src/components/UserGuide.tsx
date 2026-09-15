import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Zap,
  MapPin,
  Navigation,
  RotateCw,
  Layers,
  Battery,
  SlidersHorizontal,
  Crosshair,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Car,
  Search,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  Compass,
  Cpu,
  Smartphone,
  Flame,
  Award
} from 'lucide-react';
import { VehicleSpecs, DistanceUnit } from '../types';
import { formatRange, formatDistance } from '../utils/unitConverter';

interface UserGuideProps {
  specs: VehicleSpecs;
  unit?: DistanceUnit;
  onToggleUnit?: (unit: DistanceUnit) => void;
  onNavigateToPlanner: (preset?: { origin: string; destination: string }) => void;
}

interface GuideSection {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  badge?: string;
  content: React.ReactNode;
}

export const UserGuide: React.FC<UserGuideProps> = ({ specs, onNavigateToPlanner }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>('quickstart');

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'start', label: '🚀 Getting Started' },
    { id: 'bz2026', label: '✨ 2026 bZ Updates' },
    { id: 'features', label: '⚡ Core Features' },
    { id: 'nacs', label: '🔌 NACS & Supercharging' },
    { id: 'battery', label: '🔋 Battery & Range' },
    { id: 'faq', label: '❓ FAQ & Tips' }
  ];

  const guideSections: GuideSection[] = useMemo(() => [
    {
      id: 'bz2026-naming-updates',
      title: '2026 Model Year Updates: Toyota Drops "4X" & Boosts Range',
      category: 'bz2026',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      summary: 'Toyota officially streamlined the name to "Toyota bZ", added a 74.7 kWh pack (up to 314 mi range), 338 HP AWD, and the rugged Woodland Edition.',
      badge: '2026 News',
      content: (
        <div className="space-y-6 text-sm text-slate-300">
          <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Official 2026 Toyota bZ Transformation</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              For the 2026 model year in North America, Toyota officially <strong>dropped the "4X" suffix</strong>, rebranding the electric crossover to simply the <strong>Toyota bZ</strong>. Alongside the simplified nomenclature, Toyota delivered major technical enhancements across battery capacity, EPA range, motor horsepower, and native charging compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Battery className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">Extended Range (Up to 314 Miles)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The 2026 bZ introduces a new <strong>74.7 kWh battery pack</strong>, boosting EPA range to an impressive <strong>314 miles</strong> on the XLE FWD Plus trim (up from 252 miles on the prior generation). A standard 57.7 kWh pack remains available for city driving.
              </p>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-sm">Native NACS Fast Charging</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All 2026 Toyota bZ models feature a factory <strong>SAE J3400 (NACS)</strong> port, eliminating the need for physical adapters at Tesla Superchargers with 10% to 80% DC fast charging in approximately 30 minutes.
              </p>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-white text-sm">338 Horsepower AWD Upgrade</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual-motor all-wheel-drive models received a massive power bump from 214 HP to <strong>338 combined HP</strong>, achieving 0-60 mph acceleration in just 4.9 seconds with Subaru-engineered X-MODE terrain management.
              </p>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">All-New bZ Woodland Edition</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toyota introduced the extended-length <strong>bZ Woodland</strong> adventure trim, boasting <strong>375 HP</strong> (0-60 in 4.4s), 8.4 inches of ground clearance, 3,500 lbs towing capacity, and 74.3 cu ft of maximum cargo capacity.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono text-cyan-400">
              2026 Toyota bZ Trim Matrix Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3">2026 Model Trim</th>
                    <th className="py-2 px-3">Battery</th>
                    <th className="py-2 px-3">EPA Range</th>
                    <th className="py-2 px-3">Horsepower</th>
                    <th className="py-2 pl-3">Port</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ XLE FWD Plus</td>
                    <td className="py-2 px-3">74.7 kWh</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">314 mi (505 km)</td>
                    <td className="py-2 px-3">221 HP</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ Limited FWD</td>
                    <td className="py-2 px-3">74.7 kWh</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">299 mi (481 km)</td>
                    <td className="py-2 px-3">221 HP</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ XLE AWD</td>
                    <td className="py-2 px-3">74.7 kWh</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">288 mi (463 km)</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">338 HP (Dual Motor)</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ Limited AWD</td>
                    <td className="py-2 px-3">74.7 kWh</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">278 mi (447 km)</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">338 HP (Dual Motor)</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ Woodland AWD</td>
                    <td className="py-2 px-3">74.7 kWh</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">281 mi (452 km)</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">375 HP (0-60: 4.4s)</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-white">bZ XLE FWD Standard</td>
                    <td className="py-2 px-3">57.7 kWh</td>
                    <td className="py-2 px-3 text-slate-300">236 mi (380 km)</td>
                    <td className="py-2 px-3">201 HP</td>
                    <td className="py-2 pl-3 text-emerald-400 font-bold">Native NACS</td>
                  </tr>
                  <tr className="text-slate-400 bg-slate-900/40">
                    <td className="py-2 pr-3 italic">bZ4X (2023–2025 Legacy)</td>
                    <td className="py-2 px-3">71.4–72.8 kWh</td>
                    <td className="py-2 px-3">222–252 mi</td>
                    <td className="py-2 px-3">201–214 HP</td>
                    <td className="py-2 pl-3 text-amber-400">CCS1 + Adapter</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quickstart',
      title: 'Quick Start: Plan Your First Supercharged EV Route',
      category: 'start',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      summary: 'Learn how to plan a trip with automatic Supercharger recommendations in under 30 seconds.',
      badge: 'Essential',
      content: (
        <div className="space-y-6 text-sm text-slate-300">
          <p className="leading-relaxed">
            The <strong>Toyota bZ Supercharge Hub</strong> is purpose-built to eliminate range anxiety and plan precision charging stops along any highway corridor in North America for your 2026 Toyota bZ EV.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Set Origin & Destination</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type any city, street address, or POI. Use the <strong>GPS Target</strong> button to instantly detect your current location.
              </p>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Configure Battery & Stops</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your current battery percentage (SoC), target arrival reserve (default 20%), and trip mode (One-Way or Two-Way Round Trip).
              </p>
            </div>

            <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Review Route Telemetry</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect estimated arrival battery, charging duration at each Tesla Supercharger, stall availability, and total journey time.
              </p>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Want to test immediately?
              </span>
              <p className="text-xs text-slate-300">
                Load one of our pre-configured corridor routes with verified Tesla Superchargers:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigateToPlanner({ origin: 'Waterloo, ON', destination: 'Guelph, ON' })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Waterloo ➔ Guelph
              </button>
              <button
                onClick={() => onNavigateToPlanner({ origin: 'Toronto, ON', destination: 'Montreal, QC' })}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Toronto ➔ Montreal
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'address-lookup-gps',
      title: 'Address Lookup, Autocomplete & GPS Location',
      category: 'features',
      icon: <MapPin className="w-4 h-4 text-cyan-400" />,
      summary: 'How real-time address suggestion, categorization badges, and GPS coordinates work.',
      content: (
        <div className="space-y-5 text-sm text-slate-300">
          <p className="leading-relaxed">
            The input bar includes an intelligent autocomplete engine that resolves place names, full street addresses, and geographic hubs across North America with live coordinates.
          </p>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              1. Using Your Current GPS Location
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the <strong>Crosshair (GPS) icon</strong> located inside either the departure or destination input, or pick the first item in the dropdown labelled <strong>"Use Current Location"</strong>. The app will:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-2">
              <li>Request standard browser geolocation access.</li>
              <li>Obtain high-precision GPS coordinates (latitude & longitude).</li>
              <li>Perform reverse geocoding to resolve your nearest municipality and postal address.</li>
              <li>Automatically update the route calculation with your current geographic position.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              2. Categorized Lookup Suggestions
            </h4>
            <p className="text-xs text-slate-400">
              As you type at least 2 characters, the lookup menu organizes results with clear badges:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0c1220] border border-slate-800 rounded-xl flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-1.5 py-0.5 rounded uppercase shrink-0">
                  CITY
                </span>
                <div>
                  <strong className="text-white block">Metropolitan & Municipal Hubs</strong>
                  <span className="text-slate-400 text-[11px]">Primary geographic corridor anchors (e.g., Waterloo, ON; Toronto, ON; Austin, TX).</span>
                </div>
              </div>
              <div className="p-3 bg-[#0c1220] border border-slate-800 rounded-xl flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40 px-1.5 py-0.5 rounded uppercase shrink-0">
                  SUPERCHARGER
                </span>
                <div>
                  <strong className="text-white block">Tesla Supercharger Sites</strong>
                  <span className="text-slate-400 text-[11px]">Direct hub search allowing you to route straight to specific charging plazas.</span>
                </div>
              </div>
              <div className="p-3 bg-[#0c1220] border border-slate-800 rounded-xl flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded uppercase shrink-0">
                  ADDRESS
                </span>
                <div>
                  <strong className="text-white block">Exact Street Addresses</strong>
                  <span className="text-slate-400 text-[11px]">Specific street numbers, avenues, and highway junctions.</span>
                </div>
              </div>
              <div className="p-3 bg-[#0c1220] border border-slate-800 rounded-xl flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold bg-purple-950/60 text-purple-400 border border-purple-800/40 px-1.5 py-0.5 rounded uppercase shrink-0">
                  POI
                </span>
                <div>
                  <strong className="text-white block">Points of Interest</strong>
                  <span className="text-slate-400 text-[11px]">Hotels, airports, shopping centers, and highway service plazas.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'trip-modes-stops',
      title: 'Trip Modes: One-Way, Round Trip & Custom Stops',
      category: 'features',
      icon: <RotateCw className="w-4 h-4 text-amber-400" />,
      summary: 'Configure one-way vs round trips, turnaround destination charging, and custom stop counts.',
      content: (
        <div className="space-y-5 text-sm text-slate-300">
          <p className="leading-relaxed">
            EV road trips differ based on whether you plan to recharge at your destination or return immediately. The planner accommodates both scenarios with custom charging stop controls.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b101e] border border-cyan-500/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-sm">One-Way Trip Mode</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates the direct corridor from Origin to Destination. Stations are chosen to ensure you reach the destination with at least your configured <strong>Target Destination SoC</strong> (e.g. 20%).
              </p>
            </div>

            <div className="bg-[#0b101e] border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <RotateCw className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">Two-Way (Round Trip) Mode</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates total energy required for outbound and return legs. Essential for day trips where you turnaround without an overnight stay.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Charging Stops Selector Modes
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  ⚡ Auto (Optimal)
                </span>
                <p className="text-slate-400 flex-1">
                  The smart routing engine calculates the mathematically fewest stops needed, optimizing both driving time and charging curve speed.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  0 Stops (Direct)
                </span>
                <p className="text-slate-400 flex-1">
                  Validates whether your current battery level is sufficient to complete the trip without stopping at a DC fast charger.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  1, 2, 3+ Stops
                </span>
                <p className="text-slate-400 flex-1">
                  Allows you to enforce preferred rest stops or break up long driving stretches across shorter, 15-minute high-speed charging intervals.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'nacs-supercharging',
      title: 'Tesla Supercharger & NACS Plug & Charge Guide',
      category: 'nacs',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      summary: 'Details on the North American Charging Standard, ISO 15118 Plug & Charge, and V3/V4 Superchargers.',
      badge: 'Toyota bZ 2026',
      content: (
        <div className="space-y-5 text-sm text-slate-300">
          <p className="leading-relaxed">
            The <strong>2026 Toyota bZ</strong> comes equipped natively with the <strong>North American Charging Standard (NACS / SAE J3400)</strong> inlet, giving you direct, adapter-free access to over 15,000+ Tesla Superchargers across the United States and Canada.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090e1b] border border-cyan-500/30 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-sm">ISO 15118 Plug & Charge</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                No apps, RFID cards, or credit card swipes needed at the stall. Once your Toyota App account is linked, simply plug the Tesla Supercharger connector into your bZ inlet. Cryptographic TLS authentication negotiates billing and starts charging in under 10 seconds.
              </p>
            </div>

            <div className="p-4 bg-[#090e1b] border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-sm">V3 & V4 Supercharger Compatibility</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compatible with Tesla V3 (250 kW) and V4 (350 kW) Superchargers. Older V2 (150 kW) stalls utilize proprietary Tesla communication and are automatically filtered out to ensure you only route to compatible sites.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono text-cyan-400">
              Toyota bZ Charging Curve Optimization
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#0e1422] rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block">Peak DC Rate</span>
                <span className="text-cyan-300 font-extrabold text-sm">{specs.maxChargeRateKw} kW</span>
              </div>
              <div className="p-2.5 bg-[#0e1422] rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block">10% - 80% Time</span>
                <span className="text-emerald-400 font-extrabold text-sm">~28 Mins</span>
              </div>
              <div className="p-2.5 bg-[#0e1422] rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block">Usable Pack</span>
                <span className="text-white font-extrabold text-sm">{specs.batteryCapacityKwh} kWh</span>
              </div>
              <div className="p-2.5 bg-[#0e1422] rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block">EPA Range</span>
                <span className="text-cyan-300 font-extrabold text-sm">{specs.estimatedRangeMiles} mi (~405 km)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Pro-Tip:</strong> For fastest travel times, arrive at Superchargers with 10%–20% battery remaining and unplug around 70%–80%. The battery takes maximum current (up to 150 kW) below 60%, whereas the rate tapers down significantly above 80% to protect cell longevity.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'battery-range-buffers',
      title: 'Battery SoC, Target Buffers & Range Telemetry',
      category: 'battery',
      icon: <Battery className="w-4 h-4 text-emerald-400" />,
      summary: 'Understanding departure SoC, arrival reserve buffers, and highway consumption modeling.',
      content: (
        <div className="space-y-5 text-sm text-slate-300">
          <p className="leading-relaxed">
            Real-world EV range varies with highway driving speed, terrain elevation, and climate control usage. The application uses a dynamic consumption model calibrated for the Toyota bZ architecture (~31.5 kWh/100 miles at highway speeds).
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" />
                Departure State of Charge (SoC) Slider
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set your vehicle's current battery percentage before departing. If you start from home with 80% or 100%, adjust the slider to see how far you can drive before the first charging stop is required.
              </p>
            </div>

            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Target Destination Reserve Buffer
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ensure you don't arrive with 0% battery. Setting a <strong>20% Target Destination SoC</strong> guarantees you have enough range when you arrive at your destination to drive locally, run errands, or reach a Level 2 hotel charger without immediate DC fast charging panic.
              </p>
            </div>

            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Dynamic KM ⇄ Miles Unit Switcher (Metric / Imperial)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly toggle between <strong>Miles</strong> and <strong>Kilometers (KM)</strong> anywhere using the header switch pill or vehicle stats card. All route driving distances, vehicle range badges, delta distances from previous stops, and EPA ratings dynamically convert across the entire application—ideal for Canadian and US cross-border corridors (like Toronto–Montreal or Buffalo–Detroit).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faqs-and-tips',
      title: 'Frequently Asked Questions & Road Trip Tips',
      category: 'faq',
      icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
      summary: 'Answers to top questions regarding charging costs, cold weather, and adapter rules.',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <div className="space-y-3 divide-y divide-slate-850">
            <div className="pt-2 space-y-1.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Do I need a physical adapter to use Tesla Superchargers with the 2026 Toyota bZ?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                No. The 2026 Toyota bZ comes with a native NACS charge port. You simply pull the Tesla Supercharger cable directly off the holster and insert it into your vehicle's charge port.
              </p>
            </div>

            <div className="pt-3 space-y-1.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                How are charging sessions billed?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                Billing is handled seamlessly through the linked credit card on your Toyota App / Toyota Connected Services account via ISO 15118 Plug & Charge, with detailed receipts generated automatically.
              </p>
            </div>

            <div className="pt-3 space-y-1.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Can I charge at Magic Dock Supercharger locations?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                Yes. Magic Dock locations support both native NACS and CCS vehicles. Since your 2026 bZ has native NACS, it uses the NACS connector directly.
              </p>
            </div>

            <div className="pt-3 space-y-1.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                What if GPS address lookup fails or is blocked?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">
                Ensure browser location permissions are enabled in your browser settings (look for the lock icon in your URL bar). You can also manually type any city or postal code, or select one of the instant corridor presets.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-950/20 border border-purple-800/30 rounded-2xl space-y-2">
            <h4 className="font-bold text-purple-300 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Highway EV Road Tripping Best Practices
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              <li><strong>Precondition your battery:</strong> Use the Toyota in-car navigation to navigate to the chosen Supercharger so your battery pre-warms for maximum charging speed.</li>
              <li><strong>Charge between 10% and 75%:</strong> This is the steepest part of the charging curve and yields the most miles added per minute.</li>
              <li><strong>Keep 15–20% buffer:</strong> Wind resistance, low temperatures, and steep grades reduce highway range by 10–15%.</li>
            </ul>
          </div>
        </div>
      )
    }
  ], [specs, onNavigateToPlanner]);

  // Filter sections based on search query and category
  const filteredSections = useMemo(() => {
    return guideSections.filter(section => {
      const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [guideSections, activeCategory, searchQuery]);

  const activeSection = useMemo(() => {
    return guideSections.find(s => s.id === activeSectionId) || guideSections[0];
  }, [guideSections, activeSectionId]);

  return (
    <div className="flex flex-col space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-[#0d1424] via-[#090e1c] to-[#0a1222] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-cyan-950/60 border border-cyan-800/50 px-3 py-1 rounded-full text-cyan-300 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Official Guide & Documentation</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Toyota bZ Supercharge Hub <span className="text-cyan-400">User Guide</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-350 leading-relaxed font-sans">
            Comprehensive manual for planning routes, utilizing the North American Charging Standard (NACS), automating Plug & Charge billing, and optimizing battery telemetry for the 2026 Toyota bZ.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateToPlanner()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Back to Route Planner</span>
            </button>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setActiveSectionId('quickstart');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            >
              View Quick Start
            </button>
          </div>
        </div>
      </section>

      {/* 2. Search & Category Filter Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'bg-[#0a0f1d] border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Guide Search Box */}
        <div className="relative min-w-[260px] sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guide topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b101e] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Guide Main Grid: Sidebar + Article View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Topic Table of Contents */}
        <div className="lg:col-span-4 bg-[#090d18] border border-slate-800/80 rounded-2xl p-3 space-y-2">
          <div className="px-3 py-2 text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
            Topics ({filteredSections.length})
          </div>

          <div className="space-y-1.5">
            {filteredSections.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-white'
                      : 'hover:bg-slate-900/80 border border-transparent text-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-400'
                  }`}>
                    {section.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                        {section.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-sans leading-relaxed">
                      {section.summary}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No guide topics match "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Section Deep-Dive Article */}
        <div className="lg:col-span-8 bg-[#090e1c] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                {activeSection.category.toUpperCase()}
              </span>
              {activeSection.badge && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/30">
                  {activeSection.badge}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              {activeSection.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
              {activeSection.summary}
            </p>
          </div>

          {/* Section Body */}
          <div className="space-y-4">
            {activeSection.content}
          </div>

          {/* Bottom Action Card inside Article */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400 font-mono">
              Ready to test this feature?
            </div>
            <button
              onClick={() => onNavigateToPlanner()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Open Route Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
