import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { productRouter } from './routes/product.routes';
import { categoryRouter } from './routes/category.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { setupSwagger } from './config/swagger';

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  const redis = getRedisClient();
  // Race the ping against a 500 ms timeout so health check never hangs
  const timeout = new Promise<string>((resolve) => setTimeout(() => resolve('TIMEOUT'), 500));
  const redisPing = await Promise.race([
    redis.ping().catch(() => 'ERROR'),
    timeout,
  ]);
  res.status(200).json({
    status:    'ok',
    service:   'product',
    timestamp: new Date().toISOString(),
    redis:     redisPing === 'PONG' ? 'connected' : 'disconnected',
  });
});

if (
  env.NODE_ENV !== 'production' ||
  process.env.ENABLE_SWAGGER === 'true'
) {
  setupSwagger(app);
}

app.use('/api/products',   productRouter);
app.use('/api/categories', categoryRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  getRedisClient(); // initialise Redis connection early
  app.listen(env.PORT, () => {
    console.warn(`[product] Service running → http://localhost:${env.PORT}`);
    console.log("running");
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
