'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, Input, PageHeader } from '@orbit/design-system';
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

  return <div className="work-page">
    <PageHeader title="Pomodoro" description="Alterne sessões de estudo com pausas." />
    <Card className="focus-panel">
      <p>{focus?.mode === 'break' ? 'Pausa' : 'Tempo de foco'}</p>
      <strong role="timer" aria-label="Tempo restante">{countdown}</strong>
      <div className="work-actions">
        {focus ? <>
          <Button onClick={toggle}>{endsAt ? 'Pausar' : 'Retomar'}</Button>
          <Button variant="secondary" onClick={() => updateWorkspace(current => ({ ...current, focus: null }))}>Cancelar sessão</Button>
        </> : <>
          <Button onClick={() => start('focus')}>Iniciar foco</Button>
          <Button variant="secondary" onClick={() => start('break')}>Iniciar pausa</Button>
        </>}
      </div>
      <p role="status">{focus ? endsAt ? 'Cronômetro em andamento' : 'Cronômetro pausado' : `${sessions.length} ${sessions.length === 1 ? 'sessão de foco concluída' : 'sessões de foco concluídas'}`}</p>
    </Card>
  </div>;
}

export function Settings() {
  const { name, focusMinutes, breakMinutes } = useWorkspace();
  const [saved, setSaved] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateWorkspace(current => ({
      ...current, name: String(data.get('name')).trim(),
      focusMinutes: Number(data.get('focusMinutes')), breakMinutes: Number(data.get('breakMinutes')),
    }));
    setSaved(true);
  }
  return <div className="work-page">
    <PageHeader title="Configurações" description="Seus dados são salvos neste navegador. Limpar os dados do site também remove registros e preferências." />
    <Card><form className="work-form" key={JSON.stringify([name, focusMinutes, breakMinutes])} onSubmit={save} onChange={() => setSaved(false)}>
      <Input label="Como devemos chamar você?" name="name" defaultValue={name} maxLength={60} />
      <Input label="Foco (minutos)" name="focusMinutes" type="number" defaultValue={focusMinutes} min="1" max="120" required />
      <Input label="Pausa (minutos)" name="breakMinutes" type="number" defaultValue={breakMinutes} min="1" max="60" required />
      <div className="work-actions"><Button type="submit">Salvar preferências</Button></div>
    </form>{saved && <p className="work-notice" role="status">Preferências salvas.</p>}</Card>
  </div>;
}
