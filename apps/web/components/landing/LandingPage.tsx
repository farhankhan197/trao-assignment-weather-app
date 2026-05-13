'use client';

import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="relative">
      <LandingHeader />
      <HeroSection />
      <Footer />
    </div>
  );
}
