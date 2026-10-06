import type { ReactNode } from 'react';

export interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return <div className="orbit-empty-state"><span className="orbit-empty-icon" aria-hidden="true">{icon}</span><h2>{title}</h2><p>{description}</p>{action}</div>;
}
