import type { ReactNode } from 'react';

export interface SectionTitleProps { title: string; description?: string; action?: ReactNode; id?: string }

export function SectionTitle({ title, description, action, id }: SectionTitleProps) {
  return <div className="orbit-section-title"><div><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}
