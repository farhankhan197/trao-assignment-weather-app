'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export default function LandingHeader() {
  const { user } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 sm:py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/">
          <Logo variant="light" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-[13px] font-medium tracking-wide
                border border-white/45 bg-white/[0.13] backdrop-blur-md
                transition-all duration-300 hover:bg-white/[0.22] hover:-translate-y-0.5"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/70 text-xs sm:text-[13px] tracking-wide transition-colors duration-300 hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-[13px] font-medium tracking-wide
                  border border-white/45 bg-white/[0.13] backdrop-blur-md
                  transition-all duration-300 hover:bg-white/[0.22] hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
