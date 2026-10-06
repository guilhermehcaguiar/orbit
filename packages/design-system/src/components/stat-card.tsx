import type { ReactNode } from 'react';
import { Card } from './card';
import type { Tone } from '../types';
import { cx } from '../utils';

export interface StatCardProps { title: string; icon: ReactNode; tone?: Tone; children: ReactNode; footer?: ReactNode; className?: string }

export function StatCard({ title, icon, tone = 'primary', children, footer, className }: StatCardProps) {
  return <Card className={cx('orbit-stat-card', `orbit-tone--${tone}`, className)}>
    <div className="orbit-stat-top"><span className="orbit-stat-icon" aria-hidden="true">{icon}</span><h2>{title}</h2></div>
    <div className="orbit-stat-content">{children}</div>
    {footer && <div className="orbit-stat-footer">{footer}</div>}
  </Card>;
}
