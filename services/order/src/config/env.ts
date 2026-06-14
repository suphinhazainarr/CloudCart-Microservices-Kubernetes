import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  PORT:                z.string().default('4004'),
  MONGODB_URI:         z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET:   z.string().min(32, 'JWT_ACCESS_SECRET required'),
  CART_SERVICE_URL:    z.string().default('http://localhost:4003'),
  PRODUCT_SERVICE_URL: z.string().default('http://localhost:4002'),
  CORS_ORIGIN:         z.string().default('http://localhost:5173'),
  NOTIFICATION_SERVICE_URL: z.string().default('http://localhost:4006'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
