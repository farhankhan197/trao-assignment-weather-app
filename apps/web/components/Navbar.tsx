'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

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
