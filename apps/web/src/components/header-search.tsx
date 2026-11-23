'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { RecordLink } from '@/features/workspace/presentation';
import { ArrowUpRight, Search } from 'lucide-react';
import { SearchInput } from '@orbit/design-system';
import { navigation } from '@/features/workspace/navigation';
import { useWorkspace } from '@/features/workspace/store';
import { entryHref, entryLabels } from '@/features/workspace/records';

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function HeaderSearch() {
  const { subjects, entries } = useWorkspace();
  const summaryId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const term = normalize(query);
  const searchable = [
    ...navigation.map(item => ({ id: item.href, title: item.label, href: item.href, type: 'Tela' })),
    ...subjects.map(item => ({ id: item.id, title: item.name, href: `/subjects#editar-${item.id}`, type: 'Disciplina' })),
    ...entries.map(item => ({ id: item.id, title: item.title, href: entryHref(item), type: entryLabels[item.kind] })),
  ];
  const matches = searchable.filter(item => normalize(item.title).includes(term)).slice(0, 7);
  const showResults = focused && Boolean(term);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      root.current?.querySelector('input')?.focus();
      setFocused(true);
    };
    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const input = root.current?.querySelector('input');
    if (event.key === 'Escape' && showResults) {
      event.preventDefault();
      input?.focus();
      setFocused(false);
      return;
    }
    if (!showResults || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const targets = Array.from(root.current?.querySelectorAll<HTMLAnchorElement>('.search-results a') ?? []);
    if (!targets.length) return;
    event.preventDefault();
    const index = targets.findIndex(target => target === document.activeElement);
    if (index < 0) targets[event.key === 'ArrowDown' ? 0 : targets.length - 1]?.focus();
    else (targets[index + (event.key === 'ArrowDown' ? 1 : -1)] ?? input)?.focus();
  }

  return <div ref={root} className="header-search" onFocus={() => setFocused(true)} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }} onKeyDown={onKeyDown}>
    <SearchInput value={query} onChange={event => { setQuery(event.target.value); setFocused(true); }} aria-describedby={showResults ? summaryId : undefined} aria-keyshortcuts="Control+K Meta+K" />
    <span className="search-hint" aria-hidden="true"><kbd>Ctrl</kbd><kbd>K</kbd></span>
    {showResults && <div className="header-popover search-results">
      <p id={summaryId} role="status">{matches.length ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}` : 'Nenhum resultado encontrado'}</p>
      {matches.length ? <ul>{matches.map(item => <li key={item.id}><RecordLink href={item.href} onClick={() => { setQuery(''); setFocused(false); }}>
        <span><strong>{item.title}</strong><small>{item.type}</small></span><ArrowUpRight size={16} aria-hidden="true" />
      </RecordLink></li>)}</ul> : <p className="search-empty"><Search size={16} aria-hidden="true" /> Busque pelo nome de uma matéria, tarefa ou tela.</p>}
    </div>}
  </div>;
}
