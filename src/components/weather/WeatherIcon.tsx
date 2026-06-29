import { weatherEmoji } from '@/lib/weatherApi';

interface WeatherIconProps {
  code: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClass = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export function WeatherIcon({ code, size = 'md', className = '' }: WeatherIconProps) {
  return (
    <span
      role="img"
      aria-label="weather icon"
      className={`${sizeClass[size]} leading-none select-none ${className}`}
    >
      {weatherEmoji(code)}
    </span>
  );
}
