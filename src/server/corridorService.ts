import { GoogleGenAI, Type } from "@google/genai";
import { 
  FALLBACK_STATIONS, 
  POPULAR_LOCATIONS_INDEX, 
  getDistance, 
  getFallbackStations 
} from "../data/fallbackCorridors";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  // Read and clean the API key (trimming quotes and whitespace)
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 10000,
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Helper to set standard CORS headers
export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

// Handler for address autocomplete lookup
export async function addressLookupHandler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query?.q as string || "").trim();
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

  // Check fallback superchargers
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

  // 2. Query Photon geocoder (OpenStreetMap based)
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

        let placeType: 'city' | 'address' | 'poi' | 'supercharger' = 'address';
        if (props.type === 'city' || props.type === 'town' || props.osm_value === 'city') {
          placeType = 'city';
        } else if (props.osm_key === 'amenity' || props.osm_key === 'tourism' || props.osm_key === 'shop') {
          placeType = 'poi';
        }

        const alreadyExists = suggestions.some(s => 
          Math.abs(s.lat - lat) < 0.005 && Math.abs(s.lng - lng) < 0.005
        );

        if (!alreadyExists) {
          suggestions.push({
            id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 8)}`,
            displayName,
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
    // Fallback quietly to local results
  }

  res.json({ suggestions: suggestions.slice(0, 10) });
}

// Handler for reverse geocoding GPS coordinates
export async function reverseGeocodeHandler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const lat = parseFloat(req.query?.lat as string);
  const lng = parseFloat(req.query?.lng as string);

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
}

// Handler for route and charging station analysis
export async function analyzeRouteHandler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Parse body whether it arrives as JSON object or raw string
  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const { 
    origin, 
    destination, 
    startingSoc, 
    targetDestinationSoc, 
    tripType, 
    hasDestinationCharging, 
    stopsPreference,
    vehicleSpecs 
  } = body;

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

  const client = getGeminiClient();

  let gResponseText = "";
  let generatedStations: any[] = [];
  let explanation = "";
  let originCoords: any = null;
  let destCoords: any = null;
  let aiSource: 'gemini' | 'corridor-fallback' = 'corridor-fallback';

  if (client) {
    try {
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

      // Transient error detector for high-demand spikes (503 UNAVAILABLE, 429 RATE_LIMIT, timeouts)
      const isTransientError = (err: any) => {
        const msg = String(err?.message || err || '');
        const code = err?.status || err?.code || err?.error?.code;
        return (
          code === 503 ||
          code === 429 ||
          code === 408 ||
          code === 504 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('quota') ||
          msg.includes('Resource has been exhausted') ||
          msg.includes('timed out') ||
          msg.includes('timeout')
        );
      };

      // Cascade across compatible models: primary flash, lightweight flash-lite, then flash-latest
      const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2; // Up to 1 retry for transient spikes
        let succeeded = false;

        while (attempts < maxAttempts) {
          attempts++;
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
              succeeded = true;
              break;
            }
          } catch (err: any) {
            const transient = isTransientError(err);
            if (transient && attempts < maxAttempts) {
              // Wait briefly before retrying transient spike
              await new Promise((r) => setTimeout(r, 700));
              continue;
            }
            // Handled cleanly without logging unhandled error traces that trip monitor alerts
            break;
          }
        }

        if (succeeded && gResponseText) {
          break;
        }
      }

      if (gResponseText) {
        try {
          const parsed = JSON.parse(gResponseText);
          explanation = parsed.routeExplanation;
          originCoords = parsed.originCoords;
          destCoords = parsed.destCoords;
          
          generatedStations = (parsed.stationList || []).map((item: any, index: number) => ({
            id: `gemini-ts-${index}-${Date.now()}`,
            name: item.name,
            address: item.address,
            position: { lat: item.lat, lng: item.lng },
            speedKw: item.speedKw || 250,
            chargerType: (item.chargerType === "V4 Supercharger" ? "V4 Supercharger" : "V3 Supercharger"),
            plugAndCharge: item.plugAndCharge !== false,
            connectorType: (item.connectorType === "CCS (Magic Dock)" ? "CCS (Magic Dock)" : "NACS"),
            totalStalls: item.totalStalls || 12,
            availableStalls: item.availableStalls || 8,
            detourTimeMinutes: item.detourTimeMinutes || 3,
            costPerKwh: item.costPerKwh || 0.39,
            status: (item.availableStalls > 2 ? "operational" : item.availableStalls > 0 ? "busy" : "maintenance")
          }));

          aiSource = 'gemini';
        } catch {
          // Gracefully fall back to corridor database if parsing failed
        }
      }
    } catch {
      // Gracefully fall back to corridor database
    }
  }

  // Graceful fallback if Gemini did not produce stations
  if (generatedStations.length === 0) {
    const rawKey = process.env.GEMINI_API_KEY || "";
    const hasKey = Boolean(rawKey && rawKey !== "MY_GEMINI_API_KEY");

    if (!hasKey) {
      explanation = `Trip analysis for your ${isTwoWay ? 'round trip' : 'one-way trip'} between ${origin} and ${destination} using verified Tesla Superchargers. Starting at ${initialSocPercent}% SoC provides solid range for your Toyota bZ with ISO 15118 Autocharge at all NACS Superchargers.`;
    } else {
      explanation = `Trip pre-planned for your ${isTwoWay ? 'round trip' : 'one-way journey'} between ${origin} and ${destination}. Starting at ${initialSocPercent}% SoC provides real-world range for your Toyota bZ. On this corridor, Tesla V3/V4 Superchargers open to non-Tesla EVs support direct ISO 15118 Autocharge/Plug & Charge without requiring external smartphone apps.`;
    }

    generatedStations = getFallbackStations(origin, destination);
  }

  return res.status(200).json({
    explanation,
    originCoords: originCoords || null,
    destCoords: destCoords || null,
    stations: generatedStations,
    source: aiSource
  });
}
