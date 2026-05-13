'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CitySearch } from '@/components/CitySearch';
import { CityCard } from '@/components/CityCard';
import { LocalWeatherSidebar } from '@/components/LocalWeatherSidebar';
import api from '@/lib/api';
import { getCondition } from '@/lib/weather';

interface CityData {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
  currentWeather: {
    temperature: number;
    condition: string;
    tempMax: number;
    tempMin: number;
  };
  streak: { label: string } | null;
}

interface SearchResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  state: string | null;
}

export default function DashboardPage() {
  const { user } = useRequireAuth();
  const [dashboard, setDashboard] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard');
      setDashboard(res.data.cities || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchDashboard();
    else setLoading(false);
  }, [user, fetchDashboard]);

  const handleAdd = useCallback(async (result: SearchResult) => {
    try {
      const res = await api.post('/api/cities', {
        name: result.name,
        country: result.country,
        countryCode: result.countryCode,
        lat: result.lat,
        lon: result.lon,
      });
      // Fetch weather for the new city only, then append
      const wRes = await api
        .get('/api/weather/current', { params: { lat: result.lat, lon: result.lon } })
        .catch(() => null);
      const weather = wRes
        ? {
            temperature: wRes.data.current.temperature_2m,
            condition: getCondition(wRes.data.current.weather_code),
            tempMax: wRes.data.daily?.temperature_2m_max?.[0] ?? wRes.data.current.temperature_2m,
            tempMin: wRes.data.daily?.temperature_2m_min?.[0] ?? wRes.data.current.temperature_2m,
          }
        : { temperature: 0, condition: 'sunny', tempMax: 0, tempMin: 0 };
      setDashboard((prev) => [
        { ...res.data.city, currentWeather: weather, streak: null },
        ...prev,
      ]);
    } catch {
      alert('Failed to add city');
    }
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const res = await api.patch(`/api/cities/${id}`);
      setDashboard((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isFavorite: res.data.city.isFavorite } : c))
      );
    } catch {
      alert('Failed to update favorite');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remove this city from your dashboard?')) return;
    try {
      await api.delete(`/api/cities/${id}`);
      setDashboard((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to remove city');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading your cities...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1
            className="font-display text-3xl text-[var(--text-primary)] mb-1"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Search and manage your cities</p>
        </div>

        <div className="relative mb-8">
          <CitySearch onAdd={handleAdd} />
        </div>

        <div className="mb-8">
          <LocalWeatherSidebar />
        </div>

        {dashboard.length === 0 ? (
          <div className="relative text-center py-20">
            <h2 className="font-display text-xl mb-2 text-[var(--text-primary)]">No cities yet</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
              Search for a city above to add it to your dashboard. You&apos;ll see live weather and
              streaks for each city.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {dashboard.map((item) => (
              <motion.div
                key={item._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 300, damping: 24 },
                  },
                }}
              >
                <CityCard
                  city={item}
                  weatherData={item.currentWeather}
                  streak={item.streak?.label || null}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
