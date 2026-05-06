'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl text-center mb-2">Welcome back</h1>
        <p className="text-slate-400 text-center mb-8">Sign in to your Mausam account</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-sky-400 hover:text-sky-300">Register free</Link>
        </p>

        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-sky-400 text-sm font-medium mb-2">Try the Demo</p>
          <p className="text-slate-400 text-xs mb-1">Email: <span className="text-slate-300">test@mausam.me</span></p>
          <p className="text-slate-400 text-xs mb-2">Password: <span className="text-slate-300">password123</span></p>
          <button
            type="button"
            onClick={() => {
              setEmail('test@mausam.me');
              setPassword('password123');
            }}
            className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer"
          >
            Auto-fill credentials
          </button>
        </div>
      </div>
    </div>
  );
}
