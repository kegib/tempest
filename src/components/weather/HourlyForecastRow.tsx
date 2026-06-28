import { WeatherIcon } from './WeatherIcon';
import { formatHour } from '@/lib/weatherApi';
import type { HourlyForecast } from '@/lib/weatherTypes';

interface Props {
  hourly: HourlyForecast[];
  useFahrenheit?: boolean;
}

interface HourCellProps {
  hour: HourlyForecast;
  useFahrenheit: boolean;
}

function HourCell({ hour, useFahrenheit }: HourCellProps) {
  const temp = useFahrenheit
    ? `${Math.round((hour.tempC * 9) / 5 + 32)}°F`
    : `${hour.tempC}°C`;

  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px] px-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-default">
      <span className="text-white/70 text-xs font-medium">{formatHour(hour.time)}</span>
      <WeatherIcon code={hour.weatherCode} size="sm" />
      <span className="text-white font-semibold text-sm">{temp}</span>
      {hour.chanceOfRain > 20 && (
        <span className="text-sky-200 text-xs">💧 {hour.chanceOfRain}%</span>
      )}
    </div>
  );
}

export function HourlyForecastRow({ hourly, useFahrenheit = false }: Props) {
  // Filter to reasonable hours (every 3 hours)
  const filtered = hourly.filter((_, i) => i % 1 === 0);

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {filtered.map((h) => (
          <HourCell key={h.time} hour={h} useFahrenheit={useFahrenheit} />
        ))}
      </div>
    </div>
  );
}
