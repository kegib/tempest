import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Loader2 } from 'lucide-react';
import { SearchBar } from '@/components/weather/SearchBar';
import { CurrentWeatherCard } from '@/components/weather/CurrentWeatherCard';
import { DailyForecastCard } from '@/components/weather/DailyForecastCard';
import { ForecastTextBox } from '@/components/weather/ForecastTextBox';
import { WeatherSkeleton } from '@/components/weather/WeatherSkeleton';
import { TemperatureToggle } from '@/components/weather/TemperatureToggle';
import { useWeather } from '@/hooks/useWeather';

const DEFAULT_LOCATION = 'London';

export default function Index() {
  const [location, setLocation] = useState<string>(DEFAULT_LOCATION);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [showText, setShowText] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useWeather(location);

  useSeoMeta({
    title: data
      ? `${data.location.city} – ${data.current.tempC}°C, ${data.current.description} | tmpst`
      : 'tmpst – Terminal Weather Forecasts',
    description:
      'Terminal-style weather forecasts powered by wttr.in. Search any city for current conditions and a 3-day outlook.',
    ogTitle: 'tmpst',
    ogDescription: 'Console-oriented weather forecasts inspired by wttr.in and wego.',
  });

  // Geolocation pre-fill (best-effort)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      },
      () => { /* ignore – fall back to default */ },
      { timeout: 5000 },
    );
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* ── Terminal window chrome ── */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-0">

        {/* Window title bar */}
        <div className="flex items-center gap-0 text-ansi-dim text-xs border-b border-[var(--ansi-dim)] pb-1 mb-0">
          <span className="text-ansi-green mr-2">●</span>
          <span className="flex-1 text-ansi-dim">tmpst v1.0.0  —  bash  —  80×24</span>
          <span className="text-ansi-dim">{dateStr}  {timeStr}</span>
        </div>

        {/* Main terminal box */}
        <div className="border border-[var(--ansi-dim)]">

          {/* Header / banner */}
          <div className="border-b border-[var(--ansi-dim)] px-3 py-3 space-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-ansi-green crt-glow text-lg font-bold leading-tight">
                  ⚡ TMPST
                </div>
                <div className="text-ansi-dim text-xs">
                  console-oriented weather forecast — powered by wttr.in
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <TemperatureToggle useFahrenheit={useFahrenheit} onChange={setUseFahrenheit} />
                {(isFetching && data) && (
                  <span className="text-ansi-dim text-xs flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> refreshing…
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="border-b border-[var(--ansi-dim)] px-3 py-3">
            <SearchBar
              onSearch={setLocation}
              loading={isLoading || isFetching}
              initialValue={location !== DEFAULT_LOCATION ? location : ''}
            />
          </div>

          {/* Main content area */}
          <div className="px-3 py-3 space-y-4 min-h-48">

            {/* Error state */}
            {isError && !isLoading && (
              <div className="font-mono text-sm space-y-1">
                <div className="flex text-ansi-red">
                  <span>┌─</span>
                  <span className="px-1">ERROR</span>
                  <span className="flex-1 border-t border-dashed border-[var(--ansi-red)]" style={{ minWidth: '8px' }} />
                  <span>┐</span>
                </div>
                <div className="border-l border-r border-[var(--ansi-red)] px-3 py-2 space-y-1">
                  <div className="text-ansi-red">✗ Failed to fetch weather data</div>
                  <div className="text-ansi-dim text-xs">
                    {error instanceof Error ? error.message : 'Unknown error. Check the location and try again.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-ansi-cyan hover:text-ansi-green text-xs mt-1 transition-colors"
                  >
                    [RETRY]
                  </button>
                </div>
                <div className="flex text-ansi-red">
                  <span>└</span>
                  <span className="flex-1 border-t border-dashed border-[var(--ansi-red)]" style={{ minWidth: '8px' }} />
                  <span>┘</span>
                </div>
              </div>
            )}

            {/* Loading */}
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

                {/* 3-day section header */}
                <div className="flex items-center gap-2 text-ansi-dim text-xs pt-1">
                  <span>──</span>
                  <span className="text-ansi-cyan">3-DAY FORECAST</span>
                  <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
                </div>

                {/* Daily rows */}
                <div className="space-y-3">
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

                {/* wttr-style text section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowText((v) => !v)}
                    className="text-ansi-dim hover:text-ansi-green text-xs flex items-center gap-1 transition-colors mb-1"
                  >
                    <span>{showText ? '▼' : '▶'}</span>
                    <span>curl-friendly plain-text output</span>
                  </button>
                  {showText && <ForecastTextBox data={data} />}
                </div>

              </div>
            )}

            {/* Empty / initial state */}
            {!data && !isLoading && !isError && (
              <div className="text-ansi-dim text-sm py-8 text-center space-y-1">
                <div className="text-2xl">⚡</div>
                <div className="cursor-blink">Enter a location to begin</div>
              </div>
            )}

          </div>

          {/* Status bar */}
          <div className="border-t border-[var(--ansi-dim)] px-3 py-1 flex items-center gap-4 text-xs text-ansi-dim">
            {data && (
              <>
                <span className="text-ansi-green">●</span>
                <span>
                  {data.location.city}
                  {data.location.country ? `, ${data.location.country}` : ''}
                </span>
                <span>│</span>
                <span>lat {data.location.lat.toFixed(3)}  lon {data.location.lon.toFixed(3)}</span>
                <span>│</span>
                <span>cache: {data ? 'HIT' : 'MISS'}</span>
              </>
            )}
            {!data && <span>no data loaded</span>}
            <span className="flex-1" />
            <a
              href="https://wttr.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ansi-dim hover:text-ansi-cyan transition-colors underline underline-offset-2"
            >
              wttr.in
            </a>
            <span>·</span>
            <a
              href="https://github.com/chubin/wego"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ansi-dim hover:text-ansi-cyan transition-colors underline underline-offset-2"
            >
              wego
            </a>
            <span>·</span>
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ansi-dim hover:text-ansi-cyan transition-colors underline underline-offset-2"
            >
              shakespeare
            </a>
          </div>

        </div>
        {/* end main terminal box */}

      </div>
    </div>
  );
}
