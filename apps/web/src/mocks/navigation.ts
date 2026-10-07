import type { NavigationIcon } from '@/constants/icons';

export interface NavigationEntry { label: string; href: string; icon: NavigationIcon; group: 'study' | 'account' }
export const navigation: NavigationEntry[] = [
  { label: 'Início', href: '/app', icon: 'home', group: 'study' },
  { label: 'Calendário', href: '/calendar', icon: 'calendar', group: 'study' },
  { label: 'Disciplinas', href: '/subjects', icon: 'subjects', group: 'study' },
  { label: 'Tarefas', href: '/tasks', icon: 'tasks', group: 'study' },
  { label: 'Provas', href: '/exams', icon: 'exams', group: 'study' },
  { label: 'Pomodoro', href: '/pomodoro', icon: 'pomodoro', group: 'study' },
  { label: 'IA', href: '/ai', icon: 'ai', group: 'study' },
  { label: 'Estatísticas', href: '/statistics', icon: 'statistics', group: 'account' },
  { label: 'Configurações', href: '/settings', icon: 'settings', group: 'account' },
];
export const mobileNavigation = ['/app', '/calendar', '/tasks', '/subjects'];
