import { getRedisClient } from '../config/redis';
import { env } from '../config/env';

class RedisService {
  private client = getRedisClient();

  // ─── Core get/set/delete ──────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      // Redis failure should NEVER crash the request — fall through to DB
      console.error(`[redis] GET failed for key: ${key}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialised = JSON.stringify(value);
      const ttl = ttlSeconds ?? env.PRODUCT_CACHE_TTL;
      await this.client.setex(key, ttl, serialised);
    } catch {
      console.error(`[redis] SET failed for key: ${key}`);
      // Silently fail — the DB is the source of truth, cache is optional
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      console.error(`[redis] DEL failed for key: ${key}`);
    }
  }

  // ─── Pattern delete (invalidate all product list caches) ──────────────────
  // When a product is updated, ALL cached product lists may be stale.
  // We delete every key matching the pattern products:* to ensure consistency.

  async deletePattern(pattern: string): Promise<void> {
    try {
      // SCAN is non-blocking — safe for production (unlike KEYS which blocks Redis)
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH', pattern,
          'COUNT', 100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      console.error(`[redis] deletePattern failed for: ${pattern}`);
    }
  }

  // ─── Cache-aside helper ───────────────────────────────────────────────────
  // The standard "check cache → DB fallback → populate cache" pattern
  // wrapped into one clean method to avoid repetition.

  async cacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // 1. Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // 2. Cache miss — go to DB
    const fresh = await fetcher();

    // 3. Populate cache (don't await — fire and forget to keep response fast)
    this.set(key, fresh, ttlSeconds).catch(() => {});

    return fresh;
  }

  // ─── Health check ─────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const redisService = new RedisService();
