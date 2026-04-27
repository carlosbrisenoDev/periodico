export type AppEnv = Readonly<{
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  COOKIE_NAME: string;
  SUBSCRIBER_COOKIE_NAME: string;
  CORS_ORIGIN: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  ADMIN_NAME: string;
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  NEWSLETTER_ARTICLES_COUNT: number;
  NEWSLETTER_INTERVAL_MS: number;
}>;

export const env: AppEnv;

