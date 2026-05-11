'use client';

import { useEffect, useRef } from 'react';

type LoaderVariant = 'default' | 'inline' | 'fullscreen' | 'skeleton';

interface MausamLoaderProps {
  variant?: LoaderVariant;
  hint?: string;
}

export default function MausamLoader({
  variant = 'default',
  hint = 'Checking your sky...',
}: MausamLoaderProps) {
  if (variant === 'skeleton') return <SkeletonLoader />;
  if (variant === 'inline') return <InlineLoader hint={hint} />;
  if (variant === 'fullscreen') return <FullscreenLoader />;
  return <DefaultLoader hint={hint} />;
}

/* ─── Shared primitives ────────────────────────────────────────── */

function Dots({ light = false }: { light?: boolean }) {
  const base = light ? 'bg-white/60' : 'bg-slate-400';
  return (
    <div className="flex gap-1.5">
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className={`w-1.5 h-1.5 rounded-full ${base} animate-pulse`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="w-44 h-0.5 rounded-full overflow-hidden bg-slate-200">
      <div
        className="h-full bg-[#2563eb] rounded-full"
        style={{ animation: 'mausamProg 2.4s ease-in-out infinite' }}
      />
    </div>
  );
}

function RainCanvas({ count = 40 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.style.cssText = [
        'position:absolute',
        `left:${Math.random() * 100}%`,
        `height:${Math.random() * 40 + 12}px`,
        'width:1.5px',
        'border-radius:3px',
        'background:linear-gradient(180deg,transparent,rgba(147,197,253,0.65))',
        `animation:mausamRain ${(Math.random() * 0.8 + 0.5).toFixed(2)}s linear infinite`,
        `animation-delay:-${(Math.random() * 2).toFixed(2)}s`,
        `opacity:${(Math.random() * 0.3 + 0.15).toFixed(2)}`,
      ].join(';');
      el.appendChild(d);
    }
    return () => {
      el.innerHTML = '';
    };
  }, [count]);
  return <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none" />;
}

function MiniSky({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg,#0a1628 0%,#1a3a5c 40%,#2563eb 100%)',
      }}
    >
      {/* sun */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: 10,
          right: 10,
          width: 18,
          height: 18,
          background: 'radial-gradient(circle,#fef3c7 30%,#fcd34d 60%,#f59e0b 100%)',
          animation: 'mausamSun 3s ease-in-out infinite',
        }}
      />
      {/* cloud */}
      <div className="absolute" style={{ bottom: 16, animation: 'mausamCloud 5s linear infinite' }}>
        <CloudShape
          baseW={54}
          baseH={18}
          color="rgba(255,255,255,0.88)"
          bumps={[
            { w: 28, h: 24, top: -13, left: 7 },
            { w: 20, h: 18, top: -9, left: 30 },
          ]}
        />
      </div>
      <RainCanvas count={12} />
    </div>
  );
}

function CloudShape({
  baseW,
  baseH,
  color,
  bumps,
}: {
  baseW: number;
  baseH: number;
  color: string;
  bumps: { w: number; h: number; top: number; left: number }[];
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: baseW,
        height: baseH,
        background: color,
        borderRadius: 30,
      }}
    >
      {bumps.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: b.w,
            height: b.h,
            top: b.top,
            left: b.left,
            background: color,
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Variant: Default ─────────────────────────────────────────── */

function DefaultLoader({ hint }: { hint: string }) {
  const rainRef = useRef<HTMLDivElement>(null);
  const c1Ref = useRef<HTMLDivElement>(null);
  const c2Ref = useRef<HTMLDivElement>(null);
  const c3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rainRef.current) {
      for (let i = 0; i < 45; i++) {
        const d = document.createElement('div');
        const h = Math.random() * 40 + 12;
        d.style.cssText = [
          'position:absolute',
          `left:${Math.random() * 100}%`,
          `height:${h}px`,
          'width:1.5px',
          'border-radius:3px',
          'background:linear-gradient(180deg,transparent,rgba(147,197,253,0.65))',
          `animation:mausamRain ${(Math.random() * 0.8 + 0.5).toFixed(2)}s linear infinite`,
          `animation-delay:-${(Math.random() * 2).toFixed(2)}s`,
          `opacity:${(Math.random() * 0.3 + 0.15).toFixed(2)}`,
        ].join(';');
        rainRef.current.appendChild(d);
      }
    }
    [
      {
        ref: c1Ref,
        w: 90,
        h: 30,
        color: 'rgba(255,255,255,0.9)',
        bumps: [
          { w: 44, h: 40, top: -22, left: 10 },
          { w: 36, h: 32, top: -16, left: 46 },
        ],
      },
      {
        ref: c2Ref,
        w: 70,
        h: 22,
        color: 'rgba(200,220,255,0.7)',
        bumps: [
          { w: 34, h: 30, top: -16, left: 8 },
          { w: 26, h: 24, top: -12, left: 36 },
        ],
      },
      {
        ref: c3Ref,
        w: 55,
        h: 18,
        color: 'rgba(255,255,255,0.75)',
        bumps: [
          { w: 28, h: 24, top: -12, left: 6 },
          { w: 20, h: 18, top: -8, left: 30 },
        ],
      },
    ].forEach(({ ref, w, h, color, bumps }) => {
      if (!ref.current) return;
      const el = document.createElement('div');
      el.style.cssText = `position:relative;width:${w}px;height:${h}px`;
      const body = document.createElement('div');
      body.style.cssText = `width:${w}px;height:${h}px;border-radius:30px;background:${color};position:relative`;
      bumps.forEach((b) => {
        const bump = document.createElement('div');
        bump.style.cssText = `position:absolute;width:${b.w}px;height:${b.h}px;border-radius:50%;background:${color};top:${b.top}px;left:${b.left}px`;
        body.appendChild(bump);
      });
      el.appendChild(body);
      ref.current.appendChild(el);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      {/* Sky box */}
      <div
        className="relative w-56 h-32 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg,#0a1628 0%,#1a3a5c 40%,#2563eb 100%)',
        }}
      >
        {/* Sun */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: 22,
            right: 28,
            width: 32,
            height: 32,
            background: 'radial-gradient(circle,#fef3c7 30%,#fcd34d 60%,#f59e0b 100%)',
            animation: 'mausamSun 3s ease-in-out infinite',
          }}
        />
        {/* Clouds */}
        <div
          ref={c1Ref}
          className="absolute"
          style={{
            bottom: 38,
            animation: 'mausamCloud 8s linear infinite',
            animationDelay: '-1s',
          }}
        />
        <div
          ref={c2Ref}
          className="absolute"
          style={{
            bottom: 54,
            animation: 'mausamCloud 11s linear infinite',
            animationDelay: '-4s',
            opacity: 0.75,
          }}
        />
        <div
          ref={c3Ref}
          className="absolute"
          style={{
            bottom: 28,
            animation: 'mausamCloud 6.5s linear infinite',
            animationDelay: '-6s',
            opacity: 0.6,
          }}
        />
        {/* Rain */}
        <div ref={rainRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
      </div>

      {/* Brand + progress */}
      <div className="flex flex-col items-center gap-2">
        <p className="font-playfair text-[11px] text-slate-400 tracking-[5px] uppercase">मौसम</p>
        <p className="font-playfair text-[22px] font-black tracking-tight text-[var(--text-primary,#0f172a)]">
          Mausam
        </p>
        <ProgressBar />
        <Dots />
        <p className="text-[12px] text-slate-400 tracking-wide">{hint}</p>
      </div>
    </div>
  );
}

/* ─── Variant: Inline ──────────────────────────────────────────── */

function InlineLoader({ hint }: { hint: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-2">
      <MiniSky className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <p className="font-playfair font-black text-[15px] text-[var(--text-primary,#0f172a)] leading-none">
          Mausam
        </p>
        <ProgressBar />
        <p className="text-[11px] text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

/* ─── Variant: Fullscreen ──────────────────────────────────────── */

function FullscreenLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{
        background: 'linear-gradient(180deg,#0a1628 0%,#1a3a5c 40%,#2563eb 80%,#93c5fd 100%)',
      }}
    >
      <RainCanvas count={70} />
      {/* Pulse ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-sky-300/50"
          style={{ animation: 'mausamRing 1.8s ease-out infinite' }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-sky-300/50"
          style={{
            animation: 'mausamRing 1.8s ease-out infinite',
            animationDelay: '0.6s',
          }}
        />
        <div
          className="w-10 h-10 rounded-full z-10"
          style={{
            background: 'radial-gradient(circle,#fef3c7 30%,#fcd34d 60%,#f59e0b 100%)',
            animation: 'mausamSun 3s ease-in-out infinite',
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1">
        <p className="font-playfair text-[18px] font-black text-white tracking-tight">Mausam</p>
        <p className="font-playfair text-[11px] text-sky-300/80 tracking-[5px] uppercase">मौसम</p>
      </div>
      <Dots light />
    </div>
  );
}

/* ─── Variant: Skeleton ────────────────────────────────────────── */

function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 w-full max-w-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-2 bg-slate-200 rounded-full animate-pulse" style={{ width: '70%' }} />
          <div
            className="h-2 bg-slate-200 rounded-full animate-pulse"
            style={{ width: '45%', animationDelay: '150ms' }}
          />
        </div>
      </div>
      <div
        className="h-2 bg-slate-200 rounded-full animate-pulse"
        style={{ width: '90%', animationDelay: '100ms' }}
      />
      <div
        className="h-2 bg-slate-200 rounded-full animate-pulse"
        style={{ width: '60%', animationDelay: '250ms' }}
      />
    </div>
  );
}
