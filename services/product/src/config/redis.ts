import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      enableOfflineQueue: false,
      // Retry strategy — don't hammer Redis on reconnect
      retryStrategy(times) {
        if (times > 10) {
          console.error('Redis: max retries reached. Giving up.');
          return null; // stop retrying
        }
        return Math.min(times * 200, 3000); // wait up to 3s between retries
      },
      lazyConnect: true, // don't connect until first command
    });

    redisClient.on('connect', () => console.warn('[redis] Connected'));
    redisClient.on('error',   (err) => console.error('[redis] Error:', err.message));
    redisClient.on('close',   () => console.warn('[redis] Connection closed'));
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
