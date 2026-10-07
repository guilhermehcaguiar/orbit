import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ClipboardList, LayoutDashboard, Timer } from 'lucide-react';
import { Badge, Card } from '@orbit/design-system';
import { Brand } from '@/components/brand';
import { SubjectCard } from '@/components/dashboard/subject-card';
import { dashboard } from '@/mocks/dashboard';
import { subjects } from '@/mocks/subjects';

export function ProductPreview() {
  return <figure className="product-preview"><div className="preview-toolbar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>Seu espaço de estudos</span><Badge tone="primary">Prévia visual</Badge></div><div className="preview-layout"><aside className="preview-sidebar" aria-label="Identidade do produto"><Brand /><span className="preview-selected"><LayoutDashboard size={16} aria-hidden="true" />Visão geral</span><p>Um pouco de foco.<br />Um mundo de possibilidades.</p></aside><div className="preview-content"><div className="preview-greeting"><div><span className="section-eyebrow">TUDO NO SEU RITMO</span><h2>Olá, {dashboard.user.firstName} <span className="greeting-dot">✦</span></h2><p>Seu foco em órbita.</p></div><span className="preview-date"><CalendarDays size={15} aria-hidden="true" />{dashboard.date}</span></div><div className="preview-stats"><Card><CalendarDays size={20} aria-hidden="true" /><span>Próxima aula</span><strong>{dashboard.nextClass.subject}</strong><small>{dashboard.nextClass.time}</small></Card><Card><ClipboardList size={20} aria-hidden="true" /><span>Provas a caminho</span><strong>{dashboard.exams.count} provas</strong><small>{dashboard.exams.period}</small></Card><Card><Timer size={20} aria-hidden="true" /><span>Tempo de foco</span><strong>{dashboard.pomodoro.duration}</strong><small>Prévia do Pomodoro</small></Card></div><h3 className="preview-subject-title">Minhas disciplinas</h3><div className="preview-subjects">{subjects.slice(0, 3).map(subject => <SubjectCard subject={subject} key={subject.id} />)}</div></div></div><figcaption>Dados ilustrativos. Explore o dashboard atual.<Link href="/app">Abrir prévia <ArrowUpRight size={16} aria-hidden="true" /></Link></figcaption></figure>;
}
