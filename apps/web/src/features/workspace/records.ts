import { addDays, timeLabel, toMinutes, type Entry, type Workspace } from '@orbit/contracts';
import { classesOn } from '@orbit/contracts/planner';

const routes = { task: '/tasks', exam: '/exams', event: '/calendar' };
export const entryLabels = { task: 'Tarefa', exam: 'Prova', event: 'Evento' };

export function entryHref(item: Pick<Entry, 'kind' | 'id'>) {
  return `${routes[item.kind]}#editar-${item.id}`;
}

export function agendaOn(workspace: Workspace, date: string, includeCompleted = false) {
  const subjectName = (id: string) => workspace.subjects.find(subject => subject.id === id)?.name;
  return [
    ...workspace.entries.filter(item => item.date === date && (includeCompleted || !item.done)).map(item => ({
      id: item.id, type: item.kind, title: item.title, href: entryHref(item), done: item.done,
      detail: subjectName(item.subjectId), time: item.time, end: item.time && item.durationMinutes
        ? timeLabel(toMinutes(item.time) + item.durationMinutes) : undefined,
    })),
    ...classesOn(workspace, date).map(item => ({
      id: item.id, type: 'class' as const, title: subjectName(item.subjectId) ?? 'Aula', href: '/schedule',
      detail: item.location, time: item.startsAt, end: item.endsAt,
    })),
    ...(workspace.plan?.accepted ? workspace.plan.items.filter(item => item.date === date).map(item => {
      const entry = workspace.entries.find(value => value.id === item.entryId);
      return {
        id: item.id, type: 'study' as const, title: entry?.title ?? 'Sessão de estudo',
        href: `/ai#bloco-${item.id}`, detail: entry ? subjectName(entry.subjectId) : undefined,
        time: timeLabel(item.start), end: timeLabel(item.end),
      };
    }) : []),
  ].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
}

export function agendaRange(workspace: Workspace, from: string, days: number, includeCompleted = false) {
  return Array.from({ length: days }, (_, offset) => {
    const date = addDays(from, offset);
    return { date, items: agendaOn(workspace, date, includeCompleted) };
  });
}
