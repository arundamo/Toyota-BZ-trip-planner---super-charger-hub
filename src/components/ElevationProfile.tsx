import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mountain,
  TrendingUp,
  TrendingDown,
  Zap,
  BatteryCharging,
  Gauge,
  Info,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LatLng, VehicleSpecs, DistanceUnit } from '../types';
import { CalculatedStationStop, TripType } from '../utils/routeCalculator';
import {
  calculateCorridorElevationProfile,
  ElevationPoint,
  TerrainSummary
} from '../utils/elevationCalculator';
import { formatDistance } from '../utils/unitConverter';

interface ElevationProfileProps {
  originName: string;
  destinationName: string;
  originCoords: LatLng | null;
  destCoords: LatLng | null;
  totalDistanceMiles: number;
  calculatedStops: CalculatedStationStop[];
  specs: VehicleSpecs;
  startingSoc: number;
  tripType: TripType;
  unit: DistanceUnit;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  originName,
  destinationName,
  originCoords,
  destCoords,
  totalDistanceMiles,
  calculatedStops,
  specs,
  startingSoc,
  tripType,
  unit,
  isVisible,
  onToggleVisibility
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = isVisible !== undefined ? isVisible : internalExpanded;
  const toggleVisibility = onToggleVisibility || (() => setInternalExpanded(prev => !prev));

  const [activeLegView, setActiveLegView] = useState<'full' | 'outbound' | 'return'>('full');
  const [chartMode, setChartMode] = useState<'combined' | 'elevation' | 'consumption'>('combined');
  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null);

  // Calculate terrain physics & consumption data
  const terrainSummary: TerrainSummary = useMemo(() => {
    return calculateCorridorElevationProfile(
      originName,
      destinationName,
      originCoords,
      destCoords,
      totalDistanceMiles,
      calculatedStops,
      specs,
      startingSoc,
      tripType
    );
  }, [originName, destinationName, originCoords, destCoords, totalDistanceMiles, calculatedStops, specs, startingSoc, tripType]);

  // Points to display based on active view
  const displayPoints = useMemo(() => {
    if (tripType !== 'two-way' || activeLegView === 'full') {
      return terrainSummary.points;
    }
    if (activeLegView === 'outbound') {
      return terrainSummary.outboundPoints;
    }
    return terrainSummary.returnPoints;
  }, [terrainSummary, activeLegView, tripType]);

  // Unit conversions
  const isKm = unit === 'km';
  const elevUnitLabel = isKm ? 'm' : 'ft';
  const distUnitLabel = isKm ? 'km' : 'mi';
  const consumptionUnitLabel = isKm ? 'kWh/100km' : 'Wh/mi';

  // Format chart data points
  const chartData = useMemo(() => {
    return displayPoints.map((pt, idx) => ({
      index: idx,
      distance: isKm ? pt.distanceKm : pt.distanceMiles,
      elevation: isKm ? pt.elevationMeters : pt.elevationFeet,
      grade: pt.gradePercent,
      predictedConsumption: isKm ? pt.predictedKwhPer100Km : pt.predictedWhPerMile,
      baselineConsumption: isKm ? pt.baselineKwhPer100Km : pt.baselineWhPerMile,
      soc: pt.batterySoc,
      deltaPercent: pt.consumptionDeltaPercent,
      station: pt.stationStop,
      isStation: pt.isStationStop,
      legType: pt.legType,
      rawPoint: pt
    }));
  }, [displayPoints, isKm]);

  // Supercharger stop dots for reference
  const stationDots = useMemo(() => {
    return chartData.filter(d => d.isStation && d.station);
  }, [chartData]);

  // Calculate bounds for chart Y-axes
  const elevations = chartData.map(d => d.elevation);
  const minElev = elevations.length ? Math.min(...elevations) : 0;
  const maxElev = elevations.length ? Math.max(...elevations) : 100;
  const elevPadding = Math.max(30, (maxElev - minElev) * 0.18);
  const elevDomain = [
    Math.max(0, Math.floor((minElev - elevPadding) / 20) * 20),
    Math.ceil((maxElev + elevPadding) / 20) * 20
  ];

  const consumptions = chartData.map(d => d.predictedConsumption);
  const minCons = consumptions.length ? Math.min(...consumptions) : 100;
  const maxCons = consumptions.length ? Math.max(...consumptions) : 350;
  const consPadding = Math.max(20, (maxCons - minCons) * 0.2);
  const consDomain = [
    Math.max(0, Math.floor((minCons - consPadding) / 10) * 10),
    Math.ceil((maxCons + consPadding) / 10) * 10
  ];

  // Baseline consumption value for reference line
  const baselineValue = isKm ? terrainSummary.baselineConsumptionKwhPer100Km : terrainSummary.baselineConsumptionWhPerMile;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-slate-900/85 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden font-sans transition-colors"
    >
      {/* Top Header & Mode Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-xs uppercase tracking-widest font-mono">
            <Mountain className="h-4 w-4" />
            <span>Topographic Telemetry & Powertrain Load</span>
            <span className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">
              Toyota bZ e-TNGA Physics
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 flex items-center gap-2">
            <span>Corridor Elevation Profile & Consumption Impact</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-world potential energy physics modeling uphill climb resistance and downhill regenerative braking recovery.
          </p>
        </div>

        {/* View toggles & mode switchers */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Round-trip leg tabs */}
          {isExpanded && tripType === 'two-way' && (
            <div className="bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800 flex items-center gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveLegView('full')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLegView === 'full'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Round Trip
              </button>
              <button
                type="button"
                onClick={() => setActiveLegView('outbound')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLegView === 'outbound'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Outbound
              </button>
              <button
                type="button"
                onClick={() => setActiveLegView('return')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLegView === 'return'
                    ? 'bg-purple-500 text-white font-bold shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Return
              </button>
            </div>
          )}

          {/* Chart Display Mode Selector */}
          {isExpanded && (
            <div className="bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800 flex items-center gap-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setChartMode('combined')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'combined'
                    ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Dual View
              </button>
              <button
                type="button"
                onClick={() => setChartMode('elevation')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'elevation'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Elevation
              </button>
              <button
                type="button"
                onClick={() => setChartMode('consumption')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'consumption'
                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Consumption
              </button>
            </div>
          )}

          {/* Hide/Show Topographics Toggle Button */}
          <button
            type="button"
            id="toggle-topographics-button"
            onClick={toggleVisibility}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
              isExpanded
                ? 'bg-slate-100 dark:bg-slate-950/80 border-slate-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 hover:bg-slate-200 dark:hover:bg-cyan-500/10'
                : 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-300 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-500/25'
            }`}
            title={isExpanded ? "Hide topographic elevation charts and powertrain metrics" : "Show topographic elevation charts and powertrain metrics"}
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Hide Topographics</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Show Topographics</span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="topographics-expanded-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >

      {/* KPI Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-4 font-mono">
        {/* Total Ascent / Climb */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              Total Ascent
            </span>
            <span className="text-amber-400/80">Uphill</span>
          </div>
          <div className="text-lg font-black text-amber-300 mt-1">
            +{isKm ? terrainSummary.totalAscentMeters : terrainSummary.totalAscentFeet} {elevUnitLabel}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Max incline: <strong className="text-amber-400">+{terrainSummary.maxUphillGrade}%</strong>
          </div>
        </div>

        {/* Total Descent / Regen */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-cyan-400" />
              Total Descent
            </span>
            <span className="text-cyan-400/80">Regen</span>
          </div>
          <div className="text-lg font-black text-cyan-300 mt-1">
            -{isKm ? terrainSummary.totalDescentMeters : terrainSummary.totalDescentFeet} {elevUnitLabel}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Max grade: <strong className="text-cyan-400">{terrainSummary.maxDownhillGrade}%</strong>
          </div>
        </div>

        {/* Terrain Net Energy Delta */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-purple-400" />
              Terrain Delta
            </span>
            <span>Net kWh</span>
          </div>
          <div className={`text-lg font-black mt-1 ${
            terrainSummary.terrainEnergyDeltaKwh > 0.1 
              ? 'text-amber-400' 
              : terrainSummary.terrainEnergyDeltaKwh < -0.1 
              ? 'text-emerald-400' 
              : 'text-slate-200'
          }`}>
            {terrainSummary.terrainEnergyDeltaKwh > 0 ? `+${terrainSummary.terrainEnergyDeltaKwh}` : terrainSummary.terrainEnergyDeltaKwh} kWh
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {terrainSummary.terrainEnergyDeltaKwh > 0 ? 'Extra climb drain' : 'Net downhill regen bonus'}
          </div>
        </div>

        {/* Range Impact */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
              Range Impact
            </span>
            <span>Terrain</span>
          </div>
          <div className={`text-lg font-black mt-1 ${
            terrainSummary.terrainRangeDeltaMiles < -0.2 
              ? 'text-amber-400' 
              : terrainSummary.terrainRangeDeltaMiles > 0.2 
              ? 'text-emerald-400' 
              : 'text-slate-200'
          }`}>
            {isKm 
              ? (terrainSummary.terrainRangeDeltaKm > 0 ? `+${terrainSummary.terrainRangeDeltaKm} km` : `${terrainSummary.terrainRangeDeltaKm} km`)
              : (terrainSummary.terrainRangeDeltaMiles > 0 ? `+${terrainSummary.terrainRangeDeltaMiles} mi` : `${terrainSummary.terrainRangeDeltaMiles} mi`)
            }
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            vs flat baseline highway
          </div>
        </div>

        {/* Predicted Average Consumption */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-cyan-400" />
              Avg Predicted
            </span>
            <span>Toyota bZ</span>
          </div>
          <div className="text-lg font-black text-cyan-300 mt-1">
            {isKm ? terrainSummary.avgConsumptionKwhPer100Km : terrainSummary.avgConsumptionWhPerMile} <span className="text-xs text-slate-400 font-normal">{consumptionUnitLabel}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Flat baseline: {isKm ? terrainSummary.baselineConsumptionKwhPer100Km : terrainSummary.baselineConsumptionWhPerMile}
          </div>
        </div>
      </div>

      {/* Chart Legend Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-2 px-1 text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          {(chartMode === 'combined' || chartMode === 'elevation') && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-cyan-600/30 to-cyan-500 border border-cyan-400 inline-block"></span>
              <span className="text-slate-300 font-bold">Elevation ({elevUnitLabel})</span>
            </div>
          )}

          {(chartMode === 'combined' || chartMode === 'consumption') && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block shadow-sm shadow-amber-400/50"></span>
              <span className="text-amber-300 font-bold">Instantaneous bZ Consumption ({consumptionUnitLabel})</span>
            </div>
          )}

          {(chartMode === 'combined' || chartMode === 'consumption') && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-slate-500 inline-block"></span>
              <span className="text-slate-400">Flat Baseline ({baselineValue} {consumptionUnitLabel})</span>
            </div>
          )}

          {stationDots.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white inline-block"></span>
              <span className="text-cyan-400">Tesla Supercharger Stop</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Hover to inspect segment grade & battery draw
        </div>
      </div>

      {/* Interactive Recharts Canvas */}
      <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden bg-slate-950/90 border border-slate-800 p-2 sm:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: chartMode === 'elevation' ? 15 : 25, left: 10, bottom: 10 }}
            onMouseMove={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                setHoveredPoint(e.activePayload[0].payload.rawPoint);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="60%" stopColor="#0284c7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />

            {/* X Axis: Distance */}
            <XAxis
              dataKey="distance"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val} ${distUnitLabel}`}
              stroke="#334155"
              minTickGap={35}
            />

            {/* Left Y Axis: Elevation */}
            {(chartMode === 'combined' || chartMode === 'elevation') && (
              <YAxis
                yAxisId="elevAxis"
                orientation="left"
                domain={elevDomain}
                tick={{ fill: '#06b6d4', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val} ${elevUnitLabel}`}
                stroke="#0e7490"
                width={55}
              />
            )}

            {/* Right Y Axis: Consumption */}
            {(chartMode === 'combined' || chartMode === 'consumption') && (
              <YAxis
                yAxisId="consAxis"
                orientation="right"
                domain={consDomain}
                tick={{ fill: '#fbbf24', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}`}
                stroke="#b45309"
                width={45}
              />
            )}

            {/* Flat Ground Baseline Line */}
            {(chartMode === 'combined' || chartMode === 'consumption') && (
              <ReferenceLine
                yAxisId="consAxis"
                y={baselineValue}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{
                  value: `Flat Baseline (${baselineValue} ${consumptionUnitLabel})`,
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'insideBottomRight'
                }}
              />
            )}

            {/* Turnaround line for round trips */}
            {tripType === 'two-way' && activeLegView === 'full' && (
              <ReferenceLine
                x={isKm ? terrainSummary.points[Math.floor(terrainSummary.points.length / 2)]?.distanceKm : terrainSummary.points[Math.floor(terrainSummary.points.length / 2)]?.distanceMiles}
                stroke="#a855f7"
                strokeDasharray="3 3"
                label={{
                  value: `Turnaround (${destinationName})`,
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'insideTopLeft'
                }}
              />
            )}

            {/* Custom Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                const pt: ElevationPoint = data.rawPoint;
                const isClimb = pt.gradePercent > 0.5;
                const isDescent = pt.gradePercent < -0.5;

                return (
                  <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                      <span className="font-mono text-cyan-400 font-bold">
                        {isKm ? `${pt.distanceKm} km` : `${pt.distanceMiles} miles`} along route
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {pt.legType === 'return' ? 'Return Leg' : 'Outbound Leg'}
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      {/* Elevation */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Mountain className="h-3 w-3 text-cyan-400" />
                          Altitude:
                        </span>
                        <span className="font-bold text-slate-100">
                          {isKm ? `${pt.elevationMeters} m` : `${pt.elevationFeet} ft`}
                        </span>
                      </div>

                      {/* Grade / Slope */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          {isClimb ? (
                            <TrendingUp className="h-3 w-3 text-amber-400" />
                          ) : isDescent ? (
                            <TrendingDown className="h-3 w-3 text-cyan-400" />
                          ) : (
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                          )}
                          Grade / Incline:
                        </span>
                        <span className={`font-bold ${
                          isClimb ? 'text-amber-400' : isDescent ? 'text-cyan-400' : 'text-slate-300'
                        }`}>
                          {pt.gradePercent > 0 ? `+${pt.gradePercent}%` : `${pt.gradePercent}%`}
                        </span>
                      </div>

                      {/* Predicted Consumption */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-400" />
                          Predicted bZ Load:
                        </span>
                        <span className="font-bold text-amber-300">
                          {isKm ? `${pt.predictedKwhPer100Km} kWh/100km` : `${pt.predictedWhPerMile} Wh/mi`}
                        </span>
                      </div>

                      {/* Delta vs flat */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Terrain Impact:</span>
                        <span className={`font-bold ${
                          pt.consumptionDeltaPercent > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {pt.consumptionDeltaPercent > 0 ? `+${pt.consumptionDeltaPercent}% extra draw` : `${pt.consumptionDeltaPercent}% regen saving`}
                        </span>
                      </div>

                      {/* Estimated SoC */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Estimated Battery SoC:</span>
                        <span className="text-cyan-300 font-bold">{pt.batterySoc}%</span>
                      </div>

                      {/* Supercharger pin note if any */}
                      {pt.stationStop && (
                        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-300 bg-cyan-950/40 p-1.5 rounded border border-cyan-500/30">
                          <strong className="block text-white font-sans">{pt.stationStop.station.name}</strong>
                          Planned Stop #{pt.stationStop.stopIndex} • Arrive at {pt.stationStop.arrivalSoc}% SoC
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {/* Elevation Shaded Contour Area */}
            {(chartMode === 'combined' || chartMode === 'elevation') && (
              <Area
                yAxisId="elevAxis"
                type="monotone"
                dataKey="elevation"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#elevationGrad)"
                name="Elevation"
                isAnimationActive={false}
              />
            )}

            {/* Consumption Impact Curve Line */}
            {(chartMode === 'combined' || chartMode === 'consumption') && (
              <Line
                yAxisId="consAxis"
                type="monotone"
                dataKey="predictedConsumption"
                stroke="#f59e0b"
                strokeWidth={2.2}
                dot={false}
                name="bZ Consumption"
                isAnimationActive={false}
              />
            )}

            {/* Supercharger Stop Markers on Profile */}
            {stationDots.map((dot, idx) => (
              <ReferenceDot
                key={`station-dot-${idx}`}
                yAxisId="elevAxis"
                x={dot.distance}
                y={dot.elevation}
                r={6}
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Topographic Insights & Driving Dynamics Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
        <div className="bg-[#070b14]/70 p-3.5 rounded-2xl border border-slate-800 flex items-start space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200 block mb-0.5 font-sans">
              Uphill Powertrain Dynamics (Climb Load)
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Climbing against gravity adds approximately <strong className="text-amber-300 font-mono">+6.4 Wh per vertical meter</strong> of elevation gain to the Toyota bZ’s twin electric motors. On sustained uphill segments, predicted power consumption rises to <strong className="text-amber-300 font-mono">~{Math.round(terrainSummary.baselineConsumptionWhPerMile * 1.35)} Wh/mi</strong>.
            </p>
          </div>
        </div>

        <div className="bg-[#070b14]/70 p-3.5 rounded-2xl border border-slate-800 flex items-start space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200 block mb-0.5 font-sans">
              Downhill Regenerative Braking (Energy Recovery)
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              The Toyota bZ e-TNGA inverter captures kinetic and potential energy during descents at <strong className="text-emerald-300 font-mono">~72% round-trip efficiency</strong>. On steep grades (&gt;3% decline), net vehicle power draw drops to zero or regenerates energy back into the 74.7 kWh battery pack.
            </p>
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
