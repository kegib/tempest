import { useState } from 'react';
import { ChevronDown, Sunrise, Sunset, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <Card
      className="border-0 shadow-lg overflow-hidden bg-white/10 backdrop-blur-md text-white cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <CardContent className="p-0">
        {/* Summary row */}
        <div className="flex items-center gap-3 p-4">
          <div className="shrink-0 w-8 text-center text-white/50 text-sm font-medium">
            {index === 0 ? 'Now' : `+${index}d`}
          </div>
          <WeatherIcon code={day.weatherCode} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{formatDayShort(day.date)}</div>
            <div className="text-white/70 text-xs truncate">{day.description}</div>
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="font-bold text-sm">{maxTemp}</span>
            <span className="text-white/50 text-xs">/ {minTemp}</span>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-white/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Expanded detail */}
        {open && (
          <div
            className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Astronomy row */}
            <div className="flex gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Sunrise size={14} className="text-amber-300" />
                {day.sunrise}
              </span>
              <span className="flex items-center gap-1">
                <Sunset size={14} className="text-orange-300" />
                {day.sunset}
              </span>
              <span className="flex items-center gap-1">
                <Zap size={14} className="text-yellow-300" />
                UV {day.uvIndex}
              </span>
            </div>
            {/* Hourly strip */}
            <HourlyForecastRow hourly={day.hourly} useFahrenheit={useFahrenheit} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
