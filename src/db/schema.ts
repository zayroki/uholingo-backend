import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').notNull().unique(),
  nickname: text('nickname').notNull(),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tracks = pgTable('tracks', {
  id: serial('id').primaryKey(),
  fileA: text('file_a').notNull(),
  fileB: text('file_b').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  difficulty: integer('difficulty').notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  trackIds: jsonb('track_ids').notNull(),
  currentQuestion: integer('current_question').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  questionStartedAt: timestamp('question_started_at', { withTimezone: true }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  trackId: integer('track_id')
    .notNull()
    .references(() => tracks.id, { onDelete: 'cascade' }),
  answer: text('answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  responseTimeMs: integer('response_time_ms').notNull(),
  isValid: boolean('is_valid').notNull(),
});
