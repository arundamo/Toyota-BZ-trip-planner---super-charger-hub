import { ChargingStation, LatLng } from '../types';

export interface LocationIndexItem {
  mainText: string;
  secondaryText: string;
  displayName: string;
  lat: number;
  lng: number;
  type: 'city' | 'address' | 'poi' | 'supercharger';
}

// Distance helper using Haversine formula (in miles)
export function getDistance(p1: LatLng, p2: LatLng): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Pre-indexed verified Tesla Superchargers with NACS open to Toyota bZ
export const FALLBACK_STATIONS: ChargingStation[] = [
  // Ontario Highway 401 & 403 Corridors (Waterloo, Kitchener, Cambridge, Guelph, Toronto, Kingston, Cornwall, Montreal)
  {
    id: "ts-cambridge-on",
    name: "Tesla Supercharger - Cambridge",
    address: "35 Pinebush Rd, Cambridge, ON N1R 8J8",
    position: { lat: 43.3986, lng: -80.3182 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 11,
    detourTimeMinutes: 2,
    costPerKwh: 0.35,
    status: "operational"
  },
  {
    id: "ts-kitchener-on",
    name: "Tesla Supercharger - Kitchener (Fairway)",
    address: "2960 Kingsway Dr, Kitchener, ON N2C 1X1",
    position: { lat: 43.4215, lng: -80.4412 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 12,
    availableStalls: 9,
    detourTimeMinutes: 3,
    costPerKwh: 0.35,
    status: "operational"
  },
  {
    id: "ts-woodstock-on",
    name: "Tesla Supercharger - Woodstock (Highway 401)",
    address: "560 Norwich Ave, Woodstock, ON N4V 1C6",
    position: { lat: 43.1025, lng: -80.7512 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 12,
    detourTimeMinutes: 2,
    costPerKwh: 0.36,
    status: "operational"
  },
  {
    id: "ts-london-on",
    name: "Tesla Supercharger - London (Wellington Rd)",
    address: "1098 Wellington Rd, London, ON N6E 1M3",
    position: { lat: 42.9421, lng: -81.2185 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 10,
    detourTimeMinutes: 3,
    costPerKwh: 0.36,
    status: "operational"
  },
  {
    id: "ts-mississauga-on",
    name: "Tesla Supercharger - Mississauga (Meadowvale)",
    address: "6750 Meadowvale Town Centre Cir, Mississauga, ON L5N 2R5",
    position: { lat: 43.5934, lng: -79.7562 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 20,
    availableStalls: 14,
    detourTimeMinutes: 3,
    costPerKwh: 0.38,
    status: "operational"
  },
  {
    id: "ts-oshawa-on",
    name: "Tesla Supercharger - Oshawa (Harmony)",
    address: "1383 Harmony Rd N, Oshawa, ON L1H 7K5",
    position: { lat: 43.9352, lng: -78.8315 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 12,
    detourTimeMinutes: 2,
    costPerKwh: 0.37,
    status: "operational"
  },
  {
    id: "ts-porthope-on",
    name: "Tesla Supercharger - Port Hope (Highway 401)",
    address: "2211 County Rd 28, Port Hope, ON L1A 3V6",
    position: { lat: 43.9782, lng: -78.3012 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 12,
    availableStalls: 8,
    detourTimeMinutes: 1,
    costPerKwh: 0.37,
    status: "operational"
  },
  {
    id: "ts-belleville-on",
    name: "Tesla Supercharger - Belleville",
    address: "214 N Front St, Belleville, ON K8P 3C2",
    position: { lat: 44.1843, lng: -77.3872 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 10,
    detourTimeMinutes: 2,
    costPerKwh: 0.37,
    status: "operational"
  },
  {
    id: "ts-kingston-on",
    name: "Tesla Supercharger - Kingston Division St",
    address: "1194 Division St, Kingston, ON K7K 0C7",
    position: { lat: 44.2678, lng: -76.4953 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 20,
    availableStalls: 13,
    detourTimeMinutes: 1,
    costPerKwh: 0.38,
    status: "operational"
  },
  {
    id: "ts-brockville-on",
    name: "Tesla Supercharger - Brockville",
    address: "1972 Parkedale Ave, Brockville, ON K6V 7N6",
    position: { lat: 44.6052, lng: -75.6948 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 12,
    availableStalls: 9,
    detourTimeMinutes: 2,
    costPerKwh: 0.38,
    status: "operational"
  },
  {
    id: "ts-cornwall-on",
    name: "Tesla Supercharger - Cornwall (Brookdale)",
    address: "960 Brookdale Ave, Cornwall, ON K6J 4P5",
    position: { lat: 45.0315, lng: -74.7482 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 12,
    availableStalls: 8,
    detourTimeMinutes: 2,
    costPerKwh: 0.39,
    status: "operational"
  },
  {
    id: "ts-montreal-pointeclaire",
    name: "Tesla Supercharger - Pointe-Claire (Fairview)",
    address: "6801 Rte Transcanadienne, Pointe-Claire, QC H9R 5J2",
    position: { lat: 45.4468, lng: -73.8314 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 11,
    detourTimeMinutes: 2,
    costPerKwh: 0.40,
    status: "operational"
  },
  {
    id: "ts-montreal-brossard",
    name: "Tesla Supercharger - Brossard (Quartier DIX30)",
    address: "9120 Leduc Blvd, Brossard, QC J4Y 0B3",
    position: { lat: 45.4445, lng: -73.4352 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 20,
    availableStalls: 14,
    detourTimeMinutes: 3,
    costPerKwh: 0.41,
    status: "operational"
  },

  // California Routes (I-5, I-15, I-80, US-101)
  {
    id: "ts-kettleman",
    name: "Tesla Supercharger - Kettleman City",
    address: "275 Kettleman City Blvd, Kettleman City, CA 93239",
    position: { lat: 36.0145, lng: -119.9575 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 40,
    availableStalls: 28,
    detourTimeMinutes: 2,
    costPerKwh: 0.38,
    status: "operational"
  },
  {
    id: "ts-harris",
    name: "Tesla Supercharger - Harris Ranch",
    address: "24505 W Dorris Ave, Coalinga, CA 93210",
    position: { lat: 36.2541, lng: -120.2378 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 18,
    availableStalls: 11,
    detourTimeMinutes: 3,
    costPerKwh: 0.40,
    status: "operational"
  },
  {
    id: "ts-tejon",
    name: "Tesla Supercharger - Tejon Pass",
    address: "5602 Dennis McCarthy Dr, Lebec, CA 93243",
    position: { lat: 34.8872, lng: -118.8837 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 24,
    availableStalls: 15,
    detourTimeMinutes: 4,
    costPerKwh: 0.42,
    status: "operational"
  },
  {
    id: "ts-barstow",
    name: "Tesla Supercharger - Barstow",
    address: "2812 Lenwood Rd, Barstow, CA 92311",
    position: { lat: 34.8427, lng: -117.0864 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 40,
    availableStalls: 19,
    detourTimeMinutes: 2,
    costPerKwh: 0.39,
    status: "operational"
  },
  
  // East Coast & Mid-Atlantic Routes (I-95)
  {
    id: "ts-newark",
    name: "Tesla Supercharger - Newark Delaware House",
    address: "2 Delaware House, I-95 Milepost 4, Newark, DE 19702",
    position: { lat: 39.6645, lng: -75.7198 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 24,
    availableStalls: 14,
    detourTimeMinutes: 1,
    costPerKwh: 0.37,
    status: "operational"
  },
  {
    id: "ts-secaucus",
    name: "Tesla Supercharger - Secaucus (The Outlets)",
    address: "500 Plaza Dr, Secaucus, NJ 07094",
    position: { lat: 40.7892, lng: -74.0538 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 20,
    availableStalls: 8,
    detourTimeMinutes: 5,
    costPerKwh: 0.44,
    status: "operational"
  },

  // Texas Routes (I-10, I-35, I-45)
  {
    id: "ts-austin",
    name: "Tesla Supercharger - Austin S Congress",
    address: "3300 S Interstate 35, Austin, TX 78704",
    position: { lat: 30.2288, lng: -97.7495 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 16,
    availableStalls: 11,
    detourTimeMinutes: 2,
    costPerKwh: 0.34,
    status: "operational"
  },
  {
    id: "ts-houston",
    name: "Tesla Supercharger - Houston (Grand Parkway)",
    address: "4747 Texas 99, Richmond, TX 77406",
    position: { lat: 29.6974, lng: -95.7725 },
    speedKw: 250,
    chargerType: "V3 Supercharger",
    plugAndCharge: true,
    connectorType: "NACS",
    totalStalls: 12,
    availableStalls: 8,
    detourTimeMinutes: 3,
    costPerKwh: 0.33,
    status: "operational"
  }
];

export const POPULAR_LOCATIONS_INDEX: LocationIndexItem[] = [
  { mainText: "Waterloo", secondaryText: "Ontario, Canada", displayName: "Waterloo, ON, Canada", lat: 43.4643, lng: -80.5204, type: "city" },
  { mainText: "Guelph", secondaryText: "Ontario, Canada", displayName: "Guelph, ON, Canada", lat: 43.5448, lng: -80.2482, type: "city" },
  { mainText: "Kitchener", secondaryText: "Ontario, Canada", displayName: "Kitchener, ON, Canada", lat: 43.4516, lng: -80.4925, type: "city" },
  { mainText: "Cambridge", secondaryText: "Ontario, Canada", displayName: "Cambridge, ON, Canada", lat: 43.3616, lng: -80.3144, type: "city" },
  { mainText: "Toronto", secondaryText: "Ontario, Canada", displayName: "Toronto, ON, Canada", lat: 43.6532, lng: -79.3832, type: "city" },
  { mainText: "Mississauga", secondaryText: "Ontario, Canada", displayName: "Mississauga, ON, Canada", lat: 43.5890, lng: -79.6441, type: "city" },
  { mainText: "Hamilton", secondaryText: "Ontario, Canada", displayName: "Hamilton, ON, Canada", lat: 43.2557, lng: -79.8711, type: "city" },
  { mainText: "London", secondaryText: "Ontario, Canada", displayName: "London, ON, Canada", lat: 42.9849, lng: -81.2453, type: "city" },
  { mainText: "Kingston", secondaryText: "Ontario, Canada", displayName: "Kingston, ON, Canada", lat: 44.2312, lng: -76.4860, type: "city" },
  { mainText: "Ottawa", secondaryText: "Ontario, Canada", displayName: "Ottawa, ON, Canada", lat: 45.4215, lng: -75.6972, type: "city" },
  { mainText: "Montreal", secondaryText: "Quebec, Canada", displayName: "Montreal, QC, Canada", lat: 45.5017, lng: -73.5673, type: "city" },
  { mainText: "Quebec City", secondaryText: "Quebec, Canada", displayName: "Quebec City, QC, Canada", lat: 46.8139, lng: -71.2080, type: "city" },
  { mainText: "Vancouver", secondaryText: "British Columbia, Canada", displayName: "Vancouver, BC, Canada", lat: 49.2827, lng: -123.1207, type: "city" },
  { mainText: "Calgary", secondaryText: "Alberta, Canada", displayName: "Calgary, AB, Canada", lat: 51.0447, lng: -114.0719, type: "city" },
  { mainText: "Edmonton", secondaryText: "Alberta, Canada", displayName: "Edmonton, AB, Canada", lat: 53.5461, lng: -113.4938, type: "city" },
  { mainText: "New York", secondaryText: "New York, United States", displayName: "New York, NY, USA", lat: 40.7128, lng: -74.0060, type: "city" },
  { mainText: "Los Angeles", secondaryText: "California, United States", displayName: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437, type: "city" },
  { mainText: "Chicago", secondaryText: "Illinois, United States", displayName: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298, type: "city" },
  { mainText: "Austin", secondaryText: "Texas, United States", displayName: "Austin, TX, USA", lat: 30.2672, lng: -97.7431, type: "city" },
  { mainText: "Dallas", secondaryText: "Texas, United States", displayName: "Dallas, TX, USA", lat: 32.7767, lng: -96.7970, type: "city" },
  { mainText: "Houston", secondaryText: "Texas, United States", displayName: "Houston, TX, USA", lat: 29.7604, lng: -95.3698, type: "city" },
  { mainText: "Las Vegas", secondaryText: "Nevada, United States", displayName: "Las Vegas, NV, USA", lat: 36.1699, lng: -115.1398, type: "city" },
  { mainText: "San Francisco", secondaryText: "California, United States", displayName: "San Francisco, CA, USA", lat: 37.7749, lng: -122.4194, type: "city" },
  { mainText: "Seattle", secondaryText: "Washington, United States", displayName: "Seattle, WA, USA", lat: 47.6062, lng: -122.3321, type: "city" },
  { mainText: "Washington", secondaryText: "District of Columbia, United States", displayName: "Washington, DC, USA", lat: 38.9072, lng: -77.0369, type: "city" },
  { mainText: "Boston", secondaryText: "Massachusetts, United States", displayName: "Boston, MA, USA", lat: 42.3601, lng: -71.0589, type: "city" },
  { mainText: "Philadelphia", secondaryText: "Pennsylvania, United States", displayName: "Philadelphia, PA, USA", lat: 39.9526, lng: -75.1652, type: "city" },
  { mainText: "Detroit", secondaryText: "Michigan, United States", displayName: "Detroit, MI, USA", lat: 42.3314, lng: -83.0458, type: "city" },
  { mainText: "Buffalo", secondaryText: "New York, United States", displayName: "Buffalo, NY, USA", lat: 42.8864, lng: -78.8784, type: "city" }
];

export function getFallbackStations(origin: string, destination: string): ChargingStation[] {
  const searchTerms = `${origin} ${destination}`.toLowerCase();
  let regional = FALLBACK_STATIONS;

  if (
    searchTerms.includes("waterloo") || searchTerms.includes("guelph") || 
    searchTerms.includes("cambridge") || searchTerms.includes("toronto") || 
    searchTerms.includes("kitchener") || searchTerms.includes("cornwall") || 
    searchTerms.includes("ontario") || searchTerms.includes("canada") || 
    searchTerms.includes("on") || searchTerms.includes("montreal") || searchTerms.includes("ottawa") ||
    searchTerms.includes("quebec") || searchTerms.includes("qc")
  ) {
    regional = FALLBACK_STATIONS.filter(s => s.address.includes("ON") || s.address.includes("QC"));
  } else if (
    searchTerms.includes("austin") || searchTerms.includes("dallas") || 
    searchTerms.includes("texas") || searchTerms.includes("houston") || searchTerms.includes("tx")
  ) {
    regional = FALLBACK_STATIONS.filter(s => s.address.includes("TX"));
  } else if (
    searchTerms.includes("new york") || searchTerms.includes("delaware") || 
    searchTerms.includes("newark") || searchTerms.includes("nj") || searchTerms.includes("de")
  ) {
    regional = FALLBACK_STATIONS.filter(s => s.address.includes("DE") || s.address.includes("NJ"));
  } else {
    regional = FALLBACK_STATIONS.filter(s => s.address.includes("CA") || s.address.includes("ON"));
  }

  if (regional.length === 0) {
    regional = FALLBACK_STATIONS.slice(0, 4);
  }

  return regional.map((s, idx) => ({
    ...s,
    id: `verified-corridor-${idx}-${s.id}`
  }));
}
