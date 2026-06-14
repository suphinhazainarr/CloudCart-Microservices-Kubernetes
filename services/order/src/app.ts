import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { orderRouter } from './routes/order.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'order', timestamp: new Date().toISOString() });
});

app.use('/api/orders', orderRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.warn(`[order] Service running → http://localhost:${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
