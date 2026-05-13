'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getCondition } from '@/lib/weather';
import { WeatherIcon } from './WeatherIcon';
import WeatherAtmosphere from './weather/WeatherAtmosphere';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

interface ApiHistoryPoint {
  date: string;
  condition: string;
  tempMax: number;
  tempMin: number;
}

type PermissionState = 'prompt' | 'denied' | 'unavailable' | 'granted';

const STORAGE_KEY = 'mausam_local_city';

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'narrow' });
}

export function LocalWeatherSidebar() {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [city, setCity] = useState<LocationCity | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [streak, setStreak] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [history]);

  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { city: LocationCity; lat: number; lon: number };
        setCity(parsed.city);
        setLocation({ lat: parsed.lat, lon: parsed.lon });
        setPermission('granted');
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'prompt') return;
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocation({ lat, lon });
        setPermission('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermission('denied');
        } else {
          setPermission('unavailable');
        }
      },
      { timeout: 8000 }
    );
  }, [permission]);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let currentCity = city;
        if (!currentCity) {
          const cRes = await api
            .get('/api/weather/reverse', {
              params: { lat: location.lat, lon: location.lon },
            })
            .catch(() => ({
              data: {
                city: {
                  name: 'Current Location',
                  country: `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`,
                },
              },
            }));
          if (cancelled) return;
          currentCity = cRes.data.city;
          setCity(currentCity);
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ city: currentCity, lat: location.lat, lon: location.lon })
          );
        }

        const [wRes, hRes, sRes] = await Promise.all([
          api.get('/api/weather/current', {
            params: { lat: location.lat, lon: location.lon },
          }),
          api
            .get('/api/weather/history', {
              params: { lat: location.lat, lon: location.lon },
            })
            .catch(() => null),
          api
            .get('/api/weather/streak', {
              params: { lat: location.lat, lon: location.lon },
            })
            .catch(() => null),
        ]);
        if (cancelled) return;
        const data = wRes.data;
        setWeather({
          temperature: data.current.temperature_2m,
          condition: getCondition(data.current.weather_code),
          tempMax: data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m,
          tempMin: data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
        });

        if (hRes?.data?.history) {
          setHistory(
            hRes.data.history.map((h: ApiHistoryPoint) => {
              const d = new Date(h.date + 'T00:00:00');
              return {
                date: formatDateShort(h.date),
                formattedDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                condition: h.condition,
                tempMax: h.tempMax,
                tempMin: h.tempMin,
              };
            })
          );
        }

        setStreak(sRes?.data?.streak?.label || null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location, city]);

  if (permission === 'prompt') {
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

  if (permission === 'denied') {
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

  if (permission === 'unavailable') {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Location
        </p>
        <p className="text-sm text-[var(--text-muted)]">Could not determine your location.</p>
      </div>
    );
  }

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
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Your Location
        </p>
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
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="histTempMaxGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="histTempMinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="°"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tempMax"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fill="url(#histTempMaxGrad)"
                      name="High"
                    />
                    <Area
                      type="monotone"
                      dataKey="tempMin"
                      stroke="#64748b"
                      strokeWidth={2}
                      fill="url(#histTempMinGrad)"
                      name="Low"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
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
