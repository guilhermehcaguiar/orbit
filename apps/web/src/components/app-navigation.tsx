'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Ellipsis, GraduationCap } from 'lucide-react';
import { Sidebar, SidebarItem } from '@orbit/design-system';
import { navigationIcons } from '@/constants/icons';
import { mobileNavigation, navigation } from '@/mocks/navigation';
import { Brand } from './brand';
import { PreviewDialog } from './preview-dialog';

export function AppNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const renderItem = (item: typeof navigation[number]) => {
    const Icon = navigationIcons[item.icon];
    return <SidebarItem key={item.href} href={item.href} icon={<Icon size={19} />} active={pathname === item.href}>{item.label}</SidebarItem>;
  };
  return <>
    <Sidebar brand={<Brand href="/app" />} footer={<div className="sidebar-note"><GraduationCap size={21} aria-hidden="true" /><p>Mais foco hoje.<br /><span>Um futuro maior.</span></p></div>}>
      <p className="nav-label">Seu workspace</p>
      {navigation.filter(item => item.group === 'study').map(renderItem)}
      <div className="sidebar-account">{navigation.filter(item => item.group === 'account').map(renderItem)}</div>
    </Sidebar>
    <nav className="mobile-navigation" aria-label="Navegação mobile">
      {mobileNavigation.map(href => {
        const item = navigation.find(entry => entry.href === href);
        if (!item) return null;
        const Icon = navigationIcons[item.icon];
        return <Link href={href} key={href} aria-current={pathname === href ? 'page' : undefined} className={pathname === href ? 'is-active' : undefined}><Icon size={21} aria-hidden="true" /><span>{item.label}</span></Link>;
      })}
      <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen} className={navigation.some(item => item.href === pathname && !mobileNavigation.includes(item.href)) ? 'is-active' : undefined}><Ellipsis size={21} aria-hidden="true" /><span>Mais</span></button>
    </nav>
    <PreviewDialog id="mobile-menu" open={moreOpen} onClose={() => setMoreOpen(false)} title="Seu Orbit" description="Tudo o que você precisa, em um só lugar."><nav aria-label="Todos os módulos" className="more-navigation">{navigation.map(item => {
      const Icon = navigationIcons[item.icon];
      return <SidebarItem key={item.href} href={item.href} active={pathname === item.href} icon={<Icon size={19} />} onClick={() => setMoreOpen(false)}>{item.label}</SidebarItem>;
    })}</nav></PreviewDialog>
  </>;
}
