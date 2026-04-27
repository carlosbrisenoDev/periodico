import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development').optional(),
  PORT: z.coerce.number().int().positive().default(3000).optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').optional(),
  MONGODB_DB_NAME: z.string().min(1).default('periodico').optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must have at least 16 characters').optional(),
  JWT_EXPIRES_IN: z.string().default('1d').optional(),
  COOKIE_NAME: z.string().default('access_token').optional(),
  SUBSCRIBER_COOKIE_NAME: z.string().default('subscriber_token').optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000').optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().default('Admin').optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('localhost').optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NEWSLETTER_ARTICLES_COUNT: z.coerce.number().int().positive().default(4).optional(),
  NEWSLETTER_INTERVAL_MS: z.coerce.number().int().positive().default(604800000).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => issue.message).join(', ');
  throw new Error(`Invalid environment variables: ${errors}`);
}

export const env = parsed.data;
