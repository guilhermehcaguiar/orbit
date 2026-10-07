import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { ApiEnvironment } from '#app/config/environment';
import * as schema from './schema/profiles.js';

export type { Profile, NewProfile } from './schema/profiles.js';
export type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private client: Pool | null = null;
  private database: Database | null = null;
  private connected = false;

  constructor(private readonly config: ConfigService<ApiEnvironment, true>) {
    const databaseUrl = this.config.get('DATABASE_URL', { infer: true });
    if (databaseUrl) {
      // Providers need the ORM before Nest invokes lifecycle hooks.
      this.client = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
      this.database = drizzle(this.client, { schema });
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      this.logger.warn('DATABASE_URL not configured, database connection skipped');
      return;
    }
    try {
      await this.client.query('SELECT 1');
      this.connected = true;
      this.logger.log('Database connection established');
    } catch (error) {
      await this.onModuleDestroy();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.connected = false;
    const client = this.client;
    this.client = null;
    this.database = null;
    if (client) {
      await client.end();
      this.logger.log('Database connection closed');
    }
  }

  getClient(): Pool | null {
    return this.client;
  }

  getDatabase(): Database | null {
    return this.database;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
