'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@orbit/design-system';
import { EditorDialog } from './presentation';
import { connectWorkspace, flushWorkspace, preventUnsavedExit, resolveWorkspaceDraft, useConnection, useDraftOnDevice, useSyncStatus } from './store';

export function WorkspaceConnection({ children }: { children: ReactNode }) {
  const { status } = useConnection();
  const sync = useSyncStatus();
  useEffect(() => { connectWorkspace(); }, []);
  useEffect(() => {
    if (sync === 'idle') return;
    window.addEventListener('beforeunload', preventUnsavedExit);
    return () => window.removeEventListener('beforeunload', preventUnsavedExit);
  }, [sync]);
  if (status === 'loading') return <main className="public-container workspace-connection"><p role="status">Carregando seu espaço de estudos…</p></main>;
  if (status === 'unavailable') return <main className="public-container workspace-connection">
    <h1>Seu espaço está indisponível</h1>
    <Button onClick={connectWorkspace}>Tentar novamente</Button>
  </main>;
  return children;
}

export function WorkspaceSyncNotice() {
  const status = useSyncStatus();
  const saved = useDraftOnDevice();
  const [choice, setChoice] = useState<'apply' | 'discard' | null>(null);
  if (status === 'idle' || status === 'saving') return null;
  const conflict = status === 'conflict' || status === 'invalid-draft';
  return <>
    <div className="work-notice ws-inline-actions" role="status">
      {status === 'error' && <><span>{saved ? 'Alterações guardadas neste navegador. Ainda falta sincronizá-las.' : 'Alterações pendentes nesta aba.'}</span>
        <Button size="sm" variant="secondary" onClick={() => void flushWorkspace()}>Tentar salvar</Button></>}
      {conflict && <>
        <span>{status === 'invalid-draft' ? 'Alguns vínculos do rascunho mudaram na conta. Revise os registros antes de tentar novamente.'
          : saved ? 'Há um rascunho neste navegador pendente de sincronização.' : 'Há alterações desta aba pendentes de sincronização.'}</span>
        <Button size="sm" variant="secondary" onClick={() => setChoice('apply')}>Recuperar alterações</Button>
        <Button size="sm" variant="ghost" onClick={() => setChoice('discard')}>Usar versão da conta</Button>
      </>}
      {status === 'recovering' && <span>Conferindo as alterações da conta…</span>}
      {status === 'expired' && <><span>A sessão expirou.{saved && ' Seu rascunho está neste navegador.'}</span><Link href="/login">Entrar novamente</Link></>}
    </div>
    {choice && <EditorDialog title={choice === 'apply' ? 'Recuperar alterações' : 'Usar versão da conta'} onClose={() => setChoice(null)}>
      <p>{choice === 'apply' ? 'As edições daqui serão aplicadas à versão atual da conta. Se o mesmo registro mudou nos dois lugares, prevalece a edição deste rascunho.'
        : 'Essa ação descarta as alterações pendentes deste rascunho e carrega os registros da conta.'}</p>
      <div className="ws-form-actions">
        <Button variant="secondary" onClick={() => setChoice(null)}>Cancelar</Button>
        <Button onClick={() => { void resolveWorkspaceDraft(choice === 'apply'); setChoice(null); }}>{choice === 'apply' ? 'Aplicar meu rascunho' : 'Descartar rascunho'}</Button>
      </div>
    </EditorDialog>}
  </>;
}

export function WorkspaceFooter() {
  const connection = useConnection();
  const status = useSyncStatus();
  return <footer className="app-footer"><span>Orbit</span><span>{connection.status === 'member'
    ? status === 'saving' ? 'Sincronizando…' : status === 'idle' ? 'Registros sincronizados' : 'Alterações pendentes'
    : 'Registros salvos neste navegador'}</span></footer>;
}
