import 'dotenv/config';
console.log('DB URL:', process.env.DATABASE_URL);
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { db, schema, sqlClient, type DB } from './db/index.js';
import { eq, sql } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(__dirname, '..', 'public', 'index.html'), 'utf-8');

declare module 'fastify' {
  interface FastifyInstance {
    db: DB;
  }
}

export const buildServer = () => {
  const app: FastifyInstance = Fastify({
    logger: config.env !== 'production',
  });

  app.decorate('db', db);

  // Подключаем раздачу статических файлов (аудио, картинки и т.д.)
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  });

  app.addHook('onClose', async () => {
    await sqlClient.end();
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/', async (request, reply) => {
    reply.type('text/html; charset=utf-8');
    return indexHtml;
  });

  app.get('/users', async (request, reply) => {
    try {
      const users = await app.db.select().from(schema.users);
      return users;
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
    }
  });

  app.post('/auth/telegram', async (request, reply) => {
    try {
      const body = request.body as any;

      if (
        !body ||
        typeof body !== 'object' ||
        typeof (body as { telegramId?: unknown }).telegramId !== 'string' ||
        typeof (body as { nickname?: unknown }).nickname !== 'string'
      ) {
        reply.status(400);
        return { ok: false, error: 'telegramId and nickname are required' };
      }

      const existing = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.telegramId, body.telegramId))
        .limit(1);

      const existingUser = existing[0];

      // ✅ ВОТ ПРАВКА
      if (existingUser) {
        return { ok: true, user: existingUser, isNew: false };
      }

      const inserted = await app.db
        .insert(schema.users)
        .values({
          telegramId: body.telegramId,
          nickname: body.nickname,
          onboardingCompleted: false,
        })
        .returning();

      // ✅ ВОТ ПРАВКА
      return { ok: true, user: inserted[0], isNew: true };

    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
    }
  });

  app.post('/onboarding-complete', async (request, reply) => {
    try {
      const body = request.body as { telegramId?: string };

      if (!body || !body.telegramId) {
        reply.status(400);
        return { ok: false, error: 'telegramId is required' };
      }

      await app.db
        .update(schema.users)
        .set({ onboardingCompleted: true })
        .where(eq(schema.users.telegramId, body.telegramId));

      return { ok: true };
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
    }
  });

  app.get('/db-test', async (request, reply) => {
    try {
      const result = await app.db.execute(sql`SELECT 1`);

      return {
        ok: true,
        result,
      };
    } catch (error) {
      request.log.error(error);

      reply.status(500);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  });

  app.get('/drop-users', async (request, reply) => {
    try {
      await app.db.execute(sql`DELETE FROM users`);

      return { ok: true };
    } catch (error) {
      request.log.error(error);
      reply.status(500);
      return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
    }
  });

  return app;
};

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';

    const app = buildServer();

    const address = await app.listen({ port, host });
    console.log(`Server listening at ${address} (env: ${config.env})`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true,
});

bot.on('message', async (msg: any) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Открыть приложение 👇', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть',
            web_app: {
              url: 'https://uholingo.ru',
            },
          },
        ],
      ],
    },
  });
});