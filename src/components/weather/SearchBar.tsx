import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (location: string) => void;
  loading?: boolean;
  initialValue?: string;
}

const QUICK_LOCATIONS = [
  'London', 'New York', 'Tokyo', 'Paris', 'Sydney',
  'Dubai', 'Berlin', 'São Paulo', 'Cairo', 'Mumbai',
];

export function SearchBar({ onSearch, loading = false, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <div className="space-y-2">
      {/* Terminal-style prompt line */}
      <form onSubmit={handleSubmit} className="flex items-center gap-0">
        {/* Prompt symbol */}
        <span className="text-ansi-green font-bold shrink-0 pr-2 select-none text-base">
          $&gt;
        </span>
        <span className="text-ansi-dim shrink-0 pr-1 select-none text-base">wttr</span>
        <span className="text-ansi-dim shrink-0 pr-2 select-none text-base">/</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="city, zip, or lat,lon…"
          className="flex-1 bg-transparent border-none outline-none text-ansi-white font-mono text-base placeholder:text-ansi-dim caret-[var(--ansi-green)] min-w-0"
          disabled={loading}
          aria-label="Location search"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="shrink-0 ml-2 text-ansi-green hover:text-ansi-cyan disabled:text-ansi-dim transition-colors font-mono text-sm px-2 py-0.5 border border-current hover:border-ansi-cyan disabled:border-ansi-dim"
          aria-label="Search"
        >
          {loading ? '◌' : '[ENTER]'}
        </button>
      </form>

      {/* Quick-pick row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pl-8">
        <span className="text-ansi-dim text-xs">quick:</span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => { setValue(loc); onSearch(loc); }}
            className="text-xs text-ansi-cyan hover:text-ansi-green transition-colors cursor-pointer font-mono underline underline-offset-2"
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}
