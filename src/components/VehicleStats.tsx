import React from 'react';
import { Battery, Zap, Key, ShieldCheck, Cpu, Anchor, Info } from 'lucide-react';
import { VehicleSpecs } from '../types';

export const TOYOTA_BZ_SPECS: VehicleSpecs = {
  brand: "Toyota",
  model: "bZ NACS Edition",
  year: 2026,
  batteryCapacityKwh: 72.8,
  maxChargeRateKw: 150,
  nacsNative: true,
  plugAndChargeSupported: true,
  estimatedRangeMiles: 252
};

export default function VehicleStats() {
  return (
    <div className="bg-[#0A0E14]/95 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/15 px-2.5 py-1 rounded-full border border-cyan-500/10">
            NACS Standard (SAE J3400)
          </span>
          <h3 className="text-xl font-bold font-sans tracking-tight mt-2 text-slate-100">
            Toyota bZ <span className="text-slate-400 font-light font-sans">2026</span>
          </h3>
        </div>
        <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
          <Zap className="h-6 w-6 text-cyan-400" />
        </div>
      </div>

      <p className="text-xs text-slate-350 leading-relaxed font-sans mb-5">
        The revised 2026 Toyota bZ features a native North American Charging Standard (NACS) inlet. 
        Equipped with ISO 15118 cryptography, it enables secure automatic handshake & continuous DC billing directly with open Tesla Superchargers.
      </p>

      <div className="grid grid-cols-2 gap-3.5 mb-5 font-mono">
        <div className="bg-[#141B26] border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center text-slate-400 text-xs mb-1">
            <Battery className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            BATTERY
          </div>
          <div className="text-sm font-bold text-slate-100">72.8 kWh</div>
          <div className="text-[10px] text-slate-500">Lithium-Ion Pack</div>
        </div>

        <div className="bg-[#141B26] border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center text-slate-400 text-xs mb-1">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            MAX DC SPEED
          </div>
          <div className="text-sm font-bold text-slate-100">150 kW</div>
          <div className="text-[10px] text-slate-500">10-80% in 30m</div>
        </div>

        <div className="bg-[#141B26] border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center text-slate-400 text-xs mb-1">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            AUTO BILLING
          </div>
          <div className="text-sm font-bold text-slate-100">ISO 15118</div>
          <div className="text-[10px] text-slate-500">Integrated TLS</div>
        </div>

        <div className="bg-[#141B26] border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center text-slate-400 text-xs mb-1">
            <Cpu className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
            PORT TYPE
          </div>
          <div className="text-sm font-bold text-slate-100">NACS Native</div>
          <div className="text-[10px] text-slate-500">No adapter needed</div>
        </div>
      </div>

      <div className="bg-cyan-500/5 rounded-xl border border-cyan-500/10 p-3.5">
        <div className="flex items-start">
          <Info className="h-4 w-4 text-cyan-400 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-slate-300 space-y-1.5 font-sans">
            <div className="font-semibold text-cyan-300">Plug & Charge Requirements:</div>
            <p className="leading-relaxed">
              1. Register vehicle NACS VIN inside the Toyota App.<br />
              2. Enable Tesla Integration & store payment details.<br />
              3. Connect to V3/V4 Supercharger – charging starts automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
