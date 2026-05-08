import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// ─── In-Memory Cache ───────────────────────────────────────────────────────────
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(config: any): string {
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}${config.params ? ':' + JSON.stringify(config.params) : ''}`;
}

// Request interceptor: serve from cache if available
api.interceptors.request.use(
  (config) => {
    if (config.method?.toLowerCase() !== 'get') return config;
    if ((config as any).skipCache) return config;

    const key = getCacheKey(config);
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < DEFAULT_TTL_MS) {
      // Mark config so response interceptor knows to return cached data
      (config as any).__cachedData = entry.data;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: store in cache and serve cached data
api.interceptors.response.use(
  (res) => {
    const config = res.config;

    // Return cached data if it was a cache hit
    if ((config as any).__cachedData) {
      return { ...res, data: (config as any).__cachedData, status: 200, statusText: 'OK (cached)' } as any;
    }

    // Store successful GET responses in cache
    if (config.method?.toLowerCase() === 'get' && !(config as any).skipCache) {
      const key = getCacheKey(config);
      cache.set(key, { data: res.data, timestamp: Date.now() });
    }

    return res;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !error.config?.skipAuthRedirect &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to clear the entire cache or a specific URL pattern
export function clearApiCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
