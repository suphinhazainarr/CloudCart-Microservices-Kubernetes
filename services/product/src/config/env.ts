import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:          z.enum(['development', 'production', 'test']).default('development'),
  PORT:              z.string().default('4002'),
  MONGODB_URI:       z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL:         z.string().default('redis://localhost:6379'),
  CORS_ORIGIN:       z.string().default('http://localhost:5173'),
  PRODUCT_CACHE_TTL: z.string().default('300').transform(Number),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
