'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/context/SessionContext';
import api from '@/lib/api';
import TimeSky from './TimeSky';
import { getTheme, useTimeOfDay } from './skyTheme';

interface GeoData {
  temp: number;
  condition: string;
  cityName: string;
}

export default function HeroSection() {
  const { user, loading: authLoading } = useSession();
  const hour = useTimeOfDay();
  const theme = getTheme(hour ?? 12);

  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoFired = useRef(false);

  useEffect(() => {
    if (!user) {
      setGeoData(null);
      geoFired.current = false;
      return;
    }

    if (geoFired.current) return;
    geoFired.current = true;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.get('/api/weather/local', {
            params: { lat: latitude, lon: longitude },
          });
          const cw = res.data.currentWeather;
          const city = res.data.city;
          if (cw?.temperature !== undefined && cw?.condition) {
            setGeoData({
              temp: Math.round(cw.temperature),
              condition: cw.condition,
              cityName: city?.name || null,
            });
          }
        } catch {
          // Fall back to theme-based display
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, [user]);

  const displayTemp = geoData !== null ? `${geoData.temp}°` : theme.temperature;
  const displayCondition =
    geoData !== null ? geoData.condition.toUpperCase() : theme.condition.toUpperCase();
  const displayLocation = geoData !== null ? geoData.cityName : null;

  const ctaPrimary = user
    ? { text: 'Go to Dashboard', href: '/dashboard' }
    : { text: 'Sign In', href: '/login' };

  const ctaSecondary = user
    ? { text: 'View Favorites', href: '/favorites' }
    : { text: 'Register', href: '/register' };

  return (
    <section className="relative w-full flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
      <TimeSky condition={geoData?.condition} hour={hour} />

      <div className="relative z-20 text-center px-4 sm:px-5 py-4 sm:py-0 mb-4 sm:mb-6">
        <p
          className="text-sky-300/85 text-sm mb-1.5"
          style={{
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Noto Sans', sans-serif",
          }}
        >
          मौसम
        </p>
        <h1
          className="font-display font-bold text-white leading-none tracking-tight"
          style={{
            fontSize: 'clamp(28px, 7vw, 72px)',
            textShadow: '0 2px 16px rgba(0,0,0,0.3)',
          }}
        >
          Mausam
        </h1>

        {/* Weather readout — only for logged-in users */}
        {user && (
          <>
            <div
              className="mt-5 flex flex-col items-center gap-1 transition-colors duration-1000"
              style={{ color: theme.textColor }}
            >
              {geoLoading ? (
                <div className="h-[72px] w-24 rounded animate-shimmer" />
              ) : (
                <>
                  <span
                    className="leading-none tracking-[-3px] font-[200]"
                    style={{ fontSize: 'clamp(48px, 12vw, 72px)' }}
                  >
                    {displayTemp}
                  </span>
                  <span className="text-[13px] font-[400] tracking-[3px] uppercase opacity-75">
                    {displayCondition}
                  </span>
                  {displayLocation && (
                    <span className="text-[11px] tracking-[2px] uppercase opacity-50 mt-1">
                      {displayLocation}
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-white/55 font-light tracking-wide mt-5 text-sm leading-relaxed max-w-xs sm:max-w-sm mx-auto">
              Beautiful weather, beautifully told. <br className="hidden sm:block" />
              Know your sky before you step outside.
            </p>
          </>
        )}

        {/* CTA buttons */}
        <div className="flex gap-3 justify-center mt-6 sm:mt-8 flex-wrap">
          {authLoading ? (
            <>
              <div className="h-9 w-[118px] rounded-full animate-shimmer bg-white/10" />
              <div className="h-9 w-[118px] rounded-full animate-shimmer bg-white/10" />
            </>
          ) : (
            <>
              <a
                href={ctaPrimary.href}
                className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-[var(--accent)] bg-white text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5"
              >
                {ctaPrimary.text}
              </a>
              <a
                href={ctaSecondary.href}
                className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full text-[var(--accent)] bg-white text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5"
              >
                {ctaSecondary.text}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Bottom wave */}
      <svg
        className="absolute left-0 w-full z-[5]"
        style={{ bottom: -1 }}
        viewBox="0 0 1440 60"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill="#ffffff"
        />
      </svg>
    </section>
  );
}
