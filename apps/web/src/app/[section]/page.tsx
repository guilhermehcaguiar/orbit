import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader } from '@orbit/design-system';
import { navigation } from '@/mocks/navigation';
import { navigationIcons } from '@/constants/icons';
import { SubjectsSection } from '@/components/dashboard/subjects-section';

export const dynamicParams = false;
export function generateStaticParams() {
  return navigation.filter(item => item.href !== '/').map(item => ({ section: item.href.slice(1) }));
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = navigation.find(entry => entry.href === `/${section}`);
  if (!item) notFound();
  const Icon = navigationIcons[item.icon];
  return <div><PageHeader eyebrow="Seu espaço de estudos" title={item.label} description="Tudo no seu ritmo, em um só lugar." action={<Badge tone="primary">Prévia</Badge>} />{section === 'subjects' ? <SubjectsSection showAllLink={false} /> : <Card><EmptyState icon={<Icon size={32} />} title="Um novo espaço para o seu foco" description={`Estamos preparando ${item.label.toLowerCase()} para acompanhar sua jornada. Em breve, você encontra tudo por aqui.`} action={<Link href="/" className="text-link"><ArrowLeft size={16} aria-hidden="true" />Voltar para o início</Link>} /></Card>}</div>;
}
