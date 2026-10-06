import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils';

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: ReactNode;
  active?: boolean;
  badge?: ReactNode;
}

export function SidebarItem({ icon, active = false, badge, className, children, ...props }: SidebarItemProps) {
  return <a className={cx('orbit-sidebar-item', active && 'is-active', className)} aria-current={active ? 'page' : undefined} {...props}>
    <span className="orbit-sidebar-item-icon" aria-hidden="true">{icon}</span><span>{children}</span>{badge && <span className="orbit-sidebar-item-badge">{badge}</span>}
  </a>;
}
