import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weatherApi';
import type { WeatherData } from '@/lib/weatherTypes';

export function useWeather(location: string | null) {
  return useQuery<WeatherData, Error>({
    queryKey: ['weather', location],
    queryFn: () => {
      if (!location) throw new Error('No location');
      return fetchWeather(location);
    },
    enabled: Boolean(location),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    retry: 2,
  });
}
