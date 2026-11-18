'use client';

import { useSyncExternalStore } from 'react';

export interface Subject { id: string; name: string; teacher: string }
export type EntryKind = 'task' | 'exam' | 'event';
export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  date: string;
  subjectId: string;
  done: boolean;
}
export interface Focus {
  mode: 'focus' | 'break';
  seconds: number;
  remaining: number;
  endsAt: number | null;
}
interface StudySession { endedAt: number; seconds: number }
export interface Workspace {
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  subjects: Subject[];
  entries: Entry[];
  sessions: StudySession[];
  focus: Focus | null;
}

const key = 'orbit.workspace.v1';
const initial: Workspace = {
  name: '', focusMinutes: 25, breakMinutes: 5,
  subjects: [], entries: [], sessions: [], focus: null,
};
let snapshot = initial;
let rawSnapshot: string | null = null;
let memoryOnly = false;
const listeners = new Set<() => void>();

function readWorkspace() {
  if (memoryOnly) return snapshot;
  try {
    const raw = localStorage.getItem(key);
    if (raw === rawSnapshot) return snapshot;
    const saved: Partial<Workspace> | null = raw ? JSON.parse(raw) : null;
    snapshot = saved && Array.isArray(saved.subjects) && Array.isArray(saved.entries) && Array.isArray(saved.sessions)
      ? { ...initial, ...saved }
      : initial;
    rawSnapshot = raw;
  } catch {
    return snapshot;
  }
  return snapshot;
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

export function useMemoryOnly() {
  return useSyncExternalStore(subscribe, () => memoryOnly, () => false);
}

export function updateWorkspace(update: (current: Workspace) => Workspace) {
  const current = readWorkspace();
  const next = update(current);
  if (next === current) return;
  snapshot = next;
  try {
    rawSnapshot = JSON.stringify(next);
    localStorage.setItem(key, rawSnapshot);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  listeners.forEach(listener => listener());
}

export function settleFocus(endsAt: number) {
  updateWorkspace(current => {
    if (current.focus?.endsAt !== endsAt || Date.now() < endsAt) return current;
    const sessions = current.focus.mode === 'focus'
      ? [...current.sessions, { endedAt: endsAt, seconds: current.focus.seconds }]
      : current.sessions;
    return { ...current, focus: null, sessions };
  });
}

export function byDate(a: Entry, b: Entry) {
  return (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31');
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

const noopSubscribe = () => () => {};

export function useLocalDate() {
  return useSyncExternalStore(noopSubscribe, () => localDate(), () => '');
}
