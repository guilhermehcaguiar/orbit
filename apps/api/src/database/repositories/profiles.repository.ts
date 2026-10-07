import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Profile, NewProfile } from '../schema/profiles.js';
import type { Database } from '../database.service.js';
import * as schema from '../schema/profiles.js';

@Injectable()
export class ProfilesRepository {
  constructor(
    @Inject('DATABASE')
    private readonly database: Database | null,
  ) {}

  private assertDatabase(): Database {
    if (!this.database) {
      throw new Error('Database connection not available');
    }
    return this.database;
  }

  async findById(id: string): Promise<Profile | null> {
    const db = this.assertDatabase();
    const result = await db.select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const db = this.assertDatabase();
    const result = await db.select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, email))
      .limit(1);
    return result[0] ?? null;
  }

  async create(profile: NewProfile): Promise<Profile> {
    const db = this.assertDatabase();
    const result = await db.insert(schema.profiles).values(profile).returning();
    const created = result[0];
    if (!created) {
      throw new Error('Profile creation returned no row');
    }
    return created;
  }

  async update(id: string, data: Partial<Pick<Profile, 'name' | 'avatarUrl'>>): Promise<Profile | null> {
    const db = this.assertDatabase();
    const result = await db.update(schema.profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.profiles.id, id))
      .returning();
    return result[0] ?? null;
  }
}
