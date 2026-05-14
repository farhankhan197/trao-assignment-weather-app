'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { getTheme } from './skyTheme';
import Rain from '@/components/weather/Rain';
import Snow from '@/components/weather/Snow';

interface TimeSkyProps {
  condition?: string;
  hour: number | null;
}

function StormFlash() {
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const schedule = () => {
      const delay = Math.random() * 4000 + 500;
      timerRef.current = setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), Math.random() * 150 + 80);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-75"
      style={{
        opacity: flash ? 0.35 : 0,
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.9) 0%, transparent 70%)',
      }}
      aria-hidden="true"
    />
  );
}

const CLOUDS = [
  { width: 150, height: 40, top: 12, speed: 80, delay: -10 },
  { width: 100, height: 28, top: 28, speed: 110, delay: -44 },
  { width: 190, height: 50, top: 45, speed: 95, delay: -62 },
  { width: 120, height: 34, top: 65, speed: 65, delay: -28 },
];

export default function TimeSky({ condition, hour }: TimeSkyProps) {
  const resolvedHour = hour ?? 12;
  const theme = getTheme(resolvedHour);

  const stars = useMemo(() => {
    let seed = 42;
    function next() {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    }
    const result: { size: number; left: number; top: number; duration: number; delay: number }[] =
      [];
    for (let i = 0; i < 60; i++) {
      result.push({
        size: next() * 2.5 + 0.5,
        left: next() * 100,
        top: next() * 65,
        duration: 2 + next() * 4,
        delay: -next() * 5,
      });
    }
    return result;
  }, []);

  const orbLeft = 10 + (resolvedHour / 23) * 75;

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-opacity duration-300"
      style={{ background: theme.gradient, opacity: hour === null ? 0 : 1 }}
    >
      <style>{`
@keyframes tDrift{from{transform:translateX(-200px)}to{transform:translateX(calc(100vw + 200px))}}
@keyframes tTwinkle{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes tPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
`}</style>

      {/* Stars */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: theme.starOpacity }}
      >
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.left}%`,
              top: `${s.top}%`,
              animation: `tTwinkle ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Orb */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: theme.orbSize,
          height: theme.orbSize,
          left: `${orbLeft}%`,
          top: theme.orbTop + 22,
          background: theme.orbColor,
          boxShadow: theme.orbGlow,
          transform: 'translateX(-50%)',
          animation: theme.starOpacity > 0.5 ? 'none' : 'tPulse 4s ease-in-out infinite',
        }}
      />

      {/* Clouds */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-[50px]"
          style={{
            width: c.width,
            height: c.height,
            top: `${c.top}%`,
            background: 'rgba(255,255,255,0.14)',
            animation: `tDrift ${c.speed}s linear infinite`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {/* Weather effects */}
      {condition === 'rainy' && <Rain count={30} intensity="dramatic" />}
      {condition === 'snowy' && <Snow count={10} intensity="dramatic" />}
      {condition === 'stormy' && (
        <>
          <Rain count={40} intensity="dramatic" />
          <StormFlash />
        </>
      )}
      {condition === 'cloudy' && (
        <>
          {[1, 2, 3, 4].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-[50px] pointer-events-none"
              style={{
                width: [180, 130, 220, 100][i],
                height: [50, 36, 60, 30][i],
                top: [`8%`, `22%`, `40%`, `55%`][i],
                background: `rgba(255,255,255,${[0.3, 0.22, 0.35, 0.18][i]})`,
                animation: `tDrift ${[90, 120, 70, 140][i]}s linear infinite`,
                animationDelay: `${[-20, -50, -80, -110][i]}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Horizon */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 rounded-b-[20px] transition-all duration-1000"
        style={{
          background: theme.isNight
            ? 'linear-gradient(to top,rgba(2,11,24,0.7) 0%,transparent 100%)'
            : 'linear-gradient(to top,rgba(10,20,50,0.35) 0%,transparent 100%)',
        }}
      />
    </div>
  );
}
