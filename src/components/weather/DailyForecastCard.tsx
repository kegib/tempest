import { useState } from 'react';
import { WeatherIcon } from './WeatherIcon';
import { HourlyForecastRow } from './HourlyForecastRow';
import { formatDayShort } from '@/lib/weatherApi';
import type { DailyForecast } from '@/lib/weatherTypes';

interface Props {
  day: DailyForecast;
  index: number;
  useFahrenheit?: boolean;
  defaultOpen?: boolean;
}

function toF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

export function DailyForecastCard({ day, index, useFahrenheit = false, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const maxTemp = useFahrenheit ? `${toF(day.maxTempC)}°F` : `${day.maxTempC}°C`;
  const minTemp = useFahrenheit ? `${toF(day.minTempC)}°F` : `${day.minTempC}°C`;
  const avgTemp = useFahrenheit ? `${toF(day.avgTempC)}°F` : `${day.avgTempC}°C`;

  const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : formatDayShort(day.date);

  return (
    <div className="font-mono text-sm">
      {/* Separator / header line */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-0 text-ansi-dim hover:text-ansi-green transition-colors group"
      >
        <span className="mr-1">{open ? '▼' : '▶'}</span>
        <span className="text-ansi-green group-hover:crt-glow mr-2">{dayLabel}</span>
        <span className="text-ansi-dim mr-2">{day.date}</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" />
        <WeatherIcon code={day.weatherCode} size="sm" className="mx-2" />
        <span className="text-ansi-yellow mr-1">{maxTemp}</span>
        <span className="text-ansi-dim">/</span>
        <span className="text-ansi-dim ml-1">{minTemp}</span>
        <span className="text-ansi-dim ml-3 text-xs">avg {avgTemp}</span>
      </button>

      {open && (
        <div className="mt-1 ml-3 space-y-1 border-l border-[var(--ansi-dim)] pl-3">
          {/* Astronomy line */}
          <div className="flex flex-wrap gap-x-4 gap-y-0 text-xs text-ansi-dim">
            <span>
              <span className="text-ansi-yellow">☀</span> rise{' '}
              <span className="text-ansi-white">{day.sunrise}</span>
            </span>
            <span>
              <span className="text-ansi-yellow">☽</span> set{' '}
              <span className="text-ansi-white">{day.sunset}</span>
            </span>
            <span>
              UV <span className="text-ansi-yellow">{day.uvIndex}</span>
            </span>
            <span>
              <span className="text-ansi-white">{day.description}</span>
            </span>
          </div>

          {/* Hourly grid */}
          <div className="mt-2 overflow-x-auto">
            <HourlyForecastRow hourly={day.hourly} useFahrenheit={useFahrenheit} />
          </div>
        </div>
      )}
    </div>
  );
}
