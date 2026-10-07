import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { BadRequestException, Body, Controller, Get, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { IsString } from 'class-validator';
import { configureApp } from '../dist/config/configure-app.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.API_PORT = '3001';
process.env.FRONTEND_URL = 'http://localhost:3000';
const { AppModule } = await import('../dist/app.module.js');

// These routes exist only in this test module, never in the application.
class InputFixture {}
IsString()(InputFixture.prototype, 'name');

class ErrorFixtureController {
  badRequest() { throw new BadRequestException(['Invalid input']); }
  unexpected() { throw new Error('PRIVATE_ERROR_DETAILS'); }
  input(body) { return { name: body.name, transformed: body instanceof InputFixture }; }
}
Reflect.defineMetadata('design:paramtypes', [InputFixture], ErrorFixtureController.prototype, 'input');
Body()(ErrorFixtureController.prototype, 'input', 0);
Post('input')(ErrorFixtureController.prototype, 'input',
  Object.getOwnPropertyDescriptor(ErrorFixtureController.prototype, 'input'));
Controller('test-errors')(ErrorFixtureController);
for (const method of ['badRequest', 'unexpected']) {
  Get(method)(ErrorFixtureController.prototype, method,
    Object.getOwnPropertyDescriptor(ErrorFixtureController.prototype, method));
}
class TestModule {}
Module({ imports: [AppModule], controllers: [ErrorFixtureController] })(TestModule);

let app;
before(async () => {
  app = await NestFactory.create(TestModule, new FastifyAdapter(), { logger: false });
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
after(async () => { await app?.close(); });

test('GET /api/v1/health returns HTTP 200 and configured environment', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok', service: 'orbit-api', environment: 'test' });
});

test('the old unversioned health route is not exposed', async () => {
  const response = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(response.statusCode, 404);
  const body = response.json();
  assert.equal(body.statusCode, 404);
  assert.equal(body.error, 'Not Found');
  assert.equal(body.path, '/health');
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});

test('HTTP validation errors preserve messages in the standard envelope', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/test-errors/badRequest' });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json().message, ['Invalid input']);
  assert.equal(response.json().error, 'Bad Request');
});

test('unexpected failures never expose private messages or stack traces', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/test-errors/unexpected' });
  assert.equal(response.statusCode, 500);
  assert.equal(response.json().message, 'Internal Server Error');
  assert.equal(response.json().path, '/api/v1/test-errors/unexpected');
  assert.ok(!response.body.includes('PRIVATE_ERROR_DETAILS'));
  assert.ok(!('stack' in response.json()));
});

test('CORS allows the configured origin without a wildcard', async () => {
  const response = await app.inject({ method: 'OPTIONS', url: '/api/v1/health', headers: {
    origin: 'http://localhost:3000', 'access-control-request-method': 'GET',
  } });
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:3000');
  const other = await app.inject({ method: 'GET', url: '/api/v1/health', headers: {
    origin: 'https://untrusted.example',
  } });
  assert.notEqual(other.headers['access-control-allow-origin'], 'https://untrusted.example');
});

test('the global pipe transforms DTOs and rejects extra or invalid fields over HTTP', async () => {
  const request = (payload) => app.inject({ method: 'POST', url: '/api/v1/test-errors/input', payload });
  const valid = await request({ name: 'Orbit' });
  assert.equal(valid.statusCode, 201);
  assert.deepEqual(valid.json(), { name: 'Orbit', transformed: true });
  for (const payload of [{ name: 'Orbit', unexpected: true }, { name: 42 }]) {
    const response = await request(payload);
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error, 'Bad Request');
    assert.ok(Array.isArray(response.json().message));
  }
});

test('request IDs are generated and valid client IDs are echoed over HTTP', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/v1/health' });
  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/i);
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const echoed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { 'x-request-id': id } });
  assert.equal(echoed.headers['x-request-id'], id);
});
