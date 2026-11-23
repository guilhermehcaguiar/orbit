import { bigint, index, integer, jsonb, pgTable, primaryKey, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('profiles_email_idx').on(table.email),
  }),
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;


export const credentials = pgTable('account_credentials', {
  email: text().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
});

export const accountSessions = pgTable('account_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, table => [index('account_sessions_user_idx').on(table.userId), index('account_sessions_expiry_idx').on(table.expiresAt)]);

export const workspacePreferences = pgTable('workspace_preferences', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  revision: bigint({ mode: 'number' }).notNull().default(0),
  data: jsonb().notNull(),
});

function records(name: string) {
  return pgTable(name, {
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    id: text().notNull(),
    position: integer().notNull(),
    data: jsonb().notNull(),
  }, table => [primaryKey({ columns: [table.userId, table.id] })]);
}

export const semesters = records('semesters');
export const subjects = records('subjects');
export const tasks = records('tasks');
export const assessments = records('assessments');
export const calendarEvents = records('calendar_events');
export const classSchedules = records('class_schedules');
export const availabilityWindows = records('availability_windows');
export const focusSessions = records('focus_sessions');
