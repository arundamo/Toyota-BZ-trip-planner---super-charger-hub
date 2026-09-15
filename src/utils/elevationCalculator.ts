import { LatLng, VehicleSpecs, DistanceUnit } from '../types';
import { CalculatedStationStop, TripType } from './routeCalculator';
import { getEffectiveVehicleRange } from '../data/toyotaModels';

export const KNOWN_ELEVATIONS_METERS: Record<string, number> = {
  'waterloo, on': 329,
  'waterloo': 329,
  'guelph, on': 334,
  'guelph': 334,
  'kitchener, on': 315,
  'kitchener': 315,
  'cambridge, on': 305,
  'cambridge': 305,
  'toronto, on': 76,
  'toronto': 76,
  'mississauga, on': 156,
  'mississauga': 156,
  'kingston, on': 93,
  'kingston': 93,
  'montreal, qc': 36,
  'montreal': 36,
  'austin, tx': 149,
  'austin': 149,
  'dallas, tx': 131,
  'dallas': 131,
  'los angeles, ca': 87,
  'los angeles': 87,
  'las vegas, nv': 610,
  'las vegas': 610,
  'new york, ny': 10,
  'new york': 10,
  'washington, dc': 20,
  'washington': 20
};

export interface ElevationPoint {
  distanceMiles: number;
  distanceKm: number;
  elevationMeters: number;
  elevationFeet: number;
  gradePercent: number; // Slope percentage (+ is uphill, - is downhill)
  elevationChangeMeters: number;
  // Toyota bZ Predicted Consumption
  predictedWhPerMile: number;
  predictedKwhPer100Km: number;
  baselineWhPerMile: number;
  baselineKwhPer100Km: number;
  consumptionDeltaPercent: number; // e.g. +28% for uphill, -35% for regen descent
  terrainImpactType: 'heavy_climb' | 'moderate_climb' | 'flat' | 'regen_descent' | 'heavy_regen';
  // Battery State & Energy
  cumulativeEnergyKwh: number;
  batterySoc: number; // Estimated % SoC along profile
  // Supercharger stop indicator if at this location
  stationStop?: CalculatedStationStop;
  isStationStop?: boolean;
  legType: 'outbound' | 'return';
}

export interface TerrainSummary {
  minElevationMeters: number;
  maxElevationMeters: number;
  minElevationFeet: number;
  maxElevationFeet: number;
  totalAscentMeters: number;
  totalDescentMeters: number;
  totalAscentFeet: number;
  totalDescentFeet: number;
  netElevationChangeMeters: number;
  netElevationChangeFeet: number;
  maxUphillGrade: number; // e.g. 5.2%
  maxDownhillGrade: number; // e.g. -4.8%
  avgConsumptionWhPerMile: number;
  avgConsumptionKwhPer100Km: number;
  baselineConsumptionWhPerMile: number;
  baselineConsumptionKwhPer100Km: number;
  terrainEnergyDeltaKwh: number; // Net extra kWh used (positive) or saved (negative)
  terrainRangeDeltaMiles: number; // Net range impact (+ or - miles)
  terrainRangeDeltaKm: number;
  points: ElevationPoint[];
  outboundPoints: ElevationPoint[];
  returnPoints: ElevationPoint[];
  hasSubstantialTerrain: boolean;
}

/**
 * Returns estimated base elevation in meters for a given city name or LatLng
 */
export function getBaseElevationForLocation(name: string, coords?: LatLng | null): number {
  const cleanName = name.trim().toLowerCase();
  for (const [key, elev] of Object.entries(KNOWN_ELEVATIONS_METERS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return elev;
    }
  }

  // Fallback estimation by coordinate geography
  if (coords) {
    // Great Lakes Basin / Ontario
    if (coords.lat > 42 && coords.lat < 46 && coords.lng > -82 && coords.lng < -75) {
      if (coords.lng > -79.5) return 90; // Lake Ontario / St. Lawrence Basin
      if (coords.lat > 43.3) return 310; // Ontario Moraine / Tri-Cities
      return 200;
    }
    // US Southwest / Mojave
    if (coords.lat > 33 && coords.lat < 37 && coords.lng > -119 && coords.lng < -114) {
      return 500;
    }
    // Texas
    if (coords.lat > 29 && coords.lat < 34 && coords.lng > -99 && coords.lng < -95) {
      return 140;
    }
    // US East Coast
    if (coords.lng > -78 && coords.lng < -71) {
      return 25;
    }
  }

  return 150; // Generic default elevation
}

/**
 * Generates an elevation altitude (in meters) along a corridor interpolation
 * incorporating realistic geographic moraines, escarpments, and highway grades.
 */
function interpolateCorridorElevation(
  t: number, // 0 to 1 along leg
  originElev: number,
  destElev: number,
  originCoords?: LatLng | null,
  destCoords?: LatLng | null,
  legDistanceMiles: number = 50
): number {
  // Base linear gradient between endpoints
  let elev = originElev + (destElev - originElev) * t;

  // Specific high-realism terrain features for well-known corridors:
  const isOntarioTriCitiesToToronto = 
    originElev > 280 && destElev < 120 && legDistanceMiles > 40 && legDistanceMiles < 120;
  const isTorontoToMontreal = 
    originElev < 120 && destElev < 60 && legDistanceMiles > 250;
  const isWaterlooToGuelph = 
    originElev > 300 && destElev > 300 && legDistanceMiles < 30;
  const isLAToVegas = 
    originElev < 120 && destElev > 500 && legDistanceMiles > 180;

  if (isOntarioTriCitiesToToronto) {
    // Traverses the Niagara Escarpment & Halton Hills
    // Gentle rise over Puslinch moraine, sharp drop past Milton into Lake Ontario plain
    const escarpmentPeak = Math.sin(t * Math.PI) * 25;
    const descentRidge = t > 0.4 && t < 0.75 ? -Math.sin((t - 0.4) / 0.35 * Math.PI) * 35 : 0;
    elev += escarpmentPeak + descentRidge;
  } else if (isWaterlooToGuelph) {
    // Highway 7 rolling moraines and Speed River valley
    const rollingHills = Math.sin(t * Math.PI * 3) * 14 + Math.cos(t * Math.PI * 5) * 8;
    elev += rollingHills;
  } else if (isTorontoToMontreal) {
    // Rolling St. Lawrence lowlands, hills around Port Hope and 1000 Islands
    const rollingWaves = Math.sin(t * Math.PI * 6) * 22 + Math.cos(t * Math.PI * 2) * 15;
    elev += rollingWaves;
  } else if (isLAToVegas) {
    // Cajon Pass (~1,150m) at t ~ 0.25 and Mountain Pass (~1,440m) at t ~ 0.75
    const cajonPass = Math.exp(-Math.pow((t - 0.28) / 0.1, 2)) * 850;
    const mountainPass = Math.exp(-Math.pow((t - 0.78) / 0.08, 2)) * 680;
    elev += cajonPass + mountainPass;
  } else {
    // Natural topographic undulation for general highways
    const waveCount = Math.max(2, Math.min(8, Math.round(legDistanceMiles / 25)));
    const undulation = Math.sin(t * Math.PI * waveCount) * (Math.min(45, legDistanceMiles * 0.4));
    const secondary = Math.cos(t * Math.PI * (waveCount * 2)) * 12;
    elev += undulation + secondary;
  }

  return Math.max(5, Math.round(elev));
}

/**
 * Calculates a complete corridor elevation profile and Toyota bZ consumption impact
 */
export function calculateCorridorElevationProfile(
  originName: string,
  destinationName: string,
  originCoords: LatLng | null,
  destCoords: LatLng | null,
  totalDistanceMiles: number,
  calculatedStops: CalculatedStationStop[],
  specs: VehicleSpecs,
  startingSoc: number = 80,
  tripType: TripType = 'one-way'
): TerrainSummary {
  const originElev = getBaseElevationForLocation(originName, originCoords);
  const destElev = getBaseElevationForLocation(destinationName, destCoords);

  // Effective vehicle parameters
  const { effectiveRangeMiles } = getEffectiveVehicleRange(specs);
  const baseWhPerMile = specs.consumptionWhPerMile || 245;
  const baseKwhPer100Km = baseWhPerMile * 0.0621371;

  // Toyota bZ estimated vehicle mass (kg)
  let vehicleMassKg = specs.drivetrain === 'AWD' ? 2080 : 2000;
  if (specs.cargoLoad === 'heavy') vehicleMassKg += 180;
  if (specs.cargoLoad === 'roof_box') vehicleMassKg += 90;

  const g = 9.81; // m/s^2
  const driveEfficiency = 0.88; // motor & inverter drive efficiency
  const regenEfficiency = 0.72; // regenerative braking round-trip recovery

  const isRoundTrip = tripType === 'two-way';
  const oneWayDistanceMiles = isRoundTrip ? totalDistanceMiles / 2 : totalDistanceMiles;

  // Determine sample resolution: ~30 to 50 sample slices per leg
  const SAMPLES_PER_LEG = Math.max(25, Math.min(50, Math.round(Math.max(15, oneWayDistanceMiles) / 3)));

  // Generate Outbound Leg
  const outboundRaw: { dist: number; elev: number; leg: 'outbound'; station?: CalculatedStationStop }[] = [];
  for (let i = 0; i <= SAMPLES_PER_LEG; i++) {
    const t = i / SAMPLES_PER_LEG;
    const dist = t * oneWayDistanceMiles;
    const elev = interpolateCorridorElevation(t, originElev, destElev, originCoords, destCoords, oneWayDistanceMiles);
    outboundRaw.push({ dist, elev, leg: 'outbound' });
  }

  // Insert outbound stations at their exact mileage
  const outboundStops = calculatedStops.filter(s => s.legType !== 'return');
  outboundStops.forEach(stop => {
    const dist = Math.min(oneWayDistanceMiles, Math.max(0, stop.distanceFromOriginMiles));
    const t = oneWayDistanceMiles > 0 ? dist / oneWayDistanceMiles : 0;
    const elev = interpolateCorridorElevation(t, originElev, destElev, originCoords, destCoords, oneWayDistanceMiles);
    outboundRaw.push({ dist, elev, leg: 'outbound', station: stop });
  });
  outboundRaw.sort((a, b) => a.dist - b.dist);

  // Filter duplicates within 0.4 miles
  const outboundClean: typeof outboundRaw = [];
  for (const pt of outboundRaw) {
    const prev = outboundClean[outboundClean.length - 1];
    if (!prev || Math.abs(pt.dist - prev.dist) > 0.4 || pt.station) {
      outboundClean.push(pt);
    }
  }

  // Generate Return Leg if round trip
  const returnRaw: { dist: number; elev: number; leg: 'return'; station?: CalculatedStationStop }[] = [];
  if (isRoundTrip) {
    for (let i = 0; i <= SAMPLES_PER_LEG; i++) {
      const t = i / SAMPLES_PER_LEG;
      const dist = oneWayDistanceMiles + (t * oneWayDistanceMiles);
      // On return, t goes from destination to origin!
      const elev = interpolateCorridorElevation(1 - t, originElev, destElev, originCoords, destCoords, oneWayDistanceMiles);
      returnRaw.push({ dist, elev, leg: 'return' });
    }

    const returnStops = calculatedStops.filter(s => s.legType === 'return');
    returnStops.forEach(stop => {
      const dist = Math.min(totalDistanceMiles, Math.max(oneWayDistanceMiles, stop.distanceFromOriginMiles));
      const returnDistAlongReturn = dist - oneWayDistanceMiles;
      const t = oneWayDistanceMiles > 0 ? returnDistAlongReturn / oneWayDistanceMiles : 0;
      const elev = interpolateCorridorElevation(1 - t, originElev, destElev, originCoords, destCoords, oneWayDistanceMiles);
      returnRaw.push({ dist, elev, leg: 'return', station: stop });
    });
    returnRaw.sort((a, b) => a.dist - b.dist);
  }

  const returnClean: typeof returnRaw = [];
  for (const pt of returnRaw) {
    const prev = returnClean[returnClean.length - 1];
    if (!prev || Math.abs(pt.dist - prev.dist) > 0.4 || pt.station) {
      returnClean.push(pt);
    }
  }

  const allRawPoints = [...outboundClean, ...returnClean];

  // Process points with physics consumption model
  const processedPoints: ElevationPoint[] = [];
  let totalAscentM = 0;
  let totalDescentM = 0;
  let cumulativeEnergyKwh = 0;
  let currentSoc = startingSoc;
  let maxUphillGrade = 0;
  let maxDownhillGrade = 0;

  for (let i = 0; i < allRawPoints.length; i++) {
    const curr = allRawPoints[i];
    const prev = i > 0 ? allRawPoints[i - 1] : curr;
    const legDistMiles = Math.max(0.1, curr.dist - prev.dist);
    const legDistMeters = legDistMiles * 1609.34;
    const deltaElevM = i === 0 ? 0 : curr.elev - prev.elev;

    if (deltaElevM > 0) totalAscentM += deltaElevM;
    if (deltaElevM < 0) totalDescentM += Math.abs(deltaElevM);

    // Grade percentage
    const gradePercent = legDistMeters > 0 ? Number(((deltaElevM / legDistMeters) * 100).toFixed(1)) : 0;
    if (gradePercent > maxUphillGrade) maxUphillGrade = gradePercent;
    if (gradePercent < maxDownhillGrade) maxDownhillGrade = gradePercent;

    // Potential Energy Delta in Joules = m * g * deltaH
    const deltaJoules = vehicleMassKg * g * deltaElevM;
    const deltaKwhPhysics = deltaJoules / 3600000;

    // Energy added or recovered
    let terrainWhSegment = 0;
    if (deltaElevM > 0) {
      // Climbing consumes extra energy divided by motor efficiency
      terrainWhSegment = (deltaKwhPhysics * 1000) / driveEfficiency;
    } else if (deltaElevM < 0) {
      // Descending regenerates energy multiplied by regen efficiency
      terrainWhSegment = (deltaKwhPhysics * 1000) * regenEfficiency;
    }

    // Baseline energy for segment
    const baseWhSegment = baseWhPerMile * legDistMiles;
    const totalWhSegment = Math.max(-100, baseWhSegment + terrainWhSegment);
    const predictedWhPerMile = Math.round(totalWhSegment / legDistMiles);
    const predictedKwhPer100Km = Number((predictedWhPerMile * 0.0621371).toFixed(1));

    cumulativeEnergyKwh += totalWhSegment / 1000;

    // Battery SoC impact
    const socDelta = (totalWhSegment / 1000 / specs.batteryCapacityKwh) * 100;
    currentSoc = Math.max(0, Math.min(100, currentSoc - socDelta));

    // Station recharge bump if applicable
    if (curr.station) {
      currentSoc = curr.station.targetDepartureSoc;
    }

    // Impact classification
    const consumptionDeltaPercent = Math.round(((predictedWhPerMile - baseWhPerMile) / baseWhPerMile) * 100);
    let terrainImpactType: ElevationPoint['terrainImpactType'] = 'flat';
    if (consumptionDeltaPercent >= 35) {
      terrainImpactType = 'heavy_climb';
    } else if (consumptionDeltaPercent > 10) {
      terrainImpactType = 'moderate_climb';
    } else if (consumptionDeltaPercent <= -40) {
      terrainImpactType = 'heavy_regen';
    } else if (consumptionDeltaPercent < -10) {
      terrainImpactType = 'regen_descent';
    }

    processedPoints.push({
      distanceMiles: Number(curr.dist.toFixed(1)),
      distanceKm: Number((curr.dist * 1.60934).toFixed(1)),
      elevationMeters: Math.round(curr.elev),
      elevationFeet: Math.round(curr.elev * 3.28084),
      gradePercent,
      elevationChangeMeters: Math.round(deltaElevM),
      predictedWhPerMile,
      predictedKwhPer100Km,
      baselineWhPerMile: baseWhPerMile,
      baselineKwhPer100Km: Number(baseKwhPer100Km.toFixed(1)),
      consumptionDeltaPercent,
      terrainImpactType,
      cumulativeEnergyKwh: Number(cumulativeEnergyKwh.toFixed(2)),
      batterySoc: Math.round(currentSoc),
      stationStop: curr.station,
      isStationStop: Boolean(curr.station),
      legType: curr.leg
    });
  }

  const elevationsM = processedPoints.map(p => p.elevationMeters);
  const minElevationMeters = Math.min(...elevationsM);
  const maxElevationMeters = Math.max(...elevationsM);

  const totalAscentFeet = Math.round(totalAscentM * 3.28084);
  const totalDescentFeet = Math.round(totalDescentM * 3.28084);
  const netElevationChangeMeters = Math.round((destElev - originElev) * (isRoundTrip ? 0 : 1));
  const netElevationChangeFeet = Math.round(netElevationChangeMeters * 3.28084);

  // Calculate average predicted consumption along entire corridor
  const totalPredictedWh = processedPoints.reduce((acc, p, idx) => {
    if (idx === 0) return 0;
    const segDist = p.distanceMiles - processedPoints[idx - 1].distanceMiles;
    return acc + (p.predictedWhPerMile * segDist);
  }, 0);
  const totalDistance = processedPoints[processedPoints.length - 1]?.distanceMiles || 1;
  const avgConsumptionWhPerMile = Math.round(totalPredictedWh / totalDistance);
  const avgConsumptionKwhPer100Km = Number((avgConsumptionWhPerMile * 0.0621371).toFixed(1));

  // Net energy delta compared to flat terrain
  const baselineTotalWh = baseWhPerMile * totalDistance;
  const terrainEnergyDeltaKwh = Number(((totalPredictedWh - baselineTotalWh) / 1000).toFixed(2));
  // Terrain range impact: extra energy converts to +/- miles of range
  const terrainRangeDeltaMiles = Number((-terrainEnergyDeltaKwh / (baseWhPerMile / 1000)).toFixed(1));
  const terrainRangeDeltaKm = Number((terrainRangeDeltaMiles * 1.60934).toFixed(1));

  const outboundPoints = processedPoints.filter(p => p.legType === 'outbound');
  const returnPoints = processedPoints.filter(p => p.legType === 'return');
  const hasSubstantialTerrain = totalAscentM > 35 || Math.abs(maxElevationMeters - minElevationMeters) > 30;

  return {
    minElevationMeters,
    maxElevationMeters,
    minElevationFeet: Math.round(minElevationMeters * 3.28084),
    maxElevationFeet: Math.round(maxElevationMeters * 3.28084),
    totalAscentMeters: Math.round(totalAscentM),
    totalDescentMeters: Math.round(totalDescentM),
    totalAscentFeet,
    totalDescentFeet,
    netElevationChangeMeters,
    netElevationChangeFeet,
    maxUphillGrade,
    maxDownhillGrade,
    avgConsumptionWhPerMile,
    avgConsumptionKwhPer100Km,
    baselineConsumptionWhPerMile: baseWhPerMile,
    baselineConsumptionKwhPer100Km: Number(baseKwhPer100Km.toFixed(1)),
    terrainEnergyDeltaKwh,
    terrainRangeDeltaMiles,
    terrainRangeDeltaKm,
    points: processedPoints,
    outboundPoints,
    returnPoints,
    hasSubstantialTerrain
  };
}
