'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useSession();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="min-h-screen flex items-center justify-center px-4 relative"
    >
      <div className="absolute inset-x-0 top-0 h-[30%] pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(37,99,235,0.03) 0%, transparent 100%)' }} />
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-center text-[var(--text-primary)] mb-1">Welcome back</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">Sign in to your Mausam account</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-md)]">
          {error && (
            <div className="bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--accent)] to-sky-400 hover:from-[var(--accent-hover)] hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[var(--text-muted)] text-sm mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">Register free</Link>
        </p>

        <div className="mt-6 bg-[var(--bg-input)]/50 border border-[var(--border)] rounded-xl p-4 text-center shadow-[var(--shadow-sm)]">
          <p className="text-[var(--accent)] text-sm font-medium mb-2">Try the Demo</p>
          <p className="text-[var(--text-muted)] text-xs mb-1">Email: <span className="text-[var(--text-secondary)]">test@mausam.me</span></p>
          <p className="text-[var(--text-muted)] text-xs mb-2">Password: <span className="text-[var(--text-secondary)]">password123</span></p>
          <button
            type="button"
            onClick={() => {
              setEmail('test@mausam.me');
              setPassword('password123');
            }}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] underline cursor-pointer"
          >
            Auto-fill credentials
          </button>
        </div>
      </div>
    </motion.div>
  );
}
