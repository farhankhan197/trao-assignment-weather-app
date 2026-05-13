'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { WeatherIcon } from '@/components/WeatherIcon';
import WeatherAtmosphere from '@/components/weather/WeatherAtmosphere';
import api from '@/lib/api';
import { getCondition } from '@/lib/weather';
import dynamic from 'next/dynamic';

const HistoryChart = dynamic(() => import('@/components/weather/HistoryChart'), {
  ssr: false,
});

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface HistoryPoint {
  date: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
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

export default function FavoritesPage() {
  const { loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<City[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [streak, setStreak] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sidebarWeather, setSidebarWeather] = useState<
    Record<string, { temperature: number; condition: string }>
  >({});
  const autoSelected = useRef(false);

  const fetchCities = useCallback(async () => {
    try {
      const res = await api.get('/api/cities', { params: { favoritesOnly: true } } as any);
      const favs = res.data.cities || [];
      setFavorites(favs);
      if (favs.length > 0 && !autoSelected.current) {
        autoSelected.current = true;
        setSelectedId(favs[0]._id);
      }

      // Batch fetch weather for all sidebar items
      const entries = await Promise.all(
        favs.map(async (city: City) => {
          try {
            const wRes = await api.get('/api/weather/current', {
              params: { lat: city.lat, lon: city.lon },
            });
            return {
              id: city._id,
              temperature: wRes.data.current.temperature_2m,
              condition: getCondition(wRes.data.current.weather_code),
            };
          } catch {
            return null;
          }
        })
      );
      const weatherMap: Record<string, { temperature: number; condition: string }> = {};
      for (const entry of entries) {
        if (entry) weatherMap[entry.id] = entry;
      }
      setSidebarWeather(weatherMap);
    } catch {
      // ignore
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await api.get(`/api/cities/${selectedId}/details`);
        if (cancelled) return;
        const data = res.data;
        setCurrent(data.currentWeather);
        setHistory(
          (data.history || []).map((h: any) => {
            const d = new Date(h.date + 'T00:00:00');
            return {
              date: d.toLocaleDateString('en', { weekday: 'narrow' }),
              formattedDate: h.formattedDate,
              condition: h.condition,
              tempMax: h.tempMax,
              tempMin: h.tempMin,
            };
          })
        );
        setStreak(data.streak?.label || null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (authLoading || initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-5xl mb-4">⭐</p>
        <h1 className="font-display text-4xl mb-2">No Favorites Yet</h1>
        <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto mb-6">
          Mark cities as favorites from your dashboard to see them here with detailed weather
          history.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const selected = favorites.find((c) => c._id === selectedId) || favorites[0];

  return (
    <div className="relative min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-4">
          <h1
            className="font-display text-2xl lg:text-3xl text-[var(--text-primary)] mb-1"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            Favorites
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Detailed weather for your favorite cities
          </p>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-6">
          {/* Sidebar - all favorites */}
          <div className="lg:w-64 shrink-0">
            <div className="lg:bg-[var(--bg-surface)] lg:border lg:border-[var(--border)] lg:rounded-2xl lg:p-4 lg:shadow-[var(--shadow-sm)]">
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 hidden lg:block">
                Your Cities
              </h3>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
                className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide"
              >
                {favorites.map((city) => (
                  <motion.div
                    key={city._id}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 350,
                          damping: 25,
                        },
                      },
                    }}
                  >
                    <SidebarItem
                      city={city}
                      isSelected={city._id === selectedId}
                      onClick={() => setSelectedId(city._id)}
                      weatherData={sidebarWeather[city._id]}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Main detail area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {detailLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 animate-pulse shadow-[var(--shadow-sm)]"
                >
                  <div className="h-8 bg-[var(--bg-surface-hover)] rounded w-40 mb-4" />
                  <div className="h-16 bg-[var(--bg-surface-hover)] rounded w-32 mb-6" />
                  <div className="h-48 bg-[var(--bg-surface-hover)] rounded w-full" />
                </motion.div>
              ) : (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Current weather header */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] relative overflow-hidden">
                    {current && (
                      <WeatherAtmosphere condition={current.condition} intensity="card" />
                    )}
                    <div className="relative z-10 p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="font-display text-2xl lg:text-3xl text-[var(--text-primary)]">
                            {selected.name}
                          </h2>
                          <p className="text-[var(--text-muted)] text-sm">{selected.country}</p>
                        </div>
                        {current && (
                          <div className="text-right">
                            <WeatherIcon
                              condition={current.condition}
                              className="text-4xl lg:text-5xl"
                            />
                          </div>
                        )}
                      </div>

                      {current && (
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
                          <div>
                            <span className="text-4xl lg:text-5xl font-light text-[var(--text-primary)]">
                              {Math.round(current.temperature)}°
                            </span>
                            <span className="text-[var(--text-muted)] text-base ml-2 capitalize">
                              {current.condition}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
                            <span>H {Math.round(current.tempMax)}°</span>
                            <span>L {Math.round(current.tempMin)}°</span>
                            <span>Humidity {current.humidity}%</span>
                            <span>Wind {Math.round(current.windSpeed)} km/h</span>
                            <span>Precip {current.precipitation} mm</span>
                          </div>
                        </div>
                      )}

                      {streak && (
                        <div className="mt-4 text-sm text-[var(--text-inverse)] bg-white/90 rounded-lg px-3 py-2 inline-block">
                          {streak}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Past week chart */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 lg:p-6 shadow-[var(--shadow-sm)]">
                    <h3 className="font-display text-base text-[var(--text-primary)] mb-4">
                      Past 15 Days
                    </h3>
                    {history.length > 0 ? (
                      <div className="h-64 w-full">
                        <HistoryChart data={history} />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-[var(--text-muted)] text-sm">
                          No history data available.
                        </p>
                      </div>
                    )}

                    {/* Day-by-day row */}
                    {history.length > 0 && (
                      <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                        {history.map((h, i) => (
                          <div
                            key={i}
                            className="shrink-0 flex flex-col items-center gap-1 bg-[var(--bg-surface-hover)]/50 rounded-xl px-3 py-3 min-w-[72px]"
                          >
                            <span className="text-xs text-[var(--text-muted)]">{h.date}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {h.formattedDate}
                            </span>
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
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  city,
  isSelected,
  onClick,
  weatherData,
}: {
  city: City;
  isSelected: boolean;
  onClick: () => void;
  weatherData?: { temperature: number; condition: string } | null;
}) {
  const weather = weatherData || null;

  return (
    <button
      onClick={onClick}
      className={`w-full shrink-0 lg:shrink text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isSelected
          ? 'bg-[var(--accent-light)] border border-[var(--accent-muted)]'
          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      <div className="shrink-0">
        <WeatherIcon condition={weather?.condition || 'sunny'} className="text-xl" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium truncate ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
        >
          {city.name}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {weather ? `${Math.round(weather.temperature)}°` : '—'}
        </p>
      </div>
    </button>
  );
}
