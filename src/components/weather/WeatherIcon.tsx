import { weatherEmoji } from '@/lib/weatherApi';

interface WeatherIconProps {
  code: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClass = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
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
