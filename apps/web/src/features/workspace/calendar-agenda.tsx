'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { RecordLink } from './presentation';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock, ListTodo } from 'lucide-react';
import { addDays, type Workspace } from '@orbit/contracts';
import { Button, IconButton } from '@orbit/design-system';
import { agendaOn, agendaRange, entryLabels } from './records';
import { MonthGrid } from './month-grid';
import { displayDate } from './store';

const labels = { ...entryLabels, class: 'Aula', study: 'Estudo' };
const icons = { task: ListTodo, exam: ClipboardList, event: CalendarDays, class: Clock, study: BookOpen };
const views = { day: 'Dia', week: 'Semana', month: 'Mês' };

function subscribeToMobile(listener: () => void) {
  const query = matchMedia('(max-width: 720px)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

export function CalendarAgenda({ workspace, today, date, month, onDate, onMonth, onCreate }: {
  workspace: Workspace; today: string; date: string; month: string;
  onDate: (date: string) => void; onMonth: (month: string) => void; onCreate: (date: string) => void;
}) {
  const [view, setView] = useState<keyof typeof views | null>(null);
  useEffect(() => {
    let frame: number | undefined;
    const followDate = () => {
      const match = /^#dia-(\d{4}-\d{2}-\d{2})$/.exec(window.location.hash);
      if (!match?.[1] || !Number.isFinite(Date.parse(match[1]))) return;
      const day = match[1];
      window.cancelAnimationFrame(frame ?? 0);
      frame = window.requestAnimationFrame(() => {
        onDate(day);
        setView('day');
      });
    };
    followDate();
    window.addEventListener('hashchange', followDate);
    return () => {
      window.cancelAnimationFrame(frame ?? 0);
      window.removeEventListener('hashchange', followDate);
    };
  }, [onDate]);
  const mobile = useSyncExternalStore(subscribeToMobile, () => matchMedia('(max-width: 720px)').matches, () => false);
  const selectedView = view ?? (mobile ? 'day' : 'month');
  const activeDate = date || today;

  if (!today) return null;
  const displayedMonth = date ? date.slice(0, 7) : month;
  const first = `${displayedMonth}-01`;
  const monthStart = new Date(`${first}T12:00:00`);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const days = selectedView === 'month' && !date
    ? agendaRange(workspace, first, daysInMonth, true) : agendaRange(workspace, activeDate, selectedView === 'week' ? 7 : 1, true);
  const populated = days.filter(item => item.items.length);
  const heading = selectedView === 'month' && !date ? 'Compromissos do mês' :
    selectedView === 'week' ? `${displayDate(activeDate)} a ${displayDate(addDays(activeDate, 6))}` : displayDate(activeDate);
  const step = selectedView === 'week' ? 7 : 1;

  return <>
    <div className="agenda-toolbar">
      <div className="ws-segment" aria-label="Visualização do calendário" role="group">
        {Object.entries(views).map(([key, label]) => <button key={key} type="button" aria-pressed={selectedView === key}
          onClick={() => setView(key as keyof typeof views)}>{label}</button>)}
      </div>
      {selectedView !== 'month' && <div className="month-controls">
        <IconButton label={step === 7 ? 'Semana anterior' : 'Dia anterior'} onClick={() => onDate(addDays(activeDate, -step))}><ChevronLeft size={18} aria-hidden="true" /></IconButton>
        <Button size="sm" variant="secondary" onClick={() => onDate(today)}>Hoje</Button>
        <IconButton label={step === 7 ? 'Próxima semana' : 'Próximo dia'} onClick={() => onDate(addDays(activeDate, step))}><ChevronRight size={18} aria-hidden="true" /></IconButton>
      </div>}
    </div>
    <div className={selectedView === 'month' ? 'calendar-layout' : undefined}>
      {selectedView === 'month' && <MonthGrid month={displayedMonth} today={today} selection={date}
        countFor={day => agendaOn(workspace, day, true).length} onMonth={onMonth}
        onDate={day => onDate(date === day ? '' : day)} />}
      <section className="ws-panel settings-info agenda-timeline" aria-label="Compromissos do calendário">
        <div className="ws-section-head"><h2 aria-live="polite">{heading}</h2>
          {selectedView === 'month' && date && <Button variant="ghost" size="sm" onClick={() => onDate('')}>Ver mês inteiro</Button>}
        </div>
        {populated.length ? populated.map(day => <section key={day.date} className="agenda-day">
          {(selectedView === 'week' || (selectedView === 'month' && !date)) && <h3>{displayDate(day.date)}</h3>}
          <ul className="entry-list">{day.items.map(item => {
            const Icon = icons[item.type];
            return <li className={`entry-row agenda-entry${'done' in item && item.done ? ' entry-done' : ''}`} key={`${item.type}:${item.id}`}>
              <span className="entry-icon" data-kind={item.type}><Icon size={17} aria-hidden="true" /></span>
              <div className="entry-copy"><RecordLink className="ws-text-link" href={item.href}>{item.title}</RecordLink>
                <p>{[labels[item.type], item.time ? `${item.time}${item.end ? `–${item.end}` : ''}` : 'Sem horário', item.detail, 'done' in item && item.done && 'Concluída'].filter(Boolean).join(' · ')}</p>
              </div>
            </li>;
          })}</ul>
        </section>) : <div className="agenda-empty"><p>Nenhum compromisso neste período.</p><Button variant="secondary" size="sm" onClick={() => onCreate(selectedView === 'month' ? date : activeDate)}>Adicionar evento</Button></div>}
      </section>
    </div>
  </>;
}
