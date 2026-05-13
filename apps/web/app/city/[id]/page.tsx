'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { WeatherIcon } from '@/components/WeatherIcon';
import WeatherAtmosphere from '@/components/weather/WeatherAtmosphere';
import api from '@/lib/api';
import { getCondition } from '@/lib/weather';

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
}

interface HistoryDay {
  date: string;
  dayName: string;
  formattedDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

interface ApiHistoryDay {
  date: string;
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

export default function CityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth();

  const [city, setCity] = useState<City | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryDay[]>([]);
  const [historyLimit, setHistoryLimit] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [cityRes, historyRes] = await Promise.all([
        api.get(`/api/cities/${id}`),
        api.get(`/api/cities/${id}/history`),
      ]);

      const cityData = cityRes.data.city;
      setCity(cityData);

      // Fetch weather with correct city coords
      const wRes = await api.get('/api/weather/current', {
        params: { lat: cityData.lat, lon: cityData.lon },
      });

      const wCurrent = wRes.data.current;
      const wDaily = wRes.data.daily;

      setCurrent({
        temperature: wCurrent.temperature_2m,
        feelsLike: wCurrent.apparent_temperature,
        condition: getCondition(wCurrent.weather_code),
        humidity: wCurrent.relative_humidity_2m,
        windSpeed: wCurrent.wind_speed_10m,
        precipitation: wCurrent.precipitation,
      });

      const forecastDays: ForecastDay[] = [];
      for (let i = 0; i < wDaily.time.length; i++) {
        const d = new Date(wDaily.time[i]);
        forecastDays.push({
          date: wDaily.time[i],
          dayName: d.toLocaleDateString('en', { weekday: 'short' }),
          formattedDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          condition: getCondition(wDaily.weather_code[i]),
          tempMax: wDaily.temperature_2m_max[i],
          tempMin: wDaily.temperature_2m_min[i],
          precipitation: wDaily.precipitation_sum?.[i] ?? 0,
        });
      }
      setForecast(forecastDays);

      // History - all 15 days of historical data, reversed to show latest first
      const histData = historyRes.data.history;
      const allHistoryData = histData
        .map((h: ApiHistoryDay) => {
          const d = new Date(h.date);
          return {
            date: h.date,
            dayName: d.toLocaleDateString('en', { weekday: 'short' }),
            formattedDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            condition: h.condition,
            tempMax: h.tempMax,
            tempMin: h.tempMin,
            precipitation: h.precipitation,
          };
        })
        .reverse(); // Reverse to show latest (most recent) first
      setAllHistory(allHistoryData);
      setHistory(allHistoryData.slice(0, historyLimit));
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError<{ error?: string }>(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Failed to load city data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                    {Math.round(current.temperature)}°
                  </div>
                  <div className="text-sm text-[var(--text-muted)] capitalize">
                    {current.condition}
                  </div>
                </div>
              </div>
            )}
          </div>

          {current && (
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <div className="text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Feels Like</p>
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {Math.round(current.feelsLike)}°
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
                  {Math.round(current.windSpeed)} km/h
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Precipitation</p>
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {current.precipitation} mm
                </p>
              </div>
            </div>
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
                        {Math.round(day.tempMax)}°
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                        {Math.round(day.tempMin)}°
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text-muted)] hidden sm:table-cell">
                        {day.precipitation > 0 ? `${day.precipitation}mm` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Past Week */}
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
                          {Math.round(day.tempMax)}°
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                          {Math.round(day.tempMin)}°
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--text-muted)] hidden sm:table-cell">
                          {day.precipitation}mm
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
