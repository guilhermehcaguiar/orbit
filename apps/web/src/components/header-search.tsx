'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SearchInput } from '@orbit/design-system';
import { navigation } from '@/features/workspace/navigation';
import { useWorkspace } from '@/features/workspace/store';

export function HeaderSearch() {
  const { subjects, entries } = useWorkspace();
  const searchable = [
    ...navigation.map(item => ({ id: item.href, title: item.label, href: item.href })),
    ...subjects.map(item => ({ id: item.id, title: item.name, href: '/subjects' })),
    ...entries.map(item => ({ id: item.id, title: item.title, href: item.kind === 'task' ? '/tasks' : item.kind === 'exam' ? '/exams' : '/calendar' })),
  ];
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const matches = searchable.filter(item => item.title.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(query.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase())).slice(0, 6);
  const showResults = focused && query.trim().length > 0;
  return <div className="header-search" onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onKeyDown={event => { if (event.key === 'Escape') { setQuery(''); setFocused(false); } }}>
    <SearchInput value={query} onChange={event => { setQuery(event.target.value); setFocused(true); }} aria-describedby={showResults ? 'search-summary' : undefined} />
    <span className="search-hint" aria-hidden="true">Buscar</span>
    {showResults && <div className="header-popover search-results"><p id="search-summary" role="status">{matches.length ? `${matches.length} resultados` : 'Nenhum resultado encontrado'}</p><ul>{matches.map(item => <li key={item.id}><Link href={item.href} onClick={() => { setQuery(''); setFocused(false); }}><span>{item.title}</span><ArrowUpRight size={16} aria-hidden="true" /></Link></li>)}</ul></div>}
  </div>;
}
