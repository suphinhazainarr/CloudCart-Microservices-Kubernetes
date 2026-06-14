import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  PORT:                z.string().default('4001'),
  MONGODB_URI:         z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET:   z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET:  z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  BCRYPT_ROUNDS:       z.string().default('12').transform(Number),
  REDIS_URL:           z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1); // hard fail — never start with misconfigured env
}

export const env = parsed.data;
export type Env = typeof env;
