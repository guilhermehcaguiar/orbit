'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, CheckSquare, ClipboardList, ListTodo, Play, Plus, Timer } from 'lucide-react';
import { BlankSlate, WorkspaceHeading } from './presentation';
import { byDate, displayDate, localDate, useLocalDate, useWorkspace, type Entry } from './store';

const entryNames = { task: 'Tarefa', exam: 'Prova', event: 'Evento' };
const entryIcons = { task: CheckSquare, exam: ClipboardList, event: CalendarDays };
const entryRoutes = { task: '/tasks', exam: '/exams', event: '/calendar' };

export function Dashboard() {
  const { name, subjects, entries, focus, focusMinutes } = useWorkspace();
  const today = useLocalDate();
  const tasks = entries.filter(item => item.kind === 'task' && !item.done);
  const exams = entries.filter(item => item.kind === 'exam' && item.date >= today);
  const upcoming = entries.filter(item => item.date && item.date >= today && !item.done).sort(byDate).slice(0, 5);
  const date = today ? new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' }) : '';
  const week = today ? Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${today}T12:00:00`);
    day.setDate(day.getDate() + index);
    const key = localDate(day);
    return {
      key, weekday: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dayOfMonth: day.getDate(), count: entries.filter(item => item.date === key && !item.done).length,
    };
  }) : [];
  const metrics = [
    { value: subjects.length, title: 'Disciplinas', icon: BookOpen, route: '/subjects', kind: 'subject' },
    { value: tasks.length, title: 'Tarefas pendentes', icon: CheckSquare, route: '/tasks', kind: 'task' },
    { value: exams.length, title: 'Próximas provas', icon: ClipboardList, route: '/exams', kind: 'exam' },
  ];

  return <div className="ws-page">
    <WorkspaceHeading title={name ? `Olá, ${name}!` : 'Seu espaço de estudos'} description={date} action={<Link href={subjects.length ? '/tasks#novo' : '/subjects#novo'} className="orbit-button orbit-button--primary"><Plus size={17} aria-hidden="true" />{subjects.length ? 'Nova tarefa' : 'Nova disciplina'}</Link>} />
    <div className="home-metrics">{metrics.map(({ value, title, icon: Icon, route, kind }) => <Link key={route} href={route} className="ws-panel home-metric">
      <span className="entry-icon" data-kind={kind}><Icon size={19} aria-hidden="true" /></span>
      <span><strong>{value}</strong><span>{title}</span></span>
      <ArrowUpRight className="home-metric-arrow" size={16} aria-hidden="true" />
    </Link>)}</div>
    <div className="home-layout">
      <section className="ws-panel home-agenda" aria-labelledby="home-agenda">
        <div className="ws-section-head"><div><h2 id="home-agenda">Próximos compromissos</h2></div><Link href="/calendar" className="ws-text-link">Ver calendário <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        {upcoming.length ? <ul className="entry-list">{upcoming.map(item => {
          const Icon = entryIcons[item.kind];
          return <li key={item.id}><Link className="entry-row entry-row-link" href={entryRoutes[item.kind]}>
            <span className="entry-icon" data-kind={item.kind}><Icon size={17} aria-hidden="true" /></span>
            <span className="entry-copy"><strong>{item.title}</strong><small>{subjects.find(subject => subject.id === item.subjectId)?.name || entryNames[item.kind]}</small></span>
            <time className="entry-date" dateTime={item.date}>{item.date === today ? 'Hoje' : displayDate(item.date)}</time>
          </Link></li>;
        })}</ul> : <BlankSlate icon={CalendarDays} title="Nenhum compromisso agendado" description="Provas, tarefas com prazo e eventos aparecem aqui." action={<Link href="/calendar" className="orbit-button orbit-button--secondary">Abrir calendário</Link>} />}
      </section>
      <section className="ws-panel home-focus" aria-labelledby="home-focus">
        <h2 id="home-focus"><Timer size={18} aria-hidden="true" /> Pomodoro</h2>
        <div className="home-focus-reading"><strong>{focus ? (focus.endsAt ? 'Em andamento' : 'Pausado') : `${focusMinutes} min`}</strong><p>{focus?.mode === 'break' ? 'Pausa' : 'Sessão de foco'}</p></div>
        <Link className="orbit-button orbit-button--secondary" href="/pomodoro"><Play size={16} aria-hidden="true" /> Abrir cronômetro</Link>
      </section>
    </div>
    <section className="ws-panel week-panel" aria-labelledby="week-title">
      <div className="ws-section-head"><div><h2 id="week-title">Próximos 7 dias</h2><p>Compromissos por dia</p></div></div>
      <ol className="week-days">{week.map(day => <li key={day.key}>
        <time dateTime={day.key}><span>{day.weekday}</span><strong>{day.dayOfMonth}</strong></time>
        <span className="week-count" data-has-entries={day.count > 0}>{day.count}<span className="orbit-sr-only"> {day.count === 1 ? 'compromisso' : 'compromissos'}</span></span>
      </li>)}</ol>
    </section>
  </div>;
}

function planDate(item: Entry, today: string) {
  if (!item.date) return 'Sem prazo';
  if (item.date === today) return 'Hoje';
  if (item.date < today) return 'Em atraso';
  return displayDate(item.date);
}

export function StudyPlan() {
  const { entries, subjects } = useWorkspace();
  const today = useLocalDate();
  const plan = entries.filter(item => (item.kind === 'exam' && item.date >= today) || (item.kind === 'task' && !item.done)).sort(byDate).slice(0, 5);

  return <div className="ws-page">
    <WorkspaceHeading title="Plano de estudos" description="Prioridades organizadas pelos prazos das suas tarefas e provas." />
    <section className="ws-panel plan-panel" aria-label="Prioridades de estudo">
      {plan.length ? <ol className="plan-list">{plan.map((item, index) => {
        const Icon = entryIcons[item.kind];
        return <li key={item.id} className="plan-step">
          <span className="plan-step-number" aria-hidden="true">{index + 1}</span>
          <Link href={entryRoutes[item.kind]}>
            <span className="entry-icon" data-kind={item.kind}><Icon size={19} aria-hidden="true" /></span>
            <span className="entry-copy"><strong>{item.title}</strong><small>{[entryNames[item.kind], subjects.find(subject => subject.id === item.subjectId)?.name].filter(Boolean).join(' · ')}</small></span>
            <span className="entry-date" data-overdue={Boolean(item.date && item.date < today)}>{planDate(item, today)}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </li>;
      })}</ol> : <BlankSlate icon={ListTodo} title="Seu plano ainda não tem itens" description="Adicione uma tarefa pendente ou uma prova futura para ver suas prioridades." action={<Link href="/tasks" className="orbit-button orbit-button--secondary">Abrir tarefas</Link>} />}
    </section>
  </div>;
}

export function Statistics() {
  const { entries, sessions } = useWorkspace();
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
  </div>;
}
