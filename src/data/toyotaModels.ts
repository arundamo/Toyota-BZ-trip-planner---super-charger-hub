import { VehicleSpecs } from '../types';

export const TOYOTA_BZ_CATALOG: VehicleSpecs[] = [
  // 1. 2026 Toyota bZ (North American Lineup - "4X" dropped from 2026 model year)
  {
    id: 'bz-2026-xle-plus-fwd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'XLE Plus FWD Long Range (2026 NACS)',
    year: 2026,
    drivetrain: 'FWD',
    batteryCapacityKwh: 74.7,
    usableCapacityKwh: 71.4,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 314,
    epaRangeKm: 505,
    horsepowerHp: 221,
    consumptionWhPerMile: 238,
    portTypeDescription: 'Native NACS (SAE J3400) + ISO 15118 Autocharge',
    notes: 'Toyota dropped "4X" for 2026. Equipped with high-capacity 74.7 kWh pack, achieving up to 314 miles EPA range and factory NACS.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz-2026-limited-fwd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'Limited FWD Long Range (2026 NACS)',
    year: 2026,
    drivetrain: 'FWD',
    batteryCapacityKwh: 74.7,
    usableCapacityKwh: 71.4,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 299,
    epaRangeKm: 481,
    horsepowerHp: 221,
    consumptionWhPerMile: 250,
    portTypeDescription: 'Native NACS (SAE J3400) + 14-inch Multimedia Display',
    notes: '20-inch alloy wheels, ventilated SofTex seats, panoramic fixed-glass roof, digital rearview mirror, and native NACS.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz-2026-xle-awd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'XLE AWD Dual Motor (2026 NACS)',
    year: 2026,
    drivetrain: 'AWD',
    batteryCapacityKwh: 74.7,
    usableCapacityKwh: 71.4,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 288,
    epaRangeKm: 463,
    horsepowerHp: 338,
    consumptionWhPerMile: 259,
    portTypeDescription: 'Native NACS (SAE J3400) + Dual Motor AWD',
    notes: 'Major power upgrade to 338 combined HP (0-60 in 4.9s), X-MODE with Grip Control, and 10-80% DC charge in ~30 mins.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz-2026-limited-awd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'Limited AWD Dual Motor (2026 NACS)',
    year: 2026,
    drivetrain: 'AWD',
    batteryCapacityKwh: 74.7,
    usableCapacityKwh: 71.4,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 278,
    epaRangeKm: 447,
    horsepowerHp: 338,
    consumptionWhPerMile: 269,
    portTypeDescription: 'Native NACS (SAE J3400) + Dual Motor AWD',
    notes: 'Flagship dual-motor luxury trim with 338 HP, JBL premium sound, front radiant heat, and factory native NACS port.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz-2026-woodland-awd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'Woodland Edition AWD (2026 NACS)',
    year: 2026,
    drivetrain: 'AWD',
    batteryCapacityKwh: 74.7,
    usableCapacityKwh: 71.4,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 281,
    epaRangeKm: 452,
    horsepowerHp: 375,
    consumptionWhPerMile: 266,
    portTypeDescription: 'Native NACS (SAE J3400) + High Ground Clearance (8.4 in)',
    notes: 'All-new extended-length adventure trim (+6 in length, 74.3 cu ft max cargo), 375 HP (0-60 in 4.4s), and 3,500 lbs towing capacity.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz-2026-xle-std-fwd',
    brand: 'Toyota',
    model: 'bZ',
    trim: 'XLE FWD Standard Range (2026 NACS)',
    year: 2026,
    drivetrain: 'FWD',
    batteryCapacityKwh: 57.7,
    usableCapacityKwh: 54.0,
    maxChargeRateKw: 150,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 236,
    epaRangeKm: 380,
    horsepowerHp: 201,
    consumptionWhPerMile: 244,
    portTypeDescription: 'Native NACS (SAE J3400) + 11 kW AC Onboard Charger',
    notes: 'Standard 57.7 kWh battery configuration with native NACS port, dual wireless chargers, and hands-free power liftgate.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },

  // 2. 2023–2025 Toyota bZ4X (Legacy Model with CCS1 Port / Approved NACS Adapter)
  {
    id: 'bz4x-2024-fwd',
    brand: 'Toyota',
    model: 'bZ4X',
    trim: 'XLE / Limited FWD (2023–2025 Legacy CCS1)',
    year: 2024,
    drivetrain: 'FWD',
    batteryCapacityKwh: 71.4,
    usableCapacityKwh: 64.0,
    maxChargeRateKw: 150,
    nacsNative: false,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 252,
    epaRangeKm: 406,
    horsepowerHp: 201,
    consumptionWhPerMile: 283,
    portTypeDescription: 'CCS Combo 1 (Uses Toyota Approved NACS Adapter)',
    notes: 'Pre-2026 model retaining original "bZ4X" designation. Accesses Superchargers via official NACS-to-CCS1 adapter.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz4x-2024-awd',
    brand: 'Toyota',
    model: 'bZ4X',
    trim: 'XLE / Limited AWD (2023–2025 Legacy CCS1)',
    year: 2024,
    drivetrain: 'AWD',
    batteryCapacityKwh: 72.8,
    usableCapacityKwh: 65.5,
    maxChargeRateKw: 100,
    nacsNative: false,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 228,
    epaRangeKm: 367,
    horsepowerHp: 214,
    consumptionWhPerMile: 319,
    portTypeDescription: 'CCS Combo 1 (Uses Toyota Approved NACS Adapter)',
    notes: 'Legacy AWD CATL cell architecture (214 HP / 100 kW DC rate). Accesses Superchargers via approved NACS adapter.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },

  // 3. Other Toyota Beyond Zero Family Models
  {
    id: 'bz3-2026-sedan',
    brand: 'Toyota',
    model: 'bZ3 Sedan',
    trim: 'Long Range Pro Fastback Sedan',
    year: 2026,
    drivetrain: 'RWD',
    batteryCapacityKwh: 65.3,
    usableCapacityKwh: 61.0,
    maxChargeRateKw: 135,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 310,
    epaRangeKm: 499,
    horsepowerHp: 241,
    consumptionWhPerMile: 210,
    portTypeDescription: 'Native NACS / Ultra-Low Drag (Cd 0.218)',
    notes: 'High-efficiency fastback electric sedan featuring LFP Blade battery technology and sleek aerodynamics.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  },
  {
    id: 'bz5x-2026-awd',
    brand: 'Toyota',
    model: 'bZ Large SUV (bZ5X)',
    trim: '3-Row Family AWD (2026 NACS)',
    year: 2026,
    drivetrain: 'AWD',
    batteryCapacityKwh: 91.2,
    usableCapacityKwh: 85.0,
    maxChargeRateKw: 175,
    nacsNative: true,
    plugAndChargeSupported: true,
    estimatedRangeMiles: 305,
    epaRangeKm: 491,
    horsepowerHp: 335,
    consumptionWhPerMile: 299,
    portTypeDescription: 'Native NACS + High-Capacity 91.2 kWh Pack',
    notes: 'Flagship 3-row family electric SUV assembled in Georgetown, Kentucky with high-voltage fast charging.',
    weatherCondition: 'optimal',
    cargoLoad: 'normal'
  }
];

export const DEFAULT_BZ_MODEL: VehicleSpecs = TOYOTA_BZ_CATALOG[0];

/**
 * Calculates effective range factoring in weather conditions and cargo load.
 */
export function getEffectiveVehicleRange(specs: VehicleSpecs): {
  effectiveRangeMiles: number;
  consumptionPenaltyPercent: number;
  explanation: string;
} {
  let penalty = 0;
  const reasons: string[] = [];

  // Weather modifiers
  if (specs.weatherCondition === 'cold') {
    penalty += 15; // 15% range reduction in ~32°F / 0°C
    reasons.push('Cold Weather (~32°F / 0°C): -15%');
  } else if (specs.weatherCondition === 'freezing') {
    penalty += 28; // 28% range reduction in ~0°F / -18°C
    reasons.push('Freezing Winter (~0°F / -18°C): -28%');
  } else if (specs.weatherCondition === 'hot') {
    penalty += 8; // 8% range reduction for aggressive A/C in >95°F
    reasons.push('High Heat (>95°F / 35°C A/C): -8%');
  }

  // Cargo / Aerodynamic load modifiers
  if (specs.cargoLoad === 'heavy') {
    penalty += 6;
    reasons.push('Full Passenger & Heavy Cargo: -6%');
  } else if (specs.cargoLoad === 'roof_box') {
    penalty += 18;
    reasons.push('Roof Cargo Box / Bike Rack (Aerodynamic Drag): -18%');
  }

  const effectiveRangeMiles = Math.max(80, Math.round(specs.estimatedRangeMiles * (1 - penalty / 100)));
  const explanation = reasons.length > 0 ? reasons.join(' | ') : 'Optimal Conditions (70°F / 21°C, standard highway load)';

  return {
    effectiveRangeMiles,
    consumptionPenaltyPercent: penalty,
    explanation
  };
}
