'use client';

import { useState } from 'react';
import { Button } from '@orbit/design-system';
import { mergeLocalWorkspace, sessionKey, workspaceSchema, type Workspace } from '@orbit/contracts';
import { getImportableWorkspace, updateWorkspace, useConnection, useSyncStatus, useWorkspace } from './store';

export function LocalImport({ prominent = false }: { prominent?: boolean }) {
  const connection = useConnection();
  const status = useSyncStatus();
  const workspace = useWorkspace();
  const [result, setResult] = useState<'imported' | 'error'>();
  const local = connection.status === 'member' ? getImportableWorkspace() : null;
  if (!local) return null;

  function contains<T>(current: T[], imported: T[], key: (item: T) => string) {
    const ids = new Set(current.map(key));
    return imported.every(item => ids.has(key(item)));
  }
  const id = (item: { id: string }) => item.id;
  const hasNewRecords = !contains(workspace.subjects, local.subjects, id) || !contains(workspace.entries, local.entries, id) ||
    !contains(workspace.semesters, local.semesters, id) || !contains(workspace.schedules, local.schedules, id) ||
    !contains(workspace.availability, local.availability, id) || !contains(workspace.sessions, local.sessions, sessionKey);
  if (prominent && !hasNewRecords && !result) return null;

  function importRecords(source: Workspace) {
    const next = workspaceSchema.safeParse(mergeLocalWorkspace(workspace, source));
    if (!next.success) {
      setResult('error');
      return;
    }
    setResult('imported');
    if (hasNewRecords) updateWorkspace(() => next.data);
  }

  return <div className={prominent ? 'ws-panel settings-info local-import' : 'local-import'}>
    {prominent && <h2>Registros de visitante encontrados</h2>}
    <p>Copie as disciplinas e os compromissos deste navegador para sua conta.</p>
    {(!prominent || hasNewRecords) && <Button variant="secondary" onClick={() => importRecords(local)} disabled={status !== 'idle'}>Importar registros do navegador</Button>}
    {result === 'error' && <p role="alert">Os registros deste navegador não puderam ser importados.</p>}
    {result === 'imported' && status === 'idle' && <p role="status">Registros importados.</p>}
  </div>;
}
