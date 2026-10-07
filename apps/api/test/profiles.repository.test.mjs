import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { ProfilesRepository } from '../dist/database/repositories/profiles.repository.js';

const createMockDatabase = () => ({
  select: mock.fn(() => ({
    from: mock.fn(() => ({
      where: mock.fn(() => ({
        limit: mock.fn(() => []),
      })),
    })),
  })),
  insert: mock.fn(() => ({
    values: mock.fn(() => ({
      returning: mock.fn(() => [{ id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() }]),
    })),
  })),
  update: mock.fn(() => ({
    set: mock.fn(() => ({
      where: mock.fn(() => ({
        returning: mock.fn(() => [{ id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() }]),
      })),
    })),
  })),
});

test('ProfilesRepository throws when database is not available', async () => {
  const repo = new ProfilesRepository(null);
  await assert.rejects(repo.findById('1'), /Database connection not available/);
  await assert.rejects(repo.findByEmail('test@example.com'), /Database connection not available/);
  await assert.rejects(repo.create({ id: '1', email: 'test@example.com', name: 'Test' }), /Database connection not available/);
  await assert.rejects(repo.update('1', { name: 'Updated' }), /Database connection not available/);
});

test('ProfilesRepository findById calls database correctly', async () => {
  const mockDb = createMockDatabase();
  const repo = new ProfilesRepository(mockDb);
  const result = await repo.findById('1');
  assert.equal(result, null);
  assert.equal(mockDb.select.mock.callCount(), 1);
});

test('ProfilesRepository findByEmail calls database correctly', async () => {
  const mockDb = createMockDatabase();
  const repo = new ProfilesRepository(mockDb);
  const result = await repo.findByEmail('test@example.com');
  assert.equal(result, null);
  assert.equal(mockDb.select.mock.callCount(), 1);
});

test('ProfilesRepository create calls database correctly', async () => {
  const mockDb = createMockDatabase();
  const repo = new ProfilesRepository(mockDb);
  const result = await repo.create({ id: '1', email: 'test@example.com', name: 'Test' });
  assert.deepEqual(result, { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockDb.insert.mock.callCount(), 1);
});

test('ProfilesRepository update calls database correctly', async () => {
  const mockDb = createMockDatabase();
  const repo = new ProfilesRepository(mockDb);
  const result = await repo.update('1', { name: 'Updated' });
  assert.deepEqual(result, { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockDb.update.mock.callCount(), 1);
});
