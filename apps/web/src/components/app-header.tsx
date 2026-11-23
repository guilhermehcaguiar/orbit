'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { Avatar, Badge, IconButton, ThemeToggle, Tooltip } from '@orbit/design-system';
import { byDate, displayDate, useLocalDate, useWorkspace } from '@/features/workspace/store';
import { navigation } from '@/features/workspace/navigation';
import { entryHref } from '@/features/workspace/records';
import { RecordLink } from '@/features/workspace/presentation';
import { Brand } from './brand';
import { HeaderSearch } from './header-search';

export function AppHeader() {
  const { name, entries } = useWorkspace();
  const pathname = usePathname();
  const page = pathname === '/onboarding' ? 'Primeiros passos' : navigation.find(item => item.href === pathname)?.label ?? 'Hoje';
  const today = useLocalDate();
  const reminders = today ? entries.filter(item => item.date && item.date <= today && !item.done && item.kind !== 'event').sort(byDate).slice(0, 5) : [];
  return <header className="app-header">
    <div className="mobile-brand"><Brand /></div>
    <div className="header-location"><span>Workspace</span><ChevronRight size={14} aria-hidden="true" /><strong>{page}</strong></div>
    <div className="header-actions"><HeaderSearch /><ThemeToggle />
      <div className="notifications-control">
        <Tooltip content="Lembretes"><IconButton label="Lembretes" popoverTarget="notifications"><Bell size={20} />{reminders.length > 0 && <span className="notification-dot" />}</IconButton></Tooltip>
        <div id="notifications" popover="auto" className="notifications-popover">
          <h2>Lembretes <Badge tone="primary">{reminders.length}</Badge></h2>
          {reminders.length ? <ul>{reminders.map(item => <li key={item.id}><RecordLink className="ws-text-link" href={entryHref(item)}>{item.title}</RecordLink><p>{displayDate(item.date)}</p></li>)}</ul> : <p>Nenhum prazo vencido ou previsto para hoje.</p>}
        </div>
      </div>
      <Tooltip content="Configurações"><Link className="avatar-control" href="/settings" aria-label="Configurações"><Avatar name={name || 'Estudante'} /></Link></Tooltip>
    </div>
  </header>;
}
