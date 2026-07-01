import { useQuery } from '@tanstack/react-query';
import { fetchRadar } from '@/lib/radarApi';
import type { AsciiRadar } from '@/lib/radarApi';

interface UseRadarOptions {
  location: string | null;
  zoom?: number;
  cols?: number;
  lines?: number;
  enabled?: boolean;
}

export function useRadar({ location, zoom = 6, cols = 60, lines = 22, enabled = true }: UseRadarOptions) {
  return useQuery<AsciiRadar, Error>({
    // Cache key includes 'radar:' prefix so it never collides with forecast keys
    queryKey: ['radar', location, zoom],
    queryFn: () => {
      if (!location) throw new Error('No location provided');
      return fetchRadar(location, zoom, cols, lines);
    },
    enabled: Boolean(location) && enabled,
    staleTime: 10 * 60 * 1000,  // 10 minutes – matches forecast cache
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}
