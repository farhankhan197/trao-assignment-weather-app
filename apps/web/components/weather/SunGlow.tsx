'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface SunGlowProps {
  intensity?: 'subtle' | 'dramatic' | 'card';
}

export default function SunGlow({ intensity = 'subtle' }: SunGlowProps) {
  if (intensity === 'card') {
    return <SunGlowCard />;
  }

  return (
    <div
      className="absolute pointer-events-none z-0"
      style={{
        top: intensity === 'dramatic' ? '-10%' : '5%',
        right: intensity === 'dramatic' ? '5%' : '10%',
        width: intensity === 'dramatic' ? 120 : 40,
        height: intensity === 'dramatic' ? 120 : 40,
        background:
          intensity === 'dramatic'
            ? 'radial-gradient(circle, rgba(253,224,71,0.4) 0%, rgba(251,191,36,0.15) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(253,224,71,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: intensity === 'dramatic' ? 'blur(20px)' : undefined,
      }}
      aria-hidden="true"
    />
  );
}

function SunGlowCard() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const parallaxX = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <motion.div
      ref={ref}
      className="absolute pointer-events-none z-0"
      style={{
        top: '20%',
        right: '6%',
        width: 100,
        height: 100,
        background:
          'radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(251,191,36,0.2) 40%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        x: parallaxX,
        y: parallaxY,
      }}
      aria-hidden="true"
    />
  );
}
