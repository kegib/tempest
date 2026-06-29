# ⚡ tmpst

> A console-oriented weather forecast web app inspired by [wttr.in](https://wttr.in) and [wego](https://github.com/chubin/wego).

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2Fkegib%2Ftempest.git)

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
▼ Today      2026-06-29 ─────────────────────── ☀️  25°C / 13°C  avg 20°C
▶ Tomorrow   2026-06-30 ─────────────────────── ⛅  26°C / 17°C  avg 21°C
▶ Wed 1 Jul  2026-07-01 ─────────────────────── ☁️  24°C / 15°C  avg 20°C
```

---

## Features

- **Current conditions** — temperature, feels-like, description, wind, visibility, UV index, humidity and cloud-cover bar charts
- **3-day forecast** — collapsible daily rows showing high/low/avg, sunrise/sunset, UV, and an expandable hourly breakdown
- **Hourly grid** — time, weather icon, temperature, `▁▃▅▆▇` sparkline, rain probability, wind speed
- **°C / °F toggle** — instant client-side conversion, no re-fetch needed
- **Terminal chrome** — simulated window title bar, `$>` prompt, `[ENTER]` button, status bar with lat/lon
- **curl-friendly text output** — collapsible wego/wttr-style plain-text summary you can copy to a clipboard or share in Nostr
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
git clone https://github.com/kegib/tempest.git
cd tempest
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
│       ├── SearchBar.tsx            # Terminal $> prompt input
│       ├── TemperatureToggle.tsx    # [°C|°F] pill
│       ├── WeatherIcon.tsx          # Emoji icon sized sm/md/lg/xl
│       └── WeatherSkeleton.tsx      # Terminal "connecting…" loading state
├── hooks/
│   └── useWeather.ts                # TanStack Query hook (10-min stale, 2 retries)
├── lib/
│   ├── weatherApi.ts                # wttr.in client, parsers, helpers
│   └── weatherTypes.ts             # Full TypeScript types for wttr.in response
└── pages/
    └── Index.tsx                    # Main page with terminal window chrome
```

---

## Data source

All weather data comes from **[wttr.in](https://wttr.in)** via its public JSON API:

```
https://wttr.in/{location}?format=j1
```

wttr.in is open-source ([Apache 2.0](https://github.com/chubin/wttr.in/blob/master/LICENSE)) and free to use. tmpst caches responses for 10 minutes to be a polite consumer of the service. For high-traffic deployments, consider self-hosting wttr.in or proxying through a backend with more aggressive caching.

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
