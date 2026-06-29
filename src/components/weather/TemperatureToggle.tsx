interface Props {
  useFahrenheit: boolean;
  onChange: (value: boolean) => void;
}

export function TemperatureToggle({ useFahrenheit, onChange }: Props) {
  return (
    <div className="font-mono text-sm inline-flex items-center gap-0 text-ansi-dim">
      <span>[</span>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-1 transition-colors ${!useFahrenheit ? 'text-ansi-green crt-glow font-bold' : 'hover:text-ansi-white'}`}
        aria-pressed={!useFahrenheit}
      >
        °C
      </button>
      <span>|</span>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-1 transition-colors ${useFahrenheit ? 'text-ansi-green crt-glow font-bold' : 'hover:text-ansi-white'}`}
        aria-pressed={useFahrenheit}
      >
        °F
      </button>
      <span>]</span>
    </div>
  );
}
