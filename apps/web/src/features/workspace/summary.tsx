'use client';

import Link from 'next/link';
import { BookOpen, CheckSquare, ClipboardList, Timer } from 'lucide-react';
import { Card, PageHeader, SectionTitle, StatCard } from '@orbit/design-system';
import { byDate, displayDate, localDate, useLocalDate, useWorkspace, type Entry } from './store';

function itemRoute(item: Entry) {
  return item.kind === 'task' ? '/tasks' : item.kind === 'exam' ? '/exams' : '/calendar';
}

export function Dashboard() {
  const { name, subjects, entries } = useWorkspace();
  const today = useLocalDate();
  const tasks = entries.filter(item => item.kind === 'task' && !item.done);
  const exams = entries.filter(item => item.kind === 'exam' && item.date >= today);
  const upcoming = entries.filter(item => item.date && item.date >= today && !item.done).sort(byDate).slice(0, 5);
  return <div className="work-page">
    <PageHeader title={name ? `Olá, ${name}!` : 'Seu espaço de estudos'} />
    <div className="overview-grid">
      <StatCard title="Disciplinas" icon={<BookOpen size={22} />} footer={<Link href="/subjects">Gerenciar disciplinas</Link>}><strong>{subjects.length}</strong></StatCard>
      <StatCard title="Tarefas pendentes" icon={<CheckSquare size={22} />} footer={<Link href="/tasks">Ver tarefas</Link>}><strong>{tasks.length}</strong></StatCard>
      <StatCard title="Próximas provas" icon={<ClipboardList size={22} />} footer={<Link href="/exams">Ver provas</Link>}><strong>{exams.length}</strong></StatCard>
      <StatCard title="Pomodoro" icon={<Timer size={22} />} footer={<Link href="/pomodoro">Abrir cronômetro</Link>}><strong>Foco</strong></StatCard>
    </div>
    <SectionTitle title="Próximos compromissos" action={<Link href="/calendar" className="text-link">Abrir calendário</Link>} />
    {upcoming.length ? <ul className="work-list">{upcoming.map(item => <li key={item.id}><Card className="work-row"><Link href={itemRoute(item)}>{item.title}</Link><span>{displayDate(item.date)}</span></Card></li>)}</ul>
      : <p className="work-empty">Os próximos eventos, provas e tarefas com prazo aparecem aqui.</p>}
  </div>;
}

export function StudyPlan() {
  const { entries, subjects } = useWorkspace();
  const today = useLocalDate();
  const plan = entries.filter(item => (item.kind === 'exam' && item.date >= today) || (item.kind === 'task' && !item.done)).sort(byDate).slice(0, 5);

  return <div className="work-page">
    <PageHeader title="Plano de estudos" description="Prioridades a partir dos prazos das suas tarefas e provas." />
    {plan.length ? <ol className="work-list work-ordered">{plan.map(item => <li key={item.id}><Card className="work-row">
      <div><Link href={itemRoute(item)}>{item.title}</Link><p>{subjects.find(subject => subject.id === item.subjectId)?.name}</p></div>
      <span>{displayDate(item.date)}</span>
    </Card></li>)}</ol> : <p className="work-empty">Adicione uma tarefa pendente ou uma prova futura para montar seu plano.</p>}
  </div>;
}

export function Statistics() {
  const { entries, sessions } = useWorkspace();
  const today = useLocalDate();
  const tasks = entries.filter(item => item.kind === 'task');
  const weekStart = new Date(`${today}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const recentSessions = today ? sessions.filter(session => localDate(new Date(session.endedAt)) >= localDate(weekStart)) : [];
  const minutes = Math.floor(recentSessions.reduce((sum, session) => sum + session.seconds, 0) / 60);
  const completed = tasks.filter(item => item.done).length;
  return <div className="work-page">
    <PageHeader title="Estatísticas" />
    <div className="overview-grid">
      <StatCard title="Foco nos últimos 7 dias" icon={<Timer size={22} />}><strong>{minutes} min</strong></StatCard>
      <StatCard title="Sessões nos últimos 7 dias" icon={<Timer size={22} />}><strong>{recentSessions.length}</strong></StatCard>
      <StatCard title="Tarefas concluídas" icon={<CheckSquare size={22} />}><strong>{completed} de {tasks.length}</strong></StatCard>
    </div>
  </div>;
}
