# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all workspace dependencies
pnpm install

# Development (server + Vite dev server concurrently)
DATA_SOURCE=api pnpm dev          # no radio, uses airplanes.live
DATA_SOURCE=radio pnpm dev        # local dump1090 on :8080

# Production build (web only; server runs via tsx)
pnpm build

# Start server against built web dist
pnpm start

# Type-check all packages (shared → server → web)
pnpm typecheck
```

No test suite exists yet.

The Vite dev server (`web`, port 5173) proxies `/api` and `/ws` to the Express server (port 3000). Display: `http://localhost:5173/`, control panel: `http://localhost:5173/control.html`.

## Architecture

pnpm workspace with three packages that share TypeScript source via the `@shared` path alias (not a build step — Vite and tsx both resolve it directly from `shared/src/`).

```
shared/    Pure types + math. No DOM, no Node APIs.
server/    Node · Express · ws. Polls ADS-B, enriches, pushes over WebSocket.
web/       Vite · React. Two pages: display (canvas) and control panel.
```

### Data flow

```
RTL-SDR → dump1090 → aircraft.json (:8080)   ← radio source
                                               ← api source: airplanes.live
                    ↓ poll ~1 Hz
              server/src/datasource.ts  (Poller)
              • normalize raw readsb JSON → Aircraft (ft/kt → m/km/h here)
              • enrich: airline name, type name, origin/dest from adsbdb cache
              • merge radio + API supplement when on radio mode
                    ↓ onSnapshot callback
              server/src/hub.ts  (Hub)
              • WebSocket broadcast to all connected clients
                    ↓ WS message: { type: "aircraft", now, aircraft[] }
              web/src/lib/connection.ts  (useStream hook)
              • shared by display + control via role "display" | "control"
                    ↓ React state
              web/src/display/renderer.ts  (Renderer class)
              • per-aircraft Track history, interpolates RENDER_DELAY_MS in the past
              • canvas: glyphs, trails, sky layer, range rings, runway, dest arcs
```

### Config

`Config` in `shared/src/config.ts` is the single source of truth. Persisted to `server/data/config.json`. Any client can patch it via WebSocket (`patchConfig`) or REST (`POST /api/config`); the Hub broadcasts the updated config to all other clients immediately. `mergeConfig` does a shallow-deep merge so nested objects (palette, fonts, showFields) never lose keys on partial patches.

**Internal units are always metric** (`radiusKm`, `minAltitudeM`, `maxAltitudeM`, speeds in km/h, altitudes in meters). The `units: "metric" | "imperial"` field controls display only. Conversion helpers live in `shared/src/units.ts`.

### Key files to know

| File | What it does |
|---|---|
| `shared/src/config.ts` | Config interface + DEFAULT_CONFIG + mergeConfig |
| `shared/src/aircraft.ts` | Aircraft type (all values metric after normalization) |
| `shared/src/geo.ts` | Flat-earth projection, deadReckon (gsKmh), pxPerMeter |
| `shared/src/units.ts` | formatAltitude/Speed/Distance, toDisplay*/fromDisplay* for sliders |
| `server/src/datasource.ts` | Poller: raw ADS-B → Aircraft, ft/kt converted at intake |
| `server/src/hub.ts` | WebSocket hub, config broadcast, client message dispatch |
| `server/src/enrich/routes.ts` | adsbdb route+aircraft lookup with file-backed cache |
| `web/src/display/renderer.ts` | Canvas renderer (~1000 lines): tracks, interpolation, sky, glyphs |
| `web/src/display/celestial.ts` | Sun/moon/stars/satellites via astronomy-engine + satellite.js |
| `web/src/control/Control.tsx` | Phone control panel; unit toggle lives in topbar |

### Adding a new config field

1. Add to `Config` interface and `DEFAULT_CONFIG` in `shared/src/config.ts`.
2. `mergeConfig` handles it automatically unless it's a nested object — add a spread there if needed.
3. Read `cfg.<field>` in the renderer or wherever needed.
4. Optionally expose a control in `web/src/control/Control.tsx`.

The server persists any patched field automatically; no migration needed for new optional fields.

### Location / airport setup

Default center is Frankfurt Airport / FRA (`centerLat: 50.0379, centerLon: 8.5622`). Personal coordinates go in `server/data/config.json` (gitignored — never committed). Runway geometry for SFO is in `web/src/display/airports.ts` — replace or extend `AIRPORTS` for other locations. Stars, sun, moon, satellites all compute from centerLat/centerLon automatically.
