'use client';

import { useEffect, useRef } from 'react';

export default function Rain() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const count = window.innerWidth < 640 ? 20 : 70;

    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      const h = Math.random() * 60 + 15;
      drop.style.cssText = [
        `left: ${Math.random() * 100}%`,
        `height: ${h}px`,
        `animation-duration: ${(Math.random() * 1.2 + 0.7).toFixed(2)}s`,
        `animation-delay: -${(Math.random() * 3).toFixed(2)}s`,
        `opacity: ${(Math.random() * 0.35 + 0.15).toFixed(2)}`,
      ].join(';');
      container.appendChild(drop);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
