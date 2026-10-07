import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RequestIdMiddleware } from '../dist/common/middleware/request-id.middleware.js';

const createMockReqRes = (headers = {}) => {
  const req = { headers, requestId: undefined };
  const res = {
    headers: {},
    setHeader: function(name, value) { this.headers[name] = value; },
    getHeader: function(name) { return this.headers[name]; },
  };
  return { req, res };
};

test('RequestIdMiddleware generates new UUID when no header present', () => {
  const middleware = new RequestIdMiddleware();
  const { req, res } = createMockReqRes({});
  let nextCalled = false;
  middleware.use(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.ok(req.requestId);
  assert.equal(res.getHeader('x-request-id'), req.requestId);
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.requestId));
});

test('RequestIdMiddleware reuses valid UUID from header', () => {
  const middleware = new RequestIdMiddleware();
  const existingId = '550e8400-e29b-41d4-a716-446655440000';
  const { req, res } = createMockReqRes({ 'x-request-id': existingId });
  let nextCalled = false;
  middleware.use(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.equal(req.requestId, existingId);
  assert.equal(res.getHeader('x-request-id'), existingId);
});

test('RequestIdMiddleware generates new UUID when header is invalid', () => {
  const middleware = new RequestIdMiddleware();
  const { req, res } = createMockReqRes({ 'x-request-id': 'invalid-id' });
  let nextCalled = false;
  middleware.use(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.ok(req.requestId);
  assert.notEqual(req.requestId, 'invalid-id');
  assert.equal(res.getHeader('x-request-id'), req.requestId);
  assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.requestId));
});

test('RequestIdMiddleware handles case-insensitive header', () => {
  const middleware = new RequestIdMiddleware();
  const existingId = '550e8400-e29b-41d4-a716-446655440000';
  const { req, res } = createMockReqRes({ 'X-Request-Id': existingId });
  let nextCalled = false;
  middleware.use(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.equal(req.requestId, existingId);
  assert.equal(res.getHeader('x-request-id'), existingId);
});
