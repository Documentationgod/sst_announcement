const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'CLERK_SECRET_KEY',
];

const optionalEnvVars = [
  'JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'DEPLOYMENT',
  'CRON_SECRET',
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT',
];

let validated = false;

export interface EnvConfig {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  CLERK_SECRET_KEY: string;
  JWT_SECRET?: string;
  FRONTEND_URL?: string;
  BACKEND_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  DEPLOYMENT?: string;
  CRON_SECRET?: string;
  IMAGEKIT_PUBLIC_KEY?: string;
  IMAGEKIT_PRIVATE_KEY?: string;
  IMAGEKIT_URL_ENDPOINT?: string;
}

export function validateEnv(): EnvConfig {
  if (validated) {
    return getEnvConfig();
  }

  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Environment validation failed');
    console.error(message);
    throw new Error(message);
  }

  validated = true;
  return getEnvConfig();
}

export function getEnvConfig(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    DEPLOYMENT: process.env.DEPLOYMENT,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

export function getRequiredEnv(key: keyof EnvConfig): string {
  validateEnv();
  const value = process.env[key as string];
  if (!value) {
    throw new Error(`Environment variable ${key as string} is required`);
  }
  return value;
}

export function getOptionalEnv(key: keyof EnvConfig, fallback?: string): string | undefined {
  validateEnv();
  const value = process.env[key as string];
  if (!value) {
    if (optionalEnvVars.includes(key as string) && fallback) {
      return fallback;
    }
    return fallback;
  }
  return value;
}
