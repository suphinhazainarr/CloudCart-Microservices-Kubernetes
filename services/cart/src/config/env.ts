import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  PORT:                    z.string().default('4003'),
  MONGODB_URI:             z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL:               z.string().default('redis://localhost:6379'),
  CORS_ORIGIN:             z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET:       z.string().min(32, 'JWT_ACCESS_SECRET required'),
  PRODUCT_SERVICE_URL:     z.string().default('http://localhost:4002'),
  CART_TTL_AUTHENTICATED:  z.string().default('604800').transform(Number),  // 7 days in seconds
  CART_TTL_GUEST:          z.string().default('86400').transform(Number),   // 24 hours in seconds
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
