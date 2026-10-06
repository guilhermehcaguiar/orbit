'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ClipboardList, MapPin, Pause, Play, Sparkles, Timer } from 'lucide-react';
import { Button, IconButton, StatCard } from '@orbit/design-system';
import { dashboard } from '@/mocks/dashboard';
import { PreviewDialog } from '../preview-dialog';

export function OverviewCards() {
  const [playing, setPlaying] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  return <section aria-label="Resumo do seu dia" className="overview-grid">
    <StatCard title="Próxima aula" icon={<CalendarDays size={23} />} footer={<span className="card-location"><MapPin size={14} aria-hidden="true" />{dashboard.nextClass.room}</span>}><strong>{dashboard.nextClass.subject}</strong><p>{dashboard.nextClass.time}</p></StatCard>
    <StatCard title="Provas" tone="warning" icon={<ClipboardList size={23} />} footer={<Link href="/exams" className="card-link">Organize seus estudos <ArrowRight size={15} aria-hidden="true" /></Link>}><strong>{dashboard.exams.count} provas</strong><p>{dashboard.exams.period}</p></StatCard>
    <StatCard title="Pomodoro" tone="danger" icon={<Timer size={23} />} footer={<span className="pomodoro-note" role="status">{playing ? 'Prévia do foco ativada' : dashboard.pomodoro.description}</span>}><div className="pomodoro-time"><strong>{dashboard.pomodoro.duration}</strong><IconButton variant="primary" label={playing ? 'Pausar prévia do Pomodoro' : 'Iniciar prévia do Pomodoro'} aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</IconButton></div></StatCard>
    <StatCard title="Plano inteligente" icon={<Sparkles size={23} />} className="intelligent-card" footer={<Button size="sm" onClick={() => setPlanOpen(true)} icon={<ArrowRight size={15} />}>Ver plano</Button>}><strong>{dashboard.plan.title}</strong><p>{dashboard.plan.description}</p></StatCard>
    <PreviewDialog id="study-plan" open={planOpen} onClose={() => setPlanOpen(false)} title={dashboard.plan.title} description="Um pouco de organização para dar o próximo passo."><ol className="plan-preview-list">{dashboard.planPreview.map(item => <li key={item}>{item}</li>)}</ol><Button onClick={() => setPlanOpen(false)}>Voltar ao meu dia</Button></PreviewDialog>
  </section>;
}
