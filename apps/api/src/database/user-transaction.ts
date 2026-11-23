import { ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database, DatabaseService } from './database.service.js';

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export function requireDatabase(service: DatabaseService) {
  const database = service.getDatabase();
  if (!database) throw new ServiceUnavailableException();
  return database;
}

export function forUser<T>(database: Database, userId: string, callback: (transaction: Transaction) => Promise<T>) {
  return database.transaction(async transaction => {
    await transaction.execute(sql`select set_config('orbit.user_id', ${userId}, true)`);
    return callback(transaction);
  });
}
