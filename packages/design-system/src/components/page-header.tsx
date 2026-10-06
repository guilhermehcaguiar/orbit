import type { ReactNode } from 'react';

export interface PageHeaderProps { title: string; description?: string; eyebrow?: string; action?: ReactNode }

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return <header className="orbit-page-header"><div>{eyebrow && <p className="orbit-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="orbit-page-description">{description}</p>}</div>{action}</header>;
}
