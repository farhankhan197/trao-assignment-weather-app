import { useId } from 'react';

interface SunEventIconProps {
  event: 'sunrise' | 'sunset';
  className?: string;
}

export default function SunEventIcon({ event, className = '' }: SunEventIconProps) {
  const isSunrise = event === 'sunrise';
  const gradientId = `sun-event-${useId().replace(/:/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={isSunrise ? 'Sunrise' : 'Sunset'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#fb923c" />
          <stop offset="100%" stopColor={isSunrise ? '#38bdf8' : '#8b5cf6'} />
        </linearGradient>
      </defs>
      <path
        d="M4 23.5h24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        opacity="0.45"
      />
      <path
        d="M9.5 23.5a6.5 6.5 0 0 1 13 0"
        fill={`url(#${gradientId})`}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d={isSunrise ? 'M16 14.5V5.5m0 0-3 3m3-3 3 3' : 'M16 5.5v9m0 0-3-3m3 3 3-3'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7.5 17.5 5.6 15.6M24.5 17.5l1.9-1.9M16 2.5v1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
        opacity="0.7"
      />
    </svg>
  );
}
