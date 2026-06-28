import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { AlertCircle, RefreshCw, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/weather/SearchBar';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyForecastCard } from '@/components/weather/DailyForecastCard';
import { ForecastTextBox } from '@/components/weather/ForecastTextBox';
import { WeatherSkeleton } from '@/components/weather/WeatherSkeleton';
import { TemperatureToggle } from '@/components/weather/TemperatureToggle';
import { useWeather } from '@/hooks/useWeather';
import { weatherGradient } from '@/lib/weatherApi';

const DEFAULT_LOCATION = 'London';

export default function Index() {
  const [location, setLocation] = useState<string>(DEFAULT_LOCATION);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [showText, setShowText] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useWeather(location);

  // Update page title when data changes
  useSeoMeta({
    title: data
      ? `${data.location.city} – ${data.current.tempC}°C, ${data.current.description} | WeatherWave`
      : 'WeatherWave – Beautiful Weather Forecasts',
    description:
      'Real-time weather forecasts powered by wttr.in. Search any city for current conditions and a 3-day outlook.',
    ogTitle: 'WeatherWave',
    ogDescription: 'Beautiful weather forecasts for any location on Earth.',
  });

  // Use geolocation to pre-fill on first load (best-effort)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      },
      () => {
        // ignore – fall back to default
      },
      { timeout: 5000 },
    );
  }, []);

  const gradient = data
    ? weatherGradient(data.current.weatherCode)
    : 'from-sky-500 via-blue-400 to-indigo-500';

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${gradient} transition-all duration-700`}
    >
      {/* Subtle animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-32 w-72 h-72 rounded-full bg-white/5 blur-2xl animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl animate-pulse [animation-delay:4s]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <CloudSun size={28} className="shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight">WeatherWave</h1>
              <p className="text-white/60 text-xs hidden sm:block">
                Powered by wttr.in · wego-style
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TemperatureToggle useFahrenheit={useFahrenheit} onChange={setUseFahrenheit} />
            {data && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                aria-label="Refresh forecast"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </Button>
            )}
          </div>
        </header>

        {/* Search */}
        <SearchBar
          onSearch={setLocation}
          loading={isLoading || isFetching}
          initialValue={location !== DEFAULT_LOCATION ? location : ''}
        />

        {/* Error state */}
        {isError && !isLoading && (
          <div className="bg-red-500/20 border border-red-400/30 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3 text-white">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-300" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Couldn't load weather data</p>
              <p className="text-white/70 text-xs">
                {error instanceof Error ? error.message : 'Unknown error. Try a different location.'}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                className="text-white/70 hover:text-white mt-1 h-7 px-2"
              >
                <RefreshCw size={12} className="mr-1" /> Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {(isLoading || (isFetching && !data)) && <WeatherSkeleton />}

        {/* Weather data */}
        {data && !isLoading && (
          <div className="space-y-4">
            {/* Current conditions */}
            <CurrentWeatherCard
              current={data.current}
              location={data.location}
              useFahrenheit={useFahrenheit}
            />

            {/* Section label */}
            <h2 className="text-white/80 text-sm font-semibold uppercase tracking-widest px-1">
              3-Day Forecast
            </h2>

            {/* Daily cards */}
            <div className="space-y-2">
              {data.forecast.map((day, i) => (
                <DailyForecastCard
                  key={day.date}
                  day={day}
                  index={i}
                  useFahrenheit={useFahrenheit}
                  defaultOpen={i === 0}
                />
              ))}
            </div>

            {/* wttr-style text summary */}
            <div>
              <button
                type="button"
                onClick={() => setShowText((v) => !v)}
                className="text-white/60 hover:text-white text-xs flex items-center gap-1 mb-2 transition-colors"
              >
                <span>{showText ? '▼' : '▶'}</span> wego / wttr-style text output
              </button>
              {showText && <ForecastTextBox data={data} />}
            </div>
          </div>
        )}

        {/* Empty/initial state */}
        {!data && !isLoading && !isError && (
          <div className="text-center py-16 text-white/60">
            <CloudSun size={48} className="mx-auto mb-4 text-white/30" />
            <p className="text-lg">Search for a city to see the forecast</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-white/40 text-xs pt-4 border-t border-white/10 space-y-1">
          <p>
            Data from{' '}
            <a
              href="https://wttr.in"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70 transition-colors"
            >
              wttr.in
            </a>{' '}
            · inspired by{' '}
            <a
              href="https://github.com/chubin/wego"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70 transition-colors"
            >
              wego
            </a>
          </p>
          <p>
            Vibed with{' '}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70 transition-colors"
            >
              Shakespeare
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
