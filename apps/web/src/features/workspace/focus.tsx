'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Coffee, Pause, Play, ShieldCheck, Timer } from 'lucide-react';
import { Button, Input, ThemeToggle } from '@orbit/design-system';
import { BlankSlate, WorkspaceHeading } from './presentation';
import { settleFocus, updateWorkspace, useMemoryOnly, useWorkspace } from './store';

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
  const { focus, focusMinutes, breakMinutes, sessions } = useWorkspace();
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

  function start(mode: 'focus' | 'break') {
    const seconds = (mode === 'focus' ? focusMinutes : breakMinutes) * 60;
    const startedAt = Date.now();
    setNow(startedAt);
    updateWorkspace(current => current.focus ? current : { ...current, focus: { mode, seconds, remaining: seconds, endsAt: startedAt + seconds * 1000 } });
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

  const recent = sessions.slice(-4).reverse();

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
        <div className="focus-actions">
          {focus ? <>
            <Button onClick={toggle} icon={endsAt ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}>{endsAt ? 'Pausar' : 'Retomar'}</Button>
            <Button variant="secondary" onClick={() => updateWorkspace(current => ({ ...current, focus: null }))}>Cancelar sessão</Button>
          </> : <>
            <Button onClick={() => start('focus')} icon={<Play size={16} aria-hidden="true" />}>Iniciar foco</Button>
            <Button variant="secondary" onClick={() => start('break')}>Iniciar pausa</Button>
          </>}
        </div>
        <span className="orbit-sr-only" role="status">{focus ? endsAt ? 'Cronômetro em andamento' : 'Cronômetro pausado' : `${sessions.length} sessões de foco concluídas`}</span>
      </section>
      <aside className="ws-panel focus-history" aria-labelledby="focus-history-title">
        <div className="ws-section-head"><div><h2 id="focus-history-title">Sessões recentes</h2></div><Link href="/statistics" className="ws-text-link" aria-label="Ver estatísticas"><ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        {recent.length ? <ul className="focus-session-list">{recent.map((session, index) => <li key={`${session.endedAt}-${index}`}>
          <Timer size={17} aria-hidden="true" /><span>{new Date(session.endedAt).toLocaleDateString('pt-BR')}</span><strong>{Math.floor(session.seconds / 60)} min</strong>
        </li>)}</ul> : <BlankSlate icon={Timer} title="Sem sessões concluídas" description="As sessões de foco completas aparecem aqui." />}
      </aside>
    </div>
  </div>;
}

export function Settings() {
  const { name, focusMinutes, breakMinutes } = useWorkspace();
  const [saved, setSaved] = useState(false);
  const memoryOnly = useMemoryOnly();
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
    <WorkspaceHeading title="Configurações" description="Ajuste seu espaço de estudos neste navegador." />
    <div className="settings-layout">
      <form className="ws-panel settings-form" key={JSON.stringify([name, focusMinutes, breakMinutes])} onSubmit={save} onChange={() => setSaved(false)}>
        <section aria-labelledby="settings-profile">
          <h2 id="settings-profile">Perfil local</h2>
          <Input label="Nome de exibição" name="name" defaultValue={name} maxLength={60} />
        </section>
        <section aria-labelledby="settings-focus">
          <h2 id="settings-focus">Duração do Pomodoro</h2>
          <div className="settings-fields">
            <Input label="Foco (minutos)" name="focusMinutes" type="number" defaultValue={focusMinutes} min="1" max="120" required />
            <Input label="Pausa (minutos)" name="breakMinutes" type="number" defaultValue={breakMinutes} min="1" max="60" required />
          </div>
        </section>
        <div className="settings-actions"><p role="status">{saved && !memoryOnly ? 'Preferências salvas.' : ''}</p><Button type="submit">Salvar preferências</Button></div>
      </form>
      <div className="settings-side">
        <section className="ws-panel settings-info" aria-labelledby="settings-appearance"><div className="ws-section-head"><div><h2 id="settings-appearance">Aparência</h2><p>Alterne entre os temas claro e escuro.</p></div><ThemeToggle /></div></section>
        <section className="ws-panel settings-info" aria-labelledby="settings-data"><ShieldCheck size={22} aria-hidden="true" /><h2 id="settings-data">Dados no navegador</h2><p>Limpar os dados do site remove os registros e as preferências do Orbit.</p></section>
      </div>
    </div>
  </div>;
}
