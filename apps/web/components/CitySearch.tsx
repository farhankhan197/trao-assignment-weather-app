'use client';

import { useState, useCallback, useRef } from 'react';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
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
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Search for a city..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <svg className="absolute left-3.5 top-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        {loading && (
          <div className="absolute right-3.5 top-3.5">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {results.map((city, i) => (
            <button
              key={i}
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-slate-100 text-sm font-medium">{city.name}</span>
                <span className="text-slate-500 text-xs ml-2">{city.state ? `${city.state}, ` : ''}{city.country}</span>
              </div>
              <span className="text-xs text-sky-400">Add</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 z-50">
          No cities found
        </div>
      )}
    </div>
  );
}
