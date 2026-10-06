import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils';

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ brand, footer, className, children, ...props }: SidebarProps) {
  return <aside className={cx('orbit-sidebar', className)} {...props}>
    <div className="orbit-sidebar-brand">{brand}</div>
    <nav aria-label="Navegação principal" className="orbit-sidebar-nav">{children}</nav>
    {footer && <div className="orbit-sidebar-footer">{footer}</div>}
  </aside>;
}
