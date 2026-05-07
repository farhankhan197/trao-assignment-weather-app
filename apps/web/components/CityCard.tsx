'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { WeatherIcon } from './WeatherIcon';

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface Props {
  city: City;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CityCard({ city, onToggleFavorite, onDelete }: Props) {
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    tempMax: number;
    tempMin: number;
  } | null>(null);
  const [streak, setStreak] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wRes, sRes] = await Promise.all([
          api.get('/api/weather/current', { params: { lat: city.lat, lon: city.lon } }),
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
          setStreak(sRes.data.streak.label);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [city.lat, city.lon, city._id]);

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

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 relative group shadow-[var(--shadow-sm)] cursor-default h-full flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-display text-base text-[var(--text-primary)]">{city.name}</h3>
          <p className="text-xs text-[var(--text-muted)]">{city.country}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(city._id)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--warning)]"
            aria-label={city.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={city.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(city._id)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--danger)]"
            aria-label="Delete city"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {weather && (
        <div className="flex items-center gap-2.5 mb-2">
          <WeatherIcon condition={weather.condition} className="text-xl" />
          <div>
            <span className="text-2xl font-light text-[var(--text-primary)]">{Math.round(weather.temperature)}°</span>
            <span className="text-xs text-[var(--text-muted)] ml-1.5 capitalize">{weather.condition}</span>
          </div>
        </div>
      )}

      {weather && (
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>H {Math.round(weather.tempMax)}°</span>
          <span>L {Math.round(weather.tempMin)}°</span>
        </div>
      )}

      <div className="mt-2 h-6">
        {streak ? (
          <span className="text-xs text-[var(--warning)]/80 bg-[var(--warning-light)] rounded-lg px-2 py-1 inline-block">
            {streak}
          </span>
        ) : (
          <span className="inline-block" />
        )}
      </div>
    </motion.div>
  );
}

function getCondition(code: number): string {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  return 'stormy';
}
