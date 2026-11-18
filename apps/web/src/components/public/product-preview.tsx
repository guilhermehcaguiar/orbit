'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ClipboardList, ListTodo, Orbit, Timer } from 'lucide-react';

const views = [
  { name: 'Agenda', icon: CalendarDays, href: '/calendar' },
  { name: 'Tarefas', icon: ListTodo, href: '/tasks' },
  { name: 'Pomodoro', icon: Timer, href: '/pomodoro' },
];
const agenda = [
  { day: 'Seg', date: '18', label: 'Lista de limites', subject: 'Cálculo I', icon: ListTodo, tone: 'teal' },
  { day: 'Qua', date: '20', label: 'Prova de mecânica', subject: 'Física', icon: ClipboardList, tone: 'gold' },
  { day: 'Sex', date: '22', label: 'Revisão em grupo', subject: 'Programação', icon: CalendarDays, tone: 'violet' },
];
const tasks = ['Resolver lista de limites', 'Revisar anotações', 'Separar exercícios da prova'];

export function ProductPreview() {
  const base = useId();
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState([false, true, false]);
  const count = checked.filter(Boolean).length;

  return <div className="landing-stage">
    <div className="landing-orbit" aria-hidden="true"><span /><i /></div>
    <section className="product-window" aria-label="Demonstração do workspace Orbit">
      <div className="product-toolbar">
        <span className="product-brand"><Orbit size={20} aria-hidden="true" /> Orbit</span>
        <span className="product-demo">Demonstração</span>
      </div>
      <div className="product-tabs" role="tablist" aria-label="Telas da demonstração" onKeyDown={event => {
        const moves: Record<string, number> = { ArrowLeft: (active + views.length - 1) % views.length, ArrowRight: (active + 1) % views.length, Home: 0, End: views.length - 1 };
        const next = moves[event.key];
        if (next === undefined) return;
        event.preventDefault();
        setActive(next);
        document.getElementById(`${base}-tab-${next}`)?.focus();
      }}>
        {views.map(({ name, icon: Icon }, index) => <button type="button" key={name} id={`${base}-tab-${index}`}
          role="tab" aria-selected={index === active} aria-controls={`${base}-panel-${index}`} tabIndex={index === active ? 0 : -1} onClick={() => setActive(index)}>
          <Icon size={16} aria-hidden="true" /> {name}
        </button>)}
      </div>
      {views.map((view, index) => <div className="product-tab-panel" key={view.name} id={`${base}-panel-${index}`}
        role="tabpanel" aria-labelledby={`${base}-tab-${index}`} hidden={active !== index}>
        {index === active && <>
          {index === 0 && <ul className="demo-agenda">
            {agenda.map(({ day, date, label, subject, icon: Icon, tone }) => <li key={label}>
              <span className="demo-date"><small>{day}</small><strong>{date}</strong></span>
              <span className="demo-entry-icon" data-tone={tone}><Icon size={17} aria-hidden="true" /></span>
              <span className="demo-entry-text"><strong>{label}</strong><small>{subject}</small></span>
            </li>)}
          </ul>}
          {index === 1 && <div className="demo-tasks">
            <p role="status">{count} de {tasks.length} tarefas concluídas</p>
            {tasks.map((task, taskIndex) => <label key={task} className="demo-check">
              <input type="checkbox" checked={checked[taskIndex]} onChange={event => {
                const value = event.currentTarget.checked;
                setChecked(previous => previous.map((item, index) => index === taskIndex ? value : item));
              }} /><span>{task}</span>
            </label>)}
          </div>}
          {index === 2 && <div className="demo-focus"><div className="demo-clock"><Timer size={17} aria-hidden="true" /><strong>25:00</strong><span>Foco</span></div><div><strong>25 min de estudo</strong><p>5 min de pausa</p></div></div>}
          <div className="product-tab-foot"><Link href={view.href}>Abrir {view.name.toLowerCase()} no Orbit <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </>}
      </div>)}
    </section>
  </div>;
}
