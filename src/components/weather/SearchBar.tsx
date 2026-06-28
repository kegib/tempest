import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  onSearch: (location: string) => void;
  loading?: boolean;
  initialValue?: string;
}

const QUICK_LOCATIONS = [
  'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Berlin', 'São Paulo',
];

export function SearchBar({ onSearch, loading = false, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (trimmed) onSearch(trimmed);
    }
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter city, zip code, or coordinates…"
            className="pl-9 bg-white/15 border-white/25 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/50 focus-visible:ring-white/30 h-11 text-base"
            disabled={loading}
            aria-label="Location search"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !value.trim()}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/25 h-11 px-4 backdrop-blur-sm transition-all"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
          <span className="ml-2 hidden sm:inline">Search</span>
        </Button>
      </form>

      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => {
              setValue(loc);
              onSearch(loc);
            }}
            className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15 hover:border-white/30 transition-all cursor-pointer"
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}
