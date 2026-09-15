import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user agent
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// A comprehensive default list of realistic compatible Tesla Supercharger stations 
// along popular Canadian and U.S. routes to use as fallback/enrichment.
const FALLBACK_STATIONS = [
  // Ontario Highway 401 & 403 Corridors (Waterloo, Kitchener, Cambridge, Guelph, Toronto, Kingston, Cornwall)
  {
    id: "ts-cambridge-on",
    name: "Tesla Supercharger - Cambridge",
    address: "35 Pinebush Rd, Cambridge, ON N1R 8J8",
    position: { lat: 43.3986, lng: -80.3182 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 16,
    availableStalls: 11,
    detourTimeMinutes: 2,
    costPerKwh: 0.35,
    status: "operational" as const
  },
  {
    id: "ts-kitchener-on",
    name: "Tesla Supercharger - Kitchener (Fairway)",
    address: "2960 Kingsway Dr, Kitchener, ON N2C 1X1",
    position: { lat: 43.4215, lng: -80.4412 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 12,
    availableStalls: 9,
    detourTimeMinutes: 3,
    costPerKwh: 0.35,
    status: "operational" as const
  },
  {
    id: "ts-woodstock-on",
    name: "Tesla Supercharger - Woodstock (Highway 401)",
    address: "560 Norwich Ave, Woodstock, ON N4V 1C6",
    position: { lat: 43.1025, lng: -80.7512 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 16,
    availableStalls: 12,
    detourTimeMinutes: 2,
    costPerKwh: 0.36,
    status: "operational" as const
  },
  {
    id: "ts-mississauga-on",
    name: "Tesla Supercharger - Mississauga (Meadowvale)",
    address: "6750 Meadowvale Town Centre Cir, Mississauga, ON L5N 2R5",
    position: { lat: 43.5934, lng: -79.7562 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 20,
    availableStalls: 14,
    detourTimeMinutes: 3,
    costPerKwh: 0.38,
    status: "operational" as const
  },
  {
    id: "ts-belleville-on",
    name: "Tesla Supercharger - Belleville",
    address: "214 N Front St, Belleville, ON K8P 3C2",
    position: { lat: 44.1843, lng: -77.3872 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 16,
    availableStalls: 10,
    detourTimeMinutes: 2,
    costPerKwh: 0.37,
    status: "operational" as const
  },
  {
    id: "ts-kingston-on",
    name: "Tesla Supercharger - Kingston Division St",
    address: "1194 Division St, Kingston, ON K7K 0C7",
    position: { lat: 44.2678, lng: -76.4953 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 20,
    availableStalls: 13,
    detourTimeMinutes: 1,
    costPerKwh: 0.38,
    status: "operational" as const
  },
  {
    id: "ts-cornwall-on",
    name: "Tesla Supercharger - Cornwall (Brookdale)",
    address: "960 Brookdale Ave, Cornwall, ON K6J 4P5",
    position: { lat: 45.0315, lng: -74.7482 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 12,
    availableStalls: 8,
    detourTimeMinutes: 2,
    costPerKwh: 0.39,
    status: "operational" as const
  },

  // California Routes (I-5, I-15, I-80)
  {
    id: "ts-kettleman",
    name: "Tesla Supercharger - Kettleman City",
    address: "275 Kettleman City Blvd, Kettleman City, CA 93239",
    position: { lat: 36.0145, lng: -119.9575 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 40,
    availableStalls: 28,
    detourTimeMinutes: 2,
    costPerKwh: 0.38,
    status: "operational" as const
  },
  {
    id: "ts-harris",
    name: "Tesla Supercharger - Harris Ranch",
    address: "24505 W Dorris Ave, Coalinga, CA 93210",
    position: { lat: 36.2541, lng: -120.2378 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 18,
    availableStalls: 11,
    detourTimeMinutes: 3,
    costPerKwh: 0.40,
    status: "operational" as const
  },
  {
    id: "ts-tejon",
    name: "Tesla Supercharger - Tejon Pass",
    address: "5602 Dennis McCarthy Dr, Lebec, CA 93243",
    position: { lat: 34.8872, lng: -118.8837 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 24,
    availableStalls: 15,
    detourTimeMinutes: 4,
    costPerKwh: 0.42,
    status: "operational" as const
  },
  {
    id: "ts-barstow",
    name: "Tesla Supercharger - Barstow",
    address: "2812 Lenwood Rd, Barstow, CA 92311",
    position: { lat: 34.8427, lng: -117.0864 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 40,
    availableStalls: 19,
    detourTimeMinutes: 2,
    costPerKwh: 0.39,
    status: "operational" as const
  },
  
  // East Coast & Mid-Atlantic Routes (I-95)
  {
    id: "ts-newark",
    name: "Tesla Supercharger - Newark Delaware House",
    address: "2 Delaware House, I-95 Milepost 4, Newark, DE 19702",
    position: { lat: 39.6645, lng: -75.7198 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 24,
    availableStalls: 14,
    detourTimeMinutes: 1,
    costPerKwh: 0.37,
    status: "operational" as const
  },
  {
    id: "ts-secaucus",
    name: "Tesla Supercharger - Secaucus (The Outlets)",
    address: "500 Plaza Dr, Secaucus, NJ 07094",
    position: { lat: 40.7892, lng: -74.0538 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 20,
    availableStalls: 8,
    detourTimeMinutes: 5,
    costPerKwh: 0.44,
    status: "operational" as const
  },

  // Texas Routes (I-10, I-35, I-45)
  {
    id: "ts-austin",
    name: "Tesla Supercharger - Austin S Congress",
    address: "3300 S Interstate 35, Austin, TX 78704",
    position: { lat: 30.2288, lng: -97.7495 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 16,
    availableStalls: 11,
    detourTimeMinutes: 2,
    costPerKwh: 0.34,
    status: "operational" as const
  },
  {
    id: "ts-houston",
    name: "Tesla Supercharger - Houston (Grand Parkway)",
    address: "4747 Texas 99, Richmond, TX 77406",
    position: { lat: 29.6974, lng: -95.7725 },
    speedKw: 250,
    chargerType: "V3 Supercharger" as const,
    plugAndCharge: true,
    connectorType: "NACS" as const,
    totalStalls: 12,
    availableStalls: 8,
    detourTimeMinutes: 3,
    costPerKwh: 0.33,
    status: "operational" as const
  }
];

// Helper to calculate distance in miles between coordinates (Haversine formula)
function getDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
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

// Built-in high-confidence cities and hubs for instant lookup suggestions
const POPULAR_LOCATIONS_INDEX = [
  { mainText: "Waterloo", secondaryText: "Ontario, Canada", displayName: "Waterloo, ON, Canada", lat: 43.4643, lng: -80.5204, type: "city" as const },
  { mainText: "Guelph", secondaryText: "Ontario, Canada", displayName: "Guelph, ON, Canada", lat: 43.5448, lng: -80.2482, type: "city" as const },
  { mainText: "Kitchener", secondaryText: "Ontario, Canada", displayName: "Kitchener, ON, Canada", lat: 43.4516, lng: -80.4925, type: "city" as const },
  { mainText: "Cambridge", secondaryText: "Ontario, Canada", displayName: "Cambridge, ON, Canada", lat: 43.3616, lng: -80.3144, type: "city" as const },
  { mainText: "Toronto", secondaryText: "Ontario, Canada", displayName: "Toronto, ON, Canada", lat: 43.6532, lng: -79.3832, type: "city" as const },
  { mainText: "Mississauga", secondaryText: "Ontario, Canada", displayName: "Mississauga, ON, Canada", lat: 43.5890, lng: -79.6441, type: "city" as const },
  { mainText: "Hamilton", secondaryText: "Ontario, Canada", displayName: "Hamilton, ON, Canada", lat: 43.2557, lng: -79.8711, type: "city" as const },
  { mainText: "London", secondaryText: "Ontario, Canada", displayName: "London, ON, Canada", lat: 42.9849, lng: -81.2453, type: "city" as const },
  { mainText: "Kingston", secondaryText: "Ontario, Canada", displayName: "Kingston, ON, Canada", lat: 44.2312, lng: -76.4860, type: "city" as const },
  { mainText: "Ottawa", secondaryText: "Ontario, Canada", displayName: "Ottawa, ON, Canada", lat: 45.4215, lng: -75.6972, type: "city" as const },
  { mainText: "Montreal", secondaryText: "Quebec, Canada", displayName: "Montreal, QC, Canada", lat: 45.5017, lng: -73.5673, type: "city" as const },
  { mainText: "Quebec City", secondaryText: "Quebec, Canada", displayName: "Quebec City, QC, Canada", lat: 46.8139, lng: -71.2080, type: "city" as const },
  { mainText: "Vancouver", secondaryText: "British Columbia, Canada", displayName: "Vancouver, BC, Canada", lat: 49.2827, lng: -123.1207, type: "city" as const },
  { mainText: "Calgary", secondaryText: "Alberta, Canada", displayName: "Calgary, AB, Canada", lat: 51.0447, lng: -114.0719, type: "city" as const },
  { mainText: "Edmonton", secondaryText: "Alberta, Canada", displayName: "Edmonton, AB, Canada", lat: 53.5461, lng: -113.4938, type: "city" as const },
  { mainText: "New York", secondaryText: "New York, United States", displayName: "New York, NY, USA", lat: 40.7128, lng: -74.0060, type: "city" as const },
  { mainText: "Los Angeles", secondaryText: "California, United States", displayName: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437, type: "city" as const },
  { mainText: "Chicago", secondaryText: "Illinois, United States", displayName: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298, type: "city" as const },
  { mainText: "Austin", secondaryText: "Texas, United States", displayName: "Austin, TX, USA", lat: 30.2672, lng: -97.7431, type: "city" as const },
  { mainText: "Dallas", secondaryText: "Texas, United States", displayName: "Dallas, TX, USA", lat: 32.7767, lng: -96.7970, type: "city" as const },
  { mainText: "Houston", secondaryText: "Texas, United States", displayName: "Houston, TX, USA", lat: 29.7604, lng: -95.3698, type: "city" as const },
  { mainText: "Las Vegas", secondaryText: "Nevada, United States", displayName: "Las Vegas, NV, USA", lat: 36.1699, lng: -115.1398, type: "city" as const },
  { mainText: "San Francisco", secondaryText: "California, United States", displayName: "San Francisco, CA, USA", lat: 37.7749, lng: -122.4194, type: "city" as const },
  { mainText: "Seattle", secondaryText: "Washington, United States", displayName: "Seattle, WA, USA", lat: 47.6062, lng: -122.3321, type: "city" as const },
  { mainText: "Washington", secondaryText: "District of Columbia, United States", displayName: "Washington, DC, USA", lat: 38.9072, lng: -77.0369, type: "city" as const },
  { mainText: "Boston", secondaryText: "Massachusetts, United States", displayName: "Boston, MA, USA", lat: 42.3601, lng: -71.0589, type: "city" as const },
  { mainText: "Philadelphia", secondaryText: "Pennsylvania, United States", displayName: "Philadelphia, PA, USA", lat: 39.9526, lng: -75.1652, type: "city" as const },
  { mainText: "Detroit", secondaryText: "Michigan, United States", displayName: "Detroit, MI, USA", lat: 42.3314, lng: -83.0458, type: "city" as const },
  { mainText: "Buffalo", secondaryText: "New York, United States", displayName: "Buffalo, NY, USA", lat: 42.8864, lng: -78.8784, type: "city" as const }
];

// Address lookup endpoint for real-time suggestions while typing
app.get("/api/address-lookup", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query || query.length < 2) {
    return res.json({ suggestions: [] });
  }

  const queryLower = query.toLowerCase();
  const suggestions: Array<{
    id: string;
    displayName: string;
    mainText: string;
    secondaryText: string;
    lat: number;
    lng: number;
    type: 'city' | 'address' | 'poi' | 'supercharger';
  }> = [];

  // 1. Check local indexed locations for immediate matches
  const localMatches = POPULAR_LOCATIONS_INDEX.filter(loc => 
    loc.displayName.toLowerCase().includes(queryLower) ||
    loc.mainText.toLowerCase().includes(queryLower) ||
    loc.secondaryText.toLowerCase().includes(queryLower)
  );

  localMatches.slice(0, 5).forEach((loc, idx) => {
    suggestions.push({
      id: `local-${idx}-${loc.mainText}`,
      displayName: loc.displayName,
      mainText: loc.mainText,
      secondaryText: loc.secondaryText,
      lat: loc.lat,
      lng: loc.lng,
      type: loc.type
    });
  });

  // Also check fallback superchargers in case user is searching a specific supercharger
  FALLBACK_STATIONS.forEach((station, idx) => {
    if (
      station.name.toLowerCase().includes(queryLower) ||
      station.address.toLowerCase().includes(queryLower)
    ) {
      suggestions.push({
        id: `sc-${idx}-${station.id}`,
        displayName: `${station.name} (${station.address})`,
        mainText: station.name,
        secondaryText: station.address,
        lat: station.position.lat,
        lng: station.position.lng,
        type: "supercharger"
      });
    }
  });

  // 2. Query Photon geocoder (OpenStreetMap based, fast and supports full North American & Global addresses)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`;
    const response = await fetch(photonUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Toyota-BZ-Charger-Finder/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const features = data.features || [];

      for (const feature of features) {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;

        const lng = coords[0];
        const lat = coords[1];

        // Format parts
        const name = props.name || props.street || props.city || "";
        const parts: string[] = [];
        if (props.housenumber && props.street) parts.push(`${props.housenumber} ${props.street}`);
        else if (props.street) parts.push(props.street);
        if (props.city && props.city !== name) parts.push(props.city);
        if (props.state) parts.push(props.state);
        if (props.country) parts.push(props.country);

        const secondary = parts.join(", ");
        const displayName = name ? (secondary ? `${name}, ${secondary}` : name) : secondary;

        if (!displayName) continue;

        // Determine place type
        let placeType: 'city' | 'address' | 'poi' | 'supercharger' = 'address';
        if (props.type === 'city' || props.type === 'town' || props.osm_value === 'city') {
          placeType = 'city';
        } else if (props.osm_key === 'amenity' || props.osm_key === 'tourism' || props.osm_key === 'shop') {
          placeType = 'poi';
        }

        // Avoid adding duplicate locations
        const alreadyExists = suggestions.some(s => 
          Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005
        );

        if (!alreadyExists) {
          suggestions.push({
            id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 8)}`,
            displayName: displayName,
            mainText: name || props.city || displayName,
            secondaryText: secondary || props.country || "",
            lat,
            lng,
            type: placeType
          });
        }
      }
    }
  } catch (err) {
    // Graceful fallback to local results if external network request times out
  }

  res.json({ suggestions: suggestions.slice(0, 10) });
});

// Reverse Geocoding endpoint to convert GPS lat/lng into address
app.get("/api/reverse-geocode", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Valid latitude and longitude required" });
  }

  // Check if near any major indexed city first
  for (const city of POPULAR_LOCATIONS_INDEX) {
    const dist = getDistance({ lat, lng }, { lat: city.lat, lng: city.lng });
    if (dist < 8) {
      return res.json({
        displayName: `Current Location (${city.displayName})`,
        mainText: "Current Location",
        secondaryText: city.displayName,
        city: city.mainText,
        lat,
        lng
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Toyota-BZ-Charger-Finder/1.0 (Toyota BZ Charger Hub)'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
      const stateName = addr.state || addr.province || "";
      const countryName = addr.country || "";

      let formattedCityState = [cityName, stateName, countryName].filter(Boolean).join(", ");
      if (!formattedCityState) {
        formattedCityState = data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      return res.json({
        displayName: `Current Location (${formattedCityState})`,
        mainText: cityName ? `Current Location (${cityName})` : "Current Location",
        secondaryText: formattedCityState,
        city: cityName,
        lat,
        lng
      });
    }
  } catch (err) {
    // Reverse geocode fallback
  }

  res.json({
    displayName: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    mainText: "Current Location",
    secondaryText: `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`,
    lat,
    lng
  });
});

// REST endpoints
app.post("/api/analyze-route", async (req, res) => {
  const { 
    origin, 
    destination, 
    routeCoords, 
    startingSoc, 
    targetDestinationSoc, 
    tripType, 
    hasDestinationCharging, 
    stopsPreference,
    vehicleSpecs 
  } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: "Origin and destination are required" });
  }

  const initialSocPercent = typeof startingSoc === 'number' ? startingSoc : 80;
  const desiredDestSoc = typeof targetDestinationSoc === 'number' ? targetDestinationSoc : 20;
  const isTwoWay = tripType === 'two-way';
  const preferenceDesc = stopsPreference === 'auto' || stopsPreference === undefined 
    ? 'Auto (Calculate optimal minimal stops)' 
    : stopsPreference === 0 
      ? '0 Stops (Direct non-stop drive)' 
      : `${stopsPreference} Stop(s) requested by user`;

  const vehicleDesc = vehicleSpecs ? 
    `Toyota ${vehicleSpecs.model || 'bZ'} (${vehicleSpecs.trim || 'Standard'}) - ${vehicleSpecs.year || 2026}, Battery: ${vehicleSpecs.batteryCapacityKwh || 74.7} kWh, Peak DC: ${vehicleSpecs.maxChargeRateKw || 150} kW, EPA Rated Range: ${vehicleSpecs.estimatedRangeMiles || 314} miles, Drivetrain: ${vehicleSpecs.drivetrain || 'FWD'}, Port: ${vehicleSpecs.nacsNative ? 'Native NACS' : 'CCS1'}${vehicleSpecs.weatherCondition ? `, Weather: ${vehicleSpecs.weatherCondition}` : ''}${vehicleSpecs.cargoLoad ? `, Cargo: ${vehicleSpecs.cargoLoad}` : ''}`
    : '2026 Toyota bZ (EPA range ~314 miles / ~505 km, 74.7 kWh battery, native NACS port, ISO 15118 Autocharge/Plug & Charge)';

  // Fallback to coordinates based on pre-defined endpoints if client didn't supply them
  const client = getGeminiClient();

  let gResponseText = "";
  let generatedStations: any[] = [];
  let explanation = "";

  if (client) {
    try {
      // Formulate a structured prompt for Gemini
      const prompt = `
        The user is planning an EV driving trip: ${isTwoWay ? 'TWO-WAY ROUND TRIP' : 'ONE-WAY TRIP'} between "${origin}" and "${destination}".
        Trip Type: ${isTwoWay ? `Round Trip (${origin} ➔ ${destination} ➔ ${origin})` : `One Way (${origin} ➔ ${destination})`}.
        ${isTwoWay ? `Destination charging at ${destination}: ${hasDestinationCharging ? 'YES (Level 2/AC charging available at destination)' : 'NO (vehicle relies exclusively on DC Fast / Supercharging along corridor)'}.` : ''}
        Vehicle Specifications: ${vehicleDesc}.
        Starting State of Charge (SoC): ${initialSocPercent}%.
        Target Minimum Arrival SoC Goal: ${desiredDestSoc}%.
        User Charging Stops Preference: ${preferenceDesc}.
        
        Instructions:
        1. Identify accurate real coordinates (lat, lng) for the origin ("${origin}") and destination ("${destination}").
        2. Identify 3 to 6 actual Tesla Supercharger locations along or near the driving route corridor in geographic order from origin to destination.
        3. In routeExplanation, provide a clear, concise technical overview:
           - Clearly state whether this is a ${isTwoWay ? 'Round Trip (Two-Way)' : 'One-Way'} journey and note the user stop preference (${preferenceDesc}).
           - Mention the specific Toyota model and its battery capacity/range characteristics.
           - Assess if starting at ${initialSocPercent}% SoC provides plenty of range to complete the trip directly or if intermediate NACS charging stops are recommended.
           - Detail battery preconditioning, NACS plug-in workflow (ISO 15118 Autocharge without apps/RFID), and battery preservation strategies.
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          originCoords: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER, description: "Exact latitude of origin location" },
              lng: { type: Type.NUMBER, description: "Exact longitude of origin location" }
            },
            required: ["lat", "lng"]
          },
          destCoords: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER, description: "Exact latitude of destination location" },
              lng: { type: Type.NUMBER, description: "Exact longitude of destination location" }
            },
            required: ["lat", "lng"]
          },
          routeExplanation: {
            type: Type.STRING,
            description: "Expert routing and Tesla charging explanation for the Toyota bZ 2026 NACS model."
          },
          stationList: {
            type: Type.ARRAY,
            description: "List of compatible Tesla Superchargers along or near the route corridor.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Official Tesla Supercharger Station Name" },
                address: { type: Type.STRING },
                lat: { type: Type.NUMBER, description: "Latitude of station" },
                lng: { type: Type.NUMBER, description: "Longitude of station" },
                speedKw: { type: Type.NUMBER, description: "Charging rate (e.g., 250, 350)" },
                chargerType: { type: Type.STRING, description: "Must be either 'V3 Supercharger' or 'V4 Supercharger'" },
                plugAndCharge: { type: Type.BOOLEAN, description: "True if station supports Plug & Charge with Toyota integration" },
                connectorType: { type: Type.STRING, description: "Must be 'NACS' or 'CCS (Magic Dock)'" },
                totalStalls: { type: Type.INTEGER },
                availableStalls: { type: Type.INTEGER },
                detourTimeMinutes: { type: Type.INTEGER, description: "Detour time in minutes from the highway" },
                costPerKwh: { type: Type.NUMBER, description: "Price in USD/CAD per kWh" }
              },
              required: ["name", "address", "lat", "lng", "speedKw", "chargerType", "plugAndCharge", "connectorType", "totalStalls", "availableStalls", "detourTimeMinutes", "costPerKwh"]
            }
          }
        },
        required: ["originCoords", "destCoords", "routeExplanation", "stationList"]
      };

      const modelsToTry = ["gemini-3.7-flash", "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        try {
          const result = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema,
              systemInstruction: "You are an EV charging routing assistant specializing in Tesla Supercharger integrations, the North American Charging Standard (NACS), and Toyota EV systems. Provide highly accurate charging coordinates and technical parameters."
            }
          });

          gResponseText = result.text || "";
          if (gResponseText) {
            break;
          }
        } catch (err: any) {
          // Continue to fallback model or fallback database quietly
        }
      }

      if (gResponseText) {
        const parsed = JSON.parse(gResponseText);
        explanation = parsed.routeExplanation;
        
        let resOriginCoords = parsed.originCoords;
        let resDestCoords = parsed.destCoords;
        
        generatedStations = (parsed.stationList || []).map((item: any, index: number) => ({
          id: `gemini-ts-${index}-${Date.now()}`,
          name: item.name,
          address: item.address,
          position: { lat: item.lat, lng: item.lng },
          speedKw: item.speedKw || 250,
          chargerType: (item.chargerType === "V4 Supercharger" ? "V4 Supercharger" : "V3 Supercharger") as any,
          plugAndCharge: item.plugAndCharge !== false,
          connectorType: (item.connectorType === "CCS (Magic Dock)" ? "CCS (Magic Dock)" : "NACS") as any,
          totalStalls: item.totalStalls || 12,
          availableStalls: item.availableStalls || 8,
          detourTimeMinutes: item.detourTimeMinutes || 3,
          costPerKwh: item.costPerKwh || 0.39,
          status: (item.availableStalls > 2 ? "operational" : item.availableStalls > 0 ? "busy" : "maintenance") as any
        }));

        (req as any).resolvedCoords = { originCoords: resOriginCoords, destCoords: resDestCoords };
      }
    } catch (err) {
      // AI generation fallback will seamlessly trigger below
    }
  }

  // Fallback / merging if Gemini failed or was skipped
  if (generatedStations.length === 0) {
    const searchTerms = `${origin} ${destination}`.toLowerCase();
    explanation = `For your ${isTwoWay ? 'round trip' : 'trip'} between ${origin} and ${destination}, starting at ${initialSocPercent}% SoC provides real-world range for your 2026 Toyota bZ. On this corridor, Tesla V3/V4 Superchargers open to non-Tesla EVs support direct ISO 15118 Autocharge/Plug & Charge. Once registered in the Toyota app, you can connect the Tesla NACS connector natively and begin charging automatically within 10 seconds.`;
    
    let regionalFallbacks = FALLBACK_STATIONS;
    if (searchTerms.includes("waterloo") || searchTerms.includes("guelph") || searchTerms.includes("cambridge") || searchTerms.includes("toronto") || searchTerms.includes("kitchener") || searchTerms.includes("cornwall") || searchTerms.includes("ontario") || searchTerms.includes("canada") || searchTerms.includes("on")) {
      regionalFallbacks = FALLBACK_STATIONS.filter(s => s.address.includes("ON"));
    } else if (searchTerms.includes("austin") || searchTerms.includes("dallas") || searchTerms.includes("texas") || searchTerms.includes("houston")) {
      regionalFallbacks = FALLBACK_STATIONS.filter(s => s.address.includes("TX"));
    } else if (searchTerms.includes("new york") || searchTerms.includes("delaware") || searchTerms.includes("newark")) {
      regionalFallbacks = FALLBACK_STATIONS.filter(s => s.address.includes("DE") || s.address.includes("NJ"));
    } else {
      regionalFallbacks = FALLBACK_STATIONS.filter(s => s.address.includes("CA") || s.address.includes("ON"));
    }

    if (regionalFallbacks.length === 0) {
      regionalFallbacks = FALLBACK_STATIONS.slice(0, 4);
    }

    generatedStations = regionalFallbacks.map((s, idx) => ({
      ...s,
      id: `fallback-ts-${idx}-${Date.now()}`
    }));
  }

  res.json({
    explanation,
    originCoords: (req as any).resolvedCoords?.originCoords || null,
    destCoords: (req as any).resolvedCoords?.destCoords || null,
    stations: generatedStations
  });
});

// Setup Vite Dev server or Serve static files
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Toyota Tesla Charger Finder Backend running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
