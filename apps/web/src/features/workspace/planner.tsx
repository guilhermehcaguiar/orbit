'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CalendarCheck2, Clock, ListTodo, Pencil, Trash2 } from 'lucide-react';
import { Button, IconButton, Input } from '@orbit/design-system';
import { addDays, availabilitySchema, timeLabel, toMinutes, type Availability, type PlanBlock } from '@orbit/contracts';
import { canPlaceBlock, generateStudyPlan, studyCandidates, unscheduledStudy } from '@orbit/contracts/planner';
import { WeekdayField, weekdays } from './academic';
import { BlankSlate, EditorDialog, RecordLink, WorkspaceHeading } from './presentation';
import { entryHref } from './records';
import { byDate, displayDate, localDate, updateWorkspace, useLocalDate, useLocalMinute, useWorkspace } from './store';

export function currentMinute() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function StudyPlanner() {
  const workspace = useWorkspace();
  const { availability, plan, entries } = workspace;
  const today = useLocalDate();
  const minute = useLocalMinute();
  const [availabilityEditor, setAvailabilityEditor] = useState<Availability | 'new' | null>(null);
  const [editing, setEditing] = useState<PlanBlock | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  useEffect(() => {
    const highlightBlock = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#bloco-')) document.getElementById(hash.slice(1))?.focus();
    };
    highlightBlock();
    window.addEventListener('hashchange', highlightBlock);
    return () => window.removeEventListener('hashchange', highlightBlock);
  }, [plan]);
  const priorities = today ? studyCandidates(workspace, today).sort(byDate) : [];
  const unscheduled = plan ? unscheduledStudy(workspace, plan) : [];
  const issues = new Set(plan && !plan.accepted && today
    ? plan.items.filter(item => !canPlaceBlock(workspace, plan, item, today, minute)).map(item => item.id) : []);

  function generate() {
    const date = localDate();
    const minute = currentMinute();
    updateWorkspace(current => ({ ...current, plan: generateStudyPlan(current, date, minute, () => crypto.randomUUID()) }));
    setNotice('Plano atualizado.');
    setConfirmGenerate(false);
  }

  function saveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = availabilityEditor && availabilityEditor !== 'new' ? availabilityEditor.id : crypto.randomUUID();
    const result = availabilitySchema.safeParse({
      id, weekday: Number(data.get('weekday')), startsAt: data.get('startsAt'), endsAt: data.get('endsAt'),
    });
    if (!result.success) {
      setError('O horário final deve vir depois do inicial.');
      return;
    }
    updateWorkspace(current => ({ ...current, availability: [...current.availability.filter(item => item.id !== id), result.data] }));
    setAvailabilityEditor(null);
  }

  function accept() {
    if (!plan) return;
    const date = localDate();
    const minute = currentMinute();
    if (!plan.items.length || plan.items.some(item => !canPlaceBlock(workspace, plan, item, date, minute))) {
      setNotice('Há blocos vencidos ou com conflito. Ajuste os horários ou gere outro plano.');
      return;
    }
    updateWorkspace(current => ({ ...current, plan: { ...plan, accepted: true } }));
    setNotice('Plano aceito. Seus blocos já aparecem no calendário.');
  }

  function saveBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan || !editing) return;
    const data = new FormData(event.currentTarget);
    const start = toMinutes(String(data.get('start')));
    const duration = editing.end - editing.start;
    const candidate = { ...editing, date: String(data.get('date')), start, end: start + duration };
    if (candidate.end > 1440 || !canPlaceBlock(workspace, plan, candidate, localDate(), currentMinute())) {
      setError('Escolha um horário livre dentro da sua disponibilidade e antes do prazo.');
      return;
    }
    updateWorkspace(current => ({ ...current, plan: { ...plan, accepted: false,
      items: plan.items.map(item => item.id === candidate.id ? candidate : item)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start) } }));
    setEditing(null);
  }

  function removeBlock(block: PlanBlock) {
    if (!plan) return;
    updateWorkspace(current => ({ ...current, plan: { ...plan, accepted: false,
      items: plan.items.filter(item => item.id !== block.id), unscheduledMinutes: plan.unscheduledMinutes + block.end - block.start } }));
  }

  function editAvailability(value: Availability | 'new') {
    setError('');
    setAvailabilityEditor(value);
  }

  const availabilityWindow = availabilityEditor === 'new' ? undefined : availabilityEditor ?? undefined;

  return <div className="ws-page">
    <WorkspaceHeading title="Plano de estudos" description="Distribua o estudo dos próximos 7 dias entre seus compromissos." />
    <section className="ws-panel settings-info plan-generate" aria-label="Preparar plano semanal">
      <div>
        <h2>{plan ? 'Atualizar planejamento' : 'Planejar os próximos 7 dias'}</h2>
        {!availability.length && <p>Adicione um horário livre para começar.</p>}
        {!priorities.length && <p>Adicione uma tarefa ou prova para planejar a semana.</p>}
        {availability.length > 0 && priorities.length > 0 && <p>{priorities.length} {priorities.length === 1 ? 'compromisso pronto' : 'compromissos prontos'} para planejar.</p>}
      </div>
      <div className="ws-inline-actions">
        {!availability.length && <Button onClick={() => editAvailability('new')}>Definir horário livre</Button>}
        {!priorities.length && <>
          <RecordLink href="/tasks#novo" className="orbit-button orbit-button--secondary">Cadastrar tarefa</RecordLink>
          <RecordLink href="/exams#novo" className="orbit-button orbit-button--secondary">Cadastrar prova</RecordLink>
        </>}
        {availability.length > 0 && priorities.length > 0 && <Button onClick={() => plan?.items.length ? setConfirmGenerate(true) : generate()}>
          {plan ? 'Gerar novo plano' : 'Gerar plano semanal'}
        </Button>}
      </div>
    </section>
    <section className="ws-panel settings-info">
      <div className="ws-section-head"><h2>Disponibilidade semanal</h2><Button variant="secondary" size="sm" onClick={() => editAvailability('new')}>Adicionar horário livre</Button></div>
      {availability.length ? <ul className="entry-list">{[...availability].sort((a, b) => (a.weekday + 6) % 7 - (b.weekday + 6) % 7 || a.startsAt.localeCompare(b.startsAt)).map(item => <li key={item.id} className="entry-row">
        <span className="entry-icon"><Clock size={18} aria-hidden="true" /></span>
        <div className="entry-copy"><strong>{weekdays[item.weekday]}</strong><p>{item.startsAt}–{item.endsAt}</p></div>
        <div className="ws-icon-actions">
          <IconButton label={`Editar disponibilidade de ${weekdays[item.weekday]} às ${item.startsAt}`} onClick={() => editAvailability(item)}><Pencil size={16} aria-hidden="true" /></IconButton>
          <IconButton label={`Remover disponibilidade de ${weekdays[item.weekday]} às ${item.startsAt}`} onClick={() => updateWorkspace(current => ({ ...current, availability: current.availability.filter(value => value.id !== item.id) }))}><Trash2 size={16} aria-hidden="true" /></IconButton>
        </div>
      </li>)}</ul> : <p>Adicione os horários em que você pode estudar para gerar o plano.</p>}
    </section>
    {plan ? <section className="ws-panel settings-info">
      <div className="ws-section-head">
        <div><h2>{plan.accepted ? 'Plano aceito' : 'Rascunho do plano'}</h2><p>{displayDate(plan.startsOn)} a {displayDate(addDays(plan.startsOn, 6))}</p></div>
        {!plan.accepted && plan.items.length > 0 && <Button size="sm" onClick={accept}>Aceitar plano</Button>}
      </div>
      {issues.size > 0 && <p className="plan-inline-issue" role="status">Revise os blocos marcados antes de aceitar o plano.</p>}
      {plan.items.length > 0 ? <ul className="entry-list">{plan.items.map(item => {
        const title = entries.find(entry => entry.id === item.entryId)?.title;
        const issue = issues.has(item.id);
        const expired = item.date < today || (item.date === today && item.start < minute);
        return <li id={`bloco-${item.id}`} tabIndex={-1} className="entry-row plan-block-row" key={item.id}>
          <span className="entry-icon"><CalendarCheck2 size={18} aria-hidden="true" /></span>
          <div className="entry-copy"><strong>{title}</strong><p>{displayDate(item.date)} · {timeLabel(item.start)}–{timeLabel(item.end)}</p>
            {issue && <p className="plan-inline-issue">{expired ? 'Horário passou' : 'Conflito de horário, prazo ou compromisso'}</p>}
          </div>
          <div className="ws-icon-actions">
            {issue ? <Button variant="secondary" size="sm" onClick={() => { setError(''); setEditing(item); }}>Ajustar horário</Button>
              : <IconButton label={`Editar bloco de ${title} às ${timeLabel(item.start)}`} onClick={() => { setError(''); setEditing(item); }}><Pencil size={16} aria-hidden="true" /></IconButton>}
            <IconButton label={`Remover bloco de ${title} às ${timeLabel(item.start)}`} onClick={() => removeBlock(item)}><Trash2 size={16} aria-hidden="true" /></IconButton>
          </div>
        </li>;
      })}</ul> : <p>Não há blocos que caibam nos horários disponíveis antes dos prazos.</p>}
      {unscheduled.length > 0 && <section className="plan-unallocated" aria-labelledby="plan-unallocated">
        <div className="ws-section-head">
          <h3 id="plan-unallocated">Compromissos sem tempo suficiente</h3>
          <Button variant="secondary" size="sm" onClick={() => editAvailability('new')}>Ampliar disponibilidade</Button>
        </div>
        <p>Ao mudar a disponibilidade, gere outro plano para distribuir o tempo adicional.</p>
        <ul className="entry-list">{unscheduled.map(({ entry, minutes }) => <li key={entry.id} className="entry-row agenda-entry">
          <span className="entry-icon"><ListTodo size={16} aria-hidden="true" /></span>
          <div className="entry-copy"><RecordLink href={entryHref(entry)} className="ws-text-link">{entry.title}</RecordLink><p>Faltam {minutes} min · {displayDate(entry.date)}</p></div>
        </li>)}</ul>
      </section>}
    </section> : <section className="ws-panel settings-info">
      <h2>Próximas prioridades</h2>
      {priorities.length ? <ul className="entry-list">{priorities.slice(0, 5).map(item => <li className="entry-row" key={item.id}>
        <span className="entry-icon"><ListTodo size={18} aria-hidden="true" /></span>
        <div className="entry-copy"><RecordLink className="ws-text-link" href={entryHref(item)}>{item.title}</RecordLink></div>
        <span className="entry-date">{displayDate(item.date)}</span>
      </li>)}</ul> : <BlankSlate icon={ListTodo} title="Nenhuma tarefa ou prova para planejar" action={<Link href="/tasks#novo" className="orbit-button orbit-button--secondary">Adicionar tarefa</Link>} />}
    </section>}
    <p className="orbit-sr-only" role="status">{notice}</p>
    {notice && notice.startsWith('Há blocos') && <p className="work-notice">{notice}</p>}
    {confirmGenerate && <EditorDialog title="Substituir o plano atual?" onClose={() => setConfirmGenerate(false)}>
      <p>O novo rascunho substitui os blocos atuais e os ajustes feitos à mão.</p>
      <div className="ws-form-actions"><Button variant="secondary" onClick={() => setConfirmGenerate(false)}>Cancelar</Button><Button onClick={generate}>Substituir plano</Button></div>
    </EditorDialog>}
    {availabilityEditor && <EditorDialog title={availabilityWindow ? 'Editar horário livre' : 'Adicionar horário livre'} onClose={() => setAvailabilityEditor(null)} focusField>
      <form className="ws-form" onSubmit={saveAvailability} onChange={() => setError('')}>
        <WeekdayField value={availabilityWindow?.weekday} />
        <div className="ws-form-pair">
          <Input label="Horário inicial" name="startsAt" type="time" defaultValue={availabilityWindow?.startsAt} required />
          <Input label="Horário final" name="endsAt" type="time" defaultValue={availabilityWindow?.endsAt} required />
        </div>
        {error && <p className="ws-form-error" role="alert">{error}</p>}
        <div className="ws-form-actions"><Button type="submit">Salvar disponibilidade</Button></div>
      </form>
    </EditorDialog>}
    {editing && plan && <EditorDialog title="Editar bloco de estudo" onClose={() => setEditing(null)} focusField>
      <form className="ws-form" onSubmit={saveBlock} onChange={() => setError('')}>
        <p>Duração de {editing.end - editing.start} min.</p>
        <div className="ws-form-pair">
          <Input label="Dia de estudo" name="date" type="date" min={today > plan.startsOn ? today : plan.startsOn} max={addDays(plan.startsOn, 6)} defaultValue={editing.date} required />
          <Input label="Início do estudo" name="start" type="time" defaultValue={timeLabel(editing.start)} required />
        </div>
        {error && <p className="ws-form-error" role="alert">{error}</p>}
        <div className="ws-form-actions"><Button type="submit">Salvar bloco</Button></div>
      </form>
    </EditorDialog>}
  </div>;
}
