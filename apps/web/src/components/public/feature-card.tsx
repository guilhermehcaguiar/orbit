import type { LucideIcon } from 'lucide-react';
import { Badge, Card } from '@orbit/design-system';
export function FeatureCard({ icon: Icon, title, description, planned = false }: { icon: LucideIcon; title: string; description: string; planned?: boolean }) {
  return <Card className="feature-card"><span className="feature-icon"><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p>{planned && <Badge tone="primary">Em breve</Badge>}</Card>;
}
