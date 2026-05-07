'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAIChat } from '@/context/AIChatContext';

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
  const { toggle: toggleChat } = useAIChat();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight">
          Mausam
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Dashboard
              </Link>
              <Link href="/favorites" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Favorites
              </Link>
              <button
                onClick={toggleChat}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                AI Assistant
              </button>
              <Link href="/settings" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Settings
              </Link>
              <Link href="/alerts" className="relative flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <BellIcon />
                <span>Alerts</span>
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[var(--danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                )}
              </Link>
              <span className="text-[var(--text-muted)]">|</span>
              <span className="text-[var(--text-muted)]">{user.name}</span>
              <button
                onClick={logout}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg transition-colors"
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
