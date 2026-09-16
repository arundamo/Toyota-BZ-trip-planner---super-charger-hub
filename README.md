# Toyota bZ Supercharge Hub

Toyota bZ Supercharge Hub is a TypeScript web app for planning EV trips and finding compatible Tesla Superchargers for Toyota bZ models, with route analysis, charging-stop recommendations, and battery telemetry.

## Features

- Plan one-way or round-trip routes between two locations
- Search locations with autocomplete and current-location support
- Discover compatible Tesla V3/V4 Supercharger stops along the route
- Filter stations by Plug & Charge, connector type, stall availability, and charging power
- Tune route assumptions with vehicle selection, state-of-charge targets, trip mode, weather, and cargo load
- View route map, elevation profile, and charging telemetry
- Use Gemini-powered route intelligence when `GEMINI_API_KEY` is configured, with corridor fallback data when unavailable

## Tech Stack

- React 19 + TypeScript
- Vite
- Express
- Tailwind CSS
- Google GenAI SDK (`@google/genai`)

## Project Structure

- `src/` — React application, components, utilities, and shared types
- `src/server/corridorService.ts` — backend handlers for route analysis and location services
- `api/` — serverless-style API entry files
- `server.ts` — Express server bootstrapping API routes and Vite/static hosting

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

## Environment Variables

Copy `.env.example` to `.env` and update values:

- `GEMINI_API_KEY` — required for Gemini AI route analysis
- `APP_URL` — app base URL (used by hosting/runtime environments)

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Build and Run

```bash
npm run build
npm run start
```

## Available Scripts

- `npm run dev` — start Express + Vite middleware development server
- `npm run build` — build frontend and bundle backend server to `dist/server.cjs`
- `npm run start` — run production build
- `npm run lint` — run TypeScript type-check (`tsc --noEmit`)
- `npm run clean` — remove build artifacts

## API Endpoints

- `GET /api/health`
- `GET /api/address-lookup?q=<query>`
- `GET /api/reverse-geocode?lat=<lat>&lng=<lng>`
- `POST /api/analyze-route`

## Notes

- If Gemini is not configured or unavailable, the app automatically falls back to built-in corridor station data.
- The app is configured for Vercel deployment (`vercel.json`).
