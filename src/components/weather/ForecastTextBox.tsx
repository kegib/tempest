import { useState } from 'react';
import { buildForecastText } from '@/lib/weatherApi';
import type { WeatherData } from '@/lib/weatherTypes';

interface Props {
  data: WeatherData;
}

export function ForecastTextBox({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const text = buildForecastText(data);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="font-mono text-sm">
      {/* Box top */}
      <div className="flex text-ansi-dim">
        <span>┌─</span>
        <span className="text-ansi-cyan px-1">plain text output</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
        <button
          type="button"
          onClick={handleCopy}
          className={`px-2 text-xs transition-colors ${copied ? 'text-ansi-green' : 'text-ansi-dim hover:text-ansi-cyan'}`}
        >
          {copied ? '[COPIED ✓]' : '[COPY]'}
        </button>
        <span>┐</span>
      </div>

      {/* Content */}
      <pre className="border-l border-r border-[var(--ansi-dim)] px-3 py-2 text-ansi-green whitespace-pre-wrap break-all leading-relaxed crt-glow overflow-x-auto">
        {text}
      </pre>

      {/* Box bottom */}
      <div className="flex text-ansi-dim">
        <span>└</span>
        <span className="flex-1 border-t border-dashed border-[var(--ansi-dim)]" style={{ minWidth: '8px' }} />
        <span>┘</span>
      </div>
    </div>
  );
}
