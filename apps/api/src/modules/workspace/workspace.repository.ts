import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { emptyWorkspace, sessionKey, type Entry, type Workspace, type WorkspaceSnapshot } from '@orbit/contracts';
import { DatabaseService } from '#app/database/database.service';
import { forUser, requireDatabase, type Transaction } from '#app/database/user-transaction';

const tables = {
  semesters: 'semesters', subjects: 'subjects', tasks: 'tasks', exams: 'assessments',
  events: 'calendar_events', schedules: 'class_schedules', availability: 'availability_windows', sessions: 'focus_sessions',
} as const;

type TableName = typeof tables[keyof typeof tables];

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly database: DatabaseService) {}

  async read(userId: string, name: string): Promise<WorkspaceSnapshot> {
    return forUser(requireDatabase(this.database), userId, async transaction => {
      // Every read sees preferences and their records at the same revision.
      await transaction.execute(sql`select pg_advisory_xact_lock_shared(hashtextextended(${userId}, 0))`);
      return this.snapshot(transaction, userId, name);
    });
  }

  async write(userId: string, name: string, version: number, update: (workspace: Workspace) => Workspace) {
    return forUser(requireDatabase(this.database), userId, async transaction => {
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
      const current = await this.snapshot(transaction, userId, name);
      if (version !== current.revision) return { conflict: true as const, snapshot: current };
      const workspace = update(current.workspace);
      const { semesters, subjects, entries, schedules, availability, sessions, ...preferences } = workspace;
      const revision = current.revision + 1;
      await transaction.execute(sql`
        insert into workspace_preferences (user_id, revision, data)
        values (${userId}, ${revision}, ${JSON.stringify(preferences)}::jsonb)
        on conflict (user_id) do update set revision = excluded.revision, data = excluded.data`);
      const groups = {
        semesters, subjects, schedules, availability,
        tasks: entries.filter(item => item.kind === 'task'),
        exams: entries.filter(item => item.kind === 'exam'),
        events: entries.filter(item => item.kind === 'event'),
        sessions: sessions.map(item => ({ ...item, storageId: sessionKey(item) })),
      };
      for (const key of Object.keys(tables) as Array<keyof typeof tables>) {
        await this.replace(transaction, userId, tables[key], groups[key]);
      }
      return { conflict: false as const, snapshot: { revision, workspace } };
    });
  }

  private async snapshot(transaction: Transaction, userId: string, name: string): Promise<WorkspaceSnapshot> {
    const row = (await transaction.execute<{ revision: string; data: Partial<Workspace> }>(sql`
      select revision, data from workspace_preferences where user_id = ${userId}`)).rows[0];
    const data = <T>(table: TableName) => this.records<T>(transaction, userId, table);
    const entries = [
      ...await data<Entry>(tables.tasks), ...await data<Entry>(tables.exams), ...await data<Entry>(tables.events),
    ];
    return {
      revision: Number(row?.revision ?? 0),
      workspace: {
        ...emptyWorkspace(name), ...row?.data, entries,
        semesters: await data<Workspace['semesters'][number]>(tables.semesters),
        subjects: await data<Workspace['subjects'][number]>(tables.subjects),
        schedules: await data<Workspace['schedules'][number]>(tables.schedules),
        availability: await data<Workspace['availability'][number]>(tables.availability),
        sessions: await data<Workspace['sessions'][number]>(tables.sessions),
      },
    };
  }

  private async records<T>(transaction: Transaction, userId: string, table: TableName) {
    const result = await transaction.execute<{ data: T }>(sql`
      select data from ${sql.identifier(table)} where user_id = ${userId} order by position`);
    return result.rows.map(row => row.data);
  }

  private async replace(
    transaction: Transaction, userId: string, table: TableName,
    values: Array<{ id?: string; storageId?: string }>,
  ) {
    const rows = values.map(({ storageId, ...data }, position) => ({ id: storageId ?? data.id, position, data }));
    const name = sql.identifier(table);
    await transaction.execute(sql`
      delete from ${name} where user_id = ${userId} and id not in (select jsonb_array_elements_text(${JSON.stringify(rows.map(row => row.id))}::jsonb))`);
    if (rows.length === 0) return;
    await transaction.execute(sql`
      insert into ${name} (user_id, id, position, data)
      select ${userId}::uuid, id, position, data from jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        as record(id text, position integer, data jsonb)
      on conflict (user_id, id) do update set position = excluded.position, data = excluded.data
      where ${name}.position is distinct from excluded.position or ${name}.data is distinct from excluded.data`);
  }
}
