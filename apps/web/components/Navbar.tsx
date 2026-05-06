'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

export function Navbar() {
  const { user, logout, unreadAlertCount } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight">
          Mausam
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">
                Dashboard
              </Link>
              <Link href="/favorites" className="text-slate-400 hover:text-slate-200 transition-colors">
                Favorites
              </Link>
              <Link href="/ai-briefing" className="text-slate-400 hover:text-slate-200 transition-colors">
                AI Briefing
              </Link>
              <Link href="/alerts" className="relative text-slate-400 hover:text-slate-200 transition-colors">
                <BellIcon />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                )}
              </Link>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{user.name}</span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-400 hover:text-slate-200 transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
