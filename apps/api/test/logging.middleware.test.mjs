import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test, mock } from 'node:test';
import { LoggingMiddleware } from '../dist/common/middleware/logging.middleware.js';

test('logging supports raw HTTP requests, redacts secrets and logs completion only once', () => {
  const logger = { log: mock.fn() };
  const middleware = new LoggingMiddleware(logger);
  const req = {
    method: 'GET',
    url: '/api/v1/health',
    requestId: 'test-request',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {
      authorization: 'Bearer secret',
      cookie: 'session=secret',
      'X-CSRF-Token': 'secret',
      'user-agent': 'test-client',
      accept: ['application/json', 'text/plain'],
    },
  };
  const res = Object.assign(new EventEmitter(), { statusCode: 200 });
  const next = mock.fn();
  middleware.use(req, res, next);
  assert.equal(next.mock.callCount(), 1);
  res.emit('finish');
  res.emit('close');
  assert.equal(logger.log.mock.callCount(), 1);
  const [message, context] = logger.log.mock.calls[0].arguments;
  assert.equal(message, 'GET /api/v1/health 200');
  assert.equal(context.requestId, 'test-request');
  assert.equal(context.ip, '127.0.0.1');
  assert.equal(context.userAgent, 'test-client');
  assert.ok(context.durationMs >= 0);
  assert.equal(context.headers.authorization, '[REDACTED]');
  assert.equal(context.headers.cookie, '[REDACTED]');
  assert.equal(context.headers['X-CSRF-Token'], '[REDACTED]');
  assert.equal(context.headers.accept, 'application/json, text/plain');
});
