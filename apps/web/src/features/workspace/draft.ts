import { sessionKey, workspaceSchema, workspaceWriteSchema, type Workspace, type WorkspaceSnapshot } from '@orbit/contracts';
import { reopenConflictingPlan } from '@orbit/contracts/planner';
import { z } from 'zod';

const draftSchema = z.object({
  base: workspaceWriteSchema,
  workspace: workspaceSchema,
  updatedAt: z.number(),
});
export type Draft = z.infer<typeof draftSchema>;
export interface StoredDraft { key: string; raw: string; draft: Draft }

function draftPrefix(account: string) {
  return `orbit.workspace.draft.v1.${account}.`;
}

export function readLatestDraft(account: string) {
  try {
    const storage = localStorage;
    const prefix = draftPrefix(account);
    let latest: StoredDraft | undefined;
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = draftSchema.safeParse(JSON.parse(raw));
        if (parsed.success && (!latest || latest.draft.updatedAt < parsed.data.updatedAt)) {
          latest = { key, raw, draft: parsed.data };
        }
      } catch { /* A malformed draft does not prevent loading other drafts. */ }
    }
    return latest;
  } catch {
    return undefined;
  }
}

export function saveDraft(account: string, writer: string, base: WorkspaceSnapshot, workspace: Workspace) {
  try {
    const key = draftPrefix(account) + writer;
    const draft = { base, workspace, updatedAt: Date.now() };
    const raw = JSON.stringify(draft);
    localStorage.setItem(key, raw);
    return { key, raw, draft };
  } catch {
    return undefined;
  }
}

export function removeDraft(draft: StoredDraft | undefined) {
  if (!draft) return;
  try {
    if (localStorage.getItem(draft.key) === draft.raw) localStorage.removeItem(draft.key);
  } catch { /* Storage can be disabled while the workspace is open. */ }
}

export function reapplyDraft(base: Workspace, local: Workspace, remote: Workspace) {
  function ordered(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ordered);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
        .map(([key, content]) => [key, ordered(content)]));
    }
    return value;
  }

  function choose<T>(before: T, edited: T, online: T) {
    if (before === edited) return online;
    return JSON.stringify(ordered(before)) === JSON.stringify(ordered(edited)) ? online : edited;
  }

  function merge<T>(before: T[], edited: T[], online: T[], key: (record: T) => string) {
    const original = new Map(before.map(record => [key(record), record]));
    const changed = new Map(edited.map(record => [key(record), record]));
    const latest = new Map(online.map(record => [key(record), record]));
    const ids = new Set([...latest.keys(), ...changed.keys()]);
    return [...ids].flatMap(id => {
      const record = choose(original.get(id), changed.get(id), latest.get(id));
      return record === undefined ? [] : [record];
    });
  }

  const newWorkspace = {
    name: choose(base.name, local.name, remote.name),
    focusMinutes: choose(base.focusMinutes, local.focusMinutes, remote.focusMinutes),
    breakMinutes: choose(base.breakMinutes, local.breakMinutes, remote.breakMinutes),
    onboardingComplete: choose(base.onboardingComplete, local.onboardingComplete, remote.onboardingComplete),
    focus: choose(base.focus, local.focus, remote.focus),
    plan: choose(base.plan, local.plan, remote.plan),
    semesters: merge(base.semesters, local.semesters, remote.semesters, item => item.id),
    subjects: merge(base.subjects, local.subjects, remote.subjects, item => item.id),
    entries: merge(base.entries, local.entries, remote.entries, item => item.id),
    schedules: merge(base.schedules, local.schedules, remote.schedules, item => item.id),
    availability: merge(base.availability, local.availability, remote.availability, item => item.id),
    sessions: merge(base.sessions, local.sessions, remote.sessions, sessionKey),
  };
  const validated = workspaceSchema.safeParse(newWorkspace);
  return validated.success ? reopenConflictingPlan(validated.data) : undefined;
}
