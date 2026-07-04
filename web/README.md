# AEGIS web application

## Requirements

- Node.js 22 or newer
- npm
- Optional Gemini API key

## Development

From the `web` directory:

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

The development command starts both Vite and the local service adapter on port
8787.

## Optional Gemini configuration

Create `/Users/alorebube/Desktop/Hackathon/.env.local`:

```env
GEMINI_API_KEY=your_key
```

Without a key, the incident workflow uses the deterministic rules engine. Never
commit `.env.local`.

## Checks

```bash
npm run build
npm run lint
npm test
```

## Production-style local run

```bash
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

## External services

- Nominatim: user-driven incident and staging-point geocoding
- Overpass API: nearby public-safety site suggestions
- Open-Meteo: current weather
- OpenStreetMap: map tiles
- OSRM: route geometry
- Gemini 3.5 Flash: optional structured incident assessment

Routing falls back to a coordinate-derived direct route and incident assessment
falls back to the local rules engine. Weather and geocoding are shown as
unavailable when their live sources cannot be reached; the interface does not
invent current conditions or locations.
