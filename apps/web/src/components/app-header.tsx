'use client';

import { Bell, Circle } from 'lucide-react';
import { Avatar, Badge, IconButton, ThemeToggle, Tooltip } from '@orbit/design-system';
import { dashboard } from '@/mocks/dashboard';
import { Brand } from './brand';
import { HeaderSearch } from './header-search';

export function AppHeader() {
  return <header className="app-header"><div className="mobile-brand"><Brand /></div><div className="header-location"><Circle size={7} fill="currentColor" aria-hidden="true" /><span>Seu espaço de estudos</span></div>
    <div className="header-actions"><HeaderSearch /><ThemeToggle /><div className="notifications-control">
      <Tooltip content="Notificações"><IconButton label="Notificações" popoverTarget="notifications"><Bell size={20} /><span className="notification-dot" /></IconButton></Tooltip>
      <div id="notifications" popover="auto" className="notifications-popover"><h2>Notificações <Badge tone="primary">{dashboard.notifications.length}</Badge></h2><ul>{dashboard.notifications.map(item => <li key={item.id}><strong>{item.title}</strong><p>{item.description}</p></li>)}</ul></div>
    </div><Tooltip content={dashboard.user.name}><button className="avatar-control" type="button" popoverTarget="profile" aria-label="Perfil de Ana Silva"><Avatar name={dashboard.user.name} /><span className="avatar-status" /></button></Tooltip>
      <div id="profile" popover="auto" className="notifications-popover profile-popover"><Avatar name={dashboard.user.name} /><h2>{dashboard.user.name}</h2><p>{dashboard.user.description}</p></div>
    </div>
  </header>;
}
