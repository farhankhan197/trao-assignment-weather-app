'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { WeatherIcon } from './WeatherIcon';
import WeatherAtmosphere from './weather/WeatherAtmosphere';

interface LocationCity {
  name: string;
  country: string;
}

interface CurrentWeather {
  temperature: number;
  condition: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

interface HistoryPoint {
  date: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
}

interface LocalCache {
  city: LocationCity;
  lat: number;
  lon: number;
  weather: CurrentWeather;
  history: HistoryPoint[];
  streak: string | null;
  timestamp: number;
}

type PermissionState = 'prompt' | 'denied' | 'unavailable' | 'granted';

const CACHE_KEY = 'mausam_local_cache';
const CACHE_TTL = 30 * 60 * 1000;
const DISTANCE_THRESHOLD_KM = 10;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadCache(): LocalCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LocalCache;
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(data: LocalCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage full — ignore
  }
}

export function LocalWeatherSidebar() {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [city, setCity] = useState<LocationCity | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [streak, setStreak] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [locationOff, setLocationOff] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Try loading cached data immediately
  const cached = useRef(loadCache());

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [history]);

  // On mount: show cache instantly, then check location
  useEffect(() => {
    if (cached.current) {
      const c = cached.current;
      setCity(c.city);
      setWeather(c.weather);
      setHistory(c.history);
      setStreak(c.streak);
      setLiveCoords({ lat: c.lat, lon: c.lon });
      setLoading(false);
      setLocationOff(true); // assume location might be stale
      setPermission('granted'); // treat as granted so we can try background geolocation
    }

    // Try geolocation in background
    if (!navigator.geolocation) {
      if (!cached.current) {
        setPermission('unavailable');
        setLoading(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLiveCoords({ lat, lon });
        setPermission('granted');
        setLocationOff(false);

        // If we have cached data, check if location changed significantly
        if (cached.current) {
          const dist = haversineKm(cached.current.lat, cached.current.lon, lat, lon);
          if (dist < DISTANCE_THRESHOLD_KM) {
            // Same area — keep cached data, just update timestamp
            saveCache({ ...cached.current, timestamp: Date.now() });
            return;
          }
        }
        // Location changed or no cache — fetch fresh data
        setCity(null);
        setWeather(null);
        setLoading(true);
      },
      (err) => {
        if (cached.current) {
          // Have cache, no live location — keep showing cached
          setLocationOff(true);
          setLoading(false);
          return;
        }
        if (err.code === err.PERMISSION_DENIED) setPermission('denied');
        else setPermission('unavailable');
        setLoading(false);
      },
      { timeout: 3000, maximumAge: 300000 }
    );
  }, []);

  // When liveCoords updates to a new location, fetch fresh data
  useEffect(() => {
    if (!liveCoords) return;
    if (cached.current) {
      const dist = haversineKm(
        cached.current.lat,
        cached.current.lon,
        liveCoords.lat,
        liveCoords.lon
      );
      if (dist < DISTANCE_THRESHOLD_KM) return; // same area
    }

    fetchLocal(liveCoords.lat, liveCoords.lon);
  }, [liveCoords]);

  const fetchLocal = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await api.get('/api/weather/local', { params: { lat, lon } });
      const data = res.data;
      setCity(data.city);
      setWeather(data.currentWeather);
      setHistory(data.history || []);
      setStreak(data.streak?.label || null);

      saveCache({
        city: data.city,
        lat,
        lon,
        weather: data.currentWeather,
        history: data.history || [],
        streak: data.streak?.label || null,
        timestamp: Date.now(),
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Permission prompt state — no cache yet
  if (permission === 'prompt' && !cached.current) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Your Location
        </p>
        <div className="animate-pulse flex items-center gap-4">
          <div className="space-y-3">
            <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-28" />
            <div className="h-8 bg-[var(--bg-surface-hover)] rounded w-16" />
          </div>
          <div className="h-12 w-12 bg-[var(--bg-surface-hover)] rounded-full" />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Allow location access to see local weather
        </p>
      </div>
    );
  }

  // Denied/no cache
  if (permission === 'denied' && !cached.current) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Location
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Location access denied. Enable it in your browser settings to see local weather.
        </p>
      </div>
    );
  }

  // Unavailable/no cache
  if (permission === 'unavailable' && !cached.current) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Location
        </p>
        <p className="text-sm text-[var(--text-muted])">Could not determine your location.</p>
      </div>
    );
  }

  // Still loading fresh data
  if (loading || !weather) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Your Location
        </p>
        <div className="animate-pulse flex items-center gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-28" />
            <div className="h-4 bg-[var(--bg-surface-hover)] rounded w-36" />
            <div className="h-8 bg-[var(--bg-surface-hover)] rounded w-16" />
          </div>
          <div className="h-12 w-12 bg-[var(--bg-surface-hover)] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] relative overflow-hidden"
    >
      <WeatherAtmosphere condition={weather.condition} intensity="card" />
      <div className="relative z-10 p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Your Location
          </p>
          {!locationOff && (
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" title="Live location" />
          )}
          {locationOff && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--danger)]"
              title="Location unavailable"
            />
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-[var(--text-primary)] truncate">
              {city?.name || 'Unknown'}
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-sm text-[var(--text-muted)] shrink-0">{city?.country || ''}</p>
              {weather && (
                <>
                  <span className="text-xs text-[var(--text-muted)]">·</span>
                  <span className="text-lg font-light text-[var(--text-primary)] shrink-0">
                    {Math.round(weather.temperature)}°
                  </span>
                  <span className="text-sm text-[var(--text-muted)] capitalize">
                    {weather.condition}
                  </span>
                </>
              )}
            </div>
          </div>
          <WeatherIcon condition={weather.condition} className="text-3xl shrink-0 mt-1" />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)] mt-4">
          <span className="shrink-0">H {Math.round(weather.tempMax)}°</span>
          <span className="shrink-0">L {Math.round(weather.tempMin)}°</span>
          <span className="shrink-0">Humidity {weather.humidity}%</span>
          <span className="shrink-0">Wind {Math.round(weather.windSpeed)} km/h</span>
          <span className="shrink-0">Precip {weather.precipitation} mm</span>
        </div>

        {locationOff && (
          <div className="mt-4 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-hover)]/50 rounded-lg px-3 py-2">
            Enable location in your browser settings for real-time weather updates.
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="border-t border-[var(--border)] p-5 lg:p-6">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-2 w-full text-left justify-between"
          >
            <h3 className="font-display text-base text-[var(--text-primary)]">Past 15 Days</h3>
            <div className="flex items-center gap-2 shrink-0">
              {streak && (
                <span className="text-xs text-[var(--text-inverse)] bg-white/90 rounded-lg px-2 py-1">
                  {streak}
                </span>
              )}
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
                className={`transition-transform duration-200 text-[var(--text-muted)] shrink-0 ${historyOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
          <motion.div
            initial={false}
            animate={{ height: historyOpen ? contentHeight : 0, opacity: historyOpen ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden mt-4"
          >
            <div ref={contentRef}>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="shrink-0 flex flex-col items-center gap-1 bg-[var(--bg-surface-hover)]/50 rounded-xl px-3 py-3 min-w-[72px]"
                  >
                    <span className="text-xs text-[var(--text-muted)]">{h.date}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{h.formattedDate}</span>
                    <WeatherIcon condition={h.condition} className="text-xl" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {Math.round(h.tempMax)}°
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {Math.round(h.tempMin)}°
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
