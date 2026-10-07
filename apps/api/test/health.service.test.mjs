import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HealthService } from '../dist/modules/health/health.service.js';

const createMockConfig = (env = 'development') => ({
  get: (key) => key === 'NODE_ENV' ? env : undefined,
});

test('HealthService returns correct health without database', () => {
  const service = new HealthService(createMockConfig('development'), { getDatabase: () => null });
  const health = service.getHealth();
  assert.deepEqual(health, { status: 'ok', service: 'orbit-api', environment: 'development' });
  assert.equal('database' in health, false);
});

test('HealthService returns database up when database is connected', () => {
  const mockDb = { getDatabase: () => ({}), isConnected: () => true };
  const service = new HealthService(createMockConfig('production'), mockDb);
  const health = service.getHealth();
  assert.deepEqual(health, { status: 'ok', service: 'orbit-api', environment: 'production', database: 'up' });
});

test('HealthService returns different environments', () => {
  const service = new HealthService(createMockConfig('test'), { getDatabase: () => null });
  const health = service.getHealth();
  assert.equal(health.environment, 'test');
});

test('HealthService does not report an unverified connection as up', () => {
  const service = new HealthService(createMockConfig('test'), {
    getDatabase: () => ({}),
    isConnected: () => false,
  });
  assert.equal(service.getHealth().database, 'down');
});
