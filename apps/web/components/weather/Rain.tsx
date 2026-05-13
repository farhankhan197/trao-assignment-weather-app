'use client';

import { useEffect, useRef } from 'react';

interface RainProps {
  count?: number;
  intensity?: 'subtle' | 'dramatic' | 'card';
}

export default function Rain({ count = 8, intensity = 'subtle' }: RainProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!bg) return;

    if (intensity === 'card') {
      createDrops(bg, 18, {
        hMin: 10,
        hMax: 30,
        durMin: 0.8,
        durMax: 1.8,
        opMin: 0.15,
        opMax: 0.35,
        cls: 'rain-drop-mini',
      });
      if (fg) {
        createDrops(fg, 10, {
          hMin: 20,
          hMax: 45,
          durMin: 0.4,
          durMax: 0.9,
          opMin: 0.3,
          opMax: 0.55,
          cls: 'rain-drop-fg',
        });
      }
    } else {
      const finalCount = intensity === 'dramatic' ? count * 8 : count;
      createDrops(bg, finalCount, {
        hMin: intensity === 'dramatic' ? 20 : 8,
        hMax: intensity === 'dramatic' ? 60 : 23,
        durMin: intensity === 'dramatic' ? 0.5 : 1.0,
        durMax: intensity === 'dramatic' ? 1.3 : 2.5,
        opMin: intensity === 'dramatic' ? 0.2 : 0.1,
        opMax: intensity === 'dramatic' ? 0.5 : 0.35,
        cls: 'rain-drop-mini',
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

function createDrops(
  container: HTMLDivElement,
  count: number,
  opts: {
    hMin: number;
    hMax: number;
    durMin: number;
    durMax: number;
    opMin: number;
    opMax: number;
    cls: string;
  }
) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = opts.cls;
    const h = Math.random() * (opts.hMax - opts.hMin) + opts.hMin;
    const duration = (Math.random() * (opts.durMax - opts.durMin) + opts.durMin).toFixed(2);
    const delay = (Math.random() * 3).toFixed(2);
    const opacity = (Math.random() * (opts.opMax - opts.opMin) + opts.opMin).toFixed(2);
    drop.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `height: ${h}px`,
      `animation-duration: ${duration}s`,
      `animation-delay: -${delay}s`,
      `opacity: ${opacity}`,
    ].join(';');
    container.appendChild(drop);
  }
}
