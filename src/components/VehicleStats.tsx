import React from 'react';
import {
  Battery,
  Zap,
  ShieldCheck,
  Cpu,
  Info,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Gauge,
  ThermometerSnowflake,
  Layers
} from 'lucide-react';
import { VehicleSpecs, DistanceUnit } from '../types';
import { getEffectiveVehicleRange, DEFAULT_BZ_MODEL } from '../data/toyotaModels';
import { formatRange, formatDistance } from '../utils/unitConverter';

export const TOYOTA_BZ_SPECS: VehicleSpecs = DEFAULT_BZ_MODEL;

interface VehicleStatsProps {
  specs?: VehicleSpecs;
  unit?: DistanceUnit;
  onToggleUnit?: (unit: DistanceUnit) => void;
  onOpenSelector?: () => void;
  onResetSpecs?: () => void;
}

export default function VehicleStats({
  specs = DEFAULT_BZ_MODEL,
  unit = 'miles',
  onToggleUnit,
  onOpenSelector,
  onResetSpecs
}: VehicleStatsProps) {
  const effectiveData = getEffectiveVehicleRange(specs);

  return (
    <div className="bg-white dark:bg-[#0A0E14]/95 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-slate-800 dark:text-white shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"></div>

      {/* Header with Badges & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-500/20">
              {specs.nacsNative ? 'NACS Standard (SAE J3400)' : 'CCS1 Standard (Adapter Approved)'}
            </span>
            {specs.isCustom && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                Custom Tuning Active
              </span>
            )}
          </div>

          <h3 className="text-xl font-extrabold font-sans tracking-tight mt-1.5 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Toyota {specs.model}</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal text-sm font-mono">({specs.year})</span>
          </h3>
          <p className="text-xs text-cyan-700 dark:text-cyan-300 font-mono mt-0.5">
            {specs.trim}
          </p>
        </div>

        {onOpenSelector && (
          <button
            onClick={onOpenSelector}
            className="px-3.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-white text-xs font-mono font-bold flex items-center space-x-1.5 transition-all self-start sm:self-center cursor-pointer shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Switch / Customize Model</span>
          </button>
        )}
      </div>

      {/* Description / Summary */}
      <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans mb-5">
        {specs.notes || `The ${specs.year} Toyota ${specs.model} utilizes high-voltage lithium architecture with integrated thermal management for high-speed Tesla Supercharging.`}
      </p>

      {/* Grid of Key Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
        <div className="bg-slate-50 dark:bg-[#141B26] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
            <Battery className="h-3.5 w-3.5 mr-1.5 text-cyan-600 dark:text-cyan-400" />
            BATTERY PACK
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{specs.batteryCapacityKwh} kWh</div>
          <div className="text-[10px] text-slate-500">Usable: {specs.usableCapacityKwh || specs.batteryCapacityKwh} kWh</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#141B26] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
            PEAK DC SPEED
          </div>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{specs.maxChargeRateKw} kW</div>
          <div className="text-[10px] text-slate-500">10-80% in ~28m</div>
        </div>

        <div className="bg-slate-50 dark:bg-[#141B26] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <div className="flex items-center">
              <Gauge className="h-3.5 w-3.5 mr-1.5 text-cyan-600 dark:text-cyan-400" />
              EPA RANGE
            </div>
            {onToggleUnit && (
              <button
                type="button"
                onClick={() => onToggleUnit(unit === 'miles' ? 'km' : 'miles')}
                className="text-[9px] font-mono text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-white bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-cyan-500/50 px-1 rounded cursor-pointer transition-colors"
                title="Toggle unit between Miles and KM"
              >
                ⇄ {unit === 'miles' ? 'KM' : 'MI'}
              </button>
            )}
          </div>
          <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
            {formatRange(specs.estimatedRangeMiles, unit)}
          </div>
          <div className="text-[10px] text-slate-500">
            ~{unit === 'miles' 
              ? `${Math.round(specs.estimatedRangeMiles * 1.60934)} km` 
              : `${specs.estimatedRangeMiles} mi`}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#141B26] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1">
            <Cpu className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
            DRIVETRAIN
          </div>
          <div className="text-sm font-bold text-purple-700 dark:text-purple-300">{specs.drivetrain || 'FWD'}</div>
          <div className="text-[10px] text-slate-500">{specs.horsepowerHp ? `${specs.horsepowerHp} HP` : 'High Output'}</div>
        </div>
      </div>

      {/* Environmental Modifiers Banner if adjusted */}
      {effectiveData.consumptionPenaltyPercent > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <ThermometerSnowflake className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              Active Range Adjustment: <strong className="text-amber-700 dark:text-amber-400">{effectiveData.explanation}</strong>
            </span>
          </div>
          <div className="text-right text-cyan-700 dark:text-cyan-400 font-bold shrink-0">
            {formatRange(effectiveData.effectiveRangeMiles, unit, true)}
          </div>
        </div>
      )}

      {/* Port & Protocol Info */}
      <div className="bg-cyan-50/60 dark:bg-cyan-500/5 rounded-2xl border border-cyan-100 dark:border-cyan-500/10 p-3.5 flex items-start justify-between gap-3">
        <div className="flex items-start">
          <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 font-sans">
            <div className="font-semibold text-cyan-800 dark:text-cyan-300">Fast-Charging & Plug & Charge Protocol:</div>
            <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">
              {specs.portTypeDescription || (specs.nacsNative 
                ? 'Native NACS inlet communicates with Tesla Superchargers via ISO 15118 TLS encryption. Fast charging negotiates automatically.'
                : 'CCS1 port connects via official NACS-to-CCS adapter at Tesla Superchargers. Sessions are authorized via the Toyota App.')}
            </p>
          </div>
        </div>

        {onOpenSelector && (
          <button
            onClick={onOpenSelector}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-cyan-500 text-cyan-700 dark:text-cyan-300 text-xs font-mono transition-colors shrink-0 cursor-pointer self-center shadow-sm"
          >
            Configure
          </button>
        )}
      </div>
    </div>
  );
}
