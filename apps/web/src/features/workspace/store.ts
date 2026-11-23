'use client';

import { emptyWorkspace, workspaceSchema, type Account, type Entry, type Workspace, type WorkspaceSnapshot } from '@orbit/contracts';
import { reopenConflictingPlan } from '@orbit/contracts/planner';
import { useSyncExternalStore } from 'react';
import { ApiError, orbitApi } from './api';
import { readLatestDraft, reapplyDraft, removeDraft, saveDraft, type StoredDraft } from './draft';

export type { Entry, EntryKind, Focus, Subject, Workspace } from '@orbit/contracts';

const key = 'orbit.workspace.v1';
const initial = emptyWorkspace();
let localSnapshot = initial;
let rawSnapshot: string | null = null;
let memoryOnly = false;

type Connection = { status: 'loading' | 'guest' | 'unavailable' } | { status: 'member'; account: Account };
type SyncStatus = 'idle' | 'saving' | 'error' | 'conflict' | 'recovering' | 'invalid-draft' | 'expired';
const loading = { status: 'loading' } as const;
let connection: Connection = loading;
let syncStatus: SyncStatus = 'idle';
let memberSnapshot = initial;
let serverSnapshot: WorkspaceSnapshot = { revision: 0, workspace: initial };
let draftBase = serverSnapshot;
let storedDraft: StoredDraft | undefined;
let recoveredDraft: StoredDraft | undefined;
let writer = '';
let draftOnDevice = false;
let pending = false;
let connectionRequest: Promise<void> | undefined;
const listeners = new Set<() => void>();

function publish() {
  listeners.forEach(listener => listener());
}

function readLocalWorkspace() {
  if (memoryOnly) return localSnapshot;
  try {
    const raw = localStorage.getItem(key);
    if (raw === rawSnapshot) return localSnapshot;
    const saved: Partial<Workspace> | null = raw ? JSON.parse(raw) : null;
    const result = workspaceSchema.safeParse({ ...initial, ...saved });
    localSnapshot = result.success ? result.data : initial;
    rawSnapshot = raw;
  } catch {
    return localSnapshot;
  }
  return localSnapshot;
}

function readWorkspace() {
  if (connection.status === 'member') return memberSnapshot;
  return connection.status === 'guest' ? readLocalWorkspace() : initial;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useWorkspace() {
  return useSyncExternalStore(subscribe, readWorkspace, () => initial);
}

export function useConnection() {
  return useSyncExternalStore(subscribe, () => connection, () => loading);
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribe, () => syncStatus, () => 'idle' as const);
}

export function useMemoryOnly() {
  return useSyncExternalStore(subscribe, () => connection.status === 'guest' && memoryOnly, () => false);
}

export function connectWorkspace() {
  if (connectionRequest || connection.status === 'member' || connection.status === 'guest') return;
  connection = loading;
  publish();
  connectionRequest = (async () => {
    try {
      const account = await orbitApi<Account>('me');
      const saved = await orbitApi<WorkspaceSnapshot>('workspace', { accountId: account.id });
      serverSnapshot = saved;
      recoveredDraft = readLatestDraft(account.id);
      draftBase = recoveredDraft?.draft.base ?? saved;
      memberSnapshot = recoveredDraft?.draft.workspace ?? saved.workspace;
      draftOnDevice = pending = Boolean(recoveredDraft);
      syncStatus = pending ? 'conflict' : 'idle';
      writer = crypto.randomUUID();
      connection = { status: 'member', account };
    } catch (error) {
      connection = { status: error instanceof ApiError && error.status === 401 ? 'guest' : 'unavailable' };
    } finally {
      connectionRequest = undefined;
      publish();
    }
  })();
}

export function getImportableWorkspace() {
  const workspace = readLocalWorkspace();
  return [workspace.subjects, workspace.entries, workspace.sessions, workspace.semesters, workspace.schedules, workspace.availability]
    .some(items => items.length > 0) ? workspace : null;
}

export function useDraftOnDevice() {
  return useSyncExternalStore(subscribe, () => draftOnDevice, () => false);
}

function persistDraft(accountId: string) {
  const saved = saveDraft(accountId, writer, draftBase, memberSnapshot);
  draftOnDevice = Boolean(saved);
  if (saved) storedDraft = saved;
}

function clearDrafts() {
  removeDraft(storedDraft);
  removeDraft(recoveredDraft);
  storedDraft = recoveredDraft = undefined;
  draftOnDevice = false;
}

function syncError(error: unknown): SyncStatus {
  return error instanceof ApiError && error.status === 409 ? 'conflict'
    : error instanceof ApiError && error.status === 401 ? 'expired' : 'error';
}

export async function flushWorkspace() {
  if (connection.status !== 'member' || !pending || !['idle', 'error'].includes(syncStatus)) return;
  const { account } = connection;
  syncStatus = 'saving';
  publish();
  try {
    while (pending) {
      const workspace = memberSnapshot;
      const saved = await orbitApi<WorkspaceSnapshot>('workspace', {
        method: 'PUT', accountId: account.id, body: { workspace, revision: serverSnapshot.revision },
      });
      serverSnapshot = draftBase = saved;
      pending = memberSnapshot !== workspace;
      if (pending) persistDraft(account.id);
      else {
        memberSnapshot = saved.workspace;
        clearDrafts();
      }
    }
    syncStatus = 'idle';
  } catch (error) {
    syncStatus = syncError(error);
  }
  publish();
}

export async function resolveWorkspaceDraft(apply: boolean) {
  if (connection.status !== 'member' || !['conflict', 'invalid-draft', 'error'].includes(syncStatus)) return;
  const { account } = connection;
  syncStatus = 'recovering';
  publish();
  try {
    const latest = await orbitApi<WorkspaceSnapshot>('workspace', { accountId: account.id });
    const merged = apply ? reapplyDraft(draftBase.workspace, memberSnapshot, latest.workspace) : latest.workspace;
    if (!merged) {
      syncStatus = 'invalid-draft';
      publish();
      return;
    }
    serverSnapshot = draftBase = latest;
    memberSnapshot = merged;
    pending = apply;
    if (apply) persistDraft(account.id);
    else clearDrafts();
    syncStatus = 'idle';
    if (pending) void flushWorkspace();
  } catch (error) {
    syncStatus = syncError(error) === 'expired' ? 'expired' : 'conflict';
  }
  publish();
}

export function updateWorkspace(update: (current: Workspace) => Workspace) {
  if (connection.status !== 'guest' && connection.status !== 'member') return;
  const current = readWorkspace();
  const updated = update(current);
  if (updated === current) return;
  const next = reopenConflictingPlan(updated);
  if (connection.status === 'member') {
    memberSnapshot = next;
    pending = true;
    persistDraft(connection.account.id);
    publish();
    void flushWorkspace();
    return;
  }
  localSnapshot = next;
  try {
    rawSnapshot = JSON.stringify(next);
    localStorage.setItem(key, rawSnapshot);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  publish();
}

export function startFocus(mode: 'focus' | 'break', startedAt: number, target?: { entryId?: string; subjectId?: string }) {
  const id = crypto.randomUUID();
  updateWorkspace(current => {
    if (current.focus) return current;
    const entry = mode === 'focus' ? current.entries.find(item => item.id === target?.entryId && item.kind !== 'event' && !item.done) : undefined;
    const subject = mode === 'focus' ? current.subjects.find(item => item.id === target?.subjectId) : undefined;
    const seconds = (mode === 'focus' ? current.focusMinutes : current.breakMinutes) * 60;
    return { ...current, focus: { id, mode, seconds, remaining: seconds, endsAt: startedAt + seconds * 1000,
      subjectId: subject?.id ?? entry?.subjectId, entryId: entry?.id } };
  });
}

export function settleFocus(endsAt: number) {
  updateWorkspace(current => {
    if (current.focus?.endsAt !== endsAt || Date.now() < endsAt) return current;
    const { id, seconds, subjectId, entryId } = current.focus;
    const sessions = current.focus.mode === 'focus'
      ? [...current.sessions, { id, endedAt: endsAt, seconds, subjectId, entryId }] : current.sessions;
    return { ...current, focus: null, sessions };
  });
}

export function byDate(a: Entry, b: Entry) {
  return (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31') || (a.time ?? '').localeCompare(b.time ?? '');
}

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function displayDate(date: string) {
  return date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo';
}

function subscribeToDate(listener: () => void) {
  const timer = window.setInterval(listener, 30_000);
  window.addEventListener('focus', listener);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', listener);
  };
}

export function useLocalDate() {
  return useSyncExternalStore(subscribeToDate, () => localDate(), () => '');
}

export function useLocalMinute() {
  return useSyncExternalStore(subscribeToDate, () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, () => 0);
}

export function preventUnsavedExit(event: BeforeUnloadEvent) {
  if (!pending || draftOnDevice) return;
  event.preventDefault();
  event.returnValue = '';
}
