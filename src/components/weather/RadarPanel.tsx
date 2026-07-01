import { useState } from 'react';
import { useRadar } from '@/hooks/useRadar';
import { charColourClass } from '@/lib/radarApi';

interface Props {
  /** Latitude – already resolved from the weather data */
  lat: number | null;
  /** Longitude – already resolved from the weather data */
  lon: number | null;
  /** Display name shown in the box header */
  locationName?: string;
  /** Slippy zoom level (1–10, default 6) */
  zoom?: number;
}

const ZOOM_OPTIONS = [3, 4, 5, 6, 7, 8] as const;

// Legend entries
const LEGEND: { char: string; label: string }[] = [
  { char: '·', label: 'drizzle' },
  { char: '░', label: 'light' },
  { char: '▒', label: 'moderate' },
  { char: '▓', label: 'heavy' },
  { char: '█', label: 'extreme' },
];

export function RadarPanel({ lat, lon, locationName = '', zoom: initialZoom = 6 }: Props) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(initialZoom);

  const { data, isLoading, isFetching, isError, error, refetch } = useRadar({
    lat,
    lon,
    locationName,
    zoom,
    cols: 60,
    lines: 22,
    enabled: open,
  });

  const ts = data
    ? new Date(data.timestamp * 1000).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null;

  return (
    <div className="font-mono text-sm">
      {/* ── Collapsible header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-1 text-ansi-dim hover:text-ansi-cyan transition-colors mb-1"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span className="text-ansi-cyan">RADAR</span>
        <span className="text-ansi-dim ml-1 text-xs">precipitation map · RainViewer</span>
        {(isLoading || isFetching) && (
          <span className="text-ansi-dim ml-2 text-xs">◌</span>
        )}
      </button>

      {open && (
        <div className="space-y-2">

          {/* Controls row */}
          <div className="flex items-center gap-3 text-xs text-ansi-dim pl-2">
            {/* Zoom selector */}
            <span>zoom:</span>
            <div className="flex gap-0">
              <span className="text-ansi-dim">[</span>
              {ZOOM_OPTIONS.map((z, i) => (
                <span key={z} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-1 transition-colors ${
                      zoom === z
                        ? 'text-ansi-green crt-glow font-bold'
                        : 'text-ansi-dim hover:text-ansi-white'
                    }`}
                  >
                    {z}
                  </button>
                  {i < ZOOM_OPTIONS.length - 1 && <span className="text-ansi-dim">|</span>}
                </span>
              ))}
              <span className="text-ansi-dim">]</span>
            </div>

            {/* Refresh */}
            {data && (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-ansi-dim hover:text-ansi-cyan transition-colors"
                aria-label="Refresh radar"
              >
                {isFetching ? '◌' : '↻'} [refresh]
              </button>
            )}

            {/* Timestamp */}
            {ts && (
              <span className="text-ansi-dim ml-auto">
                frame: <span className="text-ansi-white">{ts}</span>
              </span>
            )}
          </div>

          {/* ── Loading state ── */}
          {isLoading && (
            <div className="space-y-0">
              <div className="flex text-ansi-dim">
                <span>┌─</span>
                <span className="px-1 text-ansi-cyan">Fetching radar tile</span>
                <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
                <span>┐</span>
              </div>
              <div className="border-l border-r border-[var(--ansi-dim)] px-3 py-3 text-ansi-dim text-xs space-y-0.5">
                <div>Fetching RainViewer API…</div>
                <div>Downloading radar tile…</div>
                <div>Converting PNG → ASCII…</div>
                <div className="flex gap-0.5 pt-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="text-ansi-green animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>▓</span>
                  ))}
                </div>
              </div>
              <div className="flex text-ansi-dim">
                <span>└</span>
                <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
                <span>┘</span>
              </div>
            </div>
          )}

          {/* ── Error state ── */}
          {isError && !isLoading && (
            <div className="space-y-0">
              <div className="flex text-ansi-red">
                <span>┌─</span>
                <span className="px-1">RADAR ERROR</span>
                <span className="flex-1 border-t border-dashed border-[var(--ansi-red)]" style={{ minWidth: '8px' }} />
                <span>┐</span>
              </div>
              <div className="border-l border-r border-[var(--ansi-red)] px-3 py-2 space-y-1">
                <div className="text-ansi-red text-xs">✗ {error?.message ?? 'Radar unavailable'}</div>
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

          {/* ── ASCII radar art ── */}
          {data && !isLoading && (
            <div className="space-y-0">
              {/* Box top */}
              <div className="flex items-center text-ansi-dim">
                <span>┌─</span>
                <span className="text-ansi-cyan px-1">
                  {data.locationName}
                </span>
                <span className="text-ansi-dim px-1 text-xs">
                  tile {data.tileX},{data.tileY} z{data.zoom}
                </span>
                <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '4px' }} />
                <span>┐</span>
              </div>

              {/* Art rows */}
              <div
                className="border-l border-r border-[var(--ansi-dim)] px-1 py-0 leading-[1.2] overflow-x-auto"
                aria-label="ASCII precipitation radar"
              >
                {data.rows.map((row, ri) => (
                  <div key={ri} className="flex whitespace-pre">
                    {row.map((ch, ci) => (
                      <span
                        key={ci}
                        className={`${charColourClass(ch)} ${ch !== ' ' ? 'crt-glow' : ''}`}
                        style={{ fontSize: '12px', lineHeight: '1.2' }}
                      >
                        {ch === ' ' ? '\u00a0' : ch}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Box bottom */}
              <div className="flex text-ansi-dim">
                <span>└</span>
                <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
                <span>┘</span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-0 text-xs text-ansi-dim pt-1 pl-1">
                <span>legend:</span>
                {LEGEND.map(({ char, label }) => (
                  <span key={char} className="flex items-center gap-1">
                    <span className={`${charColourClass(char)} crt-glow`}>{char}</span>
                    <span className="text-ansi-dim">{label}</span>
                  </span>
                ))}
                <span className="ml-auto text-ansi-dim">
                  source: <a
                    href="https://www.rainviewer.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-ansi-cyan transition-colors"
                  >rainviewer.com</a>
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
