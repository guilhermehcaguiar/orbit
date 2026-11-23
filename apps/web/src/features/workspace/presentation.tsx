'use client';

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { X, type LucideIcon } from 'lucide-react';
import { IconButton } from '@orbit/design-system';

export function WorkspaceHeading({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <header className="ws-heading">
    <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="ws-heading-actions">{action}</div>}
  </header>;
}

export function BlankSlate({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <div className="ws-empty">
    <span className="ws-empty-icon"><Icon size={24} aria-hidden="true" /></span>
    <strong>{title}</strong>
    {description && <p>{description}</p>}
    {action}
  </div>;
}

export function EditorDialog({ title, onClose, children, focusField }: {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  focusField?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    if (focusField) dialog.querySelector('input')?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [focusField]);

  return <dialog className="ws-dialog" ref={ref} aria-labelledby={id} onCancel={event => {
    event.preventDefault();
    onClose();
  }}>
    <header><h2 id={id}>{title}</h2><IconButton label="Fechar diálogo" onClick={onClose}><X size={20} aria-hidden="true" /></IconButton></header>
    {children}
  </dialog>;
}


export function RecordLink({ href, onClick, ...props }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return <Link {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const [pathname, hash] = href.split('#');
    if (!hash || pathname !== window.location.pathname) return;
    event.preventDefault();
    window.location.hash = hash;
  }} />;
}
