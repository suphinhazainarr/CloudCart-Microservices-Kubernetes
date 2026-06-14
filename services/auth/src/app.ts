import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { generalRateLimiter } from './config/rateLimiter';
import { setupSwagger } from './config/swagger';

const app = express();

app.set('trust proxy', 1);
// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      env.CORS_ORIGIN,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate limiting (global) ───────────────────────────────────────────────────
app.use(generalRateLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'auth',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Swagger (dev only) ───────────────────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// ─── Error handling (always last) ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.warn(`[auth] Service running → http://localhost:${env.PORT}`);
    console.warn(`[auth] Environment    → ${env.NODE_ENV}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
