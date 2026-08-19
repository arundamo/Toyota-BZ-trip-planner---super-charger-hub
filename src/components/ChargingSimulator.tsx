import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Zap, X, ShieldAlert, Cpu, Lock, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import { ChargingStation, ChargeSession } from '../types';

interface ChargingSimulatorProps {
  station: ChargingStation;
  onClose: () => void;
  initialSoc?: number;
  targetSoc?: number;
}

export default function ChargingSimulator({ 
  station, 
  onClose,
  initialSoc = 20,
  targetSoc = 80 
}: ChargingSimulatorProps) {
  const startSocValue = Math.min(95, Math.max(5, initialSoc));
  const targetSocValue = Math.min(100, Math.max(startSocValue + 10, targetSoc));

  const [session, setSession] = useState<ChargeSession>({
    state: 'idle',
    currentSoc: startSocValue,
    targetSoc: targetSocValue,
    powerKw: 0,
    energyDelivered: 0,
    totalCost: 0,
    elapsedSeconds: 0
  });

  const [simSpeed, setSimSpeed] = useState<1 | 5 | 10 | 25>(5);
  const [logLines, setLogLines] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add terminal logs
  const addLog = (line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogLines(prev => [`[${timestamp}] ${line}`, ...prev]);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartSimulation = () => {
    if (session.state !== 'idle' && session.state !== 'completed' && session.state !== 'error') return;

    setLogLines([]);
    setSession({
      state: 'connecting',
      currentSoc: startSocValue,
      targetSoc: targetSocValue,
      powerKw: 0,
      energyDelivered: 0,
      totalCost: 0,
      elapsedSeconds: 0
    });

    addLog(`NACS Plug connected to vehicle.`);
    addLog(`Hardware Lock: Engaging connector physical retainer...`);

    let step = 0;
    const initialIval = setInterval(() => {
      step++;
      if (step === 1) {
        setSession(prev => ({ ...prev, state: 'connecting' }));
        addLog(`Initiating HomePlug Green PHY PLC connection on control pilot.`);
        addLog(`PLC link established. SECC (Station) and EVCC (Vehicle) in communication.`);
      } else if (step === 2) {
        setSession(prev => ({ ...prev, state: 'authorizing' }));
        addLog(`ISO 15118 TLS Handshake starting using ECDH key exchange.`);
        addLog(`Verifying vehicle contract certificate with Toyota Root CA chain.`);
      } else if (step === 3) {
        addLog(`Contract certificate matches trusted authority.`);
        addLog(`TLS connection secured. Autocharge session token generated.`);
        addLog(`Tesla Fleet Webhook: Verifying billing account and authorizing port.`);
      } else if (step === 4) {
        addLog(`Tesla Fleet Payment Handshake check: AUTHORIZED.`);
        addLog(`Establishing safe charging current parameters: Max 150 kW.`);
        clearInterval(initialIval);
        startChargingLoop();
      }
    }, 1000);
  };

  const startChargingLoop = () => {
    setSession(prev => ({
      ...prev,
      state: 'charging',
      powerKw: station.speedKw < 150 ? station.speedKw : 150 // Toyota bZ caps at 150kW
    }));
    addLog(`Preconditioning battery ... optimal state reached.`);
    addLog(`Relays closed. Starting power transmission.`);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSession(prev => {
        if (prev.currentSoc >= prev.targetSoc) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          addLog(`Target SOC (${prev.targetSoc}%) reached. Ramping down power.`);
          addLog(`DC Fast Charging session completed gracefully.`);
          addLog(`Relays opened. Safe to decouple NACS plug.`);
          return {
            ...prev,
            state: 'completed',
            powerKw: 0
          };
        }

        // Realistic fast charging curves for Toyota bZ:
        // Peak is 150kW. Ramps down after 50%, throttles heavily after 65% and 75%
        let currentPower = 150;
        if (prev.currentSoc > 75) {
          currentPower = 35;
        } else if (prev.currentSoc > 65) {
          currentPower = 60;
        } else if (prev.currentSoc > 50) {
          currentPower = 100;
        } else if (prev.currentSoc > 35) {
          currentPower = 135;
        }

        // Cap at station speed
        if (currentPower > station.speedKw) {
          currentPower = station.speedKw;
        }

        // Seconds elapsed in real-world relative to simulation speed
        const secondsIncrement = 1 * simSpeed;
        const newElapsed = prev.elapsedSeconds + secondsIncrement;

        // Energy added in kWh in this tick (powerKw * hours)
        // 1 seconds = 1 / 3600 hours
        const energyAdded = (currentPower * (secondsIncrement / 3600));
        const newEnergy = prev.energyDelivered + energyAdded;
        const newCost = newEnergy * station.costPerKwh;

        // Battery capacity of Toyota bZ is ~72.8 kWh
        // SOC change = (energyAdded / 72.8) * 100
        const socAdded = (energyAdded / 72.8) * 100;
        const newSoc = Math.min(prev.targetSoc, Number((prev.currentSoc + socAdded).toFixed(2)));

        if (Math.floor(newSoc) > Math.floor(prev.currentSoc) && Math.floor(newSoc) % 10 === 0) {
          addLog(`Battery SOC reached ${Math.floor(newSoc)}% | Power: ${currentPower.toFixed(0)} kW | Added: ${newEnergy.toFixed(1)} kWh`);
        }

        return {
          ...prev,
          currentSoc: Number(newSoc.toFixed(1)),
          powerKw: Number(currentPower.toFixed(1)),
          energyDelivered: Number(newEnergy.toFixed(2)),
          totalCost: Number(newCost.toFixed(2)),
          elapsedSeconds: newElapsed
        };
      });
    }, 200 / simSpeed);
  };

  const handleStopSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    addLog(`Simulation aborted by driver.`);
    setSession(prev => ({
      ...prev,
      state: 'idle',
      powerKw: 0
    }));
  };

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-[#05070A]/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-white">
      <div className="bg-[#0A0E14] border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[750px] relative">
        {/* Immersive Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        
        {/* Active Dashboard Simulator Panel */}
        <div className="flex-1 p-6 md:p-8 pt-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/10">
                  ISO 15118 Handshake Sandbox
                </span>
                <h4 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5 text-slate-100 font-sans uppercase">
                  Plug & Charge Simulator
                </h4>
                <p className="text-xs text-slate-400 mt-1">{station.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 bg-[#141B26] hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Toyota Instrument Cockpit */}
            <div className="bg-[#05070A] border border-slate-800 rounded-2xl p-6 relative overflow-hidden mb-6">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
              
              <div className="relative text-center z-10 font-sans">
                <div className="inline-flex items-center space-x-1.5 border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-400 font-semibold mb-4">
                  <Activity className="h-3 w-3 animate-pulse text-cyan-400" />
                  <span>TOYOTA ISO 15118 SECURE CONTROLLER</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-sans">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">STATE OF CHARGE</span>
                    <span className="text-3xl md:text-4xl font-extrabold font-mono text-slate-100 tracking-tight mt-1">
                      {session.currentSoc}%
                    </span>
                    <div className="text-[9px] text-slate-450 mt-1">Target: {session.targetSoc}%</div>
                  </div>

                  <div className="flex flex-col items-center border-x border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">CURRENT SPEED</span>
                    <span className="text-3xl md:text-4xl font-extrabold font-mono text-cyan-400 tracking-tight mt-1 flex items-baseline">
                      {session.powerKw}
                      <span className="text-xs font-normal text-slate-450 ml-0.5">kW</span>
                    </span>
                    <div className="text-[9px] text-slate-450 mt-1">Peak: {station.speedKw}kW</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">BILLING (EST.)</span>
                    <span className="text-3xl md:text-4xl font-extrabold font-mono text-blue-400 tracking-tight mt-1 flex items-baseline">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-400 self-center animate-pulse" />
                      {session.totalCost}
                    </span>
                    <div className="text-[9px] text-slate-450 mt-1">${station.costPerKwh}/kWh</div>
                  </div>
                </div>

                {/* Battery Progression Bar */}
                <div className="mt-6 font-sans">
                  <div className="w-full bg-[#141B26] h-3 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        session.state === 'charging' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse' 
                        : session.state === 'completed'
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                      }`}
                      style={{ width: `${session.currentSoc}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                    <span>{startSocValue}% Arrival Start</span>
                    <span>Elapsed Time: {formatDuration(session.elapsedSeconds)}</span>
                    <span>{session.targetSoc}% Target Cap</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Data & Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141B26]/60 border border-slate-800 p-3.5 rounded-xl flex items-center">
                <div className="bg-blue-500/10 p-2.5 rounded-lg mr-3 text-blue-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">ENERGY ADDED</div>
                  <div className="text-base font-bold text-slate-100 font-mono">{session.energyDelivered} kWh</div>
                </div>
              </div>

              <div className="bg-[#141B26]/60 border border-slate-800 p-3.5 rounded-xl flex items-center">
                <div className="bg-cyan-500/10 p-2.5 rounded-lg mr-3 text-cyan-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">SECURITY PROTOCOL</div>
                  <div className="text-base font-bold text-slate-100 font-mono">TLS 1.3 CORD</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col space-y-3">
            {/* Speed selection during charging */}
            {session.state === 'charging' && (
              <div className="flex items-center justify-between border border-slate-800 bg-[#05070A]/60 p-2.5 rounded-lg">
                <span className="text-xs font-mono text-slate-400">Simulation Speed:</span>
                <div className="flex space-x-1">
                  {([1, 5, 10, 25] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setSimSpeed(speed)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        simSpeed === speed 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold' 
                          : 'bg-[#141B26] text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Triggers */}
            {session.state === 'idle' && (
              <button
                onClick={handleStartSimulation}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/40 uppercase tracking-widest text-xs"
              >
                <Zap className="h-5 w-5 fill-white" />
                <span>Simulate Plug & Charge Handshake</span>
              </button>
            )}

            {session.state === 'charging' && (
              <button
                onClick={handleStopSimulation}
                className="w-full bg-red-500/25 hover:bg-red-500/35 text-red-300 font-bold py-3.5 px-4 rounded-xl border border-red-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Pause className="h-5 w-5" />
                <span>Abort Simulation Session</span>
              </button>
            )}

            {(session.state === 'connecting' || session.state === 'authorizing') && (
              <div className="w-full bg-[#141B26]/80 text-slate-400 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-3 border border-slate-805">
                <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                <span>Performing Cryptographic Validation...</span>
              </div>
            )}

            {session.state === 'completed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-cyan-400 font-mono text-xs py-2 font-bold animate-pulse">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>ISO 15118 Billing Finalized Successfully!</span>
                </div>
                <button
                  onClick={() => setSession(prev => ({ ...prev, state: 'idle', currentSoc: startSocValue, targetSoc: targetSocValue, energyDelivered: 0, totalCost: 0, elapsedSeconds: 0 }))}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors font-mono text-xs"
                >
                  Reset Simulator
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Console Terminal Logs Panel */}
        <div className="w-full md:w-80 bg-[#05070A] p-5 flex flex-col justify-between font-mono h-1/2 md:h-auto overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1 block font-sans">
                ISO-15118 Security Log
              </span>
            </div>

            <div className="flex-1 overflow-y-auto text-xs space-y-2.5 text-slate-300 pr-1 select-none scrollbar-thin select-text scrollbar-thumb-slate-800">
              {logLines.length === 0 ? (
                <div className="text-slate-500 italic text-[11px] leading-relaxed pt-2">
                  Waiting for connection... Plugging in triggers the SAE J3400 active communications protocol.
                </div>
              ) : (
                logLines.map((line, idx) => {
                  let colorClass = "text-slate-300";
                  if (line.includes("AUTHORIZED") || line.includes("completed")) colorClass = "text-cyan-400 font-semibold";
                  else if (line.includes("TLS") || line.includes("cryptography")) colorClass = "text-cyan-400";
                  else if (line.includes("billing") || line.includes("Payment")) colorClass = "text-blue-400";
                  else if (line.includes("aborted")) colorClass = "text-red-400";
                  
                  return (
                    <div key={idx} className={`${colorClass} leading-relaxed text-[11px]`}>
                      {line}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3.5 mt-4 text-[10px] text-slate-500 flex justify-between font-sans">
            <span>Hardware: J3400 NACS</span>
            <span>Firmware: Toyota-EV-v4.7.1</span>
          </div>
        </div>

      </div>
    </div>
  );
}
