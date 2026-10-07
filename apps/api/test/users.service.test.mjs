import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { UsersService } from '../dist/modules/users/users.service.js';

const createMockProfilesRepository = () => ({
  findById: mock.fn(async (id) => id === '1' ? { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() } : null),
  findByEmail: mock.fn(async (email) => email === 'test@example.com' ? { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() } : null),
  create: mock.fn(async (profile) => ({ ...profile, createdAt: new Date(), updatedAt: new Date() })),
  update: mock.fn(async (id, data) => id === '1' ? { id: '1', email: 'test@example.com', name: data.name ?? 'Test', avatarUrl: data.avatarUrl ?? null, createdAt: new Date(), updatedAt: new Date() } : null),
});

test('UsersService findById delegates to repository', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.findById('1');
  assert.deepEqual(result, { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockRepo.findById.mock.callCount(), 1);
});

test('UsersService findById returns null for non-existent id', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.findById('999');
  assert.equal(result, null);
});

test('UsersService findByEmail delegates to repository', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.findByEmail('test@example.com');
  assert.deepEqual(result, { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockRepo.findByEmail.mock.callCount(), 1);
});

test('UsersService createProfile delegates to repository', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.createProfile({ id: '2', email: 'new@example.com', name: 'New User' });
  assert.deepEqual(result, { id: '2', email: 'new@example.com', name: 'New User', createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockRepo.create.mock.callCount(), 1);
});

test('UsersService updateProfile delegates to repository', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.updateProfile('1', { name: 'Updated' });
  assert.deepEqual(result, { id: '1', email: 'test@example.com', name: 'Updated', avatarUrl: null, createdAt: result.createdAt, updatedAt: result.updatedAt });
  assert.equal(mockRepo.update.mock.callCount(), 1);
});

test('UsersService updateProfile returns null for non-existent id', async () => {
  const mockRepo = createMockProfilesRepository();
  const service = new UsersService(mockRepo);
  const result = await service.updateProfile('999', { name: 'Updated' });
  assert.equal(result, null);
});
