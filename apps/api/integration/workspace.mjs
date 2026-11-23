import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { emptyWorkspace } from '@orbit/contracts';
import { Pool } from 'pg';
import { configureApp } from '../dist/config/configure-app.js';

if (!process.env.ORBIT_TEST_DATABASE_URL) throw new Error('Configure ORBIT_TEST_DATABASE_URL apontando para um banco isolado.');
process.env.DATABASE_URL = process.env.ORBIT_TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
const { AppModule } = await import("../dist/app.module.js");

let application;
let pool;
before(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const roles = await pool.query('select rolsuper, rolbypassrls from pg_roles where rolname = current_user');
  assert.deepEqual(roles.rows, [{ rolsuper: false, rolbypassrls: false }]);
  application = await NestFactory.create(AppModule, new FastifyAdapter(), { logger: false, abortOnError: false });
  await configureApp(application);
  await application.init();
});
after(async () => {
  await application?.close();
  await pool?.end();
});

const request = (method, path, payload, token, headers = {}) => application.inject({
  method, url: `/api/v1/${path}`, payload,
  headers: { ...headers, ...(token && { authorization: `Bearer ${token}` }) },
});

test('account sessions, revisions, collection routes and Postgres ownership', async () => {
  const firstEmail = `owner-${randomUUID()}@example.test`;
  const password = 'orbit-ci-synthetic-password';
  const register = async (name, email) => {
    const result = await request('POST', 'auth/register', { name, email, password });
    assert.equal(result.statusCode, 201, result.body);
    return result.json();
  };
  const first = await register('Owner', firstEmail);
  const second = await register('Second', `second-${firstEmail}`);
  const firstToken = first.token;
  const secondToken = second.token;
  assert.equal((await request('GET', 'workspace')).statusCode, 401);
  assert.equal((await request('POST', 'auth/login', { email: firstEmail, password: 'incorrect' })).statusCode, 401);
  const session = await request('POST', 'auth/login', { email: firstEmail.toUpperCase(), password });
  assert.equal(session.statusCode, 200, session.body);
  const otherSession = session.json().token;
  assert.deepEqual((await request('GET', 'me', undefined, otherSession)).json(), first.account);

  const subject = { id: randomUUID(), name: 'Cálculo', teacher: '' };
  const entry = { id: randomUUID(), kind: 'task', title: 'Exercícios', date: '2026-12-10', subjectId: subject.id, done: false };
  const firstWrite = { revision: 0, workspace: { ...emptyWorkspace('Owner'), subjects: [subject], entries: [entry] } };
  const saved = await request('PUT', 'workspace', firstWrite, firstToken);
  assert.equal(saved.statusCode, 200, saved.body);
  assert.equal(saved.json().revision, 1);
  const stale = await request('PUT', 'workspace', firstWrite, otherSession);
  assert.equal(stale.statusCode, 409);
  const secondRead = await request('GET', 'workspace', undefined, secondToken);
  assert.equal(secondRead.statusCode, 200, secondRead.body);
  assert.deepEqual(secondRead.json().workspace.subjects, []);
  assert.equal((await request('GET', `subjects/${subject.id}`, undefined, secondToken)).statusCode, 404);
  assert.equal((await request('GET', 'workspace', undefined, secondToken, { 'x-orbit-account': first.account.id })).statusCode, 409);
  const patch = await request('PATCH', `tasks/${entry.id}`, { revision: 1, record: { done: true } }, firstToken);
  assert.equal(patch.statusCode, 200, patch.body);
  assert.equal(patch.json().workspace.entries[0].done, true);
  const importPayload = revision => ({ revision, workspace: firstWrite.workspace });
  for (let revision = 2; revision <= 3; revision++) {
    const imported = await request('POST', 'workspace/import', importPayload(revision), firstToken);
    assert.equal(imported.statusCode, 200, imported.body);
    assert.equal(imported.json().workspace.entries.length, 1);
    assert.equal(imported.json().workspace.entries[0].done, true);
  }
  assert.equal((await request('DELETE', `subjects/${subject.id}`, { revision: 0 }, secondToken)).statusCode, 404);

  const client = await pool.connect();
  try {
    assert.deepEqual((await client.query('select id from subjects')).rows, []);
    await client.query('begin');
    await client.query("select set_config('orbit.user_id', $1, true)", [first.account.id]);
    assert.deepEqual((await client.query('select id from subjects')).rows, [{ id: subject.id }]);
    const foreign = await client.query('update subjects set position = 99 where user_id = $1', [second.account.id]);
    assert.equal(foreign.rowCount, 0);
    await client.query('rollback');
    assert.deepEqual((await client.query('select id from subjects')).rows, []);
    await client.query('begin');
    await client.query("select set_config('orbit.user_id', $1, true)", [second.account.id]);
    assert.deepEqual((await client.query('select id from subjects')).rows, []);
    await assert.rejects(client.query("insert into subjects (user_id,id,position,data) values ($1,'negative-test',0,'{}')", [first.account.id]), { code: '42501' });
  } finally {
    await client.query('rollback');
    client.release();
  }

  assert.equal((await request('POST', 'auth/logout', undefined, otherSession)).statusCode, 204);
  assert.equal((await request('GET', 'me', undefined, otherSession)).statusCode, 401);
  assert.equal((await request('GET', 'me', undefined, firstToken)).statusCode, 200);
});
