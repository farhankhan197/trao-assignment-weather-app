'use client';

import { ReactNode } from 'react';
import WeatherAtmosphere from './WeatherAtmosphere';
import Snow from './Snow';
import Rain from './Rain';
import Storm from './Storm';
import SunGlow from './SunGlow';

interface WeatherBackgroundProps {
  condition: string;
  children: ReactNode;
}

const weatherGradients: Record<string, string> = {
  sunny: 'linear-gradient(180deg, #1a3a5c 0%, #2563eb 40%, #60a5fa 70%, #f8fafc 100%)',
  cloudy: 'linear-gradient(180deg, #334155 0%, #475569 30%, #64748b 60%, #f8fafc 100%)',
  rainy: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 40%, #334155 70%, #f8fafc 100%)',
  snowy: 'linear-gradient(180deg, #1e3a5f 0%, #3b82f6 40%, #93c5fd 70%, #f8fafc 100%)',
  stormy: 'linear-gradient(180deg, #020617 0%, #1e293b 40%, #334155 70%, #f8fafc 100%)',
};

export default function WeatherBackground({ condition, children }: WeatherBackgroundProps) {
  const gradient = weatherGradients[condition] || weatherGradients.sunny;

  return (
    <div className="relative min-h-screen">
      {/* Full page atmospheric background */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        {/* Atmospheric effects overlay */}
        <div className="absolute inset-0 overflow-hidden">
          {condition === 'sunny' && (
            <>
              <SunGlow intensity="dramatic" />
              <div
                className="absolute w-full h-full"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(253,224,71,0.15) 0%, transparent 60%)',
                }}
              />
            </>
          )}
          {condition === 'cloudy' && (
            <>
              <div
                className="absolute w-96 h-24 opacity-30"
                style={{
                  top: '5%',
                  left: '-5%',
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: 50,
                  animation: 'cloudFloat 80s linear infinite',
                }}
              />
              <div
                className="absolute w-64 h-16 opacity-20"
                style={{
                  top: '15%',
                  right: '10%',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: 50,
                  animation: 'cloudFloat 100s linear infinite',
                  animationDelay: '-20s',
                }}
              />
            </>
          )}
          {condition === 'rainy' && <Rain count={60} intensity="dramatic" />}
          {condition === 'snowy' && <Snow count={40} intensity="dramatic" />}
          {condition === 'stormy' && (
            <>
              <Rain count={80} intensity="dramatic" />
              <Storm intensity="dramatic" />
              <div
                className="absolute w-full h-full"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(71,85,105,0.3) 0%, transparent 50%)',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Content with subtle backdrop for readability */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
