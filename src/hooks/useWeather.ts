import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weatherApi';
import type { WeatherData } from '@/lib/weatherTypes';

/**
 * Normalise a location string for use as a query-cache key.
 * Collapses whitespace, trims, lowercases.
 * Coordinates ("51.5074,-0.1278") are preserved as-is after normalisation.
 */
function normalizeLocation(location: string): string {
  return location.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function useWeather(location: string | null) {
  const normalized = location ? normalizeLocation(location) : null;

  return useQuery<WeatherData, Error>({
    // Normalised key prevents duplicate cache entries for equivalent inputs
    queryKey: ['weather', normalized],
    queryFn: () => {
      if (!location) throw new Error('No location');
      // Use trimmed original (not lowercased) for the actual fetch
      return fetchWeather(location.trim());
    },
    enabled: Boolean(normalized),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    retry: 2,
  });
}
