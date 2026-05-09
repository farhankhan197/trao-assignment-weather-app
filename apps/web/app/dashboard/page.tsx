'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CitySearch } from '@/components/CitySearch';
import { CityCard } from '@/components/CityCard';
import api from '@/lib/api';

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
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
  const { loading: authLoading } = useRequireAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    try {
      const res = await api.get('/api/cities');
      setCities(res.data.cities || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleAdd = async (result: SearchResult) => {
    try {
      const res = await api.post('/api/cities', {
        name: result.name,
        country: result.country,
        countryCode: result.countryCode,
        lat: result.lat,
        lon: result.lon,
      });
      setCities((prev) => [res.data.city, ...prev]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        alert('City already added to your dashboard');
      } else {
        alert('Failed to add city');
      }
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await api.patch(`/api/cities/${id}`);
      setCities((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isFavorite: res.data.city.isFavorite } : c))
      );
    } catch {
      alert('Failed to update favorite');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this city from your dashboard?')) return;
    try {
      await api.delete(`/api/cities/${id}`);
      setCities((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to remove city');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Loading cities...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Full-width gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(37,99,235,0.08) 0%, transparent 60%)',
        }}
      />
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

        {cities.length === 0 ? (
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
            {cities.map((city) => (
              <motion.div
                key={city._id}
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
                  city={city}
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
