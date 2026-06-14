import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV:             z.enum(['development', 'production', 'test']).default('development'),
  PORT:                 z.string().default('4005'),
  MONGODB_URI:          z.string().min(1),
  JWT_ACCESS_SECRET:    z.string().min(32),
  ORDER_SERVICE_URL:    z.string().default('http://localhost:4004'),
  CORS_ORIGIN:          z.string().default('http://localhost:5173'),
  PAYMENT_SUCCESS_RATE: z.string().default('90').transform(Number),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid env vars:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
