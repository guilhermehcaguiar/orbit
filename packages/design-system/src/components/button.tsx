import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cx('orbit-button', `orbit-button--${variant}`, `orbit-button--${size}`, className)} {...props}>{children}{icon}</button>;
}
