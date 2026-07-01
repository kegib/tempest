/**
 * weatherTips.ts
 *
 * Two-layer weather warnings and safety tips system:
 *
 * Layer 1 – Official alerts
 *   • NOAA NWS API  (US locations, api.weather.gov)
 *   • Open-Meteo weather alerts fallback (global, free, no key required)
 *
 * Layer 2 – Derived tips
 *   • Pure TypeScript rule engine fired against current conditions
 *     (temp, feels_like, wind, humidity, UV, precip, visibility)
 *   • Every location gets actionable advice even with no official alert
 *
 * Results are merged, deduplicated by category tag, sorted by severity,
 * and returned as { warnings, tips }.
 */

import type { CurrentWeather, DailyForecast, LocationInfo } from './weatherTypes';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function proxied(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = 'minor' | 'moderate' | 'severe' | 'extreme';

export interface WeatherWarning {
  id: string;
  source: 'noaa' | 'openmeteo' | 'derived' | 'static';
  event: string;
  headline: string;
  description: string;
  severity: Severity;
  start: number;   // unix timestamp
  end: number;     // unix timestamp
  instruction?: string;
  tags: string[];
}

export interface SafetyTip {
  icon: string;
  title: string;
  body: string;
  severity: Severity;
  tags: string[];
}

export interface WeatherTipsResult {
  warnings: WeatherWarning[];
  tips: SafetyTip[];
  /** ISO string of when this result was computed */
  fetchedAt: string;
  /** Whether any official (non-derived) alert was found */
  hasOfficialAlerts: boolean;
}

// ─── Severity ordering ────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<Severity, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_RANK[b] - SEVERITY_RANK[a]; // descending
}

function nwsSeverityToSeverity(s: string): Severity {
  const lower = s.toLowerCase();
  if (lower === 'extreme') return 'extreme';
  if (lower === 'severe') return 'severe';
  if (lower === 'moderate') return 'moderate';
  return 'minor';
}

// ─── Layer 1A: NOAA NWS (US only) ────────────────────────────────────────────

interface NwsAlert {
  id: string;
  properties: {
    event: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity: string;
    effective: string;
    expires: string;
    areaDesc: string;
    category?: string;
  };
}

/**
 * Returns true when lat/lon is roughly within the US bounding box
 * (including Alaska, Hawaii, Puerto Rico).
 */
function isUSLocation(lat: number, lon: number): boolean {
  // Contiguous US + Alaska + Hawaii + Puerto Rico rough bbox
  if (lat >= 18 && lat <= 72 && lon >= -180 && lon <= -65) return true;
  return false;
}

async function fetchNoaaAlerts(lat: number, lon: number): Promise<WeatherWarning[]> {
  if (!isUSLocation(lat, lon)) return [];

  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}&status=actual&message_type=alert`;
  try {
    const res = await fetch(proxied(url), {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'tmpst-weather-app' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const features: NwsAlert[] = json?.features ?? [];

    return features.map((f) => {
      const p = f.properties;
      const tags = deriveTagsFromEvent(p.event);
      return {
        id: `noaa-${f.id}`,
        source: 'noaa' as const,
        event: p.event,
        headline: p.headline ?? p.event,
        description: (p.description ?? '').replace(/\n\n/g, ' ').replace(/\n/g, ' ').trim(),
        severity: nwsSeverityToSeverity(p.severity),
        start: new Date(p.effective).getTime() / 1000,
        end: new Date(p.expires).getTime() / 1000,
        instruction: p.instruction?.replace(/\n/g, ' ').trim(),
        tags,
      };
    });
  } catch {
    return [];
  }
}

// ─── Layer 1B: Open-Meteo alerts (global fallback) ───────────────────────────

interface OpenMeteoAlert {
  event: string;
  headline?: string;
  description?: string;
  start?: string;
  end?: string;
  severity?: string;
}

async function fetchOpenMeteoAlerts(lat: number, lon: number): Promise<WeatherWarning[]> {
  // Open-Meteo doesn't have a dedicated alerts endpoint, but their forecast
  // includes a "weather_alerts" array when available. We use their free API.
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&weather_alerts=true&forecast_days=1&current=weather_alerts`;
  try {
    const res = await fetch(proxied(url), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const alerts: OpenMeteoAlert[] = json?.weather_alerts ?? [];
    const now = Date.now() / 1000;

    return alerts.map((a, i) => {
      const tags = deriveTagsFromEvent(a.event ?? '');
      return {
        id: `openmeteo-${i}-${a.event ?? 'alert'}`,
        source: 'openmeteo' as const,
        event: a.event ?? 'Weather Alert',
        headline: a.headline ?? a.event ?? 'Weather Alert',
        description: a.description?.replace(/\n/g, ' ').trim() ?? '',
        severity: nwsSeverityToSeverity(a.severity ?? 'minor'),
        start: a.start ? new Date(a.start).getTime() / 1000 : now,
        end: a.end ? new Date(a.end).getTime() / 1000 : now + 3600,
        tags,
      };
    });
  } catch {
    return [];
  }
}

// ─── Tag helpers ─────────────────────────────────────────────────────────────

function deriveTagsFromEvent(event: string): string[] {
  const e = event.toLowerCase();
  const tags: string[] = [];
  if (e.includes('thunder') || e.includes('lightning')) tags.push('thunder');
  if (e.includes('tornado')) tags.push('tornado');
  if (e.includes('hurricane') || e.includes('typhoon') || e.includes('cyclone')) tags.push('hurricane');
  if (e.includes('flood') || e.includes('surge')) tags.push('flood');
  if (e.includes('wind') || e.includes('gale')) tags.push('wind');
  if (e.includes('snow') || e.includes('blizzard') || e.includes('ice') || e.includes('winter')) tags.push('snow');
  if (e.includes('heat') || e.includes('hot')) tags.push('heat');
  if (e.includes('cold') || e.includes('freeze') || e.includes('frost')) tags.push('cold');
  if (e.includes('fog')) tags.push('fog');
  if (e.includes('fire') || e.includes('smoke') || e.includes('air quality')) tags.push('fire');
  if (e.includes('uv') || e.includes('sun')) tags.push('uv');
  if (e.includes('rain') || e.includes('shower')) tags.push('rain');
  if (tags.length === 0) tags.push('general');
  return tags;
}

// ─── Layer 2: Derived rule engine ─────────────────────────────────────────────

interface RuleInput {
  tempC: number;
  feelsLikeC: number;
  windspeedKmph: number;
  humidity: number;
  uvIndex: number;
  precipMM: number;
  visibilityKm: number;
  cloudcover: number;
  weatherCode: number;
  maxTempC: number;
  minTempC: number;
  maxWindKmph: number;
  maxPrecipMM: number;
  maxChanceOfRain: number;
  maxChanceOfSnow: number;
  maxChanceOfThunder: number;
}

interface RuleOutput {
  warning?: WeatherWarning;
  tip?: SafetyTip;
}

type Rule = (input: RuleInput) => RuleOutput | null;

const now = () => Math.floor(Date.now() / 1000);
const later = (hours: number) => now() + hours * 3600;

// ── Heat rules ──
const ruleExtremeHeat: Rule = (i) => {
  if (i.feelsLikeC < 41) return null;
  return {
    warning: {
      id: 'derived-extreme-heat',
      source: 'derived',
      event: 'Extreme Heat',
      headline: `Feels like ${i.feelsLikeC}°C — Dangerous heat conditions`,
      description:
        'Extreme heat index detected. Prolonged exposure can cause heat stroke, which is life-threatening.',
      severity: 'extreme',
      start: now(),
      end: later(6),
      instruction:
        'Stay indoors in air-conditioned spaces. Drink water every 15–20 minutes. Never leave people or animals in parked vehicles.',
      tags: ['heat'],
    },
    tip: {
      icon: '🌡️',
      title: 'Extreme Heat Warning',
      body: 'Heat index above 41°C. Risk of heat stroke. Stay cool, hydrated, and avoid outdoor exertion.',
      severity: 'extreme',
      tags: ['heat'],
    },
  };
};

const ruleSevereHeat: Rule = (i) => {
  if (i.feelsLikeC < 32 || i.feelsLikeC >= 41) return null;
  return {
    tip: {
      icon: '🥵',
      title: 'High Heat — Stay Hydrated',
      body: `Feels like ${i.feelsLikeC}°C. Drink plenty of water, seek shade, and limit strenuous activity between 10am–4pm.`,
      severity: i.feelsLikeC >= 38 ? 'severe' : 'moderate',
      tags: ['heat'],
    },
  };
};

const ruleHeatHumidity: Rule = (i) => {
  if (i.tempC < 28 || i.humidity < 65) return null;
  return {
    tip: {
      icon: '💧',
      title: 'High Heat & Humidity',
      body: `${i.tempC}°C with ${i.humidity}% humidity. Your body's cooling system is less effective. Drink water frequently and rest often.`,
      severity: 'moderate',
      tags: ['heat', 'humidity'],
    },
  };
};

// ── Cold rules ──
const ruleExtremeCold: Rule = (i) => {
  if (i.feelsLikeC > -30) return null;
  return {
    warning: {
      id: 'derived-extreme-cold',
      source: 'derived',
      event: 'Extreme Cold',
      headline: `Feels like ${i.feelsLikeC}°C — Dangerous wind chill`,
      description:
        'Extreme cold with severe wind chill. Exposed skin can develop frostbite within minutes.',
      severity: 'extreme',
      start: now(),
      end: later(12),
      instruction:
        'Cover all exposed skin. Limit time outdoors to under 10 minutes. Watch for frostbite (numbness, white/grey skin) and hypothermia.',
      tags: ['cold'],
    },
    tip: {
      icon: '🥶',
      title: 'Extreme Cold Warning',
      body: `Wind chill of ${i.feelsLikeC}°C. Frostbite can occur in minutes on exposed skin. Stay indoors if possible.`,
      severity: 'extreme',
      tags: ['cold'],
    },
  };
};

const ruleSevereCold: Rule = (i) => {
  if (i.feelsLikeC > -18 || i.feelsLikeC <= -30) return null;
  return {
    tip: {
      icon: '🧤',
      title: 'Severe Cold — Layer Up',
      body: `Feels like ${i.feelsLikeC}°C. Wear thermal layers, cover extremities, and limit outdoor exposure. Carry an emergency kit if driving.`,
      severity: 'severe',
      tags: ['cold'],
    },
  };
};

const ruleMildCold: Rule = (i) => {
  if (i.feelsLikeC > -5 || i.feelsLikeC <= -18) return null;
  return {
    tip: {
      icon: '🧣',
      title: 'Cold Conditions',
      body: `Feels like ${i.feelsLikeC}°C. Dress in layers, wear gloves and a hat. Icy surfaces are likely — walk carefully.`,
      severity: 'minor',
      tags: ['cold'],
    },
  };
};

const ruleFrost: Rule = (i) => {
  if (i.minTempC > 0) return null;
  return {
    tip: {
      icon: '❄️',
      title: 'Frost Expected Overnight',
      body: `Minimum temperature ${i.minTempC}°C. Protect plants and outdoor pipes. Expect icy roads and footpaths in the morning.`,
      severity: 'minor',
      tags: ['cold', 'frost'],
    },
  };
};

// ── Wind rules ──
const ruleExtremWind: Rule = (i) => {
  if (i.windspeedKmph < 90) return null;
  return {
    warning: {
      id: 'derived-extreme-wind',
      source: 'derived',
      event: 'Extreme Wind',
      headline: `Wind speed ${i.windspeedKmph} km/h — Dangerous conditions`,
      description:
        'Extreme wind speeds capable of structural damage, uprooting trees, and making travel dangerous.',
      severity: 'extreme',
      start: now(),
      end: later(6),
      instruction:
        'Stay indoors away from windows. Do not drive high-profile vehicles. Secure or bring in all outdoor objects.',
      tags: ['wind'],
    },
    tip: {
      icon: '🌪️',
      title: 'Extreme Wind Warning',
      body: `${i.windspeedKmph} km/h winds. Stay indoors. Risk of flying debris and structural damage.`,
      severity: 'extreme',
      tags: ['wind'],
    },
  };
};

const ruleSevereWind: Rule = (i) => {
  if (i.windspeedKmph < 62 || i.windspeedKmph >= 90) return null;
  return {
    tip: {
      icon: '💨',
      title: 'Strong Wind Advisory',
      body: `Winds at ${i.windspeedKmph} km/h. Secure outdoor furniture and avoid unnecessary travel. Cyclists and pedestrians use caution.`,
      severity: 'moderate',
      tags: ['wind'],
    },
  };
};

const ruleFreshWind: Rule = (i) => {
  if (i.windspeedKmph < 40 || i.windspeedKmph >= 62) return null;
  return {
    tip: {
      icon: '🍃',
      title: 'Breezy Conditions',
      body: `Winds at ${i.windspeedKmph} km/h. Cyclists and motorcyclists should take extra care on exposed roads.`,
      severity: 'minor',
      tags: ['wind'],
    },
  };
};

// ── UV rules ──
const ruleExtremeUV: Rule = (i) => {
  if (i.uvIndex < 11) return null;
  return {
    warning: {
      id: 'derived-extreme-uv',
      source: 'derived',
      event: 'Extreme UV Index',
      headline: `UV Index ${i.uvIndex} — Extreme radiation`,
      description:
        'Extreme UV radiation. Unprotected skin can burn in under 10 minutes.',
      severity: 'extreme',
      start: now(),
      end: later(8),
      instruction:
        'Apply SPF 50+ sunscreen every 2 hours. Seek shade. Wear UV-protective clothing, sunglasses, and a wide-brim hat.',
      tags: ['uv'],
    },
    tip: {
      icon: '☀️',
      title: 'Extreme UV — Max Protection Required',
      body: `UV index ${i.uvIndex}. Skin can burn in under 10 minutes. SPF 50+, shade, and protective clothing are essential.`,
      severity: 'extreme',
      tags: ['uv'],
    },
  };
};

const ruleVeryHighUV: Rule = (i) => {
  if (i.uvIndex < 8 || i.uvIndex >= 11) return null;
  return {
    tip: {
      icon: '🕶️',
      title: 'Very High UV Index',
      body: `UV index ${i.uvIndex}. Apply SPF 30+ sunscreen, wear a hat and sunglasses, and limit midday sun exposure.`,
      severity: 'moderate',
      tags: ['uv'],
    },
  };
};

const ruleHighUV: Rule = (i) => {
  if (i.uvIndex < 6 || i.uvIndex >= 8) return null;
  return {
    tip: {
      icon: '🧴',
      title: 'High UV Index',
      body: `UV index ${i.uvIndex}. Apply sunscreen and reapply every 2 hours if outdoors for extended periods.`,
      severity: 'minor',
      tags: ['uv'],
    },
  };
};

// ── Rain / Flood rules ──
const ruleHeavyRain: Rule = (i) => {
  if (i.maxPrecipMM < 25) return null;
  return {
    warning: {
      id: 'derived-heavy-rain',
      source: 'derived',
      event: 'Heavy Rain',
      headline: `Heavy rain — up to ${i.maxPrecipMM.toFixed(0)} mm expected`,
      description:
        'Intense rainfall may cause localised flooding, reduced road visibility, and hazardous driving conditions.',
      severity: i.maxPrecipMM >= 50 ? 'severe' : 'moderate',
      start: now(),
      end: later(6),
      instruction:
        'Avoid driving through standing water. If flooding occurs, move to higher ground immediately. Keep storm drains clear.',
      tags: ['rain', 'flood'],
    },
    tip: {
      icon: '🌧️',
      title: 'Heavy Rain — Flood Risk',
      body: `Up to ${i.maxPrecipMM.toFixed(0)} mm of rain expected. Avoid low-lying roads. Allow extra travel time.`,
      severity: i.maxPrecipMM >= 50 ? 'severe' : 'moderate',
      tags: ['rain', 'flood'],
    },
  };
};

const ruleModerateRain: Rule = (i) => {
  if (i.maxChanceOfRain < 60 || i.maxPrecipMM >= 25) return null;
  return {
    tip: {
      icon: '🌂',
      title: 'Rain Likely',
      body: `${i.maxChanceOfRain}% chance of rain. Carry an umbrella and allow extra time for travel.`,
      severity: 'minor',
      tags: ['rain'],
    },
  };
};

// ── Snow / Ice rules ──
const ruleHeavySnow: Rule = (i) => {
  if (i.maxChanceOfSnow < 60 || i.minTempC > 2) return null;
  return {
    warning: {
      id: 'derived-heavy-snow',
      source: 'derived',
      event: 'Snow / Blizzard Risk',
      headline: `${i.maxChanceOfSnow}% chance of heavy snow`,
      description:
        'Heavy snowfall possible with significant accumulation. Travel may become treacherous.',
      severity: i.maxChanceOfSnow >= 80 ? 'severe' : 'moderate',
      start: now(),
      end: later(12),
      instruction:
        'Avoid unnecessary travel. If driving, carry a winter kit: blanket, shovel, sand, torch, and charged phone. Clear snow from footpaths promptly.',
      tags: ['snow'],
    },
    tip: {
      icon: '❄️',
      title: 'Heavy Snow Risk',
      body: `${i.maxChanceOfSnow}% chance of snow. Stock up on essentials and prepare for disruption to travel and utilities.`,
      severity: i.maxChanceOfSnow >= 80 ? 'severe' : 'moderate',
      tags: ['snow'],
    },
  };
};

const ruleIce: Rule = (i) => {
  if (i.minTempC > 2 || i.maxChanceOfRain < 30) return null;
  return {
    tip: {
      icon: '🧊',
      title: 'Black Ice Risk',
      body: `Sub-zero temperatures with precipitation risk. Black ice is likely on roads and footpaths. Drive slowly and wear grip footwear.`,
      severity: 'moderate',
      tags: ['snow', 'ice'],
    },
  };
};

// ── Thunder rules ──
const ruleThunder: Rule = (i) => {
  if (i.maxChanceOfThunder < 40) return null;
  return {
    warning: {
      id: 'derived-thunder',
      source: 'derived',
      event: 'Thunderstorm Risk',
      headline: `${i.maxChanceOfThunder}% chance of thunderstorms`,
      description:
        'Lightning and heavy rain are possible. Avoid open areas and tall isolated trees.',
      severity: i.maxChanceOfThunder >= 70 ? 'severe' : 'moderate',
      start: now(),
      end: later(6),
      instruction:
        'Go indoors or into a hard-topped vehicle. Avoid water, high ground, open fields, and isolated trees. Unplug sensitive electronics.',
      tags: ['thunder'],
    },
    tip: {
      icon: '⛈️',
      title: 'Thunderstorm Possible',
      body: `${i.maxChanceOfThunder}% chance of lightning and thunder. Seek shelter indoors. Stay away from open areas and tall trees.`,
      severity: i.maxChanceOfThunder >= 70 ? 'severe' : 'moderate',
      tags: ['thunder'],
    },
  };
};

// ── Visibility rules ──
const ruleLowVisibility: Rule = (i) => {
  if (i.visibilityKm >= 1) return null;
  return {
    warning: {
      id: 'derived-low-vis',
      source: 'derived',
      event: 'Dense Fog',
      headline: `Visibility ${i.visibilityKm < 0.1 ? '<100 m' : (i.visibilityKm * 1000).toFixed(0) + ' m'}`,
      description: 'Very low visibility due to dense fog. Driving is extremely hazardous.',
      severity: i.visibilityKm < 0.1 ? 'severe' : 'moderate',
      start: now(),
      end: later(4),
      instruction:
        'Use fog lights if equipped. Drive at reduced speed with increased following distance. Consider delaying non-essential travel.',
      tags: ['fog'],
    },
    tip: {
      icon: '🌫️',
      title: 'Dense Fog',
      body: `Visibility under 1 km. Use fog lights, reduce speed, and increase following distance. Watch for pedestrians and cyclists.`,
      severity: i.visibilityKm < 0.1 ? 'severe' : 'moderate',
      tags: ['fog'],
    },
  };
};

const ruleModerateVisibility: Rule = (i) => {
  if (i.visibilityKm < 1 || i.visibilityKm >= 4) return null;
  return {
    tip: {
      icon: '🌁',
      title: 'Reduced Visibility',
      body: `Visibility ${i.visibilityKm} km — foggy or misty conditions. Slow down and use dipped headlights.`,
      severity: 'minor',
      tags: ['fog'],
    },
  };
};

// ── Humidity rules ──
const ruleHighHumidity: Rule = (i) => {
  if (i.humidity < 85 || i.tempC < 20) return null;
  return {
    tip: {
      icon: '💦',
      title: 'Very High Humidity',
      body: `Humidity at ${i.humidity}%. Feels muggy and oppressive. Ensure good ventilation and stay hydrated. Fungal and mould growth risk.`,
      severity: 'minor',
      tags: ['humidity'],
    },
  };
};

// ── Weather-code-based rules (wttr.in codes) ──

const ruleSandstorm: Rule = (i) => {
  // Code 731 = dust/sand, 751 = sand
  if (![731, 751].includes(i.weatherCode)) return null;
  return {
    warning: {
      id: 'derived-sandstorm',
      source: 'derived',
      event: 'Dust/Sand Storm',
      headline: 'Dust or sandstorm conditions',
      description:
        'Airborne dust and sand particles severely reduce visibility and air quality.',
      severity: 'severe',
      start: now(),
      end: later(6),
      instruction:
        'Stay indoors with windows closed. Wear a mask (N95 or FFP2) if outdoors. Keep headlights on if driving.',
      tags: ['fog', 'wind'],
    },
    tip: {
      icon: '🏜️',
      title: 'Dust Storm',
      body: 'Low visibility and poor air quality. Stay indoors, seal windows, and wear a mask if you must go outside.',
      severity: 'severe',
      tags: ['fog', 'wind'],
    },
  };
};

// ── All rules in evaluation order ──
const ALL_RULES: Rule[] = [
  ruleExtremeHeat,
  ruleSevereHeat,
  ruleHeatHumidity,
  ruleExtremeCold,
  ruleSevereCold,
  ruleMildCold,
  ruleFrost,
  ruleExtremWind,
  ruleSevereWind,
  ruleFreshWind,
  ruleExtremeUV,
  ruleVeryHighUV,
  ruleHighUV,
  ruleHeavyRain,
  ruleModerateRain,
  ruleHeavySnow,
  ruleIce,
  ruleThunder,
  ruleLowVisibility,
  ruleModerateVisibility,
  ruleHighHumidity,
  ruleSandstorm,
];

// ─── Run rule engine ──────────────────────────────────────────────────────────

function buildRuleInput(
  current: CurrentWeather,
  forecast: DailyForecast[],
): RuleInput {
  const today = forecast[0];
  const allHourly = forecast.flatMap((d) => d.hourly);
  return {
    tempC: current.tempC,
    feelsLikeC: current.feelsLikeC,
    windspeedKmph: current.windspeedKmph,
    humidity: current.humidity,
    uvIndex: current.uvIndex,
    precipMM: current.precipMM,
    visibilityKm: current.visibilityKm,
    cloudcover: current.cloudcover,
    weatherCode: current.weatherCode,
    maxTempC: today?.maxTempC ?? current.tempC,
    minTempC: today?.minTempC ?? current.tempC,
    maxWindKmph: Math.max(...allHourly.map((h) => h.windspeedKmph), current.windspeedKmph),
    maxPrecipMM: Math.max(...allHourly.map((h) => h.precipMM), current.precipMM),
    maxChanceOfRain: Math.max(...allHourly.map((h) => h.chanceOfRain), 0),
    maxChanceOfSnow: 0, // wttr doesn't expose this in the normalised type; covered by weatherCode
    maxChanceOfThunder: 0, // covered by weatherCode rules + derived from code
  };
}

function runRuleEngine(
  current: CurrentWeather,
  forecast: DailyForecast[],
): { warnings: WeatherWarning[]; tips: SafetyTip[] } {
  const input = buildRuleInput(current, forecast);

  // Also infer thunder/snow from wttr weather codes in forecast
  const allCodes = [
    current.weatherCode,
    ...forecast.flatMap((d) => [d.weatherCode, ...d.hourly.map((h) => h.weatherCode)]),
  ];
  const thunderCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 386, 389, 392, 395];
  const snowCodes = [179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377];
  const hasThunderCode = allCodes.some((c) => thunderCodes.includes(c));
  const hasSnowCode = allCodes.some((c) => snowCodes.includes(c));
  if (hasThunderCode) input.maxChanceOfThunder = Math.max(input.maxChanceOfThunder, 70);
  if (hasSnowCode) input.maxChanceOfSnow = Math.max(input.maxChanceOfSnow, 75);

  const warnings: WeatherWarning[] = [];
  const tips: SafetyTip[] = [];
  const usedWarningTags = new Set<string>();
  const usedTipTags = new Set<string>();

  for (const rule of ALL_RULES) {
    const result = rule(input);
    if (!result) continue;

    if (result.warning) {
      // Deduplicate by tag: only emit first (highest-severity) warning per category
      const primaryTag = result.warning.tags[0];
      if (!usedWarningTags.has(primaryTag)) {
        warnings.push(result.warning);
        result.warning.tags.forEach((t) => usedWarningTags.add(t));
      }
    }

    if (result.tip) {
      const primaryTag = result.tip.tags[0];
      if (!usedTipTags.has(primaryTag)) {
        tips.push(result.tip);
        result.tip.tags.forEach((t) => usedTipTags.add(t));
      }
    }
  }

  return { warnings, tips };
}

// ─── Merge, dedup, sort ───────────────────────────────────────────────────────

function mergeAndDedup(
  official: WeatherWarning[],
  derived: WeatherWarning[],
): WeatherWarning[] {
  const seen = new Set<string>();
  const all: WeatherWarning[] = [];

  // Official warnings take priority — add them first
  for (const w of official) {
    const key = w.tags[0] ?? w.event;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(w);
    }
  }

  // Add derived only when the tag isn't already covered by an official warning
  for (const w of derived) {
    const key = w.tags[0] ?? w.event;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(w);
    }
  }

  return all.sort((a, b) => compareSeverity(a.severity, b.severity));
}

function dedupTips(tips: SafetyTip[]): SafetyTip[] {
  const seen = new Set<string>();
  const out: SafetyTip[] = [];
  for (const t of tips) {
    const key = t.tags[0] ?? t.title;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out.sort((a, b) => compareSeverity(a.severity, b.severity));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchWeatherTips(
  location: LocationInfo,
  current: CurrentWeather,
  forecast: DailyForecast[],
): Promise<WeatherTipsResult> {
  // Run official alert fetches in parallel; derived engine is synchronous
  const [noaaWarnings, owmWarnings] = await Promise.all([
    fetchNoaaAlerts(location.lat, location.lon),
    // Only use Open-Meteo alerts as fallback if not US (NOAA is better for US)
    isUSLocation(location.lat, location.lon)
      ? Promise.resolve([] as WeatherWarning[])
      : fetchOpenMeteoAlerts(location.lat, location.lon),
  ]);

  const officialWarnings = [...noaaWarnings, ...owmWarnings];
  const { warnings: derivedWarnings, tips: derivedTips } = runRuleEngine(current, forecast);

  const warnings = mergeAndDedup(officialWarnings, derivedWarnings);
  const tips = dedupTips(derivedTips);

  return {
    warnings,
    tips,
    fetchedAt: new Date().toISOString(),
    hasOfficialAlerts: officialWarnings.length > 0,
  };
}
