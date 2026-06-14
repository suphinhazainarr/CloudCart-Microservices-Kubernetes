import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  NODE_ENV:             z.enum(['development','production','test']).default('development'),
  PORT:                 z.string().default('4006'),
  AUTH_SERVICE_URL:     z.string().default('http://localhost:4001'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Notification env invalid:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
