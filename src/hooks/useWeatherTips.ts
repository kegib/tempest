import { useQuery } from '@tanstack/react-query';
import { fetchWeatherTips } from '@/lib/weatherTips';
import type { WeatherTipsResult } from '@/lib/weatherTips';
import type { CurrentWeather, DailyForecast, LocationInfo } from '@/lib/weatherTypes';

interface UseWeatherTipsOptions {
  location: LocationInfo | null;
  current: CurrentWeather | null;
  forecast: DailyForecast[] | null;
  enabled?: boolean;
}

export function useWeatherTips({
  location,
  current,
  forecast,
  enabled = true,
}: UseWeatherTipsOptions) {
  return useQuery<WeatherTipsResult, Error>({
    // 'tips:' prefix prevents any collision with forecast/radar cache keys
    queryKey: ['tips', location?.lat, location?.lon],
    queryFn: () => {
      if (!location || !current || !forecast) throw new Error('No weather data');
      return fetchWeatherTips(location, current, forecast);
    },
    enabled: Boolean(location && current && forecast) && enabled,
    staleTime: 5 * 60 * 1000,   // 5-minute TTL – shorter than forecast (10 min)
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
}
