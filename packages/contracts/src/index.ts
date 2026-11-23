import { z } from 'zod';

export const recordId = z.uuid();
const linkId = z.union([recordId, z.literal('')]);
const date = z.iso.date();
const optionalDate = z.union([date, z.literal('')]);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const title = z.string().trim().min(1).max(140);
const text = z.string().trim().max(100);
const weekday = z.number().int().min(0).max(6);
const minutes = z.number().int().min(1).max(720);
const timestamp = z.number().int().nonnegative().max(8_640_000_000_000_000);

export const semesterSchema = z.object({ id: recordId, name: title, startsOn: date, endsOn: date })
  .refine(value => value.startsOn <= value.endsOn);
export const subjectSchema = z.object({ id: recordId, name: text.min(1), teacher: text, semesterId: linkId.optional() });
export const entryKind = z.enum(['task', 'exam', 'event']);
export const entrySchema = z.object({
  id: recordId, kind: entryKind, title, date: optionalDate, subjectId: linkId, done: z.boolean(),
  time: time.optional(), durationMinutes: minutes.optional(), effortMinutes: minutes.optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  preparation: z.number().int().min(0).max(100).optional(),
}).refine(value => (value.kind === 'task' || Boolean(value.date)) &&
  (!value.time || (value.date && value.durationMinutes && toMinutes(value.time) + value.durationMinutes <= 1440)));

const hours = z.object({ weekday, startsAt: time, endsAt: time });
export const availabilitySchema = hours.extend({ id: recordId }).refine(value => value.startsAt < value.endsAt);
export const scheduleSchema = hours.extend({ id: recordId, subjectId: recordId, location: text })
  .refine(value => value.startsAt < value.endsAt);

const focusLink = { subjectId: linkId.optional(), entryId: linkId.optional() };
export const sessionSchema = z.object({
  id: recordId.optional(), endedAt: timestamp, seconds: z.number().int().min(1).max(7200), ...focusLink,
});
export const focusSchema = z.object({
  id: recordId.optional(), mode: z.enum(['focus', 'break']), seconds: z.number().int().min(1).max(7200),
  remaining: z.number().int().min(0).max(7200), endsAt: timestamp.nullable(), ...focusLink,
}).refine(value => value.remaining <= value.seconds);
export const planBlockSchema = z.object({
  id: recordId, entryId: recordId, date, start: z.number().int().min(0).max(1439),
  end: z.number().int().min(1).max(1440),
}).refine(value => value.start < value.end);
export const planSchema = z.object({
  startsOn: date, accepted: z.boolean(), items: z.array(planBlockSchema).max(250).refine(items => new Set(items.map(item => item.id)).size === items.length), unscheduledMinutes: z.number().int().nonnegative(),
});
export const preferencesSchema = z.object({
  name: z.string().trim().max(60), focusMinutes: z.number().int().min(1).max(120),
  breakMinutes: z.number().int().min(1).max(60), onboardingComplete: z.boolean(),
  focus: focusSchema.nullable(), plan: planSchema.nullable(),
});

const unique = <T>(schema: z.ZodType<T>, key: (item: T) => string, max = 5000) =>
  z.array(schema).max(max).refine(items => new Set(items.map(key)).size === items.length);

export function sessionKey(session: StudySession) {
  return session.id ?? `${session.endedAt}:${session.seconds}`;
}

export const workspaceSchema = preferencesSchema.extend({
  semesters: unique(semesterSchema, item => item.id, 100),
  subjects: unique(subjectSchema, item => item.id, 1000),
  entries: unique(entrySchema, item => item.id),
  schedules: unique(scheduleSchema, item => item.id, 1000),
  availability: unique(availabilitySchema, item => item.id, 100),
  sessions: unique(sessionSchema, sessionKey, 10000),
}).superRefine((workspace, context) => {
  const semesters = new Set(workspace.semesters.map(item => item.id));
  const subjects = new Set(workspace.subjects.map(item => item.id));
  const entries = new Map(workspace.entries.map(item => [item.id, item]));
  const validLink = (item: { subjectId?: string; entryId?: string }) =>
    (!item.subjectId || subjects.has(item.subjectId)) &&
    (!item.entryId || (entries.has(item.entryId) && entries.get(item.entryId)?.kind !== 'event'));
  if (workspace.subjects.some(item => item.semesterId && !semesters.has(item.semesterId)) ||
    [...workspace.entries, ...workspace.schedules, ...workspace.sessions, ...(workspace.focus ? [workspace.focus] : [])].some(item => !validLink(item)) ||
    workspace.plan?.items.some(item => !validLink(item))) {
    context.addIssue({ code: 'custom', message: 'Há registros com vínculos inválidos.' });
  }
});

export type Semester = z.infer<typeof semesterSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type EntryKind = z.infer<typeof entryKind>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type StudySession = z.infer<typeof sessionSchema>;
export type Focus = z.infer<typeof focusSchema>;
export type StudyPlan = z.infer<typeof planSchema>;
export type PlanBlock = z.infer<typeof planBlockSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export interface Account { id: string; name: string; email: string }
export interface WorkspaceSnapshot { revision: number; workspace: Workspace }

export function emptyWorkspace(name = ''): Workspace {
  return {
    name, focusMinutes: 25, breakMinutes: 5, onboardingComplete: false,
    semesters: [], subjects: [], entries: [], schedules: [], availability: [],
    sessions: [], focus: null, plan: null,
  };
}

export const workspaceWriteSchema = z.object({
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  workspace: workspaceSchema,
});
export const loginSchema = z.object({
  email: z.email().max(254).trim().toLowerCase(),
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(60), password: z.string().min(8).max(128),
});

export function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour! * 60 + minute!;
}

export function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(value: string) {
  return new Date(`${value}T00:00:00Z`).getUTCDay();
}

export function mergeLocalWorkspace(current: Workspace, local: Workspace): Workspace {
  function merge<T>(saved: T[], imported: T[], key: (item: T) => string) {
    const existing = new Set(saved.map(key));
    return [...saved, ...imported.filter(item => !existing.has(key(item)))];
  }
  return {
    ...current,
    semesters: merge(current.semesters, local.semesters, item => item.id),
    subjects: merge(current.subjects, local.subjects, item => item.id),
    entries: merge(current.entries, local.entries, item => item.id),
    schedules: merge(current.schedules, local.schedules, item => item.id),
    availability: merge(current.availability, local.availability, item => item.id),
    sessions: merge(current.sessions, local.sessions, sessionKey),
  };
}

export function removeEntry(workspace: Workspace, id: string): Workspace {
  return {
    ...workspace,
    entries: workspace.entries.filter(item => item.id !== id),
    focus: workspace.focus?.entryId === id ? { ...workspace.focus, entryId: '' } : workspace.focus,
    sessions: workspace.sessions.map(item => item.entryId === id ? { ...item, entryId: '' } : item),
    plan: workspace.plan ? { ...workspace.plan, items: workspace.plan.items.filter(item => item.entryId !== id) } : null,
  };
}

export function removeSubject(workspace: Workspace, id: string): Workspace {
  return {
    ...workspace,
    subjects: workspace.subjects.filter(item => item.id !== id),
    schedules: workspace.schedules.filter(item => item.subjectId !== id),
    entries: workspace.entries.map(item => item.subjectId === id ? { ...item, subjectId: '' } : item),
    focus: workspace.focus?.subjectId === id ? { ...workspace.focus, subjectId: '' } : workspace.focus,
    sessions: workspace.sessions.map(item => item.subjectId === id ? { ...item, subjectId: '' } : item),
  };
}
