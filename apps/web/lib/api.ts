import axios from 'axios';
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttlMs: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 50;
const STORAGE_KEY = 'mausam_api_cache';
const DEBUG = typeof window !== 'undefined' && (window as any).__API_CACHE_DEBUG === true;

// ─── In-memory store + LRU tracker ───────────────────────────────────────────
const cache = new Map<string, CacheEntry>();
let lruQueue: string[] = [];

// ─── SessionStorage helpers ──────────────────────────────────────────────────
function saveToStorage() {
  try {
    const payload = Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      data: entry.data,
      timestamp: entry.timestamp,
      ttlMs: entry.ttlMs,
    }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      key: string;
      data: unknown;
      timestamp: number;
      ttlMs: number;
    }[];
    const now = Date.now();
    for (const item of parsed) {
      if (now - item.timestamp < item.ttlMs) {
        cache.set(item.key, {
          data: item.data,
          timestamp: item.timestamp,
          ttlMs: item.ttlMs,
        });
        lruQueue.push(item.key);
      }
    }
    if (DEBUG) console.log(`[API Cache] Hydrated ${cache.size} entries from sessionStorage`);
  } catch {
    // Ignore parse errors
  }
}

// Hydrate on module load (browser only)
if (typeof window !== 'undefined') {
  loadFromStorage();
}

// ─── LRU helpers ────────────────────────────────────────────────────────────
function touchKey(key: string) {
  lruQueue = lruQueue.filter((k) => k !== key);
  lruQueue.push(key);
}

function evictIfNeeded() {
  while (lruQueue.length > MAX_CACHE_SIZE) {
    const oldest = lruQueue.shift();
    if (oldest) {
      cache.delete(oldest);
      if (DEBUG) console.log(`[API Cache] Evicted ${oldest}`);
    }
  }
}

function setCacheEntry(key: string, entry: CacheEntry) {
  cache.set(key, entry);
  touchKey(key);
  evictIfNeeded();
  saveToStorage();
}

function getCacheEntry(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  const expired = Date.now() - entry.timestamp > entry.ttlMs;
  if (expired) {
    cache.delete(key);
    lruQueue = lruQueue.filter((k) => k !== key);
    saveToStorage();
    if (DEBUG) console.log(`[API Cache] Expired ${key}`);
    return undefined;
  }

  touchKey(key);
  return entry;
}

// ─── Cache key builder ──────────────────────────────────────────────────────
function getCacheKey(config: AxiosRequestConfig): string {
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || '';
  const params = config.params ? ':' + JSON.stringify(config.params) : '';
  return `${method}:${url}${params}`;
}

// ─── Request interceptor ─────────────────────────────────────────────────────
// If we have a valid cached entry, short-circuit the network request entirely.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.method?.toLowerCase() !== 'get') return config;
    if ((config as any).skipCache) return config;

    const key = getCacheKey(config);
    const entry = getCacheEntry(key);

    if (entry) {
      if (DEBUG) console.log(`[API Cache] HIT ${key}`);
      // Return a promise that resolves to a fake AxiosResponse
      // This prevents the actual HTTP request from firing.
      return Promise.resolve({
        data: entry.data,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config,
        request: {},
      }) as unknown as Promise<InternalAxiosRequestConfig>;
    }

    if (DEBUG) console.log(`[API Cache] MISS ${key}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (res: AxiosResponse) => {
    const config = res.config as InternalAxiosRequestConfig & { skipCache?: boolean };

    // Don't cache error responses
    if (res.status >= 400) return res;

    if (config.method?.toLowerCase() === 'get' && !config.skipCache) {
      const key = getCacheKey(config);
      const ttlMs = (config as any).cacheTTL || DEFAULT_TTL_MS;
      setCacheEntry(key, { data: res.data, timestamp: Date.now(), ttlMs });
      if (DEBUG) console.log(`[API Cache] SET ${key} (TTL=${ttlMs}ms)`);
    }

    // Invalidate related GET entries on mutations
    const method = config.method?.toLowerCase();
    if (method && ['post', 'patch', 'put', 'delete'].includes(method)) {
      const url = config.url || '';
      const keysToDelete: string[] = [];

      for (const key of cache.keys()) {
        if (!key.startsWith('GET:')) continue;
        const cacheUrl = key.split(':')[1];
        if (cacheUrl === url || cacheUrl.startsWith(url + '/')) {
          keysToDelete.push(key);
        }
      }

      const parentMatch = url.match(/^(.*)\/[^/]+$/);
      if (parentMatch) {
        const parentUrl = parentMatch[1];
        for (const key of cache.keys()) {
          if (key === `GET:${parentUrl}` || key.startsWith(`GET:${parentUrl}:`)) {
            if (!keysToDelete.includes(key)) keysToDelete.push(key);
          }
        }
      }

      for (const key of keysToDelete) {
        cache.delete(key);
        lruQueue = lruQueue.filter((k) => k !== key);
        if (DEBUG) console.log(`[API Cache] INVALIDATED ${key}`);
      }
      saveToStorage();
    }

    return res;
  },
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !(error.config as any)?.skipAuthRedirect &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clear the entire API cache or entries matching a pattern. */
export function clearApiCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    lruQueue = [];
    saveToStorage();
    if (DEBUG) console.log('[API Cache] Cleared all');
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      lruQueue = lruQueue.filter((k) => k !== key);
    }
  }
  saveToStorage();
  if (DEBUG) console.log(`[API Cache] Cleared pattern: ${pattern}`);
}

/** Enable/disable debug logging for the API cache. */
export function setApiCacheDebug(enabled: boolean) {
  if (typeof window !== 'undefined') {
    (window as any).__API_CACHE_DEBUG = enabled;
  }
}
