'use client';

import { useEffect, useRef } from 'react';

interface SnowProps {
  count?: number;
  intensity?: 'subtle' | 'dramatic';
}

export default function Snow({ count = 20, intensity = 'subtle' }: SnowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const finalCount = intensity === 'dramatic' ? count * 3 : count;

    for (let i = 0; i < finalCount; i++) {
      const flake = document.createElement('div');
      flake.className = 'snow-flake';
      const size = intensity === 'dramatic' ? Math.random() * 4 + 2 : Math.random() * 2 + 1;
      const duration = Math.random() * 4 + 3;
      const delay = Math.random() * 5;
      const left = Math.random() * 100;

      flake.style.cssText = [
        `left: ${left}%`,
        `width: ${size}px`,
        `height: ${size}px`,
        `animation-duration: ${duration.toFixed(2)}s`,
        `animation-delay: -${delay.toFixed(2)}s`,
        `opacity: ${(Math.random() * 0.5 + 0.3).toFixed(2)}`,
      ].join(';');
      container.appendChild(flake);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [count, intensity]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}
