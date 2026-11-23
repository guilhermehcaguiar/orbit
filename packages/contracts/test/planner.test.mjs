import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { emptyWorkspace, mergeLocalWorkspace } from '@orbit/contracts';
import { canPlaceBlock, classesOn, generateStudyPlan, nextClassAfter, reopenConflictingPlan, scheduleConflicts } from '@orbit/contracts/planner';

const monday = '2026-11-23';
function createWorkspace() {
  const semester = { id: randomUUID(), name: '2026.2', startsOn: monday, endsOn: '2026-12-04' };
  const subject = { id: randomUUID(), name: 'Cálculo', teacher: '', semesterId: semester.id };
  const task = { id: randomUUID(), title: 'Lista', date: monday, kind: 'task', done: false, subjectId: subject.id, effortMinutes: 30 };
  const exam = { id: randomUUID(), title: 'Prova', date: monday, time: '11:15', durationMinutes: 30, kind: 'exam', done: false, subjectId: subject.id, effortMinutes: 60 };
  const event = { id: randomUUID(), title: 'Evento', date: monday, time: '10:30', durationMinutes: 30, kind: 'event', done: false, subjectId: '' };
  return {
    ...emptyWorkspace(),
    semesters: [semester], subjects: [subject], entries: [task, exam, event],
    schedules: [{ id: randomUUID(), weekday: 1, startsAt: '09:30', endsAt: '10:00', subjectId: subject.id, location: '' }],
    availability: [
      { id: randomUUID(), weekday: 1, startsAt: '09:00', endsAt: '10:30' },
      { id: randomUUID(), weekday: 1, startsAt: '10:00', endsAt: '12:00' },
    ],
  };
}

test('planeja dentro da disponibilidade sem sobrepor aulas, eventos, provas ou o momento atual', () => {
  const workspace = createWorkspace();
  const plan = generateStudyPlan(workspace, monday, 555, randomUUID);
  assert.ok(plan.items.length > 0);
  assert.ok(plan.unscheduledMinutes > 0);
  for (const block of plan.items) {
    assert.equal(canPlaceBlock(workspace, plan, block, monday, 555), true);
    assert.ok(block.start >= 555);
    if (block.entryId === workspace.entries[1].id) assert.ok(block.end <= 675);
  }
  const first = plan.items[0];
  assert.equal(canPlaceBlock(workspace, plan, { ...first, start: 575, end: 590 }, monday, 555), false);
  const moved = { ...workspace, availability: [], plan: { ...plan, accepted: true } };
  assert.equal(reopenConflictingPlan(moved).plan.accepted, false);
});

test('prazos futuros não viram atrasos dentro do plano e aulas respeitam o semestre', () => {
  const workspace = createWorkspace();
  const task = workspace.entries[0];
  workspace.entries = [{ ...task, date: '2026-11-24' }];
  workspace.availability = [{ id: randomUUID(), weekday: 3, startsAt: '09:00', endsAt: '10:00' }];
  const plan = generateStudyPlan(workspace, monday, 0, randomUUID);
  assert.deepEqual(plan.items, []);
  assert.equal(plan.unscheduledMinutes, 30);
  assert.equal(classesOn(workspace, monday).length, 1);
  assert.equal(classesOn(workspace, '2026-12-07').length, 0);
  assert.equal(nextClassAfter(workspace, '2026-11-01', 0).date, monday);
  assert.equal(nextClassAfter(workspace, monday, 600).date, '2026-11-30');
  assert.equal(scheduleConflicts(workspace, { ...workspace.schedules[0], id: randomUUID() }), true);
});

test('reimportar mantém identificadores e as edições feitas na conta', () => {
  const local = createWorkspace();
  const imported = mergeLocalWorkspace(emptyWorkspace('Conta'), local);
  imported.subjects[0] = { ...imported.subjects[0], name: 'Disciplina editada' };
  const retried = mergeLocalWorkspace(imported, local);
  assert.deepEqual(retried, imported);
  assert.equal(retried.name, 'Conta');
});
