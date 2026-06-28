import { Droplets, Wind, Eye, Thermometer, Cloud, Gauge, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WeatherIcon } from './WeatherIcon';
import { windDescription, uvDescription } from '@/lib/weatherApi';
import type { CurrentWeather, LocationInfo } from '@/lib/weatherTypes';

interface Props {
  current: CurrentWeather;
  location: LocationInfo;
  useFahrenheit?: boolean;
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatBadge({ icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
      <span className="text-white/70 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-white/60 text-xs leading-tight">{label}</div>
        <div className="text-white text-sm font-medium leading-tight truncate">{value}</div>
      </div>
    </div>
  );
}

export function CurrentWeatherCard({ current, location, useFahrenheit = false }: Props) {
  const temp = useFahrenheit ? `${current.tempF}°F` : `${current.tempC}°C`;
  const feelsLike = useFahrenheit ? `${current.feelsLikeF}°F` : `${current.feelsLikeC}°C`;
  const locStr = [location.city, location.region, location.country].filter(Boolean).join(', ');

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-transparent">
      <CardContent className="p-0">
        {/* Main display */}
        <div className="p-6 md:p-8 text-white">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-0.5 truncate">
                {locStr}
              </h2>
              <p className="text-white/70 text-sm">{current.observationTime}</p>
            </div>
            <WeatherIcon code={current.weatherCode} size="xl" className="shrink-0" />
          </div>

          <div className="flex items-end gap-4 mb-2">
            <span className="text-7xl md:text-8xl font-thin leading-none tracking-tighter">
              {temp}
            </span>
          </div>
          <p className="text-xl text-white/90 mb-1">{current.description}</p>
          <p className="text-white/60 text-sm">Feels like {feelsLike}</p>
        </div>

        {/* Stats grid */}
        <div className="px-4 pb-4 md:px-6 md:pb-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatBadge
            icon={<Droplets size={16} />}
            label="Humidity"
            value={`${current.humidity}%`}
          />
          <StatBadge
            icon={<Wind size={16} />}
            label="Wind"
            value={`${current.windspeedKmph} km/h ${current.winddir} · ${windDescription(current.windspeedKmph)}`}
          />
          <StatBadge
            icon={<Eye size={16} />}
            label="Visibility"
            value={`${current.visibilityKm} km`}
          />
          <StatBadge
            icon={<Cloud size={16} />}
            label="Cloud Cover"
            value={`${current.cloudcover}%`}
          />
          <StatBadge
            icon={<Sun size={16} />}
            label="UV Index"
            value={`${current.uvIndex} · ${uvDescription(current.uvIndex)}`}
          />
          <StatBadge
            icon={<Thermometer size={16} />}
            label="Precipitation"
            value={`${current.precipMM} mm`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
