import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Terminal size={14} />
          <span>wttr-style summary · share-ready</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={13} className="mr-1" /> Copied
            </>
          ) : (
            <>
              <Copy size={13} className="mr-1" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 text-white/90 text-sm font-mono whitespace-pre-wrap break-all leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
