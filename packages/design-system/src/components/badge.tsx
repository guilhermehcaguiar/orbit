import type { HTMLAttributes } from 'react';
import type { Tone } from '../types';
import { cx } from '../utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { tone?: Tone }

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cx('orbit-badge', `orbit-tone--${tone}`, className)} {...props} />;
}
