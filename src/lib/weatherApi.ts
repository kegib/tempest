import type {
  WttrResponse,
  WeatherData,
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  LocationInfo,
} from './weatherTypes';

const WTTR_BASE = 'https://wttr.in';
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function wttrUrl(location: string): string {
  const encoded = encodeURIComponent(location.trim());
  const target = `${WTTR_BASE}/${encoded}?format=j1`;
  return `${CORS_PROXY}${encodeURIComponent(target)}`;
}

function parseHourly(h: WttrResponse['weather'][0]['hourly'][0]): HourlyForecast {
  return {
    time: parseInt(h.time, 10),
    tempC: parseInt(h.tempC, 10),
    feelsLikeC: parseInt(h.FeelsLikeC, 10),
    description: h.weatherDesc[0]?.value ?? '',
    weatherCode: parseInt(h.weatherCode, 10),
    precipMM: parseFloat(h.precipMM),
    chanceOfRain: parseInt(h.chanceofrain, 10),
    windspeedKmph: parseInt(h.windspeedKmph, 10),
    winddir: h.winddir16Point,
  };
}

function parseCurrent(c: WttrResponse['current_condition'][0]): CurrentWeather {
  return {
    tempC: parseInt(c.temp_C, 10),
    tempF: parseInt(c.temp_F, 10),
    feelsLikeC: parseInt(c.FeelsLikeC, 10),
    feelsLikeF: parseInt(c.FeelsLikeF, 10),
    description: c.weatherDesc[0]?.value ?? '',
    weatherCode: parseInt(c.weatherCode, 10),
    humidity: parseInt(c.humidity, 10),
    windspeedKmph: parseInt(c.windspeedKmph, 10),
    winddir: c.winddir16Point,
    visibilityKm: parseInt(c.visibility, 10),
    cloudcover: parseInt(c.cloudcover, 10),
    uvIndex: parseInt(c.uvIndex, 10),
    precipMM: parseFloat(c.precipMM),
    observationTime: c.localObsDateTime,
  };
}

function parseDaily(w: WttrResponse['weather'][0]): DailyForecast {
  const ast = w.astronomy[0];
  // Derive a representative description from the most-common weather code in hourly
  const codes = w.hourly.map((h) => parseInt(h.weatherCode, 10));
  const codeCount: Record<number, number> = {};
  for (const c of codes) codeCount[c] = (codeCount[c] ?? 0) + 1;
  const dominantCode = codes.reduce((a, b) => (codeCount[a] >= codeCount[b] ? a : b), codes[0] ?? 113);
  const dominantDesc =
    w.hourly.find((h) => parseInt(h.weatherCode, 10) === dominantCode)?.weatherDesc[0]?.value ?? '';

  return {
    date: w.date,
    maxTempC: parseInt(w.maxtempC, 10),
    minTempC: parseInt(w.mintempC, 10),
    avgTempC: parseInt(w.avgtempC, 10),
    description: dominantDesc,
    weatherCode: dominantCode,
    sunrise: ast?.sunrise ?? '',
    sunset: ast?.sunset ?? '',
    uvIndex: parseInt(w.uvIndex, 10),
    hourly: w.hourly.map(parseHourly),
  };
}

function parseLocation(wttr: WttrResponse): LocationInfo {
  const area = wttr.nearest_area[0];
  return {
    city: area?.areaName[0]?.value ?? wttr.request[0]?.query ?? 'Unknown',
    region: area?.region[0]?.value ?? '',
    country: area?.country[0]?.value ?? '',
    lat: parseFloat(area?.latitude ?? '0'),
    lon: parseFloat(area?.longitude ?? '0'),
  };
}

export async function fetchWeather(location: string): Promise<WeatherData> {
  const url = wttrUrl(location);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.status} ${res.statusText}`);
  }
  const raw: WttrResponse = await res.json();

  if (!raw.current_condition?.length || !raw.weather?.length) {
    throw new Error('Invalid weather data received');
  }

  return {
    location: parseLocation(raw),
    current: parseCurrent(raw.current_condition[0]),
    forecast: raw.weather.map(parseDaily),
    query: location,
  };
}

// ─── Weather code helpers ────────────────────────────────────────────────────

export function weatherEmoji(code: number): string {
  if (code === 113) return '☀️';
  if (code === 116) return '⛅';
  if (code === 119) return '☁️';
  if (code === 122) return '☁️';
  if ([143, 248, 260].includes(code)) return '🌫️';
  if ([176, 293, 296, 299, 302, 305, 308].includes(code)) return '🌧️';
  if ([179, 323, 326, 329, 332, 335, 338, 368, 371].includes(code)) return '❄️';
  if ([182, 185, 311, 314, 317, 320].includes(code)) return '🌨️';
  if ([200, 386, 389, 392, 395].includes(code)) return '⛈️';
  if ([263, 266, 281, 284].includes(code)) return '🌦️';
  if ([353, 356, 359, 362, 365].includes(code)) return '🌧️';
  if ([374, 377].includes(code)) return '🌨️';
  return '🌤️';
}

export function weatherGradient(code: number): string {
  if (code === 113) return 'from-amber-400 via-orange-300 to-sky-400';
  if (code === 116) return 'from-sky-400 via-blue-300 to-slate-300';
  if ([119, 122].includes(code)) return 'from-slate-500 via-slate-400 to-slate-300';
  if ([143, 248, 260].includes(code)) return 'from-slate-400 via-gray-300 to-slate-200';
  if ([200, 386, 389, 392, 395].includes(code)) return 'from-slate-700 via-slate-600 to-indigo-800';
  if (code >= 320) return 'from-blue-200 via-sky-100 to-white';
  if (code >= 260) return 'from-sky-500 via-blue-400 to-slate-400';
  return 'from-sky-500 via-blue-400 to-indigo-500';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatHour(time: number): string {
  const h = Math.floor(time / 100);
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

export function windDescription(kmph: number): string {
  if (kmph < 1) return 'Calm';
  if (kmph < 6) return 'Light air';
  if (kmph < 12) return 'Light breeze';
  if (kmph < 20) return 'Gentle breeze';
  if (kmph < 29) return 'Moderate breeze';
  if (kmph < 39) return 'Fresh breeze';
  if (kmph < 50) return 'Strong breeze';
  if (kmph < 62) return 'Near gale';
  if (kmph < 75) return 'Gale';
  return 'Storm';
}

export function uvDescription(uv: number): string {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

/** Compose a wego/wttr-style text summary of the forecast */
export function buildForecastText(data: WeatherData): string {
  const { location, current, forecast } = data;
  const loc = [location.city, location.country].filter(Boolean).join(', ');
  const emoji = weatherEmoji(current.weatherCode);
  const lines: string[] = [
    `${emoji} *${loc}*`,
    `Now: ${current.tempC}°C (feels ${current.feelsLikeC}°C), ${current.description}`,
    `💧 Humidity: ${current.humidity}%  💨 Wind: ${current.windspeedKmph} km/h ${current.winddir}`,
    '',
  ];

  for (const day of forecast) {
    const dayEmoji = weatherEmoji(day.weatherCode);
    lines.push(`📅 *${formatDayShort(day.date)}*`);
    lines.push(
      `${dayEmoji} High: ${day.maxTempC}°C  Low: ${day.minTempC}°C  —  ${day.description}`,
    );
    lines.push(`🌅 Sunrise: ${day.sunrise}  🌇 Sunset: ${day.sunset}  ☀️ UV: ${day.uvIndex}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
