import { ChargingStation, LatLng, VehicleSpecs } from '../types';

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

// Helper to order stations along a directed vector
export function sortStationsAlongVector(from: LatLng, to: LatLng, stationList: ChargingStation[]): ChargingStation[] {
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
      // Find nearest unused
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
  const socPerMile = 100 / specs.estimatedRangeMiles;

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
      stopsPreferenceNote: 'Awaiting route coordinates'
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
    const orderedStations = sortStationsAlongVector(originCoords, destCoords, stations);

    // Determine active stations based on stopsPreference
    let activeStations: ChargingStation[] = [];
    let preferenceNote = '';

    if (stopsPreference === 0) {
      // Force 0 stops (Direct Drive)
      activeStations = [];
      preferenceNote = directArrivalSoc >= safeTargetDestSoc 
        ? 'Direct non-stop trip selected by user'
        : 'User selected 0 stops (Direct drive) - caution: arrival battery is below target';
    } else if (typeof stopsPreference === 'number' && stopsPreference > 0) {
      // User requested exact number of stops
      activeStations = pickEvenlySpacedStations(orderedStations, stopsPreference);
      preferenceNote = `User selected ${activeStations.length} stop${activeStations.length !== 1 ? 's' : ''}`;
    } else {
      // 'auto' mode: smart calculation
      if (directArrivalSoc >= safeTargetDestSoc && directArrivalSoc >= 15) {
        // Direct trip is completely safe
        activeStations = [];
        preferenceNote = 'Auto: Direct route optimal (no charging stops required)';
      } else if (stations.length === 0) {
        activeStations = [];
        preferenceNote = 'Auto: No corridor stations available';
      } else {
        // Calculate minimum stops needed
        if (directArrivalSoc >= 15 && safeTargetDestSoc > directArrivalSoc) {
          // Just need 1 top-up stop to meet arrival goal
          activeStations = pickEvenlySpacedStations(orderedStations, 1);
          preferenceNote = 'Auto: 1 optimal stop selected to reach destination target SoC';
        } else {
          // Need enough stops so no leg exceeds ~180 miles (~70% range)
          const neededStops = Math.max(1, Math.min(orderedStations.length, Math.ceil(oneWayDistanceMiles / 160)));
          activeStations = pickEvenlySpacedStations(orderedStations, neededStops);
          preferenceNote = `Auto: ${activeStations.length} optimal stop${activeStations.length > 1 ? 's' : ''} planned for maximum efficiency`;
        }
      }
    }

    // If no active stations (either chosen or direct)
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
        stopsPreferenceNote: preferenceNote || (isDirectSafe ? 'Direct route' : 'Direct route with low battery warning')
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

      if (arrivalSoc < 15) hasLowSocWarning = true;
      if (arrivalSoc < 0 && criticalStopIndex === null) criticalStopIndex = i;

      const nextLegDist = legDistances[i + 1];
      const nextLegSocNeeded = nextLegDist * socPerMile;
      const isFinalStop = i === activeStations.length - 1;
      const requiredBuffer = isFinalStop ? safeTargetDestSoc : 15;
      const minSocNeededForNextLeg = Math.ceil(nextLegSocNeeded + requiredBuffer);

      let targetDepartureSoc: number;
      let chargeNeededPercent: number;
      let stopReason: string | undefined;

      // When user selects multiple custom stops, give each stop a comfortable balanced charge
      const isCustomMultiStop = typeof stopsPreference === 'number' && stopsPreference > 1;

      if (arrivalSoc >= minSocNeededForNextLeg && !isCustomMultiStop) {
        targetDepartureSoc = arrivalSoc;
        chargeNeededPercent = 0;
        stopReason = 'Optional quick stop / Battery sufficient for next leg';
      } else {
        const baseTarget = Math.max(minSocNeededForNextLeg, isCustomMultiStop ? Math.min(80, arrivalSoc + 25) : 55);
        targetDepartureSoc = Math.min(95, Math.max(baseTarget, arrivalSoc + 10));
        chargeNeededPercent = Math.max(0, targetDepartureSoc - arrivalSoc);
        
        if (isFinalStop && safeTargetDestSoc > 20) {
          stopReason = `Charged to meet your ${safeTargetDestSoc}% destination arrival goal`;
        } else if (isCustomMultiStop) {
          stopReason = `Stop ${i + 1} of ${activeStations.length}: High-speed top-up`;
        } else {
          stopReason = 'Recharge required for next route segment';
        }
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
        arrivalCritical: arrivalSoc < 0,
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
      stopsPreferenceNote: preferenceNote
    };
  }

  // -------------------------------------------------------------
  // Case B: TWO-WAY (ROUND TRIP) PLANNER
  // -------------------------------------------------------------
  const outboundOrderedStations = sortStationsAlongVector(originCoords, destCoords, stations);
  const returnOrderedStations = sortStationsAlongVector(destCoords, originCoords, stations);

  const outboundSocUsedDirect = Math.round(oneWayDistanceMiles * socPerMile);
  const turnaroundArrivalSocWithoutCharging = Math.round(safeStartingSoc - outboundSocUsedDirect);

  // Determine active stations for outbound and return
  let activeOutboundStations: ChargingStation[] = [];
  let activeReturnStations: ChargingStation[] = [];
  let preferenceNote = '';

  if (stopsPreference === 0) {
    // Force 0 stops for round trip
    activeOutboundStations = [];
    activeReturnStations = [];
    preferenceNote = directArrivalSoc >= safeTargetDestSoc
      ? 'Direct round-trip selected by user (0 stops)'
      : 'User selected 0 stops for round-trip - caution: insufficient battery for full loop';
  } else if (typeof stopsPreference === 'number' && stopsPreference > 0) {
    const k = stopsPreference;
    if (k === 1) {
      // 1 stop total
      if (turnaroundArrivalSocWithoutCharging < 20 || !hasDestinationCharging) {
        // If outbound is tight or no dest charging, place 1 stop on return or outbound
        if (turnaroundArrivalSocWithoutCharging < 15) {
          activeOutboundStations = pickEvenlySpacedStations(outboundOrderedStations, 1);
        } else {
          activeReturnStations = pickEvenlySpacedStations(returnOrderedStations, 1);
        }
      } else {
        activeReturnStations = pickEvenlySpacedStations(returnOrderedStations, 1);
      }
    } else if (k === 2) {
      // 2 stops total: 1 Outbound + 1 Return
      activeOutboundStations = pickEvenlySpacedStations(outboundOrderedStations, 1);
      activeReturnStations = pickEvenlySpacedStations(returnOrderedStations, 1);
    } else {
      // 3 or more stops: evenly distribute across legs
      const outboundCount = Math.floor(k / 2);
      const returnCount = k - outboundCount;
      activeOutboundStations = pickEvenlySpacedStations(outboundOrderedStations, outboundCount);
      activeReturnStations = pickEvenlySpacedStations(returnOrderedStations, returnCount);
    }
    preferenceNote = `User selected ${activeOutboundStations.length + activeReturnStations.length} stops (${activeOutboundStations.length} outbound, ${activeReturnStations.length} return)`;
  } else {
    // 'auto' mode
    if (directArrivalSoc >= safeTargetDestSoc && directArrivalSoc >= 15) {
      activeOutboundStations = [];
      activeReturnStations = [];
      preferenceNote = 'Auto: Direct round trip (no charging stops needed)';
    } else {
      // Determine if outbound needs stops
      if (turnaroundArrivalSocWithoutCharging < 20 && outboundOrderedStations.length > 0) {
        activeOutboundStations = pickEvenlySpacedStations(outboundOrderedStations, 1);
      }
      // Return leg stops
      const returnNeeded = returnOrderedStations.length > 0 ? 1 : 0;
      if (returnNeeded > 0) {
        activeReturnStations = pickEvenlySpacedStations(returnOrderedStations, 1);
      }
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
      stopsPreferenceNote: preferenceNote
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

    if (arrivalSoc < 15) hasLowSocWarning = true;
    if (arrivalSoc < 0 && criticalStopIndex === null) criticalStopIndex = stopCounter;

    const distToTurnaround = Math.max(8, getDistanceMiles(station.position, destCoords));
    const nextSocNeeded = distToTurnaround * socPerMile;
    const targetDepartureSoc = Math.min(95, Math.max(Math.ceil(nextSocNeeded + 25), 65));
    const chargeNeededPercent = Math.max(0, targetDepartureSoc - arrivalSoc);

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
      arrivalCritical: arrivalSoc < 0,
      stopReason: `Outbound recharge to reach turnaround destination`
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

    if (arrivalSoc < 15) hasLowSocWarning = true;
    if (arrivalSoc < 0 && criticalStopIndex === null) criticalStopIndex = stopCounter;

    const distToOrigin = Math.max(8, getDistanceMiles(station.position, originCoords));
    const nextSocNeeded = distToOrigin * socPerMile;
    const targetDepartureSoc = Math.min(95, Math.max(Math.ceil(nextSocNeeded + safeTargetDestSoc), 60));
    const chargeNeededPercent = Math.max(0, targetDepartureSoc - arrivalSoc);

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
      arrivalCritical: arrivalSoc < 0,
      stopReason: `Return recharge to arrive back at origin with ≥${safeTargetDestSoc}% SoC`
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
    stopsPreferenceNote: preferenceNote
  };
}

