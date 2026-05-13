'use client';

import { useSession } from '@/context/SessionContext';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import Footer from './Footer';

interface WeatherData {
  icon: string;
  temp: number;
  city: string;
  desc: string;
  delay: number;
}

const WEATHER_DATA: WeatherData[] = [
  { icon: '☀️', temp: 34, city: 'Mumbai', desc: 'Sunny', delay: 600 },
  { icon: '🌧️', temp: 22, city: 'Delhi', desc: 'Rainy', delay: 700 },
  { icon: '⛅', temp: 28, city: 'Bhopal', desc: 'Cloudy', delay: 800 },
  { icon: '🌤️', temp: 19, city: 'Shimla', desc: 'Clear', delay: 900 },
];

export default function LandingPage() {
  const { user } = useSession();

  const ctaPrimary = user
    ? { text: 'Go to Dashboard', href: '/dashboard' }
    : { text: 'Get Started Free', href: '/register' };

  const ctaSecondary = user
    ? { text: 'View Favorites', href: '/favorites' }
    : { text: 'Log In', href: '/login' };

  return (
    <div className="relative">
      <LandingHeader />
      <HeroSection weatherData={WEATHER_DATA} ctaPrimary={ctaPrimary} ctaSecondary={ctaSecondary} />
      <Footer />
    </div>
  );
}
