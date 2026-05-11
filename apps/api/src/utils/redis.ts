import { Redis } from '@upstash/redis';

const url = process.env.REDIS_URL;
const token = process.env.REDIS_TOKEN;

let redis: Redis;

if (!url || !token) {
  console.warn('[Redis] REDIS_URL or REDIS_TOKEN not set. Caching is disabled.');
  // Create a no-op Redis-compatible stub for local dev without Redis
  redis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
  } as unknown as Redis;
} else {
  redis = new Redis({ url, token });
}

export default redis;

// Simple connectivity test — logs result on first import
(async () => {
  if (!url || !token) {
    console.log('[Redis] Running in no-op mode (no env vars).');
    return;
  }
  try {
    const ping = await redis.ping();
    console.log(`[Redis] Connected. PING = ${ping}`);
  } catch (err) {
    console.error('[Redis] Connection failed:', err);
  }
})();
