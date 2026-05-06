'use client';

import { useState, useEffect } from 'react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-800 rounded w-16 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-lg text-slate-100">{city.name}</h3>
          <p className="text-xs text-slate-500">{city.country}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(city._id)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-amber-400"
            aria-label={city.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={city.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(city._id)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-red-400"
            aria-label="Delete city"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {weather && (
        <div className="flex items-center gap-3 mb-3">
          <WeatherIcon condition={weather.condition} />
          <div>
            <span className="text-3xl font-light text-slate-100">{Math.round(weather.temperature)}°</span>
            <span className="text-sm text-slate-400 ml-2 capitalize">{weather.condition}</span>
          </div>
        </div>
      )}

      {weather && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>H {Math.round(weather.tempMax)}°</span>
          <span>L {Math.round(weather.tempMin)}°</span>
        </div>
      )}

      {streak && (
        <div className="mt-3 text-xs text-amber-400/80 bg-amber-400/10 rounded-lg px-2.5 py-1.5 inline-block">
          {streak}
        </div>
      )}
    </div>
  );
}

function getCondition(code: number): string {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  return 'stormy';
}
