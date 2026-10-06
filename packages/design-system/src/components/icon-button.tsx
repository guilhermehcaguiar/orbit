import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'primary';
}

export function IconButton({ label, variant = 'ghost', type = 'button', className, ...props }: IconButtonProps) {
  return <button type={type} aria-label={label} className={cx('orbit-icon-button', `orbit-icon-button--${variant}`, className)} {...props} />;
}
