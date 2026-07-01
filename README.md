# ⚡ tmpst

> A console-oriented weather forecast web app inspired by [wttr.in](https://wttr.in) and [wego](https://github.com/chubin/wego).

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2Fkegib%2Ftmpst.git)

---

## What it is

tmpst is a terminal-aesthetic weather forecast app that runs entirely in the browser. It fetches real-time weather data from the [wttr.in](https://wttr.in) JSON API and presents it in a style that feels like running `curl wttr.in` — dark background, phosphor-green monospace text, box-drawing borders, Unicode sparklines, and ANSI-inspired colours.

```
⚡ TMPST  —  console-oriented weather forecast — powered by wttr.in

$> wttr / London                                          [ENTER]

┌─ Weather report: Westminster, Westminster Greater London, United Kingdom ─┐
│  17°C                    ☀️                                               │
│  Clear                                                                    │
│  Feels like 17°C                                                          │
│ ────────────────────────────────────────────────────────────────────────  │
│  Wind       : 12 km/h WNW  Light breeze                                  │
│  Visibility : 10 km                                                       │
│  UV index   : 0  Low                                                      │
│  Observed   : 11:13 PM                                                    │
│ ────────────────────────────────────────────────────────────────────────  │
│  Humidity   : ████████████░░░░░░░░ 55%                                   │
│  Cloud cover: ░░░░░░░░░░░░░░░░░░░░ 0%                                    │
└───────────────────────────────────────────────────────────────────────────┘

── 3-DAY FORECAST ────────────────────────────────────────────────────────
▼ Today      2026-07-01 ─────────────────────── ☀️  25°C / 13°C  avg 20°C
▶ Tomorrow   2026-07-02 ─────────────────────── ⛅  26°C / 17°C  avg 21°C
▶ Thu 3 Jul  2026-07-03 ─────────────────────── ☁️  24°C / 15°C  avg 20°C
```

---

## Features

- **Current conditions** — temperature, feels-like, description, wind, visibility, UV index, humidity and cloud-cover bar charts
- **3-day forecast** — collapsible daily rows showing high/low/avg, sunrise/sunset, UV, and an expandable hourly breakdown
- **Hourly grid** — time, weather icon, temperature, `▁▃▅▆▇` sparkline, rain probability, wind speed
- **ASCII radar** — live precipitation radar rendered as coloured ASCII characters, sourced from [RainViewer](https://www.rainviewer.com/) via slippy-map tiles; adjustable zoom levels
- **Warnings & safety tips** — two-layer system: official alerts from NOAA NWS (US) and Open-Meteo (global), plus a client-side rule engine that generates actionable safety tips from current conditions
- **°C / °F toggle** — instant client-side conversion, no re-fetch needed
- **Terminal chrome** — simulated window title bar, `$>` prompt, `[ENTER]` button, status bar with lat/lon
- **curl-friendly text output** — collapsible wego/wttr-style plain-text summary you can copy to a clipboard or share on Nostr
- **Geolocation** — auto-fills your coordinates on first load (browser permission, gracefully degrades)
- **10-minute cache** — repeated queries for the same city skip the network round-trip (TanStack Query)
- **Quick-pick cities** — one-click shortcuts for London, New York, Tokyo, Paris, Sydney, and more

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) + [Vite 8](https://vite.dev) |
| Styling | [TailwindCSS 4](https://tailwindcss.com) |
| Language | TypeScript (strict) |
| Data fetching | [TanStack Query v5](https://tanstack.com/query) |
| Weather data | [wttr.in](https://wttr.in) JSON API (`?format=j1`) |
| Radar | [RainViewer](https://www.rainviewer.com/) tiles → ASCII rasteriser |
| Weather alerts | [NOAA NWS](https://api.weather.gov) (US) + [Open-Meteo](https://open-meteo.com) (global) |
| UI primitives | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) |
| Routing | [React Router v7](https://reactrouter.com) |
| Nostr | [Nostrify](https://nostrify.dev) (mkstack template) |
| Build scaffold | [mkstack](https://gitlab.com/soapbox-pub/mkstack) |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### Run locally

```bash
git clone https://github.com/kegib/tmpst.git
cd tmpst
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

### Build for production

```bash
npm run build
# output in dist/
```

---

## Project structure

```
src/
├── components/
│   └── weather/
│       ├── CurrentWeatherCard.tsx   # Hero card with stats + bar charts
│       ├── DailyForecastCard.tsx    # Collapsible daily row + hourly detail
│       ├── ForecastTextBox.tsx      # Copyable wttr-style plain-text output
│       ├── HourlyForecastRow.tsx    # Text grid with sparkline row
│       ├── RadarPanel.tsx           # ASCII precipitation radar with zoom controls
│       ├── SearchBar.tsx            # Terminal $> prompt input
│       ├── TemperatureToggle.tsx    # [°C|°F] pill
│       ├── WarningsPanel.tsx        # Official alerts + derived safety tips
│       ├── WeatherIcon.tsx          # Emoji icon sized sm/md/lg/xl
│       └── WeatherSkeleton.tsx      # Terminal "connecting…" loading state
├── hooks/
│   ├── useRadar.ts                  # TanStack Query hook for ASCII radar data
│   ├── useWeather.ts                # TanStack Query hook (10-min stale, 2 retries)
│   └── useWeatherTips.ts            # TanStack Query hook for warnings + safety tips
├── lib/
│   ├── radarApi.ts                  # RainViewer pipeline: geocode → tile → PNG → ASCII
│   ├── weatherApi.ts                # wttr.in client, parsers, helpers
│   ├── weatherTips.ts               # NOAA / Open-Meteo alerts + rule-engine tips
│   └── weatherTypes.ts             # Full TypeScript types for wttr.in response
└── pages/
    └── Index.tsx                    # Main page with terminal window chrome
```

---

## Data sources

| Source | What it provides |
|---|---|
| [wttr.in](https://wttr.in) | Current conditions and 3-day forecast (`?format=j1`) |
| [RainViewer](https://www.rainviewer.com/) | Live precipitation radar tiles (512 px PNG → ASCII) |
| [Open-Meteo](https://open-meteo.com) | Geocoding (lat/lon from location name) + global weather alerts |
| [NOAA NWS](https://api.weather.gov) | Official weather warnings for US locations |

All sources are free and require no API key. tmpst caches responses for 10 minutes to be a polite consumer of these services. For high-traffic deployments, consider proxying or self-hosting where possible.

---

## Inspiration

| Project | What we borrowed |
|---|---|
| [wttr.in](https://github.com/chubin/wttr.in) | Data source, terminal box-drawing layout, plain-text output format |
| [wego](https://github.com/chubin/wego) | Column-per-day layout concept, sparkline temperature graph, dense info density |

Both projects are by [Igor Chubin](https://github.com/chubin) and licensed under MIT / Apache 2.0 respectively.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
