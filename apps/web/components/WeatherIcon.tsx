'use client';

const CONDITION_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️',
};

interface Props {
  condition: string;
  className?: string;
}

export function WeatherIcon({ condition, className = 'text-2xl' }: Props) {
  return (
    <span className={className} role="img" aria-label={condition}>
      {CONDITION_ICONS[condition] || '🌡️'}
    </span>
  );
}
