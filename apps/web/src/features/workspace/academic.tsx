'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button, IconButton, Input } from '@orbit/design-system';
import { entrySchema, scheduleSchema, semesterSchema, subjectSchema, type Schedule, type Semester } from '@orbit/contracts';
import { scheduleConflicts } from '@orbit/contracts/planner';
import { BlankSlate, EditorDialog, WorkspaceHeading } from './presentation';
import { displayDate, updateWorkspace, useWorkspace } from './store';

import { LocalImport } from './local-import';

export const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function SemesterFields({ semester }: { semester?: Semester }) {
  return <>
    <Input label="Nome do semestre" name="semester" defaultValue={semester?.name} maxLength={140} required />
    <div className="ws-form-pair">
      <Input label="Início do semestre" name="startsOn" type="date" defaultValue={semester?.startsOn} required />
      <Input label="Fim do semestre" name="endsOn" type="date" defaultValue={semester?.endsOn} required />
    </div>
  </>;
}

function readSemester(data: FormData, id: string) {
  return semesterSchema.safeParse({
    id, name: data.get('semester'), startsOn: data.get('startsOn'), endsOn: data.get('endsOn'),
  });
}

export function Onboarding() {
  const { subjects, entries, onboardingComplete } = useWorkspace();
  const [kind, setKind] = useState<'task' | 'exam'>('task');
  const [error, setError] = useState('');
  const ready = onboardingComplete || (subjects.length > 0 && entries.some(item => item.kind !== 'event'));

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = subjects.length
      ? subjects.find(item => item.id === data.get('subjectId'))
      : subjectSchema.safeParse({ id: crypto.randomUUID(), name: data.get('name'), teacher: '' }).data;
    if (!subject) {
      setError('Informe ou selecione uma disciplina.');
      return;
    }
    const entry = entrySchema.safeParse({
      id: crypto.randomUUID(), kind, title: data.get('title'), date: data.get('date'), subjectId: subject.id, done: false,
    });
    if (!entry.success) {
      setError('Confira o título e a data do compromisso.');
      return;
    }
    updateWorkspace(current => ({
      ...current, onboardingComplete: true,
      subjects: current.subjects.some(item => item.id === subject.id) ? current.subjects : [...current.subjects, subject],
      entries: [...current.entries, entry.data],
    }));
  }

  return <div className="ws-page">
    <WorkspaceHeading title="Primeiros passos" description="Cadastre uma disciplina e seu primeiro compromisso." />
    <LocalImport prominent />
    {ready ? <section className="ws-panel settings-info">
      <h2>Seu espaço está pronto</h2>
      <p>Quando quiser organizar suas aulas, cadastre o semestre e os horários.</p>
      <div className="ws-inline-actions">
        <Link href="/app" className="orbit-button orbit-button--primary">Ver meu dia</Link>
        <Link href="/schedule" className="orbit-button orbit-button--secondary">Configurar semestre</Link>
      </div>
    </section> : <form className="ws-panel settings-form ws-form" onSubmit={start} onChange={() => setError('')}>
      {subjects.length ? <label className="orbit-field">
        <span className="orbit-label">Disciplina</span>
        <select className="orbit-input" name="subjectId" aria-label="Disciplina">{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label> : <Input label="Nome da disciplina" name="name" maxLength={100} required />}
      <div className="ws-segment" role="group" aria-label="Tipo de compromisso">
        <button type="button" aria-pressed={kind === 'task'} onClick={() => setKind('task')}>Tarefa</button>
        <button type="button" aria-pressed={kind === 'exam'} onClick={() => setKind('exam')}>Prova</button>
      </div>
      <Input label={kind === 'task' ? 'Nome da tarefa' : 'Nome da prova'} name="title" maxLength={140} required />
      <Input label={kind === 'task' ? 'Prazo (opcional)' : 'Data da prova'} type="date" name="date" required={kind === 'exam'} />
      {error && <p className="ws-form-error" role="alert">{error}</p>}
      <div className="ws-inline-actions">
        <Button type="submit">Salvar primeiro compromisso</Button>
        <Link href="/app" className="orbit-button orbit-button--secondary">Configurar depois</Link>
      </div>
    </form>}
  </div>;
}

export function WeekdayField({ name = 'weekday', value = 1 }: { name?: string; value?: number }) {
  return <label className="orbit-field"><span className="orbit-label">Dia da semana</span>
    <select className="orbit-input" name={name} aria-label="Dia da semana" defaultValue={value}>
      {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
    </select>
  </label>;
}

export function AcademicSchedule() {
  const workspace = useWorkspace();
  const { semesters, subjects, schedules } = workspace;
  const [editor, setEditor] = useState<{ type: 'semester'; item?: Semester } | { type: 'schedule'; item?: Schedule } | null>(null);
  const [removing, setRemoving] = useState<Semester | Schedule | null>(null);
  const [error, setError] = useState('');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const data = new FormData(event.currentTarget);
    const id = editor.item?.id ?? crypto.randomUUID();
    if (editor.type === 'semester') {
      const parsed = readSemester(data, id);
      if (!parsed.success) {
        setError('O fim do semestre deve ser igual ou posterior ao início.');
        return;
      }
      const next = { ...workspace, semesters: [...semesters.filter(item => item.id !== id), parsed.data] };
      if (schedules.some(item => scheduleConflicts(next, item))) {
        setError('Este período cria um conflito entre horários de aula.');
        return;
      }
      updateWorkspace(current => ({ ...current, semesters: next.semesters }));
    } else {
      const parsed = scheduleSchema.safeParse({
        id, subjectId: data.get('subjectId'), weekday: Number(data.get('weekday')),
        startsAt: data.get('startsAt'), endsAt: data.get('endsAt'), location: data.get('location'),
      });
      if (!parsed.success || !subjects.some(subject => subject.id === parsed.data.subjectId)) {
        setError('Selecione uma disciplina e informe um horário final posterior ao inicial.');
        return;
      }
      if (scheduleConflicts(workspace, parsed.data)) {
        setError('Já há uma aula nesse horário.');
        return;
      }
      updateWorkspace(current => ({ ...current, schedules: [...current.schedules.filter(item => item.id !== id), parsed.data] }));
    }
    setEditor(null);
  }

  function remove() {
    if (!removing) return;
    const { id } = removing;
    if ('startsOn' in removing) {
      updateWorkspace(current => ({ ...current,
        semesters: current.semesters.filter(item => item.id !== id),
        subjects: current.subjects.map(item => item.semesterId === id ? { ...item, semesterId: '' } : item),
        schedules: current.schedules.filter(item => !current.subjects.some(subject => subject.id === item.subjectId && subject.semesterId === id)),
      }));
    } else {
      updateWorkspace(current => ({ ...current, schedules: current.schedules.filter(item => item.id !== id) }));
    }
    setRemoving(null);
  }

  function edit(value: NonNullable<typeof editor>) {
    setError('');
    setEditor(value);
  }

  return <div className="ws-page">
    <WorkspaceHeading title="Semestres e horários" description="Organize seus períodos letivos e aulas recorrentes." />
    <section className="ws-panel settings-info">
      <div className="ws-section-head"><h2>Semestres</h2><Button size="sm" onClick={() => edit({ type: 'semester' })}>Novo semestre</Button></div>
      {semesters.length ? <ul className="entry-list">{[...semesters].sort((a, b) => b.startsOn.localeCompare(a.startsOn)).map(item => <li className="entry-row" key={item.id}>
        <span className="entry-icon"><CalendarDays size={18} aria-hidden="true" /></span>
        <div className="entry-copy"><strong>{item.name}</strong><p>{displayDate(item.startsOn)} a {displayDate(item.endsOn)}</p></div>
        <div className="ws-icon-actions">
          <IconButton label={`Editar ${item.name}`} onClick={() => edit({ type: 'semester', item })}><Pencil size={16} aria-hidden="true" /></IconButton>
          <IconButton label={`Remover ${item.name}`} onClick={() => setRemoving(item)}><Trash2 size={16} aria-hidden="true" /></IconButton>
        </div>
      </li>)}</ul> : <BlankSlate icon={CalendarDays} title="Nenhum semestre cadastrado" />}
    </section>
    <section className="ws-panel settings-info">
      <div className="ws-section-head"><h2>Aulas recorrentes</h2>
        {subjects.length > 0 && <Button size="sm" onClick={() => edit({ type: 'schedule' })}>Novo horário</Button>}
      </div>
      {schedules.length ? <ul className="entry-list">{[...schedules].sort((a, b) => (a.weekday + 6) % 7 - (b.weekday + 6) % 7 || a.startsAt.localeCompare(b.startsAt)).map(item => {
        const name = subjects.find(subject => subject.id === item.subjectId)?.name ?? 'Aula';
        return <li className="entry-row" key={item.id}>
          <span className="entry-icon"><Clock size={18} aria-hidden="true" /></span>
          <div className="entry-copy"><strong>{name}</strong><p>{[weekdays[item.weekday], `${item.startsAt}–${item.endsAt}`, item.location].filter(Boolean).join(' · ')}</p></div>
          <div className="ws-icon-actions">
            <IconButton label={`Editar horário de ${name}`} onClick={() => edit({ type: 'schedule', item })}><Pencil size={16} aria-hidden="true" /></IconButton>
            <IconButton label={`Remover horário de ${name}`} onClick={() => setRemoving(item)}><Trash2 size={16} aria-hidden="true" /></IconButton>
          </div>
        </li>;
      })}</ul> : <BlankSlate icon={BookOpen} title="Nenhuma aula recorrente" action={!subjects.length &&
        <Link href="/subjects#novo" className="orbit-button orbit-button--secondary">Cadastrar disciplina</Link>} />}
    </section>
    {editor && <EditorDialog title={editor.type === 'semester' ? editor.item ? 'Editar semestre' : 'Novo semestre' : editor.item ? 'Editar horário' : 'Novo horário'} onClose={() => setEditor(null)} focusField>
      <form className="ws-form" onSubmit={save} onChange={() => setError('')}>
        {editor.type === 'semester' ? <SemesterFields semester={editor.item} /> : <>
          <label className="orbit-field"><span className="orbit-label">Disciplina</span><select className="orbit-input" name="subjectId" aria-label="Disciplina" defaultValue={editor.item?.subjectId} required>
            {subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <WeekdayField value={editor.item?.weekday} />
          <div className="ws-form-pair">
            <Input label="Início da aula" type="time" name="startsAt" defaultValue={editor.item?.startsAt} required />
            <Input label="Fim da aula" type="time" name="endsAt" defaultValue={editor.item?.endsAt} required />
          </div>
          <Input label="Local" name="location" defaultValue={editor.item?.location} maxLength={100} />
        </>}
        {error && <p className="ws-form-error" role="alert">{error}</p>}
        <div className="ws-form-actions"><Button type="submit">Salvar</Button></div>
      </form>
    </EditorDialog>}
    {removing && <EditorDialog title={'startsOn' in removing ? 'Remover semestre' : 'Remover horário'} onClose={() => setRemoving(null)}>
      {'startsOn' in removing && <p>As disciplinas serão mantidas. As aulas recorrentes desse semestre serão removidas.</p>}
      <div className="ws-form-actions"><Button variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button><Button onClick={remove}>Remover</Button></div>
    </EditorDialog>}
  </div>;
}

