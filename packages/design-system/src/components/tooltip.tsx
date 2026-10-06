'use client';

import { cloneElement, useId, useState, type ReactElement } from 'react';

export interface TooltipProps { content: string; children: ReactElement<{ 'aria-describedby'?: string }> }

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const description = [children.props['aria-describedby'], id].filter(Boolean).join(' ');
  return <span className={`orbit-tooltip ${dismissed ? 'is-dismissed' : ''}`} onMouseEnter={() => setDismissed(false)} onFocus={() => setDismissed(false)} onKeyDown={event => { if (event.key === 'Escape') setDismissed(true); }}>
    {cloneElement(children, { 'aria-describedby': description })}<span role="tooltip" id={id} className="orbit-tooltip-content">{content}</span>
  </span>;
}
