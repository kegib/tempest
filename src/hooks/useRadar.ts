import { useQuery } from '@tanstack/react-query';
import { fetchRadar } from '@/lib/radarApi';
import type { AsciiRadar } from '@/lib/radarApi';

interface UseRadarOptions {
  lat: number | null;
  lon: number | null;
  locationName?: string;
  zoom?: number;
  cols?: number;
  lines?: number;
  enabled?: boolean;
}

export function useRadar({
  lat,
  lon,
  locationName = '',
  zoom = 6,
  cols = 60,
  lines = 22,
  enabled = true,
}: UseRadarOptions) {
  return useQuery<AsciiRadar, Error>({
    // Cache key uses 'radar:' prefix so it never collides with forecast keys
    queryKey: ['radar', lat, lon, zoom],
    queryFn: () => {
      if (lat === null || lon === null) throw new Error('No coordinates provided');
      return fetchRadar(lat, lon, locationName, zoom, cols, lines);
    },
    enabled: lat !== null && lon !== null && enabled,
    staleTime: 10 * 60 * 1000,  // 10 minutes – matches forecast cache
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}
