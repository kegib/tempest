import { WeatherIcon } from './WeatherIcon';
import { formatHour } from '@/lib/weatherApi';
import type { HourlyForecast } from '@/lib/weatherTypes';

interface Props {
  hourly: HourlyForecast[];
  useFahrenheit?: boolean;
}

function toF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

// Simple sparkline character based on value relative to min/max range
function tempChar(temp: number, min: number, max: number): string {
  const range = max - min || 1;
  const ratio = (temp - min) / range;
  if (ratio < 0.2) return '▁';
  if (ratio < 0.4) return '▃';
  if (ratio < 0.6) return '▅';
  if (ratio < 0.8) return '▆';
  return '▇';
}

export function HourlyForecastRow({ hourly, useFahrenheit = false }: Props) {
  const temps = hourly.map((h) => h.tempC);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);

  return (
    <div className="font-mono text-xs overflow-x-auto scrollbar-thin">
      {/* Time row */}
      <div className="flex min-w-max">
        <span className="text-ansi-dim w-16 shrink-0">Time</span>
        {hourly.map((h) => (
          <span key={h.time} className="w-10 text-center text-ansi-dim shrink-0">
            {formatHour(h.time)}
          </span>
        ))}
      </div>

      {/* Icon row */}
      <div className="flex min-w-max">
        <span className="text-ansi-dim w-16 shrink-0">Weather</span>
        {hourly.map((h) => (
          <span key={h.time} className="w-10 text-center shrink-0 text-base leading-none">
            <WeatherIcon code={h.weatherCode} size="sm" />
          </span>
        ))}
      </div>

      {/* Temp row */}
      <div className="flex min-w-max">
        <span className="text-ansi-dim w-16 shrink-0">Temp</span>
        {hourly.map((h) => {
          const t = useFahrenheit ? toF(h.tempC) : h.tempC;
          const unit = useFahrenheit ? 'F' : 'C';
          return (
            <span key={h.time} className="w-10 text-center text-ansi-yellow shrink-0">
              {t}°{unit}
            </span>
          );
        })}
      </div>

      {/* Sparkline row */}
      <div className="flex min-w-max">
        <span className="text-ansi-dim w-16 shrink-0">Graph</span>
        {hourly.map((h) => (
          <span key={h.time} className="w-10 text-center text-ansi-green shrink-0 crt-glow">
            {tempChar(h.tempC, minT, maxT)}
          </span>
        ))}
      </div>

      {/* Rain chance row – only show if any hour has >5% */}
      {hourly.some((h) => h.chanceOfRain > 5) && (
        <div className="flex min-w-max">
          <span className="text-ansi-dim w-16 shrink-0">Rain%</span>
          {hourly.map((h) => (
            <span
              key={h.time}
              className={`w-10 text-center shrink-0 ${h.chanceOfRain > 50 ? 'text-ansi-blue' : h.chanceOfRain > 20 ? 'text-ansi-cyan' : 'text-ansi-dim'}`}
            >
              {h.chanceOfRain > 5 ? `${h.chanceOfRain}%` : '-'}
            </span>
          ))}
        </div>
      )}

      {/* Wind row */}
      <div className="flex min-w-max">
        <span className="text-ansi-dim w-16 shrink-0">Wind</span>
        {hourly.map((h) => (
          <span key={h.time} className="w-10 text-center text-ansi-cyan shrink-0">
            {h.windspeedKmph}
          </span>
        ))}
      </div>
    </div>
  );
}
