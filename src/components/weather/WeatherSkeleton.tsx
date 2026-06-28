import { Skeleton } from '@/components/ui/skeleton';

export function WeatherSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Current card skeleton */}
      <div className="rounded-2xl bg-white/10 p-6 md:p-8 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 bg-white/20 rounded-lg" />
            <Skeleton className="h-4 w-32 bg-white/10 rounded-lg" />
          </div>
          <Skeleton className="h-20 w-20 bg-white/20 rounded-2xl" />
        </div>
        <Skeleton className="h-24 w-40 bg-white/20 rounded-xl" />
        <Skeleton className="h-5 w-36 bg-white/15 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Forecast skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 bg-white/10 rounded-xl" />
      ))}
    </div>
  );
}
