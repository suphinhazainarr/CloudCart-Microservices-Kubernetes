import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { getRedisClient } from './config/redis';
import { optionalAuth } from './middleware/authenticate';
import { generalLimiter } from './middleware/rateLimiter';
import { proxyRouter } from './routes/proxy';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],   // tighten in production
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow image loading from CDNs
}));

// ── CORS — one place, one config ──────────────────────────────────────────────
app.use(cors({
  origin:      env.CORS_ORIGIN,
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization',
    'x-session-id', 'x-user-id', 'x-user-role',
  ],
}));

// ── Body + cookie parsing (needed for auth header extraction) ──────────────────
// Note: DO NOT use express.json() here — the proxy streams the body as-is
// Parsing it would break the proxy's ability to forward it correctly
app.use(cookieParser());

// ── General rate limiting (all routes) ────────────────────────────────────────
app.use(generalLimiter);

// ── Optional JWT parsing — attaches req.user if token is valid ────────────────
app.use(optionalAuth);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  const redis = getRedisClient();
  let redisStatus = 'disconnected';
  try {
    const pong = await redis.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'degraded';
  } catch {}

  res.status(200).json({
    status:    'ok',
    service:   'gateway',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    redis:     redisStatus,
    routes: {
      auth:    env.AUTH_SERVICE_URL,
      product: env.PRODUCT_SERVICE_URL,
      cart:    env.CART_SERVICE_URL,
      order:   env.ORDER_SERVICE_URL,
      payment: env.PAYMENT_SERVICE_URL,
    },
  });
});

// ── Proxy all API routes to downstream services ───────────────────────────────
app.use(proxyRouter);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data:    null,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = () => {
  getRedisClient(); // warm up connection
  app.listen(env.PORT, () => {
    console.warn(`[gateway] Running → http://localhost:${env.PORT}`);
    console.warn(`[gateway] Proxying to:`);
    console.warn(`  /api/auth     → ${env.AUTH_SERVICE_URL}`);
    console.warn(`  /api/products → ${env.PRODUCT_SERVICE_URL}`);
    console.warn(`  /api/cart     → ${env.CART_SERVICE_URL}`);
    console.warn(`  /api/orders   → ${env.ORDER_SERVICE_URL}`);
    console.warn(`  /api/payments → ${env.PAYMENT_SERVICE_URL}`);
  });
};

start();

export default app;
