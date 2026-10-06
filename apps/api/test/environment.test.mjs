import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from '../dist/config/environment.js';

test('configuration provides local defaults without an environment file', () => {
  assert.deepEqual(validateEnvironment({}), {
    NODE_ENV: 'development', API_PORT: 3001, FRONTEND_URL: 'http://localhost:3000',
  });
});

test('configuration accepts explicit production values and parses the port', () => {
  assert.deepEqual(validateEnvironment({
    NODE_ENV: 'production', API_PORT: '8080', FRONTEND_URL: 'https://orbit.example',
  }), { NODE_ENV: 'production', API_PORT: 8080, FRONTEND_URL: 'https://orbit.example' });
});

for (const [key, values] of Object.entries({
  NODE_ENV: ['', 'staging'],
  API_PORT: ['', '0', '65536', '3001.5', 'abc', ' 3001 '],
  FRONTEND_URL: ['', '*', 'ftp://localhost', 'http://localhost:3000/path',
    'http://localhost:3000/', 'http://user:password@localhost:3000',
    'http://localhost:3000?query=1', 'http://localhost:3000#hash'],
})) {
  for (const value of values) {
    test(`configuration rejects invalid ${key}: ${JSON.stringify(value)}`, () => {
      assert.throws(() => validateEnvironment({ [key]: value }), new RegExp(key));
    });
  }
}
