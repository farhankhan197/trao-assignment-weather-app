'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { WeatherIcon } from '@/components/WeatherIcon';
import api from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [favorites, setFavorites] = useState<City[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [streak, setStreak] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      const res = await api.get('/api/cities');
      const all = res.data.cities || [];
      setCities(all);
      const favs = all.filter((c: City) => c.isFavorite);
      setFavorites(favs);
      if (favs.length > 0 && !selectedId) {
        setSelectedId(favs[0]._id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const city = favorites.find((c) => c._id === selectedId);
        if (!city) return;
        const [wRes, hRes, sRes] = await Promise.all([
          api.get('/api/weather/current', { params: { lat: city.lat, lon: city.lon } }),
          api.get(`/api/cities/${selectedId}/history`).catch(() => null),
          api.get(`/api/cities/${selectedId}/streak`).catch(() => null),
        ]);
        if (cancelled) return;
        const data = wRes.data;
        setCurrent({
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
            hRes.data.history.map((h: any) => ({
              date: formatDateShort(h.date),
              condition: h.condition,
              tempMax: h.tempMax,
              tempMin: h.tempMin,
            }))
          );
        } else {
          setHistory([]);
        }
        setStreak(sRes?.data?.streak?.label || null);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, favorites]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-5xl mb-4">⭐</p>
        <h1 className="font-display text-4xl mb-2">No Favorites Yet</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Mark cities as favorites from your dashboard to see them here with detailed weather history.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const selected = favorites.find((c) => c._id === selectedId) || favorites[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl lg:text-4xl mb-1">Favorites</h1>
        <p className="text-slate-400 text-sm">Detailed weather for your favorite cities</p>
      </div>

      {/* Top tabs - horizontal scroll on mobile */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {favorites.map((city) => (
          <button
            key={city._id}
            onClick={() => setSelectedId(city._id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              city._id === selectedId
                ? 'bg-sky-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - other favorites */}
        <div className="lg:w-64 shrink-0">
          <div className="lg:bg-slate-900 lg:border lg:border-slate-800 lg:rounded-2xl lg:p-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 hidden lg:block">
              Other Favorites
            </h3>
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
              {favorites
                .filter((c) => c._id !== selectedId)
                .map((city) => (
                  <SidebarItem
                    key={city._id}
                    city={city}
                    onClick={() => setSelectedId(city._id)}
                  />
                ))}
            </div>
            {favorites.filter((c) => c._id !== selectedId).length === 0 && (
              <p className="text-xs text-slate-500 hidden lg:block">No other favorites</p>
            )}
          </div>
        </div>

        {/* Main detail area */}
        <div className="flex-1 min-w-0">
          {detailLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-pulse">
              <div className="h-8 bg-slate-800 rounded w-40 mb-4" />
              <div className="h-16 bg-slate-800 rounded w-32 mb-6" />
              <div className="h-48 bg-slate-800 rounded w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current weather header */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl lg:text-3xl text-slate-100">{selected.name}</h2>
                    <p className="text-slate-500 text-sm">{selected.country}</p>
                  </div>
                  {current && (
                    <div className="text-right">
                      <WeatherIcon condition={current.condition} className="text-4xl lg:text-5xl" />
                    </div>
                  )}
                </div>

                {current && (
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
                    <div>
                      <span className="text-5xl lg:text-6xl font-light text-slate-100">{Math.round(current.temperature)}°</span>
                      <span className="text-slate-400 text-lg ml-2 capitalize">{current.condition}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                      <span>H {Math.round(current.tempMax)}°</span>
                      <span>L {Math.round(current.tempMin)}°</span>
                      <span>Humidity {current.humidity}%</span>
                      <span>Wind {Math.round(current.windSpeed)} km/h</span>
                      <span>Precip {current.precipitation} mm</span>
                    </div>
                  </div>
                )}

                {streak && (
                  <div className="mt-4 text-sm text-amber-400/80 bg-amber-400/10 rounded-lg px-3 py-2 inline-block">
                    {streak}
                  </div>
                )}
              </div>

              {/* Past week chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8">
                <h3 className="font-display text-lg mb-6">Past 15 Days</h3>
                {history.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tempMaxGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="tempMinGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} unit="°" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area type="monotone" dataKey="tempMax" stroke="#0ea5e9" strokeWidth={2} fill="url(#tempMaxGrad)" name="High" />
                        <Area type="monotone" dataKey="tempMin" stroke="#64748b" strokeWidth={2} fill="url(#tempMinGrad)" name="Low" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">No history data available.</p>
                  </div>
                )}

                {/* Day-by-day row */}
                {history.length > 0 && (
                  <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className="shrink-0 flex flex-col items-center gap-1.5 bg-slate-800/50 rounded-xl px-3 py-3 min-w-[72px]"
                      >
                        <span className="text-xs text-slate-400">{h.date}</span>
                        <WeatherIcon condition={h.condition} className="text-xl" />
                        <span className="text-sm font-medium text-slate-200">{Math.round(h.tempMax)}°</span>
                        <span className="text-xs text-slate-500">{Math.round(h.tempMin)}°</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ city, onClick }: { city: City; onClick: () => void }) {
  const [weather, setWeather] = useState<{ temperature: number; condition: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/weather/current', { params: { lat: city.lat, lon: city.lon } });
        if (cancelled) return;
        setWeather({
          temperature: res.data.current.temperature_2m,
          condition: getCondition(res.data.current.weather_code),
        });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [city.lat, city.lon]);

  return (
    <button
      onClick={onClick}
      className="w-full shrink-0 lg:shrink text-left flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors"
    >
      <div className="shrink-0">
        <WeatherIcon condition={weather?.condition || 'sunny'} className="text-xl" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{city.name}</p>
        <p className="text-xs text-slate-500">{weather ? `${Math.round(weather.temperature)}°` : '—'}</p>
      </div>
    </button>
  );
}

function getCondition(code: number): string {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  return 'stormy';
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'narrow' });
}
