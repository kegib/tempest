// Terminal-style loading indicator – no rounded skeletons, just blinking dots

export function WeatherSkeleton() {
  return (
    <div className="font-mono text-sm space-y-2 text-ansi-dim animate-pulse">
      <div className="flex items-center gap-0">
        <span>┌─</span>
        <span className="px-1 text-ansi-green">Fetching weather data</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
        <span>┐</span>
      </div>
      <div className="border-l border-r border-[var(--ansi-dim)] px-3 py-4 space-y-1">
        <div className="text-ansi-dim">Connecting to wttr.in…</div>
        <div className="text-ansi-dim opacity-80">Resolving location…</div>
        <div className="text-ansi-dim opacity-60">Parsing forecast data…</div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="text-ansi-green crt-glow"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0.3 + (i % 3) * 0.3 }}
            >
              ▓
            </span>
          ))}
        </div>
      </div>
      <div className="flex text-ansi-dim">
        <span>└</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
        <span>┘</span>
      </div>
    </div>
  );
}
