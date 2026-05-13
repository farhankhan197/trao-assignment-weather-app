'use client';

import { useEffect, useRef } from 'react';

interface SnowProps {
  count?: number;
  intensity?: 'subtle' | 'dramatic' | 'card';
}

export default function Snow({ count = 20, intensity = 'subtle' }: SnowProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!bg) return;

    if (intensity === 'card') {
      createFlakes(bg, 18, {
        sizeMin: 1,
        sizeMax: 3,
        durMin: 4,
        durMax: 8,
        opMin: 0.2,
        opMax: 0.5,
        cls: 'snow-flake',
      });
      if (fg) {
        createFlakes(fg, 8, {
          sizeMin: 3,
          sizeMax: 6,
          durMin: 3,
          durMax: 6,
          opMin: 0.5,
          opMax: 0.8,
          cls: 'snow-flake',
          heavy: true,
        });
      }
    } else {
      const finalCount = intensity === 'dramatic' ? count * 3 : count;
      createFlakes(bg, finalCount, {
        sizeMin: intensity === 'dramatic' ? 2 : 1,
        sizeMax: intensity === 'dramatic' ? 6 : 3,
        durMin: 3,
        durMax: 7,
        opMin: 0.3,
        opMax: 0.8,
        cls: 'snow-flake',
      });
    }

    return () => {
      bg.innerHTML = '';
      if (fg) fg.innerHTML = '';
    };
  }, [count, intensity]);

  return (
    <>
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      />
      {intensity === 'card' && (
        <div
          ref={fgRef}
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          aria-hidden="true"
        />
      )}
    </>
  );
}

function createFlakes(
  container: HTMLDivElement,
  count: number,
  opts: {
    sizeMin: number;
    sizeMax: number;
    durMin: number;
    durMax: number;
    opMin: number;
    opMax: number;
    cls: string;
    heavy?: boolean;
  }
) {
  for (let i = 0; i < count; i++) {
    const flake = document.createElement('div');
    flake.className = opts.cls;
    const size = Math.random() * (opts.sizeMax - opts.sizeMin) + opts.sizeMin;
    const duration = Math.random() * (opts.durMax - opts.durMin) + opts.durMin;
    const delay = Math.random() * 5;
    const left = Math.random() * 100;

    flake.style.cssText = [
      `left: ${left}%`,
      `width: ${size}px`,
      `height: ${size}px`,
      `animation-duration: ${duration.toFixed(2)}s`,
      `animation-delay: -${delay.toFixed(2)}s`,
      `opacity: ${(Math.random() * (opts.opMax - opts.opMin) + opts.opMin).toFixed(2)}`,
      opts.heavy ? `animation-name: snowFallHeavy` : '',
    ]
      .filter(Boolean)
      .join(';');
    container.appendChild(flake);
  }
}
