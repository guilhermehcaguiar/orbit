'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Badge, IconButton } from '@orbit/design-system';

export interface PreviewDialogProps { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; id: string }
export function PreviewDialog({ open, onClose, title, description, children, id }: PreviewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="preview-dialog" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onCancel={onClose} onClose={onClose}>
    <div className="preview-dialog-top"><Badge tone="primary">Prévia</Badge><IconButton label="Fechar janela" onClick={onClose}><X size={20} /></IconButton></div>
    <h2 id={`${id}-title`}>{title}</h2>{description && <p id={`${id}-description`}>{description}</p>}{children}
  </dialog>;
}
