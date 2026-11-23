'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { sessionKey } from '@orbit/contracts';
import { orbitApi } from './api';
import { LocalImport } from './local-import';
import { ArrowUpRight, Coffee, Pause, Play, ShieldCheck, Timer } from 'lucide-react';
import { Button, Input, ThemeToggle } from '@orbit/design-system';
import { BlankSlate, WorkspaceHeading } from './presentation';
import { settleFocus, startFocus, updateWorkspace, useConnection, useMemoryOnly, useSyncStatus, useWorkspace } from './store';

export function FocusClock() {
  const endsAt = useWorkspace().focus?.endsAt;
  useEffect(() => {
    if (!endsAt) return;
    const timeout = window.setTimeout(() => settleFocus(endsAt), Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [endsAt]);
  return null;
}

export function WorkspaceStorageNotice() {
  const memoryOnly = useMemoryOnly();
  return memoryOnly && <p className="work-notice" role="status">O navegador não salvou esta alteração. Ela ficará disponível só até fechar ou recarregar a página.</p>;
}

export function Pomodoro() {
  const { focus, focusMinutes, sessions, subjects, entries } = useWorkspace();
  const [target, setTarget] = useState('');
  const options = entries.filter(item => item.kind !== 'event' && !item.done);
  const [now, setNow] = useState(0);
  const endsAt = focus?.endsAt;
  useEffect(() => {
    if (!endsAt) return;
    const ticker = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(ticker);
  }, [endsAt]);
  const remaining = focus
    ? endsAt && now ? Math.max(0, Math.min(focus.remaining, Math.ceil((endsAt - now) / 1000))) : focus.remaining
    : focusMinutes * 60;
  const countdown = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  function start(mode: 'focus' | 'break', startedAt: number) {
    setNow(startedAt);
    const [type, id] = target.split(':');
    startFocus(mode, startedAt, type === 'entry' ? { entryId: id } : { subjectId: id });
  }

  function toggle() {
    const timestamp = Date.now();
    setNow(timestamp);
    if (endsAt && endsAt <= timestamp) {
      settleFocus(endsAt);
      return;
    }
    updateWorkspace(current => {
      if (!current.focus) return current;
      const running = current.focus.endsAt;
      const next = running
        ? { ...current.focus, remaining: Math.ceil((running - timestamp) / 1000), endsAt: null }
        : { ...current.focus, endsAt: timestamp + current.focus.remaining * 1000 };
      return { ...current, focus: next };
    });
  }

  const recent = [...sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 4);

  return <div className="ws-page">
    <WorkspaceHeading title="Pomodoro" description="Reserve um intervalo para estudar com foco." action={<Link href="/settings" className="orbit-button orbit-button--secondary">Ajustar duração</Link>} />
    <div className="focus-layout">
      <section className="ws-panel focus-main" aria-label="Cronômetro Pomodoro" data-mode={focus?.mode ?? 'focus'}>
        <div className="focus-session-state"><span />{focus ? endsAt ? 'Em andamento' : 'Pausado' : 'Pronto para começar'}</div>
        <div className="focus-dial" style={{ '--focus-remaining': `${focus ? Math.min(100, (remaining / focus.seconds) * 100) : 100}%` } as CSSProperties}>
          <div className="focus-dial-inner">
            {focus?.mode === 'break' ? <Coffee size={22} aria-hidden="true" /> : <Timer size={22} aria-hidden="true" />}
            <p>{focus?.mode === 'break' ? 'Pausa' : 'Tempo de foco'}</p>
            <strong role="timer" aria-label="Tempo restante">{countdown}</strong>
          </div>
        </div>
        {!focus && (subjects.length > 0 || options.length > 0) && <label className="orbit-field focus-target">
          <span className="orbit-label">Vincular sessão</span>
          <select className="orbit-input" aria-label="Vincular sessão" value={target} onChange={event => setTarget(event.target.value)}>
            <option value="">Sem vínculo</option>
            {subjects.length > 0 && <optgroup label="Disciplinas">{subjects.map(item => <option key={item.id} value={`subject:${item.id}`}>{item.name}</option>)}</optgroup>}
            {options.length > 0 && <optgroup label="Tarefas e provas">{options.map(item => <option key={item.id} value={`entry:${item.id}`}>{item.title}</option>)}</optgroup>}
          </select>
        </label>}
        <div className="focus-actions">
          {focus ? <>
            <Button onClick={toggle} icon={endsAt ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}>{endsAt ? 'Pausar' : 'Retomar'}</Button>
            <Button variant="secondary" onClick={() => updateWorkspace(current => ({ ...current, focus: null }))}>Cancelar sessão</Button>
          </> : <>
            <Button onClick={() => start('focus', Date.now())} icon={<Play size={16} aria-hidden="true" />}>Iniciar foco</Button>
            <Button variant="secondary" onClick={() => start('break', Date.now())}>Iniciar pausa</Button>
          </>}
        </div>
        <span className="orbit-sr-only" role="status">{focus ? endsAt ? 'Cronômetro em andamento' : 'Cronômetro pausado' : `${sessions.length} sessões de foco concluídas`}</span>
      </section>
      <aside className="ws-panel focus-history" aria-labelledby="focus-history-title">
        <div className="ws-section-head"><div><h2 id="focus-history-title">Sessões recentes</h2></div><Link href="/statistics" className="ws-text-link" aria-label="Ver estatísticas"><ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        {recent.length ? <ul className="focus-session-list">{recent.map(session => <li key={sessionKey(session)}>
          <Timer size={17} aria-hidden="true" /><span>{new Date(session.endedAt).toLocaleDateString('pt-BR')}
            {(entries.find(item => item.id === session.entryId)?.title ?? subjects.find(item => item.id === session.subjectId)?.name) && <small className="focus-session-label">
              {entries.find(item => item.id === session.entryId)?.title ?? subjects.find(item => item.id === session.subjectId)?.name}
            </small>}
          </span><strong>{Math.floor(session.seconds / 60)} min</strong>
        </li>)}</ul> : <BlankSlate icon={Timer} title="Sem sessões concluídas" description="As sessões de foco completas aparecem aqui." />}
      </aside>
    </div>
  </div>;
}

export function Settings() {
  const { name, focusMinutes, breakMinutes } = useWorkspace();
  const [saved, setSaved] = useState(false);
  const memoryOnly = useMemoryOnly();
  const connection = useConnection();
  const status = useSyncStatus();
  const [accountMessage, setAccountMessage] = useState('');
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    if (connection.status !== 'member') return;
    setLeaving(true);
    setAccountMessage('');
    try {
      await orbitApi('auth/logout', { method: 'POST', accountId: connection.account.id });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Drop the previous account's in-memory workspace.
      window.location.assign('/app');
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : 'Não foi possível sair.');
      setLeaving(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateWorkspace(current => ({
      ...current, name: String(data.get('name')).trim(),
      focusMinutes: Number(data.get('focusMinutes')), breakMinutes: Number(data.get('breakMinutes')),
    }));
    setSaved(true);
  }
  return <div className="ws-page">
    <WorkspaceHeading title="Configurações" description="Gerencie sua conta e as preferências de estudo." />
    <div className="settings-layout">
      <form className="ws-panel settings-form" key={JSON.stringify([name, focusMinutes, breakMinutes])} onSubmit={save} onChange={() => setSaved(false)}>
        <section aria-labelledby="settings-profile">
          <h2 id="settings-profile">Perfil</h2>
          <Input label="Nome de exibição" name="name" defaultValue={name} maxLength={60} />
        </section>
        <section aria-labelledby="settings-focus">
          <h2 id="settings-focus">Duração do Pomodoro</h2>
          <div className="settings-fields">
            <Input label="Foco (minutos)" name="focusMinutes" type="number" defaultValue={focusMinutes} min="1" max="120" required />
            <Input label="Pausa (minutos)" name="breakMinutes" type="number" defaultValue={breakMinutes} min="1" max="60" required />
          </div>
        </section>
        <div className="settings-actions"><p role="status">{saved && !memoryOnly && status === 'idle' ? 'Preferências salvas.' : ''}</p><Button type="submit">Salvar preferências</Button></div>
      </form>
      <div className="settings-side">
        <section className="ws-panel settings-info" aria-labelledby="settings-appearance"><div className="ws-section-head"><div><h2 id="settings-appearance">Aparência</h2><p>Alterne entre os temas claro e escuro.</p></div><ThemeToggle /></div></section>
        <section className="ws-panel settings-info" aria-labelledby="settings-data">
          <ShieldCheck size={22} aria-hidden="true" />
          {connection.status === 'member' ? <>
            <h2 id="settings-data">Sua conta</h2><p>{connection.account.email}</p>
            <LocalImport />
            <Button variant="secondary" onClick={() => void logout()} disabled={leaving || status !== 'idle'}>Sair da conta</Button>
            {accountMessage && <p role="alert">{accountMessage}</p>}
          </> : <>
            <h2 id="settings-data">Dados no navegador</h2><p>Limpar os dados do site remove os registros e as preferências do Orbit.</p>
            <div className="ws-inline-actions">
              <Link href="/login" className="orbit-button orbit-button--secondary">Entrar</Link>
              <Link href="/cadastro" className="orbit-button orbit-button--secondary">Criar conta</Link>
            </div>
          </>}
        </section>
      </div>
    </div>
  </div>;
}
