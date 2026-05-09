'use client';

import { useEffect, useRef } from 'react';

interface RainProps {
  count?: number;
  intensity?: 'subtle' | 'dramatic';
}

export default function Rain({ count = 8, intensity = 'subtle' }: RainProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const finalCount = intensity === 'dramatic' ? count * 8 : count;

    for (let i = 0; i < finalCount; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop-mini';
      const h = intensity === 'dramatic' ? Math.random() * 40 + 20 : Math.random() * 15 + 8;
      const duration =
        intensity === 'dramatic'
          ? (Math.random() * 0.8 + 0.5).toFixed(2)
          : (Math.random() * 1.5 + 1).toFixed(2);
      const delay = (Math.random() * 3).toFixed(2);
      const opacity =
        intensity === 'dramatic'
          ? (Math.random() * 0.3 + 0.2).toFixed(2)
          : (Math.random() * 0.25 + 0.1).toFixed(2);

      drop.style.cssText = [
        `left: ${Math.random() * 100}%`,
        `height: ${h}px`,
        `animation-duration: ${duration}s`,
        `animation-delay: -${delay}s`,
        `opacity: ${opacity}`,
      ].join(';');
      container.appendChild(drop);
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
