import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { cartRouter } from './routes/cart.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  origin:      env.CORS_ORIGIN,
  credentials: true,
  // Allow the custom session header from the frontend
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  const redis = getRedisClient();
  const redisPing = await redis.ping().catch(() => 'ERROR');
  res.status(200).json({
    status:    'ok',
    service:   'cart',
    timestamp: new Date().toISOString(),
    redis:     redisPing === 'PONG' ? 'connected' : 'disconnected',
  });
});

app.use('/api/cart', cartRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  getRedisClient();
  app.listen(env.PORT, () => {
    console.warn(`[cart] Service running → http://localhost:${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
