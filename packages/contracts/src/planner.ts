import { addDays, toMinutes, weekdayOf, type Entry, type PlanBlock, type Schedule, type StudyPlan, type Workspace } from '@orbit/contracts';

interface Interval { start: number; end: number }

function intersects(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

export function classesOn(workspace: Workspace, date: string): Schedule[] {
  return workspace.schedules.filter(schedule => {
    if (schedule.weekday !== weekdayOf(date)) return false;
    const subject = workspace.subjects.find(item => item.id === schedule.subjectId);
    const semester = workspace.semesters.find(item => item.id === subject?.semesterId);
    return Boolean(subject && (!semester || (semester.startsOn <= date && date <= semester.endsOn)));
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function nextClassAfter(workspace: Workspace, today: string, currentMinute: number) {
  const upcoming = workspace.schedules.flatMap(item => {
    const subject = workspace.subjects.find(value => value.id === item.subjectId);
    if (!subject) return [];
    const semester = workspace.semesters.find(value => value.id === subject.semesterId);
    const first = semester && semester.startsOn > today ? semester.startsOn : today;
    let date = addDays(first, (item.weekday - weekdayOf(first) + 7) % 7);
    if (date === today && toMinutes(item.startsAt) < currentMinute) date = addDays(date, 7);
    return semester && date > semester.endsOn ? [] : [{ ...item, date, subject: subject.name }];
  });
  return upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.startsAt.localeCompare(b.startsAt))[0];
}

function busyOn(workspace: Workspace, date: string) {
  return [
    ...classesOn(workspace, date).map(item => ({ start: toMinutes(item.startsAt), end: toMinutes(item.endsAt) })),
    ...workspace.entries.flatMap(item => {
      if (item.date !== date || !item.time || !item.durationMinutes) return [];
      const start = toMinutes(item.time);
      return [{ start, end: start + item.durationMinutes }];
    }),
  ];
}

function entryLimit(entry: Entry, date: string, startsOn: string) {
  if (!entry.date || (entry.kind === 'task' && entry.date < startsOn)) return 1440;
  if (entry.date < date) return 0;
  if (entry.date > date) return 1440;
  return entry.time ? toMinutes(entry.time) : entry.kind === 'exam' ? 0 : 1440;
}

export function availableOn(workspace: Workspace, date: string, excludedBlock?: string, plan?: StudyPlan) {
  const busy = busyOn(workspace, date);
  busy.push(...(plan?.items.filter(item => item.id !== excludedBlock && item.date === date) ?? []));
  busy.sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  const windows = workspace.availability.filter(item => item.weekday === weekdayOf(date))
    .map(item => ({ start: toMinutes(item.startsAt), end: toMinutes(item.endsAt) }))
    .sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const window of windows) {
    const last = merged.at(-1);
    if (last && last.end >= window.start) last.end = Math.max(last.end, window.end);
    else merged.push(window);
  }
  for (const window of merged) {
    let cursor = window.start;
    for (const interval of busy) {
      if (interval.end <= cursor) continue;
      if (interval.start >= window.end) break;
      if (cursor < interval.start) result.push({ start: cursor, end: interval.start });
      cursor = Math.max(cursor, interval.end);
    }
    if (cursor < window.end) result.push({ start: cursor, end: window.end });
  }
  return result;
}

export function canPlaceBlock(workspace: Workspace, plan: StudyPlan, block: PlanBlock, today: string, currentMinute: number) {
  if (block.date < today || block.date < plan.startsOn || block.date > addDays(plan.startsOn, 6) ||
    block.start >= block.end || (block.date === today && block.start < currentMinute)) return false;
  const entry = workspace.entries.find(item => item.id === block.entryId && !item.done);
  return Boolean(entry && block.end <= entryLimit(entry, block.date, plan.startsOn) &&
    availableOn(workspace, block.date, block.id, plan).some(interval => interval.start <= block.start && block.end <= interval.end));
}

export function studyCandidates(workspace: Workspace, startsOn: string) {
  const end = addDays(startsOn, 6);
  return workspace.entries.filter(item => !item.done && item.kind !== 'event' &&
    (!item.date || item.date <= end) && (item.kind !== 'exam' || item.date >= startsOn));
}

export function unscheduledStudy(workspace: Workspace, plan: StudyPlan) {
  const scheduled = new Map<string, number>();
  for (const block of plan.items) {
    scheduled.set(block.entryId, (scheduled.get(block.entryId) ?? 0) + block.end - block.start);
  }
  return studyCandidates(workspace, plan.startsOn).flatMap(entry => {
    const minutes = (entry.effortMinutes ?? workspace.focusMinutes) - (scheduled.get(entry.id) ?? 0);
    return minutes > 0 ? [{ entry, minutes }] : [];
  });
}

export function generateStudyPlan(workspace: Workspace, startsOn: string, currentMinute: number, id: () => string): StudyPlan {
  const plan: StudyPlan = { startsOn, items: [], accepted: false, unscheduledMinutes: 0 };
  const priority = { high: 2, normal: 1, low: 0 };
  function score(item: Entry) {
    return priority[item.priority ?? 'normal'] * 2 + (100 - (item.preparation ?? 50)) / 25;
  }
  const entries = studyCandidates(workspace, startsOn);
  entries.sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31') || score(b) - score(a) || a.id.localeCompare(b.id));
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(startsOn, offset);
    const slots = availableOn(workspace, date);
    if (offset === 0) for (const slot of slots) slot.start = Math.max(slot.start, currentMinute);
    return { date, slots };
  });
  for (const entry of entries) {
    let effort = entry.effortMinutes ?? workspace.focusMinutes;
    for (const { date, slots } of days) {
      const limit = entryLimit(entry, date, startsOn);
      for (const slot of slots) {
        const end = Math.min(slot.end, limit);
        while (effort > 0 && slot.start < end && plan.items.length < 250) {
          const duration = Math.min(effort, workspace.focusMinutes, end - slot.start);
          plan.items.push({ id: id(), entryId: entry.id, date, start: slot.start, end: slot.start + duration });
          effort -= duration;
          slot.start += duration + workspace.breakMinutes;
        }
      }
    }
    plan.unscheduledMinutes += effort;
  }
  plan.items.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  return plan;
}

export function scheduleConflicts(workspace: Workspace, candidate: Schedule) {
  const semester = (subjectId: string) => workspace.semesters.find(item =>
    item.id === workspace.subjects.find(subject => subject.id === subjectId)?.semesterId);
  const candidateSemester = semester(candidate.subjectId);
  return workspace.schedules.some(item => {
    if (item.id === candidate.id || item.weekday !== candidate.weekday) return false;
    const otherSemester = semester(item.subjectId);
    if (candidateSemester && otherSemester &&
      (candidateSemester.endsOn < otherSemester.startsOn || otherSemester.endsOn < candidateSemester.startsOn)) return false;
    return intersects(
      { start: toMinutes(candidate.startsAt), end: toMinutes(candidate.endsAt) },
      { start: toMinutes(item.startsAt), end: toMinutes(item.endsAt) },
    );
  });
}


export function reopenConflictingPlan(workspace: Workspace): Workspace {
  const { plan } = workspace;
  if (!plan?.accepted || (plan.items.length > 0 &&
    plan.items.every(block => canPlaceBlock(workspace, plan, block, plan.startsOn, 0)))) return workspace;
  return { ...workspace, plan: { ...plan, accepted: false } };
}
