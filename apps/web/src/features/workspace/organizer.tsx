'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, BookOpen, CalendarDays, Check, ClipboardList, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, Input } from '@orbit/design-system';
import { MonthGrid } from './month-grid';
import { BlankSlate, EditorDialog, WorkspaceHeading } from './presentation';
import { byDate, displayDate, useLocalDate, updateWorkspace, useWorkspace, type Entry, type EntryKind, type Subject } from './store';

function useNewRecordShortcut(open: (value: 'new') => void) {
  useEffect(() => {
    let frame: number | undefined;
    const followLink = () => {
      if (window.location.hash !== '#novo') return;
      window.cancelAnimationFrame(frame ?? 0);
      frame = window.requestAnimationFrame(() => {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        open('new');
      });
    };
    followLink();
    window.addEventListener('hashchange', followLink);
    return () => {
      window.cancelAnimationFrame(frame ?? 0);
      window.removeEventListener('hashchange', followLink);
    };
  }, [open]);
}

function RemoveDialog({ name, description, onRemove, onClose }: {
  name: string;
  description?: string;
  onRemove: () => void;
  onClose: () => void;
}) {
  return <EditorDialog title={`Remover ${name}?`} onClose={onClose}>
    {description && <p className="ws-dialog-copy">{description}</p>}
    <div className="ws-form-actions">
      <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button className="ws-danger" onClick={onRemove}>Confirmar remoção</Button>
    </div>
  </EditorDialog>;
}

export function Subjects() {
  const { subjects, entries } = useWorkspace();
  const [editor, setEditor] = useState<Subject | 'new' | null>(null);
  useNewRecordShortcut(setEditor);
  const [removing, setRemoving] = useState<Subject | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editing = editor && editor !== 'new' ? editor : null;

  function openEditor(value: Subject | 'new') {
    setError('');
    setEditor(value);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    if (!name) {
      setError('Informe o nome da disciplina.');
      return;
    }
    const subject = { id: editing?.id ?? crypto.randomUUID(), name, teacher: String(data.get('teacher')).trim() };
    updateWorkspace(current => ({
      ...current,
      subjects: editing ? current.subjects.map(item => item.id === editing.id ? subject : item) : [...current.subjects, subject],
    }));
    setNotice(editing ? 'Disciplina atualizada.' : 'Disciplina adicionada.');
    setEditor(null);
  }

  function remove(id: string) {
    updateWorkspace(current => ({
      ...current,
      subjects: current.subjects.filter(item => item.id !== id),
      entries: current.entries.map(item => item.subjectId === id ? { ...item, subjectId: '' } : item),
    }));
    setNotice('Disciplina removida.');
    setRemoving(null);
  }

  return <div className="ws-page">
    <WorkspaceHeading title="Disciplinas" description="Acompanhe as tarefas e provas vinculadas a cada matéria." action={<Button onClick={() => openEditor('new')} icon={<Plus size={17} aria-hidden="true" />}>Nova disciplina</Button>} />
    <span className="orbit-sr-only" role="status">{notice}</span>
    {subjects.length === 0 ? <div className="ws-panel"><BlankSlate icon={BookOpen} title="Nenhuma disciplina cadastrada" description="Adicione sua primeira disciplina para organizar tarefas e provas." action={<Button variant="secondary" onClick={() => openEditor('new')}>Adicionar disciplina</Button>} /></div> :
      <ul className="subject-grid">{subjects.map((subject, index) => {
        const tasks = entries.filter(item => item.subjectId === subject.id && item.kind === 'task');
        const exams = entries.filter(item => item.subjectId === subject.id && item.kind === 'exam').length;
        const done = tasks.filter(item => item.done).length;
        return <li className="ws-panel subject-tile" data-color={index % 3} key={subject.id}>
          <div className="subject-tile-top">
            <span className="subject-monogram" aria-hidden="true">{subject.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span>
            <div className="ws-icon-actions">
              <IconButton label={`Editar ${subject.name}`} onClick={() => openEditor(subject)}><Pencil size={17} aria-hidden="true" /></IconButton>
              <IconButton label={`Remover ${subject.name}`} onClick={() => setRemoving(subject)}><Trash2 size={17} aria-hidden="true" /></IconButton>
            </div>
          </div>
          <h2>{subject.name}</h2>{subject.teacher && <p>{subject.teacher}</p>}
          <div className="subject-tile-progress">
            <span>{tasks.length ? `${done} de ${tasks.length} tarefas concluídas` : 'Sem tarefas vinculadas'}</span>
            {tasks.length > 0 && <progress value={done} max={tasks.length} aria-label={`Tarefas concluídas em ${subject.name}`} />}
          </div>
          <span className="subject-tile-exams"><ClipboardList size={16} aria-hidden="true" />{exams} {exams === 1 ? 'prova' : 'provas'}</span>
        </li>;
      })}</ul>}
    {editor && <EditorDialog title={editing ? 'Editar disciplina' : 'Nova disciplina'} onClose={() => setEditor(null)} focusField>
      <form className="ws-form" onSubmit={save}>
        <Input label="Nome da disciplina" name="name" defaultValue={editing?.name} maxLength={100} required error={error || undefined} onChange={() => setError('')} />
        <Input label="Professor(a)" name="teacher" defaultValue={editing?.teacher} maxLength={100} />
        <span className="orbit-sr-only" role="alert">{error}</span>
        <div className="ws-form-actions"><Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit">{editing ? 'Salvar disciplina' : 'Adicionar disciplina'}</Button></div>
      </form>
    </EditorDialog>}
    {removing && <RemoveDialog name={removing.name} description="Tarefas, provas e eventos vinculados serão mantidos sem disciplina." onClose={() => setRemoving(null)} onRemove={() => remove(removing.id)} />}
  </div>;
}

const labels = {
  task: { title: 'Tarefas', create: 'Nova tarefa', singular: 'tarefa', date: 'Prazo', icon: ListTodo },
  exam: { title: 'Provas', create: 'Nova prova', singular: 'prova', date: 'Data da prova', icon: ClipboardList },
  event: { title: 'Calendário', create: 'Novo evento', singular: 'evento', date: 'Data do evento', icon: CalendarDays },
};
const taskFilters = [{ value: 'all', label: 'Todas' }, { value: 'pending', label: 'Pendentes' }, { value: 'done', label: 'Concluídas' }] as const;
const examFilters = [{ value: 'all', label: 'Todas' }, { value: 'upcoming', label: 'Próximas' }, { value: 'past', label: 'Anteriores' }] as const;
type Filter = (typeof taskFilters)[number]['value'] | (typeof examFilters)[number]['value'];

export function Organizer({ kind }: { kind: EntryKind }) {
  const { entries, subjects } = useWorkspace();
  const [editor, setEditor] = useState<Entry | 'new' | null>(null);
  useNewRecordShortcut(setEditor);
  const [removing, setRemoving] = useState<Entry | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonth, setMonth] = useState('');
  const [selectedDate, setDate] = useState('');
  const today = useLocalDate();
  const month = selectedMonth || today.slice(0, 7);
  const editing = editor && editor !== 'new' ? editor : null;
  const words = labels[kind];
  const isCalendar = kind === 'event';
  const filters = kind === 'task' ? taskFilters : examFilters;
  const monthEntries = entries.filter(item => item.date && item.date.startsWith(month));
  const items = (isCalendar ? monthEntries.filter(item => !selectedDate || item.date === selectedDate) : entries.filter(item => {
    if (item.kind !== kind) return false;
    if (filter === 'all') return true;
    return kind === 'task' ? item.done === (filter === 'done') : (item.date < today) === (filter === 'past');
  })).sort(byDate);

  function openEditor(value: Entry | 'new') {
    setError('');
    setEditor(value);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title')).trim();
    if (!title) {
      setError('Informe um título.');
      return;
    }
    const entry: Entry = {
      id: editing?.id ?? crypto.randomUUID(), kind, title,
      date: String(data.get('date')), subjectId: String(data.get('subjectId')), done: false,
    };
    updateWorkspace(current => {
      const valid = { ...entry, subjectId: current.subjects.some(subject => subject.id === entry.subjectId) ? entry.subjectId : '' };
      return { ...current, entries: editing ? current.entries.map(item => item.id === editing.id ? { ...valid, done: item.done } : item) : [...current.entries, valid] };
    });
    if (isCalendar) {
      setMonth(entry.date.slice(0, 7));
      setDate(entry.date);
    } else {
      setFilter('all');
    }
    setNotice(editing ? 'Registro atualizado.' : 'Registro adicionado.');
    setEditor(null);
  }

  function remove(id: string) {
    updateWorkspace(current => ({ ...current, entries: current.entries.filter(item => item.id !== id) }));
    setNotice('Registro removido.');
    setRemoving(null);
  }

  function toggle(item: Entry) {
    updateWorkspace(current => ({ ...current, entries: current.entries.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry) }));
    setNotice(item.done ? 'Tarefa reaberta.' : 'Tarefa concluída.');
  }

  const list = <section className="ws-panel entry-panel" aria-labelledby="entry-list-title">
    <div className="ws-section-head">
      <div><h2 id="entry-list-title">{isCalendar ? selectedDate ? displayDate(selectedDate) : 'Compromissos do mês' : kind === 'task' ? 'Suas tarefas' : 'Suas provas'}</h2>
        {items.length > 0 && <p>{items.length} {items.length === 1 ? 'registro' : 'registros'}</p>}</div>
      {isCalendar && selectedDate && <Button size="sm" variant="ghost" onClick={() => setDate('')}>Ver mês inteiro</Button>}
      {!isCalendar && <div className="ws-segment" aria-label={`Filtrar ${words.title.toLowerCase()}`} role="group">
        {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>)}
      </div>}
    </div>
    {items.length === 0 ? <BlankSlate icon={words.icon} title={isCalendar ? 'Sem compromissos neste período' : kind === 'task' ? 'Nenhuma tarefa nesta lista' : 'Nenhuma prova nesta lista'} action={filter === 'all' && <Button variant="secondary" onClick={() => openEditor('new')}>{words.create}</Button>} /> :
      <ul className="entry-list">{items.map(item => {
        const subject = subjects.find(subject => subject.id === item.subjectId);
        const Icon = labels[item.kind].icon;
        const due = item.kind === 'task' && !item.done && item.date && item.date < today;
        return <li key={item.id} className={item.done ? 'entry-row entry-done' : 'entry-row'}>
          {kind === 'task' ? <button className="task-toggle" aria-pressed={item.done} aria-label={`${item.done ? 'Reabrir' : 'Concluir'} ${item.title}`} onClick={() => toggle(item)} type="button">{item.done && <Check size={16} aria-hidden="true" />}</button> :
            <span className="entry-icon" data-kind={item.kind}><Icon size={19} aria-hidden="true" /></span>}
          <div className="entry-copy"><strong>{item.title}</strong><p>{[isCalendar ? labels[item.kind].singular : '', subject?.name].filter(Boolean).join(' · ') || 'Sem disciplina'}</p></div>
          <div className="entry-date" data-overdue={Boolean(due)}><span>{displayDate(item.date)}</span>{due ? <small>Em atraso</small> : item.done ? <small>Concluída</small> : null}</div>
          <div className="ws-icon-actions">
            {kind === item.kind ? <>
              <IconButton label={`Editar ${item.title}`} onClick={() => openEditor(item)}><Pencil size={16} aria-hidden="true" /></IconButton>
              <IconButton label={`Remover ${item.title}`} onClick={() => setRemoving(item)}><Trash2 size={16} aria-hidden="true" /></IconButton>
            </> : <Link className="entry-link" href={item.kind === 'task' ? '/tasks' : '/exams'} aria-label={`Abrir ${item.title} em ${labels[item.kind].title.toLowerCase()}`}><ArrowUpRight size={17} aria-hidden="true" /></Link>}
          </div>
        </li>;
      })}</ul>}
  </section>;

  return <div className="ws-page">
    <WorkspaceHeading title={words.title} description={isCalendar ? 'Tarefas, provas e eventos no mesmo calendário.' : kind === 'task' ? 'Organize o que precisa fazer e acompanhe os prazos.' : 'Acompanhe as avaliações por data e disciplina.'} action={<Button onClick={() => openEditor('new')} icon={<Plus size={17} aria-hidden="true" />}>{words.create}</Button>} />
    <span className="orbit-sr-only" role="status">{notice}</span>
    {isCalendar ? <div className="calendar-layout">
      <MonthGrid month={month} today={today} entries={monthEntries} selection={selectedDate} onDate={date => setDate(current => current === date ? '' : date)} onMonth={value => { setMonth(value); setDate(''); }} />
      {list}
    </div> : list}
    {editor && <EditorDialog title={editing ? `Editar ${words.singular}` : words.create} onClose={() => setEditor(null)} focusField>
      <form className="ws-form" onSubmit={save}>
        <Input label="Título" name="title" defaultValue={editing?.title} maxLength={140} required error={error || undefined} onChange={() => setError('')} />
        <Input label={words.date} name="date" type="date" defaultValue={editing?.date ?? (isCalendar ? selectedDate : '')} required={kind !== 'task'} />
        <label className="orbit-field"><span className="orbit-label">Disciplina</span><select className="orbit-input" name="subjectId" defaultValue={editing?.subjectId ?? ''}>
          <option value="">Sem disciplina</option>{subjects.map(subject => <option value={subject.id} key={subject.id}>{subject.name}</option>)}
        </select></label>
        <span className="orbit-sr-only" role="alert">{error}</span>
        <div className="ws-form-actions"><Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit">{editing ? 'Salvar alterações' : `Adicionar ${words.singular}`}</Button></div>
      </form>
    </EditorDialog>}
    {removing && <RemoveDialog name={removing.title} onClose={() => setRemoving(null)} onRemove={() => remove(removing.id)} />}
  </div>;
}
