interface Props {
  useFahrenheit: boolean;
  onChange: (value: boolean) => void;
}

export function TemperatureToggle({ useFahrenheit, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full bg-white/10 border border-white/20 p-0.5 text-sm select-none">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1 rounded-full transition-all ${
          !useFahrenheit
            ? 'bg-white text-slate-800 font-semibold shadow-sm'
            : 'text-white/70 hover:text-white'
        }`}
        aria-pressed={!useFahrenheit}
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1 rounded-full transition-all ${
          useFahrenheit
            ? 'bg-white text-slate-800 font-semibold shadow-sm'
            : 'text-white/70 hover:text-white'
        }`}
        aria-pressed={useFahrenheit}
      >
        °F
      </button>
    </div>
  );
}
