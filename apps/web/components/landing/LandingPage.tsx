'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/context/SessionContext';
import api from '@/lib/api';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import Footer from './Footer';
import MausamLoader from '../weather/mausamLoader';

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
}

interface WeatherData {
  icon: string;
  temp: number;
  city: string;
  desc: string;
  delay: number;
}

const DEMO_WEATHER: WeatherData[] = [
  { icon: '☀️', temp: 34, city: 'Mumbai', desc: 'Sunny', delay: 600 },
  { icon: '🌧️', temp: 22, city: 'Delhi', desc: 'Rainy', delay: 700 },
  { icon: '⛅', temp: 28, city: 'Bhopal', desc: 'Cloudy', delay: 800 },
  { icon: '🌤️', temp: 19, city: 'Shimla', desc: 'Clear', delay: 900 },
];

function getConditionIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  return '⛈️';
}

function getConditionDesc(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  return 'Stormy';
}

export default function LandingPage() {
  const { user, loading: authLoading } = useSession();
  const [weatherData, setWeatherData] = useState<WeatherData[]>(DEMO_WEATHER);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await api.get('/api/cities');
      const cities: City[] = res.data.cities || [];
      const favorites = cities.filter((c) => c.isFavorite);

      if (favorites.length === 0) {
        setWeatherData(DEMO_WEATHER);
        return;
      }

      const top4 = favorites.slice(0, 4);
      const weatherPromises = top4.map(async (city, idx) => {
        try {
          const wRes = await api.get('/api/weather/current', {
            params: { lat: city.lat, lon: city.lon },
          });
          const data = wRes.data;
          return {
            icon: getConditionIcon(data.current.weather_code),
            temp: Math.round(data.current.temperature_2m),
            city: city.name,
            desc: getConditionDesc(data.current.weather_code),
            delay: 600 + idx * 100,
          };
        } catch {
          return {
            icon: '☀️',
            temp: 25,
            city: city.name,
            desc: 'Sunny',
            delay: 600 + idx * 100,
          };
        }
      });

      const results = await Promise.all(weatherPromises);
      setWeatherData(results);
    } catch {
      setWeatherData(DEMO_WEATHER);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchFavorites();
      } else {
        setWeatherData(DEMO_WEATHER);
        setLoading(false);
      }
    }
  }, [authLoading, user, fetchFavorites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <MausamLoader variant="inline" hint="Mausam kaisa hai?" />
      </div>
    );
  }

  const ctaPrimary = user
    ? { text: 'Go to Dashboard', href: '/dashboard' }
    : { text: 'Get Started Free', href: '/register' };

  const ctaSecondary = user
    ? { text: 'View Favorites', href: '/favorites' }
    : { text: 'Log In', href: '/login' };

  return (
    <div className="relative">
      <LandingHeader />
      <HeroSection weatherData={weatherData} ctaPrimary={ctaPrimary} ctaSecondary={ctaSecondary} />
      <Footer />
    </div>
  );
}
