import { CalendarDays, Sparkles } from 'lucide-react';
import { PageHeader } from '@orbit/design-system';
import { dashboard } from '@/mocks/dashboard';
import { OverviewCards } from './overview-cards';
import { SubjectsSection } from './subjects-section';
import { AiBanner } from './ai-banner';

export function Dashboard() {
  return <div className="dashboard"><PageHeader eyebrow="Um novo dia, novas possibilidades" title={`Olá, ${dashboard.user.firstName}!`} description="Seu foco em órbita." action={<div className="date-chip"><CalendarDays size={16} aria-hidden="true" />{dashboard.date}</div>} /><div className="dashboard-divider"><span><Sparkles size={14} aria-hidden="true" />Seu dia em órbita</span><span>Faça cada momento contar</span></div><OverviewCards /><SubjectsSection /><AiBanner /></div>;
}
