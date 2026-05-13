import redis from './redis.js';

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) {
      console.log(`[Cache MISS] ${key}`);
      return null;
    }
    console.log(`[Cache HIT] ${key}`);
    // @upstash/redis auto-parses JSON strings — avoid double-parse
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
    return data as T;
  } catch (error) {
    console.error('[Cache Get Error]', error);
    return null;
  }
};

export const setCachedData = async (key: string, data: unknown, ttlSeconds = 60 * 60 * 24) => {
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
    console.log(`[Cache SET] ${key} (TTL=${ttlSeconds}s)`);
  } catch (error) {
    console.error('[Cache Set Error]', error);
  }
};

const delCachedData = async (key: string) => {
  try {
    await redis.del(key);
    console.log(`[Cache DEL] ${key}`);
  } catch (error) {
    console.error('[Cache Del Error]', error);
  }
};
