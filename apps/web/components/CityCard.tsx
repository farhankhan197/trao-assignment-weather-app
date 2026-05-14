'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getCondition } from '@/lib/weather';
import { WeatherIcon } from './WeatherIcon';
import WeatherAtmosphere from './weather/WeatherAtmosphere';

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface WeatherData {
  temperature: number;
  condition: string;
  tempMax: number;
  tempMin: number;
}

interface Props {
  city: City;
  weatherData?: WeatherData | null;
  streak?: string | null;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

function CityCardComponent({ city, weatherData, streak, onToggleFavorite, onDelete }: Props) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [streakState, setStreakState] = useState<string | null>(null);
  const [loading, setLoading] = useState(!weatherData);

  // If weatherData is provided from parent, use it directly
  useEffect(() => {
    if (weatherData) {
      setWeather(weatherData);
      setStreakState(streak ?? null);
      setLoading(false);
    }
  }, [weatherData, streak]);

  // Fallback: fetch internally if no weatherData prop
  useEffect(() => {
    if (weatherData) return;
    let cancelled = false;
    (async () => {
      try {
        const [wRes, sRes] = await Promise.all([
          api.get('/api/weather/current', {
            params: { lat: city.lat, lon: city.lon },
          }),
          api.get(`/api/cities/${city._id}/streak`).catch(() => null),
        ]);
        if (cancelled) return;
        const current = wRes.data.current;
        const daily = wRes.data.daily;
        setWeather({
          temperature: current.temperature_2m,
          condition: wRes.data.condition || getCondition(current.weather_code),
          tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m,
          tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m,
        });
        if (sRes?.data?.streak) {
          setStreakState(sRes.data.streak.label);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city.lat, city.lon, city._id, weatherData]);

  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 animate-pulse h-full flex flex-col justify-between">
        <div>
          <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-24 mb-3" />
          <div className="h-8 bg-[var(--bg-surface-hover)] rounded w-16 mb-2" />
        </div>
        <div className="h-3 bg-[var(--bg-surface-hover)] rounded w-32" />
      </div>
    );
  }

  const activeWeather = weather || weatherData;

  const glowColor = activeWeather
    ? {
        sunny: '0 8px 24px rgba(251,191,36,0.12)',
        cloudy: '0 8px 24px rgba(148,163,184,0.1)',
        rainy: '0 8px 24px rgba(59,130,246,0.12)',
        snowy: '0 8px 24px rgba(186,230,253,0.12)',
        stormy: '0 8px 24px rgba(71,85,105,0.12)',
      }[activeWeather.condition] || '0 8px 24px rgba(37,99,235,0.08)'
    : '0 8px 24px rgba(37,99,235,0.08)';

  const displayStreak = streakState || streak || null;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2, boxShadow: glowColor }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => router.push(`/city/${city._id}`)}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl relative group shadow-[var(--shadow-sm)] cursor-pointer h-full flex flex-col justify-between overflow-hidden"
    >
      {activeWeather && <WeatherAtmosphere condition={activeWeather.condition} intensity="card" />}
      <div className="relative z-10 p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-display text-base text-[var(--text-primary)]">{city.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">{city.country}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(city._id);
              }}
              className={`p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors hover:text-[var(--warning)] ${
                city.isFavorite ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
              }`}
              aria-label={city.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={city.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(city._id);
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--danger)]"
              aria-label="Delete city"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {activeWeather && (
          <div className="flex items-center gap-2.5 mb-2">
            <WeatherIcon condition={activeWeather.condition} className="text-xl" />
            <div>
              <span className="text-2xl font-light text-[var(--text-primary)]">
                {Math.round(activeWeather.temperature)}°
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1.5 capitalize">
                {activeWeather.condition}
              </span>
            </div>
          </div>
        )}

        {activeWeather && (
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span>H {Math.round(activeWeather.tempMax)}°</span>
            <span>L {Math.round(activeWeather.tempMin)}°</span>
          </div>
        )}

        <div className="mt-2 h-6">
          {displayStreak ? (
            <span className="text-xs text-[var(--text-inverse)] bg-white/90 rounded-lg px-2 py-1 inline-block">
              {displayStreak}
            </span>
          ) : (
            <span className="inline-block" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function areEqual(prevProps: Props, nextProps: Props) {
  return (
    prevProps.city._id === nextProps.city._id &&
    prevProps.city.isFavorite === nextProps.city.isFavorite &&
    prevProps.city.name === nextProps.city.name &&
    prevProps.weatherData?.temperature === nextProps.weatherData?.temperature &&
    prevProps.weatherData?.condition === nextProps.weatherData?.condition &&
    prevProps.weatherData?.tempMax === nextProps.weatherData?.tempMax &&
    prevProps.weatherData?.tempMin === nextProps.weatherData?.tempMin &&
    prevProps.streak === nextProps.streak &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite &&
    prevProps.onDelete === nextProps.onDelete
  );
}

export const CityCard = React.memo(CityCardComponent, areEqual);
CityCard.displayName = 'CityCard';
