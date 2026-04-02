import 'dotenv/config';

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  databaseUrl: requiredEnv('DATABASE_URL'),
  // Supabase-managed PostgreSQL generally requires SSL; override with DB_SSL=false if needed.
  ssl: (process.env.DB_SSL ?? 'true').toLowerCase() !== 'false',
};

export const isProduction = config.env === 'production';
