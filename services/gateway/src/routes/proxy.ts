import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { env } from '../config/env';
import { authLimiter } from '../middleware/rateLimiter';

export const proxyRouter = Router();

// Helper to create a proxy with standard options
const makeProxy = (target: string, pathRewrite?: Record<string, string>) => {
  const options: Options = {
    target,
    changeOrigin: true,
    on: {
      error: (err: Error, _req: any, res: any) => {
        console.error(`[gateway] Proxy error → ${target}:`, err.message);
        // Only write response if headers haven't been sent
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: 'Service temporarily unavailable. Please try again.',
            data:    null,
          });
        }
      },
      proxyReq: (proxyReq: any, req: any) => {
  const realIp = req.ip ?? req.headers['x-forwarded-for'];

  if (realIp) {
    proxyReq.setHeader('X-Real-IP', realIp as string);
  }

  if (req.headers.cookie) {
    proxyReq.setHeader('cookie', req.headers.cookie);
  }
},
    },
    ...(pathRewrite ? { pathRewrite } : {}),
  };
  return createProxyMiddleware(options);
};

// ── Routing Middleware (Preserves full paths downstream) ─────────────────────
proxyRouter.use((req, res, next) => {
  const path = req.path;

  // 1. Auth service (Apply strict rate limiting)
  if (path.startsWith('/api/auth')) {
    return authLimiter(req, res, () => {
      makeProxy(env.AUTH_SERVICE_URL)(req, res, next);
    });
  }

  // 2. Product service
  if (path.startsWith('/api/products') || path.startsWith('/api/categories')) {
    return makeProxy(env.PRODUCT_SERVICE_URL)(req, res, next);
  }

  // 3. Cart service
  if (path.startsWith('/api/cart')) {
    return makeProxy(env.CART_SERVICE_URL)(req, res, next);
  }

  // 4. Order service
  if (path.startsWith('/api/orders')) {
    return makeProxy(env.ORDER_SERVICE_URL)(req, res, next);
  }

  // 5. Payment service
  if (path.startsWith('/api/payments')) {
    return makeProxy(env.PAYMENT_SERVICE_URL)(req, res, next);
  }

  next();
});
