import type { CSSProperties } from 'react';
import type { Tone } from '../types';

export interface ProgressBarProps { value: number; label: string; tone?: Tone; showValue?: boolean }

export function ProgressBar({ value, label, tone = 'primary', showValue = true }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return <div className={`orbit-progress orbit-tone--${tone}`}>
    <div className="orbit-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <span className="orbit-progress-fill" style={{ '--progress': `${percentage}%` } as CSSProperties} />
    </div>{showValue && <span className="orbit-progress-value" aria-hidden="true">{percentage}%</span>}
  </div>;
}
