import { ChargingStation, LatLng, VehicleSpecs } from '../types';
import { getEffectiveVehicleRange } from '../data/toyotaModels';

export type TripType = 'one-way' | 'two-way';
export type StopsPreference = 'auto' | number;

export interface CalculatedStationStop {
  station: ChargingStation;
  stopIndex: number;
  legType?: 'outbound' | 'return'; // Distinguishes outbound vs return leg in round trips
  distanceFromPrevMiles: number; // Distance in miles from previous point
  distanceFromOriginMiles: number; // Cumulative distance from trip start
  arrivalSoc: number; // State of Charge % when arriving at this station
  targetDepartureSoc: number; // State of Charge % needed before leaving to next stop
  chargeNeededPercent: number; // % SoC needed to charge at this station
  estimatedChargeMinutes: number; // Charging time in minutes
  arrivalWarning: boolean; // Arrival SoC is < 15%
  arrivalCritical: boolean; // Arrival SoC is < 0%
  stopReason?: string; // e.g. "Needed for destination target charge (85%)"
}

export interface RouteChargeSummary {
  startingSoc: number;
  targetDestinationSoc: number;
  destinationArrivalSoc: number;
  returnArrivalSoc?: number; // Final arrival SoC at origin for 2-way trips
  totalDistanceMiles: number;
  totalChargeMinutes: number;
  stops: CalculatedStationStop[];
  outboundStops: CalculatedStationStop[];
  returnStops: CalculatedStationStop[];
  hasLowSocWarning: boolean;
  criticalStopIndex: number | null;
  recommendedMinStartingSoc: number;
  isDirectRoute: boolean; // True when NO charging stops are planned for the trip
  directDistanceMiles: number;
  directSocUsed: number;
  directArrivalSoc: number;
  tripType: TripType;
  turnaroundDestinationSoc?: number; // SoC when arriving at turnaround city before return leg
  hasDestinationCharging?: boolean; // Destination charging available at turnaround point
  destinationChargeAddedSoc?: number; // SoC charged at turnaround point
  stopsPreference: StopsPreference; // User-selected stops preference
  plannedStopCount: number;
  stopsPreferenceNote?: string;
  effectiveRangeMiles: number;
  consumptionPenaltyPercent: number;
  rangeAdjustmentExplanation: string;
}

// Haversine formula for distance in miles between coordinates
export function getDistanceMiles(p1: LatLng, p2: LatLng): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Apply a 1.25 multiplier to estimate actual road distance from straight-line distance
  return Math.max(5, Math.round(R * c * 1.25));
}

// Helper to filter and order stations along a directed highway corridor
export function filterStationsAlongCorridor(
  from: LatLng,
  to: LatLng,
  stationList: ChargingStation[],
  maxCrossTrackMiles: number = 45
): ChargingStation[] {
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0 || stationList.length === 0) return [];

  const candidates = stationList.map(station => {
    const sx = station.position.lng - from.lng;
    const sy = station.position.lat - from.lat;
    const proj = (sx * dx + sy * dy) / lenSq;

    // Nearest point on line AB segment
    const clampedProj = Math.max(0, Math.min(1, proj));
    const closestPoint: LatLng = {
      lat: from.lat + clampedProj * dy,
      lng: from.lng + clampedProj * dx
    };
    const crossTrackMiles = getDistanceMiles(station.position, closestPoint);

    return {
      station,
      proj,
      crossTrackMiles
    };
  });

  // Filter stations strictly along the travel direction:
  // Must be between 2% and 98% along the travel vector
  // (rejects stations behind the starting point or past the destination)
  const forwardStations = candidates.filter(c => c.proj >= 0.02 && c.proj <= 0.98);

  // Filter by corridor width (cross-track distance)
  let corridorMatches = forwardStations.filter(c => c.crossTrackMiles <= maxCrossTrackMiles);

  // If strict radius is too narrow for sparser rural routes, relax up to 75 miles
  if (corridorMatches.length === 0 && forwardStations.length > 0) {
    corridorMatches = forwardStations.filter(c => c.crossTrackMiles <= 75);
  }

  // Sort strictly along travel direction (ascending projection)
  corridorMatches.sort((a, b) => a.proj - b.proj);

  return corridorMatches.map(c => c.station);
}

// Helper to order stations along a directed vector
export function sortStationsAlongVector(from: LatLng, to: LatLng, stationList: ChargingStation[]): ChargingStation[] {
  const corridorFiltered = filterStationsAlongCorridor(from, to, stationList);
  if (corridorFiltered.length > 0) {
    return corridorFiltered;
  }

  // Fallback if corridor filtering yields no stations
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const lenSq = dx * dx + dy * dy;
  return [...stationList].sort((a, b) => {
    if (lenSq === 0) {
      return getDistanceMiles(from, a.position) - getDistanceMiles(from, b.position);
    }
    const projA = ((a.position.lng - from.lng) * dx + (a.position.lat - from.lat) * dy) / lenSq;
    const projB = ((b.position.lng - from.lng) * dx + (b.position.lat - from.lat) * dy) / lenSq;
    return projA - projB;
  });
}

/**
 * Selects K evenly spaced stations from an ordered station array.
 */
function pickEvenlySpacedStations(stations: ChargingStation[], count: number): ChargingStation[] {
  if (count <= 0 || stations.length === 0) return [];
  if (count >= stations.length) return [...stations];
  if (count === 1) {
    const midIndex = Math.floor(stations.length / 2);
    return [stations[midIndex]];
  }

  const selected: ChargingStation[] = [];
  const step = (stations.length - 1) / (count - 1);
  const usedIndices = new Set<number>();

  for (let i = 0; i < count; i++) {
    const targetIdx = Math.min(stations.length - 1, Math.max(0, Math.round(i * step)));
    if (!usedIndices.has(targetIdx)) {
      selected.push(stations[targetIdx]);
      usedIndices.add(targetIdx);
    } else {
      let found = false;
      for (let offset = 1; offset < stations.length; offset++) {
        const left = targetIdx - offset;
        const right = targetIdx + offset;
        if (left >= 0 && !usedIndices.has(left)) {
          selected.push(stations[left]);
          usedIndices.add(left);
          found = true;
          break;
        }
        if (right < stations.length && !usedIndices.has(right)) {
          selected.push(stations[right]);
          usedIndices.add(right);
          found = true;
          break;
        }
      }
      if (!found && selected.length < stations.length) {
        selected.push(stations[targetIdx]);
      }
    }
  }

  return selected;
}

/**
 * Selects optimal charging stops along the filtered corridor stations.
 * Ensures:
 * 1. Stops are reachable with safe battery buffer (>= 12-15%).
 * 2. Charge amounts are calculated so the vehicle safely reaches the next stop or destination.
 * 3. Never produces negative arrival SoC when chargers exist along the route.
 */
function selectOptimalCorridorStops(
  origin: LatLng,
  destination: LatLng,
  corridorStations: ChargingStation[],
  startingSoc: number,
  targetDestSoc: number,
  socPerMile: number,
  stopsPreference: StopsPreference
): { activeStations: ChargingStation[]; preferenceNote: string } {
  if (stopsPreference === 0) {
    return {
      activeStations: [],
      preferenceNote: 'User selected 0 stops (Direct drive)'
    };
  }

  if (corridorStations.length === 0) {
    return {
      activeStations: [],
      preferenceNote: 'Direct route (no intermediate corridor stations found)'
    };
  }

  const oneWayDistanceMiles = getDistanceMiles(origin, destination);
  const totalTripSocUsed = Math.round(oneWayDistanceMiles * socPerMile);
  const directArrivalSoc = Math.round(startingSoc - totalTripSocUsed);

  // If user selected an exact number of stops:
  if (typeof stopsPreference === 'number' && stopsPreference > 0) {
    const k = Math.min(corridorStations.length, stopsPreference);
    const chosen = pickEvenlySpacedStations(corridorStations, k);
    return {
      activeStations: chosen,
      preferenceNote: `User selected ${chosen.length} stop${chosen.length !== 1 ? 's' : ''}`
    };
  }

  // 'auto' mode:
  // Can we make the entire trip directly with arrival SoC >= targetDestSoc and >= 15%?
  if (directArrivalSoc >= targetDestSoc && directArrivalSoc >= 15) {
    return {
      activeStations: [],
      preferenceNote: 'Auto: Direct route optimal (no charging stops required)'
    };
  }

  // If trip is directly reachable with safe battery (>15%) but needs a top-up to meet destination target SoC:
  if (directArrivalSoc >= 15 && targetDestSoc > directArrivalSoc) {
    const midStop = pickEvenlySpacedStations(corridorStations, 1);
    return {
      activeStations: midStop,
      preferenceNote: 'Auto: 1 optimal stop selected to reach destination target SoC'
    };
  }

  // Route planning simulation with battery reachability:
  const selected: ChargingStation[] = [];
  let currentPos = origin;
  let currentSoc = startingSoc;
  let remainingStations = [...corridorStations];

  const MAX_STOPS = 6;
  while (selected.length < MAX_STOPS) {
    const distToDest = getDistanceMiles(currentPos, destination);
    const socToDest = distToDest * socPerMile;

    // Can we reach the destination safely from currentPos with currentSoc?
    if (currentSoc - socToDest >= targetDestSoc && currentSoc - socToDest >= 12) {
      break;
    }

    // Candidate stations ahead of current position
    const stationsAhead = remainingStations.filter(s => {
      const dFromCurrent = getDistanceMiles(currentPos, s.position);
      const dToDest = getDistanceMiles(s.position, destination);
      return dFromCurrent >= 10 && dToDest < distToDest - 8;
    });

    if (stationsAhead.length === 0) {
      break;
    }

    // Evaluate reachability: station is reachable if arrival SoC >= 10%
    const reachable = stationsAhead.map(s => {
      const dist = getDistanceMiles(currentPos, s.position);
      const arrival = currentSoc - (dist * socPerMile);
      return { station: s, dist, arrival };
    }).filter(item => item.arrival >= 10);

    let chosenStation: ChargingStation;

    if (reachable.length > 0) {
      // Check if any reachable station allows completing the journey in 1 more leg (charging to 90%)
      const canCompleteJourney = reachable.filter(item => {
        const remainingDist = getDistanceMiles(item.station.position, destination);
        const socNeeded = remainingDist * socPerMile;
        return (90 - socNeeded) >= targetDestSoc;
      });

      if (canCompleteJourney.length > 0) {
        // Pick the station closest to the balanced midpoint or with most comfortable arrival SoC (15-28%)
        canCompleteJourney.sort((a, b) => Math.abs(a.arrival - 22) - Math.abs(b.arrival - 22));
        chosenStation = canCompleteJourney[0].station;
      } else {
        // Multiple stops remaining: pick the furthest reachable station that maintains at least 12% SoC
        reachable.sort((a, b) => {
          if (a.arrival >= 12 && b.arrival >= 12) {
            return b.dist - a.dist;
          }
          return b.arrival - a.arrival;
        });
        chosenStation = reachable[0].station;
      }
    } else {
      // Battery is very low: pick closest station ahead to minimize drain
      stationsAhead.sort((a, b) => getDistanceMiles(currentPos, a.position) - getDistanceMiles(currentPos, b.position));
      chosenStation = stationsAhead[0];
    }

    selected.push(chosenStation);

    // Advance position and battery state
    const legDist = getDistanceMiles(currentPos, chosenStation.position);
    const arrivalSoc = Math.round(currentSoc - (legDist * socPerMile));

    const remainingDist = getDistanceMiles(chosenStation.position, destination);
    const socNeededToDest = remainingDist * socPerMile;

    let nextDeparture: number;
    if (socNeededToDest + targetDestSoc <= 92) {
      nextDeparture = Math.min(95, Math.ceil(socNeededToDest + targetDestSoc));
    } else {
      nextDeparture = 85;
    }

    currentPos = chosenStation.position;
    currentSoc = Math.max(nextDeparture, arrivalSoc);

    // Remove chosen and stations behind it
    remainingStations = remainingStations.filter(s => {
      return getDistanceMiles(s.position, destination) < remainingDist - 8;
    });
  }

  // Fallback if simulation generated 0 stops but trip is not safe
  if (selected.length === 0 && directArrivalSoc < targetDestSoc && corridorStations.length > 0) {
    const needed = Math.max(1, Math.min(corridorStations.length, Math.ceil(oneWayDistanceMiles / 160)));
    const balanced = pickEvenlySpacedStations(corridorStations, needed);
    return {
      activeStations: balanced,
      preferenceNote: `Auto: ${balanced.length} optimal stop${balanced.length > 1 ? 's' : ''} planned for maximum efficiency`
    };
  }

  return {
    activeStations: selected,
    preferenceNote: `Auto: ${selected.length} optimal stop${selected.length > 1 ? 's' : ''} planned for maximum efficiency`
  };
}

/**
 * Calculates battery SoC progression, arrival %, required departure %, and charge time
 * for a sequence of charging stations along a route (One-Way or Two-Way Round Trip)
 * taking into account user-selected number of stops.
 */
export function calculateRouteChargeTelemetry(
  startingSoc: number,
  originCoords: LatLng | null,
  destCoords: LatLng | null,
  stations: ChargingStation[],
  specs: VehicleSpecs,
  targetDestinationSoc: number = 20,
  tripType: TripType = 'one-way',
  hasDestinationCharging: boolean = false,
  stopsPreference: StopsPreference = 'auto'
): RouteChargeSummary {
  const safeStartingSoc = Math.min(100, Math.max(5, startingSoc));
  const safeTargetDestSoc = Math.min(95, Math.max(10, targetDestinationSoc));
  
  // Calculate effective range accounting for weather, aerodynamic load, and user customizations
  const { effectiveRangeMiles, consumptionPenaltyPercent, explanation: rangeAdjustmentExplanation } = getEffectiveVehicleRange(specs);
  const socPerMile = 100 / Math.max(50, effectiveRangeMiles);

  if (!originCoords || !destCoords) {
    return {
      startingSoc: safeStartingSoc,
      targetDestinationSoc: safeTargetDestSoc,
      destinationArrivalSoc: safeStartingSoc,
      returnArrivalSoc: safeStartingSoc,
      totalDistanceMiles: 0,
      totalChargeMinutes: 0,
      stops: [],
      outboundStops: [],
      returnStops: [],
      hasLowSocWarning: false,
      criticalStopIndex: null,
      recommendedMinStartingSoc: 20,
      isDirectRoute: true,
      directDistanceMiles: 0,
      directSocUsed: 0,
      directArrivalSoc: safeStartingSoc,
      tripType,
      hasDestinationCharging,
      stopsPreference,
      plannedStopCount: 0,
      stopsPreferenceNote: 'Awaiting route coordinates',
      effectiveRangeMiles,
      consumptionPenaltyPercent,
      rangeAdjustmentExplanation
    };
  }

  const oneWayDistanceMiles = getDistanceMiles(originCoords, destCoords);
  const totalTripDistanceMiles = tripType === 'two-way' ? oneWayDistanceMiles * 2 : oneWayDistanceMiles;
  const totalTripSocUsed = Math.round(totalTripDistanceMiles * socPerMile);
  const directArrivalSoc = Math.round(safeStartingSoc - totalTripSocUsed);

  // -------------------------------------------------------------
  // Case A: ONE-WAY TRIP
  // -------------------------------------------------------------
  if (tripType === 'one-way') {
    const corridorStations = filterStationsAlongCorridor(originCoords, destCoords, stations);
    const { activeStations, preferenceNote } = selectOptimalCorridorStops(
      originCoords,
      destCoords,
      corridorStations,
      safeStartingSoc,
      safeTargetDestSoc,
      socPerMile,
      stopsPreference
    );

    // If no active stations (either direct or no chargers available)
    if (activeStations.length === 0) {
      const isDirectSafe = directArrivalSoc >= 15;
      return {
        startingSoc: safeStartingSoc,
        targetDestinationSoc: safeTargetDestSoc,
        destinationArrivalSoc: Math.max(0, directArrivalSoc),
        totalDistanceMiles: oneWayDistanceMiles,
        totalChargeMinutes: 0,
        stops: [],
        outboundStops: [],
        returnStops: [],
        hasLowSocWarning: directArrivalSoc < 15,
        criticalStopIndex: directArrivalSoc < 0 ? 0 : null,
        recommendedMinStartingSoc: Math.min(100, Math.ceil(totalTripSocUsed + safeTargetDestSoc)),
        isDirectRoute: true,
        directDistanceMiles: oneWayDistanceMiles,
        directSocUsed: totalTripSocUsed,
        directArrivalSoc,
        tripType,
        stopsPreference,
        plannedStopCount: 0,
        stopsPreferenceNote: preferenceNote || (isDirectSafe ? 'Direct route' : 'Direct route with low battery warning'),
        effectiveRangeMiles,
        consumptionPenaltyPercent,
        rangeAdjustmentExplanation
      };
    }

    // Calculate segments with activeStations
    const legDistances: number[] = [];
    let prevPos = originCoords;
    for (const station of activeStations) {
      const legDist = Math.max(8, getDistanceMiles(prevPos, station.position));
      legDistances.push(legDist);
      prevPos = station.position;
    }
    const lastLegDist = Math.max(8, getDistanceMiles(prevPos, destCoords));
    legDistances.push(lastLegDist);

    const calculatedStops: CalculatedStationStop[] = [];
    let currentSoc = safeStartingSoc;
    let totalChargeMinutes = 0;
    let hasLowSocWarning = false;
    let criticalStopIndex: number | null = null;
    let cumulativeDistance = 0;

    for (let i = 0; i < activeStations.length; i++) {
      const station = activeStations[i];
      const legDist = legDistances[i];
      cumulativeDistance += legDist;
      const socUsed = legDist * socPerMile;
      const arrivalSoc = Math.round(currentSoc - socUsed);
      const safeArrivalSoc = Math.max(0, arrivalSoc);

      if (arrivalSoc < 15) hasLowSocWarning = true;
      if (arrivalSoc <= 0 && criticalStopIndex === null) criticalStopIndex = i;

      const nextLegDist = legDistances[i + 1];
      const nextLegSocNeeded = nextLegDist * socPerMile;
      const isFinalStop = i === activeStations.length - 1;
      const requiredBuffer = isFinalStop ? safeTargetDestSoc : 15;
      const minSocNeededForNextLeg = Math.ceil(nextLegSocNeeded + requiredBuffer);

      let targetDepartureSoc: number;
      let chargeNeededPercent: number;
      let stopReason: string | undefined;

      const isCustomMultiStop = typeof stopsPreference === 'number' && stopsPreference > 1;

      if (arrivalSoc >= minSocNeededForNextLeg && !isCustomMultiStop) {
        targetDepartureSoc = Math.min(95, arrivalSoc);
        chargeNeededPercent = 0;
        stopReason = 'Battery sufficient for next route segment';
      } else {
        const baseTarget = Math.max(minSocNeededForNextLeg, isCustomMultiStop ? Math.min(80, safeArrivalSoc + 25) : 60);
        targetDepartureSoc = Math.min(95, Math.max(baseTarget, safeArrivalSoc + 10));
        chargeNeededPercent = Math.max(0, targetDepartureSoc - safeArrivalSoc);
        
        if (isFinalStop && safeTargetDestSoc > 20) {
          stopReason = `Charged to meet your ${safeTargetDestSoc}% destination arrival goal`;
        } else if (isCustomMultiStop) {
          stopReason = `Stop ${i + 1} of ${activeStations.length}: High-speed top-up`;
        } else {
          stopReason = 'Recharge required for next route segment';
        }
      }

      if (arrivalSoc <= 0) {
        stopReason = `⚠️ Range deficit: leg of ${Math.round(legDist)} mi exceeds battery charge without intermediate top-up`;
      }

      const effectiveKw = Math.min(station.speedKw, specs.maxChargeRateKw) * 0.85;
      const kWhDelivered = (chargeNeededPercent / 100) * specs.batteryCapacityKwh;
      const estimatedChargeMinutes = chargeNeededPercent > 0 
        ? Math.max(4, Math.round((kWhDelivered / effectiveKw) * 60))
        : 0;

      totalChargeMinutes += estimatedChargeMinutes;

      calculatedStops.push({
        station,
        stopIndex: i,
        legType: 'outbound',
        distanceFromPrevMiles: legDist,
        distanceFromOriginMiles: cumulativeDistance,
        arrivalSoc,
        targetDepartureSoc,
        chargeNeededPercent,
        estimatedChargeMinutes,
        arrivalWarning: arrivalSoc < 15,
        arrivalCritical: arrivalSoc <= 0,
        stopReason
      });

      currentSoc = targetDepartureSoc;
    }

    const finalArrivalSoc = Math.round(currentSoc - (legDistances[legDistances.length - 1] * socPerMile));

    return {
      startingSoc: safeStartingSoc,
      targetDestinationSoc: safeTargetDestSoc,
      destinationArrivalSoc: Math.max(0, finalArrivalSoc),
      totalDistanceMiles: legDistances.reduce((a, b) => a + b, 0),
      totalChargeMinutes,
      stops: calculatedStops,
      outboundStops: calculatedStops,
      returnStops: [],
      hasLowSocWarning: hasLowSocWarning || finalArrivalSoc < 15,
      criticalStopIndex,
      recommendedMinStartingSoc: Math.min(100, Math.ceil((legDistances[0] * socPerMile) + 20)),
      isDirectRoute: false,
      directDistanceMiles: oneWayDistanceMiles,
      directSocUsed: totalTripSocUsed,
      directArrivalSoc,
      tripType,
      stopsPreference,
      plannedStopCount: calculatedStops.length,
      stopsPreferenceNote: preferenceNote,
      effectiveRangeMiles,
      consumptionPenaltyPercent,
      rangeAdjustmentExplanation
    };
  }

  // -------------------------------------------------------------
  // Case B: TWO-WAY (ROUND TRIP) PLANNER
  // -------------------------------------------------------------
  const outboundCorridor = filterStationsAlongCorridor(originCoords, destCoords, stations);
  const returnCorridor = filterStationsAlongCorridor(destCoords, originCoords, stations);

  const outboundSocUsedDirect = Math.round(oneWayDistanceMiles * socPerMile);
  const turnaroundArrivalSocWithoutCharging = Math.round(safeStartingSoc - outboundSocUsedDirect);

  // Determine active stations for outbound and return
  let activeOutboundStations: ChargingStation[] = [];
  let activeReturnStations: ChargingStation[] = [];
  let preferenceNote = '';

  if (stopsPreference === 0) {
    activeOutboundStations = [];
    activeReturnStations = [];
    preferenceNote = directArrivalSoc >= safeTargetDestSoc
      ? 'Direct round-trip selected by user (0 stops)'
      : 'User selected 0 stops for round-trip - caution: insufficient battery for full loop';
  } else if (typeof stopsPreference === 'number' && stopsPreference > 0) {
    const k = stopsPreference;
    if (k === 1) {
      if (turnaroundArrivalSocWithoutCharging < 20 || !hasDestinationCharging) {
        if (turnaroundArrivalSocWithoutCharging < 15 && outboundCorridor.length > 0) {
          activeOutboundStations = pickEvenlySpacedStations(outboundCorridor, 1);
        } else if (returnCorridor.length > 0) {
          activeReturnStations = pickEvenlySpacedStations(returnCorridor, 1);
        } else if (outboundCorridor.length > 0) {
          activeOutboundStations = pickEvenlySpacedStations(outboundCorridor, 1);
        }
      } else if (returnCorridor.length > 0) {
        activeReturnStations = pickEvenlySpacedStations(returnCorridor, 1);
      }
    } else if (k === 2) {
      activeOutboundStations = outboundCorridor.length > 0 ? pickEvenlySpacedStations(outboundCorridor, 1) : [];
      activeReturnStations = returnCorridor.length > 0 ? pickEvenlySpacedStations(returnCorridor, 1) : [];
    } else {
      const outboundCount = Math.floor(k / 2);
      const returnCount = k - outboundCount;
      activeOutboundStations = pickEvenlySpacedStations(outboundCorridor, outboundCount);
      activeReturnStations = pickEvenlySpacedStations(returnCorridor, returnCount);
    }
    preferenceNote = `User selected ${activeOutboundStations.length + activeReturnStations.length} stops (${activeOutboundStations.length} outbound, ${activeReturnStations.length} return)`;
  } else {
    // 'auto' mode
    if (directArrivalSoc >= safeTargetDestSoc && directArrivalSoc >= 15 && hasDestinationCharging) {
      activeOutboundStations = [];
      activeReturnStations = [];
      preferenceNote = 'Auto: Direct round trip with destination charging (0 highway stops needed)';
    } else {
      const outPlan = selectOptimalCorridorStops(
        originCoords,
        destCoords,
        outboundCorridor,
        safeStartingSoc,
        safeTargetDestSoc,
        socPerMile,
        'auto'
      );
      activeOutboundStations = outPlan.activeStations;

      const returnStartSoc = hasDestinationCharging ? 90 : Math.max(30, safeTargetDestSoc);
      const returnPlan = selectOptimalCorridorStops(
        destCoords,
        originCoords,
        returnCorridor,
        returnStartSoc,
        safeTargetDestSoc,
        socPerMile,
        'auto'
      );
      activeReturnStations = returnPlan.activeStations;

      preferenceNote = `Auto: ${activeOutboundStations.length + activeReturnStations.length} optimal round-trip stop${(activeOutboundStations.length + activeReturnStations.length) !== 1 ? 's' : ''}`;
    }
  }

  // If direct round trip with 0 stops
  if (activeOutboundStations.length === 0 && activeReturnStations.length === 0) {
    const turnaroundSoc = Math.max(0, safeStartingSoc - outboundSocUsedDirect);
    let afterDestSoc = turnaroundSoc;
    let destinationChargeAddedSoc = 0;
    if (hasDestinationCharging) {
      destinationChargeAddedSoc = Math.max(0, 90 - turnaroundSoc);
      afterDestSoc = 90;
    }
    const finalReturnArrivalSoc = Math.max(0, afterDestSoc - outboundSocUsedDirect);

    return {
      startingSoc: safeStartingSoc,
      targetDestinationSoc: safeTargetDestSoc,
      destinationArrivalSoc: turnaroundSoc,
      returnArrivalSoc: finalReturnArrivalSoc,
      totalDistanceMiles: totalTripDistanceMiles,
      totalChargeMinutes: 0,
      stops: [],
      outboundStops: [],
      returnStops: [],
      hasLowSocWarning: finalReturnArrivalSoc < 15 || turnaroundSoc < 15,
      criticalStopIndex: (turnaroundSoc < 0 || finalReturnArrivalSoc < 0) ? 0 : null,
      recommendedMinStartingSoc: Math.min(100, Math.ceil(totalTripSocUsed + safeTargetDestSoc)),
      isDirectRoute: true,
      directDistanceMiles: totalTripDistanceMiles,
      directSocUsed: totalTripSocUsed,
      directArrivalSoc: finalReturnArrivalSoc,
      tripType,
      turnaroundDestinationSoc: turnaroundSoc,
      hasDestinationCharging,
      destinationChargeAddedSoc,
      stopsPreference,
      plannedStopCount: 0,
      stopsPreferenceNote: preferenceNote,
      effectiveRangeMiles,
      consumptionPenaltyPercent,
      rangeAdjustmentExplanation
    };
  }

  // Calculate Two-Way Stops Telemetry
  const outboundStops: CalculatedStationStop[] = [];
  const returnStops: CalculatedStationStop[] = [];
  const allStops: CalculatedStationStop[] = [];
  let totalChargeMinutes = 0;
  let hasLowSocWarning = false;
  let criticalStopIndex: number | null = null;

  let currentSoc = safeStartingSoc;
  let cumulativeDistance = 0;
  let stopCounter = 0;

  // 1. Calculate Outbound stops
  let prevPos = originCoords;
  for (let i = 0; i < activeOutboundStations.length; i++) {
    const station = activeOutboundStations[i];
    const legDist = Math.max(8, getDistanceMiles(prevPos, station.position));
    cumulativeDistance += legDist;
    const socUsed = legDist * socPerMile;
    const arrivalSoc = Math.round(currentSoc - socUsed);
    const safeArrivalSoc = Math.max(0, arrivalSoc);

    if (arrivalSoc < 15) hasLowSocWarning = true;
    if (arrivalSoc <= 0 && criticalStopIndex === null) criticalStopIndex = stopCounter;

    const distToTurnaround = Math.max(8, getDistanceMiles(station.position, destCoords));
    const nextSocNeeded = distToTurnaround * socPerMile;
    const targetDepartureSoc = Math.min(95, Math.max(Math.ceil(nextSocNeeded + 25), 65));
    const chargeNeededPercent = Math.max(0, targetDepartureSoc - safeArrivalSoc);

    const effectiveKw = Math.min(station.speedKw, specs.maxChargeRateKw) * 0.85;
    const kWhDelivered = (chargeNeededPercent / 100) * specs.batteryCapacityKwh;
    const estimatedChargeMinutes = chargeNeededPercent > 0 
      ? Math.max(4, Math.round((kWhDelivered / effectiveKw) * 60))
      : 0;

    totalChargeMinutes += estimatedChargeMinutes;

    const stopObj: CalculatedStationStop = {
      station,
      stopIndex: stopCounter++,
      legType: 'outbound',
      distanceFromPrevMiles: legDist,
      distanceFromOriginMiles: cumulativeDistance,
      arrivalSoc,
      targetDepartureSoc,
      chargeNeededPercent,
      estimatedChargeMinutes,
      arrivalWarning: arrivalSoc < 15,
      arrivalCritical: arrivalSoc <= 0,
      stopReason: arrivalSoc <= 0
        ? `⚠️ Range deficit: leg exceeds battery charge without intermediate stop`
        : `Outbound recharge to reach turnaround destination`
    };

    outboundStops.push(stopObj);
    allStops.push(stopObj);
    currentSoc = targetDepartureSoc;
    prevPos = station.position;
  }

  // Outbound arrival at destination (turnaround point)
  const lastOutboundLeg = Math.max(8, getDistanceMiles(prevPos, destCoords));
  cumulativeDistance += lastOutboundLeg;
  const turnaroundArrivalSoc = Math.max(0, Math.round(currentSoc - (lastOutboundLeg * socPerMile)));
  if (turnaroundArrivalSoc < 15) hasLowSocWarning = true;
  currentSoc = turnaroundArrivalSoc;

  let destinationChargeAddedSoc = 0;
  if (hasDestinationCharging) {
    const targetTurnaroundSoc = 90;
    if (currentSoc < targetTurnaroundSoc) {
      destinationChargeAddedSoc = targetTurnaroundSoc - currentSoc;
      currentSoc = targetTurnaroundSoc;
    }
  }

  // 2. Calculate Return stops
  prevPos = destCoords;
  for (let i = 0; i < activeReturnStations.length; i++) {
    const station = activeReturnStations[i];
    const legDist = Math.max(8, getDistanceMiles(prevPos, station.position));
    cumulativeDistance += legDist;
    const socUsed = legDist * socPerMile;
    const arrivalSoc = Math.round(currentSoc - socUsed);
    const safeArrivalSoc = Math.max(0, arrivalSoc);

    if (arrivalSoc < 15) hasLowSocWarning = true;
    if (arrivalSoc <= 0 && criticalStopIndex === null) criticalStopIndex = stopCounter;

    const distToOrigin = Math.max(8, getDistanceMiles(station.position, originCoords));
    const nextSocNeeded = distToOrigin * socPerMile;
    const targetDepartureSoc = Math.min(95, Math.max(Math.ceil(nextSocNeeded + safeTargetDestSoc), 60));
    const chargeNeededPercent = Math.max(0, targetDepartureSoc - safeArrivalSoc);

    const effectiveKw = Math.min(station.speedKw, specs.maxChargeRateKw) * 0.85;
    const kWhDelivered = (chargeNeededPercent / 100) * specs.batteryCapacityKwh;
    const estimatedChargeMinutes = chargeNeededPercent > 0 
      ? Math.max(4, Math.round((kWhDelivered / effectiveKw) * 60))
      : 0;

    totalChargeMinutes += estimatedChargeMinutes;

    const stopObj: CalculatedStationStop = {
      station,
      stopIndex: stopCounter++,
      legType: 'return',
      distanceFromPrevMiles: legDist,
      distanceFromOriginMiles: cumulativeDistance,
      arrivalSoc,
      targetDepartureSoc,
      chargeNeededPercent,
      estimatedChargeMinutes,
      arrivalWarning: arrivalSoc < 15,
      arrivalCritical: arrivalSoc <= 0,
      stopReason: arrivalSoc <= 0
        ? `⚠️ Range deficit: leg exceeds battery charge without intermediate stop`
        : `Return recharge to arrive back at origin with ≥${safeTargetDestSoc}% SoC`
    };

    returnStops.push(stopObj);
    allStops.push(stopObj);
    currentSoc = targetDepartureSoc;
    prevPos = station.position;
  }

  const finalReturnLeg = Math.max(8, getDistanceMiles(prevPos, originCoords));
  cumulativeDistance += finalReturnLeg;
  const returnFinalArrivalSoc = Math.max(0, Math.round(currentSoc - (finalReturnLeg * socPerMile)));

  return {
    startingSoc: safeStartingSoc,
    targetDestinationSoc: safeTargetDestSoc,
    destinationArrivalSoc: turnaroundArrivalSoc,
    returnArrivalSoc: returnFinalArrivalSoc,
    totalDistanceMiles: cumulativeDistance,
    totalChargeMinutes,
    stops: allStops,
    outboundStops,
    returnStops,
    hasLowSocWarning: hasLowSocWarning || returnFinalArrivalSoc < 15,
    criticalStopIndex,
    recommendedMinStartingSoc: Math.min(100, Math.ceil((oneWayDistanceMiles * socPerMile * 0.6) + 20)),
    isDirectRoute: allStops.length === 0,
    directDistanceMiles: totalTripDistanceMiles,
    directSocUsed: totalTripSocUsed,
    directArrivalSoc,
    tripType,
    turnaroundDestinationSoc: turnaroundArrivalSoc,
    hasDestinationCharging,
    destinationChargeAddedSoc,
    stopsPreference,
    plannedStopCount: allStops.length,
    stopsPreferenceNote: preferenceNote,
    effectiveRangeMiles,
    consumptionPenaltyPercent,
    rangeAdjustmentExplanation
  };
}

