'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, Input, PageHeader } from '@orbit/design-system';
import { byDate, displayDate, useLocalDate, updateWorkspace, useWorkspace, type Entry, type EntryKind, type Subject } from './store';

export function Subjects() {
  const { subjects, entries } = useWorkspace();
  const [editing, setEditing] = useState<Subject | null>(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    if (!name) {
      setError('Informe o nome da disciplina.');
      return;
    }
    const subject: Subject = { id: editing?.id ?? crypto.randomUUID(), name, teacher: String(data.get('teacher')).trim() };
    updateWorkspace(current => ({
      ...current,
      subjects: editing ? current.subjects.map(item => item.id === editing.id ? subject : item) : [...current.subjects, subject],
    }));
    event.currentTarget.reset();
    setEditing(null);
    setError('');
  }

  function remove(id: string) {
    updateWorkspace(current => ({
      ...current,
      subjects: current.subjects.filter(item => item.id !== id),
      entries: current.entries.map(item => item.subjectId === id ? { ...item, subjectId: '' } : item),
    }));
    if (editing?.id === id) {
      setEditing(null);
      setError('');
    }
    setRemoving(null);
  }

  return <div className="work-page">
    <PageHeader title="Disciplinas" />
    <Card><form key={editing?.id ?? 'new'} className="work-form" onSubmit={save}>
      <Input label="Nome da disciplina" name="name" defaultValue={editing?.name} maxLength={100} required error={error || undefined} onChange={() => setError('')} />
      <Input label="Professor(a)" name="teacher" defaultValue={editing?.teacher} maxLength={100} />
      <div className="work-actions"><Button type="submit">{editing ? 'Salvar disciplina' : 'Adicionar disciplina'}</Button>
        {editing && <Button variant="ghost" onClick={() => { setEditing(null); setError(''); }}>Cancelar edição</Button>}
      </div>
    </form></Card>
    {subjects.length === 0 && <p className="work-empty">Adicione sua primeira disciplina para organizar tarefas e provas.</p>}
    <ul className="work-list">{subjects.map(subject => {
      const todo = entries.filter(item => item.subjectId === subject.id && item.kind === 'task' && !item.done).length;
      return <li key={subject.id}><Card className="work-row">
        <div><strong>{subject.name}</strong><p>{[subject.teacher, `${todo} ${todo === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`].filter(Boolean).join(' · ')}</p></div>
        {removing === subject.id ? <div className="work-confirm"><p>Remover disciplina? Os itens vinculados serão mantidos sem disciplina.</p><div className="work-actions"><Button size="sm" onClick={() => remove(subject.id)}>Confirmar remoção</Button><Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>Cancelar</Button></div></div> :
          <div className="work-actions"><Button size="sm" variant="secondary" onClick={() => { setEditing(subject); setError(''); }}>Editar</Button><Button size="sm" variant="ghost" onClick={() => setRemoving(subject.id)}>Remover</Button></div>}
      </Card></li>;
    })}</ul>
  </div>;
}

const entryLabels = {
  task: { title: 'Tarefas', singular: 'tarefa', plural: 'tarefas', date: 'Prazo' },
  exam: { title: 'Provas', singular: 'prova', plural: 'provas', date: 'Data da prova' },
  event: { title: 'Calendário', singular: 'evento', plural: 'eventos', date: 'Data do evento' },
};

export function Organizer({ kind }: { kind: EntryKind }) {
  const { entries, subjects } = useWorkspace();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedMonth, setPeriod] = useState('');
  const today = useLocalDate();
  const period = selectedMonth || today.slice(0, 7);
  const words = entryLabels[kind];
  const items = entries.filter(item => {
    if (kind === 'event') return item.date.startsWith(period);
    if (item.kind !== kind) return false;
    return kind !== 'task' || filter === 'all' || item.done === (filter === 'done');
  }).sort(byDate);

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
      date: String(data.get('date')), subjectId: String(data.get('subjectId')),
      done: editing?.done ?? false,
    };
    updateWorkspace(current => {
      const validEntry = current.subjects.some(subject => subject.id === entry.subjectId) ? entry : { ...entry, subjectId: '' };
      return {
        ...current,
        entries: editing ? current.entries.map(item => item.id === editing.id ? { ...validEntry, done: item.done } : item) : [...current.entries, validEntry],
      };
    });
    if (kind === 'event') setPeriod(entry.date.slice(0, 7));
    if (kind === 'task' && filter === 'done' && !entry.done) setFilter('all');
    event.currentTarget.reset();
    setEditing(null);
    setError('');
  }

  function remove(id: string) {
    updateWorkspace(current => ({ ...current, entries: current.entries.filter(item => item.id !== id) }));
    if (editing?.id === id) {
      setEditing(null);
      setError('');
    }
    setRemoving(null);
  }

  return <div className="work-page">
    <PageHeader title={words.title} description={kind === 'event' ? 'Veja provas, prazos e eventos em uma agenda mensal.' : undefined} />
    <Card><form key={editing?.id ?? 'new'} className="work-form" onSubmit={save}>
      <Input label={`Título da ${kind === 'event' ? 'atividade' : words.singular}`} name="title" defaultValue={editing?.title} maxLength={140} required error={error || undefined} onChange={() => setError('')} />
      <Input label={words.date} name="date" type="date" defaultValue={editing?.date} required={kind !== 'task'} />
      <label className="orbit-field"><span className="orbit-label">Disciplina</span><select className="orbit-input" name="subjectId" defaultValue={editing?.subjectId ?? ''}>
        <option value="">Sem disciplina</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
      </select></label>
      <div className="work-actions"><Button type="submit">{editing ? 'Salvar alterações' : `Adicionar ${words.singular}`}</Button>
        {editing && <Button variant="ghost" onClick={() => { setEditing(null); setError(''); }}>Cancelar edição</Button>}
      </div>
    </form></Card>
    {kind === 'task' && <label className="orbit-field work-filter"><span className="orbit-label">Filtrar tarefas</span><select className="orbit-input" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Todas</option><option value="pending">Pendentes</option><option value="done">Concluídas</option></select></label>}
    {kind === 'event' && <Input className="work-filter" label="Mês da agenda" type="month" value={period} onChange={event => setPeriod(event.target.value)} />}
    {items.length === 0 && <p className="work-empty">{kind === 'event' ? 'Nenhum compromisso neste mês.' : `Nenhum item em ${words.plural}.`}</p>}
    <ul className="work-list">{items.map(item => {
      const subject = subjects.find(subject => subject.id === item.subjectId);
      return <li key={item.id}><Card className="work-row">
        <div><strong>{item.title}</strong><p>{[kind === 'event' ? entryLabels[item.kind].singular : '', displayDate(item.date), subject?.name, item.done ? 'Concluída' : ''].filter(Boolean).join(' · ')}</p></div>
        {kind === item.kind && (removing === item.id ? <div className="work-confirm"><p>Remover este item?</p><div className="work-actions"><Button size="sm" onClick={() => remove(item.id)}>Confirmar remoção</Button><Button variant="ghost" size="sm" onClick={() => setRemoving(null)}>Cancelar</Button></div></div> :
          <div className="work-actions">
            {kind === 'task' && <Button size="sm" onClick={() => updateWorkspace(current => ({ ...current, entries: current.entries.map(entry => entry.id === item.id ? { ...entry, done: !entry.done } : entry) }))}>{item.done ? 'Reabrir' : 'Concluir'}</Button>}
            <Button size="sm" variant="secondary" onClick={() => { setEditing(item); setError(''); }}>Editar</Button>
            <Button size="sm" variant="ghost" onClick={() => setRemoving(item.id)}>Remover</Button>
          </div>)}
      </Card></li>;
    })}</ul>
  </div>;
}
