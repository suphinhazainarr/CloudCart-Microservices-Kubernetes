import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { errorResponse } from '@cloudcart/shared';
import { env } from '../config/env';

const makeStore = () => undefined;

// General API rate limit — 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs:        env.RATE_LIMIT_WINDOW_MS,
  max:             env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeStore(),
  keyGenerator:    (req) => {
    // Use user ID for authenticated requests (fairer than IP behind load balancer)
    return (req as any).user?.userId ?? req.ip ?? 'anonymous';
  },
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many requests. Please slow down.')
    );
  },
});

// Strict auth rate limit — 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs:             env.RATE_LIMIT_WINDOW_MS,
  max:                  env.AUTH_RATE_LIMIT_MAX,
  standardHeaders:      true,
  legacyHeaders:        false,
  store:                makeStore(),
  skipSuccessfulRequests: true, // only failed attempts count
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many authentication attempts. Try again in 15 minutes.')
    );
  },
});
