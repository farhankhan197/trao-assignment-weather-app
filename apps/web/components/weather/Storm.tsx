'use client';

import { useEffect, useRef, useState } from 'react';

interface StormProps {
  intensity?: 'subtle' | 'dramatic' | 'card';
}

export default function Storm({ intensity = 'subtle' }: StormProps) {
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleFlash = () => {
      const delay =
        intensity === 'dramatic'
          ? Math.random() * 3000 + 2000 // 2-5s
          : Math.random() * 8000 + 7000; // 7-15s

      intervalRef.current = setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), intensity === 'dramatic' ? 200 : 100);
        scheduleFlash();
      }, delay);
    };

    scheduleFlash();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [intensity]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-100 ${
        flash ? 'opacity-30' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.8) 0%, transparent 70%)',
      }}
      aria-hidden="true"
    />
  );
}
