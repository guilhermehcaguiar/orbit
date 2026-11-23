'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, IconButton } from '@orbit/design-system';
import { localDate } from './store';

export function MonthGrid({ month, today, selection, countFor, onMonth, onDate }: {
  month: string;
  today: string;
  selection: string;
  countFor: (date: string) => number;
  onMonth: (month: string) => void;
  onDate: (date: string) => void;
}) {
  if (!month) return <section className="ws-panel month-grid" aria-label="Calendário mensal" aria-busy="true" />;

  const first = new Date(`${month}-01T12:00:00`);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const label = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  function move(delta: number) {
    const next = new Date(first);
    next.setMonth(first.getMonth() + delta);
    onMonth(localDate(next).slice(0, 7));
  }

  return <section className="ws-panel month-grid" aria-label="Calendário mensal">
    <header className="month-head">
      <h2 aria-live="polite">{label}</h2>
      <div className="month-controls">
        <IconButton label="Mês anterior" onClick={() => move(-1)}><ChevronLeft size={18} aria-hidden="true" /></IconButton>
        <Button variant="secondary" size="sm" disabled={!today} onClick={() => { onMonth(today.slice(0, 7)); onDate(today); }}>Hoje</Button>
        <IconButton label="Próximo mês" onClick={() => move(1)}><ChevronRight size={18} aria-hidden="true" /></IconButton>
      </div>
    </header>
    <div className="month-days">
      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <span className="month-weekday" key={day}>{day}</span>)}
      {Array.from({ length: cells }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1 || day > daysInMonth) return <span className="month-outside" key={index} aria-hidden="true" />;
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const count = countFor(date);
        const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        return <button className="month-day" key={date} type="button" aria-current={date === today ? 'date' : undefined} aria-pressed={date === selection} aria-label={`${dateLabel}, ${count} ${count === 1 ? 'compromisso' : 'compromissos'}`} onClick={() => onDate(date)}>
          <span>{day}</span>
          {count > 0 && <span className="month-mark" aria-hidden="true">{count}</span>}
        </button>;
      })}
    </div>
  </section>;
}
