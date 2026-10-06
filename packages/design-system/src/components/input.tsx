'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cx } from '../utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
}

export function Input({ label, hideLabel = false, error, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <div className="orbit-field">
    <label className={cx('orbit-label', hideLabel && 'orbit-sr-only')} htmlFor={inputId}>{label}</label>
    <input id={inputId} className={cx('orbit-input', className)} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : props['aria-describedby']} {...props} />
    {error && <span id={`${inputId}-error`} className="orbit-field-error">{error}</span>}
  </div>;
}
