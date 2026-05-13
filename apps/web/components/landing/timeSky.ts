import { useState, useEffect } from 'react';

export interface SkyTheme {
  gradient: string;
  textColor: string;
  orbColor: string;
  orbGlow: string;
  orbSize: number;
  orbTop: number;
  isNight: boolean;
  condition: string;
  temperature: string;
  starOpacity: number;
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getTheme(hour: number): SkyTheme {
  if (hour >= 22 || hour < 4) {
    return {
      gradient: 'linear-gradient(180deg,#020b18 0%,#0a1628 50%,#0d1f3c 100%)',
      textColor: '#c8d8f0',
      orbColor: '#f5f5e0',
      orbGlow: '0 0 40px 14px rgba(245,245,200,0.25)',
      orbSize: 36,
      orbTop: 18,
      isNight: true,
      condition: hour < 4 ? 'Late night' : 'Night',
      temperature: '18°',
      starOpacity: 1,
    };
  }

  if (hour < 6) {
    const t = (hour - 4) / 2;
    return {
      gradient: `linear-gradient(180deg,#0a1628 0%,${lerpHex('#1a3a5c', '#7b4e2d', t)} 30%,${lerpHex('#2563eb', '#e8854a', t)} 55%,${lerpHex('#1e3a5f', '#f9c06a', t)} 100%)`,
      textColor: lerpHex('#c8d8f0', '#fff3e0', t),
      orbColor: lerpHex('#e0c060', '#ffb347', t),
      orbGlow: `0 0 40px 18px rgba(255,160,60,${lerp(0.2, 0.35, t).toFixed(2)})`,
      orbSize: Math.round(lerp(36, 52, t)),
      orbTop: Math.round(lerp(18, 60, t)),
      isNight: t < 0.2,
      condition: 'Sunrise',
      temperature: '21°',
      starOpacity: lerp(1, 0, t),
    };
  }

  if (hour < 10) {
    const t = (hour - 6) / 4;
    return {
      gradient: `linear-gradient(180deg,${lerpHex('#1a3a5c', '#0a1e3d', t)} 0%,${lerpHex('#2563eb', '#1a6fd4', t)} 45%,${lerpHex('#1e3a5f', '#2e7bd8', t)} 100%)`,
      textColor: '#e8f4ff',
      orbColor: '#ffeaa0',
      orbGlow: '0 0 50px 20px rgba(255,230,120,0.35)',
      orbSize: Math.round(lerp(52, 46, t)),
      orbTop: Math.round(lerp(60, 30, t)),
      isNight: false,
      condition: 'Morning',
      temperature: '24°',
      starOpacity: 0,
    };
  }

  if (hour < 15) {
    return {
      gradient: 'linear-gradient(180deg,#0a1e3d 0%,#1a6fd4 40%,#2563eb 70%,#3a8ee8 100%)',
      textColor: '#e0f0ff',
      orbColor: '#fffde0',
      orbGlow: '0 0 60px 24px rgba(255,253,200,0.4)',
      orbSize: 44,
      orbTop: 20,
      isNight: false,
      condition: 'Sunny',
      temperature: '29°',
      starOpacity: 0,
    };
  }

  if (hour < 18) {
    const t = (hour - 15) / 3;
    return {
      gradient: `linear-gradient(180deg,#0a1e3d 0%,${lerpHex('#1a6fd4', '#1a3a5c', t)} 40%,#2563eb 65%,${lerpHex('#3a8ee8', '#1e3a5f', t)} 100%)`,
      textColor: '#e8f0ff',
      orbColor: lerpHex('#fffde0', '#ffc870', t),
      orbGlow: '0 0 50px 22px rgba(255,180,80,0.35)',
      orbSize: Math.round(lerp(44, 54, t)),
      orbTop: Math.round(lerp(20, 65, t)),
      isNight: false,
      condition: 'Afternoon',
      temperature: '26°',
      starOpacity: 0,
    };
  }

  const t = (hour - 18) / 3;
  return {
    gradient: `linear-gradient(180deg,#0a1628 0%,${lerpHex('#1a3a5c', '#0f2240', t)} 30%,${lerpHex('#e8854a', '#2563eb', t)} 60%,${lerpHex('#f9c06a', '#1e3a5f', t)} 100%)`,
    textColor: lerpHex('#fff3e0', '#c8d8f0', t),
    orbColor: lerpHex('#ff8c42', '#e05000', t),
    orbGlow: `0 0 44px 18px rgba(230,120,50,${lerp(0.3, 0.1, t).toFixed(2)})`,
    orbSize: Math.round(lerp(54, 38, t)),
    orbTop: Math.round(lerp(65, 85, t)),
    isNight: t > 0.85,
    condition: hour < 20 ? 'Sunset' : 'Evening',
    temperature: '22°',
    starOpacity: lerp(0, 0.8, t),
  };
}

export function useTimeOfDay(): number {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const sync = () => setHour(new Date().getHours());
    const id = setInterval(sync, 60000);
    return () => clearInterval(id);
  }, []);

  return hour;
}
