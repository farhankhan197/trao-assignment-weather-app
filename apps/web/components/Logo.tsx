interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 32, className = '', variant = 'dark' }: LogoProps) {
  const sunColor = variant === 'dark' ? '#f59e0b' : '#f59e0b';
  const cloudColor = variant === 'dark' ? '#ffffff' : '#e2e8f0';
  const cloudStroke = variant === 'dark' ? '#ffffff' : '#cbd5e1';
  const cloudShadow = variant === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)';
  const textColor = variant === 'light' ? '#ffffff' : '#0f172a';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`cloud-shadow-${variant}`} x="-2" y="-2" width="44" height="44">
            <feDropShadow
              dx="0"
              dy="1.5"
              stdDeviation="2"
              floodColor={cloudShadow}
              floodOpacity="0.4"
            />
          </filter>
        </defs>

        {/* Sun - positioned behind and peeking out */}
        <circle cx="20" cy="16" r="9" fill={sunColor} opacity="0.9" />

        {/* Sun rays */}
        <g opacity="0.7">
          <line
            x1="20"
            y1="3"
            x2="20"
            y2="6"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="26"
            x2="20"
            y2="29"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="7"
            y1="16"
            x2="10"
            y2="16"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="16"
            x2="33"
            y2="16"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="10.8"
            y1="6.8"
            x2="12.9"
            y2="8.9"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="27.1"
            y1="23.1"
            x2="29.2"
            y2="25.2"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="10.8"
            y1="25.2"
            x2="12.9"
            y2="23.1"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="27.1"
            y1="8.9"
            x2="29.2"
            y2="6.8"
            stroke={sunColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Cloud - overlapping the sun */}
        <g filter={`url(#cloud-shadow-${variant})`}>
          <path
            d="M28 22C30.2091 22 32 23.7909 32 26C32 28.2091 30.2091 30 28 30H12C9.79086 30 8 28.2091 8 26C8 23.7909 9.79086 22 12 22C12.0323 19.7534 13.8425 18 16 18C16.7678 18 17.4882 18.2256 18.1068 18.618C18.9342 16.0385 21.3353 14.2 24.2 14.2C27.7585 14.2 30.6522 16.8752 30.9689 20.3573C31.3111 20.1272 31.7167 20 32.1538 20C33.1697 20 34 20.7909 34 21.7647C34 22.7376 33.1697 23.5 32.1538 23.5"
            fill={cloudColor}
            stroke={cloudStroke}
            strokeWidth="0.5"
          />
        </g>
      </svg>

      <span className="font-display text-xl tracking-tight" style={{ color: textColor }}>
        Mausam
      </span>
    </div>
  );
}
