'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUnits } from '@/context/UnitContext';
import { WeatherIcon } from '@/components/WeatherIcon';
import WeatherAtmosphere from '@/components/weather/WeatherAtmosphere';
import SunEventIcon from '@/components/weather/SunEventIcon';
import { formatTempShort, formatSpeed, formatPrecip } from '@/lib/units';
import api from '@/lib/api';

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface ForecastDay {
  date: string;
  dayName: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
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
  sunEvent: SunEvent | null;
}

interface AirQuality {
  europeanAqi: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

type SunEvent = 'sunrise' | 'sunset';

interface HistoryDay {
  date: string;
  dayName: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
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

export default function CityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();
  const { units } = useUnits();

  const [city, setCity] = useState<City | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryDay[]>([]);
  const [historyLimit, setHistoryLimit] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHourly, setShowHourly] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/cities/${id}/details`);
        if (cancelled) return;
        const data = res.data;
        setCity(data.city);
        setCurrent(data.currentWeather);
        setForecast(data.forecast);
        setHourly(data.hourly || []);
        setAirQuality(data.airQuality || null);
        const reversed = (data.history || [])
          .map((h: any) => ({
            ...h,
            dayName: new Date(h.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
          }))
          .reverse();
        setAllHistory(reversed);
        setHistory(reversed.slice(0, 7));
      } catch {
        setError('Failed to load city data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (allHistory.length > 0) {
      setHistory(allHistory.slice(0, historyLimit));
    }
  }, [historyLimit, allHistory]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-muted)]">Loading city details...</p>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-[var(--danger)] mb-4">{error || 'City not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] mb-6 transition-colors"
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
            className="mr-2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </button>

        {/* City Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-sm)] relative overflow-hidden mb-8"
        >
          {current && <WeatherAtmosphere condition={current.condition} intensity="card" />}

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)] mb-1">
                {city.name}
              </h1>
              <p className="text-[var(--text-muted)]">{city.country}</p>
            </div>

            {current && (
              <div className="flex items-center gap-4">
                <WeatherIcon condition={current.condition} className="text-4xl" />
                <div>
                  <div className="text-4xl font-light text-[var(--text-primary)]">
                    {formatTempShort(current.temperature, units)}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] capitalize">
                    {current.condition}
                  </div>
                </div>
              </div>
            )}
          </div>

          {current && (
            <>
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Feels Like</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    {formatTempShort(current.feelsLike, units)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Humidity</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    {current.humidity}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Wind</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    {formatSpeed(current.windSpeed, units)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Precipitation</p>
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    {formatPrecip(current.precipitation, units)}
                  </p>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                {forecast[0]?.sunrise && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Sunrise</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {formatTime(forecast[0].sunrise)}
                    </p>
                  </div>
                )}
                {forecast[0]?.sunset && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Sunset</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {formatTime(forecast[0].sunset)}
                    </p>
                  </div>
                )}
                {forecast[0]?.uvIndexMax !== null && forecast[0]?.uvIndexMax !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">UV Index</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {forecast[0].uvIndexMax}
                    </p>
                  </div>
                )}
                {airQuality?.usAqi !== null && airQuality?.usAqi !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">AQI (US)</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {airQuality.usAqi}
                    </p>
                  </div>
                )}
                {airQuality?.europeanAqi !== null && airQuality?.europeanAqi !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">AQI (EU)</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {airQuality.europeanAqi}
                    </p>
                  </div>
                )}
                {airQuality?.pm25 !== null && airQuality?.pm25 !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">PM2.5</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {airQuality.pm25.toFixed(1)} µg/m³
                    </p>
                  </div>
                )}
                {airQuality?.pm10 !== null && airQuality?.pm10 !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-1">PM10</p>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {airQuality.pm10.toFixed(1)} µg/m³
                    </p>
                  </div>
                )}
              </div>

              {/* Hourly Forecast merged into card */}
              {hourly.length > 0 && (
                <div className="relative z-10 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => setShowHourly(!showHourly)}
                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1"
                  >
                    Hourly Forecast
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
                      <div className="flex gap-3 min-w-max">
                        {hourly.slice(0, 48).map((h, i) => {
                          const sunEvent = h.sunEvent;

                          return (
                            <div
                              key={h.time}
                              className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl min-w-[72px] first:ml-0.5 ${
                                i === 0
                                  ? 'bg-[var(--accent-light)]/50 ring-1 ring-[var(--accent-muted)]'
                                  : 'bg-[var(--bg-surface-hover)]/40'
                              }`}
                            >
                              <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase">
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
                                <span className="text-lg">{getCondIcon(h.condition)}</span>
                              )}
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {formatTempShort(h.temperature, units)}
                              </span>
                              {h.precipitationProbability > 0 && (
                                <span className="text-[10px] text-[var(--accent)]">
                                  {h.precipitationProbability}%
                                </span>
                              )}
                              {h.uvIndex > 0 && (
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  UV {h.uvIndex}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="font-display text-xl text-[var(--text-primary)] mb-4">7-Day Forecast</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]/50">
                    <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                      Day
                    </th>
                    <th className="text-center px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                      Condition
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                      High
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                      Low
                    </th>
                    <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium hidden sm:table-cell">
                      Rain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((day, i) => (
                    <tr
                      key={day.date}
                      className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)]/30 ${i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-surface-hover)]/20'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-[var(--text-primary)] font-medium block">
                          {day.dayName}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs">
                          {day.formattedDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <WeatherIcon condition={day.condition} className="text-lg" />
                          <span className="text-[var(--text-secondary)] capitalize hidden sm:inline">
                            {day.condition}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-primary)] font-medium">
                        {formatTempShort(day.tempMax, units)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                        {formatTempShort(day.tempMin, units)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)] hidden sm:table-cell">
                        {day.precipitation > 0 ? formatPrecip(day.precipitation, units) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Past Weather */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-[var(--text-primary)]">Past Weather</h2>
            {allHistory.length > 7 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setHistoryLimit(7)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    historyLimit === 7
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]/70'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setHistoryLimit(14)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    historyLimit === 14
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]/70'
                  }`}
                >
                  14 Days
                </button>
              </div>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">No historical data available.</p>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-hover)]/50">
                      <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                        Day
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                        Condition
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                        High
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium">
                        Low
                      </th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-medium hidden sm:table-cell">
                        Rain
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((day, i) => (
                      <tr
                        key={day.date}
                        className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)]/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-surface-hover)]/20'}`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[var(--text-primary)] font-medium block">
                            {day.dayName}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">
                            {day.formattedDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <WeatherIcon condition={day.condition} className="text-lg" />
                            <span className="text-[var(--text-secondary)] capitalize hidden sm:inline">
                              {day.condition}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--text-primary)] font-medium">
                          {formatTempShort(day.tempMax, units)}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                          {formatTempShort(day.tempMin, units)}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--text-muted)] hidden sm:table-cell">
                          {formatPrecip(day.precipitation, units)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
