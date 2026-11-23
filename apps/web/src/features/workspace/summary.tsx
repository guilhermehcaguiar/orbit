'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, Check, CheckSquare, ClipboardList, Clock, Play, Plus, Timer } from 'lucide-react';
import { Button } from '@orbit/design-system';
import { RecordLink, WorkspaceHeading } from './presentation';
import { LocalImport } from './local-import';
import { agendaOn, agendaRange, entryHref, entryLabels } from './records';
import { timeLabel, type Entry } from '@orbit/contracts';
import { nextClassAfter } from '@orbit/contracts/planner';
import { byDate, displayDate, localDate, startFocus, updateWorkspace, useLocalDate, useLocalMinute, useWorkspace } from './store';

const agendaLabels = { ...entryLabels, class: 'Aula', study: 'Estudo' };
const agendaIcons = { task: CheckSquare, exam: ClipboardList, event: CalendarDays, class: Clock, study: BookOpen };

function TaskQueue({ items, overdue = false, onComplete }: { items: Entry[]; overdue?: boolean; onComplete: (id: string) => void }) {
  if (!items.length) return null;
  return <section className="ws-panel home-agenda" aria-label={overdue ? 'Tarefas atrasadas' : 'Tarefas sem prazo'}>
    <div className="ws-section-head"><h2>{overdue ? 'Em atraso' : 'Sem prazo'} <span className="today-count">{items.length}</span></h2>
      <Link href="/tasks" className="ws-text-link">Ver tarefas</Link>
    </div>
    <ul className="entry-list">{items.slice(0, 5).map(item => <li key={item.id} className="entry-row today-row">
      <span className="entry-icon" data-kind="task"><CheckSquare size={17} aria-hidden="true" /></span>
      <div className="entry-copy"><RecordLink href={entryHref(item)}>{item.title}</RecordLink>
        {overdue && <p className="today-overdue">Venceu em {displayDate(item.date)}</p>}</div>
      <Button size="sm" variant="secondary" aria-label={`Concluir ${item.title}`} onClick={() => onComplete(item.id)}><Check size={15} aria-hidden="true" />Concluir</Button>
    </li>)}</ul>
  </section>;
}

export function Dashboard() {
  const workspace = useWorkspace();
  const { name, subjects, entries, focus, focusMinutes, plan } = workspace;
  const today = useLocalDate();
  const clock = useLocalMinute();
  const nextClass = today ? nextClassAfter(workspace, today, clock) : undefined;
  const nextStudy = plan?.accepted ? plan.items.find(item => item.date > today || (item.date === today && item.start >= clock)) : undefined;
  const tasks = entries.filter(item => item.kind === 'task' && !item.done);
  const undated = tasks.filter(item => !item.date);
  const urgent = today ? tasks.filter(item => item.date && item.date < today).sort(byDate) : [];
  const nextDeadlines = today ? entries.filter(item => item.date > today && !item.done).sort(byDate).slice(0, 3) : [];
  const agenda = today ? agendaOn(workspace, today) : [];
  const week = today ? agendaRange(workspace, today, 7) : [];
  const firstUse = subjects.length === 0 || !entries.some(item => item.kind !== 'event');
  const nextFocus = nextStudy ? entries.find(item => item.id === nextStudy.entryId) : urgent[0] ?? tasks.find(item => item.date === today) ?? undated[0];
  const date = today ? new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' }) : '';

  function complete(id: string) {
    updateWorkspace(current => ({ ...current, entries: current.entries.map(item =>
      item.kind === 'task' && item.id === id ? { ...item, done: true } : item) }));
  }

  return <div className="ws-page">
    <WorkspaceHeading title="Hoje" description={date ? `${name ? `Olá, ${name}. ` : ''}${date}` : undefined} action={
      <RecordLink href="/tasks#novo" className="orbit-button orbit-button--secondary"><Plus size={17} aria-hidden="true" />Nova tarefa</RecordLink>
    } />
    <LocalImport prominent />
    {firstUse && <section className="ws-panel settings-info today-first">
      <div><h2>Organize seu primeiro compromisso</h2><p>Adicione uma disciplina e uma tarefa ou prova para começar a usar sua agenda.</p></div>
      <Link href="/onboarding" className="orbit-button orbit-button--primary">Começar organização</Link>
    </section>}
    <div className="home-layout">
      <div className="home-sidebar">
        <TaskQueue items={urgent} overdue onComplete={complete} />
        <section className="ws-panel home-agenda" aria-label="Agenda de hoje">
          <div className="ws-section-head"><h2>Agenda de hoje</h2><Link href="/calendar" className="ws-text-link">Ver calendário <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          {agenda.length ? <ul className="entry-list">{agenda.map(item => {
            const Icon = agendaIcons[item.type];
            return <li key={`${item.type}:${item.id}`} className="entry-row today-row">
              <span className="entry-icon" data-kind={item.type}><Icon size={17} aria-hidden="true" /></span>
              <div className="entry-copy"><RecordLink href={item.href}>{item.title}</RecordLink>
                <p>{[agendaLabels[item.type], item.time, item.detail].filter(Boolean).join(' · ')}</p></div>
              {item.type === 'task' && <Button size="sm" variant="secondary" aria-label={`Concluir ${item.title}`} onClick={() => complete(item.id)}><Check size={15} aria-hidden="true" />Concluir</Button>}
            </li>;
          })}</ul> : <p className="today-empty">Nenhum compromisso para hoje.</p>}
        </section>
        <TaskQueue items={undated} onComplete={complete} />
        {nextDeadlines.length > 0 && <section className="ws-panel home-agenda" aria-label="Próximos prazos">
          <div className="ws-section-head"><h2>Próximos prazos</h2><Link href="/calendar" className="ws-text-link">Ver calendário</Link></div>
          <ul className="entry-list">{nextDeadlines.map(item => {
            const Icon = agendaIcons[item.kind];
            return <li key={item.id} className="entry-row today-row">
              <span className="entry-icon" data-kind={item.kind}><Icon size={17} aria-hidden="true" /></span>
              <div className="entry-copy"><RecordLink href={entryHref(item)}>{item.title}</RecordLink><p>{entryLabels[item.kind]}</p></div>
              <time className="entry-date" dateTime={item.date}>{displayDate(item.date)}</time>
            </li>;
          })}</ul>
        </section>}
      </div>
      <div className="home-sidebar">
        <section className="ws-panel home-focus" aria-labelledby="home-focus">
          <h2 id="home-focus"><Timer size={18} aria-hidden="true" /> Foco</h2>
          <div className="home-focus-reading"><strong>{focus ? (focus.endsAt ? 'Em andamento' : 'Pausado') : `${focusMinutes} min`}</strong>
            <p>{focus ? focus.mode === 'break' ? 'Pausa' : 'Sessão de foco' : nextFocus?.title ?? 'Sessão de foco'}</p></div>
          {focus ? <Link className="orbit-button orbit-button--secondary" href="/pomodoro">Abrir cronômetro</Link>
            : <Button variant="secondary" onClick={() => startFocus('focus', Date.now(), { entryId: nextFocus?.id })}><Play size={16} aria-hidden="true" />Iniciar foco</Button>}
          {nextStudy && <RecordLink className="ws-text-link" href={`/ai#bloco-${nextStudy.id}`}>Próximo estudo · {displayDate(nextStudy.date)} às {timeLabel(nextStudy.start)}</RecordLink>}
        </section>
        <section className="ws-panel settings-info home-next-class">
          <div className="ws-section-head"><h2>Próxima aula</h2><Link className="ws-text-link" href="/schedule">Ver horários</Link></div>
          {nextClass ? <div className="entry-row">
            <span className="entry-icon"><Clock size={18} aria-hidden="true" /></span>
            <div className="entry-copy"><strong>{nextClass.subject}</strong>
              <p>{[displayDate(nextClass.date), nextClass.startsAt, nextClass.location].filter(Boolean).join(' · ')}</p></div>
          </div> : <p>Nenhuma aula agendada.</p>}
        </section>
      </div>
    </div>
    {week.length > 0 && <section className="ws-panel week-panel" aria-labelledby="week-title">
      <div className="ws-section-head"><h2 id="week-title">Próximos 7 dias</h2></div>
      <ol className="week-days">{week.map(day => <li key={day.date}>
        <RecordLink href={`/calendar#dia-${day.date}`} aria-label={`${displayDate(day.date)}, ${day.items.length} compromissos`}>
          <time dateTime={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })}</span><strong>{Number(day.date.slice(-2))}</strong></time>
          <span className="week-count" data-has-entries={day.items.length > 0}>{day.items.length}</span>
        </RecordLink>
      </li>)}</ol>
    </section>}
  </div>;
}

export function Statistics() {
  const { entries, sessions, subjects } = useWorkspace();
  const today = useLocalDate();
  const tasks = entries.filter(item => item.kind === 'task');
  const completed = tasks.filter(item => item.done).length;
  const start = today ? new Date(`${today}T12:00:00`) : null;
  const recent = start ? Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() - 6 + index);
    const dateKey = localDate(date);
    const daySessions = sessions.filter(session => localDate(new Date(session.endedAt)) === dateKey);
    return {
      date: dateKey, label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      minutes: Math.floor(daySessions.reduce((sum, session) => sum + session.seconds, 0) / 60), count: daySessions.length,
    };
  }) : [];
  const recentDates = new Set(recent.map(day => day.date));
  const bySubject = new Map<string, number>();
  for (const session of sessions) {
    if (!recentDates.has(localDate(new Date(session.endedAt)))) continue;
    const key = session.subjectId || '';
    bySubject.set(key, (bySubject.get(key) ?? 0) + session.seconds);
  }
  const minutes = recent.reduce((sum, day) => sum + day.minutes, 0);
  const count = recent.reduce((sum, day) => sum + day.count, 0);
  const peak = Math.max(1, ...recent.map(day => day.minutes));

  return <div className="ws-page">
    <WorkspaceHeading title="Estatísticas" description="Acompanhe seu ritmo de estudo e o progresso das tarefas." />
    <div className="stats-layout">
      <section className="ws-panel stats-focus" aria-labelledby="stats-focus">
        <div className="ws-section-head"><div><h2 id="stats-focus">Tempo de foco</h2><p>Últimos 7 dias</p></div><Link href="/pomodoro" className="ws-text-link">Abrir Pomodoro <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        <div className="stats-total"><strong>{minutes} min</strong><span>{count} {count === 1 ? 'sessão' : 'sessões'}</span></div>
        {count ? <ol className="stats-chart" aria-label="Minutos de foco por dia">{recent.map(day => <li key={day.date}>
          <span>{day.minutes}<span className="orbit-sr-only"> minutos em {displayDate(day.date)}</span></span>
          <div className="stats-bar-track" aria-hidden="true"><i style={{ '--bar-size': `${Math.max(2, 100 * day.minutes / peak)}%` } as CSSProperties} /></div>
          <span aria-hidden="true">{day.label}</span>
        </li>)}</ol> : <p className="stats-empty">Conclua uma sessão de Pomodoro para acompanhar seu tempo por dia.</p>}
      </section>
      <section className="ws-panel stats-tasks" aria-labelledby="stats-tasks">
        <div className="ws-section-head"><div><h2 id="stats-tasks">Tarefas concluídas</h2></div><CheckSquare size={20} aria-hidden="true" /></div>
        <div className="stats-total"><strong>{completed}</strong><span>de {tasks.length}</span></div>
        {tasks.length > 0 && <progress value={completed} max={tasks.length} aria-label="Progresso de tarefas" />}
        <Link href="/tasks" className="ws-text-link">Ver tarefas <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </section>
    </div>
    {bySubject.size > 0 && <section className="ws-panel settings-info">
      <div className="ws-section-head"><div><h2>Tempo de foco por disciplina</h2><p>Últimos 7 dias</p></div></div>
      <ul className="entry-list">{[...bySubject].sort((a, b) => b[1] - a[1]).map(([id, seconds]) => <li className="entry-row statistic-subject-row" key={id || 'unlinked'}>
        <div className="entry-copy"><strong>{subjects.find(item => item.id === id)?.name ?? 'Sem disciplina'}</strong></div><span>{Math.floor(seconds / 60)} min</span>
      </li>)}</ul>
    </section>}
  </div>;
}
