import { cx } from '../utils';

export interface AvatarProps { name: string; size?: 'sm' | 'md'; className?: string }

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <span role="img" aria-label={name} className={cx('orbit-avatar', `orbit-avatar--${size}`, className)}>{initials}</span>;
}
