import rateLimit from 'express-rate-limit';
import { errorResponse } from '@cloudcart/shared';

// Strict limiter for auth endpoints — prevents brute force
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15-minute window
  max: 10,                     // max 10 attempts per window per IP
  standardHeaders: true,       // returns RateLimit-* headers
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many attempts. Please try again in 15 minutes.')
    );
  },
  skipSuccessfulRequests: true, // only count failed requests toward the limit
});

// Looser limiter for general API endpoints
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse('Too many requests. Please slow down.'));
  },
});
