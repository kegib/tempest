import { useState } from 'react';
import { useWeatherTips } from '@/hooks/useWeatherTips';
import type { WeatherWarning, SafetyTip, Severity } from '@/lib/weatherTips';
import type { CurrentWeather, DailyForecast, LocationInfo } from '@/lib/weatherTypes';

interface Props {
  location: LocationInfo;
  current: CurrentWeather;
  forecast: DailyForecast[];
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function severityColour(s: Severity): string {
  switch (s) {
    case 'extreme':  return 'text-ansi-red';
    case 'severe':   return 'text-ansi-yellow';
    case 'moderate': return 'text-ansi-cyan';
    case 'minor':    return 'text-ansi-green';
  }
}

function severityBorderColour(s: Severity): string {
  switch (s) {
    case 'extreme':  return 'border-[var(--ansi-red)]';
    case 'severe':   return 'border-[var(--ansi-yellow)]';
    case 'moderate': return 'border-[var(--ansi-cyan)]';
    case 'minor':    return 'border-[var(--ansi-dim)]';
  }
}

function severityLabel(s: Severity): string {
  return s.toUpperCase();
}

function severityGlyph(s: Severity): string {
  switch (s) {
    case 'extreme':  return '█';
    case 'severe':   return '▓';
    case 'moderate': return '▒';
    case 'minor':    return '░';
  }
}

function sourceLabel(source: WeatherWarning['source']): string {
  switch (source) {
    case 'noaa':       return 'NOAA/NWS';
    case 'openmeteo':  return 'Open-Meteo';
    case 'derived':    return 'derived';
    case 'static':     return 'static';
  }
}

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TermBox({
  title,
  titleColour = 'text-ansi-cyan',
  borderColour = 'border-[var(--ansi-dim)]',
  children,
}: {
  title: string;
  titleColour?: string;
  borderColour?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`flex items-center text-ansi-dim text-xs`}>
        <span>┌─</span>
        <span className={`${titleColour} px-1`}>{title}</span>
        <span className={`flex-1 border-t border-dashed ${borderColour}`} style={{ minWidth: '8px' }} />
        <span>┐</span>
      </div>
      <div className={`border-l border-r ${borderColour}`}>
        {children}
      </div>
      <div className={`flex text-ansi-dim text-xs`}>
        <span>└</span>
        <span className={`flex-1 border-t border-dashed ${borderColour}`} style={{ minWidth: '8px' }} />
        <span>┘</span>
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: WeatherWarning }) {
  const [expanded, setExpanded] = useState(warning.severity === 'extreme' || warning.severity === 'severe');
  const col = severityColour(warning.severity);
  const border = severityBorderColour(warning.severity);
  const glyph = severityGlyph(warning.severity);

  return (
    <div className="text-xs">
      {/* Header line – always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`w-full text-left flex items-center gap-1 py-1 group`}
      >
        <span className={`${col} crt-glow shrink-0`}>{glyph}</span>
        <span className={`${col} font-bold shrink-0`}>[{severityLabel(warning.severity)}]</span>
        <span className="text-ansi-white flex-1 min-w-0 truncate">{warning.event}</span>
        <span className={`${col} shrink-0 text-[10px]`}>
          {sourceLabel(warning.source)}
        </span>
        <span className="text-ansi-dim shrink-0 ml-1">{expanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className={`ml-3 pl-2 border-l ${border} py-1 space-y-1`}>
          <div className="text-ansi-white leading-snug">{warning.headline}</div>
          {warning.description && (
            <div className="text-ansi-dim leading-snug">{warning.description}</div>
          )}
          {warning.instruction && (
            <div className={`${col} leading-snug`}>
              ▸ {warning.instruction}
            </div>
          )}
          <div className="text-ansi-dim text-[10px] flex flex-wrap gap-x-3 gap-y-0 pt-0.5">
            <span>from: {formatTimestamp(warning.start)}</span>
            <span>until: {formatTimestamp(warning.end)}</span>
            {warning.tags.length > 0 && (
              <span>tags: {warning.tags.join(' ')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TipCard({ tip }: { tip: SafetyTip }) {
  const col = severityColour(tip.severity);
  return (
    <div className="flex items-start gap-2 py-1 text-xs">
      <span className="shrink-0 text-base leading-none">{tip.icon}</span>
      <div className="min-w-0">
        <span className={`${col} font-semibold`}>{tip.title}</span>
        <span className="text-ansi-dim"> — </span>
        <span className="text-ansi-white">{tip.body}</span>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function WarningsPanel({ location, current, forecast }: Props) {
  const [open, setOpen] = useState(true);

  const { data, isLoading, isFetching, isError, error, refetch } = useWeatherTips({
    location,
    current,
    forecast,
    enabled: open,
  });

  const totalCount = (data?.warnings.length ?? 0) + (data?.tips.length ?? 0);
  const highestSeverity: Severity | null = data?.warnings[0]?.severity ?? null;

  // Auto-open the panel when there are official severe/extreme alerts
  const hasUrgent = data?.warnings.some(
    (w) => w.source !== 'derived' && (w.severity === 'severe' || w.severity === 'extreme'),
  );

  return (
    <div className="font-mono text-sm">
      {/* ── Collapsible header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-1 hover:text-ansi-white transition-colors mb-1"
      >
        <span className="text-ansi-dim">{open ? '▼' : '▶'}</span>
        <span className={highestSeverity ? severityColour(highestSeverity) : 'text-ansi-cyan'}>
          WARNINGS & TIPS
        </span>
        {data && totalCount > 0 && (
          <span className={`ml-1 text-xs ${highestSeverity ? severityColour(highestSeverity) : 'text-ansi-dim'}`}>
            [{totalCount}]
          </span>
        )}
        {data?.hasOfficialAlerts && (
          <span className="ml-1 text-xs text-ansi-red crt-glow">● official</span>
        )}
        <span className="text-ansi-dim ml-1 text-xs">safety · alerts</span>
        {(isLoading || isFetching) && (
          <span className="text-ansi-dim ml-2 text-xs">◌</span>
        )}
        {data && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); refetch(); }}
            disabled={isFetching}
            className="ml-auto text-ansi-dim hover:text-ansi-cyan transition-colors text-xs"
            aria-label="Refresh warnings"
          >
            {isFetching ? '◌' : '↻'}
          </button>
        )}
      </button>

      {open && (
        <div className="space-y-3">

          {/* Loading */}
          {isLoading && (
            <TermBox title="Checking alerts…" titleColour="text-ansi-dim">
              <div className="px-3 py-2 text-xs text-ansi-dim space-y-0.5">
                <div>Querying NOAA/NWS…</div>
                <div>Running safety rule engine…</div>
                <div className="flex gap-0.5 pt-1">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span key={i} className="text-ansi-yellow animate-pulse" style={{ animationDelay: `${i * 0.07}s` }}>▒</span>
                  ))}
                </div>
              </div>
            </TermBox>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <TermBox title="ALERT ERROR" titleColour="text-ansi-red" borderColour="border-[var(--ansi-red)]">
              <div className="px-3 py-2 space-y-1 text-xs">
                <div className="text-ansi-red">✗ {error?.message ?? 'Failed to fetch alerts'}</div>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-ansi-cyan hover:text-ansi-green transition-colors"
                >
                  [RETRY]
                </button>
              </div>
            </TermBox>
          )}

          {/* Results */}
          {data && !isLoading && (
            <>
              {/* Official + derived warnings */}
              {data.warnings.length > 0 && (
                <TermBox
                  title={`ACTIVE WARNINGS (${data.warnings.length})`}
                  titleColour={highestSeverity ? severityColour(highestSeverity) : 'text-ansi-yellow'}
                  borderColour={highestSeverity ? severityBorderColour(highestSeverity) : 'border-[var(--ansi-yellow)]'}
                >
                  <div className="px-3 py-1 divide-y divide-dashed divide-[var(--ansi-dim)]">
                    {data.warnings.map((w) => (
                      <WarningCard key={w.id} warning={w} />
                    ))}
                  </div>
                </TermBox>
              )}

              {/* Safety tips */}
              {data.tips.length > 0 && (
                <TermBox title={`SAFETY TIPS (${data.tips.length})`} titleColour="text-ansi-green">
                  <div className="px-3 py-1 divide-y divide-dashed divide-[var(--ansi-dim)]">
                    {data.tips.map((t, i) => (
                      <TipCard key={i} tip={t} />
                    ))}
                  </div>
                </TermBox>
              )}

              {/* All-clear */}
              {data.warnings.length === 0 && data.tips.length === 0 && (
                <div className="text-ansi-dim text-xs px-1 py-2 flex items-center gap-2">
                  <span className="text-ansi-green">✓</span>
                  <span>No warnings or significant safety concerns for this location.</span>
                </div>
              )}

              {/* Footer metadata */}
              <div className="text-[10px] text-ansi-dim flex flex-wrap gap-x-3 px-1">
                <span>checked: {new Date(data.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                {data.hasOfficialAlerts && (
                  <span className="text-ansi-green">● official alerts active</span>
                )}
                {!data.hasOfficialAlerts && (
                  <span>no official alerts · derived rules only</span>
                )}
                {hasUrgent && (
                  <span className="text-ansi-red crt-glow ml-auto">
                    ⚠ URGENT — see instructions above
                  </span>
                )}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
