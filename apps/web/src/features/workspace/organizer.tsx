'use client';

import { entrySchema, removeEntry, removeSubject } from '@orbit/contracts';
import { scheduleConflicts } from '@orbit/contracts/planner';
import { CalendarAgenda } from './calendar-agenda';
import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, CalendarDays, Check, ClipboardList, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, Input } from '@orbit/design-system';
import { BlankSlate, EditorDialog, WorkspaceHeading } from './presentation';
import { byDate, displayDate, useLocalDate, updateWorkspace, useWorkspace, type Entry, type EntryKind, type Subject } from './store';

function useRecordShortcut<T extends { id: string }>(records: T[], open: (value: T | 'new') => void) {
  useEffect(() => {
    let frame: number | undefined;
    const followLink = () => {
      const hash = window.location.hash;
      const record = hash === '#novo' ? 'new' : hash.startsWith('#editar-')
        ? records.find(item => item.id === hash.slice(8)) : undefined;
      if (!record) return;
      window.cancelAnimationFrame(frame ?? 0);
      frame = window.requestAnimationFrame(() => {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
        open(record);
      });
    };
    followLink();
    window.addEventListener('hashchange', followLink);
    return () => {
      window.cancelAnimationFrame(frame ?? 0);
      window.removeEventListener('hashchange', followLink);
    };
  }, [open, records]);
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
  const workspace = useWorkspace();
  const { subjects, entries, semesters } = workspace;
  const [editor, setEditor] = useState<Subject | 'new' | null>(null);
  useRecordShortcut(subjects, setEditor);
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
    const subject = { id: editing?.id ?? crypto.randomUUID(), name, teacher: String(data.get('teacher')).trim(), semesterId: String(data.get('semesterId')) };
    const next = editing ? subjects.map(item => item.id === editing.id ? subject : item) : [...subjects, subject];
    const updated = { ...workspace, subjects: next };
    if (workspace.schedules.some(item => item.subjectId === subject.id && scheduleConflicts(updated, item))) {
      setError('O semestre escolhido cria um conflito entre horários de aula.');
      return;
    }
    updateWorkspace(current => ({
      ...current,
      subjects: next,
    }));
    setNotice(editing ? 'Disciplina atualizada.' : 'Disciplina adicionada.');
    setEditor(null);
  }

  function remove(id: string) {
    updateWorkspace(current => removeSubject(current, id));
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
          <h2>{subject.name}</h2>{[subject.teacher, semesters.find(item => item.id === subject.semesterId)?.name].filter(Boolean).length > 0 && <p>{[subject.teacher, semesters.find(item => item.id === subject.semesterId)?.name].filter(Boolean).join(' · ')}</p>}
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
        <label className="orbit-field"><span className="orbit-label">Semestre</span><select className="orbit-input" name="semesterId" aria-label="Semestre" defaultValue={editing?.semesterId ?? ''}>
          <option value="">Sem semestre</option>{semesters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        {error && <p className="ws-form-error" role="alert">{error}</p>}
        <div className="ws-form-actions"><Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit">{editing ? 'Salvar disciplina' : 'Adicionar disciplina'}</Button></div>
      </form>
    </EditorDialog>}
    {removing && <RemoveDialog name={removing.name} description="Tarefas, provas e eventos serão mantidos. Os horários de aula desta disciplina serão removidos." onClose={() => setRemoving(null)} onRemove={() => remove(removing.id)} />}
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
  const workspace = useWorkspace();
  const { entries, subjects } = workspace;
  const [editor, setEditor] = useState<Entry | 'new' | null>(null);
  const records = entries.filter(item => item.kind === kind);
  useRecordShortcut(records, setEditor);
  const [removing, setRemoving] = useState<Entry | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonth, setMonth] = useState('');
  const [selectedDate, setDate] = useState('');
  const [newDate, setNewDate] = useState('');
  const today = useLocalDate();
  const month = selectedMonth || today.slice(0, 7);
  const editing = editor && editor !== 'new' ? editor : null;
  const words = labels[kind];
  const isCalendar = kind === 'event';
  const calendarDate = newDate || selectedDate || (month === today.slice(0, 7) ? today : `${month}-01`);
  const filters = kind === 'task' ? taskFilters : examFilters;
  const items = records.filter(item => {
    if (filter === 'all') return true;
    return kind === 'task' ? item.done === (filter === 'done') : (item.date < today) === (filter === 'past');
  }).sort(byDate);

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
    const time = String(data.get('time') ?? '') || undefined;
    const duration = String(data.get('durationMinutes') ?? '');
    const effort = String(data.get('effortMinutes') ?? '');
    const preparation = String(data.get('preparation') ?? '');
    const record = entrySchema.safeParse({
      id: editing?.id ?? crypto.randomUUID(), kind, title,
      date: String(data.get('date')), subjectId: String(data.get('subjectId')), done: false,
      time, durationMinutes: time ? Number(duration) : undefined,
      effortMinutes: effort ? Number(effort) : undefined,
      preparation: preparation ? Number(preparation) : undefined,
      priority: data.get('priority') ?? undefined,
    });
    if (!record.success) {
      setError('Confira a data, a hora e a duração. O compromisso deve terminar no mesmo dia.');
      return;
    }
    const entry = record.data;
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
    setNewDate('');
    setEditor(null);
  }

  function remove(id: string) {
    updateWorkspace(current => removeEntry(current, id));
    setNotice('Registro removido.');
    setRemoving(null);
  }

  function toggle(item: Entry) {
    updateWorkspace(current => ({ ...current, entries: current.entries.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry) }));
    setNotice(item.done ? 'Tarefa reaberta.' : 'Tarefa concluída.');
  }

  const list = <section className="ws-panel entry-panel" aria-labelledby="entry-list-title">
    <div className="ws-section-head">
      <div><h2 id="entry-list-title">{kind === 'task' ? 'Suas tarefas' : 'Suas provas'}</h2>
        {items.length > 0 && <p>{items.length} {items.length === 1 ? 'registro' : 'registros'}</p>}</div>
      {!isCalendar && <div className="ws-segment" aria-label={`Filtrar ${words.title.toLowerCase()}`} role="group">
        {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>)}
      </div>}
    </div>
    {items.length === 0 ? <BlankSlate icon={words.icon} title={kind === 'task' ? 'Nenhuma tarefa nesta lista' : 'Nenhuma prova nesta lista'} action={filter === 'all' && <Button variant="secondary" onClick={() => openEditor('new')}>{words.create}</Button>} /> :
      <ul className="entry-list">{items.map(item => {
        const subject = subjects.find(subject => subject.id === item.subjectId);
        const Icon = labels[item.kind].icon;
        const due = item.kind === 'task' && !item.done && item.date && item.date < today;
        return <li key={item.id} className={item.done ? 'entry-row entry-done' : 'entry-row'}>
          {kind === 'task' ? <button className="task-toggle" aria-pressed={item.done} aria-label={`${item.done ? 'Reabrir' : 'Concluir'} ${item.title}`} onClick={() => toggle(item)} type="button">{item.done && <Check size={16} aria-hidden="true" />}</button> :
            <span className="entry-icon" data-kind={item.kind}><Icon size={19} aria-hidden="true" /></span>}
          <div className="entry-copy"><strong>{item.title}</strong><p>{subject?.name || 'Sem disciplina'}</p></div>
          <div className="entry-date" data-overdue={Boolean(due)}><span>{displayDate(item.date)}{item.time && ` · ${item.time}`}</span>{due ? <small>Em atraso</small> : item.done ? <small>Concluída</small> : null}</div>
          <div className="ws-icon-actions">
            <IconButton label={`Editar ${item.title}`} onClick={() => openEditor(item)}><Pencil size={16} aria-hidden="true" /></IconButton>
            <IconButton label={`Remover ${item.title}`} onClick={() => setRemoving(item)}><Trash2 size={16} aria-hidden="true" /></IconButton>
          </div>
        </li>;
      })}</ul>}
  </section>;

  return <div className="ws-page">
    <WorkspaceHeading title={words.title} description={isCalendar ? 'Aulas, prazos e sessões de estudo na mesma agenda.' : kind === 'task' ? 'Organize o que precisa fazer e acompanhe os prazos.' : 'Acompanhe as avaliações por data e disciplina.'} action={<Button onClick={() => { setNewDate(''); openEditor('new'); }} icon={<Plus size={17} aria-hidden="true" />}>{words.create}</Button>} />
    <span className="orbit-sr-only" role="status">{notice}</span>
    {isCalendar ? <CalendarAgenda workspace={workspace} today={today} date={selectedDate} month={month}
      onDate={setDate} onMonth={value => { setMonth(value); setDate(''); }}
      onCreate={date => { setNewDate(date); openEditor('new'); }} /> : list}
    {editor && <EditorDialog title={editing ? `Editar ${words.singular}` : words.create} onClose={() => setEditor(null)} focusField>
      <form className="ws-form" onSubmit={save}>
        <Input label="Título" name="title" defaultValue={editing?.title} maxLength={140} required error={error || undefined} onChange={() => setError('')} />
        <Input label={words.date} name="date" type="date" defaultValue={editing?.date ?? (isCalendar ? calendarDate : '')} required={kind !== 'task'} />
        <label className="orbit-field"><span className="orbit-label">Disciplina</span><select className="orbit-input" name="subjectId" aria-label="Disciplina" defaultValue={editing?.subjectId ?? ''}>
          <option value="">Sem disciplina</option>{subjects.map(subject => <option value={subject.id} key={subject.id}>{subject.name}</option>)}
        </select></label>
        {kind !== 'task' && <div className="ws-form-pair">
          <Input label="Horário" name="time" type="time" defaultValue={editing?.time} />
          <Input label="Duração (min)" name="durationMinutes" type="number" defaultValue={editing?.durationMinutes ?? 60} min="1" max="720" />
        </div>}
        {kind !== 'event' && <div className="ws-form-pair">
          <Input label="Tempo de estudo estimado (min)" name="effortMinutes" type="number" defaultValue={editing?.effortMinutes} min="1" max="720" />
          {kind === 'exam' ? <Input label="Nível de preparo (%)" name="preparation" type="number" defaultValue={editing?.preparation} min="0" max="100" /> :
            <label className="orbit-field"><span className="orbit-label">Prioridade</span><select className="orbit-input" name="priority" defaultValue={editing?.priority ?? 'normal'}>
              <option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option>
            </select></label>}
        </div>}
        {error && <p className="ws-form-error" role="alert">{error}</p>}
        <div className="ws-form-actions">
          {isCalendar && editing && <Button variant="ghost" onClick={() => { setEditor(null); setRemoving(editing); }}>Remover evento</Button>}
          <Button variant="secondary" onClick={() => { setEditor(null); setNewDate(''); }}>Cancelar</Button><Button type="submit">{editing ? 'Salvar alterações' : `Adicionar ${words.singular}`}</Button></div>
      </form>
    </EditorDialog>}
    {removing && <RemoveDialog name={removing.title} onClose={() => setRemoving(null)} onRemove={() => remove(removing.id)} />}
  </div>;
}
