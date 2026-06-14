import Redis from 'ioredis';
import { env } from './env';

let client: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
      lazyConnect: false,
      enableOfflineQueue: false, // don't queue commands when Redis is down — fail fast
    });
    client.on('connect', () => console.warn('[gateway:redis] Connected'));
    client.on('error',   (e) => console.error('[gateway:redis] Error:', e.message));
  }
  return client;
};
