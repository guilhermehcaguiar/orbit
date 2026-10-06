import type { HTMLAttributes } from 'react';
import { cx } from '../utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('orbit-card', className)} {...props} />;
}
