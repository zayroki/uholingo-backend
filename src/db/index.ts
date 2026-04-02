import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { config } from '../config.js';
import * as schema from './schema.js';

const client = postgres(config.databaseUrl, {
  ssl: config.ssl ? 'require' : undefined,
  max: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
export const sqlClient = client;
