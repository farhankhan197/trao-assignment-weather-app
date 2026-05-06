'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const { user, loading: authLoading } = useRequireAuth();
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
    } catch (err: any) {
      if (err.response?.status === 409) {
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
        <p className="text-slate-400">Loading cities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl mb-2">Dashboard</h1>
        <p className="text-slate-400">Search and manage your cities</p>
      </div>

      <div className="mb-10">
        <CitySearch onAdd={handleAdd} />
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🌍</p>
          <h2 className="font-display text-xl mb-2">No cities yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Search for a city above to add it to your dashboard. You'll see live weather and streaks for each city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cities.map((city) => (
            <CityCard
              key={city._id}
              city={city}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
