export interface LatLng {
  lat: number;
  lng: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  position: LatLng;
  speedKw: number;
  chargerType: 'V3 Supercharger' | 'V4 Supercharger';
  plugAndCharge: boolean;
  connectorType: 'NACS' | 'CCS (Magic Dock)';
  totalStalls: number;
  availableStalls: number;
  detourTimeMinutes: number;
  costPerKwh: number;
  status: 'operational' | 'busy' | 'maintenance';
}

export interface RouteInfo {
  distanceMiles: number;
  durationMinutes: number;
  originName: string;
  destinationName: string;
  polyline: string;
  originCoords: LatLng;
  destCoords: LatLng;
}

export interface PredefinedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  originCoords: LatLng;
  destCoords: LatLng;
  description: string;
}

export interface ChargeSession {
  state: 'idle' | 'connecting' | 'authorizing' | 'charging' | 'completed' | 'error';
  currentSoc: number;
  targetSoc: number;
  powerKw: number;
  energyDelivered: number;
  totalCost: number;
  elapsedSeconds: number;
  errorMessage?: string;
}

export interface VehicleSpecs {
  id: string;
  brand: string;
  model: string;
  trim: string;
  year: number;
  drivetrain: 'FWD' | 'AWD' | 'RWD';
  batteryCapacityKwh: number;
  usableCapacityKwh?: number;
  maxChargeRateKw: number;
  nacsNative: boolean;
  plugAndChargeSupported: boolean;
  estimatedRangeMiles: number;
  epaRangeKm?: number;
  horsepowerHp?: number;
  consumptionWhPerMile?: number;
  portTypeDescription?: string;
  notes?: string;
  isCustom?: boolean;
  // Environmental & Load modifiers
  weatherCondition?: 'optimal' | 'cold' | 'freezing' | 'hot';
  cargoLoad?: 'light' | 'normal' | 'heavy' | 'roof_box';
}

export type DistanceUnit = 'miles' | 'km';
