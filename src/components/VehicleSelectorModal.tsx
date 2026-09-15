import React, { useState } from 'react';
import {
  Car,
  Zap,
  Battery,
  ShieldCheck,
  Cpu,
  Sliders,
  RotateCcw,
  Check,
  Sparkles,
  ThermometerSnowflake,
  Package,
  Info,
  X,
  ChevronRight,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { VehicleSpecs, DistanceUnit } from '../types';
import { TOYOTA_BZ_CATALOG, getEffectiveVehicleRange } from '../data/toyotaModels';
import { formatRange, formatDistance, convertDistance } from '../utils/unitConverter';

interface VehicleSelectorModalProps {
  currentSpecs: VehicleSpecs;
  unit?: DistanceUnit;
  onToggleUnit?: (unit: DistanceUnit) => void;
  onSelectVehicle: (specs: VehicleSpecs) => void;
  onClose: () => void;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({
  currentSpecs,
  unit = 'miles' as DistanceUnit,
  onToggleUnit,
  onSelectVehicle,
  onClose
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentSpecs.id || TOYOTA_BZ_CATALOG[0].id);
  const [activeTab, setActiveTab] = useState<'catalog' | 'customizer'>('catalog');
  
  // Customization Form State initialized with currentSpecs
  const [customSpecs, setCustomSpecs] = useState<VehicleSpecs>({
    ...currentSpecs,
    weatherCondition: currentSpecs.weatherCondition || 'optimal',
    cargoLoad: currentSpecs.cargoLoad || 'normal'
  });

  const selectedCatalogModel = TOYOTA_BZ_CATALOG.find(m => m.id === selectedId) || TOYOTA_BZ_CATALOG[0];

  // Calculate live effective range for custom specs
  const effectiveData = getEffectiveVehicleRange(customSpecs);

  const handleSelectCatalogItem = (model: VehicleSpecs) => {
    setSelectedId(model.id);
    setCustomSpecs({
      ...model,
      weatherCondition: customSpecs.weatherCondition || 'optimal',
      cargoLoad: customSpecs.cargoLoad || 'normal'
    });
  };

  const handleApplyPreset = (model: VehicleSpecs) => {
    onSelectVehicle({
      ...model,
      weatherCondition: customSpecs.weatherCondition || 'optimal',
      cargoLoad: customSpecs.cargoLoad || 'normal'
    });
    onClose();
  };

  const handleApplyCustom = () => {
    onSelectVehicle({
      ...customSpecs,
      isCustom: true
    });
    onClose();
  };

  const handleResetToCatalog = () => {
    const fresh = TOYOTA_BZ_CATALOG.find(m => m.id === selectedId) || TOYOTA_BZ_CATALOG[0];
    setCustomSpecs({
      ...fresh,
      weatherCondition: 'optimal',
      cargoLoad: 'normal'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#090e1b] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* 1. Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Toyota Beyond Zero Lineup
                </span>
                {customSpecs.isCustom && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    Custom Tuning Active
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
                Select & Customize Your Toyota bZ Model
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Unit Toggle inside Modal Header */}
            {onToggleUnit && (
              <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onToggleUnit('miles')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    unit === 'miles'
                      ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Miles
                </button>
                <button
                  type="button"
                  onClick={() => onToggleUnit('km')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    unit === 'km'
                      ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KM
                </button>
              </div>
            )}

            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Model Catalog ({TOYOTA_BZ_CATALOG.length})
              </button>
              <button
                onClick={() => setActiveTab('customizer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'customizer'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Custom Tuning</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'catalog' ? (
            /* TAB A: MODEL CATALOG LIST & PREVIEWS */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Model Catalog Cards */}
              <div className="md:col-span-7 space-y-2.5">
                {/* 2026 Toyota bZ Name Change & Upgrades Callout */}
                <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2026 TOYOTA bZ UPDATE: "4X" DROPPED FROM NAME</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Starting with the 2026 model year, Toyota officially simplified the name from <em>bZ4X</em> to simply <strong>Toyota bZ</strong>. The 2026 lineup introduces a 74.7 kWh extended pack (up to 314 mi EPA range), 338 HP AWD, the 375 HP Woodland Edition, and standard native NACS.
                  </p>
                </div>

                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-1 pt-1 flex items-center justify-between">
                  <span>Choose Factory Model & Trim</span>
                  <span className="text-[10px] text-slate-500 lowercase">({TOYOTA_BZ_CATALOG.length} models)</span>
                </div>

                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {TOYOTA_BZ_CATALOG.map((model) => {
                    const isSelected = selectedId === model.id;
                    const isCurrent = currentSpecs.id === model.id && !currentSpecs.isCustom;

                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectCatalogItem(model)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                            : 'bg-[#0b1120] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-extrabold text-white text-sm">
                              {model.model}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {model.trim}
                            </span>
                            {model.nacsNative ? (
                              <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.2 rounded">
                                NACS NATIVE
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/40 px-1.5 py-0.2 rounded">
                                CCS1 + ADAPTER
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 pt-0.5">
                            <span className="text-cyan-400 font-bold">
                              {unit === 'miles' 
                                ? `${model.estimatedRangeMiles} mi (${model.epaRangeKm || Math.round(model.estimatedRangeMiles * 1.60934)} km)` 
                                : `${model.epaRangeKm || Math.round(model.estimatedRangeMiles * 1.60934)} km (${model.estimatedRangeMiles} mi)`}
                            </span>
                            <span>•</span>
                            <span>{model.batteryCapacityKwh} kWh</span>
                            <span>•</span>
                            <span>Max {model.maxChargeRateKw} kW</span>
                            <span>•</span>
                            <span className="text-slate-300">{model.drivetrain}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {model.notes}
                          </p>
                        </div>

                        <div className="shrink-0 pt-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Model Deep-Dive & Quick Apply */}
              <div className="md:col-span-5 bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Selected Model Specs
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    MY {selectedCatalogModel.year}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-extrabold text-white">
                    Toyota {selectedCatalogModel.model}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedCatalogModel.trim}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">EPA Range</span>
                    <span className="text-sm font-extrabold text-cyan-300">
                      {formatRange(selectedCatalogModel.estimatedRangeMiles, unit)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ~{unit === 'miles' 
                        ? `${selectedCatalogModel.epaRangeKm || Math.round(selectedCatalogModel.estimatedRangeMiles * 1.60934)} km` 
                        : `${selectedCatalogModel.estimatedRangeMiles} mi`}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Battery Pack</span>
                    <span className="text-sm font-extrabold text-white">
                      {selectedCatalogModel.batteryCapacityKwh} kWh
                    </span>
                    <span className="text-[10px] text-slate-500 block">Usable: {selectedCatalogModel.usableCapacityKwh || selectedCatalogModel.batteryCapacityKwh} kWh</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Peak DC Speed</span>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {selectedCatalogModel.maxChargeRateKw} kW
                    </span>
                    <span className="text-[10px] text-slate-500 block">10-80% in ~28m</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Drivetrain</span>
                    <span className="text-sm font-extrabold text-purple-300">
                      {selectedCatalogModel.drivetrain}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{selectedCatalogModel.horsepowerHp} HP</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-1 text-xs">
                  <div className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inlet & Fast-Charge Protocol:</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {selectedCatalogModel.portTypeDescription}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleApplyPreset(selectedCatalogModel)}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply This Model to Route Planner</span>
                  </button>

                  <button
                    onClick={() => {
                      setCustomSpecs({ ...selectedCatalogModel });
                      setActiveTab('customizer');
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Customize These Parameters</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB B: INTERACTIVE CUSTOM TUNER & ENVIRONMENTAL LOAD */
            <div className="space-y-6">
              <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-white">Customized Vehicle Telemetry</span>
                  <p className="text-slate-400 leading-relaxed">
                    Fine-tune your vehicle's specific battery capacity, charging curve limits, ambient weather conditions, and cargo load. All calculations across the route planner will use these dynamic settings.
                  </p>
                </div>
              </div>

              {/* Customizer Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. Model Name / Trim Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Vehicle Label / Trim
                  </label>
                  <input
                    type="text"
                    value={customSpecs.trim}
                    onChange={(e) => setCustomSpecs({ ...customSpecs, trim: e.target.value })}
                    className="w-full bg-[#0c1220] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 font-sans"
                    placeholder="e.g. bZ4X Custom AWD"
                  />
                </div>

                {/* 2. Rated Range Slider & Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-400 uppercase">Base EPA Range</span>
                    <span className="text-cyan-400 font-bold">
                      {formatRange(customSpecs.estimatedRangeMiles, unit, true)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={400}
                    step={1}
                    value={customSpecs.estimatedRangeMiles}
                    onChange={(e) => setCustomSpecs({ ...customSpecs, estimatedRangeMiles: parseInt(e.target.value) || 250 })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{unit === 'miles' ? '150 mi' : '241 km'}</span>
                    <span>Standard: {unit === 'miles' ? '314 mi' : '505 km'}</span>
                    <span>{unit === 'miles' ? '400 mi' : '644 km'}</span>
                  </div>
                </div>

                {/* 3. Battery Pack Capacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-400 uppercase">Pack Capacity</span>
                    <span className="text-white font-bold">{customSpecs.batteryCapacityKwh} kWh</span>
                  </div>
                  <input
                    type="range"
                    min={45}
                    max={110}
                    step={0.5}
                    value={customSpecs.batteryCapacityKwh}
                    onChange={(e) => setCustomSpecs({ ...customSpecs, batteryCapacityKwh: parseFloat(e.target.value) || 72.8 })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>45 kWh</span>
                    <span>Standard: 72.8 kWh</span>
                    <span>110 kWh</span>
                  </div>
                </div>

                {/* 4. Peak Fast Charge Speed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-400 uppercase">Peak DC Speed</span>
                    <span className="text-emerald-400 font-bold">{customSpecs.maxChargeRateKw} kW</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={250}
                    step={5}
                    value={customSpecs.maxChargeRateKw}
                    onChange={(e) => setCustomSpecs({ ...customSpecs, maxChargeRateKw: parseInt(e.target.value) || 150 })}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>50 kW (L3)</span>
                    <span>150 kW</span>
                    <span>250 kW (Ultra)</span>
                  </div>
                </div>

                {/* 5. Charging Port Inlet Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Port Inlet Type
                  </label>
                  <select
                    value={customSpecs.nacsNative ? 'nacs' : 'ccs1'}
                    onChange={(e) => setCustomSpecs({
                      ...customSpecs,
                      nacsNative: e.target.value === 'nacs',
                      portTypeDescription: e.target.value === 'nacs' ? 'Native NACS (SAE J3400)' : 'CCS Combo 1 (Uses NACS Adapter)'
                    })}
                    className="w-full bg-[#0c1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="nacs">⚡ Native NACS (SAE J3400) - No adapter</option>
                    <option value="ccs1">🔌 CCS1 Port (Requires NACS Adapter / Magic Dock)</option>
                  </select>
                </div>

                {/* 6. Drivetrain */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase">
                    Drivetrain Configuration
                  </label>
                  <select
                    value={customSpecs.drivetrain}
                    onChange={(e) => setCustomSpecs({ ...customSpecs, drivetrain: e.target.value as any })}
                    className="w-full bg-[#0c1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="FWD">FWD (Front-Wheel Drive)</option>
                    <option value="AWD">AWD (Dual-Motor All-Wheel Drive)</option>
                    <option value="RWD">RWD (Rear-Wheel Drive)</option>
                  </select>
                </div>
              </div>

              {/* Environmental & Load Conditions Section */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Real-World Environmental & Load Adjustments
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Live Impact: {effectiveData.consumptionPenaltyPercent > 0 ? `-${effectiveData.consumptionPenaltyPercent}% Range` : '0% (Standard)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Weather Condition Selector */}
                  <div className="p-3.5 bg-[#0c1220] border border-slate-800 rounded-2xl space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-300 block">
                      Ambient Temperature & Climate:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {[
                        { id: 'optimal', label: '☀️ 70°F (Optimal)', penalty: '0%' },
                        { id: 'hot', label: '🔥 >95°F (A/C)', penalty: '-8%' },
                        { id: 'cold', label: '❄️ ~32°F (0°C)', penalty: '-15%' },
                        { id: 'freezing', label: '🥶 ~0°F (-18°C)', penalty: '-28%' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCustomSpecs({ ...customSpecs, weatherCondition: item.id as any })}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            customSpecs.weatherCondition === item.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px]">{item.label}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.penalty} penalty</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cargo & Aero Load Selector */}
                  <div className="p-3.5 bg-[#0c1220] border border-slate-800 rounded-2xl space-y-2">
                    <label className="text-xs font-mono font-bold text-slate-300 block">
                      Passenger & Aerodynamic Load:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {[
                        { id: 'normal', label: '🚗 1-2 Passengers', penalty: '0%' },
                        { id: 'heavy', label: '👨‍👩‍👧‍👦 Full Crew + Bags', penalty: '-6%' },
                        { id: 'roof_box', label: '📦 Roof Box / Bikes', penalty: '-18%' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCustomSpecs({ ...customSpecs, cargoLoad: item.id as any })}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            customSpecs.cargoLoad === item.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px]">{item.label}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.penalty} penalty</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynamic Calculated Range Result Banner */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                      Effective Highway Range for Route Calculations:
                    </span>
                    <div className="text-slate-300 text-xs font-sans">
                      {effectiveData.explanation}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold text-cyan-400">
                      {effectiveData.effectiveRangeMiles} mi
                    </div>
                    <div className="text-[10px] text-slate-500">
                      (~{Math.round(effectiveData.effectiveRangeMiles * 1.609)} km)
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToCatalog}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Factory Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Apply Customized Specs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectorModal;
