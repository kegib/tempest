import { WeatherIcon } from './WeatherIcon';
import { windDescription, uvDescription } from '@/lib/weatherApi';
import type { CurrentWeather, LocationInfo } from '@/lib/weatherTypes';

interface Props {
  current: CurrentWeather;
  location: LocationInfo;
  useFahrenheit?: boolean;
}

// Render a single row in the stats table
function Row({ label, value, colour = 'text-ansi-white' }: { label: string; value: string; colour?: string }) {
  return (
    <div className="flex gap-0">
      <span className="text-ansi-dim w-24 shrink-0">{label}</span>
      <span className={`text-ansi-dim mr-1`}>:</span>
      <span className={colour}>{value}</span>
    </div>
  );
}

// Horizontal bar for a percentage value (0–100)
function Bar({ value, max = 100, colour = 'text-ansi-green' }: { value: number; max?: number; colour?: string }) {
  const filled = Math.round((value / max) * 20);
  const empty = 20 - filled;
  return (
    <span className={`${colour} font-mono`}>
      {'█'.repeat(filled)}
      <span className="text-ansi-dim">{'░'.repeat(empty)}</span>
      <span className="text-ansi-dim ml-1">{value}%</span>
    </span>
  );
}

export function CurrentWeatherCard({ current, location, useFahrenheit = false }: Props) {
  const temp = useFahrenheit ? `${current.tempF}°F` : `${current.tempC}°C`;
  const feelsLike = useFahrenheit ? `${current.feelsLikeF}°F` : `${current.feelsLikeC}°C`;
  const locStr = [location.city, location.region, location.country].filter(Boolean).join(', ');

  return (
    <div className="font-mono text-sm space-y-0">
      {/* ┌─ Title bar ─────────────────────────────────────────┐ */}
      <div className="flex items-center text-ansi-dim">
        <span>┌─</span>
        <span className="text-ansi-white px-1">Weather report: {locStr}</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)] mx-1" style={{ minWidth: '8px' }} />
        <span>┐</span>
      </div>

      {/* │ Main content │ */}
      <div className="flex border-l border-r border-[var(--ansi-dim)]">
        <div className="flex-1 px-3 py-2 space-y-1">
          {/* Big temperature + icon */}
          <div className="flex items-start gap-4">
            <div>
              <div className="text-ansi-yellow crt-glow text-4xl font-bold leading-none mb-1">
                {temp}
              </div>
              <div className="text-ansi-white text-base">{current.description}</div>
              <div className="text-ansi-dim text-xs">Feels like {feelsLike}</div>
            </div>
            <WeatherIcon code={current.weatherCode} size="xl" className="mt-1 opacity-90" />
          </div>

          <div className="border-t border-dashed border-[var(--ansi-dim)] my-2" />

          {/* Stats */}
          <div className="space-y-0.5">
            <Row label="Wind" value={`${current.windspeedKmph} km/h ${current.winddir}  ${windDescription(current.windspeedKmph)}`} colour="text-ansi-cyan" />
            <Row label="Visibility" value={`${current.visibilityKm} km`} colour="text-ansi-white" />
            <Row label="Pressure" value={`${current.precipMM > 0 ? current.precipMM + ' mm rain' : 'dry'}`} colour="text-ansi-blue" />
            <Row label="UV index" value={`${current.uvIndex}  ${uvDescription(current.uvIndex)}`} colour="text-ansi-yellow" />
            <Row label="Observed" value={current.observationTime} colour="text-ansi-dim" />
          </div>

          <div className="border-t border-dashed border-[var(--ansi-dim)] my-2" />

          {/* Bar charts */}
          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <span className="text-ansi-dim w-24 shrink-0">Humidity</span>
              <span className="text-ansi-dim mr-1">:</span>
              <Bar value={current.humidity} colour="text-ansi-blue" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-ansi-dim w-24 shrink-0">Cloud cover</span>
              <span className="text-ansi-dim mr-1">:</span>
              <Bar value={current.cloudcover} colour="text-ansi-dim" />
            </div>
          </div>
        </div>
      </div>

      {/* └───────────────────────────────────────────────────┘ */}
      <div className="flex items-center text-ansi-dim">
        <span>└</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
        <span>┘</span>
      </div>
    </div>
  );
}
