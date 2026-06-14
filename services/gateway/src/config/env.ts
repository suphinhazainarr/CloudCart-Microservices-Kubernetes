import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV:             z.enum(['development','production','test']).default('development'),
  PORT:                 z.string().default('4000'),
  REDIS_URL:            z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET:    z.string().min(32, 'JWT secret required'),
  CORS_ORIGIN:          z.string().default('http://localhost:5173'),

  AUTH_SERVICE_URL:     z.string().default('http://localhost:4001'),
  PRODUCT_SERVICE_URL:  z.string().default('http://localhost:4002'),
  CART_SERVICE_URL:     z.string().default('http://localhost:4003'),
  ORDER_SERVICE_URL:    z.string().default('http://localhost:4004'),
  PAYMENT_SERVICE_URL:  z.string().default('http://localhost:4005'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX:       z.string().default('100').transform(Number),
  AUTH_RATE_LIMIT_MAX:  z.string().default('10').transform(Number),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Gateway env invalid:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
