import Redis from 'ioredis';
import { env } from './env';

// ─── Simple In-Memory Mock Fallback ──────────────────────────────────────────
class InMemoryRedisMock {
  private store: Record<string, Record<string, string>> = {};

  async hgetall(key: string) {
    return this.store[key] ?? {};
  }

  async hget(key: string, field: string) {
    return this.store[key]?.[field] ?? null;
  }

  async hset(key: string, field: string, value: string) {
    if (!this.store[key]) this.store[key] = {};
    this.store[key][field] = value;
    return 1;
  }

  async expire(key: string, ttl: number) {
    return 1;
  }

  async hdel(key: string, field: string) {
    if (this.store[key] && this.store[key][field] !== undefined) {
      delete this.store[key][field];
      return 1;
    }
    return 0;
  }

  async del(key: string) {
    if (this.store[key] !== undefined) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  pipeline() {
    const commands: (() => void)[] = [];
    const self = this;
    return {
      del(key: string) {
        commands.push(() => self.del(key));
        return this;
      },
      hset(key: string, field: string, value: string) {
        commands.push(() => self.hset(key, field, value));
        return this;
      },
      expire(key: string, ttl: number) {
        commands.push(() => self.expire(key, ttl));
        return this;
      },
      exec: async () => {
        for (const cmd of commands) cmd();
        return [];
      }
    };
  }

  async ping() {
    return 'PONG';
  }
}

const mockClient = new InMemoryRedisMock();
let redisClient: any = null;
let useMock = false;

export const getRedisClient = (): Redis => {
  if (useMock) {
    return mockClient as any;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      retryStrategy(times) {
        // Fail quickly in development if Redis is offline to activate mock
        if (env.NODE_ENV !== 'production' && times > 1) {
          useMock = true;
          console.warn('[cart:redis] Redis is offline. Falling back to clean in-memory storage.');
          return null; // Stop retrying
        }
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.warn('[cart:redis] Connected');
    });

    redisClient.on('error', (err: any) => {
      console.error('[cart:redis] Error:', err.message);
      if (env.NODE_ENV !== 'production') {
        useMock = true;
        console.warn('[cart:redis] Switch to in-memory mock client active.');
      }
    });
  }

  // Create a handler Proxy to dynamically switch to the mock client if offline
  const handler = {
    get(target: any, prop: string) {
      if (useMock) {
        return (mockClient as any)[prop];
      }
      const val = target[prop];
      if (typeof val === 'function') {
        return function(this: any, ...args: any[]) {
          try {
            const result = val.apply(target, args);
            // If it returns a promise, catch connection errors and trigger fallback
            if (result && typeof result.catch === 'function') {
              return result.catch((err: any) => {
                if (err.message.includes('closed') || err.message.includes('ECONNREFUSED')) {
                  useMock = true;
                  console.warn('[cart:redis] Redis query failed because connection is closed. Swapped to in-memory store.');
                  return (mockClient as any)[prop](...args);
                }
                throw err;
              });
            }
            return result;
          } catch (err: any) {
            if (err.message.includes('closed') || err.message.includes('ECONNREFUSED')) {
              useMock = true;
              console.warn('[cart:redis] Redis query failed because connection is closed. Swapped to in-memory store.');
              return (mockClient as any)[prop](...args);
            }
            throw err;
          }
        };
      }
      return val;
    }
  };

  return new Proxy(redisClient, handler) as any;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && typeof redisClient.quit === 'function') {
    await redisClient.quit().catch(() => {});
    redisClient = null;
  }
};
