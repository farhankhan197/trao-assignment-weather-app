'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/context/SessionContext';
import { useAIChat } from '@/context/AIChatContext';
import { Logo } from '@/components/Logo';

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </>
      )}
    </svg>
  );
}

function NavLink({
  href,
  label,
  pathname,
  badge,
  icon,
}: {
  href: string;
  label: string;
  pathname: string;
  badge?: number;
  icon?: React.ReactNode;
}) {
  const isActive = pathname === href;
  return (
    <Link href={href} className="relative px-3 py-1.5 rounded-lg text-sm transition-colors">
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-white/20 rounded-lg"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-white font-medium' : 'text-white/70 hover:text-white'}`}
      >
        {icon}
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="bg-[var(--danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
    </Link>
  );
}

function MobileLink({
  href,
  label,
  pathname,
  badge,
}: {
  href: string;
  label: string;
  pathname: string;
  badge?: number;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-white/20 text-white font-medium'
          : 'text-white/70 hover:text-white hover:bg-white/20'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[var(--danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout, unreadAlertCount } = useSession();
  const { toggle: toggleChat } = useAIChat();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [profileOpen]);

  if (pathname === '/') return null;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="absolute inset-0 bg-[#0a1628] border-b border-[#1a3a5c]" />

      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Logo variant="light" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 text-sm">
          {loading ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-[72px] rounded-lg animate-shimmer" />
              ))}
              <div className="w-px h-5 bg-white/20 mx-1" />
              <div className="h-8 w-[88px] rounded-lg animate-shimmer" />
              <div className="h-8 w-8 rounded-full animate-shimmer ml-1" />
            </div>
          ) : user ? (
            <>
              <NavLink href="/dashboard" label="Dashboard" pathname={pathname} />
              <NavLink href="/favorites" label="Favorites" pathname={pathname} />
              <NavLink
                href="/alerts"
                label="Alerts"
                pathname={pathname}
                badge={unreadAlertCount}
                icon={<BellIcon />}
              />
              <NavLink href="/settings" label="Settings" pathname={pathname} />

              <div className="w-px h-5 bg-white/20 mx-1" />

              <button
                onClick={toggleChat}
                className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all text-sm"
              >
                AI Assistant
              </button>

              {/* Profile dropdown */}
              <div className="relative profile-dropdown ml-1">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-400 flex items-center justify-center text-white text-xs font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:inline text-sm">{user.name}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[var(--border)] overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {user.name}
                        </p>
                        {user.email && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{user.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <NavLink href="/login" label="Sign In" pathname={pathname} />
              <Link
                href="/register"
                className="bg-white text-[var(--accent)] hover:bg-[var(--accent-light)] px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden relative overflow-hidden bg-[#0a1628] border-b border-[#1a3a5c]"
          >
            <div className="px-4 py-4 space-y-1">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-full rounded-lg animate-shimmer" />
                  ))}
                </div>
              ) : user ? (
                <>
                  <MobileLink href="/dashboard" label="Dashboard" pathname={pathname} />
                  <MobileLink href="/favorites" label="Favorites" pathname={pathname} />
                  <MobileLink
                    href="/alerts"
                    label="Alerts"
                    pathname={pathname}
                    badge={unreadAlertCount}
                  />
                  <MobileLink href="/settings" label="Settings" pathname={pathname} />
                  <div className="pt-2 border-t border-white/20 mt-2">
                    <button
                      onClick={toggleChat}
                      className="w-full text-left px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors text-sm"
                    >
                      AI Assistant
                    </button>
                  </div>
                  <div className="pt-2 border-t border-white/20 flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-400 flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="text-sm text-[var(--danger)] hover:bg-[var(--danger-light)] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <MobileLink href="/login" label="Sign In" pathname={pathname} />
                  <Link
                    href="/register"
                    className="block text-center bg-white text-[var(--accent)] px-4 py-2.5 rounded-lg font-medium text-sm mt-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
