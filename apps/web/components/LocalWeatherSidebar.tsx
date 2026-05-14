'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUnits } from '@/context/UnitContext';
import { formatTempShort, formatSpeed, formatPrecip } from '@/lib/units';
import api from '@/lib/api';
import { WeatherIcon } from './WeatherIcon';
import WeatherAtmosphere from './weather/WeatherAtmosphere';
import SunEventIcon from './weather/SunEventIcon';

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
  sunrise: string | null;
  sunset: string | null;
  uvIndexMax: number | null;
}

interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  condition: string;
  windSpeed: number;
  uvIndex: number;
  sunEvent?: SunEvent | null;
}

interface AirQuality {
  europeanAqi: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

type SunEvent = 'sunrise' | 'sunset';

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
  hourly: HourlyPoint[];
  airQuality: AirQuality | null;
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
  if (typeof window === 'undefined') return null;

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
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage full — ignore
  }
}

function getCondIcon(cond: string): string {
  if (cond === 'sunny') return '☀️';
  if (cond === 'cloudy') return '☁️';
  if (cond === 'rainy') return '🌧️';
  if (cond === 'snowy') return '❄️';
  return '⛈️';
}

function formatHour(time: string): string {
  const d = new Date(time);
  return d.toLocaleTimeString('en', { hour: 'numeric', hour12: true });
}

function formatTime(time: string): string {
  const d = new Date(time);
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function getCurrentHourKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}`;
}

function getSunEventForHour(
  time: string,
  sunrise?: string | null,
  sunset?: string | null
): SunEvent | null {
  const hourKey = time.slice(0, 13);
  if (sunrise?.slice(0, 13) === hourKey) return 'sunrise';
  if (sunset?.slice(0, 13) === hourKey) return 'sunset';
  return null;
}

export function LocalWeatherSidebar() {
  const { units } = useUnits();
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [city, setCity] = useState<LocationCity | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [streak, setStreak] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showHourly, setShowHourly] = useState(false);
  const [locationOff, setLocationOff] = useState(false);
  const [locationChecking, setLocationChecking] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsOff, setGpsOff] = useState(false);
  const [requested, setRequested] = useState(false);
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
      setHourly(c.hourly || []);
      setAirQuality(c.airQuality || null);
      setHistory(c.history);
      setStreak(c.streak);
      setLiveCoords({ lat: c.lat, lon: c.lon });
      setLoading(false);
      setLocationOff(false);
      setLocationChecking(true);
      setPermission('granted');
    }

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
        setLocationChecking(false);
        setGpsOff(false);

        if (cached.current) {
          const dist = haversineKm(cached.current.lat, cached.current.lon, lat, lon);
          if (dist < DISTANCE_THRESHOLD_KM) {
            saveCache({ ...cached.current, timestamp: Date.now() });
            return;
          }
        }
        setCity(null);
        setWeather(null);
        setLoading(true);
      },
      (err) => {
        if (cached.current) {
          if (err.code === err.PERMISSION_DENIED) setLocationOff(true);
          else setGpsOff(true);
          setLocationChecking(false);
          setLoading(false);
          return;
        }
        if (err.code === err.PERMISSION_DENIED) setPermission('denied');
        else {
          setPermission('unavailable');
          setGpsOff(true);
        }
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!liveCoords) return;
    if (cached.current) {
      const dist = haversineKm(
        cached.current.lat,
        cached.current.lon,
        liveCoords.lat,
        liveCoords.lon
      );
      if (dist < DISTANCE_THRESHOLD_KM) return;
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
      setHourly(data.hourly || []);
      setAirQuality(data.airQuality || null);
      setHistory(data.history || []);
      setStreak(data.streak?.label || null);

      saveCache({
        city: data.city,
        lat,
        lon,
        weather: data.currentWeather,
        hourly: data.hourly || [],
        airQuality: data.airQuality || null,
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

  const requestLocation = useCallback(() => {
    setRequested(true);
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLiveCoords({ lat, lon });
        setPermission('granted');
        setLoading(true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission('denied');
        else setPermission('unavailable');
      },
      { timeout: 8000 }
    );
  }, []);

  // Permission states ...
  if (permission === 'prompt' && !cached.current) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Location
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          See live weather for your current location
        </p>
        <button
          onClick={requestLocation}
          disabled={requested}
          className="text-sm bg-[var(--accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {requested ? 'Requesting...' : 'Grant Access'}
        </button>
      </div>
    );
  }

  if (permission === 'denied' && !cached.current) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Location
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Location access blocked. Enable in your browser settings.
        </p>
      </div>
    );
  }

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

  const currentHourKey = getCurrentHourKey();
  const visibleHourly = hourly.filter((h) => h.time.slice(0, 13) >= currentHourKey);

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
          {locationChecking && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"
              title="Checking location..."
            />
          )}
          {!locationChecking && !locationOff && !gpsOff && (
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" title="Live location" />
          )}
          {!locationChecking && locationOff && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--danger)]"
              title="Location permission denied"
            />
          )}
          {!locationChecking && gpsOff && !locationOff && (
            <span className="w-2 h-2 rounded-full bg-[var(--warning)]" title="GPS unavailable" />
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
                    {formatTempShort(weather.temperature, units)}
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
          <span className="shrink-0">H {formatTempShort(weather.tempMax, units)}</span>
          <span className="shrink-0">L {formatTempShort(weather.tempMin, units)}</span>
          <span className="shrink-0">Humidity {weather.humidity}%</span>
          <span className="shrink-0">Wind {formatSpeed(weather.windSpeed, units)}</span>
          <span className="shrink-0">Precip {formatPrecip(weather.precipitation, units)}</span>
        </div>

        {/* Extra data row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)] mt-2">
          {weather.sunrise && (
            <span className="shrink-0">Sunrise {formatTime(weather.sunrise)}</span>
          )}
          {weather.sunset && <span className="shrink-0">Sunset {formatTime(weather.sunset)}</span>}
          {weather.uvIndexMax !== null && weather.uvIndexMax !== undefined && (
            <span className="shrink-0">UV {weather.uvIndexMax}</span>
          )}
          {airQuality?.usAqi !== null && airQuality?.usAqi !== undefined && (
            <span className="shrink-0">AQI {airQuality.usAqi}</span>
          )}
        </div>

        {/* Hourly forecast */}
        {hourly.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHourly(!showHourly)}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1"
            >
              Hourly forecast
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${showHourly ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showHourly && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-x-auto scrollbar-hide mt-3 py-1"
              >
                <div className="flex gap-2">
                  {visibleHourly.slice(0, 24).map((h, i) => {
                    const sunEvent =
                      h.sunEvent ?? getSunEventForHour(h.time, weather.sunrise, weather.sunset);

                    return (
                      <div
                        key={h.time}
                        className={`shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl min-w-[56px] first:ml-0.5 ${
                          i === 0
                            ? 'bg-[var(--accent-light)]/50 ring-1 ring-[var(--accent-muted)]'
                            : 'bg-[var(--bg-surface-hover)]/40'
                        }`}
                      >
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {sunEvent
                            ? sunEvent === 'sunrise'
                              ? 'Sunrise'
                              : 'Sunset'
                            : i === 0
                              ? 'Now'
                              : formatHour(h.time)}
                        </span>
                        {sunEvent ? (
                          <SunEventIcon
                            event={sunEvent}
                            className="h-6 w-6 text-[var(--text-primary)]"
                          />
                        ) : (
                          <span className="text-base">{getCondIcon(h.condition)}</span>
                        )}
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {formatTempShort(h.temperature, units)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {locationOff && (
          <div className="mt-4 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-hover)]/50 rounded-lg px-3 py-2">
            Location blocked. Allow in your browser settings.
          </div>
        )}
        {gpsOff && !locationOff && (
          <div className="mt-4">
            <button
              onClick={requestLocation}
              className="w-full text-sm bg-[var(--bg-surface-hover)] text-[var(--text-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)]/70 transition-colors"
            >
              Retry GPS
            </button>
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
                      {formatTempShort(h.tempMax, units)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTempShort(h.tempMin, units)}
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
