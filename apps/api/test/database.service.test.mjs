import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from '../dist/database/database.module.js';
import { ProfilesRepository } from '../dist/database/repositories/profiles.repository.js';
import { UsersModule } from '../dist/modules/users/users.module.js';
import { UsersService } from '../dist/modules/users/users.service.js';
import { profiles } from '../dist/database/schema/profiles.js';
import { DatabaseService } from '../dist/database/database.service.js';

const createMockConfig = (databaseUrl = '') => ({
  get: (key) => key === 'DATABASE_URL' ? databaseUrl : undefined,
});

test('DatabaseService does not connect when DATABASE_URL is empty', async () => {
  const service = new DatabaseService(createMockConfig(''));
  await service.onModuleInit();
  assert.equal(service.isConnected(), false);
  assert.equal(service.getDatabase(), null);
  assert.equal(service.getClient(), null);
  await service.onModuleDestroy();
});

test('DatabaseService does not connect when DATABASE_URL is undefined', async () => {
  const service = new DatabaseService(createMockConfig(undefined));
  await service.onModuleInit();
  assert.equal(service.isConnected(), false);
  await service.onModuleDestroy();
});

test('configured database provides a usable ORM and the correct repository through Nest', async (t) => {
  // Pool queries are stubbed so this test verifies Nest wiring without a PostgreSQL server.
  const { Pool } = await import('pg');
  const query = t.mock.method(Pool.prototype, 'query', async () => ({ rows: [] }));
  const end = t.mock.method(Pool.prototype, 'end', async () => {});
  class TestModule {}
  Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        skipProcessEnv: true,
        load: [() => ({ DATABASE_URL: 'postgresql://test:test@localhost:5432/test' })],
      }),
      DatabaseModule,
      UsersModule,
    ],
  })(TestModule);
  const app = await NestFactory.createApplicationContext(TestModule, { logger: false, abortOnError: false });
  const service = app.get(DatabaseService);
  try {
    assert.equal(service.isConnected(), true);
    assert.equal(query.mock.callCount(), 1);
    assert.equal(query.mock.calls[0].arguments[0], 'SELECT 1');
    assert.strictEqual(app.get('DATABASE'), service.getDatabase());
    assert.equal(typeof app.get('DATABASE').select, 'function');
    const repository = app.get(ProfilesRepository);
    assert.strictEqual(app.get(UsersService).profilesRepository, repository);
    const sql = service.getDatabase().select().from(profiles).toSQL();
    assert.match(sql.sql, /from "profiles"/);
  } finally {
    await app.close();
  }
  assert.equal(end.mock.callCount(), 1);
  assert.equal(service.isConnected(), false);
  assert.equal(service.getDatabase(), null);
});

const testDatabaseUrl = 'postgresql://test:fixture-password@localhost:5432/test';

test('an idle pool error is handled and logged without connection details', async (t) => {
  const service = new DatabaseService(createMockConfig(testDatabaseUrl));
  const warn = t.mock.method(Logger.prototype, 'warn', () => {});
  try {
    const pool = service.getClient();
    assert.equal(pool.options.max, 5);
    assert.equal(pool.options.connectionTimeoutMillis, 5000);
    assert.doesNotThrow(() => pool.emit('error', new Error(testDatabaseUrl)));
    assert.equal(warn.mock.callCount(), 1);
    assert.deepEqual(warn.mock.calls[0].arguments, ['Database pool lost an idle connection']);
  } finally {
    await service.onModuleDestroy();
  }
});

test('database initialization failure releases the pool and replaces the driver error', async (t) => {
  const service = new DatabaseService(createMockConfig(testDatabaseUrl));
  const driverError = new Error(testDatabaseUrl);
  t.mock.method(service.getClient(), 'query', async () => { throw driverError; });
  const end = t.mock.method(service.getClient(), 'end', async () => {});
  await assert.rejects(service.onModuleInit(), (error) => {
    assert.notEqual(error, driverError);
    assert.equal(error.cause, undefined);
    assert.match(error.message, /Verifique a configuração DATABASE_URL/);
    assert.doesNotMatch(error.stack, /fixture-password|localhost/);
    return true;
  });
  assert.equal(end.mock.callCount(), 1);
  assert.equal(service.isConnected(), false);
  assert.equal(service.getClient(), null);
});
