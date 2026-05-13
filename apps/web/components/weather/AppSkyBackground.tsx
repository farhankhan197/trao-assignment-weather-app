'use client';

import { usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/register', '/privacy-policy', '/terms-of-service'];

export default function AppSkyBackground() {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.includes(pathname)) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0a1628 0%, #1a3a5c 35%, #2563eb 65%, #93c5fd 85%, #f8fafc 100%)',
      }}
      aria-hidden="true"
    >
      {/* Cloud 1 - large, slow */}
      <div
        className="absolute scale-50 sm:scale-75 lg:scale-100 origin-bottom-left"
        style={{
          bottom: '36%',
          left: 0,
          animation: 'cloudFloat 55s linear infinite',
          animationDelay: '-6s',
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={210}
          baseH={64}
          color="rgba(255,255,255,0.88)"
          bumps={[
            { w: 100, h: 90, top: -48, left: 25 },
            { w: 80, h: 74, top: -38, left: 100 },
            { w: 62, h: 56, top: -28, left: 150 },
          ]}
        />
      </div>

      {/* Cloud 2 - medium */}
      <div
        className="absolute scale-50 sm:scale-75 lg:scale-100 origin-bottom-left"
        style={{
          bottom: '44%',
          left: 0,
          animation: 'cloudFloat 75s linear infinite',
          animationDelay: '-25s',
          opacity: 0.82,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={160}
          baseH={50}
          color="rgba(255,255,255,0.93)"
          bumps={[
            { w: 76, h: 68, top: -35, left: 16 },
            { w: 60, h: 55, top: -28, left: 75 },
          ]}
        />
      </div>

      {/* Cloud 3 - wispy blue-tinted */}
      <div
        className="absolute scale-50 sm:scale-75 lg:scale-100 origin-bottom-left"
        style={{
          bottom: '52%',
          left: 0,
          animation: 'cloudFloat 90s linear infinite',
          animationDelay: '-40s',
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={130}
          baseH={42}
          color="rgba(190,215,255,0.65)"
          bumps={[
            { w: 65, h: 56, top: -28, left: 12 },
            { w: 50, h: 44, top: -22, left: 65 },
          ]}
        />
      </div>

      {/* Cloud 4 - tiny */}
      <div
        className="absolute scale-50 sm:scale-75 lg:scale-100 origin-bottom-left"
        style={{
          bottom: '30%',
          left: 0,
          animation: 'cloudFloat 48s linear infinite',
          animationDelay: '-5s',
          opacity: 0.75,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={120}
          baseH={38}
          color="rgba(255,255,255,0.7)"
          bumps={[
            { w: 58, h: 52, top: -26, left: 14 },
            { w: 46, h: 40, top: -20, left: 62 },
          ]}
        />
      </div>
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
      className="relative"
      style={{
        width: baseW,
        height: baseH,
        background: color,
        borderRadius: 50,
      }}
    >
      {bumps.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.w,
            height: b.h,
            top: b.top,
            left: b.left,
            background: color,
          }}
        />
      ))}
    </div>
  );
}
