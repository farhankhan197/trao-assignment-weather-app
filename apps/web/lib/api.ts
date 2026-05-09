import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// cached data
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// 5 minute time to live for cache entries
const DEFAULT_TTL_MS = 5 * 60 * 1000; 

function getCacheKey(config: AxiosRequestConfig): string {
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}${config.params ? ':' + JSON.stringify(config.params) : ''}`;
}

//interceptor to validate cache entry
api.interceptors.request.use(
  (config: any) => {
    if (config.method?.toLowerCase() !== 'get') return config;
    if (config.skipCache) return config;

    const key = getCacheKey(config);
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < DEFAULT_TTL_MS) {
      config.__cachedData = entry.data;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//interceptor to invalidate cache entry
api.interceptors.response.use(
  (res) => {
    const config = res.config as any;

    if (config.__cachedData) {
      return { 
        ...res, 
        data: config.__cachedData, 
        status: 200, 
        statusText: 'OK (cached)' 
      } as AxiosResponse<unknown>;
    }

    if (config.method?.toLowerCase() === 'get' && !config.skipCache) {
      const key = getCacheKey(config);
      cache.set(key, { data: res.data, timestamp: Date.now() });
    }

    const method = config.method?.toLowerCase();
    if (method && ['post', 'patch', 'put', 'delete'].includes(method)) {
      const url = config.url || '';

      for (const key of cache.keys()) {
        if (!key.startsWith('GET:')) continue;
        const cacheUrl = key.split(':')[1];
        if (cacheUrl === url || cacheUrl.startsWith(url + '/')) {
          cache.delete(key);
        }
      }

      const parentMatch = url.match(/^(.*)\/[^/]+$/);
      if (parentMatch) {
        const parentUrl = parentMatch[1];
        for (const key of cache.keys()) {
          if (key === `GET:${parentUrl}` || key.startsWith(`GET:${parentUrl}:`)) {
            cache.delete(key);
          }
        }
      }
    }

    return res;
  }, // <--- Fixed: Added missing comma
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

//helper to clear cache
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
