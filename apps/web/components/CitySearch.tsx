'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface SearchResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  state: string | null;
}

interface Props {
  onAdd: (city: SearchResult) => void;
}

export function CitySearch({ onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/weather/search', { params: { q } });
      setResults(res.data.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (city: SearchResult) => {
    onAdd(city);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative max-w-xl mx-auto w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder="Search for a city..."
          className="w-full bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 pl-11 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:bg-white transition-all shadow-sm"
        />
        <svg
          className="absolute left-3.5 top-3.5 text-[var(--text-muted)]"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {loading && (
          <div className="absolute right-3.5 top-3.5">
            <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden z-50"
          >
            {results.map((city, i) => (
              <motion.button
                key={`${city.name}-${city.lat}-${city.lon}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.03,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                onClick={() => handleSelect(city)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-[var(--text-primary)] text-sm font-medium">
                    {city.name}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs ml-2">
                    {city.state ? `${city.state}, ` : ''}
                    {city.country}
                  </span>
                </div>
                <span className="text-xs text-[var(--accent)]">Add</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {open && query.trim() && !loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-muted)] z-50"
          >
            No cities found
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
